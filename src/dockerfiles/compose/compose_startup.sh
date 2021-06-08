#!/bin/sh
# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
set -x

# This script assumes an $LABEL is set of autopush/beta/release or a custom label
# for development

echo "Enviroment variable LABEL is ${LABEL}"
echo "Enviroment variable REGISTRY_URI is ${REGISTRY_URI}"
echo "Enviroment variable SATLAB_REGISTRY_URI is ${SATLAB_REGISTRY_URI}"

DRONE_HOSTNAME="satlab"
MACADDR=$(echo "$(get_host_identifier)" | awk '{print tolower($0)}')
export DRONE_HOSTNAME="${DRONE_HOSTNAME}-${MACADDR}"
echo "Drone Name: ${DRONE_HOSTNAME}"

echo "Merging main.env and override.env into .env"
egrep -oh '^[^#]+' main.env override.env | egrep . | awk -F= '{a[$1]=$2}END{for(i in a) print i "=" a[i]}' > .env

echo "Command is ${1}"

# Stop any old style docker containers that are named default_
/usr/local/bin/docker stop $(/usr/local/bin/docker ps --filter name="default_" --format "{{.ID}}")

output=$(docker run --rm -v satlab_keys:/home/satlab/keys -a stdout -v gcloud:/root/.config/gcloud google/cloud-sdk:slim gcloud auth print-access-token)
echo $output | docker login -u oauth2accesstoken --password-stdin https://gcr.io/satlab-images/
if [ "$?" -ne 0 ]; then
  echo "Failed to authenticate docker, please try again!"
  exit
fi

if [ "${1}" == "down" ]
then
    docker-compose down -t 1
    docker-compose rm -s -f
else
    # This is in case the device was not shutdown cleanly there might be
    # restarted containers (restarted by dockerd)
    docker-compose down -t 1

    docker-compose pull dns drone gsa_server nginx
    docker-compose up -d dns drone gsa_server nginx

    docker-compose pull
    docker-compose up -d
    docker system prune -f
    docker-compose logs -f
fi