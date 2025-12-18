#!/usr/bin/env bash
set -euo pipefail

# addresses
MOCKED_DEPLOYER=0x95FFAC468e37DdeEF407FfEf18f0cC9E86D8f13B

# multisigs
PARENT_MULTISIG=0x4092A77bAF58fef0309452cEaCb09221e556E112
CLABS_MULTISIG=0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d
COUNCIL_MULTISIG=0xC03172263409584f7860C25B6eB4985f0f6F4636

# optionally allow to specify signer
EXTERNAL_ACCOUNT=${ACCOUNT:-}
EXTERNAL_TEAM=${TEAM:-}
GRAND_CHILD_MULTISIG=${GC_MULTISIG:-}

# determine if using internal signers
USE_INTERNAL_CLABS=$([ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "clabs" ] && echo "true" || echo "false")
USE_INTERNAL_COUNCIL=$([ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "council" ] && echo "true" || echo "false")

if [ -n "$EXTERNAL_ACCOUNT" ]; then
  echo "Detected external account: $EXTERNAL_ACCOUNT"
  case $EXTERNAL_TEAM in
    "clabs"|"council")
      echo "Detected valid team: $EXTERNAL_TEAM"
      ;;
    *)
      echo "Invalid team: $EXTERNAL_TEAM" && exit 1
      ;;
  esac
fi
if [ -n "$GRAND_CHILD_MULTISIG" ] && [ "$EXTERNAL_TEAM" != "council" ]; then
  echo "Grand Child multisig is not supported for other team than council" && exit 1
fi

# signers
[ "$USE_INTERNAL_CLABS" = "true" ] && [ -z "${MOCKED_SIGNER_1:-}" ] && echo "Need to set the MOCKED_SIGNER_1 via env" && exit 1
[ "$USE_INTERNAL_CLABS" = "false" ] && MOCKED_SIGNER_1=$EXTERNAL_ACCOUNT
[ -z "${MOCKED_SIGNER_2:-}" ] && echo "Need to set the MOCKED_SIGNER_2 via env" && exit 1
[ "$USE_INTERNAL_COUNCIL" = "true" ] && [ -z "${MOCKED_SIGNER_3:-}" ] && echo "Need to set the MOCKED_SIGNER_3 via env" && exit 1
[ "$USE_INTERNAL_COUNCIL" = "false" ] && MOCKED_SIGNER_3=$EXTERNAL_ACCOUNT
[ -z "${MOCKED_SIGNER_4:-}" ] && echo "Need to set the MOCKED_SIGNER_4 via env" && exit 1

# validate signer ordering
if [ "$USE_INTERNAL_CLABS" = "true" ] && [[ ${MOCKED_SIGNER_1:2,,} > ${MOCKED_SIGNER_2:2,,} ]]; then
  echo "Error: MOCKED_SIGNER_1 must be < MOCKED_SIGNER_2 (addresses must be in ascending order)" && exit 1
fi
if [ "$USE_INTERNAL_COUNCIL" = "true" ] && [[ ${MOCKED_SIGNER_3:2,,} > ${MOCKED_SIGNER_4:2,,} ]]; then
  echo "Error: MOCKED_SIGNER_3 must be < MOCKED_SIGNER_4 (addresses must be in ascending order)" && exit 1
fi

# safe internal
SENTINEL_ADDRESS=0x0000000000000000000000000000000000000001

# rpc
RPC_URL=http://127.0.0.1:8545

# set 10_000 ETH on mocked owner
echo "Mock accounts balance"
cast rpc anvil_setBalance $MOCKED_DEPLOYER 0x21e19e0c9bab2400000 -r $RPC_URL
cast rpc anvil_setBalance $MOCKED_SIGNER_1 0x21e19e0c9bab2400000 -r $RPC_URL
cast rpc anvil_setBalance $MOCKED_SIGNER_2 0x21e19e0c9bab2400000 -r $RPC_URL
cast rpc anvil_setBalance $MOCKED_SIGNER_3 0x21e19e0c9bab2400000 -r $RPC_URL
cast rpc anvil_setBalance $MOCKED_SIGNER_4 0x21e19e0c9bab2400000 -r $RPC_URL

