#! /bin/bash
CELO_IMAGE=${celo_image}
NETWORK_ID=${celo_network_id}
CELO_VALIDATOR_SIGNER_ADDRESS=${validator_signer_address}

NODE_DIRECTORY=/home/ubuntu/celo-proxy-node

mkdir $NODE_DIRECTORY
cd $NODE_DIRECTORY
docker run -v $PWD:/root/.celo --rm $CELO_IMAGE init /celo/genesis.json

BOOTNODE_ENODES="$(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"
PROXY_ADDRESS=${proxy_address}
echo -n '${proxy_private_key_password}' > .password
echo -n '${proxy_private_key_file_contents}' > keystore/${proxy_private_key_filename}
echo -n '${proxy_node_private_key}' > .nodeprivatekey

docker run -d --name celo-proxy --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $PROXY_ADDRESS --unlock $PROXY_ADDRESS --password /root/.celo/.password --allow-insecure-unlock --bootnodes $BOOTNODE_ENODES --ethstats=${validator_name}@${ethstats_host} --nodekey /root/.celo/.nodeprivatekey
