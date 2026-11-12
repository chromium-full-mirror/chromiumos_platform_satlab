FROM ubuntu:18.04

RUN \
  apt-get update \
  && apt-get -y install gettext-base \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Volume where the nginx.conf file will be created.
VOLUME /mnt/conf/nginx

# Volume where the ATE config files will be created.
VOLUME /mnt/conf/ate

# Set work directory.
WORKDIR /root

# Copy a static nginx.conf file into this image.
COPY dockerfiles/conf_creator/conf/nginx.conf .

# Copy ATE configuration and entrypoint files into this image.
COPY dockerfiles/conf_creator/conf/al_ate_mh_device_config .
COPY dockerfiles/conf_creator/conf/ate_labserver_entrypoint.sh .
COPY dockerfiles/conf_creator/conf/ate_tradefed_entrypoint.sh .

COPY  dockerfiles/conf_creator/override-env.sh .
RUN chmod a+x override-env.sh ate_labserver_entrypoint.sh ate_tradefed_entrypoint.sh
# Overrides the GCS bucket from env variable.
ENTRYPOINT ["/root/override-env.sh"]