# change threshold of signers to 2 for each multisig
echo "Change treshold for multisigs"
cast rpc anvil_setStorageAt $PARENT_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000004 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL
cast rpc anvil_setStorageAt $CLABS_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000004 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL
cast rpc anvil_setStorageAt $COUNCIL_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000004 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL

# change threshold to 1 for Grand Child multisig
if [ -n "$GRAND_CHILD_MULTISIG" ]; then
  cast rpc anvil_setStorageAt $GRAND_CHILD_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000004 0x0000000000000000000000000000000000000000000000000000000000000001 -r $RPC_URL
fi

# change owner count to 2 for each multisig
echo "Change owner count for multisigs"
cast rpc anvil_setStorageAt $PARENT_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL
cast rpc anvil_setStorageAt $CLABS_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL
cast rpc anvil_setStorageAt $COUNCIL_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL

# change owner count to 1 for Grand Child multisig
if [ -n "$GRAND_CHILD_MULTISIG" ]; then
  cast rpc anvil_setStorageAt $GRAND_CHILD_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000001 -r $RPC_URL
fi

# mock ownership circular linked list
echo "Mock ownership for multisigs"
# [Parent]
# Sentinel -> cLabs
SENTINEL_SLOT=$(cast index address 0x0000000000000000000000000000000000000001 2)
cast rpc anvil_setStorageAt $PARENT_MULTISIG $SENTINEL_SLOT 0x000000000000000000000000${CLABS_MULTISIG:2} -r $RPC_URL
# cLabs -> Council
CLABS_SLOT=$(cast index address 0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d 2)
cast rpc anvil_setStorageAt $PARENT_MULTISIG $CLABS_SLOT 0x000000000000000000000000${COUNCIL_MULTISIG:2} -r $RPC_URL
# Council -> Sentinel
COUNCIL_SLOT=$(cast index address 0xC03172263409584f7860C25B6eB4985f0f6F4636 2)
cast rpc anvil_setStorageAt $PARENT_MULTISIG $COUNCIL_SLOT 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
# [cLabs]
# Sentinel -> Signer #1
cast rpc anvil_setStorageAt $CLABS_MULTISIG $SENTINEL_SLOT 0x000000000000000000000000${MOCKED_SIGNER_1:2} -r $RPC_URL
# Signer #1 -> Signer #2
SIGNER_1_SLOT=$(cast index address $MOCKED_SIGNER_1 2)
cast rpc anvil_setStorageAt $CLABS_MULTISIG $SIGNER_1_SLOT 0x000000000000000000000000${MOCKED_SIGNER_2:2} -r $RPC_URL
# Signer #2 -> Sentinel
SIGNER_2_SLOT=$(cast index address $MOCKED_SIGNER_2 2)
cast rpc anvil_setStorageAt $CLABS_MULTISIG $SIGNER_2_SLOT 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
# [Council]
if [ -z "$GRAND_CHILD_MULTISIG" ]; then
  # Sentinel -> Signer #3
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SENTINEL_SLOT 0x000000000000000000000000${MOCKED_SIGNER_3:2} -r $RPC_URL
  # Signer #3 -> Signer #4
  SIGNER_3_SLOT=$(cast index address $MOCKED_SIGNER_3 2)
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SIGNER_3_SLOT 0x000000000000000000000000${MOCKED_SIGNER_4:2} -r $RPC_URL
  # Signer #4 -> Sentinel
  SIGNER_4_SLOT=$(cast index address $MOCKED_SIGNER_4 2)
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SIGNER_4_SLOT 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
else
  if [[ ${GRAND_CHILD_MULTISIG:2,,} < ${MOCKED_SIGNER_4:2,,} ]]; then
    # Sentinel -> Grand Child
    cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SENTINEL_SLOT 0x000000000000000000000000${GRAND_CHILD_MULTISIG:2} -r $RPC_URL
    # Grand Child -> Signer #4
    GC_SLOT=$(cast index address $GRAND_CHILD_MULTISIG 2)
    cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $GC_SLOT 0x000000000000000000000000${MOCKED_SIGNER_4:2} -r $RPC_URL
    # Signer #4 -> Sentinel
    SIGNER_4_SLOT=$(cast index address $MOCKED_SIGNER_4 2)
    cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SIGNER_4_SLOT 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
  else
    # Sentinel -> Signer #4
    cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SENTINEL_SLOT 0x000000000000000000000000${MOCKED_SIGNER_4:2} -r $RPC_URL
    # Signer #4 -> Grand Child
    SIGNER_4_SLOT=$(cast index address $MOCKED_SIGNER_4 2)
    cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SIGNER_4_SLOT 0x000000000000000000000000${GRAND_CHILD_MULTISIG:2} -r $RPC_URL
    # Grand Child -> Sentinel
    GC_SLOT=$(cast index address $GRAND_CHILD_MULTISIG 2)
    cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $GC_SLOT 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
  fi

  # GC Sentinel -> Signer #3
  cast rpc anvil_setStorageAt $GRAND_CHILD_MULTISIG $SENTINEL_SLOT 0x000000000000000000000000${MOCKED_SIGNER_3:2} -r $RPC_URL
  # Signer #3 -> GC Sentinel
  SIGNER_3_SLOT=$(cast index address $MOCKED_SIGNER_3 2)
  cast rpc anvil_setStorageAt $GRAND_CHILD_MULTISIG $SIGNER_3_SLOT 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
