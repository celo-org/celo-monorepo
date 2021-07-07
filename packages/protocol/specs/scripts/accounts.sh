certoraRun specs/harnesses/AccountsHarness.sol \
	--verify AccountsHarness:specs/accounts.spec \
	--optimistic_loop \
	--loop_iter 2 \
	--cache accounts \
	--solc_args "['--evm-version', 'istanbul']" \
	--settings -ciMode=true \
	--msg "Accounts" 
