
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







/* Set of rules to verify dHondt. Note that using a warrper to call dHont with ghost variables defined in harness code*/ 
rule ineligibileGroupCannotBeElected(address group) {
	env e;
	sinvoke markGroupIneligible(e,group);
	// safely assume that the group is not in the list
	require !sinvoke groupInGhostElectionGroups(e,group);
	uint256 groupIndex;
	bool memberElected;
	groupIndex,memberElected = sinvoke dHondWrapper(e);
	address groupElected = sinvoke getGroupFromGroupId(e,groupIndex);
	assert !memberElected  || group!=groupElected, "ineligibile group should not be elected";
	
}

/* dHondt should return a valid group index when a member is elected */ 
rule dHondtReturnsValidGroup() {
	env e;
	uint256 numGroups = sinvoke getNumGroups(e);
	bool memberElected;
	uint256 groupIndex;
	groupIndex,memberElected = sinvoke dHondWrapper(e);
	assert memberElected  => (groupIndex < numGroups), "should return a valid group index";
}

/* dHont can elect a member only if the group has members to elect (that have not been elected) */
rule dHondtReturnsElectable(address group) {
	env e;
	uint256 groupIndex;
	bool memberElected;
	/* we need to assume the group is in a valid state and verify that it says so after an election */
	require sinvoke getNumMembersElected(e,group) <= sinvoke getNumMembers(e,group);
	
	groupIndex,memberElected = sinvoke dHondWrapper(e);
	 
	assert groupIndex==group && memberElected => sinvoke getNumMembersElected(e,groupIndex) <= sinvoke getNumMembers(e,groupIndex), "can not elect more than nominated";

}

/* dHont can elect a member only if the group has members to elect (that have not been elected) */
rule dHondtNoEffectOnOthers(uint256 numGroups,address anotherGroupIndex) {
	env e;
	uint256 groupIndex;
	bool memberElected;
	uint256 numMembersElectedBefore = sinvoke getNumMembersElected(e,anotherGroupIndex);
	uint256 numMembersBefore = sinvoke getNumMembers(e,anotherGroupIndex);
	
	groupIndex,memberElected = sinvoke dHondWrapper(e);
	uint256 numMembersElectedAfter = sinvoke getNumMembersElected(e,anotherGroupIndex);
	uint256 numMembersAfter = sinvoke getNumMembers(e,anotherGroupIndex);
	
	
	assert  groupIndex != anotherGroupIndex => (numMembersElectedBefore==numMembersElectedAfter &&numMembersBefore==numMembersAfter) , "did not change other group";
}


/*
No validator is able to be elected from a group A if there exists another unelected validator  in group B  (where A may equal B) such that number_of_votes_for_A/num_memeber_to_be_elected_in_A <
number_of_votes_for_B/num_memeber_to_be_elected_in_B
*/
rule validatorElectedOrder(address A, address B ) {
	env e;
	require A != B ;
	uint256 numVotesForA = sinvoke votesForGroup(e,A);
	uint256 numVotesForB = sinvoke votesForGroup(e,B);
	//lets assume totalvaotes is more than zero
	require numVotesForA+numVotesForB > 0;
	//avoid division by zero
	uint256 indexOfA = sinvoke getNumMembersElected(e,A) + 1;
	uint256 indexOfB = sinvoke getNumMembersElected(e,B) + 1;
	//since the SMT solver will not be able to prove complex non-linear arthemetics
	require indexOfA==indexOfB || numVotesForA==numVotesForB;
	
	bool memberElected;
	uint256 groupIndex;
	groupIndex,memberElected = sinvoke dHondWrapper(e);
	//multipication instead of division and need to help the solver
	require numVotesForA <= 2  && numVotesForB <= 2 && indexOfA<= 2 && indexOfB<=2;
	assert (memberElected && groupIndex== sinvoke getGroupIdInElection(e,A))  =>
		numVotesForA*indexOfB >= numVotesForB*indexOfA;
	
}


/*if revoke pending or active succeeds then the total number of votes for a group decreases by exactly “value”
*/
rule revokeDecreaseVotes(
	address account, 
	address group,
	uint256 value, 
    address lesser,
    address greater,
    uint256 index,
	bool activeOrPending)
{
	env e;
	require e.msg.sender == account;
	uint256 totalvotesBefore = sinvoke getTotalVotesForGroup(e,group);
	if (activeOrPending) {
		sinvoke revokePending(e,group,value,lesser,greater,index);
		}
	else {
		sinvoke revokeActive(e,group,value,lesser,greater,index);
		}
	uint256 totalvotesAfter = sinvoke getTotalVotesForGroup(e,group);
	assert totalvotesAfter == totalvotesBefore - value, "when revoking expecting total votes to decrease accordingly";
		
}



///////////////////// work in progress
/*
rule ineligibileGroupRemoved(address group) {
	env e;
	 
	require sinvoke getGroupEligibility(e,group);
	// @shelly - need help undertsading here - can the inner call to linkedlist.remove revert and we still ha
	sinvoke markGroupIneligible(e,group);
	assert !sinvoke getGroupEligibility(e,group);
}
*/

/*
just a rule to check which function update what - can continue to a rule
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


/*
//If “electValidators” does not revert, it always returns between electableValidators.min and electableValidators.max addresses 

rule electValidatorReturnLength() {
	
	uint256 _min;
	uint256 _max;
	_min,_max = sinvoke getElectableValidators();
	//a safe assumption as we verified it
	require (_min > 0 && _max >= _min);
	
	env e;
	uint256 len= sinvoke electValidatorSignersLength(e);
	
	assert len <= _max && len >= _min, "expecting validator signer to return addresses between electableValidators.min and electableValidators.max";
	
}
*/ 

/*
When there are no votes to any group (totalVotes==0) then the election process is reverted 
rule electValidatorRevertsWhenNoVotes() {


}
*/



/* make sure all functions are analyzed successfully */
/*
rule checkFunctionReachability(uint256 index,method f ) {
	env eF;
	calldataarg arg;
	sinvoke f(eF,index);
	assert false, "is reachable";
}
*/

/* The total assets of a address account:
	ercBalanceOf + 
	lockedGold.getAccountNonvotingLockedGold +
	sum of all lockedGold.pendingWithdrawals +
	sum of election.pending.forGroup[group].byAccount[account] for all groups/

	is preserved by the election contract
	question: what about the reward - it is passed only to the group?
	
	
*/
/*
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
*/
 

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