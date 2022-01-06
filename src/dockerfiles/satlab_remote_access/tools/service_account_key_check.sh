cat << EOF
###############################################################################
Information about current service account key on this satlab.
Please run satlab_setup to generate new key before expiration.
###############################################################################
EOF
key_id=$(jq -r '."private_key_id"' /home/satlab/keys/satlab_service_account.json)
KEYS_FOLDER=/home/satlab/keys
GCLOUD="docker run --rm -ti -a stdout -v satlab_keys:${KEYS_FOLDER} -v gcloud:/root/.config/gcloud google/cloud-sdk:slim"
SATLAB_SERIVCE_ACCOUNT=satlab-prototype@chromeos-service-accounts-dev.iam.gserviceaccount.com
${GCLOUD} gcloud iam service-accounts keys list --iam-account="$SATLAB_SERIVCE_ACCOUNT" --filter "name=projects/chromeos-service-accounts-dev/serviceAccounts/$SATLAB_SERIVCE_ACCOUNT/keys/$key_id"
echo "###############################################################################"