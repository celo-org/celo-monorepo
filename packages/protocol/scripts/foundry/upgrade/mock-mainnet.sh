#!/usr/bin/env bash
set -euo pipefail

MOCKED_OWNER=0xe571b94CF7e95C46DFe6bEa529335f4A11d15D92

# set 10_000 ETH on mocked owner
cast rpc anvil_setBalance $MOCKED_OWNER 0x21e19e0c9bab2400000 --rpc-url http://127.0.0.1:8545
