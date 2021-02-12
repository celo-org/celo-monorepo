pragma specify 0.1

methods {
	//election getters
	getTotalVotesForGroup(address)  returns uint256 envfree
	getPendingVotesForGroupByAccount(address, address )returns uint256 envfree
	getPendingVotesForGroup(address)  returns uint256 envfree
    getActiveVotesForGroup(address)returns uint256 envfree
	getActiveVotesForGroupByAccount(address, address )returns uint256 envfree
	getActiveVoteUnitsForGroupByAccount(address , address ) returns uint256 envfree
	getActiveVoteUnitsForGroup(address)returns uint256 envfree
	getElectableValidators() returns uint256,uint256 envfree
	
	// lockedgold functions
	getAccountNonvotingLockedGold(address) returns uint256 envfree  
	getPendingWithdrawalsLength(address) returns uint256 envfree
	getTotalLockedGold(address) returns uint256 envfree  
	getTotalPendingWithdrawals(address) returns uint256 envfree
	
	// account functions
	getVoteSignerToAccount() returns address 

	getLockedGoldFromSepc() returns address envfree
	ercBalance(address) returns uint256 envfree
}


/* 
Legal state invariant

tu - totalUnitsVotingForGroup 
ta - totalActiveVotesForGroup

	Always (tu==0 && ta==0) || (tu!=0 && ta!=0 && tu <= ta)
	for all account 
		units(account) <= tu &&
		units(account) == tu ==> votes(account) == ta

*/
rule legalStateInvariant(address group, address account, method f) {
	uint256 _tu =  sinvoke getActiveVoteUnitsForGroup(group);
	uint256 _ta =  sinvoke getActiveVotesForGroup(group);
	uint256 _accountUnits = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 _accountVotes = sinvoke getActiveVotesForGroupByAccount(group, account);

	require ( ( _tu==0  && _ta ==0  || (_tu!=0 && _ta!=0 && _tu <= _ta) )&&
			_accountUnits <= _tu &&
			(_accountUnits == _tu => _accountVotes == _ta) &&
			(_accountVotes == _ta => _accountUnits == _tu)  );	

	env eF;
	calldataarg arg;
	require !f.isPure && !f.isView;
	require f.selector != forceDecrementVotes(address, uint256, address[], address[], uint256[]).selector;
	require (f.selector != distributeEpochRewards(address, uint256, address, address).selector || _tu > 0);
	require  sinvoke getVoteSignerToAccount(eF)==account;

	sinvoke f(eF,arg);

	uint256 tu_ =  sinvoke getActiveVoteUnitsForGroup(group);
	uint256 ta_ =  sinvoke getActiveVotesForGroup(group);
	uint256 accountUnits_ = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 accountVotes_ = sinvoke getActiveVotesForGroupByAccount(group, account);

	assert ( ( tu_==0  && ta_ ==0  || (tu_!=0 && ta_!=0 && tu_ <= ta_) )&&
			accountUnits_ <= tu_ &&
			(accountUnits_ == tu_ => accountVotes_ == ta_)  &&
			(accountVotes_ == ta_ => accountUnits_ == tu_));	

}


