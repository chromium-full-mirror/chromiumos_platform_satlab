FROM ubuntu:18.04

LABEL Satlab Maintainers "xolabs-eng@google.com"

# Volume where the nginx.conf file will be created.
VOLUME /mnt/conf/nginx

# Set work directory.
WORKDIR /root

# Copy a static nginx.conf file into this image.
COPY dockerfiles/conf_creator/conf/nginx.conf .

# Copy nginx.conf into the shared volume.
CMD ["cp", "/root/nginx.conf", "/mnt/conf/nginx/"]
