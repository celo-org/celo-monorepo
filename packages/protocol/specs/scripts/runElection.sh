certoraRun specs/harnesses/RegistryHarness.sol:RegistryHarness \
    specs/harnesses/ElectionHarness.sol:ElectionHarness \
    specs/harnesses/LockedGoldHarness.sol \
    specs/harnesses/GoldTokenHarness.sol \
    contracts/common/Accounts.sol \
    --link ElectionHarness:lockedGold=LockedGoldHarness \
    --link ElectionHarness:accounts=Accounts \
    --verify ElectionHarness:specs/election.spec \
    --settings -assumeUnwindCond \
    --solc solc5.17 \
    --path $PWD/contracts \
    --cloud --msg "$1"
