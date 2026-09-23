#!/usr/bin/env python3
#
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

import json
import os
import subprocess
import sys
import tomllib
import urllib.error
import urllib.parse
import urllib.request

ANDROIDBUILD_API = "https://androidbuild-pa.googleapis.com/v4"
ANDROIDBUILD_SCOPE = "https://www.googleapis.com/auth/androidbuild.internal"
DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"

# Shared drive holding the xTS releases that are distributed as zip files.
DRIVE_ID = "0AHIFyqEWnKMiUk9PVA"

# Some STS releases ship one zip per architecture.
# The input names those with this placeholder, and the
# generator expands it into one pinned variant per architecture.
ARCH_PLACEHOLDER = "{arch}"

ARCHES = ("arm64", "x86_64")
XTS_TYPES = {"cts", "gts", "sts", "vts"}

# How each xTS type ships.
#   BUILD      a numeric Android build server ID
#   ZIP        a single zip on the shared drive
#   ZIP_MULTI  one zip per architecture, named with the {arch} placeholder
SHAPE_BUILD = "build"
SHAPE_ZIP = "zip"
SHAPE_ZIP_MULTI = "zip-multi-arch"
SHAPE_BY_TYPE = {
    "cts": SHAPE_BUILD,
    "gts": SHAPE_ZIP,
    "sts": SHAPE_ZIP_MULTI,
    "vts": SHAPE_BUILD,
}
SHAPE_DESCRIPTIONS = {
    SHAPE_BUILD: "a 7-8 digit Android build ID",
    SHAPE_ZIP: "a '.zip' release name",
    SHAPE_ZIP_MULTI: f"a '.zip' release name containing '{ARCH_PLACEHOLDER}'",
}


def fail(message):
    print(f"Error: {message}", file=sys.stderr)
    sys.exit(1)


def warn(message):
    print("=" * 80, file=sys.stderr)
    print(f"WARNING: {message}", file=sys.stderr)
    print("=" * 80, file=sys.stderr)


