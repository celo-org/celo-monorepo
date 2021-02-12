echo "Pass argument in the form of --settings ..."
certoraRun.py specs/harnesses/BeneficiaryHarness.sol:Beneficiary specs/harnesses/RegistryHarness.sol:RegistryHarness specs/harnesses/ReleaseGoldHarness.sol:ReleaseGoldHarness specs/harnesses/ElectionHarness.sol:ElectionHarness specs/harnesses/LockedGoldHarness.sol:LockedGoldHarness contracts/common/Accounts.sol:Accounts --link ReleaseGoldHarness:lockedGold2=LockedGoldHarness ReleaseGoldHarness:election=ElectionHarness  ElectionHarness:lockedGold=LockedGoldHarness  ReleaseGoldHarness:accounts=Accounts  ElectionHarness:accounts=Accounts LockedGoldHarness:accounts=Accounts ReleaseGoldHarness:beneficiary=Beneficiary --verify ReleaseGoldHarness:specs/releaseGold.spec --settings -assumeUnwindCond,-enableWildcardInlining=false --path $PWD/contracts $1




