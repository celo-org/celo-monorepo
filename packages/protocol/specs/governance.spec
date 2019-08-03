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
--> What we will check: 
	impossibility of: increase of p's yes votes for user u whose upvoted proposal is p 
	
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


/* That's for referendum...
rule no_double_upvote(uint256 p, address u) {

	env _e;
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = getVoteTotals(_e,p)


	env e_;
	
	uint256 yes_;
	uint256 no_;
	uint256 abstain_;
	_yes, _no, _abstain = getVoteTotals(e_,p)
}
*/

/*

A user should never be able to have multiple concurrent votes on the same proposal
A proposal should never be able to be promoted from the queue if it was proposed more than queueExpiry seconds ago
A proposal should never be able to be promoted from the queue if it was not in the top concurrentProposals of upvote received

*/

// SG: Could it be promoted with 0 votes? Check


