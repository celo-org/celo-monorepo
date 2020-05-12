pragma specify 0.1

/**
 * Example Usage:
 * `certoraRun.py locked_gold.conf  --path $PWD/contracts/  --cache celolockedloop3unwind --settings -patient=0,-b=3,-assumeUnwindCond`
 */

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
}

/**
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

/**
 * Total here refers to the sum of address balance and locked gold (voting and nonvoting). 
 */
rule totalPreserved(address account, method f) {
	// We assume the sender is not the currentContract
	require(account != currentContract);
	uint256 _ercBalance = sinvoke ercBalanceOf(account); 
	uint256 _accountNonVoting = sinvoke getAccountNonvotingLockedGold(account);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(account);
	// We limit the amount of pending records due to loop handling 
	require sinvoke getPendingWithdrawalsLength(account) <= 1;
	env eF;
	require(eF.msg.sender == account);
	// These three function are exceptions to the rule (they are designed to affect total)
	require(
    f.selector != decrementNonvotingAccountBalance(address,uint256).selector &&
    f.selector != incrementNonvotingAccountBalance(address,uint256).selector &&
    f.selector != slash(address,uint256,address,uint256,address[],address[],uint256[]).selector
  );
	calldataarg arg;
	sinvoke f(eF,arg);
	// We limit the amount of pending records due to loop handling 
	uint length = sinvoke getPendingWithdrawalsLength(account);
	require(length <= 1);
	uint256 ercBalance_ = sinvoke ercBalanceOf(account);
	uint256 accountNonVoting_ = sinvoke getAccountNonvotingLockedGold(account);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(account);
  assert(
    _ercBalance + _accountNonVoting + _accountTotalPendingWithdrawals ==
    ercBalance_ + accountNonVoting_ + accountTotalPendingWithdrawals_,
    "Total of tokens not preserved"
  );
}

/**
 * An address' total gold cannot be changed by any other contract's function calls.
 */
rule noChangeByOther(address a, address b, method f) {
	require(a != b);
	// We assume the sender is not the currentContract
	require(
    a != currentContract &&
    (a == sinvoke getGoldTokenExt() => f.selector != withdraw(uint256).selector));
	uint256 _ercBalance = sinvoke ercBalanceOf(a);
	uint256 _accountNonVoting = sinvoke getAccountNonvotingLockedGold(a);
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
	uint256 ercBalance_ = sinvoke ercBalanceOf(a); 
	uint256 accountNonVoting_ = sinvoke getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	assert(_ercBalance == ercBalance_, "Unexpected change to erc tokens");
	assert(_accountTotalPendingWithdrawals == accountTotalPendingWithdrawals_, "Unexpected change to total pending");
	assert(_accountNonVoting == accountNonVoting_, "Unexpected change to account nonvoting");
}

/**
 * This rule verifies the Certora Prover is correctly modeling the behavior of GoldToken._transfer.
 */
rule withdraw(uint256 index) {
	env e;
	uint256 _balance = sinvoke ercBalanceOf(e.msg.sender);
	uint256 val = sinvoke getPendingWithdrawalsIndex(e.msg.sender, index);
	sinvoke withdraw(e, index);
	require (e.msg.sender != currentContract);
	uint256 balance_ = sinvoke ercBalanceOf(e.msg.sender);
	assert(
    _balance + val == balance_,
    "Withdraw balance not updated"
  );
}

/**
 * Verifies that withdraws do not occur before the unlocking period has passed.
 */
rule noWithdrawBeforeUnlocking(address account, uint256 value, method f) {
	// We must make sure the length of pending withdrawals is not MAX_UINT, since then the `push` will make the length 0.
	// (this should have been checked by the solidity compiler)
	require(sinvoke pendingWithdrawalsNotFull(account), "Pending withdrawals are full");
	
	// Unlock a value and add it to pending withdrawals
	env _e;
	require(_e.msg.sender == account);
	sinvoke unlock(_e,value);

	// Try to run any function - adversary's goal is to succeed in unlocking before time
	env eF;
	require(eF.block.timestamp > _e.block.timestamp);
	calldataarg arg;
	sinvoke f(eF,arg);
	// We check if adversary succeeded
	uint256 totalPendingWithdrawals_ = sinvoke getTotalPendingWithdrawals(account);
	assert(
    eF.block.timestamp < _e.block.timestamp + sinvoke getunlockingPeriod() =>
    sinvoke getAccountNonvotingLockedGold(account) + totalPendingWithdrawals_ >= value,
    "If we are before the unlock period passed, we cannot transfer the value outside the locked balance or pending balance"
  );
}

/**
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

/**
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
