pragma specify 0.1

methods {
	isAccount(address) returns bool	envfree
	isSigner(address,address,bytes32) returns bool envfree // account, signer, role
	_getAuthorizedBy(address) returns address envfree
	_getDataEncryptionKeyLen(address) returns uint256 
	_getNameLen(address) returns uint256 
	getWalletAddress(address) returns address envfree
	_getAttestationSigner(address) returns address envfree
	_getVoteSigner(address) returns address envfree
	_getValidatorSigner(address) returns address envfree
	_getDefaultSigner(address,bytes32) returns address envfree
	isLegacyRole(bytes32) returns bool envfree
	isCompletedSignerAuthorization(address,bytes32,address) returns (bool) envfree
	isStartedSignerAuthorization(address,bytes32,address) returns (bool) envfree
	_getValidatorRole() returns bytes32 envfree
	_getAttestationRole() returns bytes32 envfree
	_getVoteRole() returns bytes32 envfree
}

/**
 * If an address x is not an account then all mapping from x should be empty
 */
invariant account_empty_if_not_exist(env e, address x) 
  !isAccount(x) => 
    getWalletAddress(x) == 0 &&
    _getAttestationSigner(x) == 0 &&
    _getVoteSigner(x) == 0 &&
    _getValidatorSigner(x) == 0


/**
 * An address d that is authorized by some account x can not become an account
 */
invariant address_cant_be_both_account_and_signer(address x, address d) 
  (x != 0 && d != 0 && x != d && _getAuthorizedBy(d) == x) => 
    (isAccount(x) && !isAccount(d))


/**
 * A current signer d or account x should be authorizedby for legacy roles
 */
invariant address_signer_if_authorizedby_legacy(address x, address d) 
  (x != d && x != 0 && d != 0 &&
  	(_getAttestationSigner(x) == d || _getVoteSigner(x) == d || _getValidatorSigner(x) == d))
    	=> (isAccount(x) && _getAuthorizedBy(d) == x)

/**
 * A current signer d or account x should be authorizedby for new roles
 */
invariant address_signer_if_authroizedby_new(address x, address d, bytes32 role)
	(x != d && x != 0 && d != 0 &&
		_getDefaultSigner(x,role) == d)
			=> (isAccount(x) && _getAuthorizedBy(d) == x)

/**
 * Given account x, address d a current signer, then d can not be a current signer of account y
 */
rule address_cant_be_both_authorizedby_of_two_address(address x, address y, address d, method f) filtered { f -> !f.isView } { 
	// x and y are accounts d is authorizedby
	require x != 0 && y != 0 && d != 0 && x != d && y != x && y != d;  
	// x is not registered or authorized
	require isAccount(x) && _getAuthorizedBy(d) == x; 
	// y is not a registered account
	require isAccount(y); 
	// d must be a signer of some capacity for x
	require _getAttestationSigner(x) == d || _getVoteSigner(x) == d || _getValidatorSigner(x) == d; 
	// d must not be a signer of any capacity for y
	require _getAttestationSigner(y) != d && _getVoteSigner(y) != d && _getValidatorSigner(y) != d; 

	// Simulate all possible execution of all methods
	callArbitrary(f);

	// Check that d is still not a current signer of y of any type
	assert _getAttestationSigner(y) != d && _getVoteSigner(y) != d && _getValidatorSigner(y) != d,
    	"d must still not be a signer of any capacity for y";
}

/**
 * Account x can have two authorized addresses
 */
rule address_can_authorize_two_address(address x, address d1, address d2)
{ 
	require x != 0 && d1 != 0 && d2 != 0 && x != d1 && x != d2 && d1 != d2 && isAccount(x); 
	env e;
	require e.msg.sender == x;
  	
	storage init = lastStorage;
	// first, authorizing d2 as a validation signer should succeed
	uint8 v2;
	bytes32 r2;
	bytes32 s2;
	authorizeValidatorSigner(e,d2,v2,r2,s2);  

	// Authorize d1 as a Vote signer (alternative execution path - start from the state where validator authorization started)
	uint8 v1;
	bytes32 r1;
	bytes32 s1;
	authorizeVoteSigner(e, d1, v1, r1, s1) at init;
	
	// Even after authorizing d1, the authorization of d2 as a Validation signer should succeed
	authorizeValidatorSigner(e,d2,v2,r2,s2);  
		
	// AuthorizedBy(d1) and AuthorizedBy(d2) should still be x
	assert _getAuthorizedBy(d1) == x && _getAuthorizedBy(d2) == x, "Authorizedby should both be x";
}

/**
 * Either the account's authorized signer doesn't change, or it gets set from nothing.
 */
