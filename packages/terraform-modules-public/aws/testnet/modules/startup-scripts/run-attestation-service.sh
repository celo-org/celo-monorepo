#! /bin/bash

export CELO_IMAGE=${celo_image}
export NETWORK_ID=${celo_network_id}
export CELO_VALIDATOR_ADDRESS=${validator_address}
NODE_DIRECTORY=/home/ubuntu/celo-attestations-node

mkdir $NODE_DIRECTORY
cd $NODE_DIRECTORY

docker run -v $PWD:/root/.celo --rm $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES=`docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes`

export CELO_ATTESTATION_SIGNER_ADDRESS=${attestation_signer_address}
echo -n '${attestation_signer_private_key_password}' > .password
echo -n '${attestation_signer_private_key_file_contents}' > keystore/${attestation_signer_private_key_filename}

docker run -d --name celo-attestations --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --nousb --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin --unlock $CELO_ATTESTATION_SIGNER_ADDRESS --password /root/.celo/.password --bootnodes $BOOTNODE_ENODES

export CELO_IMAGE_ATTESTATION=${celo_image_attestation}
export CELO_PROVIDER=http://localhost:8545

export DATABASE_URL=${database_url}
export TWILIO_MESSAGING_SERVICE_SID=${twilio_messaging_service_sid}
export TWILIO_ACCOUNT_SID=${twilio_account_sid}
export TWILIO_BLACKLIST=${twilio_blacklist}
export TWILIO_AUTH_TOKEN=${twilio_auth_token}

docker run -d --name celo-attestation-service --restart always --entrypoint /bin/bash --network host -e ATTESTATION_SIGNER_ADDRESS=0x$CELO_ATTESTATION_SIGNER_ADDRESS -e CELO_VALIDATOR_ADDRESS=0x$CELO_VALIDATOR_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=twilio -e TWILIO_MESSAGING_SERVICE_SID=$TWILIO_MESSAGING_SERVICE_SID -e TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID -e TWILIO_BLACKLIST=$TWILIO_BLACKLIST -e TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN -e PORT=80 -p 80:80 $CELO_IMAGE_ATTESTATION -c " cd /celo-monorepo/packages/attestation-service && yarn run db:migrate && yarn start "


