# Copyright 2024 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

ARG BASE_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/base-containers

FROM ${BASE_REGISTRY_URI}/alpine:3.17_alpha20220715-edge

ARG UID=246

# fetch dnsmasq
RUN apk update \
    && apk upgrade --no-cache \
    && apk --no-cache add dnsmasq libcap
#configure dnsmasq
RUN mkdir -p /etc/default/
RUN echo -e "ENABLED=1\nIGNORE_RESOLVCONF=yes" > /etc/default/dnsmasq
COPY dockerfiles/dns/dnsmasq.conf /etc/dnsmasq.conf

# We run dnsmasq as the moblab user by passing in --user and --group
# params to the command in startup.sh.
RUN addgroup --gid $UID moblab && adduser --ingroup moblab \
    --uid $UID --disabled-password --gecos "" moblab

RUN mkdir -p /var/log
RUN chown -R moblab:moblab /var/log

CMD ["/usr/sbin/dnsmasq", "--no-daemon", "-u", "moblab", "-g", "moblab", "-H", "/etc/dut_hosts/hosts", "--log-debug"]