/*
Monotone increase of totalBalance over time (except on forceDecrementVotes)
totalBalance() <= ◯ totalBalance()
*/
rule totalPreserved( address account,  address group, method f)
{
	require sinvoke getPendingWithdrawalsLength(account)==1;
	//we assume the sender is not the currentContract neither the locked gold contract
	require account!=currentContract;
	require account!=sinvoke getLockedGoldFromSepc();
	require account!=0;
	uint256 _ercBalance = sinvoke ercBalance(account); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(account);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(account);
	uint256 _accountTotalElectionPending = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 _tu = sinvoke getActiveVoteUnitsForGroup(group);
	uint256 _ta =  sinvoke getActiveVotesForGroup(group);
	uint256 _accountUnits = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 _accountVotes = sinvoke getActiveVotesForGroupByAccount(group, account);

	require ( ( _tu==0  && _ta ==0  || (_tu!=0 && _ta!=0 && _tu <= _ta) )&&
			_accountUnits <= _tu &&
			(_accountUnits == _tu => _accountVotes == _ta) &&
			(_accountVotes == _ta => _accountUnits == _tu)  );	


	env eF;
	calldataarg arg;
	// When verfiying  fucntiona safely assume it is regarding for the group being checked.
	// This is safe since we now that in each operation at most one group's properties can change.
	require f.selector != forceDecrementVotes(address, uint256, address[], address[], uint256[]).selector &&
	f.selector != vote(address, uint256, address, address).selector &&
	f.selector != revokeActive(address, uint256, address, address, uint256).selector &&
	f.selector != revokePending(address, uint256, address, address, uint256).selector &&
	f.selector != distributeEpochRewards(address,uint256,address,address).selector && 
	f.selector != activate(address).selector ;
	require !f.isView && !f.isPure;
	
	sinvoke f(eF,arg);
	
	uint256 ercBalance_ = sinvoke ercBalance(account); 
	uint256 accoutNonVoting_ = sinvoke  getAccountNonvotingLockedGold(account);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(account);
	uint256 accountTotalElectionPending_ = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 accountVotes_ = sinvoke getActiveVotesForGroupByAccount(group, account);
	assert  _ercBalance + _accoutNonVoting + _accountTotalPendingWithdrawals + _accountTotalElectionPending + _accountVotes == 
			ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_ + accountTotalElectionPending_ + accountVotes_, "Total of assets is not preserved";
}

rule totalPreservedOnVote( address account,  address group)
{
	require sinvoke getPendingWithdrawalsLength(account)==1;
	//we assume the sender is not the currentContract neither the locked gold contract
	require account!=currentContract;
	require account!=sinvoke getLockedGoldFromSepc();
	require account!=0;
	uint256 _ercBalance = sinvoke ercBalance(account); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(account);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(account);
	uint256 _accountTotalElectionPending = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 _tu = sinvoke getActiveVoteUnitsForGroup(group);
	uint256 _ta =  sinvoke getActiveVotesForGroup(group);
	uint256 _accountUnits = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 _accountVotes = sinvoke getActiveVotesForGroupByAccount(group, account);

	require ( ( _tu==0  && _ta ==0  || (_tu!=0 && _ta!=0 && _tu <= _ta) )&&
			_accountUnits <= _tu &&
			(_accountUnits == _tu => _accountVotes == _ta) &&
			(_accountVotes == _ta => _accountUnits == _tu)  );	


	env eF;
	uint256 index;
	uint256 value;
	address lesser;
	address greater;
	require( value != _ta);
	sinvoke vote(eF, group, value, lesser, greater); 
	uint256 ercBalance_ = sinvoke ercBalance(account); 
	uint256 accoutNonVoting_ = sinvoke  getAccountNonvotingLockedGold(account);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(account);
	uint256 accountTotalElectionPending_ = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 accountVotes_ = sinvoke getActiveVotesForGroupByAccount(group, account);
	assert  _ercBalance + _accoutNonVoting + _accountTotalPendingWithdrawals + _accountTotalElectionPending + _accountVotes == 
			ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_ + accountTotalElectionPending_ + accountVotes_, "Total of assets is not preserved";
}


rule totalPreservedOnRevokePending( address account,  address group)
{
	require sinvoke getPendingWithdrawalsLength(account)==1;
	//we assume the sender is not the currentContract neither the locked gold contract
	require account!=currentContract;
	require account!=sinvoke getLockedGoldFromSepc();
	require account!=0;
	uint256 _ercBalance = sinvoke ercBalance(account); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(account);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(account);
	uint256 _accountTotalElectionPending = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 _tu = sinvoke getActiveVoteUnitsForGroup(group);
	uint256 _ta =  sinvoke getActiveVotesForGroup(group);
	uint256 _accountUnits = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 _accountVotes = sinvoke getActiveVotesForGroupByAccount(group, account);

	require ( ( _tu==0  && _ta ==0  || (_tu!=0 && _ta!=0 && _tu <= _ta) )&&
			_accountUnits <= _tu &&
			(_accountUnits == _tu => _accountVotes == _ta) &&
			(_accountVotes == _ta => _accountUnits == _tu)  );	


	env eF;
	uint256 index;
	uint256 value;
	address lesser;
	address greater;
	
	sinvoke revokePending(eF, group, value, lesser, greater, index); 
	uint256 ercBalance_ = sinvoke ercBalance(account); 
	uint256 accoutNonVoting_ = sinvoke  getAccountNonvotingLockedGold(account);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(account);
	uint256 accountTotalElectionPending_ = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 accountVotes_ = sinvoke getActiveVotesForGroupByAccount(group, account);
	assert  _ercBalance + _accoutNonVoting + _accountTotalPendingWithdrawals + _accountTotalElectionPending + _accountVotes == 
			ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_ + accountTotalElectionPending_ + accountVotes_, "Total of assets is not preserved";
}


