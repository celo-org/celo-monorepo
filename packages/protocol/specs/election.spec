
/* invariant - should revert when the min is greater than max


totalpreserved - total locked gold and election gold is at least as locked (can be more due to reward)

timing - you are not reward unless a min time has passed (avoid getting reawrd on fast election)

invaraint votes.total == votes.active + votes.pending ?


vote:
1.should add the group to the list of eligible groups
2. when the group has already been marked eligible
3. when moved to not eligible?

no one can gain 1% fast in say 10%
 
fast action can not have a rapid effect on someone else
with or without the operation similar  balance for both msg.sender and other
*/
 
pragma specify 0.1

methods {
	init_state()
	getElectableValidators() returns uint256,uint256 envfree
	getTotalPendingWithdrawals(address) returns uint256 
	getAccountNonvotingLockedGold(address) returns uint256 
	getPendingWithdrawalsLength(address) returns uint256 
	getPendingVotes(address,address) returns uint256 envfree
	withdraw(uint256) 
	userVotedFor(address,address) returns bool envfree
	getActiveVotesForGroupByAccount(address, address )returns uint256 envfree
	getPendingVotesForGroupByAccount(address, address )returns uint256 envfree
}


/*
if a user account voted for group than there is some pending or active votes for
that group from this user
*/
invariant userVotedHasLockedGoldInGroup(address account, address group) sinvoke userVotedFor(account,group) <=> (sinvoke getPendingVotesForGroupByAccount(group,account) > 0 || sinvoke getActiveVotesForGroupByAccount(group,account) > 0)
/* make sure all functions are analyzed successfully */
rule checkFunctionReachability(uint256 index,method f ) {
	env eF;
	calldataarg arg;
	sinvoke f(eF,index);
	assert false, "is reachable";
}


/* The total assets of a address account:
	ercBalanceOf + 
	lockedGold.getAccountNonvotingLockedGold +
	sum of all lockedGold.pendingWithdrawals +
	sum of election.pending.forGroup[group].byAccount[account] for all groups/

	is preserved by the election contract
	
*/
rule totalPreserved( address account,  method f)
{
	env e;
	require e.msg.sender==account;
	//we assume the sender is not the currentContract
	require account!=currentContract;
	require account!=0;
	uint256 _ercBalance = sinvoke ercBalanceOf(e,account); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(e,account);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(e,account);
	// we limit the amount of pending records due to loop handling 
	require sinvoke getPendingWithdrawalsLength(e,account) <= 2;
	uint256 _accountTotalElectionPending = sinvoke getTotalElectionPendingVotes(e,account);
	env eF;
	require eF.msg.sender==account;
	calldataarg arg;
	require !f.isView && !f.isPure;
	sinvoke f(eF,arg);
	
	uint256 ercBalance_ = sinvoke ercBalanceOf(e,account); 
	uint256 accoutNonVoting_ = sinvoke  getAccountNonvotingLockedGold(e,account);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(e,account);
	uint256 accountTotalElectionPending_ = sinvoke getTotalElectionPendingVotes(e,account);
	assert _ercBalance + _accoutNonVoting + _accountTotalPendingWithdrawals + _accountTotalElectionPending == ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_  + accountTotalElectionPending_, "Total of tokens not preserved";
}

 

/*
rule noBigGain( address a,  address g, method f)
{
	//we assume the sender is not the currentContract
	require a!=currentContract;
	require a!=0;
	// we limit the amount of pending records due to loop handling 
	require sinvoke getPendingWithdrawalsLength(e,a) <= 1;
	storage init = lastStorage;
	

	env eF;
	require eF.msg.sender==a;
	calldataarg argg;
	
	sinvoke revokePending(eF,argg);
	//sinvoke f(eF,arg);
	//sinvoke getTotalPendingWithdrawals(a);
	// we limit the amount of pending records due to loop handling 
	uint length = sinvoke getPendingWithdrawalsLength(e,a);
	require length <= 1;
	
	
	env e;
	require e.msg.sender==a;
	
	uint256 ercBalance_ = sinvoke ercBalanceOf(e,a); 
	uint256 accoutNonVoting_ = sinvoke  getAccountNonvotingLockedGold(a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(a);
	uint256 electionVote_ = sinvoke getPendingVotes(e,g,a);
	
	
	env eNoOp;
	require eNoOp.block.timestamp == e.block.timestamp + 1;
	require eNoOp.msg.sender==a;
	uint256 ercBalanceNoOp = sinvoke ercBalanceOf(eNoOp,a) at init; 
	uint256 accoutNonVotingNoOp = sinvoke  getAccountNonvotingLockedGold(a) at init ;
	uint256 accountTotalPendingWithdrawalsNoOp =  sinvoke getTotalPendingWithdrawals(a) at init;
	uint256 electionVoteNoOp = sinvoke getPendingVotes(e,g,a);
	
	assert ercBalanceNoOp + accoutNonVotingNoOp + accountTotalPendingWithdrawalsNoOp + electionVoteNoOp ==  ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_  + electionVote_, "Total of tokens not preserved";

}
*/

