# !/bin/bash
CELO_IMAGE=${celo_image}
NETWORK_ID=${celo_network_id}

NODE_DIRECTORY=/home/ubuntu/celo-validator-node

mkdir $NODE_DIRECTORY
cd $NODE_DIRECTORY
CELO_VALIDATOR_SIGNER_ADDRESS=${validator_signer_address}

PROXY_ENODE=${proxy_enode}
PROXY_INTERNAL_IP=${proxy_internal_ip}
PROXY_EXTERNAL_IP=${proxy_external_ip}

echo -n '${validator_signer_private_key_password}' > .password
docker run -v $PWD:/root/.celo --rm $CELO_IMAGE init /celo/genesis.json
echo -n '${validator_signer_private_key_file_contents}' > keystore/${validator_signer_private_key_filename}

CLOUDWATCH_LOG_GROUP_NAME=${cloudwatch_log_group_name}
CLOUDWATCH_LOG_STREAM_NAME=${cloudwatch_log_stream_name}

if [[ -z $CLOUDWATCH_LOG_GROUP_NAME || -z $CLOUDWATCH_LOG_STREAM_NAME ]]; then
  DOCKER_LOGGING_PARAMS=''
else
  DOCKER_LOGGING_PARAMS="--log-driver=awslogs --log-opt awslogs-group=$CLOUDWATCH_LOG_GROUP_NAME --log-opt awslogs-stream=$CLOUDWATCH_LOG_STREAM_NAME"
fi

docker run -d --name celo-validator $DOCKER_LOGGING_PARAMS --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --nousb --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303 --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --ethstats=${validator_name}@${ethstats_host}

