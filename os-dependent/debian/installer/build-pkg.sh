#!/bin/bash
# Script to create debian package for satlab-linux

set -e

PACKAGE=satlab
VERSION=0.2.1
SATLAB_VER=${PACKAGE}-${VERSION}
echo "creating installer: ${SATLAB_VER}"

SOURCE_DIR=satlab
mkdir -p ${SOURCE_DIR}/scripts

cp ../init_scripts/satlab_common ${SOURCE_DIR}/scripts/satlab_common
cp ../init_scripts/satlab_dns_hosts ${SOURCE_DIR}/scripts/satlab_dns_hosts
cp ../init_scripts/satlab_install ${SOURCE_DIR}/scripts/satlab_install
cp ../init_scripts/satlab_prepare_docker ${SOURCE_DIR}/scripts/satlab_prepare_docker
cp ../init_scripts/satlab_restart ${SOURCE_DIR}/scripts/satlab_restart
cp ../init_scripts/satlab_update_dns ${SOURCE_DIR}/scripts/satlab_update_dns
cp ../init_scripts/satlab.sh ${SOURCE_DIR}/scripts/satlab
cp ../init_scripts/shivas.sh ${SOURCE_DIR}/scripts/shivas
echo "scripts copied"

# TODO(prasadv): Move this to file instead.
cat > ${SOURCE_DIR}/debian/postinst <<'EOT'
#!/usr/bin/env bash
set e

echo "##################################"
echo "Install Satlab"
echo "##################################"
echo "We try to prepare your setup to use Satlab."
echo "Please restart the host after installing Satlab to finish initialization."

/usr/bin/bash satlab_prepare_docker

echo "Please provide followed information."
echo "All information can be updated lated by running 'satlab_install'."

/usr/bin/bash satlab_install
echo "##################################"
echo "Thank you for using Satlab."
echo "##################################"
EOT

# Create the package.
# Execution the command expected to be run in the folder.
cd ${SOURCE_DIR}
debuild -us -uc
cd ..
echo "The package successfully created!"

INSTALL_PACKAGE="$(echo satlab_*.deb)"
PARENT_DIR="$(pwd)"

test_install()
{
  echo "---== starting install testing ==---"
  # Create custom container.
  docker build -t satlab-installer .
  # To test installation in a container.
  rm -rf install.sh
  INSTALL_VOL=installer
cat > install.sh <<EOT
#!/usr/bin/env bash
dpkg -i -D1 /${INSTALL_VOL}/${INSTALL_PACKAGE}
EOT

  TI="test-install"
  docker rm ${TI} --force
  docker run -ti \
      --name ${TI} \
      -v "${PARENT_DIR}":"/${INSTALL_VOL}" \
      --network host \
      satlab-installer:latest
}

if [[ $1 == test ]]; then
    test_install
fi

upload_package()
{
  echo "---== starting upload packages ==---"
  # Before try to upload run this commands.
  # sudo apt install apt-transport-artifact-registry
  # echo 'deb ar+https://us-central1-apt.pkg.dev/projects/chromeos-partner-moblab-dev quickstart-apt-repo main' | sudo tee -a  /etc/apt/sources.list.d/artifact-registry.list
  gcloud artifacts apt upload satlab-linux --location=us-central-1 --source="${SATLAB_VER}.deb" --project=chromeos-partner-moblab
}

if [[ $1 == upload ]]; then
    upload_package
fi

# For testing package you need run followed command son the host.
# echo 'deb [trusted=yes] https://us-central1-apt.pkg.dev/projects/chromeos-partner-moblab satlab-linux main' | sudo tee -a  /etc/apt/sources.list.d/artifact-registry.list
# sudo apt update
# sudo apt install satlab/satlab-linux