fi

# validate safe correctly mocked
echo "Validation"
echo "--- Parent ---"
echo "Parent threshold: $(cast call $PARENT_MULTISIG "getThreshold()(uint256)" -r $RPC_URL)"
echo "Parent owners: $(cast call $PARENT_MULTISIG "getOwners()(address[])" -r $RPC_URL)"
echo "Parent signer is cLabs: $(cast call $PARENT_MULTISIG "isOwner(address)(bool)" $CLABS_MULTISIG -r $RPC_URL)"
echo "Parent signer is Council: $(cast call $PARENT_MULTISIG "isOwner(address)(bool)" $COUNCIL_MULTISIG -r $RPC_URL)"
echo "--- cLabs ---"
echo "cLabs threshold: $(cast call $CLABS_MULTISIG "getThreshold()(uint256)" -r $RPC_URL)"
echo "cLabs owners: $(cast call $CLABS_MULTISIG "getOwners()(address[])" -r $RPC_URL)"
echo "cLabs signer is Signer #1: $(cast call $CLABS_MULTISIG "isOwner(address)(bool)" $MOCKED_SIGNER_1 -r $RPC_URL)"
echo "cLabs signer is Signer #2: $(cast call $CLABS_MULTISIG "isOwner(address)(bool)" $MOCKED_SIGNER_2 -r $RPC_URL)"
echo "--- Council ---"
echo "Council threshold: $(cast call $COUNCIL_MULTISIG "getThreshold()(uint256)" -r $RPC_URL)"
echo "Council owners: $(cast call $COUNCIL_MULTISIG "getOwners()(address[])" -r $RPC_URL)"
if [ -z "$GRAND_CHILD_MULTISIG" ]; then
  echo "Council signer is Signer #3: $(cast call $COUNCIL_MULTISIG "isOwner(address)(bool)" $MOCKED_SIGNER_3 -r $RPC_URL)"
  echo "Council signer is Signer #4: $(cast call $COUNCIL_MULTISIG "isOwner(address)(bool)" $MOCKED_SIGNER_4 -r $RPC_URL)"
else
  echo "Council signer is Grand Child: $(cast call $COUNCIL_MULTISIG "isOwner(address)(bool)" $GRAND_CHILD_MULTISIG -r $RPC_URL)"
  echo "Council signer is Signer #4: $(cast call $COUNCIL_MULTISIG "isOwner(address)(bool)" $MOCKED_SIGNER_4 -r $RPC_URL)"
  echo "--- Grand Child ---"
  echo "Grand Child threshold: $(cast call $GRAND_CHILD_MULTISIG "getThreshold()(uint256)" -r $RPC_URL)"
  echo "Grand Child owners: $(cast call $GRAND_CHILD_MULTISIG "getOwners()(address[])" -r $RPC_URL)"
  echo "Grand Child signer is Signer #3: $(cast call $GRAND_CHILD_MULTISIG "isOwner(address)(bool)" $MOCKED_SIGNER_3 -r $RPC_URL)"
fi
