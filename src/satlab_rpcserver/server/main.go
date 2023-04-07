// Copyright 2023 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
package main

import (
	"context"
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"satlab/satlabrpcserver/server/services/rpc_services"

	pb "satlab/satlabrpcserver/proto"
	"satlab/satlabrpcserver/server/services/bucket_services"
	"satlab/satlabrpcserver/server/services/build_services"
	"satlab/satlabrpcserver/server/utils"
	"satlab/satlabrpcserver/server/utils/constants"
)

const (
	// PORT for gRPC server to listen to
	PORT = ":50051"
)

func main() {
	lis, err := net.Listen("tcp", PORT)

	if err != nil {
		log.Fatalf("failed connection: %v", err)
	}

	s := grpc.NewServer()

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute*20)
	defer cancel()

	bucketService, err := bucket_services.New(ctx, constants.BucketName)

	if err != nil {
		log.Fatalf("Failed to create a bucket connector %v", err)
	}
	buildService, err := build_services.New(ctx)
	if err != nil {
		log.Fatalf("Failed to create a build connector %v", err)
	}
	labelParser, err := utils.NewLabelParser()
	if err != nil {
		log.Fatalf("Failed to create a label parser %v", err)
	}

	server := rpc_services.New(buildService, bucketService, labelParser)
	pb.RegisterSatlabRpcServiceServer(s, server)

	// Register reflection service on gRPC server.
	reflection.Register(s)

	log.Printf("server listening at %v", lis.Addr())

	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to server: %v", err)
	}

	defer server.Close()
}
