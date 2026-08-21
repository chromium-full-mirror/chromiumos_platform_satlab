#!/bin/bash
# Copyright 2023 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

# This scripts reads the satlab-config.json and coverts its content to
# environmental variable and export when user SSH to the satlab box
# via saltab_remote_access.

SATLAB_CONFIG_FILENAME=/home/satlab/keys/satlab-config.json
SATLAB_CONFIG_OVERRIDE_FILENAME=/home/satlab/keys/satlab-config-override.json

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

  # If exists, load the overwrite JSON file into a temporary file
  if [[ -f "${SATLAB_CONFIG_OVERRIDE_FILENAME}" ]]; then
    sed '/\/\//d' "${SATLAB_CONFIG_OVERRIDE_FILENAME}" | \
      jq -r 'to_entries[] | [.key, .value] | join("=")' >> "${TMP_FILE}"

    if [ "$?" -ne 0 ]; then
      echo -e "\nWARNING: Failed to parse the Configuration Override file, continuing without overrides."
    fi
  fi

  # Write each key-value pair as an environment variable in .env file
  while IFS='=' read -r key value; do
    export "$key=$value"
  done < "${TMP_FILE}"
  # Delete the temporary file
  rm "${TMP_FILE}"
}

function export_ats_enabled() {
  if [[ "${CTP_SWARMING_POOL}" == "ChromeOSSkylab" ]]; then
    export ATS_ENABLED=true
    export ATS_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab-internal
    export GCP_PROJECT=satlab-internal-users
    export CLOUD_FILE_TRANSFER_BUCKET=omnilab_satlab-internal-users_file_transfer
    return
  fi

  case "${ACCOUNT_ID}" in
    2|4|6|84) # Allowed partner accounts
      export ATS_ENABLED=true
      export ATS_REGISTRY_URI=us-docker.pkg.dev/chromeos-partner-moblab/satlab-for-partners
      export GCP_PROJECT=distributed-fleet-s4p
      export CLOUD_FILE_TRANSFER_BUCKET=omnilab_crostest_file_transfer
      return
      ;;
  esac
}

if [[ -f "${SATLAB_CONFIG_FILENAME}" ]]; then
  # Convert JSON file content to environmental variables
  export_env_from_config  ${SATLAB_CONFIG_FILENAME}
fi

export_ats_enabled
