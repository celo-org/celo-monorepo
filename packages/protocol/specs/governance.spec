pragma specify 0.1

/* we start by learning which functions are most interesting and may demand careful specification */
rule modifying_stageDuration(method f) {

	env e0; havoc e0;
    env e1; havoc e1;
    env e2; havoc e2;
   
	uint256 old1; uint256 old2; uint256 old3;
    old1, old2, old3 = sinvoke stageDurations(e0);
	
    calldataarg arg;
    invoke f(e1, arg);
    uint256 new1;
	uint256 new2;
	uint256 new3;
	new1, new2, new3 = sinvoke stageDurations(e2);

    assert old1 == new1 && old2 == new2 && old3 == new3;
}

/*

A user should never be able to upvote more than one proposal in the queue
	
*/
rule no_double_upvote(uint256 p, address u) {

	env _e;
	uint256 _upvotes = sinvoke getUpvotes(_e,p);
	uint256 _usersUpvotedProposal = sinvoke getUpvotedProposal(_e,u);

	env e;
	require e.msg.sender == u;
	uint256 lesser; uint256 greater;
	sinvoke upvote(e, p, lesser, greater);

	env e_;
	uint256 upvotes_ = sinvoke getUpvotes(e_,p);
	
	assert _usersUpvotedProposal == p => upvotes_ <= _upvotes, "Upvotes increased from ${_upvotes} to ${upvotes_} even though upvoted by user $u who already upvoted $p";
}


rule proposal_id_is_never_zero(method f, uint256 p) {
	// Proposal ID cannot be zero -- i.e., if p did not exist and after f it does, then it cannot be that p==0
	env _e;
	env eF;
	env e_;

	bool _exists = sinvoke proposalExists(_e,p);
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	bool exists_ = sinvoke proposalExists(e_,p);
	
	assert !_exists && exists_ => p != 0, "If after executing the method a new proposal was added, then it cannot be zero";
}

rule proposal_count_monotonic_increasing(method f) {
	// proposal count is monotonic increasing (strictly in propose)

	env _e;
	env eF;
	env e_;

	uint256 _count = sinvoke proposalCount(_e);
	calldataarg arg;
	sinvoke f(eF,arg);

	uint256 count_ = sinvoke proposalCount(e_);
	
	if (f == 1815818571 /* */) {
		assert count_ > _count, "Successful propose must increase proposal count";
	}

	assert count_ >= _count, "Proposal count must not decrease";
}

rule may_dequeue(method f, uint256 index) {
	// a utility rule for figuring out which methods could dequeue and whether it's all due to dequeueProposalsIfReady calls.
	env _e;
	env eF;
	env e_;
	
	// require index to be valid and to be empty
	require index >= 0;
	uint256 queueLength = sinvoke getDequeuedLength(_e);
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => sinvoke getFromDequeued(_e,index) == 0;
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	uint256 newValueInDequeued = sinvoke getFromDequeued(e_,index);
	
	assert newValueInDequeued == 0, "Method caused a dequeue of proposal $newValueInDequeued to index $index";	
}

rule promote_proposal(method f, uint256 p, uint256 index) {
	/* A proposal should never be able to be promoted from the queue if it was proposed more than queueExpiry seconds ago */
	// Let's say we have an empty index. Then it cannot be filled with a new proposal p if its submit time is more than queueExpiry seconds ago
	env _e;
	env eF;
	env e_;
	
	// p must be non zero
	require p != 0;
	
	// get queue expiry
	uint256 _queueExpiry = sinvoke queueExpiry(_e);
	
	// require index to be valid and to be empty
	require index >= 0;
	uint256 queueLength = sinvoke getDequeuedLength(_e);
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => sinvoke getFromDequeued(_e,index) == 0;
	
	// fetch proposal p timestamp
	uint256 _proposalTimestamp;
	_,_, _proposalTimestamp, _ = sinvoke getProposal(_e,p);
	
	// invoke f
	calldataarg arg;
	sinvoke f(eF,arg);

	// deqeued index should contain p now only if eF.block.timestamp is not past p's timestamp+queueExpiry
	assert sinvoke getFromDequeued(e_,index) == p => eF.block.timestamp <= _proposalTimestamp+_queueExpiry, "Managed to promote $p in ${eF.block.timestamp} after proposal timestamp ${_proposalTimestamp} + ${_queueExpiry}";
}

