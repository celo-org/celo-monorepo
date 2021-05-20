methods {
	
	vote(uint256,uint256,uint8) returns bool
	//initialize(address,uint256)
	
	getProposalSlim(uint256) returns address, uint256, uint256, uint256 envfree	
	getVoteSigner(address) returns address envfree
	getAccountFromVoteSigner(address) returns address envfree
	stageDurations() returns uint256,uint256,uint256 envfree
	getUpvotes(uint256) returns uint256 envfree
	getUpvotedProposal(address) returns uint256 envfree
	getQueueLength() returns uint256 envfree
	proposalCount() returns uint256 envfree
	getDequeuedLength() returns uint256 envfree
	getFromDequeued(uint256) returns uint256 envfree
	queueExpiry() returns uint256 envfree
	isApproved(uint256) returns bool envfree
	isDequeuedProposalExpired(uint256) returns bool
	getNoneVoteEnum() returns uint256 envfree
	getAbstainVoteEnum() returns uint256 envfree
	getYesVoteEnum() returns uint256 envfree
	getNoVoteEnum() returns uint256 envfree
	getTotalLockedGold() returns uint256 envfree
	getVoteTotals(uint256) returns uint256,uint256,uint256 envfree
	approver() returns address envfree
	getVoteRecord(address,uint256) returns uint256, uint256, uint256 envfree
}

/* we start by learning which functions are most interesting and may demand careful specification */
rule modifying_stageDuration(method f) filtered { f -> !f.isView } {
	uint256 old1; uint256 old2; uint256 old3;
    old1, old2, old3 = stageDurations();
	
    callArbitrary(f);
  	
    uint256 new1;
	uint256 new2;
	uint256 new3;
	new1, new2, new3 = stageDurations();

    assert old1 == new1 && old2 == new2 && old3 == new3;
}

/**
 * A user should never be able to upvote more than one proposal in the queue
 */
rule no_double_upvote(uint256 p, address u) {
	uint256 _upvotes = getUpvotes(p);
	uint256 _usersUpvotedProposal = getUpvotedProposal(u);
	env e;
	require e.msg.sender == u;
	uint256 lesser; 
    uint256 greater;
	upvote(e, p, lesser, greater);
	uint256 upvotes_ = getUpvotes(p);
	
	assert _usersUpvotedProposal == p => upvotes_ <= _upvotes, 
		"Upvotes increased from ${_upvotes} to ${upvotes_} even though upvoted by user $u who already upvoted $p";
}

rule can_add_to_queue(method f) filtered { f -> !f.isView } {
	uint256 _queueLength = getQueueLength();
	
	callArbitrary(f);
	
	uint256 queueLength_ = getQueueLength();
	
	assert queueLength_ <= _queueLength, 
		"Method can queue elements - should check separately that cannot queue proposal IDs equal 0";
}

rule proposal_count_monotonic_increasing(method f) filtered { f -> !f.isView } {
	// proposal count is monotonic increasing (strictly in propose)
		
	uint256 _count = proposalCount();
	
    callArbitrary(f);

	uint256 count_ = proposalCount();
	
	if (f.selector == propose(uint256[],address[],bytes,uint256[],string).selector) {
		assert count_ > _count, "Successful propose must increase proposal count";
		assert count_ > 0, "Proposal cannot be 0"; // this is already obvious - even one proposal will increase count to 1
	}

	assert count_ >= _count, "Proposal count must not decrease";
}

rule may_dequeue(method f, uint256 index) filtered { f -> !f.isView } {
	// a utility rule for figuring out which methods could dequeue and whether it's all due to dequeueProposalsIfReady calls.

	// require index to be valid and to be empty
	require index >= 0;
	uint256 queueLength = getDequeuedLength();
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => getFromDequeued(index) == 0;
	
	callArbitrary(f);
	
	uint256 newValueInDequeued = getFromDequeued(index);
	
	assert newValueInDequeued == 0, "Method caused a dequeue of proposal $newValueInDequeued to index $index";	
}

rule promote_proposal(method f, uint256 p, uint256 index) filtered { f -> !f.isView } {
	/* A proposal should never be able to be promoted from the queue if it was proposed more than queueExpiry seconds ago */
	// Let's say we have an empty index. Then it cannot be filled with a new proposal p if its submit time is more than queueExpiry seconds ago
	env eF;
	
	// p must be non zero
	require p != 0;
	
	// get queue expiry
	uint256 _queueExpiry = queueExpiry();
	
	// require index to be valid and to be empty
	require index >= 0;
	uint256 queueLength = getDequeuedLength();
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => getFromDequeued(index) == 0;
	
	// fetch proposal p timestamp
	uint256 _proposalTimestamp;
	_,_, _proposalTimestamp, _ = getProposalSlim(p);
	
	// invoke f
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);

	// deqeued index should contain p now only if eF.block.timestamp is not past p's timestamp+queueExpiry
	assert getFromDequeued(index) == p => eF.block.timestamp <= _proposalTimestamp + _queueExpiry, 
		"Managed to promote $p in ${eF.block.timestamp} after proposal timestamp ${_proposalTimestamp} + ${_queueExpiry}";
}


/**
 * A utility for shortening calls to arbitrary functions in which we do not care about the environment.
 */
function callArbitrary(method f) {
	env e;
	calldataarg arg;
	f(e, arg);
}
