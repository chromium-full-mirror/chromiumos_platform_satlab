#!/bin/bash

# Color variables
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check disk usage
disk_usage=$(df -h / | awk 'NR==2{printf("%s\n", 0+$5);}')

if test "${disk_usage}" -gt "90"; then
  # Print alert message
  echo -e "${RED}Warning: Disk usage is at ${disk_usage}${NC}"

  # Display header row with disk usage information in green
  df -h | head -n 1 | awk '{printf "\033[32m%s\033[0m\n", $0}'

  # Retrieve additional disk information and process it with awk
  /usr/local/bin/get_disk_info | awk '
  BEGIN {
    stateful_partition_treshold = 90;
    red = "\033[0;31m"
    nc = "\033[0m"
  }
  /^df -h/ {
    next;
  }
  /^lsblk/ {
    seen=1;
    next;
  }
  $0 == "" {
    next;
  }
  seen == "" {
    print;
    if ($6 ~ /stateful_partition/) {
      if ($5 >= stateful_partition_treshold) {
       warning = sprintf("%s\n", red "Please take action to clear out volumes and containers, below are images/containers above 10GB.");
       warning = warning sprintf("%s\n", "If the issue persists, please file a bug report to the Distributed Team.");
       warning = warning printf("%s", nc);
      }
    }

    next;
  }
  END {
    if (warning != "") {
      printf("%s\n", warning);

#Python script runs docker system df -v and prints images/containers above 10GB
      system("python3 /usr/local/bin/docker-system-summary.py");
    }
  }
'
fi
