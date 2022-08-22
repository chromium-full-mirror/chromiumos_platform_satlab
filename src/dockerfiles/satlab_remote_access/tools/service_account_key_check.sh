RED='\033[1;31m'
NC='\033[0m' # No Color
THREE_DAYS=$((60 * 60 * 24 * 3))

KEY_FOLDER='/home/satlab/keys'
KEY_DATES_FILE='key_dates.json'
if [ -f "$KEY_FOLDER/$KEY_DATES_FILE" ]; then
    cat << EOF
###############################################################################
Information about current service account key on this satlab.
###############################################################################
EOF
    KEY_EXPIRATION_TIME=$(jq -r .[0].validBeforeTime $KEY_FOLDER/$KEY_DATES_FILE)
    KEY_START_TIME=$(jq -r .[0].validAfterTime $KEY_FOLDER/$KEY_DATES_FILE)
    if [ -z $KEY_EXPIRATION_TIME ]; then 
        echo -e "${RED}No key detected. Please run satlab_setup to download new key.${NC}"
    else 
        KEY_EXPIRATION_TIME_EPOCH=$(date -d $KEY_EXPIRATION_TIME +%s)
        NOW=$(date +%s)

        if [ $NOW -ge $KEY_EXPIRATION_TIME_EPOCH ]; then
            echo -e "${RED}Key appears to be expired. Please run satlab_setup to download new key.${NC}"
        elif [ $(( NOW+THREE_DAYS )) -gt $KEY_EXPIRATION_TIME_EPOCH ]; then
            echo -e "${RED}Key will expire soon. Please run satlab_setup to download new key.${NC}"
        else
            echo "Key valid between $KEY_START_TIME and $KEY_EXPIRATION_TIME"
        fi
    fi
echo "###############################################################################"
else
    cat << EOF
###############################################################################
This Satlab is either new or missing cached key metadata.
Please run satlab_setup to initialize your Satlab and/or fetch key metadata.
###############################################################################
EOF
fi