rule authorizedBy_can_not_be_removed(method f, address signer) filtered { f -> !f.isView } {
	address _account = _getAuthorizedBy(signer); 
	callArbitrary(f);
	address account_ = _getAuthorizedBy(signer); 
	// Whatever transacation occurs, if `_account` was authorized before, it remains authorized.
  	// If `_account` was null, then we could authorize a new account `account_`.
	assert _account == account_ || _account == 0, 
		"Account delegating to $signer cannot change from one non-zero value to another non-zero value";
}

/**
 * A second call to initialize must fail
 */
rule initializableOnlyOnce {
	env e;
	address registryAddress;
	initialize(e, registryAddress);

	env e2;
	address registryAddress2;
	initialize@withrevert(e2, registryAddress2);
	assert lastReverted;
}

/**
 * Only `createAccount` should be creating an account
 */
rule createsAccount(method f, address a) filtered { f ->
	!f.isView
		&& f.selector != createAccount().selector
} {
	bool _isAccount = isAccount(a);
	callArbitrary(f);
	bool isAccount_ = isAccount(a);

	assert _isAccount == isAccount_, "checked function creates an account";
}

/**
 * A legacy role should never be set in default signers indexing map (because we have direct struct access in storage)
 */
invariant legacyRolesAreNotUsedInNewRoles(address account, bytes32 role) 
	isLegacyRole(role) => _getDefaultSigner(account, role) == 0

/**
 * Once we set d as being authorized by an account x (some non-zero address),
 * This can never be overridden.
 * Note: this cannot be an invariant because in the initial state no authorizedBy is set.
 */
rule onceSetAuthorizedByIsNeverOverridden(address d, address x, method f) {
       require x != 0 => _getAuthorizedBy(d) == x;

       callArbitrary(f);

       assert x != 0 => _getAuthorizedBy(d) == x, "for an account x, if was previously the authorizer of d, should still be authorizer of d";
}

/**
 * view functions in general should not revert.
 * Some exceptions and more refined revert-characteristics are provided.
 */
rule viewFunctionsDoNotRevert(method f) filtered { f -> f.isView } {
	env e;
	require e.msg.value == 0; // view functions are not payable
	
	// some functions we ignore, and why:
	require f.selector != hasAuthorizedSigner(address,string).selector; // Calldatasize may not match
	require f.selector != batchGetMetadataURL(address[]).selector; // Calldatasize may not match

	// functions that require special handling:
	if (f.selector == getLegacySigner(address,bytes32).selector) {
		// getLegacySigner requires getting a legacy role
		address a;
		bytes32 r;
		require isLegacyRole(r);
		getLegacySigner@withrevert(e, a, r);
	} else if (f.selector == hasLegacySigner(address,bytes32).selector) {
		// hasLegacySigner requires getting a legacy role
		address a;
		bytes32 r;
		require isLegacyRole(r);
		hasLegacySigner@withrevert(e, a, r);
	} else if (f.selector == signerToAccount(address).selector) {
		// will fail if address is not authorized by anyone, and is not an account.
		address a;
		require _getAuthorizedBy(a) != 0 || isAccount(a);
		signerToAccount@withrevert(e,a);
	} else if (f.selector == voteSignerToAccount(address).selector) {
		address a;
		address authBy = _getAuthorizedBy(a);
		requireInvariant authorizedByIsNeverReflexive(a);
		require (authBy != 0 && isSigner(authBy, a, _getVoteRole())) || (authBy == 0 && isAccount(a));
		voteSignerToAccount@withrevert(e,a);
	} else if (f.selector == validatorSignerToAccount(address).selector) {
		address a;
		address authBy = _getAuthorizedBy(a);
		requireInvariant authorizedByIsNeverReflexive(a);
		require (authBy != 0 && isSigner(authBy, a, _getValidatorRole())) || (authBy == 0 && isAccount(a));
		validatorSignerToAccount@withrevert(e,a);
	} else if (f.selector == attestationSignerToAccount(address).selector) {
		address a;
		address authBy = _getAuthorizedBy(a);
		requireInvariant authorizedByIsNeverReflexive(a);
		require (authBy != 0 && isSigner(authBy, a, _getAttestationRole())) || (authBy == 0 && isAccount(a));
		attestationSignerToAccount@withrevert(e,a);
	} else {
		calldataarg arg;
		f@withrevert(e, arg);
	}

	assert !lastReverted, "View functions should not revert";
}

/**
 * the authorizedBy should never be reflexive, i.e. an account cannot be its own signer, or a signer cannot be authroize itself.
 */
invariant authorizedByIsNeverReflexive(address a)
	a != 0 => _getAuthorizedBy(a) != a

