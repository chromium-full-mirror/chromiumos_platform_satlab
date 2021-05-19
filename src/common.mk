# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

REGISTRY_URI=${REGISTRY}
EXTRA_ARGS+= --build-arg REGISTRY_URI=${REGISTRY_URI}
EXTRA_ARGS+= --build-arg LABEL=${LABEL}
EXTRA_ARGS+= --build-arg SSH_PORT="${SSH_PORT}"


all:	satlab-remote-access

satlab-remote-access: export DOCKER_BUILDKIT=1
satlab-remote-access:
	docker build ${EXTRA_ARGS} -t ${REGISTRY_URI}/satlab_remote_access:${LABEL} \
		-f dockerfiles/satlab_remote_access/Dockerfile ..
	docker push ${REGISTRY_URI}/satlab_remote_access:${LABEL}