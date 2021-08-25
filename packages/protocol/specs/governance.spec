using Accounts as accounts

methods {
	vote(uint256,uint256,uint8) returns bool
		
	getProposalSlim(uint256) returns address, uint256, uint256, uint256 envfree	
	stageDurations() returns uint256,uint256,uint256 envfree
	getUpvotes(uint256) returns uint256 envfree
	getUpvotedProposal(address) returns uint256 envfree
	getUpvoteRecord(address) returns uint256, uint256 envfree
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
  getMostRecentReferendumProposal(address) returns uint256 envfree
  proposalExists(uint256) returns bool
  getVotedId(address, uint256) returns uint256 envfree

  // dispatches to Accounts
  voteSignerToAccount(address) => DISPATCHER(true) UNRESOLVED
  getVoteSigner(address) returns address => DISPATCHER(true) UNRESOLVED
  accounts.voteSignerToAccount(address) returns (address) envfree
  accounts.getVoteSigner(address) returns (address) envfree
}

ghost votedFor(address,uint256) returns bool { // voter to proposal id voted for
    init_state axiom forall address v. forall address p. !votedFor(v, p);
}

hook Sstore voters[KEY address x].(offset 96)/*referendumVotes*/[KEY uint256 indx].(offset 32)/*proposal ID */ uint256 id STORAGE {
    require 0 <= x && x <= max_uint160;
    havoc votedFor assuming votedFor@new(x,id) == true
        && (forall address y. forall uint z. (y != x || z != id => votedFor@new(y,z) == votedFor@old(y,z)));
} 

ghost dequeuedArray(uint256) returns uint256;

hook Sstore dequeued[INDEX uint256 i] uint256 id STORAGE {
    havoc dequeuedArray assuming (forall uint256 j. j != i => dequeuedArray@new(j) == dequeuedArray@old(j) && dequeuedArray@new(i) == id);
}

hook Sload uint256 id dequeued[INDEX uint256 i] STORAGE {
    require dequeuedArray(i) == id;
}

// consistency
invariant dequeuedIsWithinRange(uint i) getFromDequeued(i) <= proposalCount()


// upvoting
rule upvotesConsistency(address u, method f) filtered { f -> !f.isView } {
    uint _p;
    uint _w;
    _p, _w = getUpvoteRecord(u);

    callArbitrary(f);

    uint p_;
    uint w_;
    p_, w_ = getUpvoteRecord(u);
    assert (_p == p_ && _w == w_) || upvoteInv(p_, w_);
    // the invariant is upvoteInv, defined here
} 

definition upvoteInv(uint p, uint w) returns bool 
    = (p != 0 && w > 0) || (p == 0 && w == 0)
    ;

rule no_double_upvote(uint256 p, address u) {
	uint256 _upvotes = getUpvotes(p);
	uint256 _usersUpvotedProposal = getUpvotedProposal(u);
	env e;
	require e.msg.sender == u && u != 0; // note that the sender is the signer here
    require accounts.voteSignerToAccount(u) == u;
	uint256 lesser; 
    uint256 greater;
	upvote(e, p, lesser, greater);
	uint256 upvotes_ = getUpvotes(p);
	
    uint voteRecordP;
    uint voteRecordW;
    voteRecordP, voteRecordW = getUpvoteRecord(u);
    require upvoteInv(voteRecordP, voteRecordW);
	assert _usersUpvotedProposal == p => upvotes_ <= _upvotes, 
		"Upvotes increased from ${_upvotes} to ${upvotes_} even though upvoted by user $u who already upvoted $p";
}

rule proposal_count_monotonic_increasing(method f) filtered { f -> !f.isView } {
	// proposal count is monotonic increasing (strictly in propose)
		
	uint256 _count = proposalCount();
	
    callArbitrary(f);

	uint256 count_ = proposalCount();
	
	if (f.selector == propose(uint256[],address[],bytes,uint256[],string).selector && !f.isFallback) {
		assert count_ > _count, "Successful propose must increase proposal count";
		assert count_ > 0, "Proposal cannot be 0"; // this is already obvious - even one proposal will increase count to 1
	}

	assert count_ >= _count, "Proposal count must not decrease";
}


// referendum
rule no_referendum_votes_unless_approved(method f, uint256 p) filtered { f -> !f.isView } {
	// A proposal should never be able to receive a vote unless it was approved
	env eF;
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = getVoteTotals(p);
	
	// no votes currently
	require _yes == 0 && _no == 0 && _abstain == 0;
	
	bool _isProposalApproved = isApproved(p);
	
	callArbitrary(f);
	
	uint256 yes_;
	uint256 no_;
	uint256 abstain_;
	yes_, no_, abstain_ = getVoteTotals(p);
	
	assert (yes_ != 0 || no_ != 0 || abstain_ != 0) => _isProposalApproved, 
		"Cannot move from 0 votes to positive number of yes,no,abstain votes unless proposal $p is approved.";
}

