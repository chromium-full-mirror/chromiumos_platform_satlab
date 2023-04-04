// Copyright 2023 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
package main

import (
	"context"
	"fmt"
	"log"
	"net"

	"google.golang.org/api/iterator"
	moblabapipb "google.golang.org/genproto/googleapis/chromeos/moblab/v1beta1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	moblabapi "satlab/satlabrpcserver/google.golang.org/google/chromeos/moblab/v1beta1"
	pb "satlab/satlabrpcserver/proto"
)

const (
	// Port for gRPC server to listen to
	PORT = ":50051"
)

type SatlabRpcServiceServer struct {
	pb.UnimplementedSatlabRpcServiceServer
}

var background_ctx = context.Background()

// Set your service account: $ export GOOGLE_APPLICATION_CREDENTIALS="service_account.json"
// Client need not be created for each request
var client, err = moblabapi.NewBuildClient(background_ctx)

func (s *SatlabRpcServiceServer) ListBuildTargets(ctx context.Context, in *pb.ListBuildTargetsRequest) (*pb.ListBuildTargetsResponse, error) {
	log.Printf("Received: request for build targets")

	req := &moblabapipb.ListBuildTargetsRequest{}
	fmt.Println(req)
	iter := client.ListBuildTargets(background_ctx, req)
	var arr []string

	for {
		build, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("there is an unknown err: %v", err)
			return nil, err
		}
		arr = append(arr, build.Name)
	}

	response := &pb.ListBuildTargetsResponse{
		BuildTargets: arr,
	}

	return response, nil

}

func main() {

	lis, err := net.Listen("tcp", PORT)

	if err != nil {
		log.Fatalf("failed connection: %v", err)
	}

	s := grpc.NewServer()

	pb.RegisterSatlabRpcServiceServer(s, &SatlabRpcServiceServer{})
	// Register reflection service on gRPC server.
	reflection.Register(s)

	log.Printf("server listening at %v", lis.Addr())

	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to server: %v", err)
	}
}
