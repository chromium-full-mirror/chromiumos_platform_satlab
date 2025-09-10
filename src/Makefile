# Disable builtin rules so that running make with debug output via
# make -d is more informative.
MAKEFLAGS += --no-builtin-rules

export LABEL := ${USER}
# We use few moblab images as a base to build Satlab specific
# images (satlab-remote-access and satlab compose). These common
# images include dns, remote-access, moblab-common.
# When Satlab images are pushed to prod, release version tag is used
# for these common containers such as R-2.10.0
# By default we use autopush tag for these base images.
ifdef CUSTOM_COMMON_CORE
	export COMMON_CORE_LABEL := ${CUSTOM_COMMON_CORE}
	export COMMON_CORE_REGISTRY := us-docker.pkg.dev/chromeos-partner-moblab-dev/${CUSTOM_COMMON_CORE}
else
	export COMMON_CORE_LABEL := autopush
	export COMMON_CORE_REGISTRY := gcr.io/chromeos-partner-moblab
endif
export REGISTRY := us-docker.pkg.dev/chromeos-partner-moblab/satlab
export SFP_REGISTRY_URI := us-docker.pkg.dev/chromeos-partner-moblab/satlab-for-partners
export REGISTRY_PRIVATE := us-docker.pkg.dev/chromeos-partner-moblab/satlab-private
# Please Note: This make file does not build any core Satlab containers(
# drone, downloader, nginx). These are build separately and we just
# use these images in the compose. BUILD_VERSION here is the version
# of Satlab containers(drone, downloader, nginx,conf_creator) that we want.
# to use in the compose. We will add versions tag to these container when
# pushed to prod and update this flag accordingly.
# By default we use "stable" tag.
export BUILD_VERSION := stable
SSH_PORT := 22
include common.mk