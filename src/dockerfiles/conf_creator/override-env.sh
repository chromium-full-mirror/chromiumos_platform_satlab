#!/usr/bin/env sh
set -eu

envsubst '${DOCKER_GCS_IMAGE_STORAGE_SERVER}' < /root/nginx.conf > /mnt/conf/nginx/nginx.conf
exec "$@"