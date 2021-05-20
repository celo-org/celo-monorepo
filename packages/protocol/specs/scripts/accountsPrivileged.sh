certoraRun.py specs/harnesses/AccountsHarness.sol \
	--verify AccountsHarness:specs/accountsPrivileged.spec \
	--optimistic_loop \
	--loop_iter 2 \
	--cache celo_accounts \
	--solc_args "['--evm-version', 'istanbul']" \
	--msg "Accounts privilege check"
