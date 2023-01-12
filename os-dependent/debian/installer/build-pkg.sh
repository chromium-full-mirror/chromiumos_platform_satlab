#!/bin/bash
# Script to create debian package for satlab-linux

set -e

echo "Creating a new installer"

SOURCE_DIR=satlab
mkdir -p ${SOURCE_DIR}/scripts
mkdir -p ${SOURCE_DIR}/scripts/init
mkdir -p ${SOURCE_DIR}/scripts/configs

cp ../init_scripts/satlab_compose ${SOURCE_DIR}/scripts/satlab_compose
cp ../init_scripts/satlab_dns_hosts ${SOURCE_DIR}/scripts/satlab_dns_hosts
cp ../init_scripts/satlab_init ${SOURCE_DIR}/scripts/init/satlab_init
cp ../init_scripts/satlab_install ${SOURCE_DIR}/scripts/satlab_install
cp ../init_scripts/satlab_network ${SOURCE_DIR}/scripts/satlab_network
cp ../init_scripts/satlab_prepare_docker ${SOURCE_DIR}/scripts/satlab_prepare_docker
cp ../init_scripts/satlab_questions ${SOURCE_DIR}/scripts/satlab_questions
cp ../init_scripts/satlab_remote_access ${SOURCE_DIR}/scripts/satlab_remote_access
cp ../init_scripts/satlab_restart ${SOURCE_DIR}/scripts/satlab_restart
cp ../init_scripts/satlab_update_dns ${SOURCE_DIR}/scripts/satlab_update_dns
cp ../init_scripts/satlab.conf ${SOURCE_DIR}/scripts/configs/satlab.conf
cp ../init_scripts/satlab.sh ${SOURCE_DIR}/scripts/satlab
cp ../init_scripts/shivas.sh ${SOURCE_DIR}/scripts/shivas

echo "scripts copied"

rm *all.deb

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
ls -ll /${INSTALL_VOL}/
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
  gcloud artifacts apt upload satlab-linux --source=${INSTALL_PACKAGE} --project=chromeos-partner-moblab --location=us-central1
}

if [[ $1 == upload ]]; then
    upload_package
fi

# For testing package on final host you need run followed commands on the host.
# echo 'deb [trusted=yes] https://us-central1-apt.pkg.dev/projects/chromeos-partner-moblab satlab-linux main' | sudo tee -a  /etc/apt/sources.list.d/artifact-registry.list
# sudo apt update
# sudo apt install satlab/satlab-linux
