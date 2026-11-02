#!/bin/bash
# Copyright 2026 The ChromiumOS Authors
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

set -e

if ! command -v socat >/dev/null 2>&1; then
  { cat ~/passwd 2>/dev/null || true; } | sudo -S sh -e -c '
    apt-get install -y --no-install-recommends socat || (
      apt-get update && apt-get install -y --no-install-recommends socat
    )
  '
fi

# Forward localhost:1485 (IPv4 and IPv6) to labservice:1485 for dt-converter
# and foil-provision running inside the shared ate-labserver network namespace.
socat TCP6-LISTEN:1485,ipv6only=0,reuseaddr,fork TCP4:labservice:1485 &

exec "$@"
