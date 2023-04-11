#!/usr/bin/env python3
# Copyright 2023 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import json
import re
import subprocess

"""Pretty-printing output of docker system df -v
"""

unit_pattern = re.compile("[A-Za-z]+$")

def large_enough(num):
  """This script pretty-prints containers, images, and volumes with large footprints (>= 20GB)"""
  prefix = re.sub(unit_pattern, "", num)
  if "GB" in num:
    try:
      if float(prefix) > 20:
        return True
      return False
    except ValueError:
      return True
  return False


def main ():
  res = subprocess.run(
    ["docker", "system", "df", "--verbose", "--format={{json .}}"],
    stdout=subprocess.PIPE,
  )
  out = json.loads(res.stdout)

  for row in out["Containers"]:
    if large_enough(row["Size"]):
      print("\t".join(["Container", row["Names"], row["Size"]]))

  for row in out["Images"]:
    if large_enough(row["Size"]):
      print("\t".join(["Image", row["Repository"], row["Size"]]))

  for row in out["Volumes"]:
    if large_enough(row["Size"]):
      print("\t".join(["Volume", row["Name"], row["Size"]]))


if __name__ == "__main__":
  main()
