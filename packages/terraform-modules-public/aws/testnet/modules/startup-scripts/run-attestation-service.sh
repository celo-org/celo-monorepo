#! /bin/bash

export CELO_IMAGE=${celo_image}
export NETWORK_ID=${celo_network_id}
export CELO_VALIDATOR_ADDRESS=${validator_address}
NODE_DIRECTORY=/home/ubuntu/celo-attestations-node

mkdir $NODE_DIRECTORY
cd $NODE_DIRECTORY

docker run -v $PWD:/root/.celo --rm $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES="$(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"

export CELO_ATTESTATION_SIGNER_ADDRESS=${attestation_signer_address}
echo -n '${attestation_signer_private_key_password}' > .password
echo -n '${attestation_signer_private_key_file_contents}' > keystore/${attestation_signer_private_key_filename}

ATTESTATION_NODE_CLOUDWATCH_LOG_GROUP_NAME=${cloudwatch_attestation_node_log_group_name}
ATTESTATION_NODE_CLOUDWATCH_LOG_STREAM_NAME=${cloudwatch_attestation_node_log_stream_name}

if [[ -z $ATTESTATION_NODE_CLOUDWATCH_LOG_GROUP_NAME || -z $ATTESTATION_NODE_CLOUDWATCH_LOG_STREAM_NAME ]]; then
  DOCKER_LOGGING_PARAMS=''
else
  DOCKER_LOGGING_PARAMS="--log-driver=awslogs --log-opt awslogs-group=$ATTESTATION_NODE_CLOUDWATCH_LOG_GROUP_NAME --log-opt awslogs-stream=$ATTESTATION_NODE_CLOUDWATCH_LOG_STREAM_NAME"
fi

docker run -d --name celo-attestations $DOCKER_LOGGING_PARAMS --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --nousb --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin --unlock $CELO_ATTESTATION_SIGNER_ADDRESS --password /root/.celo/.password --bootnodes $BOOTNODE_ENODES --allow-insecure-unlock

export CELO_IMAGE_ATTESTATION=${celo_image_attestation}
export CONFIG_FILE_PATH=.attestationconfig

echo 'DATABASE_URL=${database_url}' >> $CONFIG_FILE_PATH
echo 'CELO_PROVIDER=http://localhost:8545' >> $CONFIG_FILE_PATH
echo 'CELO_VALIDATOR_ADDRESS=${validator_address}' >> $CONFIG_FILE_PATH
echo 'ATTESTATION_SIGNER_ADDRESS=${attestation_signer_address}' >> $CONFIG_FILE_PATH

echo 'SMS_PROVIDERS=twilio,nexmo' >> $CONFIG_FILE_PATH

echo 'PORT=80' >> $CONFIG_FILE_PATH

echo 'NEXMO_KEY=${nexmo_api_key}' >> $CONFIG_FILE_PATH
echo 'NEXMO_SECRET=${nexmo_api_secret}' >> $CONFIG_FILE_PATH
echo 'NEXMO_ACCOUNT_BALANCE_METRIC=0' >> $CONFIG_FILE_PATH
echo 'NEXMO_UNSUPPORTED_REGIONS=${nexmo_unsupported_regions}' >> $CONFIG_FILE_PATH

echo 'TWILIO_ACCOUNT_SID=${twilio_account_sid}' >> $CONFIG_FILE_PATH
echo 'TWILIO_MESSAGING_SERVICE_SID=${twilio_messaging_service_sid}' >> $CONFIG_FILE_PATH
echo 'TWILIO_VERIFY_SERVICE_SID=${twilio_verify_service_sid}' >> $CONFIG_FILE_PATH
echo 'TWILIO_AUTH_TOKEN=${twilio_auth_token}' >> $CONFIG_FILE_PATH
echo 'TWILIO_UNSUPPORTED_REGIONS=${twilio_unsupported_regions}' >> $CONFIG_FILE_PATH

echo 'MAX_DELIVERY_ATTEMPTS=2' >> $CONFIG_FILE_PATH
echo 'VERIFY_CONFIG_ON_STARTUP=1' >> $CONFIG_FILE_PATH

echo 'LOG_FORMAT=json' >> $CONFIG_FILE_PATH
echo 'LOG_LEVEL=info' >> $CONFIG_FILE_PATH


ATTESTATION_SERVICE_CLOUDWATCH_LOG_GROUP_NAME=${cloudwatch_attestation_service_log_group_name}
ATTESTATION_SERVICE_CLOUDWATCH_LOG_STREAM_NAME=${cloudwatch_attestation_service_log_stream_name}

if [[ -z $ATTESTATION_SERVICE_CLOUDWATCH_LOG_GROUP_NAME || -z $ATTESTATION_SERVICE_CLOUDWATCH_LOG_STREAM_NAME ]]; then
  DOCKER_LOGGING_PARAMS=''
else
  DOCKER_LOGGING_PARAMS="--log-driver=awslogs --log-opt awslogs-group=$ATTESTATION_SERVICE_CLOUDWATCH_LOG_GROUP_NAME --log-opt awslogs-stream=$ATTESTATION_SERVICE_CLOUDWATCH_LOG_STREAM_NAME"
fi

docker run -d --name celo-attestation-service $DOCKER_LOGGING_PARAMS --restart always --entrypoint /bin/bash --network host --env-file $CONFIG_FILE_PATH -p 80:80 $CELO_IMAGE_ATTESTATION -c " cd /celo-monorepo/packages/attestation-service && yarn run db:migrate && yarn start "
