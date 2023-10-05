#!/bin/sh
# Copyright 2020 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
set +x

# !!! This script is executed by protoc docker container

echo "Running Angular protogen"

cd /workspace/src/satlab-ui

# temporary until we move all protos into protos directory
mkdir -p protos_temp
cp /workspace/src/satlab-ui/src/app/protos/* protos_temp/

protoc \
    -I=/workspace/src/satlab-ui/protos_temp/ \
    -I=/protoc/include/ \
    --experimental_allow_proto3_optional \
    --js_out=import_style=commonjs:/workspace/src/satlab-ui/src/app/services/ \
    --grpc-web_out=import_style=typescript,mode=grpcweb:/workspace/src/satlab-ui/src/app/services/ \
    /workspace/src/satlab-ui/protos_temp/satlabrpc.proto \
    google/protobuf/duration.proto \
    google/protobuf/empty.proto \
    google/protobuf/any.proto

rm -dr protos_temp
