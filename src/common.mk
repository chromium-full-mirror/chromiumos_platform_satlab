# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

REGISTRY_URI := ${REGISTRY}
SFP_REGISTRY_URI := ${SFP_REGISTRY_URI}
EXTRA_ARGS+= --no-cache
EXTRA_ARGS+= --build-arg REGISTRY_URI="${REGISTRY_URI}"
EXTRA_ARGS+= --build-arg LABEL="${LABEL}"
EXTRA_ARGS+= --build-arg COMMON_CORE_LABEL="${COMMON_CORE_LABEL}"
EXTRA_ARGS+= --build-arg COMMON_CORE_URI="${COMMON_CORE_REGISTRY}"
EXTRA_ARGS+= --build-arg SFP_REGISTRY_URI="${SFP_REGISTRY_URI}"
EXTRA_ARGS+= --build-arg BUILD_VERSION="${BUILD_VERSION}"
EXTRA_ARGS+= --build-arg WATCHTOWER_CMD="${WATCHTOWER_CMD}"

OVERRIDE_SERVICES := \
	CONF_CREATOR \
	ENVOY_PROXY \
	LOGROTATE \
	SATLAB_RPCSERVER \
	SATLAB_UI
${foreach service, ${OVERRIDE_SERVICES}, \
	${eval EXTRA_ARGS+= --build-arg ${service}_VER=${LABEL}}}

all:	compose \
		conf_creator \
		envoy \
		logrotate \
		satlab-remote-access \
		satlab-rpcserver \
		protoc \
		ui

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

satlab-rpcserver: export DOCKER_BUILDKIT := 1
satlab-rpcserver:
	docker build ${EXTRA_ARGS} --label "version=${BUILD_VERSION}" \
		-t ${REGISTRY_URI}/satlab-rpcserver:${LABEL} \
		-f dockerfiles/satlab-rpcserver/Dockerfile .
	docker push ${REGISTRY_URI}/satlab-rpcserver:${LABEL}

conf_creator:
	docker build ${EXTRA_ARGS} --label "version=${BUILD_VERSION}" \
		-t ${SFP_REGISTRY_URI}/conf_creator:${LABEL} \
		-f dockerfiles/conf_creator/Dockerfile .
	docker push ${SFP_REGISTRY_URI}/conf_creator:${LABEL}

envoy: export DOCKER_BUILDKIT := 1
envoy:
	docker build ${EXTRA_ARGS} -t ${REGISTRY_URI}/envoy-proxy:${LABEL} \
		-f dockerfiles/envoy/Dockerfile dockerfiles/envoy
	docker push ${REGISTRY_URI}/envoy-proxy:${LABEL}

logrotate: export DOCKER_BUILDKIT := 1
logrotate:
	docker build ${EXTRA_ARGS} -t ${REGISTRY_URI}/logrotate:${LABEL} \
		-f dockerfiles/utilities/Dockerfile.logrotate dockerfiles/utilities
	docker push ${REGISTRY_URI}/logrotate:${LABEL}

protoc: export DOCKER_BUILDKIT := 1
protoc:
	docker build ${EXTRA_ARGS} -t ${REGISTRY_URI}/protoc:${LABEL} \
		-f dockerfiles/utilities/Dockerfile.protoc dockerfiles/utilities
	docker push ${REGISTRY_URI}/protoc:${LABEL}

ui: export DOCKER_BUILDKIT := 1
ui: protoc
	./satlab-ui/run_protogen_ui.sh
	docker build ${EXTRA_ARGS} -t ${REGISTRY_URI}/satlab-ui:${LABEL} \
		-f dockerfiles/ui/Dockerfile .
	docker push ${REGISTRY_URI}/satlab-ui:${LABEL}

