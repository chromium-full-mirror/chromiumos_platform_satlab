# Copyright 2025 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV AUTOSSH_DEBUG=1
ENV AUTOSSH_LOGFILE=/var/log/autossh_log_file.log

RUN apt-get update && \
    apt-get install -y apt-transport-https ca-certificates gnupg curl && \
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
    apt-get update && \
    apt-get install -y google-cloud-sdk autossh

WORKDIR /
COPY --chmod=755 /dockerfiles/ats-controller-bridge/entrypoint.sh /

ENTRYPOINT ["sh", "/entrypoint.sh"]