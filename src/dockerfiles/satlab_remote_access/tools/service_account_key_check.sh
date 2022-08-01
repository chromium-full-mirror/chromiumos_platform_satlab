KEY_FOLDER='/home/satlab/keys'
KEY_DATES_FILE='key_dates.json'
if [ -f "$KEY_FOLDER/$KEY_DATES_FILE" ]; then
    cat << EOF
###############################################################################
Information about current service account key on this satlab.
Please run satlab_setup to download new key before expiration.
###############################################################################
EOF
    KEY_EXPIRATION_TIME=$(jq -r .[0].validBeforeTime $KEY_FOLDER/$KEY_DATES_FILE)
    KEY_START_TIME=$(jq -r .[0].validAfterTime $KEY_FOLDER/$KEY_DATES_FILE)
    echo "Key valid between $KEY_START_TIME and $KEY_EXPIRATION_TIME"
echo "###############################################################################"
else
    cat << EOF
###############################################################################
Please run satlab_setup to initialize your Satlab.
###############################################################################
EOF
fi