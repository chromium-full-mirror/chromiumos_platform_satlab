export LABEL := ${USER}
# We use som moblab containers as base images to build Satlab specific
# containers(satlab-remote-access and satlab compose). These common
# containers include dns, remote-access, moblab-common.
# When Satlab images are pushed to prod, release version tag is used
# for these common containers such as R-2.10.0
# By default we use autopush tag for these base images.
export COMMON_CORE_LABEL := autopush
export REGISTRY := gcr.io/chromeos-partner-moblab
export SATLAB_REGISTRY := gcr.io/satlab-images
export CACHE_SERVER_REGISTRY := gcr.io/chromeos-cacheserver-images
# Please Note: This make file does not build any core Satlab containers(
# drone, gsa_server, nginx). These are build separately and we just
# use these images in the compose. BUILD_VERSION here is the version
# of Satlab containers(drone, gsa_server, nginx,conf_creator) that we want.
# to use in the compose. We will add versions tag to these container when
# pushed to prod and update this flag accordingly.
# By default we use "stable" tag.
export BUILD_VERSION := stable
WATCHTOWER_CMD := --enable-lifecycle-hooks --interval 60 --include-restarting
SSH_PORT := 22
include common.mk