# xTS Pinned Test Builds Generator

## Purpose

Generates the configuration used by Satlab to pin the xTS test builds (CTS, GTS, STS, VTS) it runs per device and OS branch.

## Files

- `EDIT_ME_xts_pinned_test_builds.toml`: Input file mapping each (device, OS branch) pair to desired xTS test builds.
- `generate_xts_pinned_test_builds.py`: Generator script.
- `DO_NOT_EDIT_MANUALLY_xts_pinned_test_builds.json`: Generated output artifact.


## Input format

Pins are keyed by the triple `(device, OS branch, xTS type)`:

```toml
[brya.arsp-26Q2-desktop-release]
gts = "android-gts-14-R2(14-17)-Preview7-15501425.zip"
cts = 16222257
vts = 16222257
sts = "android-sts-17_sts-r55-linux-{arch}.zip"

[brya.arsp-main]
cts = 15901438
vts = 15901438
```

### Devices

A device is a board *or* a model. It is the part of the build target before the first dash, which is how Satlab derives it at run time:

| `--target` | device |
| --- | --- |
| `brya-userdebug` | `brya` |
| `brya-trunk_staging-eng` | `brya` |
| `zork-user` | `zork` |


## How to Use

1. Prerequisites

Authenticate with `luci-auth`:

```sh
luci-auth login -scopes https://www.googleapis.com/auth/androidbuild.internal https://www.googleapis.com/auth/drive.readonly
```

2. Update Input Configuration

Edit `EDIT_ME_xts_pinned_test_builds.toml`.

3. Generate the Config

```sh
python3 generate_xts_pinned_test_builds.py
```

4. Create CL

Commit both `EDIT_ME_xts_pinned_test_builds.toml` and the generated `DO_NOT_EDIT_MANUALLY_xts_pinned_test_builds.json`, then upload a CL for review. Once merged, the generated file will be automatically copied to the GCS bucket.

## All Steps in One Go

Run from `cfg/xts`, on a working branch, after editing `EDIT_ME_xts_pinned_test_builds.toml`:

```sh
# Stop if there are local changes other than the edited input file.
{ [ -z "$(git status --porcelain --untracked-files=no -- ':(top,exclude)cfg/xts/EDIT_ME_xts_pinned_test_builds.toml')" ] ||
  { echo "Aborting, working tree has other changes:"; git status --short --untracked-files=no; false; }; } &&

python3 generate_xts_pinned_test_builds.py &&
git add EDIT_ME_xts_pinned_test_builds.toml DO_NOT_EDIT_MANUALLY_xts_pinned_test_builds.json &&
git commit -m "satlab: cfg/xts Update pinned xTS test builds" &&
git cl upload
```
