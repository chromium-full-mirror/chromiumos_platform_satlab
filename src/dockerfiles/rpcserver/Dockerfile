# need to cached this in the base containers
FROM golang:1.20

WORKDIR /usr/src/satlab_rpcserver

COPY src/satlab_rpcserver/ /usr/src/satlab_rpcserver
RUN go mod download && go mod verify

RUN apt-get update && apt-get install -y protobuf-compiler
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
RUN export PATH="$PATH:$(go env GOPATH)/bin"

RUN go generate ./...

EXPOSE 50051
CMD ["/usr/src/satlab_rpcserver/start_server.sh"]
# CMD ["tail", "-f", "/dev/null"]
