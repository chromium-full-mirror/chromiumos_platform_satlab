# Copyright 2023 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab
ARG LABEL=autopush
ARG COMMON_CORE_LABEL=autopush
ARG COMMON_CORE_URI=gcr.io/chromeos-partner-moblab
ARG GCLOUD_CLI_VER=594.0.0

###########################################################

FROM ${COMMON_CORE_URI}/chromite:${COMMON_CORE_LABEL} AS chromite

###########################################################

FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:${GCLOUD_CLI_VER}-alpine AS gcloud

###########################################################

# Set default OAuth Scopes
ENV OAUTH_SCOPES "https://www.googleapis.com/auth/userinfo.email"

FROM ${REGISTRY_URI}/satlab_remote_access:${LABEL}

# Copy gcloud CLI from the official Alpine image (which ships musl-compiled
# bundled Python 3.14) because satlab_remote_access is based on Alpine 3.13
# (musl 1.2.2 + Python 3.8.15), where the standard tarball's glibc bundled
# Python 3.14 fails with missing symbols (dladdr1, qsort_r). Symlink
# bundledpythonunix -> bundledpythonunixmusl because /etc/alpine-release is
# absent in the base image (so gcloud's wrapper skips bundledpythonunixmusl) and
# callers strip environment variables (so ENV CLOUDSDK_PYTHON would not apply).
COPY --from=gcloud /google-cloud-sdk /gcloud/google-cloud-sdk
RUN ln -s bundledpythonunixmusl /gcloud/google-cloud-sdk/platform/bundledpythonunix
ENV PATH="${PATH}:/gcloud/google-cloud-sdk/bin"

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
RUN /root/depot_tools/cipd ensure -ensure-file /cipd/spec -root /cipd -ensure-file-output /cipd/cipd_package_info.txt && \
    # The only non-hidden files in /root/download are executables managed by CIPD. Make them executable by users.
    /bin/chmod ugo+rx /cipd/satlabrpcserver

# Add links to executables stored in /cipd.
RUN ln -s -t /usr/local/bin /cipd/satlabrpcserver
# Debugging line for dev - override the file with locally built version
# COPY dockerfiles/satlab-rpcserver/satlabrpcserver /usr/local/bin

# get the testing_rsa key for sshing into the DUTs
RUN mkdir -p /home/moblab/.ssh
COPY --from=chromite --chmod=600 /chromite/ssh_keys/* /home/moblab/.ssh/

RUN mkdir /var/log/moblab
RUN touch /var/log/moblab/remote_access.log

EXPOSE 6003
ENTRYPOINT ["/init"]
CMD ["satlabrpcserver"]
# For testing purposes
# CMD ["tail", "-f", "/dev/null"]
