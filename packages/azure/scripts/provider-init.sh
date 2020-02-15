test -f startup-env.sh && source startup-env.sh
cat <<EOF >/etc/default/celo
DATA_DIR=/root/.celo
CELO_ENV=${celoEnv}
BOOTNODES=${bootnodes}
VALIDATOR_KEY_VAULT=${validatorKeyVaultName}
PROXY_KEY_VAULT=${proxyKeyVaultName}
ATTESTER_KEY_VAULT=${attesterKeyVaultName}
GETH_NODE_DOCKER_IMAGE=${gethNodeDockerImageRepository}:${gethNodeDockerImageTag}
GETH_EXPORTER_DOCKER_IMAGE=${gethExporterDockerImageRepository}:${gethExporterDockerImageTag}
ATTESTATION_SERVICE_DOCKER_IMAGE=${attestationServiceDockerImageRepository}:${attestationServiceDockerImageTag}
NETWORK_ID=${networkId}
GETH_VERBOSITY=${gethVerbosity}
VALIDATOR_NAME=${validatorName}
PROXY_NAME=${proxyName}
ETHSTATS_HOST=${ethstatsHost}
BLOCK_TIME=${blockTime}
ISTANBUL_REQUEST_TIMEOUT_MS=${istanbulRequestTimeoutMs}
PROXY_MAX_PEERS=${proxyMaxPeers}
VALIDATOR_MAX_PEERS=${proxyMaxPeers}
PROXY_EXTERNAL_IP_ADDRESS=${proxyExternalIpAddress}
PROXY_INTERNAL_IP_ADDRESS=${proxyInternalIpAddress}
VALIDATOR_INTERNAL_IP_ADDRESS=${validatorInternalIpAddress}
ATTESTER_ACCOUNT_ADDRESS=${attesterAccountAddress}
VALIDATOR_ACCOUNT_ADDRESS=${validatorAccountAddress}
PROXY_URL="enode://${proxyPublicKey}@${proxyInternalIpAddress}:30503;enode://${proxyPublicKey}@${proxyExternalIpAddress}:30303"
SMS_PROVIDERS=twilio
ATTESTER_TWILIO_ACCOUNT_SID=${attesterTwilioAccountSID}
ATTESTER_TWILIO_MESSAGE_SERVICE_SID=${attesterTwilioMessageServiceSID}
ATTESTER_DB_USERNAME="${attesterPostgreSQLUsername}@${attesterDBName}"
ATTESTER_DB_HOSTNAME="${attesterDBName}.postgres.database.azure.com"
EOF
cat ./libcelo.sh >> /etc/default/celo

apt update -y && apt upgrade -y

apt install -y \
    curl \
    jq

DISK_LUN=lun0
DISK_PATH=`readlink -f /dev/disk/azure/scsi1/${DISK_LUN}`
