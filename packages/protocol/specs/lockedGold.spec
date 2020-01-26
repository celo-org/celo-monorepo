pragma specify 0.1
/*
  certoraRun.py locked_gold.conf  --path $PWD/contracts/  --cache celolockedloop3unwind --settings -patient=0,-b=3,-assumeUnwindCond

*/

methods { 
	init_state() 
	getNonvotingLockedGold() returns uint256 envfree	
	getAccountNonvotingLockedGold(address)  returns uint256 envfree
	ercBalanceOf(address) returns uint256
	getTotalPendingWithdrawals(address) returns uint256 envfree
	getPendingWithdrawalsLength(address) returns uint256 envfree
	getPendingWithdrawalsIndex(address,uint256) returns uint256 envfree	
	getunlockingPeriod() returns uint256 envfree
	incrementNonvotingAccountBalance(address, uint256) 
	decrementNonvotingAccountBalance(address, uint256) 
	unlock(uint256) 
}

//for any address a, the totalNonVoting is always larget than the address' nonvoting gold

// invariant totalNonVotingGEAccountNonVoting(env e, address a) 
			// sinvoke getNonvotingLockedGold() >= sinvoke getAccountNonvotingLockedGold(a) 
			// {
		// preserved incrementNonvotingAccountBalance(env e, address account, uint256 value) {
			// require false;
		// }
		// preserved decrementNonvotingAccountBalance(env e,address account, uint256 value) {
			// require false;
		// }
		//preserved unlock(env e, uint256 value) {
		//need a way to express that env.msg.sender==a
		//for now just writing it as a regular rule
			// require e.msg.sender==a;
		// }
	// }

rule totalNonVotingGEAccountNonVoting(address a,method f)  {
	require sinvoke getNonvotingLockedGold() >= sinvoke getAccountNonvotingLockedGold(a);
	require f.selector!=decrementNonvotingAccountBalance(address,uint256).selector && f.selector!=incrementNonvotingAccountBalance(address,uint256).selector;
	env eF; 
	require f.selector!=unlock(uint256).selector	|| eF.msg.sender==a;
	calldataarg arg;
	sinvoke f(eF,arg);
	assert sinvoke getNonvotingLockedGold() >= sinvoke getAccountNonvotingLockedGold(a);
	
}


/* One can tranfer erc token to non voting
then move non voting to pending 
then withdraw.
That is, the total amount of: ERC tokens (balance) AND totalPending AND nonVoting is fixed
*/

rule totalPreserved( address a,  method f)
{
	env e;
	require e.msg.sender==a;
	//we assume the sender is not the currentContract
	require a!=currentContract;
	uint256 _ercBalance = sinvoke ercBalanceOf(e,a); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(a);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(a);
	// we limit the amount of pending records due to loop handling 
	require sinvoke getPendingWithdrawalsLength(a) <= 1;
	env eF;
	require eF.msg.sender==a;
	//this two function breaks the rule 
	require f.selector!=decrementNonvotingAccountBalance(address,uint256).selector && f.selector!=incrementNonvotingAccountBalance(address,uint256).selector;
	calldataarg arg;
	sinvoke f(eF,arg);
	// we limit the amount of pending records due to loop handling 
	uint length = sinvoke getPendingWithdrawalsLength(a);
	require length <= 1;
	uint256 ercBalance_ = sinvoke ercBalanceOf(e,a); 
	uint256 accoutNonVoting_ = sinvoke getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	assert _ercBalance + _accoutNonVoting + _accountTotalPendingWithdrawals == ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_ , "Total of tokens not preserved";
}

/*
one's nonvoting value,  erc balance and pending values can not be changed by other 
*/

rule noChangeByOther( address a, address b, method f )
{
	env e;
	require a!=b;
	require e.msg.sender==a;
	//we assume the sender is not the currentContract
	require a!=currentContract;
	uint256 _ercBalance = sinvoke ercBalanceOf(e,a); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(a);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(a);
	// we limit the amount of pending records due to loop handling 
	uint length = sinvoke getPendingWithdrawalsLength(a);
	require length <= 1;
	env eF;
	require eF.msg.sender==b;
	calldataarg arg;
	require f.selector!=decrementNonvotingAccountBalance(address,uint256).selector && f.selector!=incrementNonvotingAccountBalance(address,uint256).selector;
	sinvoke f(eF,arg);
	uint256 ercBalance_ = sinvoke ercBalanceOf(e,a); 
	uint256 accoutNonVoting_ = sinvoke getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	assert _ercBalance == ercBalance_, "unexpected change to erc tokens";
	assert _accountTotalPendingWithdrawals == accountTotalPendingWithdrawals_, "unexpected change to total pending";
	assert _accoutNonVoting == accoutNonVoting_, "unexpected change to account nonvoting" ;
}




// The withdraw rules checks that Certora Prover is modeling correctly the TRANSFER function that is called
// from GoldToken._transfer
rule withdraw(uint256 index)
{
	env e;
	
	uint256 _balance = sinvoke ercBalanceOf(e, e.msg.sender);
	uint256 val = sinvoke getPendingWithdrawalsIndex(e.msg.sender,index);
	uint length = sinvoke getPendingWithdrawalsLength(e.msg.sender);
	require index < length;
	require val	>0;
	env eNew;
	require eNew.msg.sender == e.msg.sender;
	sinvoke withdraw(eNew,index);
	uint256 balance_ = sinvoke ercBalanceOf(e, e.msg.sender);
	assert balance_ ==_balance;
	//assert false, "expecing withdraw to change balancae ";
	

}



rule noWithdrawBeforeUnlocking(address account, uint256 value, method f) {
	env _e;
	require _e.msg.sender == account; 
	sinvoke unlock(_e,value);
	uint256 _total = sinvoke getTotalPendingWithdrawals(account);
	env eF;
	require eF.block.timestamp > _e.block.timestamp; 
	calldataarg arg;
	sinvoke f(eF,arg);
	env e_;
	require _e.msg.sender == account; 
	require _e.block.timestamp > eF.block.timestamp;
	uint256 total_ = sinvoke getTotalPendingWithdrawals(account);
	assert  e_.block.timestamp < _e.block.timestamp + sinvoke getunlockingPeriod() =>
		total_ >= value;
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

/*
A simple query to check which methods can change balance
rule whoChangesBalance(address a,method f)
{
	env _e;
	uint256 _balance = sinvoke ercBalanceOf(_e, a);	
	env eF;
	calldataarg arg;
	sinvoke f(eF,arg);
	env e_;
	uint256 balance_ = sinvoke ercBalanceOf(e_, a);
	assert balance_ ==_balance;
	
}
*/