rule totalPreservedOnRevokeActive( address account,  address group)
{
	require sinvoke getPendingWithdrawalsLength(account)==1;
	//we assume the sender is not the currentContract neither the locked gold contract
	require account!=currentContract;
	require account!=sinvoke getLockedGoldFromSepc();
	require account!=0;
	
	uint256 _ercBalance = sinvoke ercBalance(account); 
	uint256 _accoutNonVoting = sinvoke getAccountNonvotingLockedGold(account);
	uint256 _accountTotalPendingWithdrawals =  sinvoke getTotalPendingWithdrawals(account);
	uint256 _accountTotalElectionPending = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 _tu = sinvoke getActiveVoteUnitsForGroup(group);
	uint256 _ta =  sinvoke getActiveVotesForGroup(group);
	uint256 _accountUnits = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 _accountVotes = sinvoke getActiveVotesForGroupByAccount(group, account);

	require ( ( _tu==0  && _ta ==0  || (_tu!=0 && _ta!=0 && _tu <= _ta) )&&
			_accountUnits <= _tu &&
			(_accountUnits == _tu => _accountVotes == _ta) &&
			(_accountVotes == _ta => _accountUnits == _tu)  );	


	env eF;
	uint256 index;
	uint256 value;
	address lesser;
	address greater;
	require sinvoke getVoteSignerToAccount(eF)==account;
	sinvoke revokeActive(eF, group, value, lesser, greater, index);
	uint256 ercBalance_ = sinvoke ercBalance(account); 
	uint256 accoutNonVoting_ = sinvoke  getAccountNonvotingLockedGold(account);
	uint256 accountTotalPendingWithdrawals_ =  sinvoke getTotalPendingWithdrawals(account);
	uint256 accountTotalElectionPending_ = sinvoke getPendingVotesForGroupByAccount(group, account);
	uint256 accountVotes_ = sinvoke getActiveVotesForGroupByAccount(group, account);
	assert  _ercBalance + _accoutNonVoting + _accountTotalPendingWithdrawals + _accountTotalElectionPending + _accountVotes == 
			ercBalance_ + accoutNonVoting_ + accountTotalPendingWithdrawals_ + accountTotalElectionPending_ + accountVotes_, "Total of assets is not preserved";
}


/*
Distributivity to avoid frauds: 
Revoking x + y is the same as revoking x and revoking y 
*/
rule distributivityRevoking(address group, uint256 x, uint256 y, address lesser, address greater, uint256 index) {
	env eActive;
	env eRevoke;
	address accountA = sinvoke getVoteSignerToAccount(eActive);
	storage init = lastStorage;
	require(eActive.msg.sender == eRevoke.msg.sender);
	sinvoke revokeActive(eRevoke,group,x,lesser,greater,index);
	sinvoke revokeActive(eRevoke,group,y,lesser,greater,index);
	uint256 nonVoting_two = sinvoke getAccountNonvotingLockedGold(accountA);
	sinvoke revokeActive(eRevoke,group,x+y,lesser,greater,index) at init;
	uint256 nonVoting_one = sinvoke getAccountNonvotingLockedGold(accountA);
	assert(nonVoting_two == nonVoting_one , "expecting user to have the same assets");
}

