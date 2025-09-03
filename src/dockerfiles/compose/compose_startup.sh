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
echo "Enviroment variable BUILD_VERSION is ${BUILD_VERSION}"
echo "Enviroment variable SFP_REGISTRY_URI is ${SFP_REGISTRY_URI}"

echo "Merging main.env and override.env into .env"
egrep -oh '^[^#]+' main.env override.env | egrep . | awk -F= '{a[$1]=$2}END{for(i in a) print i "=" a[i]}' > .env

echo "Command is ${1}"

# Stop any old style docker containers that are named default_
/usr/local/bin/docker stop $(/usr/local/bin/docker ps --filter name="default_" --format "{{.ID}}")

USER_SETTINGS=/home/satlab/shared/satlab-user-settings.json

# start_private_containers start the containters that required docker client authenticated.
function start_private_containers () {
  # This is in case the device was not shutdown cleanly there might be
  # restarted containers (restarted by dockerd)
  docker-compose down -t 1
  docker-compose -f ./docker-compose.watchtower.yaml down -t 1

  docker-compose up -d conf_creator

  docker rm -f downloader
  docker rm -f partner_testing_rsa
  docker volume rm default_partner_testing_rsa
  docker-compose up -d partner_testing_rsa

  export WATCHTOWER_MONITOR_ONLY=$(jq '.autoupdate |= not | .autoupdate' $USER_SETTINGS)

  # Can be removed after chromeos changes from crrev/c/6032619 will be on stable channel
  if [ -z "$WATCHTOWER_MONITOR_ONLY" ]; then
    export WATCHTOWER_MONITOR_ONLY=true
  fi

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

  STABLE_VERSION_SETUP_FILE=/create_recovery_version_dir.sh
  if [[ -f "${STABLE_VERSION_SETUP_FILE}" ]]; then
    source ${STABLE_VERSION_SETUP_FILE}
  fi

  docker-compose up -d drone openssh_server nginx logrotate

  if [[ ${UFS_NAMESPACE:-os} != "os-partner" ]]; then
    export OS_VERSION=$(echo "$(get_host_os_version)"  | grep '^version:' | cut -d '"' -f 2)
    export TRACK=$(echo "$(get_host_os_version)"  | grep '^track:' | cut -d '"' -f 2 | sed 's/\\n//g')

    docker-compose up -d opentelemetry-collector
  fi

  # set permission for ssp volume to create lxc containers
  # b/190623503
  docker exec drone chmod 0777 /usr/local/autotest/containers/ssp_volume
  # Set permission for device profile created and maintanse by repair
  # tasks.
  docker exec drone chmod 777 /var/servod/profile/
  # Ensure correct permissions for the service_accounts directory.
  docker exec drone chmod 777 /creds/service_accounts/
  # Remove old CFT docker test image.
  docker exec drone docker image prune -a -f
}

if [ "${1}" == "down" ]
then
  docker-compose down -t 1
  docker-compose rm -s -f

  docker-compose -f ./docker-compose.watchtower.yaml down -t 1
else
  # Set the environement from satlab-config.json before any container start.
  ENV_SETUP_FILE=/export_env_file.sh
  if [[ -f "${ENV_SETUP_FILE}" ]]; then
    source ${ENV_SETUP_FILE}
  fi

  # A place to mount a tls volume even though certs were not provided.
  # Required for backward compatibility.
  export DOCKER_COMPOSE_CERT_PATH=${DOCKER_CERT_PATH:-/etc/docker/certs}
  docker volume create --name=docker_tls

  if [ -n "${DOCKER_CERT_PATH}" ]; then
    export DOCKER_DRONE_CERT_PATH=/home/chromeos-test/.docker/certs
  fi


  docker rm -f satlab_rpcserver
  docker-compose up -d satlab-ui

  # Connect satlab_remote_access container to satlab network
  # so that user can use the local dns serice to resolve
  # DUT hostname and allow SSH to DUTs
  docker network connect --ip 192.168.100.50 default_satlab satlab_remote_access

  SERVICE_ACCOUNT_KEY=/home/satlab/keys/pubsub-key-do-not-delete.json
  # Check if the service acout key is NOT an existing non-empty file.
  if ! [ -s "${SERVICE_ACCOUNT_KEY}" ]
  then
    echo "Service account key missing, you need service account key to access Satlab images."
  else
    cat ${SERVICE_ACCOUNT_KEY} | docker login -u _json_key --password-stdin ${SFP_REGISTRY_URI}
    if [ "$?" -ne 0 ]; then
      echo "Failed to authenticate docker, please try again!"
    else
      echo "Authenticated docker client successfully; starting the rest of the containers"
      start_private_containers
      docker-compose up -d satlab-ui bols
    fi
  fi

  # Use labels to filter out containers that shouldn't be pruned.
  docker system prune --filter "label!=skip.while.pruning.docker.system=yes" -f

  # Prune unused/dangling images.
  docker image prune -a -f

  # docker-compose logs with follow will keep the compose container running.
  docker-compose logs -f -t
fi
