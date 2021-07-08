definition knownAsNonPrivileged(method f) returns bool  = false
  || f.selector == dequeueProposalsIfReady().selector
  || f.selector == withdraw().selector
  || f.selector == execute(uint256,uint256).selector
  || f.selector == upvote(uint256,uint256,uint256).selector
  || f.selector == propose(uint256[],address[],bytes,uint256[],string).selector
  || f.selector == revokeVotes().selector
  || f.selector == revokeUpvote(uint256,uint256).selector
  || f.selector == whitelistHotfix(bytes32).selector
  || f.selector == vote(uint256,uint256,uint8).selector
  || f.selector == initialize(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256).selector
  || f.selector == prepareHotfix(bytes32).selector
  || f.selector == executeHotfix(uint256[],address[],bytes,uint256[],bytes32).selector
  || f.isFallback
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
