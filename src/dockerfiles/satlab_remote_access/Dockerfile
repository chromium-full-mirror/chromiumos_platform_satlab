# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG REGISTRY_URI=gcr.io/chromeos-partner-moblab
ARG LABEL=autopush

###########################################################

FROM ${REGISTRY_URI}/remote_access:autopush

###########################################################

COPY src/dockerfiles/satlab_remote_access/satlab_setup /usr/local/bin
RUN chmod uog+x /usr/local/bin/satlab_setup
WORKDIR /var/log