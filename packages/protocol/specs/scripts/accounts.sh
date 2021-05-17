certoraRun specs/harnesses/AccountsHarness.sol \
	--verify AccountsHarness:specs/accounts.spec \
	--optimistic_loop \
	--solc_args "['--evm-version', 'istanbul']" \
	--msg "Accounts"
