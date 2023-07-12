FROM ubuntu:18.04

LABEL Satlab Maintainers "xolabs-eng@google.com"

RUN \
  apt-get update \
  && apt-get -y install gettext-base \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Volume where the nginx.conf file will be created.
VOLUME /mnt/conf/nginx

# Set work directory.
WORKDIR /root

# Copy a static nginx.conf file into this image.
COPY dockerfiles/conf_creator/conf/nginx.conf .

COPY  dockerfiles/conf_creator/override-env.sh .
RUN chmod u+x override-env.sh
# Overrides the GCS bucket from env variable.
ENTRYPOINT ["/root/override-env.sh"]
