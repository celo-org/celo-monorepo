#! /bin/bash
CELO_IMAGE=${celo_image}
CELO_VALIDATOR_SIGNER_ADDRESS=${validator_signer_address}

NODE_DIRECTORY=/home/ubuntu/celo-proxy-node

mkdir $NODE_DIRECTORY
cd $NODE_DIRECTORY

PROXY_ADDRESS=${proxy_address}
echo -n '${proxy_private_key_password}' > .password
echo -n '${proxy_private_key_file_contents}' > keystore/${proxy_private_key_filename}

CLOUDWATCH_LOG_GROUP_NAME=${cloudwatch_log_group_name}
CLOUDWATCH_LOG_STREAM_NAME=${cloudwatch_log_stream_name}

if [[ -z $CLOUDWATCH_LOG_GROUP_NAME || -z $CLOUDWATCH_LOG_STREAM_NAME ]]; then
  DOCKER_LOGGING_PARAMS=''
else
  DOCKER_LOGGING_PARAMS="--log-driver=awslogs --log-opt awslogs-group=$CLOUDWATCH_LOG_GROUP_NAME --log-opt awslogs-stream=$CLOUDWATCH_LOG_STREAM_NAME"
fi

# Adapted from https://docs.celo.org/getting-started/baklava-testnet/running-a-validator-in-baklava#deploy-a-proxy
docker run -d --name celo-proxy $DOCKER_LOGGING_PARAMS --restart unless-stopped \
  -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp \
  -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --syncmode full \ 
  --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 \ 
  --etherbase $PROXY_ADDRESS --unlock $PROXY_ADDRESS --password /root/.celo/.password \
  --allow-insecure-unlock --baklava --datadir /root/.celo \
  --celostats=${validator_name}@${ethstats_host}