#!/bin/sh
# Copyright 2024 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

# Check for Satlab updates using the Python script.
update_available=$(exec is_update_available)

# Display a message if an update is available.
if $update_available; then
  echo "***********************************************"
  echo "**          Satlab Update Available           **"
  echo "**  Reboot your device to install the update  **"
  echo "***********************************************"
fi