#!/bin/bash
# Copyright 2023 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

# This scripts creates a recovery versions directory on startup
# to store local stable versions for use with partner deploy and repair

RECOVERY_VERSIONS_DIR=/home/satlab/keys/recovery_versions


if [[ ! -f "${RECOVERY_VERSIONS_DIR}" ]]; then
  # Create directory to store recovery versions
  mkdir -p ${RECOVERY_VERSIONS_DIR}
  chmod 777 ${RECOVERY_VERSIONS_DIR}
fi
