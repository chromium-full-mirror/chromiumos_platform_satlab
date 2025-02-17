#!/bin/sh
# Copyright 2024 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
set -x

DEFAULT_SETTINGS=/satlab-default-settings.json
USER_SETTINGS=/home/satlab/shared/satlab-user-settings.json
touch $USER_SETTINGS
jq -s '.[0] + .[1]' $DEFAULT_SETTINGS $USER_SETTINGS > tmpfile && mv tmpfile $USER_SETTINGS
chmod 666 $USER_SETTINGS

/init "$@"