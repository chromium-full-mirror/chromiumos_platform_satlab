#!/bin/sh
# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
set -x

# This script assumes an $LABEL is set of autopush/beta/release or a custom label
# for development

echo "Enviroment variable LABEL is ${LABEL}"
echo "Enviroment variable COMMON_CORE_LABEL is ${COMMON_CORE_LABEL}"
echo "Enviroment variable COMMON_CORE_URI is ${COMMON_CORE_URI}"
echo "Enviroment variable REGISTRY_URI is ${REGISTRY_URI}"
echo "Enviroment variable SATLAB_REGISTRY_URI is ${SATLAB_REGISTRY_URI}"
echo "Enviroment variable BUILD_VERSION is ${BUILD_VERSION}"

echo "Merging main.env and override.env into .env"
egrep -oh '^[^#]+' main.env override.env | egrep . | awk -F= '{a[$1]=$2}END{for(i in a) print i "=" a[i]}' > .env

echo "Command is ${1}"

# Stop any old style docker containers that are named default_
/usr/local/bin/docker stop $(/usr/local/bin/docker ps --filter name="default_" --format "{{.ID}}")

# TODO(prasadv): Find an alternative to support user suppiled service_account key.
SERVICE_ACCOUNT_KEY=/home/satlab/keys/satlab_service_account.json
if [ -s "${SERVICE_ACCOUNT_KEY}" ]
then
  cat ${SERVICE_ACCOUNT_KEY} | docker login -u _json_key --password-stdin https://gcr.io/satlab-images/
  if [ "$?" -ne 0 ]; then
    echo "Failed to authenticate docker, please try again!"
    exit
  fi
else
   echo "Service account key missing, you need service account key to access Satlab images."
   exit
fi

if [ "${1}" == "down" ]
then
    docker-compose down -t 1
    docker-compose rm -s -f

    docker-compose -f ./docker-compose.watchtower.yaml down -t 1
else
    # This is in case the device was not shutdown cleanly there might be
    # restarted containers (restarted by dockerd)
    docker-compose down -t 1
    docker-compose -f ./docker-compose.watchtower.yaml down -t 1

    docker-compose pull conf_creator
    docker-compose up -d conf_creator
    docker-compose pull satlab_secrets
    docker-compose up -d satlab_secrets
    docker-compose pull artifacts_downloader_secret
    docker-compose up -d artifacts_downloader_secret

    docker-compose -f ./docker-compose.watchtower.yaml pull
    docker-compose -f ./docker-compose.watchtower.yaml up -d

    # if DRONE_HOSTNAME is not set via upstart. Create hostname from product ID.
    if [[ -z "${DRONE_HOSTNAME}" ]]; then
      DRONE_HOSTNAME="satlab"
      MACADDR=$(echo "$(get_host_identifier)" | awk '{print tolower($0)}')
      DRONE_HOSTNAME="${DRONE_HOSTNAME}-${MACADDR}"
      echo "Drone Name: ${DRONE_HOSTNAME}"
    fi
    export DRONE_HOSTNAME

    # Get the DHB IP address so that it can be exposed as swarming dimension.
    SATLAB_HOST_IP=$(echo "$(get_host_ip)")
    echo "Satlab Host IP: ${SATLAB_HOST_IP}"
    # Export ENV only when the ip address is found.
    if [[ -n "${SATLAB_HOST_IP}" ]]; then
      export SATLAB_HOST_IP
    fi

    docker-compose pull dns
    docker-compose up -d dns
    docker-compose pull drone gsa_server openssh_server nginx
    docker-compose up -d drone gsa_server openssh_server nginx

    # set permission for ssp volume to create lxc containers
    # b/190623503
    docker exec drone chmod 0777 /usr/local/autotest/containers/ssp_volume
    # Drone uses chromeos-test user for running tasks, need this to set
    # access to chromeos-test user to access docker.sock in order to launch
    # servod.
    docker exec drone chmod 666 /var/run/docker.sock
    docker exec drone chmod 666 /var/docker.sock
    # Set permission for device profile created and maintanse by repair
    # tasks.
    docker exec drone chmod 777 /var/servod/profile/

    # Connect satlab_remote_access container to satlab network
    # so that user can use the local dns serice to resolve
    # DUT hostname and allow SSH to DUTs
    docker network connect default_satlab satlab_remote_access

    docker-compose pull
    docker-compose up -d
    # Use labels to filter out containers that shouldn't be pruned.
    docker system prune --filter "label!=skip.while.pruning.docker.system=yes" -f
    docker-compose logs -f
fi