rule approval_only_if_promoted_and_allowed(method f, uint256 p, uint256 index) {
	// A proposal should never be able to be approved unless it was promoted from the queue
	env _e;
	env eF;
	env e_;
	
	bool _isProposalApproved = sinvoke isApproved(_e,p);
	bool _isDequeued = sinvoke getFromDequeued(_e,index) == p;
	bool _approver = sinvoke approver(_e);
	require !_isProposalApproved; // we assume not approved yet
		
	calldataarg arg;
	sinvoke f(eF,arg);
	
	bool isProposalApproved_ = sinvoke isApproved(e_,p);

	// TODO: what if approve were to delete p from dequeued?
	assert isProposalApproved_ => _isDequeued, "Cannot approve proposal $p unless index $index points to it"; // index has p
	assert isProposalApproved_ => eF.msg.sender == _approver, "Only approver ${_approver} can approve";
	
	// it is possible to guess in advance "index", approve will dequeue it into index?? I would move the check in the code above
}

rule no_referendum_votes_unless_approved(method f, uint256 p) {
	// A proposal should never be able to receive a vote unless it was approved
	env _e;
	env eF;
	env e_;
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = sinvoke getVoteTotals(_e,p);
	
	// no votes currently
	require _yes == 0 && _no == 0 && _abstain == 0;
	
	bool _isProposalApproved = sinvoke isApproved(_e,p);
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	uint256 yes_;
	uint256 no_;
	uint256 abstain_;
	yes_, no_, abstain_ = sinvoke getVoteTotals(e_,p);
	
	assert (yes_ != 0 || no_ != 0 || abstain_ != 0) => _isProposalApproved, 
		"Cannot move from 0 votes to positive number of yes,no,abstain votes unless proposal $p is approved.";
}

/* The sum of yes votes for a proposal cannot exceed total weight - requires linked BondedDeposits */
// this rule requires linkage of BondedDeposits
rule sum_of_votes_cannot_exceed_total_weight(method f, uint256 p) {
	env _e;
	env eF;
	env e_;
	
	uint256 _totalWeight = sinvoke _getTotalWeightFromBondedDeposits(_e)
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = sinvoke getVoteTotals(_e,p);
	
	require _yes+_no+_abstain <= _totalWeight;
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	uint256 totalWeight_ = sinvoke _getTotalWeightFromBondedDeposits(e_)
	
	uint256 yes_;
	uint256 no_;
	uint256 abstain_;
	yes_, no_, abstain_ = sinvoke getVoteTotals(e_,p);
	
	assert yes_+no_+abstain_ <= totalWeight_, "Sum of votes for a proposal cannot exceed total weight";
}


// TODO: Can a voting user provide weight to multiple proposals?


rule cant_vote_twice_with_delegate(uint256 deqIndex, uint256 voteValue) {	
	// If I delegated voting, can I vote? Probably not
	env e;
	env eF;
	
	uint256 NONE = getNoneVoteEnum(e);
	// get the voting delegate
	address voterDelegate = sinvoke getVoterFromAccount(e,eF.msg.sender);
	
	// check if voted
	uint256 p;
	uint256 recordValue;
	p, recordValue = sinvoke getVoteRecord(e,voterDelegate,deqIndex);

	invoke vote(eF,p,deqIndex,voteValue);
	
	assert voteValue == NONE => lastReverted, "Cannot vote for none"; // not voting none
	assert recordValue != NONE => lastReverted, "Could not succeed if delegate already voted";
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
	uint256 queueLength = sinvoke getDequeuedLength(_e);
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => sinvoke getFromDequeued(_e,index) == 0;
	
	uint256 _upvotes = sinvoke getUpvotes(_e,p);
	
	sinvoke dequeueProposalsIfReady(eF);

	assert sinvoke getFromDequeued(e_,index) == p => _upvotes > 0, "Cannot dequeue (promote) proposal $p to index $index unless had some upvotes";
}

rule execute_preconds(uint256 p, uint256 index) {
	// A proposal should never be executable when there are more no votes than yes votes
	// TODO: A proposal should never be executable unless it received a yes:no vote ratio greater than that specified in the constitution
	env _e;
	env eF;
	env e_;
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = sinvoke getVoteTotals(_e,p);
	
	bool executeRetval = invoke execute(eF,p,index);
	bool executeReverted = lastReverted;
	
	// TODO: if there are exactly yes==no then should it succeed or not?
	assert _no > _yes => (!executeRetval || executeReverted), "If there are more no votes than yes votes, then we cannot succeed in executing";
	// TODO: may require to make sure that all constitutions demand at least majority
}

