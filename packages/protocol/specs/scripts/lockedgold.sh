certoraRun specs/harnesses/GoldTokenHarness.sol specs/harnesses/LockedGoldHarness.sol \
	--link LockedGoldHarness:goldToken=GoldTokenHarness \
	--verify LockedGoldHarness:specs/lockedGold.spec \
	--optimistic_loop \
	--settings -ciMode=true \
	--msg "LockedGold" \
	--solc_args "['--evm-version', 'istanbul']"
