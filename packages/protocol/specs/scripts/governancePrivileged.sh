certoraRun specs/harnesses/GovernanceHarness.sol contracts/common/Accounts.sol \
	--verify GovernanceHarness:specs/governancePrivileged.spec \
	--cache governance \
	--optimistic_loop \
	--solc_args "['--evm-version', 'istanbul']" \
	--settings -ciMode=true \
	--msg "Governance privilege check" 