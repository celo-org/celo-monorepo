# Celo-Blockchain End-to-End Tests

Celotool includes a command (`celotooljs.sh geth simulate-client`) to execute small transactions, with the goal of simulate activity on the network.
In addition to that, there is available helm charts to run t threads of this command, each thread connected to a different celo-blockchain light client.

## Setup

To run the load tests on a Kubernetes testnet, execute the next procedure/commands:

1. Edit your .env file with the versions and variables used for your testnet. Particularly, for the load test configuration you need to configure at this point the LOAD_TEST_CLIENTS and LOAD_TEST_THREADS variables as the will be used to fauceting the needed accounts on the genesis block.
1. Deploy the new testnet: `celotooljs.sh deploy initial testnet -e <env>`
1. Deploy blockscout for the testnet: `celotooljs.sh deploy initial blockscout -e <env>`. Once deployed, you should be able to connect to blockscout at url https://<env>.blockscout.celo-networks-dev.org
1. Deploy the contracts: `celotooljs.sh deploy initial contracts -e <env>`
1. Deploy the load-test package: `celotooljs.sh deploy upgrade load-test -e <env> --blockscout-measure-percent <blockscout_check_percentage> --delay <delay_ms> --replicas <replicas> --threads <threads>`. Take into consideration that the <blockscout-measure-percent> if differs from 0 will affect the delay between transactions (delay) considerably.
