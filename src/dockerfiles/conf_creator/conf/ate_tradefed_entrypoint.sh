#!/bin/bash
# Copyright 2026 The ChromiumOS Authors
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

set -e

{ cat ~/passwd 2>/dev/null || true; } | sudo -S sh -e -c '
  mount -o remount,exec /tmp/cloud-ate-shared
  mount -o remount,exec /tradefed
'

exec /tradefed/tradefed_host_up.sh "$@"
