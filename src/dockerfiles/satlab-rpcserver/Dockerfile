# Copyright 2023 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers
ARG REGISTRY_URI=gcr.io/chromeos-partner-moblab
ARG COMMON_CORE_LABEL=autopush
ARG COMMON_CORE_URI=gcr.io/chromeos-partner-moblab
###########################################################

FROM ${COMMON_CORE_URI}/chromite:${COMMON_CORE_LABEL} as chromite

###########################################################

FROM ${BASE_REGISTRY_URI}/debian:buster-slim

###########################################################

# Add external package dependencies and add local tools to /usr/local/bin.
WORKDIR /
RUN apt-get -yq update && apt-get install --no-install-recommends -yq \
    ca-certificates \
    curl \
    fping \
    git \
    wget

# most of the commands necessary for the functioning of satlab_remote_access are also required
# by satlab-rpc-server container
COPY dockerfiles/satlab_remote_access/tools/host_command.py \
    dockerfiles/satlab_remote_access/tools/force-update-cipd \
    dockerfiles/satlab_remote_access/tools/get_dns_hosts \
    dockerfiles/satlab_remote_access/tools/get_host_identifier \
    dockerfiles/satlab_remote_access/tools/get_host_ip \
    dockerfiles/satlab_remote_access/tools/get_host_os_version \
    dockerfiles/satlab_remote_access/tools/satlab_setup \
    dockerfiles/satlab_remote_access/tools/update_system \
    dockerfiles/satlab_remote_access/tools/update_satlab \
    dockerfiles/satlab_remote_access/tools/get_disk_info \
    dockerfiles/satlab_remote_access/tools/docker-system-summary.py /usr/local/bin/

# NOTE about cipd:
# There are two cipd executables. One is located at /root/depot_tools/cipd and the
# other is located at /cipd/cipd.
# The one located at /root/depot_tools/cipd is the version of cipd that is used to
# bootstrap the cipd repository. Its existence is an implementation detail.
# The instance of cipd located at /cipd/cipd is intended to be available on the path
# so that the shivas and satlab tools can update themselves. Self-updating works by
# executing a cipd command.

# Set up CIPD and run CIPD ensure.
WORKDIR /
RUN /bin/mkdir -p /cipd && /bin/chmod a+x /cipd && /bin/chmod a+r /cipd
RUN git -C /root clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
COPY dockerfiles/satlab-rpcserver/cipd/spec /cipd/spec
RUN /root/depot_tools/cipd ensure -ensure-file /cipd/spec -root /cipd -ensure-file-output /cipd/cipd_package_info.txt

RUN /bin/chmod ugo+rx /cipd/satlabrpcserver
# Add links to executables stored in /cipd.
RUN ln -s -t /usr/local/bin /cipd/satlabrpcserver
# Add symlink to cipd executable itself.
RUN ln -s -t /usr/local/bin /cipd/cipd

# get the testing_rsa key for sshing into the DUTs
RUN mkdir -p /home/moblab/.ssh
COPY --from=chromite /chromite/ssh_keys/* /home/moblab/.ssh/
RUN chmod -R 600 /home/moblab/.ssh/*

# should this move to yaml file or somewhere else
ENV GOOGLE_APPLICATION_CREDENTIALS="/home/satlab/keys/pubsub-key-do-not-delete.json"

EXPOSE 6003
CMD ["satlabrpcserver"]
# CMD ["tail", "-f", "/dev/null"] # for testing purposes
