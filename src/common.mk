# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

REGISTRY_URI := ${REGISTRY}
EXTRA_ARGS+= --build-arg REGISTRY_URI="${REGISTRY_URI}"
EXTRA_ARGS+= --build-arg SATLAB_REGISTRY_URI="${SATLAB_REGISTRY}"
EXTRA_ARGS+= --build-arg LABEL="${LABEL}"
EXTRA_ARGS+= --build-arg COMMON_CORE_LABEL="${COMMON_CORE_LABEL}"
EXTRA_ARGS+= --build-arg COMMON_CORE_URI="${COMMON_CORE_REGISTRY}"
EXTRA_ARGS+= --build-arg BUILD_VERSION="${BUILD_VERSION}"

all:	compose \
		satlab-remote-access

# Build and push satlab_remote_access container.
satlab-remote-access: export DOCKER_BUILDKIT := 1
satlab-remote-access:
	docker build ${EXTRA_ARGS} -t ${REGISTRY_URI}/satlab_remote_access:${LABEL} \
		-f dockerfiles/satlab_remote_access/Dockerfile .
	docker push ${REGISTRY_URI}/satlab_remote_access:${LABEL}

# Build satlab remote access locally only
local-satlab-remote-access:
	docker build ${EXTRA_ARGS} -t local-satlab-remote-access:${LABEL} \
		-f dockerfiles/satlab_remote_access/Dockerfile .

compose: export DOCKER_BUILDKIT := 1
compose:
	docker build ${EXTRA_ARGS} --label "version=${BUILD_VERSION}" \
		-t ${REGISTRY_URI}/satlab-compose:${LABEL} \
		-f dockerfiles/compose/Dockerfile .
	docker push ${REGISTRY_URI}/satlab-compose:${LABEL}
