# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import sys
import os

from moblab_common import host_connector


def reboot():
    """Reboot the docker host box."""
    host_connector.HostServicesConnector().reboot()


def factory_reset():
    """Run a factory reset on the docker host box."""
    host_connector.HostServicesConnector.factory_reset()


def get_host_identifier():
    """Get the serial number for the satlab as a whole"""
    print(host_connector.HostServicesConnector.get_host_identifier())


if __name__ == "__main__":
    if len(sys.argv) > 1:
        f = os.path.basename(sys.argv[1])
        locals()[f]()
