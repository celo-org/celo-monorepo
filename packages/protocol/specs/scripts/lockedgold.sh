certoraRun specs/harnesses/GoldTokenHarness.sol specs/harnesses/LockedGoldHarness.sol \
  --link LockedGoldHarness:goldToken=GoldTokenHarness \
  --verify LockedGoldHarness:specs/lockedGold.spec \
  --optimistic_loop \
  --short_output \
  --msg "LockedGold" \
