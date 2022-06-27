#!/usr/bin/env bash
# Copyright 2022 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

### BEGIN INIT INFO
# Provides:           satlab-utils
# Required-Start:     docker
# Required-Stop:      docker
# Short-Description:  Restart DHCP container to re-upload the config.
# Description:        Restart DHCP container to re-upload the config.
### END INIT INFO

##################################################################
EXT_IFACE=`cat < satlab-external-port`  # Interface that is connected to the internet
INT_IFACE=`cat < satlab-ethernet-port`  # Interface that is connected to DUT
DHCP_LOCAL_FILE=/etc/dnsmasq.conf
echo "Local file used for DHCP server: ${DHCP_LOCAL_FILE}"
##################################################################
# Docker images used in the script
DHCP_DOCKER_IMAGE=gcr.io/chromeos-partner-moblab/moblab-dhcp:satlab_server
############################################################
# You can't have --rm and --restart on a docker run command.
# However this means that on a non clean shutdown the dhcp container is
# restarted, this causes internal/external network detection issues and
# put the moblab in a bad state.
# On boot get rid of any prior containers and make sure we have the latest
# dhcp container.
docker stop dhcp || true
docker rm dhcp || true
docker pull ${DHCP_DOCKER_IMAGE}
docker run --name dhcp -d -v ${DHCP_LOCAL_FILE}:/etc/dnsmasq.conf:rw --restart always --cap-add=NET_ADMIN --network host ${DHCP_DOCKER_IMAGE} --interface ${DHCPD_IFACE} --bind-interfaces --log-dhcp

#Set sharing between interfaces.
sudo ifconfig ${INT_IFACE} up
sudo iptables -w -P FORWARD ACCEPT