/*
Aggregation of active votes 
unitsForGroup(group) == sum( for address account. unitsForGroupByAccount(group,account)
*/
rule groupActiveVotesTotal(method f, address group, address account)  {

	uint256 _tu =  sinvoke getActiveVoteUnitsForGroup(group);
	uint256 _ta =  sinvoke getActiveVotesForGroup(group);
	uint256 _accountUnits = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 _accountVotes = sinvoke getActiveVotesForGroupByAccount(group, account);

	require ( ( _tu==0  && _ta ==0  || (_tu!=0 && _ta!=0 && _tu <= _ta) )&&
			_accountUnits <= _tu &&
			(_accountUnits == _tu => _accountVotes == _ta) &&
			(_accountVotes == _ta => _accountUnits == _tu)  );	

	env eF;
	calldataarg arg;
	require !f.isPure && !f.isView;
	require f.selector != forceDecrementVotes(address, uint256, address[], address[], uint256[]).selector;
	require (f.selector != distributeEpochRewards(address, uint256, address, address).selector || _tu > 0);
	require  sinvoke getVoteSignerToAccount(eF)==account;
	
	sinvoke f(eF,arg);

	uint256 accountUnits_ = sinvoke getActiveVoteUnitsForGroupByAccount(group, account);
	uint256 tu_ = sinvoke getActiveVoteUnitsForGroup(group);
	require accountUnits_!=_accountUnits ;
	// check that the difference in the total is in sync with the difference of the changed account 
	assert (tu_ - _tu == accountUnits_ - _accountUnits);
}

// check only one changes 
rule groupActiveVotesTotalGuarantee(method f, address group, address A, address B)  {
	
	require(A!=B);
	uint256 _tu =  sinvoke getActiveVoteUnitsForGroup(group);
	uint256 _ta =  sinvoke getActiveVotesForGroup(group);
	uint256 _Aunits = sinvoke getActiveVoteUnitsForGroupByAccount(group, A);
	uint256 _Avotes = sinvoke getActiveVotesForGroupByAccount(group, A);
	uint256 _Bunits = sinvoke getActiveVoteUnitsForGroupByAccount(group, B);
	uint256 _Bvotes = sinvoke getActiveVotesForGroupByAccount(group, B);

	require ( ( _tu==0  && _ta ==0  || (_tu!=0 && _ta!=0 && _tu <= _ta) )&&
			_Aunits + _Bunits <= _tu &&  _Aunits!=0 && _Bunits!=0 &&
			_Avotes + _Bvotes <= _ta &&
			(_Aunits == _tu => _Avotes == _ta) &&
			(_Avotes == _ta => _Aunits == _tu) &&
			(_Bunits == _tu => _Bvotes == _ta) &&
			(_Bvotes == _ta => _Bunits == _tu) );	


	env eF;
	calldataarg arg;
	require f.selector != forceDecrementVotes(address,uint256,address[],address[],uint256[]).selector;
	require !f.isPure && !f.isView;
	sinvoke f(eF,arg);


	uint256 Aunits_ = sinvoke getActiveVoteUnitsForGroupByAccount(group, A);
	uint256 Bunits_ = sinvoke getActiveVoteUnitsForGroupByAccount(group, B);
	assert !(Aunits_ != _Aunits && Bunits_ != _Bunits);
}


/*
The total pending votes of a group G is the sum of pending votes from all accounts A to G
To prove this we assume that on each operation only one account's pending vote changes and the change is in sync with the total
we check this assumption in rule groupPendingVotesTotalGuarantee
*/
rule groupPendingVotesTotal(method f, address group, address A)  {

	
	uint256 Avote_prev = sinvoke getPendingVotesForGroupByAccount(group,A);
	uint256 total_prev = sinvoke getPendingVotesForGroup(group);
	
	env eF;
	calldataarg arg;
	require !f.isPure && !f.isView;
	sinvoke f(eF,arg);


	uint256 Avote_after = sinvoke getPendingVotesForGroupByAccount(group,A);
	uint256 total_after = sinvoke getPendingVotesForGroup(group);
	// assume that only one accounts pending vote have changed
	// check that the difference in the total is in sync with the different of the changed account (the other is zero difference) 
	// this is numeric operation... can handle negative numbers  
	assert (Avote_prev != Avote_after => (total_after - total_prev == Avote_after - Avote_prev));

}


rule groupPendingVotesTotalGuarantee(method f, address group, address A, address B)  {
	
	require(A!=B);
	uint256 Avote_prev = sinvoke getPendingVotesForGroupByAccount(group, A);
	uint256 Bvote_prev = sinvoke getPendingVotesForGroupByAccount(group, B);
	
	env eF;
	calldataarg arg;
	require !f.isPure && !f.isView;
	sinvoke f(eF,arg);

	uint256 Avote_after = sinvoke getPendingVotesForGroupByAccount(group, A);
	uint256 Bvote_after = sinvoke getPendingVotesForGroupByAccount(group, B);
	assert !(Avote_prev != Avote_after && Bvote_prev != Bvote_after);
}





