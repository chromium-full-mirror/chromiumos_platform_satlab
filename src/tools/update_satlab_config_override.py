# Copyright 2025 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import json
import os

from google.cloud import storage
from moblab_common import host_connector

SATLAB_CONFIG_FILENAME = "/home/satlab/keys/satlab-config.json"
SATLAB_CONFIG_OVERRIDE_FILENAME = "/home/satlab/keys/satlab-config-override.json"
SATLAB_SA_FILENAME = "/home/satlab/keys/pubsub-key-do-not-delete.json"

def update_satlab_config_override() -> None:
    """
    Downloads the override config.
    If override config in gcs does not exist for this device, it takes no action.
    If the remote config was deleted, the local config will also be deleted.
    """
    if not is_satlab_enrolled():
        return

    storage_client = storage.Client.from_service_account_json(json_credentials_path = SATLAB_SA_FILENAME)
    bucket = storage_client.bucket(bucket_name = get_gcs_bucket())
    blob = bucket.blob(blob_name = get_remote_satlab_override_config_name())

    if blob.exists():
        # Download the file if it exists remotely
        blob.download_to_filename(filename=SATLAB_CONFIG_OVERRIDE_FILENAME)
    else:
        if os.path.exists(path = SATLAB_CONFIG_OVERRIDE_FILENAME):
            # Delete the local file if the remote blob does not exist
            os.remove(path = SATLAB_CONFIG_OVERRIDE_FILENAME)

def get_gcs_bucket() -> str:
    """
    Returns the name of the Google Cloud Storage bucket.
    Partners must have this value in satlab-config.
    For internal users, the value is constant.
    """
    try:
        with open(file = SATLAB_CONFIG_FILENAME, mode = 'r') as file:
            config_data = json.load(fp = file)
            return config_data.get("GCS_IMAGE_BUCKET")
    except:
        return "chromeos-satlab-internal-users"

def is_satlab_enrolled() -> bool:
    """
    Checks whether the Satlab is already set up.
    Verifies the existence of both the service account and the config.
    """
    return os.path.isfile(path = SATLAB_SA_FILENAME) and os.path.isfile(path = SATLAB_CONFIG_FILENAME)

def get_remote_satlab_override_config_name() -> str:
    """
    Returns the location in the bucket of the override config file for this Satlab.
    """
    host_identifier = host_connector.HostServicesConnector.get_host_identifier().lower()
    return f"override_configs/satlab-{host_identifier}-config.json"


if __name__ == "__main__":
    update_satlab_config_override()