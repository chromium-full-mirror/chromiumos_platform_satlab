#!/bin/bash
# Copyright 2023 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

# This scripts reads the satlab-config.json and coverts its content to
# environmental variable and export when user SSH to the satlab box
# via saltab_remote_access.

SATLAB_CONFIG_FILENAME=/home/satlab/keys/satlab-config.json

# This function takes JSON file as input and parses key-values to env
# vairables and then exports
function export_env_from_config() {
  CONFIG_FILE=$1

  # Check if the JSON file exists.
  if [ ! -f "${CONFIG_FILE}" ]; then
    echo -e "ERROR: The Satlab config file '$CONFIG_FILE' does not exist.\n"
    exit 1
  fi

  # Read the JSON file into a temporary file
  TMP_FILE=$(mktemp)
  sed '/\/\//d' "${CONFIG_FILE}" | jq -r 'to_entries[] | [.key, .value] | join("=")' > "${TMP_FILE}"
  if [ "$?" -ne 0 ]; then
    echo -e "\nERROR: Failed parse the Satlab Configuration file, aborting setup!"
    exit
  fi

  # Write each key-value pair as an environment variable in .env file
  while IFS='=' read -r key value; do
    export "$key=$value"
  done < "${TMP_FILE}"
  # Delete the temporary file
  rm "${TMP_FILE}"
}

if [[ -f "${SATLAB_CONFIG_FILENAME}" ]]; then
  # Convert JSON file content to environmental variables
  export_env_from_config  ${SATLAB_CONFIG_FILENAME}
fi
