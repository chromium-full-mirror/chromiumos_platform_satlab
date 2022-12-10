#!/bin/bash
# Copyright 2022 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

### BEGIN INIT INFO
# Provides:           satlab-setup
# Required-Start:     docker
# Required-Stop:      docker
# Short-Description:  Interactive edit Satlab DNS mapping file.
# Description:        Interactive edit Satlab DNS mapping file.
### END INIT INFO

# Open DNS mapping file for interactive editing by user.
docker exec -it  dns vi /etc/dut_hosts/hosts
docker exec dns /usr/bin/killall -HUP dnsmasq
