#!/bin/sh
# Copyright 2026 The ChromiumOS Authors
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
#
# Bootstrap script to download, extract, and run Satlab installation for Ubuntu.
#
# Basic usage: sudo sh bootstrap.sh
# To run remotely: wget -qO- https://goo.gle/satlab-install | base64 -d | sudo sh

set -eu

rm -rf /etc/satlab
mkdir -p /etc/satlab
wget -qO- "https://chromium.googlesource.com/chromiumos/platform/satlab/+archive/HEAD/os-dependent/ubuntu/scripts.tar.gz" \
  | tar -xz -C /etc/satlab

exec /etc/satlab/satlab_install "$@" </dev/tty
