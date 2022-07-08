#!/usr/bin/env bash
# Copyright 2022 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

### BEGIN INIT INFO
# Provides:           satlab-setup
# Required-Start:     docker
# Required-Stop:      docker
# Short-Description:  Create Satlab compose to setup Satlab containers.
# Description:        Create Satlab compose to setup Satlab containers.
### END INIT INFO

# Required to be installed bridge-utils.
# sudo apt install bridge-utils

# Single script to prepare Satlab
# Function to ask user to provide data.
ask(){
   local filename=$1
   local message=$2
   local name2
   if [ -f "$filename" ]; then name="$(cat <"$filename")";else name=""; fi
   1>&2 echo -n "$message ($name): "
   read -r name2
   if [ -z "$name2" ]; then 1>&2 echo "Using $name as default value" ; else name="$name2" ;fi
   echo $name > "$filename"
   echo $name
}
##################################################################
# Collect some data from user
DRONE_HOSTNAME=$(ask "satlab-server-name" "Please specify Satlab name") # Name that is set for the drone.
EXT_IFACE=$(ask "satlab-external-port" "Please specify internet port")  # Interface that is connected to the internet
INT_IFACE=$(ask "satlab-ethernet-port" "Please specify ethernet port")  # Interface that is connected to DUT
DHCP_LOCAL_FILE=/etc/dnsmasq.conf
HOSTS_FILE=/etc/hosts
echo "Local file used for DHCP server: ${DHCP_LOCAL_FILE}"
echo "Name used for drone: ${DRONE_HOSTNAME}"
echo "Local file used for DNS server: ${HOSTS_FILE}"
##################################################################
# Do not edit below this line.
##################################################################
DHCPD_IFACE=qemubr0
SERVER_ADDRESS=192.168.231.1
SERVER_NETMASK=255.255.255.0

sudo brctl addbr ${DHCPD_IFACE} || true
sudo brctl setfd ${DHCPD_IFACE} 0 || true
sudo ifconfig ${DHCPD_IFACE} allmulti
sudo ifconfig ${INT_IFACE} allmulti
sudo ifconfig ${DHCPD_IFACE} ${SERVER_ADDRESS} netmask ${SERVER_NETMASK} up
sudo brctl addif ${DHCPD_IFACE} ${INT_IFACE}
# Creatign local file for user which will be used for DHCP.
# By this file user can set mapping between Mac and IP addressess.
# File is outside to keep outside the docker and persist per server.
if [ -s "${DHCP_LOCAL_FILE}" ]; then
   sudo chmod 666 "${DHCP_LOCAL_FILE}"
   echo "DHCP config file is present."
else
    sudo touch "${DHCP_LOCAL_FILE}"
    sudo chmod 777 "${DHCP_LOCAL_FILE}"
    echo "dhcp-range=192.168.231.10,192.168.231.250,400h" > "${DHCP_LOCAL_FILE}"
    echo "DHCP config file created!"
fi
############################################################
# Docker images used in the script
DHCP_DOCKER_IMAGE=gcr.io/chromeos-partner-moblab/moblab-dhcp:satlab_server
COMPOSE_DOCKER_IMAGE=us-docker.pkg.dev/chromeos-partner-moblab/satlab/satlab-compose:otabek
# TODO: look to the option to simplify update logic for the image.
CLOUD_SDK_IMAGE=google/cloud-sdk:372.0.0-slim
############################################################
# You can't have --rm and --restart on a docker run command.
# However this means that on a non clean shutdown the dhcp container is
# restarted, this causes internal/external network detection issues and
# put the moblab in a bad state.
# On boot get rid of any prior containers and make sure we have the latest
# dhcp container.
docker stop dhcp || true
docker rm dhcp || true
docker pull ${DHCP_DOCKER_IMAGE}
docker run --name dhcp -d -v "${DHCP_LOCAL_FILE}":/etc/dnsmasq.conf:rw --restart always --cap-add=NET_ADMIN --network host ${DHCP_DOCKER_IMAGE} --interface ${DHCPD_IFACE} --bind-interfaces --log-dhcp

#Set sharing between interfaces.
sudo iptables -w -t nat -A POSTROUTING -o ${EXT_IFACE} -j MASQUERADE
sudo iptables -w -A FORWARD -i ${EXT_IFACE} -o ${DHCPD_IFACE} -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -w -A FORWARD -i ${DHCPD_IFACE} -o ${EXT_IFACE} -j ACCEPT
sudo ifconfig ${INT_IFACE} up
sudo iptables -w -P FORWARD ACCEPT
##################################################################
# Download service account file for compose.
# System is expected that this volume will be exist.
# TODO: Avoid authorization by verifying the downloaded key that is not expired.
echo "Create volume 'satlab_keys' to keep Satlab key."
docker volume create --name=satlab_keys
SATLAB_SERIVCE_ACCOUNT=satlab-prototype@chromeos-service-accounts-dev.iam.gserviceaccount.com
VOLUME_KEYS_FOLDER=/home/satlab/keys/
GCLOUD="docker run --rm -ti -a stdout -v satlab_keys:${VOLUME_KEYS_FOLDER} -v gcloud:/root/.config/gcloud ${CLOUD_SDK_IMAGE}"
echo "Try to autorize user!"
${GCLOUD} gcloud auth login
if [ "$?" -ne 0 ]; then
    echo "User fail to autorize!"
    exit 1
fi
echo "User autorized!"
echo "Try to download service account key!"
${GCLOUD} gsutil cp gs://satlab-keys/satlab_service_account.json ${VOLUME_KEYS_FOLDER}
if [ "$?" -ne 0 ]; then
    echo "Failed to download service account key, please try again!"
    exit 1
fi
echo "Satlab service account key downloaded!"
# Start compose for Satlab
echo "Starting preparation the host for usage"
sudo docker rm compose --force || true
sudo docker pull ${COMPOSE_DOCKER_IMAGE} || true
sudo docker run -d --restart unless-stopped --name compose \
    --label=com.centurylinklabs.watchtower.lifecycle.pre-update="docker-compose down" \
    --label=com.centurylinklabs.watchtower.stop-signal=KILL \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v docker_config:/root/.docker \
    -v satlab_keys:${VOLUME_KEYS_FOLDER} \
    -v cache_server:/home/satlab/cache_server \
    -e DRONE_HOSTNAME=${DRONE_HOSTNAME} \
    -e LABEL=${COMPOSE_LABEL} \
    -e DRONE_AGENT_DUT_CAPACITY=60 \
    -e HOSTS_FILE=${HOSTS_FILE} \
    --add-host dockerhost:172.17.0.1 \
    ${COMPOSE_DOCKER_IMAGE} up
