#!/bin/bash
echo "Optional: Pass argument in the form of --settings ..."
certoraRun specs/harnesses/RegistryHarness.sol:RegistryHarness \
    specs/harnesses/ElectionHarness.sol:ElectionHarness \
    specs/harnesses/LockedGoldHarness.sol \
    specs/harnesses/GoldTokenHarness.sol \
    contracts/common/Accounts.sol \
    --link ElectionHarness:lockedGold=LockedGoldHarness ElectionHarness:accounts=Accounts \
    --verify ElectionHarness:specs/election.spec \
    --settings -assumeUnwindCond \
    --path $PWD/contracts $1
