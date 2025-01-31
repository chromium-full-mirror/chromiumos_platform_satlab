env=/etc/profile.d/tls.env

if [ -f "${env}" ]; then
  export $(xargs < ${env})
fi
