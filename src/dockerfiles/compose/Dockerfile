# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers
ARG REGISTRY_URI=gcr.io/chromeos-partner-moblab`
ARG COMMON_CORE_LABEL=autopush
###########################################################

# TODO(prasadv): Read tag from Moblab Labels
FROM ${REGISTRY_URI}/moblab_common:${COMMON_CORE_LABEL} as common

###########################################################

FROM ${BASE_REGISTRY_URI}/docker/compose:alpine-1.27.4

RUN apk add --no-cache --upgrade \
    openssh-client \
    python3 \
    python3-dev \
    py3-setuptools \
    alpine-sdk \
    linux-headers \
    gcc \
    cmake \
    openssl-dev \
    zlib-dev \
    libffi-dev \
    py-pip \
    libstdc++

# If the args left empty the script will leave the values in .env as is.
ARG DRONE_VER
ARG GSA_SERVER_VER
ARG NGINX_VER
ARG CONF_CREATOR_VER

# These are re-defined because ARG has a different scope
# before and after the FROM instruction.
ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers
ARG REGISTRY_URI=gcr.io/chromeos-partner-moblab`
ARG SATLAB_REGISTRY_URI=gcr.io/satlab-images
ARG LABEL=autopush
ARG WATCHTOWER_CMD="--interval 3600 --monitor-only"
ARG COMMON_CORE_LABEL=autopush
ARG BUILD_VERSION
ENV LABEL="${LABEL}"
ENV COMMON_CORE_LABEL="${COMMON_CORE_LABEL}"
ENV REGISTRY_URI="${REGISTRY_URI}"
ENV WATCHTOWER_CMD="${WATCHTOWER_CMD}"
ENV SATLAB_REGISTRY_URI="${SATLAB_REGISTRY_URI}"
ENV BUILD_VERSION="${BUILD_VERSION}"

COPY dockerfiles/compose/requirements.txt ./
RUN pip3 install --upgrade pip && pip3 install --no-cache-dir -r requirements.txt

WORKDIR /wheels
COPY --from=common /wheel/*py3* .
RUN pip install *.whl
RUN rm -rf /wheels

WORKDIR /
COPY dockerfiles/compose/docker-compose.yaml .
COPY dockerfiles/compose/docker-compose.watchtower.yaml .
COPY dockerfiles/compose/.env main.env
COPY dockerfiles/compose/compose_startup.sh .
RUN chmod u+x compose_startup.sh

COPY dockerfiles/compose/override_service_version.sh .
RUN chmod u+x override_service_version.sh

RUN ./override_service_version.sh SATLAB_DRONE ${DRONE_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh GSA_SERVER ${GSA_SERVER_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh NGINX ${NGINX_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh CONF_CREATOR ${CONF_CREATOR_VER:-${BUILD_VERSION}}

COPY tools/host_command.py /usr/local/bin
COPY tools/get_host_identifier /usr/local/bin
RUN chmod uog+rx /usr/local/bin/get_host_identifier


ENTRYPOINT ["/compose_startup.sh"]

# Test the config for syntax errors
RUN docker-compose config