rule cant_unvote(uint256 deqIndex, uint8 voteValue) {	
    env eF;
	uint256 NONE_ENUM = getNoneVoteEnum();
	// get the voting delegate
	address voterDelegate = accounts.getVoteSigner(eF.msg.sender);
	
	// check if voted
    uint256 p;
	uint256 recordValue;
    uint256 weight;
	p, recordValue, weight = getVoteRecord(voterDelegate,deqIndex);
	bool result = vote(eF,p,deqIndex,voteValue);
	
	uint256 recordValue_;
    uint256 weight_;
	_, recordValue_, weight_ = getVoteRecord(voterDelegate,deqIndex);
	
	assert voteValue == NONE_ENUM => (!result && recordValue_ == recordValue && weight_ == weight), "Cannot vote for none: function either returns false and did not update the vote, or it reverted"; // not voting none. reverting is fine and is encoded by the safe invoke
}

/* A user that already has a vote record for a dequeued index, cannot make a transaction that will increase the weight of that choice */
rule no_double_vote_referendum_all_but_vote(method f, address account, uint256 deqIndex) filtered { f -> !f.isView } {
	env eF; 
	env eFTime; // same time as eF;
	env e_;
	
	uint256 NONE_ENUM = getNoneVoteEnum();
	uint256 ABSTAIN = getAbstainVoteEnum();
	uint256 YES = getYesVoteEnum();
	uint256 NO = getNoVoteEnum();
	
	uint256 p; // a proposal - let's assume it already exists (required for propose() verification)
	uint256 recordValue;
	p, recordValue, _ = getVoteRecord(account,deqIndex);
	uint256 currentProposalCount = proposalCount();
	require currentProposalCount >= p;
	
	
	uint256 _yes; uint256 _no; uint256 _abstain;
	_yes,_no,_abstain = getVoteTotals(p);
	
	// if can't vote for NONE_ENUM, then necessarily if record vote is NONE_ENUM, all votes are zero currently
	require recordValue == NONE_ENUM => (_yes == 0 && _no == 0 && _abstain == 0);
	
	
	calldataarg arg;
	require f.selector != vote(uint256,uint256,uint8).selector;
    require f.selector != revokeVotes().selector;
	require !f.isView;
	require eF.msg.sender == account;
	f(eF,arg);
	
	uint256 yes_; uint256 no_; uint256 abstain_;
	yes_,no_,abstain_ = getVoteTotals(p);
	
	bool doesProposalExist_ = proposalExists(e_,p);
	
	// if p expires, then sum of votes is no longer relevant - happens in approve, vote, execute
	assert (recordValue != NONE_ENUM && doesProposalExist_) => (yes_ + no_ + abstain_) == (_yes + _no + _abstain), "Total votes could not have changed if already voted";
	assert recordValue == YES => yes_ <= _yes, "Yes votes could not have increased if voted yes already";
	assert recordValue == NO => no_ <= _no, "No votes could not have increased if voted no already";
	assert recordValue == ABSTAIN => abstain_ <= _abstain, "Abstain votes could not have increased if voted abstain already";
	assert recordValue == NONE_ENUM => (!doesProposalExist_ && yes_ == 0 && no_ == 0 && abstain_ == 0) // proposal no longer exists so everything is 0
									// or no votes changed
									|| (yes_ == _yes && no_ == _no && abstain_ == _abstain),
									"If previously did not vote, either this proposal was deleted, or no votes changed";
}

invariant referendumVoteIDIsLessThanOrEqCounter(address v, uint p) votedFor(v,p) => p <= proposalCount() {
    preserved vote(uint256 _, uint256 indx, uint8 vr) with (env e) {
        requireInvariant dequeuedIsWithinRange(indx); 
    }
}

// approval
rule approval_only_if_promoted_and_allowed(uint256 p, uint256 index) {
	// A proposal should never be able to be approved unless it was promoted from the queue
	env eF;
    env eGet;
    require eF.block.timestamp == eGet.block.timestamp;
    require eF.block.number == eGet.block.number;
	
	bool _isProposalApproved = isApproved(p);
	bool _isDequeued = getFromDequeued(index) == p;
	bool _isExpired = isDequeuedProposalExpired(eGet, p);
	
	address _approver = approver();
	require !_isProposalApproved; // we assume not approved yet
	require !_isExpired; // we also assume it did not expire
		
	approve(eF,p,index);
	// should check if dequeued right during approve
	bool isDequeued_ = getFromDequeued(index) == p;
	
	bool isProposalApproved_ = isApproved(p);
	
	assert isProposalApproved_ => _isDequeued || (!_isDequeued && isDequeued_), "Cannot approve proposal $p unless $index points to it before approve or during it"; // index has p
	assert isProposalApproved_ => eF.msg.sender == _approver, "Only approver ${_approver} can approve";
}

