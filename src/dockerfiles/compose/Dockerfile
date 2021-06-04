# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers

FROM ${BASE_REGISTRY_URI}/docker/compose:alpine-1.27.4

ARG REGISTRY_URI=gcr.io/chromeos-partner-moblab
ARG SATLAB_REGISTRY_URI=gcr.io/satlab-images
ARG LABEL=autopush
ARG SSH_PORT

# If the args left empty the script will leave the values in .env as is.
ARG DRONE_VER
ARG GSA_SERVER_VER
ARG NGINX_VER

ENV LABEL="${LABEL}"
ENV REGISTRY_URI="${REGISTRY_URI}"
ENV SATLAB_REGISTRY_URI="${SATLAB_REGISTRY_URI}"
ENV SSH_PORT="${SSH_PORT}"

WORKDIR /
COPY docker-compose.yaml .
COPY .env main.env
COPY compose_startup.sh .
RUN chmod u+x compose_startup.sh

COPY override_service_version.sh .
RUN chmod u+x override_service_version.sh

RUN ./override_service_version.sh SATLAB_DRONE ${DRONE_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh GSA_SERVER ${GSA_SERVER_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh NGINX ${NGINX_VER:-${BUILD_VERSION}}

ENTRYPOINT ["/compose_startup.sh"]

# Test the config for syntax errors
RUN docker-compose config
