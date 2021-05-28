
/** Requires correction **/

rule no_double_vote_referendum_vote(address account, uint256 deqIndex) {
	/* A user that already has a vote record for a dequeued index, cannot make a transaction that will increase the weight of that choice */
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
	
	require accounts.voteSignerToAccount(eF.msg.sender) == account;
	uint256 someP; uint256 someIndex; uint8 someValue;
	
	uint256 pOfSomeIndex;
	pOfSomeIndex, _, _ = getVoteRecord(account,someIndex);
	require pOfSomeIndex == p => someIndex == deqIndex; // no duplicates in the dequeued array
	require someP == p => someIndex == deqIndex;
	
	vote(eF,someP,someIndex,someValue);
	
	
	uint256 yes_; uint256 no_; uint256 abstain_;
	yes_,no_,abstain_ = getVoteTotals(p);
	
	bool doesProposalExist_ = proposalExists(e_,p);
	
	// if p expires, then sum of votes is no longer relevant - happens in approve, vote, execute
	assert (recordValue != NONE_ENUM && doesProposalExist_) => (yes_ + no_ + abstain_) == (_yes + _no + _abstain), "Total votes could not have changed if already voted";
	assert recordValue == YES => yes_ <= _yes, "Yes votes could not have increased if voted yes already";
	assert recordValue == NO => no_ <= _no, "No votes could not have increased if voted no already";
	assert recordValue == ABSTAIN => abstain_ <= _abstain, "Abstain votes could not have increased if voted abstain already";
	assert recordValue == NONE_ENUM => (!doesProposalExist_ && yes_ == 0 && no_ == 0 && abstain_ == 0)// proposal no longer exists so everything is 0
									// or just one out of (yes,no,abstain) changed
									|| (yes_ == _yes && no_ == _no)
									|| (yes_ == _yes && abstain_ == _abstain)
									|| (no_ == _no && abstain_ == _abstain),
									"If previously did not vote, either this proposal was deleted, or only one kind of vote may change, and the other two are the same";
}


/* The sum of yes votes for a proposal cannot exceed total weight - requires linked LockedGold */
// this rule requires linkage of LockedGold
rule sum_of_votes_cannot_exceed_total_weight(method f, uint256 p) filtered { f -> !f.isView } {
	uint256 _totalWeight = getTotalLockedGold();
	// TODO: Must make sure that governance is not capable of invoking any function that changes the state of BondedDeposits and specifically totalWeight
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = getVoteTotals(p);
	
	require _yes+_no+_abstain <= _totalWeight;
	
    callArbitrary(f);
	
	uint256 totalWeight_ = getTotalLockedGold();
	
	uint256 yes_;
	uint256 no_;
	uint256 abstain_;
	yes_, no_, abstain_ = getVoteTotals(p);
	
	assert yes_+no_+abstain_ <= totalWeight_, "Sum of votes for a proposal cannot exceed total weight";
}


rule constitution_change_legal(method f) filtered { f -> !f.isView } {
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
	// TODO: This needs to be re-written based on new library for fractions
	/*
	bool b1 = num_*2 <= denom_;
	bool b2 = num_ <= denom_;
	
	// if constitution is correct then we report that there was a change, but otherwise we report the incorrect change as well.
	// if constitution updated, check if it is correct. 
	assert changed => b1, "Updated constitution: Constitution must be at least majority, but got less: ${num_} to ${denom_}";
	assert changed => b2, "Updated constitution: Constitution cannot demand more than unanimous, but got ${num_} to ${denom_}";
	*/
	assert true;
}