// proposalId is timestamp
rule approved_proposals_invariants(method f, uint256 p) filtered { f -> !f.isView } {
	env _e;
	env eF;
	env e_;
	
	// Existence depends on timestamp, and we assume we are well past 0
	require e_.block.timestamp >= eF.block.timestamp 
			&& eF.block.timestamp >= _e.block.timestamp 
			&& _e.block.timestamp > 0;
			
	bool _doesProposalExist = proposalExists(_e,p);
	bool _isApprovedProposal = isApproved(p);
	
	require _isApprovedProposal => _doesProposalExist; // if a proposal is approved, it must be existent
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	bool doesProposalExist_ = proposalExists(e_,p);
	bool isApprovedProposal_ = isApproved(p);
	
	assert isApprovedProposal_ => doesProposalExist_, "An approved proposal must exist";
	assert _isApprovedProposal => isApprovedProposal_ || !doesProposalExist_, "An approved proposal cannot be disapproved if it still exists";
}

// execute
rule execute_preconds(uint256 p, uint256 index) {
	// A proposal should never be executable when there are at least as many no votes as yes votes
	// TODO: A proposal should never be executable unless it received a yes:no vote ratio greater than that specified in the constitution
	env _e;
	env eF;
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = getVoteTotals(p);
	
	bool executeRetval = execute@withrevert(eF,p,index);
	bool executeReverted = lastReverted;
	
	assert _no >= _yes => (!executeRetval || executeReverted), "If there are more no votes than yes votes, then we cannot succeed in executing";
	// TODO: may require to make sure that all constitutions demand at least majority
}


// exploring the state
rule modifying_stageDuration(method f) filtered { f -> 
    !f.isView 
    && f.selector != initialize(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256).selector
    && f.selector != setApprovalStageDuration(uint256).selector
    && f.selector != setExecutionStageDuration(uint256).selector
    && f.selector != setReferendumStageDuration(uint256).selector
} {
	uint256 old1; uint256 old2; uint256 old3;
    old1, old2, old3 = stageDurations();
	
    callArbitrary(f);
  	
    uint256 new1;
	uint256 new2;
	uint256 new3;
	new1, new2, new3 = stageDurations();

    assert old1 == new1 && old2 == new2 && old3 == new3;
}

rule can_add_to_queue(method f) filtered { f -> 
    !f.isView
    && f.selector != propose(uint256[],address[],bytes,uint256[],string).selector
} {
	uint256 _queueLength = getQueueLength();
	
	callArbitrary(f);
	
	uint256 queueLength_ = getQueueLength();
	
	assert queueLength_ <= _queueLength, 
		"Method can queue elements - should check separately that cannot queue proposal IDs equal 0 (proposal_count_monotonic_increasing)";
}

rule constitution_change(method f) filtered { f -> 
    !f.isView
        && f.selector != setConstitution(address,bytes4,uint256).selector
} {
	env _e;
	env eF;
	env e_;
	
	calldataarg arg_getConstitution;
	
	uint256 _res;
	_res = getConstitution(_e,arg_getConstitution);
	
    callArbitrary(f);
	
	uint256 res_;
	res_ = getConstitution(e_,arg_getConstitution);
	
	bool changed = !(_res == res_);
	
	// we're going to demand hard equality here - so 1/2 and 2/4 are INEQUAL
	assert !changed, "changes constitution";
}

// initialization rules
rule only_initializer_changes_initialized_field(method f) filtered { f -> !f.isView } {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = initialized(_e);
		
	require f.selector != initialize(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256).selector;
	
    callArbitrary(f);
	
	bool isInitialized_ = sinvoke initialized(e_);
	
	assert _isInitialized == isInitialized_, "Method $f is not expected to change initialization field from ${_isInitialized} to ${isInitialized_}";
}

rule check_initializer {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = initialized(_e);
	
	calldataarg arg;
	initialize@withrevert(eF,arg);
	bool successInit = !lastReverted;
	
	bool isInitialized_ = initialized(e_);
	
	assert _isInitialized => !successInit, "initialize() must revert if already initialized";
	assert successInit => isInitialized_, "When initialize() succeeds, must set initialization field to true";
}

/**
 * A utility for shortening calls to arbitrary functions in which we do not care about the environment.
 */
function callArbitrary(method f) {
	env e;
	calldataarg arg;
	f(e, arg);
}
