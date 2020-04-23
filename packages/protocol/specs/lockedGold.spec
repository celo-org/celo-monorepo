pragma specify 0.1

methods { 
	init_state() 
	getNonvotingLockedGold() returns uint256 envfree	
	getAccountNonvotingLockedGold(address)  returns uint256 envfree
	ercBalanceOf(address) returns uint256 envfree
	getTotalPendingWithdrawals(address) returns uint256 envfree
	getPendingWithdrawalsLength(address) returns uint256 envfree
	getPendingWithdrawalsIndex(address,uint256) returns uint256 envfree	
	getunlockingPeriod() returns uint256 envfree
	incrementNonvotingAccountBalance(address, uint256) 
	decrementNonvotingAccountBalance(address, uint256) 
	unlock(uint256) 
	pendingWithdrawalsNotFull(address) returns bool envfree
	getGoldTokenExt() returns address envfree
	isAccount(address) returns bool envfree
}


rule totalNonVotingGEAccountNonVoting(address a,method f)  {
	require sinvoke getNonvotingLockedGold() >= sinvoke getAccountNonvotingLockedGold(a);
	require f.selector!=decrementNonvotingAccountBalance(address,uint256).selector && f.selector!=incrementNonvotingAccountBalance(address,uint256).selector;
	env eF; 
	require (f.selector!=unlock(uint256).selector	|| eF.msg.sender==a) &&  f.selector != slash(address,uint256,address,uint256,address[],address[],uint256[]).selector;
	calldataarg arg;
	sinvoke f(eF,arg);
	assert sinvoke getNonvotingLockedGold() >= sinvoke getAccountNonvotingLockedGold(a);
	
}


/* One can transfer erc token to non voting
then move non voting to pending 
then withdraw.
That is, the total amount of: ERC tokens (balance) AND totalPending AND nonVoting is fixed
*/

rule totalPreserved( address a,  method f)
{
	//we assume the sender is not the currentContract
	require a!=currentContract;
	uint256 _ercBalance = sinvoke ercBalanceOf(a); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(a);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(a);
	env eF;
	require eF.msg.sender==a;
	//this two function breaks the rule 
	require f.selector!=decrementNonvotingAccountBalance(address,uint256).selector && f.selector!=incrementNonvotingAccountBalance(address,uint256).selector
	&& f.selector != slash(address,uint256,address,uint256,address[],address[],uint256[]).selector;
	calldataarg arg;
	sinvoke f(eF,arg);
	uint256 ercBalance_ = sinvoke ercBalanceOf(a); 
	uint256 accoutNonVoting_ = sinvoke getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	assert _ercBalance + _accoutNonVoting + _accountTotalPendingWithdrawals == ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_ , "Total of tokens not preserved";
}

/*
one's nonvoting value,  erc balance and pending values can not be changed by other 
*/

rule noChangeByOther( address a, address b, method f )
{
	require a!=b;
	//we assume the sender is not the currentContract
	require a!=currentContract && 
			(a == sinvoke getGoldTokenExt() => f.selector != withdraw(uint256).selector);
	uint256 _ercBalance = sinvoke ercBalanceOf(a); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(a);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(a);
	env eF;
	require eF.msg.sender==b;
	calldataarg arg;
	require f.selector!=decrementNonvotingAccountBalance(address,uint256).selector &&
			f.selector!=incrementNonvotingAccountBalance(address,uint256).selector && 
			f.selector != slash(address,uint256,address,uint256,address[],address[],uint256[]).selector;
	sinvoke f(eF,arg);
	uint256 ercBalance_ = sinvoke ercBalanceOf(a); 
	uint256 accoutNonVoting_ = sinvoke getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	assert _ercBalance == ercBalance_, "unexpected change to erc tokens";
	assert _accountTotalPendingWithdrawals == accountTotalPendingWithdrawals_, "unexpected change to total pending";
	assert _accoutNonVoting == accoutNonVoting_, "unexpected change to account nonvoting" ;
}



rule withdraw(uint256 index)
{
	env e;
	
	uint256 _balance = sinvoke ercBalanceOf(e.msg.sender);
	uint256 val = sinvoke getPendingWithdrawalsIndex(e.msg.sender,index);	
	require (e.msg.sender != currentContract);
	sinvoke withdraw(e,index);
	uint256 balance_ = sinvoke ercBalanceOf(e.msg.sender);
	assert balance_ ==_balance+val;
}



rule noWithdrawBeforeUnlocking(address account, uint256 value, method f) {
	// we must make sure the length of pending withdrawals is not MAX_UINT, since then the `push` will make the length 0.
	// (this should have been checked by the solidity compiler)
	require sinvoke pendingWithdrawalsNotFull(account);
	
	// unlock a value and add it to pending withdrawals
	env _e;
	require _e.msg.sender == account; 
	sinvoke unlock(_e,value);

	// try to run any function - adversary's goal is to succeed in unlocking before time
	env eF;
	require eF.block.timestamp > _e.block.timestamp; 
	calldataarg arg;
	sinvoke f(eF,arg);

	// we check if adversary succeeded
	uint256 totalPendingWithdrawals_ = sinvoke getTotalPendingWithdrawals(account);
	assert  eF.block.timestamp < _e.block.timestamp + sinvoke getunlockingPeriod() =>
		sinvoke getAccountNonvotingLockedGold(account) + totalPendingWithdrawals_ >= value, "If we are before the unlock period passed, we cannot transfer the value outside the locked balance or pending balance";
}





// initialization rules
rule only_initializer_changes_initialized_field(method f) {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = sinvoke initialized(_e);
	
	require f.selector != initialize(address,uint256).selector;
	calldataarg arg;
	invoke f(eF,arg);
	
	bool isInitialized_ = sinvoke initialized(e_);
	
	assert _isInitialized == isInitialized_, "Method $f is not expected to change initialization field from ${_isInitialized} to ${isInitialized_}";
}

rule check_initializer {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = sinvoke initialized(_e);
	
	calldataarg arg;
	invoke initialize(eF,arg);
	bool successInit = !lastReverted;
	
	bool isInitialized_ = sinvoke initialized(e_);
	
	assert _isInitialized => !successInit, "initialize() must revert if already initialized";
	assert successInit => isInitialized_, "When initialize() succeeds, must set initialization field to true";
}

invariant nonAccountDoesNotHavePending(address a)
	!invoke isAccount(a) => invoke getTotalPendingWithdrawals(a) == 0