#!/usr/bin/env bash
# Verify the 4 v17 implementation contracts (deployed via make-release -s) on both
# Blockscout and Celoscan. Params mirror make-release.ts (compiler/optimizer/evm/libs/ctor).
set -u

RPC=https://forno.celo-sepolia.celo-testnet.org
CK="${CELOSCAN_API_KEY:?set CELOSCAN_API_KEY}"
BS_URL="https://celo-sepolia.blockscout.com/api/"
CS_URL="https://api.etherscan.io/v2/api?chainid=11142220"
CHAINID=11142220
CTOR=$(cast abi-encode "constructor(bool)" false)

# name addr profile compiler evm opt sourceFile libArg
ROWS=(
 "Election|0x7163b1886b28aca949d0a3b8ebc4f222f4597e6d|truffle-compat|0.5.14+commit.01f1aaa4|istanbul|off|contracts/governance/Election.sol|contracts/common/linkedlists/AddressSortedLinkedList.sol:AddressSortedLinkedList:0xba17388e5cd20d8bccf814b2437ef01e8760f311"
 "FeeHandler|0x58533c0fc81b14201fdb1d2af974ad84624cf784|truffle-compat|0.5.14+commit.01f1aaa4|istanbul|off|contracts/common/FeeHandler.sol|"
 "EpochManager|0x0f6b6abc0feb23048e4b870e7f17c0e6b5e66792|truffle-compat8|0.8.19+commit.7dd6d404|paris|200|contracts-0.8/common/EpochManager.sol|"
 "Validators|0xf1c1963185cee9c2c223a0cc4b7d6345b7706db7|truffle-compat8|0.8.19+commit.7dd6d404|paris|200|contracts-0.8/governance/Validators.sol|contracts-0.8/common/linkedlists/AddressLinkedList.sol:AddressLinkedList:0x4f8e3c856e5c6eab0228a4f8f5883c975e92a39c"
)

verify() { # $1=verifier-flags-string  $2=label
  local VFLAGS="$1" LABEL="$2"
  for row in "${ROWS[@]}"; do
    IFS='|' read -r name addr profile compiler evm opt src lib <<< "$row"
    local cmd=(forge verify-contract --rpc-url "$RPC" "$addr" "${src}:${name}"
      $VFLAGS --compiler-version "$compiler" --evm-version "$evm"
      --constructor-args "$CTOR" --watch --retries 3)
    [ "$opt" != "off" ] && cmd+=(--num-of-optimizations "$opt")
    [ -n "$lib" ] && cmd+=(--libraries "$lib")
    echo "### [$LABEL] $name -> $addr"
    FOUNDRY_PROFILE="$profile" "${cmd[@]}" 2>&1 | grep -iE "success|verified|already|error|fail|Pass - Verified|Response" | head -4
    echo ""
  done
}

echo "============ BLOCKSCOUT ============"
verify "--verifier blockscout --verifier-url $BS_URL" BS
echo "============ CELOSCAN ============"
verify "--verifier etherscan --verifier-url $CS_URL --etherscan-api-key $CK --chain-id $CHAINID" CS
