pragma specify 0.1

methods {
	init_state() 
	isAccount(address) returns bool	envfree
	_getAuthorizedBy(address) returns address envfree
	_getDataEncryptionKeyLen(address) returns uint256 
	_getNameLen(address) returns uint256 
	getWalletAddress(address) returns address envfree
	_getAttestationSigner(address) returns address envfree
	_getVoteSigner(address) returns address envfree
	_getValidatorSigner(address) returns address envfree
}

// If an address x, is not an account then all mapping from x should be empty
 invariant account_empty_if_not_exist(address x) 
	!invoke isAccount(x) => 
	 	(
			invoke getWalletAddress(x) == 0 && 
			invoke _getAttestationSigner(x) == 0 && 
			invoke _getVoteSigner(x) == 0 && 
			invoke _getValidatorSigner(x) == 0
		)

// An address d that is authorized by some account x can not become an account
invariant address_cant_be_both_account_and_signer(address x, address d) 
	(x != 0 && d != 0 && x != d && invoke _getAuthorizedBy(d) == x) => 
	 	(invoke isAccount(x) && !invoke isAccount(d))


//A current signer d or account x should be authorizedby 
invariant address_signer_if_authorizedby(address x, address d) 
	(x != 0 && d != 0 && x != d && 
		(invoke _getAttestationSigner(x) == d || 
			invoke _getVoteSigner(x) == d || 
			invoke _getValidatorSigner(x) == d)
	) =>  
		(invoke isAccount(x) && invoke _getAuthorizedBy(d) == x)

// Given  account x address d a current signer, then d can not be a current signer of account y
rule address_cant_be_both_authorizedby_of_two_address(address x, address y, address d, method f) { 
	// x and y are accounts d is authorizedby x
	require  x != 0 && y != 0 && d != 0 && x != d && y != x && y != d;  
	require invoke isAccount(x) && invoke _getAuthorizedBy(d) == x;
	require invoke isAccount(y);
	// assume that d is a current signer of x at least of one type
	require invoke _getAttestationSigner(x) == d || invoke _getVoteSigner(x) == d || invoke _getValidatorSigner(x) == d;
	// assume that d is not a current signer of y of any of one type
	require invoke _getAttestationSigner(y) != d && invoke _getVoteSigner(y) != d && invoke _getValidatorSigner(y) != d;
	// simulate all possible execution of all methods
	env eF;
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	// check that still d is not a current signer of y of any type
	assert 	invoke _getAttestationSigner(y) != d && 
			invoke _getVoteSigner(y) != d && 
			invoke _getValidatorSigner(y) != d, "authorized by account x is now a signer  also for y";
}

// Account x can authorize different addresses
rule address_can_authorize_two_address(address x, address d1, address d2, method f)
{ 
	require x != 0 && d1 != 0 && d2 != 0 && x != d1 && x != d2 && d1 != d2 && invoke isAccount(x); 
	env e;
	require e.msg.sender == x;
	// let's authorize d1 for vote and take into account only traces that succeed
	// thus we know that d1 is not an account nor authorized by other account
	uint8 v1;
	bytes32 r1;
	bytes32 s1;
	sinvoke authorizeVoteSigner(e,d1,v1,r1,s1);
	
	
	// let's authorize d2 as signer
	uint8 v2;
	bytes32 r2;
	bytes32 s2;
	sinvoke authorizeValidatorSigner(e,d2,v2,r2,s2);  
	
	// simulate all transactions from all possible users 
	env eF;
	calldataarg arg;	
	require !f.isView;
	sinvoke f(eF,arg);
	
	// AuthorizedBy(d1) and AuthorizedBy(d2) should still be x
	assert invoke _getAuthorizedBy(d1) == x  && invoke _getAuthorizedBy(d2) == x, "authorizedBy is not correct";
}

/*
AuthorizedBy is not removed.
on every possible scenario (invocation of some method f) either:
- before, it was not a signer 
or 
- it is authorized by the same address
*/
rule authorizedBy_can_not_be_removed(method f, address signer)
{
	// signer cannot change from non-zero to non-zero
	address _account = invoke _getAuthorizedBy(signer); 
	
	env eF;
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	address account_ = invoke _getAuthorizedBy(signer); 
	
	// whatever transaction taken, whether authorized by stayed as it was before or it was zero before and knows some value
	assert _account == account_ || _account == 0, 
		"Account delegating to $signer cannot change from one non-zero value to another non-zero value";
}
