# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG REGISTRY_URI=gcr.io/chromeos-partner-moblab
ARG COMMON_CORE_LABEL=autopush

###########################################################

FROM ${REGISTRY_URI}/remote_access:${COMMON_CORE_LABEL}

###########################################################

# All paths to the host environment are relative paths.
# All paths to the host environment are relative to the project root.
# All paths that are intended to be interpreted inside the container are absolute.

# Add external package dependencies and add local tools to /usr/local/bin.
WORKDIR /
RUN /sbin/apk add git
COPY src/dockerfiles/satlab_remote_access/tools/satlab_setup /usr/local/bin
COPY src/dockerfiles/satlab_remote_access/tools/get_dns_hosts /usr/local/bin
COPY src/dockerfiles/satlab_remote_access/tools/restart_dns_process /usr/local/bin
COPY src/dockerfiles/satlab_remote_access/tools/shivas_ensure_rack /usr/local/bin
RUN /bin/chmod uog+rx /usr/local/bin/satlab_setup
RUN /bin/chmod uog+rx /usr/local/bin/get_dns_hosts
RUN /bin/chmod uog+rx /usr/local/bin/restart_dns_process
RUN /bin/chmod uog+rx /usr/local/bin/shivas_ensure_rack

# Set up CIPD and run CIPD ensure.
WORKDIR /root
RUN # increment this number to bypass the cache: 2
RUN /usr/bin/git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
COPY src/dockerfiles/satlab_remote_access/cipd/spec /root/spec
RUN /root/depot_tools/cipd ensure -ensure-file spec -root /root/download -ensure-file-output /root/cipd_package_info.txt
# Add links to executables stored in /root/download
RUN ln -s -t /usr/local/bin /root/download/*

WORKDIR /var/log
