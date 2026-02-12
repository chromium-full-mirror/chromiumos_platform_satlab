# Copyright 2025 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

gcloud auth activate-service-account --key-file=/home/satlab/keys/pubsub-key-do-not-delete.json
gcloud config set project ${GCP_PROJECT}
gcloud config set core/account ${SERIVCE_ACCOUNT}
gcloud compute config-ssh --quiet

SSH_TARGET="internal-testing-controller-1.${GCP_ZONE}.${GCP_PROJECT}"

echo "Starting autossh for port forwarding to ${SSH_TARGET}..."
autossh -4 -M${SSH_MONITOR_PORT} -v \
    -L 0.0.0.0:8900:localhost:8000 \
    -L 0.0.0.0:8906:localhost:8006 \
    -L 0.0.0.0:8908:localhost:8008 \
    -L 0.0.0.0:7031:localhost:7031 \
    -R ${WORKER_GRPC_PORT}:ats:${WORKER_GRPC_PORT} \
    -o "ServerAliveInterval=240" \
    -o "StrictHostKeychecking=no" \
    -N "${SSH_TARGET}" || { echo "Autossh failed to start."; exit 1; }