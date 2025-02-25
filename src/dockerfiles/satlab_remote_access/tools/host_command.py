# Copyright 2021 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import docker
import logging
import os
import sys

from moblab_common import host_connector

DOCKER_REGISTRY = "gcr.io/chromeos-partner-moblab/"

def reboot():
    """Reboot the docker host box."""
    host_connector.HostServicesConnector().reboot()


def factory_reset():
    """Run a factory reset on the docker host box."""
    host_connector.HostServicesConnector.factory_reset()

def get_disk_info():
    """Executes df -h and lsblk command """
    print(host_connector.HostServicesConnector.get_disk_info())

def get_host_identifier():
    """Get the serial number for the satlab as a whole"""
    print(host_connector.HostServicesConnector.get_host_identifier())


def get_host_ip():
    """Get the IP address of the Satlab host"""
    print(host_connector.HostServicesConnector.get_ip())

def get_host_mac():
    """Get the external MAC address of the Satlab host"""
    print(host_connector.HostServicesConnector.get_external_mac_address())

def get_host_os_version():
    """Get the OS Version of the Satlab host"""
    print(host_connector.HostServicesConnector.get_system_version())


def is_update_available():
    """
        Check to see if there is a system update or any containers that
        have updated images.

        Scan the running containers, if the watchtower program has pulled
        down a newer image then the container to image reference tag
        is broken.

        Detect these image tag link breaks and assume that means we have
        an update. Looking through update tools and forums, it seems this
        is the way all update tools work.

    Returns:
        True if there is an update available.
    """

    try:
        response = (
            host_connector.HostServicesConnector.get_system_update_status()
        )
        if response.current_op.find("IDLE") == -1:
            print("true")
            return
    except host_connector.HostServicesException:
        logging.exception("Get system update status call failed.")

    client = docker.from_env(timeout=300)
    for container in client.containers.list():
        if len(container.image.tags) == 0:
            print("true")
            return
    print("false")


def update_satlab():
    """
        Sets off an update of all docker containers, using watchtower

    Returns: String result message.
    """
    client = docker.from_env(timeout=600)

    try:
        container = client.containers.get("update")
        if container.status != "running":
            container.remove(force=True)
        else:
            print("Already updating please wait.")
            return
    except docker.errors.NotFound:
        pass

    label = os.environ.get("WATCHTOWER_TAG", "release")
    container = client.containers.run(
        DOCKER_REGISTRY + "watchtower:%s" % label,
        volumes=["/var/run/docker.sock:/var/run/docker.sock"],
        name="update",
        detach=True,
        remove=True,
        command="--run-once --include-restarting --include-stopped --revive-stopped -d",
    )

    try:
        container.wait(timeout=60)
    except requests.exceptions.ReadTimeout:
        logging.exception("Watchtower update raised an exception.")
        container.stop()
    finally:
        container.remove()
    print("Update finished.")
    return


def update_system():
    """
        Initiates system update if it is available.
    Returns:
        An error message.
    """
    try:
        response = (
            host_connector.HostServicesConnector.install_system_update()
        )
        return response.error
    except host_connector.HostServicesException:
        logging.exception("Install system update raised an exception.")
        return "Failed to install update."


def stop_ui():
    """Stop ui of the host box."""
    host_connector.HostServicesConnector.stop_ui()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        f = os.path.basename(sys.argv[1])
        locals()[f]()
