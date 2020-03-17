

 
pragma specify 0.1

methods {
	init_state()
	getElectableValidators() returns uint256,uint256 envfree
	userVotedFor(address,address) returns bool envfree
	//getActiveVotesForGroupByAccount is a function that computes the active votes 
	getActiveVotesForGroupByAccount(address, address )returns uint256 envfree
	//getActiveVotesForGroupByAccountRAW function is for the getting the raw information form the strcture
	getActiveVotesForGroupByAccountRAW(address, address )returns uint256 envfree
	getPendingVotesForGroupByAccount(address, address )returns uint256 envfree
	getTotalElectionPendingVotesForGroup(address)  returns uint256 envfree
    getTotalElectionActiveVotesForGroup(address)  returns uint256 envfree
	getTotalUnitsVotingForGroup(address) returns uint256 envfree
	getTotalActiveVotesForGroup(address) returns uint256 envfree
	isAccount(address) returns bool envfree
	getGroupEligibility(address) returns bool envfree 
	// todo - check if needed
	getTotalPendingWithdrawals(address) returns uint256 
	getAccountNonvotingLockedGold(address) returns uint256 
	getPendingWithdrawalsLength(address) returns uint256 
	getPendingVotes(address,address) returns uint256 envfree
	withdraw(uint256) 
	
}


/***
If a user account voted for group than there is some pending or active votes for that group from this user
***/
invariant userVotedHasLockedGoldInGroup(address account, address group) sinvoke userVotedFor(account,group) <=> (sinvoke getPendingVotesForGroupByAccount(group,account) > 0 || sinvoke getActiveVotesForGroupByAccountRAW(group,account) > 0)

/****
A group's total voting in units is at least as much as the total active votes  
***/
invariant unitsMoreThanActive(address group) 
	sinvoke getTotalUnitsVotingForGroup(group) >= sinvoke getTotalActiveVotesForGroup(group)    

/****
A group's total active is at least as the votes from an account 
TODO certora

invariant totalActiveVotesMoreThanAccountVotes(address group )
	sum for address account. sinvoke getActiveVotesForGroupByAccountRAW(group,account) <= sinvoke getTotalActiveVotesForGroup(group)
****/	

/****
A group is a valid account 
****/
invariant validGroup(address group)
	sinvoke getGroupEligibility(group) =>  sinvoke isAccount(group)	



/*** 
Always in electableValidators: min > 0 && max>=min 
***/
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


/***
If elect validator  returns more than one validator than they are different 
****/

rule electValidatorReturnValues {
	
	env e;
	uint256 _min;
	uint256 _max;
	_min,_max = sinvoke getElectableValidators();
	//a safe assumption as we verified it in rule valid_electableValidators
	require (_min > 0 && _max >= _min);

	address validator1;
	address validator2;
	validator1,validator2 = sinvoke electValidatorSignersTwoResults(e);
	assert (validator1==0 &&  validator2==0 ) || (validator1!=validator2), "expecting different addresses as validators";
}



/***
 Set of rules to verify dHondt. Using a wrapper as the funciton is internal
 ***/ 
 
 /* An ineligible group can not be elected */ 
rule ineligibleGroupCannotBeElected(address group) {
	env e;
	sinvoke markGroupIneligible(e,group);
	// safely assume that the group is not in the ghost list
	require !sinvoke groupInGhostElectionGroups(e,group); // TODO write a rule for markGroupIneligible? (although it can be inferred from the list check of `remove`)
	uint256 groupIndex;
	bool memberElected;
	groupIndex,memberElected = sinvoke dHondtWrapper(e);
	address groupElected = sinvoke getGroupFromGroupId(e,groupIndex);
	assert !memberElected  || group!=groupElected, "ineligibile group should not be elected";
}

/* If dHondt elects another member it should be from a valid group index  */ 
rule dHondtReturnsValidGroup() {
	env e;
	uint256 numGroups = sinvoke getNumGroups(e);
	bool memberElected;
	uint256 groupIndex;
	groupIndex,memberElected = sinvoke dHondtWrapper(e);
	assert memberElected  => (groupIndex < numGroups), "should return a valid group index";
}

/* dHondt can elect a member only if the group has members to elect (that have not been elected) */
rule dHondtReturnsElectable(address group) {
	env e;
	uint256 groupIndex;
	bool memberElected;
	/* we need to assume the group is in a valid state and verify that it says so after an election */
	require sinvoke getNumMembersElected(e,group) <= sinvoke getNumMembers(e,group);	
	groupIndex,memberElected = sinvoke dHondtWrapper(e);	 
	assert groupIndex==group && memberElected => sinvoke getNumMembersElected(e,groupIndex) <= sinvoke getNumMembers(e,groupIndex), "can not elect more than nominated";
}

/* dHondt does not change properties of a group not currently elected*/
rule dHondtNoEffectOnOthers(uint256 numGroups,address anotherGroupIndex) {
	env e;
	uint256 groupIndex;
	bool memberElected;
	uint256 numMembersElectedBefore = sinvoke getNumMembersElected(e,anotherGroupIndex);
	uint256 numMembersBefore = sinvoke getNumMembers(e,anotherGroupIndex);
	groupIndex,memberElected = sinvoke dHondtWrapper(e);
	uint256 numMembersElectedAfter = sinvoke getNumMembersElected(e,anotherGroupIndex);
	uint256 numMembersAfter = sinvoke getNumMembers(e,anotherGroupIndex);
	assert  groupIndex != anotherGroupIndex => (numMembersElectedBefore==numMembersElectedAfter &&numMembersBefore==numMembersAfter) , "did not change other group";
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


