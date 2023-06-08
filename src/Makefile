# Disable builtin rules so that running make with debug output via
# make -d is more informative.
MAKEFLAGS += --no-builtin-rules

export LABEL := ${USER}
# We use few moblab containers as base images to build Satlab specific
# containers(satlab-remote-access and satlab compose). These common
# containers include dns, remote-access, moblab-common.
# When Satlab images are pushed to prod, release version tag is used
# for these common containers such as R-2.10.0
# By default we use autopush tag for these base images.
export COMMON_CORE_LABEL := autopush
export COMMON_CORE_REGISTRY := gcr.io/chromeos-partner-moblab
export REGISTRY := us-docker.pkg.dev/chromeos-partner-moblab/satlab
export SATLAB_REGISTRY := gcr.io/satlab-images
export SFP_REGISTRY_URI := us-docker.pkg.dev/chromeos-partner-moblab/satlab-for-partners
# Please Note: This make file does not build any core Satlab containers(
# drone, downloader, nginx). These are build separately and we just
# use these images in the compose. BUILD_VERSION here is the version
# of Satlab containers(drone, downloader, nginx,conf_creator) that we want.
# to use in the compose. We will add versions tag to these container when
# pushed to prod and update this flag accordingly.
# By default we use "stable" tag.
export BUILD_VERSION := stable
WATCHTOWER_CMD := --enable-lifecycle-hooks --include-stopped --revive-stopped --interval 120 --include-restarting --monitor-only -d
SSH_PORT := 22
include common.mk