/**
 * If we set signerAuthroization to be completed, it means the signer is marked as authorizedBy the account.
 * The other direction may not be correct because authorizedBy is persistent while signer authorizations can be removed. 
 */
invariant mustHaveAuthorizedByIfCompletedSignerAuthorization(address account, bytes32 role, address signer) 
	account != 0 => (isCompletedSignerAuthorization(account,role,signer) => _getAuthorizedBy(signer) == account)

/**
 * Once signer authorization is completed, it must mean authorizedBy was also set.
 */
invariant completedSignerAuthMeansAuthByIsSet(address account, bytes32 role, address signer)
	account != 0 => (isCompletedSignerAuthorization(account, role, signer) => _getAuthorizedBy(signer) == account)

/**
 * For signerAuthorization, a signer can only appear as a signer of a single account.
 */
invariant noMultipleAccountsPerSignerInARole(address account, address account2, bytes32 role, bytes32 role2, address signer)
	account != 0 && account2 != 0
		=> (isCompletedSignerAuthorization(account,role,signer) && isCompletedSignerAuthorization(account2,role2,signer) 
			=> account == account2) {
	
	preserved {
		requireInvariant completedSignerAuthMeansAuthByIsSet(account,role,signer);
		requireInvariant completedSignerAuthMeansAuthByIsSet(account2,role2,signer);
	}
}

/**
 * Only legacy roles allow to jump from no signer authorization being started, to being completed, in one single invocation.
 */
rule cantGoFromNoAuthorizationToCompletedInOneStepUnlessRoleIsLegacy(method f) filtered { f -> 
	!f.isView 
		// the authorizeSignerWithSignature allows the signer to provide a signature to the account, so we exclude this option
		&& f.selector != authorizeSignerWithSignature(address,bytes32,uint8,bytes32,bytes32).selector
} {
	address account;
	bytes32 role;
	address signer;
	require !isStartedSignerAuthorization(account, role, signer) && !isCompletedSignerAuthorization(account, role, signer);

	callArbitrary(f);

	assert isCompletedSignerAuthorization(account, role, signer) => isLegacyRole(role);
}

/**
 * One cannot complete the signer authorization process unless the signer itself signs on the transaction,
 * or the signer provided a signature.
 */
rule cantMakeASignerForNonLegacyRoleWithoutApprovalOfSigner(method f) filtered { f -> 
	!f.isView 
		// the authorizeSignerWithSignature allows the signer to provide a signature to the account, so we exclude this option
		&& f.selector != authorizeSignerWithSignature(address,bytes32,uint8,bytes32,bytes32).selector	
} {
	address account;
	bytes32 role;
	
	// Leagcy roles can be updated using a signature
	require !isLegacyRole(role);

	address signer;

	// not completed signer auth yet (but may have started)
	require !isCompletedSignerAuthorization(account,role,signer);

	env e;
	calldataarg arg;
	f(e, arg);

	assert isCompletedSignerAuthorization(account,role,signer) => e.msg.sender == signer;
}

/**
 * One cannot start a signer authorization on behalf of another account.
 */
rule cannotStartSignerAuthorizationsForOtherAccounts(method f) filtered { f -> !f.isView } {
	address account;
	bytes32 role;
	address signer;
	require !isStartedSignerAuthorization(account, role, signer);

	env e;
	calldataarg arg;
	f(e,arg);

	assert isStartedSignerAuthorization(account, role, signer) => e.msg.sender == account;
}

/**
 * The only way authorizedBy should be set is using a signature [TODO: or by the signer being the caller]
 */
rule cannotSetAuthorizedByWithoutSignatures(method f) filtered { f -> 
	!f.isView 
		&& f.selector != authorizeSignerWithSignature(address,bytes32,uint8,bytes32,bytes32).selector
		&& f.selector != authorizeAttestationSigner(address,uint8,bytes32,bytes32).selector
		&& f.selector != authorizeValidatorSigner(address,uint8,bytes32,bytes32).selector
		&& f.selector != authorizeValidatorSignerWithKeys(address,uint8,bytes32,bytes32,bytes,bytes,bytes).selector
		&& f.selector != authorizeValidatorSignerWithPublicKey(address,uint8,bytes32,bytes32,bytes).selector
		&& f.selector != authorizeVoteSigner(address,uint8,bytes32,bytes32).selector
} {
	address d;
	require _getAuthorizedBy(d) == 0;

	env e;
	calldataarg arg;
	f(e, arg);

	assert _getAuthorizedBy(d) == 0 || e.msg.sender == d;
} 

/**
 * A utility for shortening calls to arbitrary functions in which we do not care about the environment.
 */
function callArbitrary(method f) {
	env e;
	calldataarg arg;
	f(e, arg);
}
