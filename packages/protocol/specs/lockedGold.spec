pragma specify 0.1

/*
 * Example Usage:
 * `certoraRun.py locked_gold.conf  --path $PWD/contracts/  --cache celolockedloop3unwind --settings -patient=0,-b=3,-assumeUnwindCond`
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

/*
 * Account's nonvoting gold cannot exceed total locked nonvoting gold.
 */
rule totalNonVotingGEAccountNonVoting(address a, method f) {
	require(sinvoke getNonvotingLockedGold()  >= sinvoke getAccountNonvotingLockedGold(a));
	require(
    f.selector != decrementNonvotingAccountBalance(address,uint256).selector &&
    f.selector != incrementNonvotingAccountBalance(address,uint256).selector
  );
	env eF; 
	require(
    (f.selector != unlock(uint256).selector || eF.msg.sender == a) &&
    f.selector != slash(address,uint256,address,uint256,address[],address[],uint256[]).selector
  );
	calldataarg arg;
	sinvoke f(eF,arg);
	assert(sinvoke getNonvotingLockedGold() >= sinvoke getAccountNonvotingLockedGold(a));
}

/* 
 * Total here refers to the sum of address balance and locked gold (voting and nonvoting). 
 */
rule totalPreserved(address a, method f) {
	env e;
	require(e.msg.sender == a);
	// We assume the sender is not the currentContract
	require(a != currentContract);
	uint256 _ercBalance = sinvoke ercBalanceOf(e,a); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(a);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(a);
	// We limit the amount of pending records due to loop handling 
	require(sinvoke getPendingWithdrawalsLength(a) <= 1);
	env eF;
	require(eF.msg.sender == a);
	// These two function are exceptions to the rule (they are meant to affect total)
	require(
    f.selector != decrementNonvotingAccountBalance(address,uint256).selector &&
    f.selector != incrementNonvotingAccountBalance(address,uint256).selector &&
    f.selector != slash(address,uint256,address,uint256,address[],address[],uint256[]).selector
  );
	calldataarg arg;
	sinvoke f(eF,arg);
	// We limit the amount of pending records due to loop handling 
	uint length = sinvoke getPendingWithdrawalsLength(a);
	require(length <= 1);
	uint256 ercBalance_ = sinvoke ercBalanceOf(e,a);
	uint256 accoutNonVoting_ = sinvoke getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	assert(_ercBalance == ercBalance_, "Unexpected change to erc tokens");
	assert(_accountTotalPendingWithdrawals == accountTotalPendingWithdrawals_, "Unexpected change to total pending");
	assert(_accoutNonVoting == accoutNonVoting_, "Unexpected change to account nonvoting");
}

/*
 * An address' total gold cannot be changed by any other contract's function calls.
 */
rule noChangeByOther(address a, address b, method f) {
	env e;
	require(a != b);
	require(e.msg.sender == a);
	// We assume the sender is not the currentContract
	require(a != currentContract);
	uint256 _ercBalance = sinvoke ercBalanceOf(e,a);
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(a);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(a);
	// We limit the amount of pending records due to loop handling 
	uint length = sinvoke getPendingWithdrawalsLength(a);
	require(length <= 1);
	env eF;
	require(eF.msg.sender == b);
	calldataarg arg;
	require(
    f.selector != decrementNonvotingAccountBalance(address,uint256).selector &&
    f.selector != incrementNonvotingAccountBalance(address,uint256).selector &&
    f.selector != slash(address,uint256,address,uint256,address[],address[],uint256[]).selector
  );
	sinvoke f(eF,arg);
	uint256 ercBalance_ = sinvoke ercBalanceOf(e,a);
	uint256 accoutNonVoting_ = sinvoke getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	assert(_ercBalance == ercBalance_, "Unexpected change to erc tokens");
	assert(_accountTotalPendingWithdrawals == accountTotalPendingWithdrawals_, "Unexpected change to total pending");
	assert(_accoutNonVoting == accoutNonVoting_, "Unexpected change to account nonvoting");
}

/*
 * This rule verifies the Certora Prover is correctly modeling the behavior of GoldToken._transfer.
 */
rule withdraw(uint256 index) {
	env e;
	uint256 _balance = sinvoke ercBalanceOf(e, e.msg.sender);
	uint256 val = sinvoke getPendingWithdrawalsIndex(e.msg.sender,index);
	uint length = sinvoke getPendingWithdrawalsLength(e.msg.sender);
	require(index < length);
	require(val	> 0);
	env eNew;
	require(eNew.msg.sender == e.msg.sender);
	sinvoke withdraw(eNew,index);
	uint256 balance_ = sinvoke ercBalanceOf(eNew, eNew.msg.sender);
	assert(balance_ + val ==_balance);
}

/*
 * Verifies that withdraws do not occur before the unlocking period has passed.
 */
rule noWithdrawBeforeUnlocking(address account, uint256 value, method f) {
	env _e;
	require(_e.msg.sender == account);
	sinvoke unlock(_e,value);
	uint256 _total = sinvoke getTotalPendingWithdrawals(account);
	env eF;
	require(eF.block.timestamp > _e.block.timestamp);
	calldataarg arg;
	sinvoke f(eF,arg);
	env e_;
	require(_e.msg.sender == account);
	require(_e.block.timestamp > eF.block.timestamp);
	uint256 total_ = sinvoke getTotalPendingWithdrawals(account);
	assert(
    e_.block.timestamp < _e.block.timestamp + sinvoke getunlockingPeriod() =>
		total_ >= value
  );
}

/*
 * Verifies initialization value does not change.
 */
rule only_initializer_changes_initialized_field(method f) {
	env _e;
	env eF;
	env e_;

	bool _isInitialized = sinvoke initialized(_e);
	require(f.selector != initialize(address,uint256).selector);
	calldataarg arg;
	invoke f(eF,arg);
	bool isInitialized_ = sinvoke initialized(e_);
	assert(
    _isInitialized == isInitialized_,
    "Method $f is not expected to change initialization field from ${_isInitialized} to ${isInitialized_}"
  );
}

/*
 * Verifies `initialize` behaves correctly:
 * Reverts if already initialized,
 * Sets initialized to true if not.
 */
rule check_initializer {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = sinvoke initialized(_e);
	calldataarg arg;
	invoke initialize(eF,arg);
	bool successInit = !lastReverted;
	bool isInitialized_ = sinvoke initialized(e_);
	assert(
    _isInitialized => !successInit,
    "Initialize() must revert if already initialized"
  );
	assert(
    successInit => isInitialized_,
    "When initialize() succeeds, must set initialization field to true"
  );
}