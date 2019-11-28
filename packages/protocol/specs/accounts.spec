pragma specify 0.1
methods {
	init_state() 
	isAccount(address) returns bool	envfree
	_getAuthorizedBy(address) returns address envfree
	getAttestationSigner(address) returns bool envfree
	getVoteSigner(address) returns bool envfree
	getValidatorSigner(address) returns bool envfree
	_getDataEncryptionKeyLen(address) returns uint256 
	_getNameLen(address) returns uint256 
	getWalletAddress(address) returns address envfree
	_getAttestationSigner(address) returns address envfree
	_getVoteSigner(address) returns address envfree
	_getValidatorSigner(address) returns address envfree
}

invariant account_empty_if_not_exsist(env e, address x) !sinvoke isAccount(x) => (sinvoke getWalletAddress(x)==0 && sinvoke _getAttestationSigner(x)==0 && sinvoke _getVoteSigner(x)==0 && sinvoke _getValidatorSigner(x)==0)

invariant address_zero_cannot_become_an_account(address z) z==0 => !sinvoke isAccount(z)

invariant address_cant_be_both_account_and_delegate(address x, address d) (x!=d && sinvoke isAccount(x) && sinvoke _getAuthorizedBy(d)==x) => !sinvoke isAccount(d)

invariant address_delegated_iff_authorizedby(address x, address d) (x!=d && sinvoke isAccount(x) && sinvoke _getAuthorizedBy(d)==x) <=> (sinvoke getAttestationSigner(x)==d || sinvoke getVoteSigner(x)==d || sinvoke getValidatorSigner(x)==d)
	
invariant address_cant_be_both_delegate_of_two_address(address x, address y, address d) (x!=d && y!=x && y!=d && sinvoke isAccount(x) && sinvoke _getAuthorizedBy(d)==x) => (!sinvoke getAttestationSigner(y)==d && !sinvoke getVoteSigner(y)==d && !sinvoke getValidatorSigner(y)==d)

invariant address_can_authorize_two_address(address x, address d1, address d2) (x!=d1 && x!=d2 && d1!=d2 && sinvoke isAccount(x) && sinvoke getAttestationSigner(x)==d1 && sinvoke getVoteSigner(x)==d2) => (sinvoke _getAuthorizedBy(d1)==x  && sinvoke _getAuthorizedBy(d2)==x) 

rule authorizedBy_can_not_be_moved(method f, address delegatedTo)
{
	// delegations cannot change from non-zero to non-zero
	env ePre;
	address _delegatingAccount = sinvoke _getAuthorizedBy(delegatedTo); // an account that delegates one of the roles to delegatedTo

	env eF;
	calldataarg arg;	
	sinvoke f(eF,arg);
	
	env ePost;
	address delegatingAccount_ = sinvoke _getAuthorizedBy(delegatedTo); // an account that delegates one of the roles to delegatedTo
	
	assert _delegatingAccount == delegatingAccount_ || _delegatingAccount == 0, 
		"Account delegating to $delegatedTo cannot change from one non-zero value to another non-zero value";
}
