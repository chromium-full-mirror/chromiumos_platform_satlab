# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab
ARG COMMON_CORE_LABEL=autopush
ARG COMMON_CORE_URI=gcr.io/chromeos-partner-moblab
###########################################################

FROM ${COMMON_CORE_URI}/remote_access:${COMMON_CORE_LABEL}

###########################################################

# All paths to the host environment are relative paths.
# All paths to the host environment are relative to the project root.
# All paths that are intended to be interpreted inside the container are absolute.

# Add external package dependencies and add local tools to /usr/local/bin.
WORKDIR /
RUN /sbin/apk add git

COPY dockerfiles/satlab_remote_access/tools/satlab_setup /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/get_dns_hosts /usr/local/bin

# Set up CIPD and run CIPD ensure.
WORKDIR /
RUN /bin/mkdir -p /cipd && /bin/chmod a+x /cipd && /bin/chmod a+r /cipd
RUN # increment this number to bypass the cache: 3
RUN /usr/bin/git -C /root clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
COPY dockerfiles/satlab_remote_access/cipd/spec /cipd/spec
RUN /root/depot_tools/cipd ensure -ensure-file /cipd/spec -root /cipd -ensure-file-output /cipd/cipd_package_info.txt
# The only non-hidden files in /root/download are executables managed by CIPD. Make them executable by users.
RUN /bin/chmod ugo+rx /cipd/shivas /cipd/satlab
# Add links to executables stored in /cipd.
RUN ln -s -t /usr/local/bin /cipd/shivas /cipd/satlab

# Make everything in /usr/local/bin executable for good measure.
RUN /bin/chmod ugo+rx /usr/local/bin/*

WORKDIR /var/log