def get_token(scope):
    try:
        return subprocess.check_output(
            ["luci-auth", "token", "-scopes", scope],
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        fail("Could not get auth token. Make sure you have luci-auth installed and authenticated.")

def get_build_info(build_id, token, cache):
    """Return (test branch, test targets) for a build ID, memoized.

    The same build is normally pinned for many devices, and without the cache
    the Android Build API would be queried once per pair naming it.
    """
    if build_id in cache:
        return cache[build_id]

    base_url = f"{ANDROIDBUILD_API}/builds?buildId={build_id}"

    branch = None
    all_targets = []
    page_token = None

    try:
        while True:
            url = base_url
            if page_token:
                url += f"&pageToken={urllib.parse.quote(page_token)}"

            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                builds = data.get("builds")
                if builds:
                    if not branch:
                        branch = builds[0].get("branch")
                    targets = [b.get("target", {}).get("name") for b in builds if b.get("target")]
                    all_targets.extend(targets)

                page_token = data.get("nextPageToken")
                if not page_token:
                    break

        all_targets = [t for t in all_targets if "test_suites" in t]
    except Exception as e:
        fail(f"querying Android Build API for build {build_id}: {e}")

    # Bail out instead of pinning an empty target list into the generated config.
    if not branch:
        fail(f"no build found for build ID {build_id}")

    cache[build_id] = (branch, all_targets)
    return cache[build_id]

def list_drive_children(folder_id, token):
    files = []
    page_token = None

    while True:
        params = {
            "q": f"'{folder_id}' in parents and trashed = false",
            "corpora": "drive",
            "driveId": DRIVE_ID,
            "includeItemsFromAllDrives": "true",
            "supportsAllDrives": "true",
            "fields": "nextPageToken, files(id, name, mimeType)",
        }
        if page_token:
            params["pageToken"] = page_token

        url = "https://www.googleapis.com/drive/v3/files?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())

        files.extend(data.get("files", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            return files

def collect_drive_zips(folder_id, token, subfolder, zips):
    """Recursively collect zip name -> file ID, mirroring driveutils.GetFiles."""
    for f in list_drive_children(folder_id, token):
        if f["mimeType"] == "application/vnd.google-apps.folder":
            # Only descend into the requested xTS subfolder at the top level,
            # then take everything below it.
            if not subfolder or f["name"] == subfolder:
                collect_drive_zips(f["id"], token, "", zips)
        elif f["mimeType"] == "application/zip":
            zips[f["name"]] = f["id"]

def get_drive_zips(xts_type, token, cache):
    """Return the {zip name: drive ID} map for an xTS type, memoized."""
    subfolder = xts_type.upper()
    if subfolder not in cache:
        zips = {}
        try:
            collect_drive_zips(DRIVE_ID, token, subfolder, zips)
        except Exception as e:
            fail(f"querying Drive for {subfolder}: {e}")
        cache[subfolder] = zips
    return cache[subfolder]

def get_drive_build_info(name, xts_type, token, cache):
    """Resolve a zip release name to its Drive file ID."""
    zips = get_drive_zips(xts_type, token, cache)
    file_id = zips.get(name)
    if not file_id:
        fail(f"{name} not found in the {xts_type.upper()} Drive folder")
    return file_id


def get_drive_variants(template, xts_type, token, cache):
    """Resolve an {arch} templated release name to one variant per arch."""
    variants = []
    for arch in ARCHES:
        name = template.replace(ARCH_PLACEHOLDER, arch)
        # get_drive_build_info exits on a miss. That is deliberate: a pin that
        # only covers half of the architectures it promises is worse than no
        # pin, because the gap is invisible until someone runs the other arch.
        variants.append({
            "arch": arch,
            "test-build": get_drive_build_info(name, xts_type, token, cache),
            "test-build-name": name,
        })
    return variants


def device_tables(toml_data):
    """Return {device: {os branch: pins}} from the parsed input."""
    return {k: v for k, v in toml_data.items() if isinstance(v, dict)}


def validate_device_name(device):
    """Reject a device name a run could never produce.

    The device is the prefix of the build target up to the first dash, so a
    name containing a dash can never be matched and the entry would be dead
    forever. The realistic way to write one is to paste the whole target
    ('brya-trunk_staging-eng') where only the product ('brya') belongs.
    """
    if "-" in device:
        fail(
            f"device '{device}' contains a dash. A device is the build target up to "
            f"the first dash, so this could never match a run. If this is a whole "
            f"target, use only the part before the first dash."
        )
    if device != device.lower():
        fail(f"device '{device}' must be lowercase, to match the build target.")


def validate_pins(device, os_branch, pins):
    """Validate the xTS pins of one (device, OS branch) pair."""
    where = f"device '{device}', OS branch '{os_branch}'"

    if not isinstance(pins, dict):
        fail(f"{where} must be a table of xTS types, got {pins!r}.")

    invalid_keys = set(pins) - XTS_TYPES
    if invalid_keys:
        fail(f"invalid keys {sorted(invalid_keys)} in {where}. Allowed xTS types are {sorted(XTS_TYPES)}.")

    missing_keys = XTS_TYPES - set(pins)
    if missing_keys:
        warn(f"{where} does not pin every xTS type. Missing: {sorted(missing_keys)}.")

    for xts_type, build_id in pins.items():
        is_valid_int = isinstance(build_id, int) and 7 <= len(str(build_id)) <= 8
        is_valid_zip = isinstance(build_id, str) and build_id.endswith(".zip")

        if not (is_valid_int or is_valid_zip):
            fail(f"value for '{xts_type}' in {where} is invalid ({build_id}). It must be a 7-8 digits integer or a string ending with '.zip'.")

        # An xTS type always ships the same way, and satlab decodes each
        # type into that one shape. Pinning a type in another shape would
        # produce a config satlab cannot represent, so reject it here
        # rather than ship a pin that silently loses fields.
        want_shape = SHAPE_BY_TYPE[xts_type]
        if is_valid_int:
            got_shape = SHAPE_BUILD
        elif ARCH_PLACEHOLDER in build_id:
            got_shape = SHAPE_ZIP_MULTI
        else:
            got_shape = SHAPE_ZIP

        if got_shape != want_shape:
            fail(f"value for '{xts_type}' in {where} is {SHAPE_DESCRIPTIONS[got_shape]} ({build_id}), but {xts_type} ships as {SHAPE_DESCRIPTIONS[want_shape]}.")

        # A misspelt placeholder such as '{ARCH}' would otherwise be looked
        # up on Drive verbatim and reported as a missing release.
        if is_valid_zip:
            leftover = build_id.replace(ARCH_PLACEHOLDER, "")
            if "{" in leftover or "}" in leftover:
                fail(f"value for '{xts_type}' in {where} contains an unsupported placeholder ({build_id}). The only supported placeholder is '{ARCH_PLACEHOLDER}'.")


def validate_input(toml_data):
    not_tables = sorted(k for k, v in toml_data.items() if not isinstance(v, dict))
    if not_tables:
        fail(
            f"top level key(s) {not_tables} are not devices. Every top level key "
            f"is a device holding one table per OS branch, e.g. [brya.arsp-main]."
        )

    devices = device_tables(toml_data)
    if not devices:
        fail("input file defines no devices. Add a table such as [brya.arsp-main].")

    for device, per_branch in sorted(devices.items()):
        validate_device_name(device)
        for os_branch, pins in sorted(per_branch.items()):
            validate_pins(device, os_branch, pins)


def get_branch_targets(os_branch, token, cache):
    """Return the build target names of an OS branch, memoized.

    None means the branch does not exist. An empty list means it exists but
    these credentials cannot see its targets, which is a different thing and
    the caller has to treat it differently.
    """
    if os_branch in cache:
        return cache[os_branch]

    base = f"{ANDROIDBUILD_API}/branches/{urllib.parse.quote(os_branch)}/targets"
    names = []
    page_token = None

    while True:
        url = base
        if page_token:
            url += f"?pageToken={urllib.parse.quote(page_token)}"

        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            # The only status that means "no such branch". Anything else is a
            # problem with the request itself and should not be reported as a
            # bad config.
            if e.code == 404:
                cache[os_branch] = None
                return None
            fail(f"querying targets of OS branch '{os_branch}': {e}")
        except Exception as e:
            fail(f"querying targets of OS branch '{os_branch}': {e}")

        names.extend(t["name"] for t in data.get("targets", []) if t.get("name"))

        # The page size is small, so skipping this would silently truncate the
        # target list and reject devices that are in fact present.
        page_token = data.get("nextPageToken")
        if not page_token:
            break

    cache[os_branch] = names
    return names


def validate_against_build_api(devices, token, cache):
    """Check every (device, OS branch) pair against the Android build server."""
    for device, per_branch in sorted(devices.items()):
        for os_branch in sorted(per_branch):
            targets = get_branch_targets(os_branch, token, cache)

            if targets is None:
                fail(f"OS branch '{os_branch}' (pinned for device '{device}') does not exist on the Android build server.")

            if not targets:
                warn(
                    f"could not check device '{device}': the Android build server lists no "
                    f"targets for OS branch '{os_branch}'. The branch exists, so this is "
                    f"normally a permission limit of the account running the generator "
                    f"rather than a problem with the config."
                )
                continue

            # A target is '<product>[-<release>]-<variant>' and the product is
            # the device, which is how satlab derives it from --target.
            products = {t.split("-", 1)[0] for t in targets}
            if device not in products:
                shown = sorted(products)
                if len(shown) > 12:
                    shown = shown[:12] + [f"... and {len(products) - 12} more"]
                fail(
                    f"device '{device}' has no build target on OS branch '{os_branch}'. "
                    f"Products built there: {shown}."
                )


def resolve_pin(xts_type, build_id, ctx):
    """Resolve one pinned value into the entry written to the output."""
    build_id_str = str(build_id)

    if build_id_str.endswith(".zip"):
        # xTS releases shipped as a zip live on a shared drive, not on
        # the Android build server: pin the Drive file ID instead.
        if ctx["drive_token"] is None:
            ctx["drive_token"] = get_token(DRIVE_SCOPE)

        if ARCH_PLACEHOLDER in build_id_str:
            print(f"    Resolving {xts_type} zips on Drive, one per architecture: {build_id_str}")
            return {
                # No top level test-build on purpose: there is no single
                # build to run. A reader that ignores the variants finds
                # nothing to run rather than an arbitrary architecture,
                # which an absent key conveys just as well as an empty
                # one, since both decode to "".
                "test-build-name": build_id_str,
                "test-build-variants": get_drive_variants(
                    build_id_str, xts_type, ctx["drive_token"], ctx["drive_cache"]),
            }

        print(f"    Resolving {xts_type} zip on Drive: {build_id_str}")
        return {
            "test-build": get_drive_build_info(
                build_id_str, xts_type, ctx["drive_token"], ctx["drive_cache"]),
            "test-build-name": build_id_str,
        }

    if build_id_str in ctx["build_cache"]:
        print(f"    Reusing the already resolved {xts_type} build {build_id_str}")
    else:
        print(f"    Querying Android Build API for {xts_type} build {build_id_str}")
    test_branch, targets = get_build_info(build_id_str, ctx["token"], ctx["build_cache"])

    return {
        "test-build": build_id_str,
        "test-branch": test_branch,
        "test-targets": targets,
    }


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(base_dir, "EDIT_ME_xts_pinned_test_builds.toml")
    output_file = os.path.join(base_dir, "DO_NOT_EDIT_MANUALLY_xts_pinned_test_builds.json")

    print(f"Reading configuration from {input_file}")
    with open(input_file, "rb") as f:
        toml_data = tomllib.load(f)

    print("Validating input configuration.")
    validate_input(toml_data)
    devices = device_tables(toml_data)

    print("Fetching auth token.")
    ctx = {
        "token": get_token(ANDROIDBUILD_SCOPE),
        "drive_token": None,
        "drive_cache": {},
        "build_cache": {},
        "branch_cache": {},
    }

    # Before resolving anything: a typo in a device or OS branch would
    # otherwise produce a perfectly valid looking config that never matches a
    # run.
    print("Checking devices and OS branches against the Android build server.")
    validate_against_build_api(devices, ctx["token"], ctx["branch_cache"])

    # Keyed by device, then by OS branch, matching xts.Config in the satlab Go
    # code.
    output_data = {}

    pair_count = sum(len(per_branch) for per_branch in devices.values())
    print(f"Processing {len(devices)} devices, {pair_count} (device, OS branch) pairs.")

    for device, per_branch in sorted(devices.items()):
        print(f"\nDevice: {device}")
        resolved_branches = {}

        for os_branch, pins in sorted(per_branch.items()):
            print(f"  OS branch: {os_branch}")
            resolved_branches[os_branch] = {
                xts_type: resolve_pin(xts_type, build_id, ctx)
                for xts_type, build_id in pins.items()
            }

        output_data[device] = resolved_branches

    with open(output_file, "w") as f:
        json.dump(output_data, f, indent=2, sort_keys=True)
        f.write("\n")

    print(f"\nOutput successfully saved to {output_file}")

if __name__ == "__main__":
    main()
