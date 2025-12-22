#!/bin/sh

egrep -oh '^[^#]+' main.env override.env | egrep . | awk -F= '{a[$1]=$2}END{for(i in a) print i "=" a[i]}' > .env

SERVICE_ACCOUNT_KEY=${VOLUME_KEYS_FOLDER}/pubsub-key-do-not-delete.json
# Check if the service account key is NOT an existing non-empty file.
if ! [ -s "${SERVICE_ACCOUNT_KEY}" ]
    then
    echo "Service account key missing, you need service account key to access Satlab images."
    else
    cat ${SERVICE_ACCOUNT_KEY} | docker login -u _json_key --password-stdin ${SFP_REGISTRY_URI}
    if [ "$?" -ne 0 ]; then
        echo "Failed to authenticate docker, please try again!"
    else
        echo "Authenticated docker client successfully; starting the rest of the containers"
        docker-compose -f ./docker-compose.yaml pull downloader drone logrotate nginx openssh_server satlab-ui
    fi
fi