// proposalId is timestamp

rule approved_proposals_invariants(method f, uint256 p) {
	env _e;
	env eF;
	env e_;
	
	bool _doesProposalExist = sinvoke proposalExists(_e,p);
	bool _isApprovedProposal = sinvoke isApproved(_e,p);
	
	require _isApprovedProposal => _doesProposalExist; // if a proposal is approved, it must be existent
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	bool doesProposalExist_ = sinvoke proposalExists(e_,p);
	bool isApprovedProposal_ = sinvoke isApproved(e_,p);
	
	assert isApprovedProposal_ => doesProposalExist_, "An approved proposal must exist";
	assert _isApprovedProposal => isApprovedProposal_, "An approved proposal cannot be disproved";
}

rule proposal_timestamp_invariants(method f, uint256 p) {
	env _e;
	env eF;
	env e_;
	
	uint256 _proposalTimestamp;
	_,_, _proposalTimestamp, _ = sinvoke getProposal(_e,p);
		
	require _proposalTimestamp == p || _proposalTimestamp == 0;	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	uint256 proposalTimestamp_;
	_,_, proposalTimestamp_, _ = sinvoke getProposal(e_,p);
	
	assert proposalTimestamp_ == p || proposalTimestamp_ == 0, "The timestamp of a proposal is either its ID ${p} or 0, but got ${proposalTimestamp_}";
}


rule no_double_vote_referendum(address account, uint256 deqIndex) {
	/* A user that already has a vote record for a dequeued index, cannot make a transaction that will increase the weight of that choice */
	env _e;
	env eF;
	env e_;
	
	uint256 NONE = sinvoke getNoneVoteEnum(_e);
	uint256 ABSTAIN = sinvoke getAbstainVoteEnum(_e);
	uint256 YES = sinvoke getYesVoteEnum(_e);
	uint256 NO = sinvoke getNoVoteEnum(_e);
	
	uint256 p;
	uint256 recordValue;
	p, recordValue = sinvoke getVoteRecord(_e,account,deqIndex);
	
	uint256 _yes; uint256 _no; uint256 _abstain;
	_yes,_no,_abstain = sinvoke getVoteTotals(_e,p);
	
	calldataarg arg;
	require eF.msg.sender == account;
	sinvoke f(eF,arg);
	
	
	uint256 yes_; uint256 no_; uint256 abstain_;
	yes_,no_,abstain_ = sinvoke getVoteTotals(e_,p);
	
	assert recordValue != NONE => yes_ + no_ + abstain_ == _yes + _no + _abstain, "Total votes could not have changed if already voted";
	assert recordValue == YES => yes_ <= _yes, "Yes votes could not have increased if voted yes already";
	assert recordValue == NO => no_ <= _no, "No votes could not have increased if voted no already";
	assert recordValue == ABSTAIN => abstain_ <= _abstain, "Abstain votes could not have increased if voted abstain already";
	assert recordValue == NONE => (yes_ == _yes && no_ == _no)
									|| (yes_ == _yes && abstain_ == _abstain)
									|| (no_ == _no && abstain_ == _abstain),
									"If previously did not vote, only kind of vote may change, and the other two are the same";
}

// TODO: Write spec for isProposal passing, or just for constitution

rule constitution_change(method f) {
	env _e;
	env eF;
	env e_;
	
	calldataarg arg_getConstitution;
	
	uint256 _num; uint256 _denom;
	_num, _denom = sinvoke getConstitution(_e,arg_getConstitution);
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	uint256 num_; uint256 denom_;
	num_, denom_ = sinvoke getConstitution(e_,arg_getConstitution);
	
	bool changed = !(_num == num_ && _denom == denom_);
	bool b1 = num_*2 <= denom_;
	bool b2 = num_ <= denom_;
	
	// if constitution is correct then we report that there was a change, but otherwise we report the incorrect change as well.
	// if constitution updated, check if it is correct. 
	assert changed => b1, "Updated constitution: Constitution must be at least majority, but got less: ${num_} to ${denom_}";
	assert changed => b2, "Updated constitution: Constitution cannot demand more than unanimous, but got ${num_} to ${denom_}";
	
	// we're going to demand hard equality here - so 1/2 and 2/4 are INEQUAL
	assert (b1 && b2) => (changed), "Legal constitution may have changed";
}