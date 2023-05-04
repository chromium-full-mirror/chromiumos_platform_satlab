# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

all:

install:
	install -m 0644 -t ${DESTDIR}etc/init -D boot-logging-satlab.conf
	install -m 0644 -t ${DESTDIR}etc/init -D satlab-compose-down.conf
	install -m 0644 -t ${DESTDIR}etc/init -D satlab-compose-up.conf
	install -m 0644 -t ${DESTDIR}etc/init -D satlab-remote-access.conf
	install -m 0644 -t ${DESTDIR}usr/lib/tmpfiles.d -D satlab-env.conf
