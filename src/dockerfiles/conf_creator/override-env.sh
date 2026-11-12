#!/usr/bin/env sh
set -eu

envsubst '${DOCKER_GCS_IMAGE_STORAGE_SERVER}' < /root/nginx.conf > /mnt/conf/nginx/nginx.conf
chmod 1777 /mnt/conf/ate
cp -f /root/al_ate_mh_device_config /root/ate_labserver_entrypoint.sh /root/ate_tradefed_entrypoint.sh /mnt/conf/ate/
exec "$@"