/* Make sure that always electableValidators min and max are correct:
min > 0 && max>=min */
rule  valid_electableValidators(method f) {
	uint256 _min;
	uint256 _max;
	_min,_max = sinvoke getElectableValidators();
	
	env eF;
	calldataarg arg;
	require  f.selector != setElectableValidators(uint256,uint256).selector;
	require !f.isPure && !f.isView;
	sinvoke f(eF,arg);
	
	uint256 min_;
    uint256	max_;
	min_,max_ = sinvoke getElectableValidators();
	assert (_min <= _max) => (min_ <= max_), "min should always stay be less than max";
	assert ( _min > 0 ) => ( min_ > 0), "min should always stay greater than zero";
	
}


//If “electValidators” does not revert, it always returns between electableValidators.min and electableValidators.max addresses
rule electValidatorReturnLength {
	
	uint256 _min;
	uint256 _max;
	_min,_max = sinvoke getElectableValidators();
	//a safe assumption as we verified it
	require (_min > 0 && _max >= _min);
	
	env e;
	uint256 len= sinvoke electValidatorSignersLength(e);
	
	assert len <= _max && len >= _min, "expecting validator signer to return addresses between electableValidators.min and electableValidators.max";
	
}
//Two reuslts of elect validator are different 
rule electValidatorReturnValues {
	
	env e;
	uint256 _min;
	uint256 _max;
	_min,_max = sinvoke getElectableValidators();
	//a safe assumption as we verified it
	require (_min > 0 && _max >= _min);


	address validator1;
	address validator2;
	validator1,validator2 = sinvoke electValidatorSignersTwoResults(e);
	assert (validator1==0 &&  validator2==0 ) || (validator1!=validator2), "expecting different addresses as validators";
}

/* dHondt returns:
1. a valid group id 
2. if elected from a group-id than that group has at least as members as elected 
3. no change to other groups number of elected
*/
rule dHondtReturn(uint256 numGroups) {
	env e;
	uint256 groupIndex;
	bool memberElected;
	uint256 anotherGroupIndex;
	require anotherGroupIndex < numGroups && sinvoke numMembersElected(e,anotherGroupIndex) <=  sinvoke numMembers(e,anotherGroupIndex);
	
	groupIndex,memberElected = sinvoke dHondWrapper(e,numGroups);
	
	assert memberElected  => (groupIndex < numGroups), "should return a valid group index";
	assert sinvoke getNumMembersElected(e,groupIndex) <= sinvoke getNumMembers(e,groupIndex), "can not elect more than nominated";
	assert sinvoke getNumMembersElected(e,anotherGroupIndex) <= sinvoke getNumMembers(e,anotherGroupIndex), "did not change other group";
}




/*
rule changeTo( address a,  address g, method f)
{
	//we assume the sender is not the currentContract
	env e;
	require a!=currentContract;
	require a!=0;
	// we limit the amount of pending records due to loop handling 
	require sinvoke getPendingWithdrawalsLength(e,a) <= 1;
	require e.msg.sender==a;
	
	
	uint256 _ercBalance = sinvoke ercBalanceOf(e,a); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(e,a);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(e,a);
	uint256 _electionVote = sinvoke getPendingVotes(g,a);
	
	env eF;
	require eF.msg.sender==a;
	calldataarg arg;
	require !f.isView && !f.isPure;
	sinvoke f(eF,arg);
	//sinvoke getTotalPendingWithdrawals(a);
	// we limit the amount of pending records due to loop handling 
	uint length = sinvoke getPendingWithdrawalsLength(eF,a);
	require length <= 1;
	
	uint256 ercBalance_ = sinvoke ercBalanceOf(e,a); 
	uint256 accoutNonVoting_ = sinvoke  getAccountNonvotingLockedGold(e,a);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(e,a);
	uint256 electionVote_ = sinvoke getPendingVotes(g,a);
	
		
	assert _ercBalance ==  ercBalance_ , "Total of ercBalance not preserved";
	assert  _accoutNonVoting == accoutNonVoting_ , "Total of accoutNonVoting not preserved";
	assert  _accountTotalPendingWithdrawals  ==  accountTotalPendingWithdrawals_  , "Total of ccountTotalPendingWithdrawals not preserved";
	assert  _electionVote ==   electionVote_, "Total of electionVote not preserved";
}
*/	


