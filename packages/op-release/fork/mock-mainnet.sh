#!/usr/bin/env bash
set -euo pipefail

# addresses
MOCKED_DEPLOYER=0xe571b94CF7e95C46DFe6bEa529335f4A11d15D92

# multisigs
PARENT_MULTISIG=0x4092A77bAF58fef0309452cEaCb09221e556E112
CLABS_MULTISIG=0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d
COUNCIL_MULTISIG=0xC03172263409584f7860C25B6eB4985f0f6F4636

# optionally allow to specify signer
EXTERNAL_ACCOUNT=${ACCOUNT:-}
EXTERNAL_TEAM=${TEAM:-}
GRAND_CHILD_MULTISIG=${GC_MULTISIG:-}
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
if [ -n $GRAND_CHILD_MULTISIG ] && [ $EXTERNAL_TEAM != "council" ]; then
  echo "Grand Child multisig is not supported for other team than council" && exit 1
fi

# signers
if [ -z "$EXTERNAL_ACCOUNT" ] || [ $EXTERNAL_TEAM != "clabs" ]; then
  MOCKED_SIGNER_1=0x899a864C6bE2c573a98d8493961F4D4c0F7Dd0CC
else
  MOCKED_SIGNER_1=$EXTERNAL_ACCOUNT
fi
MOCKED_SIGNER_2=0x865d05C8bB46E7AF16D6Dc99ddfb2e64BBec1345
if [ -z "$EXTERNAL_ACCOUNT" ] || [ $EXTERNAL_TEAM != "council" ]; then
  MOCKED_SIGNER_3=0x8Af6f11c501c082bD880B3ceC83e6bB249Fa32c9
else
  MOCKED_SIGNER_3=$EXTERNAL_ACCOUNT
fi
MOCKED_SIGNER_4=0x480C5f2340f9E7A46ee25BAa815105B415a7c2e2

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
if [ -n $GRAND_CHILD_MULTISIG ]; then
  cast rpc anvil_setStorageAt $GRAND_CHILD_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000004 0x0000000000000000000000000000000000000000000000000000000000000001 -r $RPC_URL
fi

# change owner count to 2 for each multisig
echo "Change owner count for multisigs"
cast rpc anvil_setStorageAt $PARENT_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL
cast rpc anvil_setStorageAt $CLABS_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL
cast rpc anvil_setStorageAt $COUNCIL_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000002 -r $RPC_URL

# change owner count to 1 for Grand Child multisig
if [ -n $GRAND_CHILD_MULTISIG ]; then
  cast rpc anvil_setStorageAt $GRAND_CHILD_MULTISIG 0x0000000000000000000000000000000000000000000000000000000000000003 0x0000000000000000000000000000000000000000000000000000000000000001 -r $RPC_URL
fi

