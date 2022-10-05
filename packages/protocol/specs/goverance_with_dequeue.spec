// these rules should be run on the original governance, without disabling dequeueing
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

/*
TODO:
A proposal should never be able to be promoted from the queue if it was not in the top concurrentProposals of upvote received
*/
rule no_promoting_without_upvotes(uint256 p, uint256 index) {
	// Can a proposal be promoted with 0 votes? 
	env _e;
	env eF;
	env e_;
	
	/* would actually want forall index. inrange(index) => dequeued[index] != p but here its suffice to 'pre-guess' the index of the proposal we dequeue */
	// require index to be valid and to be empty
	require index >= 0;
	require p > 0; // proposal 0 is not legal, and cannot happen (we check it)
	uint256 queueLength = getDequeuedLength();
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => getFromDequeued(index) == 0;
	
	uint256 _upvotes = getUpvotes(p);
	
	dequeueProposalsIfReady(eF);
	assert getFromDequeued(index) == p => _upvotes > 0, "Cannot dequeue (promote) proposal $p to index $index unless had some upvotes";
}