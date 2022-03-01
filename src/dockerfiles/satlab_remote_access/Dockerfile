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
# In particular, paths to source files should begin with dockerfile/... NOT src/dockerfile/....
# All paths that are intended to be interpreted inside the container are absolute.

# Add external package dependencies and add local tools to /usr/local/bin.
WORKDIR /
RUN /sbin/apk add git

COPY dockerfiles/satlab_remote_access/tools/host_command.py /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/get_host_identifier /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/update_system /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/update_satlab /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/satlab_setup /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/get_dns_hosts /usr/local/bin
COPY dockerfiles/satlab_remote_access/tools/force-update-cipd /usr/local/bin

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
RUN # increment this number to bypass the cache: 4
RUN /usr/bin/git -C /root clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
COPY dockerfiles/satlab_remote_access/cipd/spec /cipd/spec
RUN /root/depot_tools/cipd ensure -ensure-file /cipd/spec -root /cipd -ensure-file-output /cipd/cipd_package_info.txt
# The only non-hidden files in /root/download are executables managed by CIPD. Make them executable by users.
RUN /bin/chmod ugo+rx /cipd/shivas /cipd/satlab
# Add links to executables stored in /cipd.
RUN ln -s -t /usr/local/bin /cipd/shivas /cipd/satlab
# Add symlink to cipd executable itself.
RUN ln -s -t /usr/local/bin /cipd/cipd

# Make everything in /usr/local/bin executable for good measure.
RUN /bin/chmod ugo+rx /usr/local/bin/*

WORKDIR /var/log

# Enable TCP port forwarding required for SSH tunneling.
RUN  sed -i s/AllowTcpForwarding\ no/AllowTcpForwarding\ yes/ /etc/ssh/sshd_config

# Change welcoming message.
COPY dockerfiles/satlab_remote_access/tools/motd /etc/
RUN chmod 666 /etc/motd

# Add jq to get service account key id from json file.
RUN apk add --no-cache --upgrade jq

# Add routine to check service account key expiration
COPY dockerfiles/satlab_remote_access/tools/service_account_key_check.sh /etc/profile.d/
RUN chmod 777 /etc/profile.d/service_account_key_check.sh