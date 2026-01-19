#!/usr/bin/env bash

# Require env vars
[ -z "${BLOCKSCOUT_API_KEY:-}" ] && echo "Need to set the BLOCKSCOUT_API_KEY via env" && exit 1;
[ -z "${BLOCKSCOUT_URL:-}" ] && echo "Need to set the BLOCKSCOUT_URL via env (example value: https://celo-sepolia.blockscout.com/api)" && exit 1;
[ -z "${CHAIN_ID:-}" ] && echo "Need to set the CHAIN_ID via env (example value: 11142220)" && exit 1;
[ -z "${RPC_URL:-}" ] && echo "Need to set the RPC_URL via env (example value: https://forno.celo-sepolia.celo-testnet.org)" && exit 1;

verify() {
    CONSTRUCTOR_SIG=${3:-}
    echo ">>> [Blockscout] $2"
    if [ -z ${CONSTRUCTOR_SIG:-} ]; then
        forge verify-contract $1 $2 \
            --chain-id $CHAIN_ID \
            --etherscan-api-key=$BLOCKSCOUT_API_KEY \
            --verifier-url=$BLOCKSCOUT_URL \
            --verifier=blockscout \
            --watch
    else
        forge verify-contract $1 $2 \
            --chain-id $CHAIN_ID \
            --etherscan-api-key=$BLOCKSCOUT_API_KEY \
            --verifier-url=$BLOCKSCOUT_URL \
            --verifier=blockscout \
            --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
            --watch
    fi
    echo "----------------------------------------"
}

verify_proxy() {
    IMPL_SLOT="0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" # keccak256("eip1967.proxy.implementation")
    IMPL_ADDRESS_B32=$(cast storage $1 $IMPL_SLOT -r $RPC_URL)
    IMPL_ADDRESS=$(cast parse-bytes32-address $IMPL_ADDRESS_B32)
    echo "Proxy: $1 Impl: $IMPL_ADDRESS"
    verify $IMPL_ADDRESS ${@:2}
}

echo ">>> Verifying core contracts on Celo Sepolia"
# registry
REGISTRY_ADDRESS="0x000000000000000000000000000000000000ce10"
GET_ADDR="getAddressForStringOrDie(string)(address)"
verify_proxy $REGISTRY_ADDRESS "Registry"

# freezer
FREEZER_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Freezer" -r $RPC_URL)
verify_proxy $FREEZER_ADDRESS "Freezer"

# fee currency directory
FCD_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "FeeCurrencyDirectory" -r $RPC_URL)
verify_proxy $FCD_ADDRESS "FeeCurrencyDirectory"

# celo token
CT_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "CeloToken" -r $RPC_URL)
verify_proxy $CT_ADDRESS "GoldToken"

# sorted oracles
SO_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "SortedOracles" -r $RPC_URL)
verify_proxy $SO_ADDRESS "SortedOracles"

# reserve spender multisig
RSM_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "ReserveSpenderMultiSig" -r $RPC_URL)
verify_proxy $RSM_ADDRESS "ReserveSpenderMultiSig"

# reserve
RESERVE_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Reserve" -r $RPC_URL)
verify_proxy $RESERVE_ADDRESS "Reserve"

# stable tokens
STABLE_TOKENS=$(cast call $RESERVE_ADDRESS "getTokens()(address[])" -r $RPC_URL)
STABLE_TOKENS=$(echo "$STABLE_TOKENS" | sed -e 's/^\[//' -e 's/\]$//' -e 's/, /\n/g')
echo "$STABLE_TOKENS" | while IFS= read -r TOKEN_ADDRESS; do
  echo "Token address: $TOKEN_ADDRESS"
  verify_proxy $TOKEN_ADDRESS "StableToken"
done

# exchange
EXCHANGE_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Exchange" -r $RPC_URL)
verify_proxy $EXCHANGE_ADDRESS "Exchange"

# accounts
ACCOUNTS_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Accounts" -r $RPC_URL)
verify_proxy $ACCOUNTS_ADDRESS "Accounts"

# locked celo
LC_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "LockedCelo" -r $RPC_URL)
verify_proxy $LC_ADDRESS "LockedGold"

# validators
VALIDATORS_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Validators" -r $RPC_URL)
verify_proxy $VALIDATORS_ADDRESS "Validators"

# election
ELECTION_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Election" -r $RPC_URL)
verify_proxy $ELECTION_ADDRESS "Election"

# epoch rewards
ER_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "EpochRewards" -r $RPC_URL)
verify_proxy $ER_ADDRESS "EpochRewards"

# escrow
ESCROW_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Escrow" -r $RPC_URL)
verify_proxy $ESCROW_ADDRESS "Escrow"

# governance slasher
GS_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "GovernanceSlasher" -r $RPC_URL)
verify_proxy $GS_ADDRESS "GovernanceSlasher"

# federated attestations
FA_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "FederatedAttestations" -r $RPC_URL)
verify_proxy $FA_ADDRESS "FederatedAttestations"

# mento fee handler seller
MFAS_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "MentoFeeHandlerSeller" -r $RPC_URL)
verify_proxy $MFAS_ADDRESS "MentoFeeHandlerSeller"

# uniswap fee handler seller
UFHS_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "UniswapFeeHandlerSeller" -r $RPC_URL)
verify_proxy $UFHS_ADDRESS "UniswapFeeHandlerSeller"

# fee handler
FH_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "FeeHandler" -r $RPC_URL)
verify_proxy $FH_ADDRESS "FeeHandler"

# odis payments
OP_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "OdisPayments" -r $RPC_URL)
verify_proxy $OP_ADDRESS "OdisPayments"

# celo unreleased treasury
CUT_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "CeloUnreleasedTreasury" -r $RPC_URL)
verify_proxy $CUT_ADDRESS "CeloUnreleasedTreasury"

# epoch manager enabler
EME_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "EpochManagerEnabler" -r $RPC_URL)
verify_proxy $EME_ADDRESS "EpochManagerEnabler"

# epoch manager
EM_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "EpochManager" -r $RPC_URL)
verify_proxy $EM_ADDRESS "EpochManager"

# score manager
SM_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "ScoreManager" -r $RPC_URL)
verify_proxy $SM_ADDRESS "ScoreManager"

# governance
GOV_ADDRESS=$(cast call $REGISTRY_ADDRESS "$GET_ADDR" "Governance" -r $RPC_URL)
verify_proxy $GOV_ADDRESS "Governance"

echo ">>> Finished verifying contracts on Celo Sepolia"