# mock ownership circular linked list
echo "Mock ownership for multisigs"
# [Parent]
# Sentinel -> cLabs: cast index address 0x0000000000000000000000000000000000000001 2 -> 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0
cast rpc anvil_setStorageAt $PARENT_MULTISIG 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0 0x000000000000000000000000${CLABS_MULTISIG:2} -r $RPC_URL
# cLabs -> Council: cast index address 0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d 2 -> 0x5b5e035df6c1a9a21134237fdf27807e2ca7277585a03f98b7ba4aa54655d04b
cast rpc anvil_setStorageAt $PARENT_MULTISIG 0x5b5e035df6c1a9a21134237fdf27807e2ca7277585a03f98b7ba4aa54655d04b 0x000000000000000000000000${COUNCIL_MULTISIG:2} -r $RPC_URL
# Council -> Sentinel: cast index address 0xC03172263409584f7860C25B6eB4985f0f6F4636 2 -> 0x08e26275bfea81cb6e947a60aee1cbc0cc1f1a12f3a95cfa65148dacd0073117
cast rpc anvil_setStorageAt $PARENT_MULTISIG 0x08e26275bfea81cb6e947a60aee1cbc0cc1f1a12f3a95cfa65148dacd0073117 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
# [cLabs]
# Sentinel -> Signer #1: cast index address 0x0000000000000000000000000000000000000001 2 -> 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0
cast rpc anvil_setStorageAt $CLABS_MULTISIG 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0 0x000000000000000000000000${MOCKED_SIGNER_1:2} -r $RPC_URL
# Signer #1 -> Signer #2: cast index address 0x899a864C6bE2c573a98d8493961F4D4c0F7Dd0CC 2 -> 0xd83831d8a3ca91174d10befe3df8237dcbd55304e78f35811970b244f55f7a2b
SIGNER_1_SLOT=$(cast index address $MOCKED_SIGNER_1 2)
cast rpc anvil_setStorageAt $CLABS_MULTISIG $SIGNER_1_SLOT 0x000000000000000000000000${MOCKED_SIGNER_2:2} -r $RPC_URL
# Signer #2 -> Sentinel: cast index address 0x865d05C8bB46E7AF16D6Dc99ddfb2e64BBec1345 2 -> 0x18877be3912428d756ff6389ee4e71768eb68d3e723f7c81e68919c0a11fe761
cast rpc anvil_setStorageAt $CLABS_MULTISIG 0x18877be3912428d756ff6389ee4e71768eb68d3e723f7c81e68919c0a11fe761 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
# [Council]
if [ -z $GRAND_CHILD_MULTISIG ]; then
  # Sentinel -> Signer #3: cast index address 0x0000000000000000000000000000000000000001 2 -> 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0 0x000000000000000000000000${MOCKED_SIGNER_3:2} -r $RPC_URL
  # Signer #3 -> Signer #4: cast index address 0x8Af6f11c501c082bD880B3ceC83e6bB249Fa32c9 2 -> 0xfe2b681ac5bf197b6e6f3e6e8cb27c9abb3fa4018a18e1b5762ed302770b84e2
  SIGNER_3_SLOT=$(cast index address $MOCKED_SIGNER_3 2)
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $SIGNER_3_SLOT 0x000000000000000000000000${MOCKED_SIGNER_4:2} -r $RPC_URL
  # Signer #4 -> Sentinel: cast index address 0x480C5f2340f9E7A46ee25BAa815105B415a7c2e2 2 -> 0x883764c79926d22363d1b43b74bf18b5fea9f5910c70a2339193beb7bfdd7279
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG 0x883764c79926d22363d1b43b74bf18b5fea9f5910c70a2339193beb7bfdd7279 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL
else
  # Sentinel -> Grand Child: cast index address 0x0000000000000000000000000000000000000001 2 -> 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0 0x000000000000000000000000${GRAND_CHILD_MULTISIG:2} -r $RPC_URL
  # Grand Child -> Signer #4
  GC_SLOT=$(cast index address $GRAND_CHILD_MULTISIG 2)
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG $GC_SLOT 0x000000000000000000000000${MOCKED_SIGNER_4:2} -r $RPC_URL
  # Signer #4 -> Sentinel: cast index address 0x480C5f2340f9E7A46ee25BAa815105B415a7c2e2 2 -> 0x883764c79926d22363d1b43b74bf18b5fea9f5910c70a2339193beb7bfdd7279
  cast rpc anvil_setStorageAt $COUNCIL_MULTISIG 0x883764c79926d22363d1b43b74bf18b5fea9f5910c70a2339193beb7bfdd7279 0x000000000000000000000000${SENTINEL_ADDRESS:2} -r $RPC_URL

  # GC Sentinel -> Signer #3: cast index address 0x0000000000000000000000000000000000000001 2 -> 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0
  cast rpc anvil_setStorageAt $GRAND_CHILD_MULTISIG 0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0 0x000000000000000000000000${MOCKED_SIGNER_3:2} -r $RPC_URL
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
if [ -z $GRAND_CHILD_MULTISIG ]; then
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
