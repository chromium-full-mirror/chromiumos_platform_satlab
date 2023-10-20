# Copyright 2023 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab
ARG REGISTRY_URI=gcr.io/chromeos-partner-moblab
ARG COMMON_CORE_LABEL=autopush
ARG COMMON_CORE_URI=gcr.io/chromeos-partner-moblab

###########################################################

FROM ${COMMON_CORE_URI}/chromite:${COMMON_CORE_LABEL} as chromite

###########################################################

FROM ${REGISTRY_URI}/satlab_remote_access:${COMMON_CORE_LABEL}
# Set up CIPD and run CIPD ensure.
WORKDIR /
RUN apk add --no-cache --upgrade \
    ca-certificates \
    curl \
    fping \
    git \
    wget
RUN /bin/mkdir -p /cipd && /bin/chmod a+x /cipd && /bin/chmod a+r /cipd
RUN # increment this number to bypass the cache: 4
COPY dockerfiles/satlab-rpcserver/cipd/spec/ /cipd/spec
RUN /root/depot_tools/cipd ensure -ensure-file /cipd/spec -root /cipd -ensure-file-output /cipd/cipd_package_info.txt
# The only non-hidden files in /root/download are executables managed by CIPD. Make them executable by users.
RUN /bin/chmod ugo+rx /cipd/shivas /cipd/satlab /cipd/satlabrpcserver

# Add links to executables stored in /cipd.
RUN ln -s -t /usr/local/bin /cipd/satlabrpcserver

# Make everything in /usr/local/bin executable for good measure.
RUN /bin/chmod ugo+rx /usr/local/bin/*

# get the testing_rsa key for sshing into the DUTs

RUN mkdir -p /home/moblab/.ssh
COPY --from=chromite /chromite/ssh_keys/* /home/moblab/.ssh/
RUN chmod -R 600 /home/moblab/.ssh/*

RUN mkdir /var/log/moblab
RUN touch /var/log/moblab/remote_access.log

EXPOSE 6003
CMD ["satlabrpcserver"]
# CMD ["tail", "-f", "/dev/null"] # for testing purposes
