KEY_FOLDER='/home/satlab/keys'
KEY_FILE='satlab_service_account.json'
# TODO(prasadv): Move this to environment variable
GCLOUD_SDK_VERSION=372.0.0
if [ -f "$KEY_FOLDER/$KEY_FILE" ]; then
    cat << EOF
###############################################################################
Information about current service account key on this satlab.
Please run satlab_setup to download new key before expiration.
###############################################################################
EOF
    key_id=$(sudo jq -r '."private_key_id"' $KEY_FOLDER/$KEY_FILE)
    GCLOUD="docker run --rm -ti -a stdout -v satlab_keys:$KEY_FOLDER -v gcloud:/root/.config/gcloud google/cloud-sdk:${GCLOUD_SDK_VERSION}-slim"
    SATLAB_SERIVCE_ACCOUNT=satlab-prototype@chromeos-service-accounts-dev.iam.gserviceaccount.com
    ${GCLOUD} gcloud iam service-accounts keys list --iam-account="$SATLAB_SERIVCE_ACCOUNT" --filter "name=projects/chromeos-service-accounts-dev/serviceAccounts/$SATLAB_SERIVCE_ACCOUNT/keys/$key_id"
echo "###############################################################################"
else
    cat << EOF
###############################################################################
Please run satlab_setup to initialize your Satlab.
###############################################################################
EOF
fi