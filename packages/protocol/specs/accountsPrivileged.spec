definition knownAsNonPrivileged(method f) returns bool  = false
  || f.selector == removeIndexedSigner(bytes32).selector
  || f.selector == authorizeValidatorSignerWithPublicKey(address,uint8,bytes32,bytes32,bytes).selector
  || f.selector == setAccountDataEncryptionKey(bytes).selector
  || f.selector == removeVoteSigner().selector
  || f.selector == authorizeValidatorSignerWithKeys(address,uint8,bytes32,bytes32,bytes,bytes,bytes).selector
  || f.selector == authorizeVoteSigner(address,uint8,bytes32,bytes32).selector
  || f.selector == authorizeSigner(address,bytes32).selector
  || f.selector == setIndexedSigner(address,bytes32).selector
  || f.selector == setMetadataURL(string).selector
  || f.selector == addStorageRoot(bytes).selector
  || f.selector == removeStorageRoot(uint256).selector
  || f.selector == removeAttestationSigner().selector
  || f.selector == authorizeAttestationSigner(address,uint8,bytes32,bytes32).selector
  || f.selector == setAccount(string,bytes,address,uint8,bytes32,bytes32).selector
  || f.selector == authorizeSignerWithSignature(address,bytes32,uint8,bytes32,bytes32).selector
  || f.selector == setWalletAddress(address,uint8,bytes32,bytes32).selector
  || f.selector == createAccount().selector
  || f.selector == completeSignerAuthorization(address,bytes32).selector
  || f.selector == removeValidatorSigner().selector
  || f.selector == authorizeValidatorSigner(address,uint8,bytes32,bytes32).selector
  || f.selector == setName(string).selector
  || f.selector == initialize(address).selector
  || f.selector == removeDefaultSigner(bytes32).selector
  || f.selector == removeSigner(address,bytes32).selector
  || f.selector == setEip712DomainSeparator().selector
  || f.selector == setPaymentDelegation(address,uint256).selector
  || f.selector == deletePaymentDelegation().selector
  ; 

rule privilegedOperation(method f, address privileged)
description "$f can be called by more than one user without reverting"
{
	env e1;
	calldataarg arg;
	require !knownAsNonPrivileged(f);
	require e1.msg.sender == privileged;

	storage initialStorage = lastStorage;
	invoke f(e1, arg); // privileged succeeds executing candidate privileged operation.
	bool firstSucceeded = !lastReverted;

	env e2;
	calldataarg arg2;
	require e2.msg.sender != privileged;
	invoke f(e2, arg2) at initialStorage; // unprivileged
	bool secondSucceeded = !lastReverted;

	assert  !(firstSucceeded && secondSucceeded), "${f.selector} can be called by both ${e1.msg.sender} and ${e2.msg.sender}, so it is not privileged";
}
