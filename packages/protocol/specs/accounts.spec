pragma specify 0.1

methods {
	isAccount(address) returns bool	envfree
	isSigner(address,address,bytes32) returns bool envfree // account, signer, role
	_getAuthorizedBy(address) returns address envfree
	_getDataEncryptionKeyLen(address) returns uint256 
	_getNameLen(address) returns uint256 
	getWalletAddress(address) returns address envfree
	getAttestationSigner(address) returns address envfree
	_getAttestationSigner(address) returns address envfree
	getVoteSigner(address) returns address envfree
	_getVoteSigner(address) returns address envfree
	getValidatorSigner(address) returns address envfree
	_getValidatorSigner(address) returns address envfree
	getDefaultSigner(address,bytes32) returns address envfree
	_getDefaultSigner(address,bytes32) returns address envfree
	getLegacySigner(address,bytes32) returns address envfree
	isLegacyRole(bytes32) returns bool envfree
	isCompletedSignerAuthorization(address,bytes32,address) returns bool envfree
	isStartedSignerAuthorization(address,bytes32,address) returns bool envfree
	voteSignerToAccount(address) returns address envfree
	validatorSignerToAccount(address) returns address envfree
	attestationSignerToAccount(address) returns address envfree
	signerToAccount(address) returns address envfree
	_getValidatorRole() returns bytes32 envfree
	_getAttestationRole() returns bytes32 envfree
	_getVoteRole() returns bytes32 envfree
	getIndexedSigner(address,bytes32) returns address envfree
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
 * (Expensive rule)
 */
 /*
rule address_cant_be_both_authorizedby_of_two_address(address x, address y, address d, bytes32 r1, bytes32 r2, method f) filtered { f -> !f.isView } { 
	// x and y are accounts d is authorizedby
	require x != 0 && y != 0 && d != 0 && x != d && y != x && y != d;  
	// x is not registered or authorized
	require isAccount(x) && _getAuthorizedBy(d) == x; 
	// y is not a registered account
	require isAccount(y); 
	// d must be a signer of some capacity for x
	require getIndexedSigner(x, r1) == d; 
	// d must not be a signer of any capacity for y
	require getIndexedSigner(y, r2) != d; 

	// Simulate all possible execution of all methods
	callArbitrary(f);

	// Check that d is still not a current signer of y of any type
	assert getIndexedSigner(y, r2) != d,
    	"d must still not be a signer of any capacity for y";
}
*/

/**
 * Account x can have two authorized addresses - legacy
 */
rule address_can_authorize_two_addresses_legacy(address x, address d1, address d2)
{ 
	require x != 0 && d1 != 0 && d2 != 0 && x != d1 && x != d2 && d1 != d2 && isAccount(x); 
	env e;
	require e.msg.sender == x;
  	
	storage init = lastStorage;
	// first, authorizing d2 as a validation signer should succeed
	uint8 v2;
	bytes32 r2;
	bytes32 s2;
	authorizeValidatorSigner(e, d2, v2, r2, s2);  

	// Authorize d1 as a Vote signer (alternative execution path - start from the state where validator authorization started)
	uint8 v1;
	bytes32 r1;
	bytes32 s1;
	authorizeVoteSigner(e, d1, v1, r1, s1) at init;
	
	// Even after authorizing d1, the authorization of d2 as a Validation signer should succeed
	authorizeValidatorSigner(e, d2, v2, r2, s2);  
		
	// AuthorizedBy(d1) and AuthorizedBy(d2) should still be x
	assert _getAuthorizedBy(d1) == x && _getAuthorizedBy(d2) == x, "Authorizedby should both be x";
}

/**
 * Account x can have two authorized addresses - new
 */
rule address_can_authorize_two_addresses(address x, address d1, address d2, bytes32 role1, bytes32 role2)
{ 
	require x != 0 && d1 != 0 && d2 != 0 && x != d1 && x != d2 && d1 != d2 && isAccount(x); 
	env e;
	require e.msg.sender == x;
  	
	storage init = lastStorage;
	// first, authorizing d2 as a validation signer should succeed
	uint8 v2;
	bytes32 r2;
	bytes32 s2;
	authorizeSignerWithSignature(e, d2, role2, v2, r2, s2);  

	// Authorize d1 as a Vote signer (alternative execution path - start from the state where validator authorization started)
	uint8 v1;
	bytes32 r1;
	bytes32 s1;
	authorizeSignerWithSignature(e, d1, role1, v1, r1, s1) at init;
	
	// Even after authorizing d1, the authorization of d2 as a Validation signer should succeed
	authorizeSignerWithSignature(e, d2, role2, v2, r2, s2);  
		
	// AuthorizedBy(d1) and AuthorizedBy(d2) should still be x
	assert _getAuthorizedBy(d1) == x && _getAuthorizedBy(d2) == x, "Authorizedby should both be x";
}

/**
 * Either the account's authorized signer doesn't change, or it gets set from when it's 0.
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
	calldataarg arg;
	initialize(e, arg);

	env e2;
	calldataarg arg2;
	initialize@withrevert(e2, arg2);
	assert lastReverted;
}

/**
 * Only `createAccount` should be creating an account
 */
rule createsAccount(method f, address a) filtered { f ->
	!f.isView
		&& f.selector != createAccount().selector
		&& f.selector != setAccount(string,bytes,address,uint8,bytes32,bytes32).selector
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
 * view functions in general should not revert.
 * Some exceptions and more refined revert-characteristics are provided.
 */
rule viewFunctionsDoNotRevert(method f) filtered { f -> 
	f.isView 
	// some functions we ignore, and the reasons:
	&& f.selector != hasAuthorizedSigner(address,string).selector // Calldatasize may not match
	&& f.selector != batchGetMetadataURL(address[]).selector // Calldatasize may not match

  // These require an account to exist
	&& f.selector != getOffchainStorageRoots(address).selector
	&& f.selector != offchainStorageRoots(address,uint256).selector
} {
	env e;
	require e.msg.value == 0; // view functions are not payable
	
	// functions that require special handling:
	if (f.selector == getLegacySigner(address,bytes32).selector) {
		// getLegacySigner requires getting a legacy role
		address a;
		bytes32 r;
		require isLegacyRole(r);
		getLegacySigner@withrevert(a, r);
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
		signerToAccount@withrevert(a);
	} else if (f.selector == voteSignerToAccount(address).selector) {
		address a;
		address authBy = _getAuthorizedBy(a);
		requireInvariant authorizedByIsNeverReflexive(a);
		require (authBy != 0 && isSigner(authBy, a, _getVoteRole())) || (authBy == 0 && isAccount(a));
		voteSignerToAccount@withrevert(a);
	} else if (f.selector == validatorSignerToAccount(address).selector) {
		address a;
		address authBy = _getAuthorizedBy(a);
		requireInvariant authorizedByIsNeverReflexive(a);
		require (authBy != 0 && isSigner(authBy, a, _getValidatorRole())) || (authBy == 0 && isAccount(a));
		validatorSignerToAccount@withrevert(a);
	} else if (f.selector == attestationSignerToAccount(address).selector) {
		address a;
		address authBy = _getAuthorizedBy(a);
		requireInvariant authorizedByIsNeverReflexive(a);
		require (authBy != 0 && isSigner(authBy, a, _getAttestationRole())) || (authBy == 0 && isAccount(a));
		attestationSignerToAccount@withrevert(a);
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
	account != 0 => (isCompletedSignerAuthorization(account, role, signer) => _getAuthorizedBy(signer) == account)

/**
 * For signerAuthorization, a signer can only appear as a signer of a single account.
 */
invariant noMultipleAccountsPerSignerInARole(address account, address account2, bytes32 role, bytes32 role2, address signer)
	account != 0 && account2 != 0
		=> (isCompletedSignerAuthorization(account, role, signer) && isCompletedSignerAuthorization(account2, role2, signer) 
			=> account == account2) {
	
	preserved {
		requireInvariant mustHaveAuthorizedByIfCompletedSignerAuthorization(account, role, signer);
		requireInvariant mustHaveAuthorizedByIfCompletedSignerAuthorization(account2, role2, signer);
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
	require !isCompletedSignerAuthorization(account, role, signer);

	env e;
	calldataarg arg;
	f(e, arg);

	assert isCompletedSignerAuthorization(account, role, signer) => e.msg.sender == signer;
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
 * The only way authorizedBy should be set is using a signature, or by the signer being the caller
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
 * Conditions for being able to change signerAuthorization
 */
rule signerAuthorizationChangePrivileges(address a, bytes32 r, address s, method f) filtered { f ->
	!f.isView 
} {
	bool _started = isStartedSignerAuthorization(a, r, s);
	bool _completed = isCompletedSignerAuthorization(a, r, s);

	env e;
	calldataarg arg;
	f(e, arg);

	bool started_ = isStartedSignerAuthorization(a, r, s);
	bool completed_ = isCompletedSignerAuthorization(a, r, s);
	assert _started != started_ => e.msg.sender == a, "Only account can start a signer authorization";
	assert _completed && !completed_ => e.msg.sender == a, "Only account can remove a signer authorization";
	assert !_completed && completed_ => e.msg.sender == a || e.msg.sender == s, "Only signer or account can complete a signer authorization";
} 

/**
 * There's no contents to the fallback function
 */
rule check_no_fallback {
	env e;
	calldataarg arg;
	invoke_fallback(e, arg);

	assert lastReverted;
}

/**
 * The values of get*Signer getters should be consistent for all roles.
 */
rule gettersInAgreement() {
	address account;
	require account != 0;
	bytes32 role;
	address indexedSigner = getIndexedSigner(account, role);
	address defaultSigner = getDefaultSigner(account, role);
	address legacySigner = getLegacySigner(account, role);
	address voteSigner = getVoteSigner(account);
	address validatorSigner = getValidatorSigner(account);
	address attestationSigner = getAttestationSigner(account);

	if (role == _getVoteRole()) {
		assert indexedSigner == legacySigner && indexedSigner == voteSigner, "indexed signer agrees with legacy signer for vote role";
	} else if (role == _getValidatorRole()) {
		assert indexedSigner == legacySigner && indexedSigner == validatorSigner, "indexed signer agrees with legacy signer for validator role";
	} else if (role == _getAttestationRole()) {
		assert indexedSigner == legacySigner && indexedSigner == attestationSigner, "indexed signer agrees with legacy signer for attestation role";
	} else {
		assert indexedSigner == defaultSigner, "for any non legacy role indexed signer is default signer";
	}

	assert indexedSigner != 0 && defaultSigner != 0 && legacySigner != 0 
		&& voteSigner != 0 && validatorSigner != 0 && attestationSigner != 0, "signer is never address 0";

	// original assertion is wrong
	//assert indexedSigner != account => defaultSigner != account, "If indexed signer is a distinct address then default signer for this role is also a distinct address";
	assert !isLegacyRole(role) && indexedSigner != account => defaultSigner != account, "If indexed signer is a distinct address then default signer for this role is also a distinct address";
}

/**
 * account to signer and signer to account getters should agree
 */
invariant accountToSignerAndInverseVote(address a, address s, bytes32 r)
	r == _getVoteRole() => (s == getVoteSigner(a) => voteSignerToAccount(s) == a)
{
		preserved {
			require a != s;
		}
}

invariant accountToSignerAndInverseValidator(address a, address s, bytes32 r)	
	r == _getValidatorRole() => (s == getValidatorSigner(a) => validatorSignerToAccount(s) == a)
{
		preserved {
			require a != s;
		}
}

invariant accountToSignerAndInverseAttestation(address a, address s, bytes32 r)
	r == _getAttestationRole() => (s == getAttestationSigner(a) => attestationSignerToAccount(s) == a)
{
		preserved {
			require a != s;
		}
}

invariant accountToSignerAndInverseNewRoles(address a, address s, bytes32 r)	
	getIndexedSigner(a, r) == s => signerToAccount(s) == a 
{
		preserved {
			require a != s;
		}
}


/**
 * A utility for shortening calls to arbitrary functions in which we do not care about the environment.
 */
function callArbitrary(method f) {
	env e;
	calldataarg arg;
	f(e, arg);
}
