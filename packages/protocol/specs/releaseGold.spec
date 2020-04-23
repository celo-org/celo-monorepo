methods {
	getTotalBalance() returns uint256
	ercBalancebeneficiary() returns uint256 envfree
	releaseTime() returns uint256 envfree
	MAX_WITHDRAWL() returns uint256 envfree
	getTotalReward() returns uint256 envfree
	getTotalWithdrawn() returns uint256 envfree
	getPendingWithdrawalsLength() returns uint256 envfree 
	getAuthorizedBy() returns address envfree
	isAccount(address) returns bool envfree
	getTotalPendingWithdrawals(address) returns uint256 envfree
}

/*
Distributivity to avoid frauds and lock
withdrawal of x+y can be performed either instantly or gradually.

withdraw(x);withdraw(y)  ⟺  withdraw(x+y)

split to two rules for checking successfulness: left implication and right implications (distributivityLeft, distributivityRight).
Another rule checks properties of the state (distributivityState).
*/

rule distributivityLeft(uint256 x, uint256 y) {
	env e;
	require e.msg.sender != currentContract;
	require x > 0 && y > 0;
	storage init = lastStorage;	
	sinvoke withdraw(e, x);
	sinvoke withdraw(e, y);  
	invoke withdrawalPossible(e, x+y) at init;
	bool withdrawXY = !lastReverted;
	assert withdrawXY;
}

rule distributivityRight(uint256 x, uint256 y) {
	env e;
	require e.msg.sender != currentContract;
	require x > 0 && y > 0;
	storage init = lastStorage;	
	sinvoke withdraw(e, x);
	invoke withdrawalPossible(e, y);  
	bool withdrawY = !lastReverted;
	sinvoke withdraw(e, x+y) at init;
	assert withdrawY;
}

rule distributivityState(uint256 x, uint256 y) {
	env e;
	env eOp2;
	require e.msg.sender != currentContract;
	require eOp2.msg.sender == e.msg.sender;
	require eOp2.block.timestamp == e.block.timestamp;
	
	storage init = lastStorage;	
	sinvoke withdraw(e, x);
	sinvoke withdraw(e, y);  
	uint256 totalAfterOp1 = sinvoke getTotalWithdrawn();
	uint256 balanceOp1 = sinvoke getTotalBalance(e);
	uint256 beneficiaryOp1 = sinvoke ercBalancebeneficiary();
	
	sinvoke withdraw(eOp2, x+y) at init;
	uint256 totalAfterOp2 = sinvoke getTotalWithdrawn();
	uint256 balanceOp2 = sinvoke getTotalBalance(eOp2);
	uint256 beneficiaryOp2 = sinvoke  ercBalancebeneficiary();
	
	assert totalAfterOp1 == totalAfterOp2 && 
			balanceOp1 == balanceOp2 && 
			beneficiaryOp1 == beneficiaryOp2;
}

/*
Withdraw not locked
Eventually withdrawal up to total of MAX_WITHDRAWL will be possible  
0 < x ≤ totalBalance() - totalWithdrawn() && globally no withdraw ⟹ ◇ withdraw(x) 

This rule is proven by showing inductively that each withdraw reduces the amount to be withdrawn 
*/
rule eventuallyWithdraw(uint256 x,uint diff) {
	env e;
	env eFuture;
	require e.msg.sender != currentContract;
	require diff ==  sinvoke getTotalBalance(e) - sinvoke getTotalWithdrawn();
	require x > 0;
	require eFuture.msg.sender == e.msg.sender;
	require eFuture.block.timestamp >= e.block.timestamp;
	sinvoke withdraw(eFuture,x);
	assert sinvoke getTotalBalance(eFuture) - sinvoke getTotalWithdrawn() < diff;
}

/*
totalBalance is monotonic increasing 
*/
rule totalBalanceMonotonic(method f) {
	env _e;
	env eF;
	env e_;
	
    require eF.block.timestamp >= _e.block.timestamp;
    require e_.block.timestamp >= eF.block.timestamp;
	
	// refundAndFinalize does reduce the total balance
	require f.selector != refundAndFinalize().selector;
	
	// exception for authorize* functions that transfer 1 ether:
	uint256 deltaForFunding = 0;
	if (f.selector == 0x0fa750d2 /*authorizeValidatorSignerWithPublicKey(address,uint8,bytes32,bytes32,bytes).selector*/ ||
		f.selector == 0x1465b923 /*authorizeValidatorSignerWithKeys(address,uint8,bytes32,bytes32,bytes,bytes,bytes).selector*/ ||
		f.selector == /*0x4282ee6d*/ authorizeVoteSigner(address,uint8,bytes32,bytes32).selector || 
		f.selector == /*0xbaf7ef0f*/ authorizeValidatorSigner(address,uint8,bytes32,bytes32).selector) {
		deltaForFunding = 1000000000000000000; // 1 ether
	} else {
		deltaForFunding = 0;
	}
	
	// release gold should not get authorization from anyone
	require (sinvoke getAuthorizedBy() == 0); 
	
	// assume release gold is not calling itself
	require (eF.msg.sender != currentContract);  

	uint256 _totalBalance = sinvoke getTotalBalance(_e);
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	uint256 totalBalance_ = sinvoke getTotalBalance(e_);
	
	assert _totalBalance <= totalBalance_ + deltaForFunding, "Total Balance is not increasing";
}

/*
Max limit to avoid frauds (without election rewards)
Total of amount to be withdrawn is limited by MAX_WITHDRAWL 
	
withdraw(x) ⟹ totalWithdrawn() + x ≤ MAX_WITHDRAWL + totalReward()
Since this condition holds in the initialization of the contract we prove it by invariant:
assume that it holds before operation and prove that it still hold after every operation.
*/
rule limitedWithdraw(method f)  // this rule is expected to fail only on the payable fallback function
{
	env _e;
	require f.selector != withdrawalPossible(uint256).selector; // harness-only function
	
	// release gold should not get authorization from anyone
	require sinvoke getAuthorizedBy()==0;
	
	require eF.msg.sender != currentContract;
	require !sinvoke isAccount(currentContract) => sinvoke getTotalPendingWithdrawals(currentContract) == 0; // for createAccount

	uint256 MAX = sinvoke MAX_WITHDRAWL();
	uint256 _totalReward =  sinvoke getTotalReward();
	uint256 _totalWithdrawn = sinvoke getTotalWithdrawn();
	require _totalWithdrawn <=  MAX + _totalReward;
	require sinvoke getTotalBalance(_e) <=  MAX + _totalReward;
	
	env eF;
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF, arg);
	uint256 totalReward_ =  sinvoke getTotalReward();
	uint256 totalWithdrawn_ = sinvoke getTotalWithdrawn();
	assert totalWithdrawn_ <=  MAX + totalReward_, "Total withdrawn is going beyond max withdrawal and total reward";
	assert sinvoke getTotalBalance(_e) <=  MAX + totalReward_, "Total balance is going beyond max withdrawal and total reward";
}