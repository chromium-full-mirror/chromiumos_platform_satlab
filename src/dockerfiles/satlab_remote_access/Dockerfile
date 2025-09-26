# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers
ARG COMMON_CORE_LABEL=autopush
ARG COMMON_CORE_URI=gcr.io/chromeos-partner-moblab
###########################################################

FROM ${BASE_REGISTRY_URI}/alpine/git as adb

ARG PLATFORM_TOOLS_VER=35.0.1
ARG PLATFORM_TOOLS_ZIP=platform-tools_r${PLATFORM_TOOLS_VER}-linux.zip
RUN wget https://dl.google.com/android/repository/${PLATFORM_TOOLS_ZIP}
RUN unzip ${PLATFORM_TOOLS_ZIP} -d /adb
RUN git clone --depth 1 --no-checkout --filter=blob:none https://chromium.googlesource.com/chromiumos/third_party/autotest.git
RUN git -C autotest checkout main -- server/cros/tradefed/tradefed_constants.py
RUN apk add python3
ENV PYTHONPATH=autotest/server/cros/tradefed
RUN python3 -c "from tradefed_constants import PRIVATE_KEY;print(PRIVATE_KEY)" > /adb/arc_adbkey

###########################################################

FROM ${COMMON_CORE_URI}/moblab_common:${COMMON_CORE_LABEL} as common

###########################################################

FROM ${BASE_REGISTRY_URI}/docker:latest as docker

###########################################################

FROM ${COMMON_CORE_URI}/moblab-autotest-base:${COMMON_CORE_LABEL} as autotest

###########################################################

FROM ${BASE_REGISTRY_URI}/linuxserver/openssh-server:latest

COPY dockerfiles/satlab_remote_access/testing_rsa.pub /
COPY --from=docker --chmod=755 /usr/local/bin/docker /usr/local/bin/docker

COPY dockerfiles/satlab_remote_access/pip_upgrade_requirements.txt \
    dockerfiles/satlab_remote_access/requirements.txt ./

RUN mkdir -p /home/moblab
RUN mkdir -p /home/moblab/.ssh
COPY --from=autotest --chmod=600 /chromite/ssh_keys/* /home/moblab/.ssh/

COPY --from=common /install/* ./

RUN apk add --no-cache --upgrade \
    alpine-sdk \
    cmake \
    gcc \
    libffi-dev \
    libstdc++ \
    linux-headers \
    openssh-client \
    openssl-dev \
    py3-setuptools \
    py-pip \
    python3 \
    python3-dev \
    zlib-dev && \
    pip3 install --no-cache-dir --require-hashes -r pip_upgrade_requirements.txt && \
    pip3 install --no-cache-dir --require-hashes -r requirements.txt && \
    pip install --no-deps --no-index *.whl && \
    rm -rf /install && \
    apk del \
    alpine-sdk \
    cmake \
    gcc \
    libffi-dev \
    linux-headers \
    openssl-dev \
    py3-setuptools \
    python3-dev \
    zlib-dev

RUN echo "chown \"\$USER_NAME\":\"\$USER_NAME\" /home/\"\$USER_NAME\"" >> /etc/cont-init.d/10-adduser
RUN echo "export HOME=/home/\"\$USER_NAME\"" >> /etc/cont-init.d/10-adduser
RUN echo "addgroup --gid 412 docker" >> /etc/cont-init.d/10-adduser
RUN echo "usermod -aG docker moblab" >> /etc/cont-init.d/10-adduser

COPY --chmod=744 dockerfiles/satlab_remote_access/fix_ping.sh /
WORKDIR /etc/services.d/fix_ping
COPY dockerfiles/satlab_remote_access/fix_ping.run ./run

COPY --chmod=755 tools/reboot \
     tools/factory_reset /usr/local/bin/

RUN curl -Lo /usr/local/bin/ctop https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 && \
    chmod +x /usr/local/bin/ctop

###########################################################

# All paths to the host environment are relative paths.
# All paths to the host environment are relative to the project root.
# In particular, paths to source files should begin with dockerfile/... NOT src/dockerfile/....
# All paths that are intended to be interpreted inside the container are absolute.

# Add external package dependencies and add local tools to /usr/local/bin.

# Set default OAuth Scopes
ENV OAUTH_SCOPES "https://www.googleapis.com/auth/userinfo.email"
COPY --chmod=777 dockerfiles/satlab_remote_access/tools/export_oauth.sh /etc/profile.d

WORKDIR /
RUN /sbin/apk add git

COPY --chmod=755 dockerfiles/satlab_remote_access/tools/host_command.py \
    dockerfiles/satlab_remote_access/tools/force-update-cipd \
    dockerfiles/satlab_remote_access/tools/get_dns_hosts \
    dockerfiles/satlab_remote_access/tools/get_host_identifier \
    dockerfiles/satlab_remote_access/tools/get_host_ip \
    dockerfiles/satlab_remote_access/tools/get_host_mac \
    dockerfiles/satlab_remote_access/tools/get_host_os_version \
    dockerfiles/satlab_remote_access/tools/is_update_available \
    dockerfiles/satlab_remote_access/tools/satlab_setup \
    dockerfiles/satlab_remote_access/tools/stop_ui \
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
RUN # increment this number to bypass the cache: 4
RUN /usr/bin/git -C /root clone --depth=1 https://chromium.googlesource.com/chromium/tools/depot_tools.git
COPY dockerfiles/satlab_remote_access/cipd/spec /cipd/spec
RUN /root/depot_tools/cipd ensure -ensure-file /cipd/spec -root /cipd -ensure-file-output /cipd/cipd_package_info.txt && \
    # The only non-hidden files in /root/download are executables managed by CIPD. Make them executable by users.
    /bin/chmod ugo+rx /cipd/shivas /cipd/satlab
# Add links to executables stored in /cipd.
RUN ln -s -t /usr/local/bin /cipd/shivas /cipd/satlab
# Add symlink to cipd executable itself.
RUN ln -s -t /usr/local/bin /cipd/cipd

WORKDIR /var/log

# Enable TCP port forwarding required for SSH tunneling.
RUN  sed -i s/AllowTcpForwarding\ no/AllowTcpForwarding\ yes/ /etc/ssh/sshd_config

# Change welcoming message.
COPY --chmod=666 dockerfiles/satlab_remote_access/tools/motd /etc/

# Add jq to get service account key id from json file.
RUN apk add --no-cache --upgrade jq

# Add routine to check export environment variable from .env file
COPY --chmod=777 tools/export_env_file.sh /etc/profile.d/

# Run storage monitoring check upon ssh
COPY --chmod=777 dockerfiles/satlab_remote_access/tools/wcache_check.sh /etc/profile.d/

# Add routine to export dockerd TLS variables
COPY --chmod=777 dockerfiles/satlab_remote_access/tools/tls.sh /etc/profile.d/

COPY --chmod=777 dockerfiles/satlab_remote_access/tools/check_for_update.sh /etc/profile.d/

# Add adb
RUN apk add --no-cache gcompat
ENV ADB_VENDOR_KEYS=/root/.android/arc_adbkey
COPY --from=adb /adb/platform-tools/adb /bin
COPY --from=adb /adb/arc_adbkey ${ADB_VENDOR_KEYS}

COPY --chmod=444 dockerfiles/satlab_remote_access/satlab-default-settings.json /
COPY --chmod=755 dockerfiles/satlab_remote_access/remote-access-startup.sh /

ENTRYPOINT ["/remote-access-startup.sh"]