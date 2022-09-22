#!/bin/bash
# Script to create debian package for satlab-linux

set -e

PACKAGE=satlab-linux
VERSION=0.1
SATLAB_VER=${PACKAGE}-${VERSION}
echo "creating installer: ${SATLAB_VER}"

rm -rf -- "${SATLAB_VER}"
mkdir -p ${SATLAB_VER}/DEBIAN
mkdir -p ${SATLAB_VER}/usr/local/bin/

cp ../init_scripts/get_dns_hosts ${SATLAB_VER}/usr/local/bin/satlab_get_dns_hosts
cp ../init_scripts/restart_dhcp.sh ${SATLAB_VER}/usr/local/bin/satlab_restart_dhcp.sh
cp ../init_scripts/setup.sh ${SATLAB_VER}/usr/local/bin/satlab_install.sh

# TODO(prasadv): Add dependencies
cat > ${SATLAB_VER}/DEBIAN/control <<EOT
Package: ${PACKAGE}
Version: ${VERSION}
Maintainer:  ChromeOS Distributed Fleet
Architecture: all
Description: Satlab installer for linux
EOT
sed '$d' ${SATLAB_VER}/DEBIAN/control

# TODO(prasadv): Move this to file instead.
cat > ${SATLAB_VER}/DEBIAN/postinst <<'EOT'
#!/usr/bin/env bash
set e

echo "##################################"
echo "START:POSTINST"
echo "##################################"
echo "Running the setup script."

/usr/bin/bash /usr/local/bin/satlab_install.sh
echo "END: POSTINST."
echo "##################################"
EOT

chmod -R 0775 ${SATLAB_VER}
# create the package
dpkg-deb --build  ./${SATLAB_VER}
echo "Successfully creating package: " ${PWD}/${SATLAB_VER}

test_install()
{
  # To test installation in a container.
  rm -rf package
  mkdir package
  chmod -R 0775 package
  mv ${SATLAB_VER}.deb package/${SATLAB_VER}.deb

  INSTALL_VOL=installer
cat > package/install.sh <<EOT
#!/usr/bin/env bash
dpkg -i /${INSTALL_VOL}/package/${SATLAB_VER}.deb
EOT

  TI="test-install"
  docker rm ${TI} --force
  docker run -ti \
      --name ${TI} \
      -v ${PWD}:/${INSTALL_VOL} \
      ubuntu:22.04 bash /${INSTALL_VOL}/package/install.sh
}

if [[ $1 == test ]]; then
    test_install
fi
