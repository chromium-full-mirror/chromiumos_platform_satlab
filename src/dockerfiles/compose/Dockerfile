# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers
ARG REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab
ARG COMMON_CORE_LABEL=autopush
ARG COMMON_CORE_URI=gcr.io/chromeos-partner-moblab
###########################################################

# TODO(prasadv): Read tag from Moblab Labels
FROM ${COMMON_CORE_URI}/moblab_common:${COMMON_CORE_LABEL} as common

###########################################################

FROM ${BASE_REGISTRY_URI}/docker/compose:alpine-1.27.4

RUN apk add --no-cache --upgrade \
    alpine-sdk \
    cmake \
    gcc \
    jq \
    libffi-dev \
    libstdc++ \
    linux-headers \
    openssh-client \
    openssl-dev \
    py-pip \
    python3 \
    python3-dev \
    py3-setuptools \
    zlib-dev

# If the args left empty the script will leave the values in .env as is.
ARG CONF_CREATOR_VER
ARG SATLAB_DRONE_VER
ARG DOWNLOADER_VER
ARG NGINX_VER
ARG SATLAB_SECRETS_VER
ARG OPENSSH_SERVER_VER

# These are re-defined because ARG has a different scope
# before and after the FROM instruction.
ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers
ARG REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab
ARG SATLAB_REGISTRY_URI=gcr.io/satlab-images
ARG SFP_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab-for-partners
ARG LABEL=autopush
# Append --include-stopped --revive-stopped to let watchtower monitor
# stopped containers (eg: conf_creator, satlab_secrets).
ARG WATCHTOWER_CMD="--include-stopped --revive-stopped --interval 3600 --monitor-only"
ARG COMMON_CORE_LABEL=autopush
ARG COMMON_CORE_URI=gcr.io/chromeos-partner-moblab`
ARG BUILD_VERSION
ENV LABEL="${LABEL}"
ENV COMMON_CORE_LABEL="${COMMON_CORE_LABEL}"
ENV COMMON_CORE_URI="${COMMON_CORE_URI}"
ENV REGISTRY_URI="${REGISTRY_URI}"
ENV WATCHTOWER_CMD="${WATCHTOWER_CMD}"
ENV SATLAB_REGISTRY_URI="${SATLAB_REGISTRY_URI}"
ENV SFP_REGISTRY_URI="${SFP_REGISTRY_URI}"
ENV BUILD_VERSION="${BUILD_VERSION}"

COPY dockerfiles/compose/requirements.txt ./
RUN pip3 install --upgrade pip && pip3 install --no-cache-dir -r requirements.txt

WORKDIR /install
COPY --from=common /install/* .
RUN pip install *.whl
RUN rm -rf /install

WORKDIR /
COPY dockerfiles/satlab_remote_access/tools/host_command.py /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/get_host_identifier /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/get_host_ip /usr/local/bin
RUN chmod uog+rx /usr/local/bin/get_host_identifier
RUN chmod uog+rx /usr/local/bin/get_host_ip

COPY dockerfiles/compose/docker-compose.yaml .
COPY dockerfiles/compose/docker-compose.watchtower.yaml .
COPY dockerfiles/compose/.env main.env
COPY dockerfiles/compose/compose_startup.sh .
RUN chmod u+x compose_startup.sh

COPY dockerfiles/compose/override_service_version.sh .
RUN chmod u+x override_service_version.sh

RUN ./override_service_version.sh CONF_CREATOR ${CONF_CREATOR_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh DOWNLOADER ${DOWNLOADER_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh NGINX ${NGINX_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh SATLAB_DRONE ${SATLAB_DRONE_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh SATLAB_SECRETS ${SATLAB_SECRETS_VER:-${BUILD_VERSION}}
RUN ./override_service_version.sh OPENSSH_SERVER ${OPENSSH_SERVER_VER:-${BUILD_VERSION}}

# Add routine to check export environment variable from .env file
COPY tools/export_env_file.sh /
RUN chmod 777 /export_env_file.sh

ENTRYPOINT ["/compose_startup.sh"]

# Test the config for syntax errors
RUN docker-compose config
