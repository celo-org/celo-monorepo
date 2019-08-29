pragma specify 0.1

rule account_empty_unless_created(method f, address account) {
	/* What is an "empty" account?
		We define an empty account as:
			(1) zero length notice periods, zero length availability-times
			(2) all zero Rewards
			(3) all zero Voting
			(4) all zero Validating
			(5) zero weight
			
		A non-created account has exists = false.
	 */

	env ePre;
	bool _empty1 = (sinvoke _lenNoticePeriods(ePre,account) == 0) && (sinvoke _lenAvailabilityTimes(ePre,account) == 0);
	bool _empty2 = (sinvoke _rewardsDelegate(ePre,account) == 0) && (sinvoke _rewardsLastRedeemed(ePre,account) == 0);
	bool _empty3 = (sinvoke _votingDelegate(ePre,account) == 0) && (sinvoke _votingFrozen(ePre,account) == false);
	bool _empty4 = (sinvoke _validatingDelegate(ePre,account) == 0);
	bool _empty5 = (sinvoke _weight(ePre,account) == 0);

	bool _existsAccount = sinvoke _exists(ePre,account);
	 
	require !_existsAccount => (_empty1 && _empty2 && _empty3 && _empty4 && _empty5);
	
	env eF; 
	calldataarg arg; 
	sinvoke f(eF,arg);
 
	env ePost;
	bool empty1_ = (sinvoke _lenNoticePeriods(ePost,account) == 0) && (sinvoke _lenAvailabilityTimes(ePost,account) == 0);
	bool empty2_ = (sinvoke _rewardsDelegate(ePost,account) == 0) && (sinvoke _rewardsLastRedeemed(ePost,account) == 0); 
	bool empty3_ = (sinvoke _votingDelegate(ePost,account) == 0) && (sinvoke _votingFrozen(ePost,account) == false);
	bool empty4_ = (sinvoke _validatingDelegate(ePost,account) == 0);
	bool empty5_ = (sinvoke _weight(ePost,account) == 0);

	bool existsAccount_ = sinvoke _exists(ePost,account);
	 
	assert !existsAccount_ => (empty1_ && empty2_ && empty3_ && empty4_ && empty5_), "Violated: after invoking, an account cannot be un-created yet non-empty";
}

rule address_cant_be_both_account_and_delegate(method f, address x) {
	address account; // an account that may point to x being a delegate
	require account != 0; // account 0 is not real, should never be real
	
	env ePre;
	bool _isAccount = sinvoke _exists(ePre,x); // x is an account if true
	
	bool _aExists = sinvoke _exists(ePre,account);
	address _aRewardsDelegate = sinvoke _rewardsDelegate(ePre,account);
	address _aVotingDelegate = sinvoke _votingDelegate(ePre,account);
	address _aValidatingDelegate = sinvoke _validatingDelegate(ePre,account);
	
	require _aExists; // we require account to be an account
	
	bool _isDelegate = _aRewardsDelegate == x || _aVotingDelegate == x || _aValidatingDelegate == x; // x is a delegate if true
	address _delegatedBy = sinvoke delegations(ePre,x);
	
	require !(_isDelegate && _isAccount); // x cannot be both a delegate and an account
	require _isDelegate <=> _delegatedBy == account; // x is a delegate of account iff x got a delegate role from account (see delegations_in_sync_and_exclusive)
	// we require but do not check here, the invariant that if x is a delegate, it is exclusive for one role
	require _isDelegate => (_aRewardsDelegate == x => (_aVotingDelegate != x && _aValidatingDelegate != x)); 
	require _isDelegate => (_aVotingDelegate == x => (_aRewardsDelegate != x && _aValidatingDelegate != x)); 
	require _isDelegate => (_aValidatingDelegate == x => (_aVotingDelegate != x && _aRewardsDelegate != x)); 
	
	env eF; 
	/* Missing: forall a1,a2. a1 != a2 => delegations(x)==a1 => x does not have a delegate role for a2 
		We instantitate this invariant for a2=eF.msg.sender and a1=_delegatedBy
	*/
	require _delegatedBy != eF.msg.sender => (sinvoke _rewardsDelegate(ePre,eF.msg.sender) != x 
			&& sinvoke _votingDelegate(ePre,eF.msg.sender) != x 
			&& sinvoke _validatingDelegate(ePre,eF.msg.sender) != x);
	
	calldataarg arg; 
	sinvoke f(eF,arg);

	env ePost;
	bool isAccount_ = sinvoke _exists(ePost,x); // x is an account if true
	
	bool aExists_ = sinvoke _exists(ePost,account);
	address aRewardsDelegate_ = sinvoke _rewardsDelegate(ePost,account);
	address aVotingDelegate_ = sinvoke _votingDelegate(ePost,account);
	address aValidatingDelegate_ = sinvoke _validatingDelegate(ePost,account);
	
	require aExists_; // we require account to still be an account
	
	bool isDelegate_ = aRewardsDelegate_ == x || aVotingDelegate_ == x || aValidatingDelegate_ == x; // x is a delegate if true
	address delegatedBy_ = sinvoke delegations(ePost,x);
	
	assert !(isDelegate_ && isAccount_),"$x cannot be both a delegate and an account";
	assert isDelegate_ <=> delegatedBy_ == account, "Violated: $x is a delegate of $account iff $x got a delegate role from ${account}. But x has a delegate role: ${isDelegate_} while delegated by ${delegatedBy_}";
}

rule address_zero_cannot_become_an_account(method f) {
	env ePre;
	address account = 0;
	
	bool _isAccount = sinvoke _exists(ePre,account);
	
	env eF;
	require eF.msg.sender != 0; // Assuming sender 0 will never, ever, be able to initiate a transaction.
	calldataarg arg; 
	sinvoke f(eF,arg);
	
	env ePost;
	bool isAccount_ = sinvoke _exists(ePost,account);
	
	assert !_isAccount => !isAccount_, "For address 0, even though it did not exist before executing ${f}, it exists now";	
}

rule delegations_in_sync_and_exclusive(method f, address delegatedTo) {
	// delegatedTo assumed to be non zero
	require delegatedTo != 0;
	
	env ePre;
	env eF;
	address _delegatingAccount = sinvoke delegations(ePre,delegatedTo); // an account that delegates one of the roles to delegatedTo

	require sinvoke _exists(ePre,_delegatingAccount); // _delegatingAccount must be an account
	require !sinvoke _exists(ePre,delegatedTo); // applying address_cant_be_both_account_and_delegate - delegatedTo is a delegate, thus not an account
	
	address _aRewardsDelegate = sinvoke _rewardsDelegate(ePre,_delegatingAccount);
	address _aVotingDelegate = sinvoke _votingDelegate(ePre,_delegatingAccount);
	address _aValidatingDelegate = sinvoke _validatingDelegate(ePre,_delegatingAccount);

	bool _aRewardsDelegateTo = _aRewardsDelegate == delegatedTo;
	bool _aVotingDelegateTo = _aVotingDelegate == delegatedTo;
	bool _aValidatingDelegateTo = _aValidatingDelegate == delegatedTo;
	
	require _aRewardsDelegateTo || _aVotingDelegateTo || _aValidatingDelegateTo; // at least one of the roles must be delegated to delegatedTo
	require (_aRewardsDelegateTo => (!_aVotingDelegateTo && !_aValidatingDelegateTo))
			&& (_aVotingDelegateTo => (!_aRewardsDelegateTo && !_aValidatingDelegateTo))
			&& (_aValidatingDelegateTo => (!_aRewardsDelegateTo && !_aVotingDelegateTo)); // at most one of the three roles is delegated to delegatedTo
	require _delegatingAccount == 0 => (!_aRewardsDelegateTo && !_aVotingDelegateTo && !_aValidatingDelegateTo); // if no delegate (0), then no roles from 0
	// if delegatedTo is for _delegatingAccount, then it is not a delegate for eF.msg.sender for sure!
	require (sinvoke _rewardsDelegate(ePre,eF.msg.sender) != delegatedTo) 
			&& (sinvoke _votingDelegate(ePre,eF.msg.sender) != delegatedTo) 
			&& (sinvoke _validatingDelegate(ePre,eF.msg.sender) != delegatedTo); 
	
	calldataarg arg;	
	sinvoke f(eF,arg);
	
	env ePost;
	address aRewardsDelegate_ = sinvoke _rewardsDelegate(ePre,_delegatingAccount);
	address aVotingDelegate_ = sinvoke _votingDelegate(ePre,_delegatingAccount);
	address aValidatingDelegate_ = sinvoke _validatingDelegate(ePre,_delegatingAccount);
		
	bool aRewardsDelegateTo_ = aRewardsDelegate_ == delegatedTo;
	bool aVotingDelegateTo_ = aVotingDelegate_ == delegatedTo;
	bool aValidatingDelegateTo_ = aValidatingDelegate_ == delegatedTo;
	
	address delegatingAccount_ = sinvoke delegations(ePre,delegatedTo); // an account that delegates one of the roles to delegatedTo
	
	if (delegatingAccount_ == _delegatingAccount) { // if delegatedTo was not removed
		assert aRewardsDelegateTo_ || aVotingDelegateTo_ || aValidatingDelegateTo_, "at least one of the roles must be delegated to $delegatedTo";
		assert (aRewardsDelegateTo_ => (!aVotingDelegateTo_ && !aValidatingDelegateTo_))
				&& (aVotingDelegateTo_ => (!aRewardsDelegateTo_ && !aValidatingDelegateTo_))
				&& (aValidatingDelegateTo_ => (!aRewardsDelegateTo_ && !aVotingDelegateTo_)), "at most one of the three roles is delegated to $delegatedTo";
	}
	// otherwise, delegatedTo was removed as a delegation
	assert (delegatingAccount_ != _delegatingAccount || delegatingAccount_ == 0) => 
			(!aRewardsDelegateTo_ && !aVotingDelegateTo_ && !aValidatingDelegateTo_),
				"Delegated $delegatedTo before executing $f was removed as a delegate of ${_delegatingAccount}, therefore it cannot have a delegate role, although at least one of the roles remained: rewards: ${aRewardsDelegateTo_}, voting: ${aVotingDelegateTo_}, validating: ${aValidatingDelegateTo_}";
	
} 

rule delegations_can_be_removed_but_not_moved(method f, address delegatedTo)
{
	// delegations cannot change from non-zero to non-zero
	env ePre;
	address _delegatingAccount = sinvoke delegations(ePre,delegatedTo); // an account that delegates one of the roles to delegatedTo

	env eF;
	calldataarg arg;	
	sinvoke f(eF,arg);
	
	env ePost;
	address delegatingAccount_ = sinvoke delegations(ePre,delegatedTo); // an account that delegates one of the roles to delegatedTo
	
	assert _delegatingAccount == delegatingAccount_ || _delegatingAccount == 0 || delegatingAccount_ == 0,
		"Account delegating to $delegatedTo cannot change from one non-zero value to another non-zero value";
}


rule functional_get_account_from_voter_result(address account) {
	// If an account has a voting delegate, getAccountFromVoter(delegate) must return that account
	require account != 0; // account 0 is not real, should never be real
	
	env e;
		
	address votingDelegate = sinvoke _votingDelegate(e, account);
	// assume the invariant on delegations
	require sinvoke delegations(e, votingDelegate) == account;
	
	env eF;
	address gotAccountFromVoterResult = sinvoke getAccountFromVoter(eF, votingDelegate);
	
	assert votingDelegate != 0 => gotAccountFromVoterResult == account, "Account $account has a voting delegate $votingDelegate but getAccountFromVoter($votingDelegate) returns $gotAccountFromVoterResult instead of account";
	
	assert votingDelegate == 0 => gotAccountFromVoterResult == account, "Account $account does not have a voting delegate but getAccountFromVoter($votingDelegate) returns $gotAccountFromVoterResult";
}

rule functional_get_account_from_voter_success(address account, address delegate) {
	// getAccountFromVoter(address) must fail if “address” is not an account or voting delegate
	env e;
	
	// get an accounts voting delegate
	address votingDelegate = sinvoke _votingDelegate(e, account);
	// assume the invariant on delegations
	require sinvoke delegations(e, votingDelegate) == account;
	
	bool isDelegate = delegate == votingDelegate;
	bool isAccount = sinvoke _exists(e, delegate);
	
	env eF;
	require eF.msg.value == 0;
	address gotAccountFromVoterResult = invoke getAccountFromVoter(eF, delegate);
	bool success = !lastReverted;
	
	assert (!isDelegate && !isAccount) => !success, "getAccountFromVoter($delegate) must fail if $delegate is not an account (isAccount=${isAccount}) nor a voting delegate (isDelegate=${isDelegate})";
}

rule functional_get_account_from_rewards_recipient_result(address account) {
	// If an account has a reward recipient delegate, getAccountFromRewardsRecipient(delegate) must return that account
	require account != 0; // account 0 is not real, should never be real
	
	env e;
		
	address rewardsRecipientDelegate = sinvoke _rewardsDelegate(e, account);
	// assume the invariant on delegations
	require sinvoke delegations(e, rewardsRecipientDelegate) == account;
	
	env eF;
	address gotAccountFromRewardsRecipientResult = sinvoke getAccountFromRewardsRecipient(eF, rewardsRecipientDelegate);
	
	assert rewardsRecipientDelegate != 0 => gotAccountFromRewardsRecipientResult == account, "Account $account has a voting delegate $rewardsRecipientDelegate but getAccountFromVoter($rewardsRecipientDelegate) returns $gotAccountFromRewardsRecipientResult instead of account";
	
	assert rewardsRecipientDelegate == 0 => gotAccountFromRewardsRecipientResult == account, "Account $account does not have a voting delegate but getAccountFromVoter($rewardsRecipientDelegate) returns $gotAccountFromRewardsRecipientResult";
}

rule functional_get_account_from_rewards_recipient_success(address account, address delegate) {
	// getAccountFromRewardsRecipient(address) must fail if “address” is not an account or rewards recipient delegate
	env e;
	
	// get an accounts voting delegate
	address rewardsRecipientDelegate = sinvoke _rewardsDelegate(e, account);
	// assume the invariant on delegations
	require sinvoke delegations(e, rewardsRecipientDelegate) == account;
	
	bool isDelegate = delegate == rewardsRecipientDelegate;
	bool isAccount = sinvoke _exists(e, delegate);
	
	env eF;
	require eF.msg.value == 0;
	address gotAccountFromRewardsRecipientResult = invoke getAccountFromRewardsRecipient(eF, delegate);
	bool success = !lastReverted;
	
	assert (!isDelegate && !isAccount) => !success, "getAccountFromRewardsRecipient($delegate) must fail if $delegate is not an account (isAccount=${isAccount}) nor a rewards recipient delegate (isDelegate=${isDelegate})";
}


rule functional_get_account_from_validator_result(address account) {
	// If an account has a validator delegate, getAccountFromValidator(delegate) must return that account
	require account != 0; // account 0 is not real, should never be real
	
	env e;
		
	address validatorDelegate = sinvoke _validatingDelegate(e, account);
	// assume the invariant on delegations
	require sinvoke delegations(e, validatorDelegate) == account;
	
	env eF;
	address gotAccountFromValidatorResult = sinvoke getAccountFromValidator(eF, validatorDelegate);
	
	assert validatorDelegate != 0 => gotAccountFromValidatorResult == account, "Account $account has a validator delegate $validatorDelegate but getAccountFromVoter($validatorDelegate) returns $gotAccountFromValidatorResult instead of account";
	
	assert validatorDelegate == 0 => gotAccountFromValidatorResult == account, "Account $account does not have a validator delegate but getAccountFromVoter($validatorDelegate) returns $gotAccountFromValidatorResult";
}

rule functional_get_account_from_validator_success(address account, address delegate) {
	// getAccountFromValidator(address) must fail if “address” is not an account or validator delegate
	env e;
	
	// get an accounts validator delegate
	address validatorDelegate = sinvoke _validatingDelegate(e, account);
	// assume the invariant on delegations
	require sinvoke delegations(e, validatorDelegate) == account;
	
	bool isDelegate = delegate == validatorDelegate;
	bool isAccount = sinvoke _exists(e, delegate);
	
	env eF;
	require eF.msg.value == 0;
	address gotAccountFromValidatorResult = invoke getAccountFromValidator(eF, delegate);
	bool success = !lastReverted;
	
	assert (!isDelegate && !isAccount) => !success, "getAccountFromValidator($delegate) must fail if $delegate is not an account (isAccount=${isAccount}) nor a validator delegate (isDelegate=${isDelegate})";
}


rule modifying_deposits(address a, uint256 someNoticePeriod, uint256 someAvailabilityTime, method f) {
	// just mapping out functions that affect an account's deposits
	env _e;
	uint256 _lenNoticePeriodsValue = sinvoke _lenNoticePeriods(_e,a);
	uint256 _lenAvailabilityTimesValue = sinvoke _lenAvailabilityTimes(_e,a);
	uint256 _someBondedValue; uint256 _someBondedIndex;
	_someBondedValue, _someBondedIndex = sinvoke getBondedDeposit(_e,a,someNoticePeriod);
	uint256 _someNotifiedValue; uint256 _someNotifiedIndex;
	_someNotifiedValue, _someNotifiedIndex = sinvoke getNotifiedDeposit(_e,a,someAvailabilityTime);
	
	env eF;
	calldataarg arg;
	invoke f(eF,arg);
	
	env e_;
	uint256 lenNoticePeriodsValue_ = sinvoke _lenNoticePeriods(e_,a);
	uint256 lenAvailabilityTimesValue_ = sinvoke _lenAvailabilityTimes(e_,a);
	uint256 someBondedValue_; uint256 someBondedIndex_;
	someBondedValue_, someBondedIndex_ = sinvoke getBondedDeposit(e_,a,someNoticePeriod);
	uint256 someNotifiedValue_; uint256 someNotifiedIndex_;
	someNotifiedValue_, someNotifiedIndex_ = sinvoke getNotifiedDeposit(e_,a,someAvailabilityTime);
	
	assert _lenNoticePeriodsValue == lenNoticePeriodsValue_, "Method changed length of notice periods";
	assert _lenAvailabilityTimesValue == lenAvailabilityTimesValue_, "Method changed length of availability times";
	assert _someBondedValue == someBondedValue_, "Method changed a bonded value";
	assert _someBondedIndex == someBondedIndex_, "Method changed a bonded index";
	assert _someNotifiedValue == someNotifiedValue_, "Method changed a notified value";
	assert _someNotifiedIndex == someNotifiedIndex_, "Method changed a notified index";
}

rule valid_notice_period_for_deposit(address a, uint256 someNoticePeriod, method f) {
	// An account should not be able to deposit with a notice period > the current max notice period
	env _e;
	uint256 _maxNoticePeriodValue = sinvoke maxNoticePeriod(_e);
	
	uint256 _someBondedValue; uint256 _someBondedIndex;
	_someBondedValue, _someBondedIndex = sinvoke getBondedDeposit(_e,a,someNoticePeriod);
	require someNoticePeriod > _maxNoticePeriodValue => (_someBondedValue == 0 && _someBondedIndex == 0);
	
	env eF;
	calldataarg arg;
	invoke f(eF,arg);
	
	env e_;
	uint256 maxNoticePeriodValue_ = sinvoke maxNoticePeriod(e_);
	
	uint256 someBondedValue_; uint256 someBondedIndex_;
	someBondedValue_, someBondedIndex_ = sinvoke getBondedDeposit(e_,a,someNoticePeriod);
	
	assert someNoticePeriod > maxNoticePeriodValue_ => (someBondedValue_ == 0 && someBondedIndex_ == 0);
}

rule cant_notify_an_unbonded_deposit(address a, uint256 someNoticePeriod, method f) {
	// availability time for someNoticePeriod will be eF.block.timestamp+someNoticePeriod;
	env _e;
	env eF;
	env e_;
	
	uint256 matchingAvailabilityTime = eF.block.timestamp+someNoticePeriod; // availability time is notify time + notice period set beforehand
	
	uint256 _someBondedValue; uint256 _someBondedIndex;
	_someBondedValue, _someBondedIndex = sinvoke getBondedDeposit(_e,a,someNoticePeriod);
	uint256 _someNotifiedValue; uint256 _someNotifiedIndex;
	_someNotifiedValue, _someNotifiedIndex = sinvoke getNotifiedDeposit(_e,a,matchingAvailabilityTime);
	
	// not notified before:
	require _someNotifiedValue == 0 /*&& _someNotifiedIndex == 0*/;
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	/*uint256 someBondedValue_; uint256 someBondedIndex_;
	someBondedValue_, someBondedIndex_ = sinvoke getBondedDeposit(e_,a,someNoticePeriod);*/
	uint256 someNotifiedValue_; uint256 someNotifiedIndex_;
	someNotifiedValue_, someNotifiedIndex_ = sinvoke getNotifiedDeposit(e_,a,matchingAvailabilityTime); 
	// what happens if in withdraw we delete and matchingAvailabilityTime is the last index? then its index is updated
	
	// if now we notified, necessarily, it was bonded BEFORE
	// Note: commented out the requirement on the index, because rebond could change our index (by deleting another availabilityTime and re-arranging the array).
	assert (someNotifiedValue_ != 0 /*|| someNotifiedIndex_ != 0*/) => (_someBondedValue != 0/* || _someBondedIndex != 0*/), "Violated: An account should never be able to notify a deposit which hadnt previously been deposited";
}

rule modifying_weight(address a, uint256 someNoticePeriod, uint256 someAvailabilityTime, method f) {
	// just mapping out functions that affect an account's weight
	env _e;
	uint256 _accountWeight = sinvoke _weight(_e,a);
	
	env eF;
	calldataarg arg;
	invoke f(eF,arg);
	
	env e_;
	uint256 accountWeight_ = sinvoke _weight(e_,a);
	
	assert _accountWeight == accountWeight_, "Method changed weight of account";
}

rule modifying_weight_other(address a, uint256 someNoticePeriod, uint256 someAvailabilityTime, method f) {
	// just mapping out functions that affect an account's weight
	env _e;
	uint256 _accountWeight = sinvoke _weight(_e,a);
	
	env eF;
	require eF.msg.sender != a;
	calldataarg arg;
	invoke f(eF,arg);
	
	env e_;
	uint256 accountWeight_ = sinvoke _weight(e_,a);
	
	assert _accountWeight == accountWeight_, "Method changed weight of an account other than sender";
}

rule atomic_deposit_notification(uint256 someNoticePeriod, uint256 notifyValue) {
	// Notifying a deposit should always reduce the balance of a bonded deposit by the same amount that it increments the balance of a notified deposit
	env _e;
	env eF;
	env e_;
	
	address a = eF.msg.sender; // our account will execute notify()
	uint256 matchingAvailabilityTime = eF.block.timestamp+someNoticePeriod; // availability time is notify time + notice period set beforehand
	
	uint256 _someBondedValue; 
	_someBondedValue, _ = sinvoke getBondedDeposit(_e,a,someNoticePeriod);
	uint256 _someNotifiedValue; 
	_someNotifiedValue, _ = sinvoke getNotifiedDeposit(_e,a,matchingAvailabilityTime);
	
	sinvoke notify(eF, notifyValue, someNoticePeriod);
	
	uint256 someBondedValue_; 
	someBondedValue_, _ = sinvoke getBondedDeposit(e_,a,someNoticePeriod);
	uint256 someNotifiedValue_; 
	someNotifiedValue_, _ = sinvoke getNotifiedDeposit(e_,a,matchingAvailabilityTime);
	
	// some notified value should increase, some bonded value should decrease
	assert someNotifiedValue_ - _someNotifiedValue == _someBondedValue - someBondedValue_, "Violated: Difference between new and old bonded value should be the same as difference of old and new notified value";
	
	assert someNotifiedValue_ - _someNotifiedValue == notifyValue
			&& _someBondedValue - someBondedValue_ == notifyValue, "Violated: When notify succeeds, difference between old and new bonded value is the notify value $notifyValue";
}

rule cant_rebond_non_notified(uint256 rebondValue, uint256 depositAvailabilityTime) {
	// An account should never be able to rebond a non-notified deposit
	env _e;
	env eF;
	
	address a = eF.msg.sender; // our account will execute rebond()
	uint256 _someNotifiedValue; 
	_someNotifiedValue, _ = sinvoke getNotifiedDeposit(_e,a,depositAvailabilityTime);
	
	invoke rebond(eF, rebondValue, depositAvailabilityTime);
	
	assert _someNotifiedValue < rebondValue => lastReverted, "Trying to rebond more deposits then there are notified ($rebondValue > ${_someNotifiedValue}), and did not revert rebond()";
}


rule withdrawing_removes_notified_deposit(uint256 someNoticePeriod) {
	// Withdrawing should remove the notified deposit
	env _e;
	env eF;
	env e_;
	
	address a = eF.msg.sender; // our account will execute withdraw()
	uint256 matchingAvailabilityTime = eF.block.timestamp+someNoticePeriod; // availability time is notify time + notice period set beforehand
		
	invoke withdraw(eF, matchingAvailabilityTime);
	bool withdrawSucceeded = !lastReverted;
	
	uint256 someNotifiedValue_; uint256 someNotifiedIndex_;
	someNotifiedValue_, someNotifiedIndex_ = sinvoke getNotifiedDeposit(e_,a,matchingAvailabilityTime);
	
	assert withdrawSucceeded => (someNotifiedValue_ == 0 && someNotifiedIndex_ == 0), "Violated: withdraw succeeded but for deposit $someNoticePeriod with availability time $matchingAvailabilityTime we still have value: ${someNotifiedValue_} and index ${someBondedIndex_}";
}

rule withdraw_precond(uint256 someAvailabilityTime) {
	// Accounts should never be able to withdraw a deposit that hasn’t been notified or before the notice period is up
	env _e;
	env eF;
	env e_;
	
	address a = eF.msg.sender; // our account will execute withdraw()
	
	uint256 _someNotifiedValue;
	_someNotifiedValue, _ = sinvoke getNotifiedDeposit(_e,a,someAvailabilityTime);
	
	invoke withdraw(eF, someAvailabilityTime);
	bool withdrawSucceeded = !lastReverted;
	
	// TODO: Is it a strict, or non-strict inequality?
	assert eF.block.timestamp < someAvailabilityTime => !withdrawSucceeded, "Withdraw succeeded even though time ${eF.block.timestamp} is before availability time $someAvailabilityTime";
	assert _someNotifiedValue == 0 => !withdrawSucceeded, "Withdraw succeeded even though this deposit was not notified";	
}

rule increase_notice_period_precond(uint256 someNoticePeriod) {
	// Accounts should not be able to increase the notice period of a non-bonded deposit
	env _e;
	env eF;
	env e_;
	
	address a = eF.msg.sender; // our account will execute increaseNoticePeriod()
	
	uint256 _someBondedValue;
	_someBondedValue, _ = sinvoke getBondedDeposit(_e,a,someNoticePeriod);
	
	uint256 value;
	uint256 increase;
	
	invoke increaseNoticePeriod(eF,value,someNoticePeriod,increase);
	bool increaseNoticePeriodSucceded = !lastReverted;
	
	assert _someBondedValue < value => !increaseNoticePeriodSucceded, "Increasing notice period succeeded even though it requested to increase notice period of non-bonded deposits $value where currently deposited just ${_someBondedValue}";	
}

rule notify_only_updates_the_expected_deposit_availability_time(uint256 someNoticePeriod, uint256 randomTime) {
	// The availability time of a notified deposit should always equal the notice period of the deposit when it was bonded plus the time at which the notice was given
	// Translation: if we run notify, we must update the correct availability time and not any other!
	
	env _e;
	env eF;
	env e_;
	
	address a = eF.msg.sender; // our account will execute notify()
	uint256 matchingAvailabilityTime = eF.block.timestamp+someNoticePeriod; // availability time is notify time + notice period set beforehand
	require randomTime != matchingAvailabilityTime; // we will be checking for some other time
	uint256 notifyValue;
	
	uint256 _someNotifiedValue; uint256 _someNotifiedIndex;
	_someNotifiedValue, _someNotifiedIndex = sinvoke getNotifiedDeposit(_e,a,randomTime);
	
	sinvoke notify(eF, notifyValue, someNoticePeriod);
	
	uint256 someNotifiedValue_; uint256 someNotifiedIndex_;
	someNotifiedValue_, someNotifiedIndex_ = sinvoke getNotifiedDeposit(e_,a,randomTime);
	
	assert _someNotifiedIndex == someNotifiedIndex_ && _someNotifiedValue == someNotifiedValue_, "Invocation of notify with notice period $someNoticePeriod and matching availability time $matchingAvailabilityTime should not have updated any entry in notified deposit of $randomTime";
}


// Update bonded deposits rule(s) + Update notified deposits rule(s)
/* 	Invariant 1:
		forall i,np. (0 <= i && i < deposits.length) => (deposits[i] == np <=> (bonded[np].value != 0 && bonded[np].index == i))

	Rule 2 - weights:
		Changes account's weight and total weight by getDepositWeight(value=(value - bonded[np].value),np)
	
	Rule 3 - deletion:
		If new value is 0, new index of np must be 0 too. (i.e. deleted from array and overwrite map's stored index).
		Also, current index must be a value != np, or length of deposits array must be less than original index (if it was the last).
		
	Rule 4 - insertion:
		Index of np can be set to 0 only if original deposits len was 0.
		New array length must be +1 compared to previous one.
		
	
*/

// update bonded deposits
rule check_update_bonded_deposit_inv123(address account, uint256 noticePeriod) {
	// forall np. bonded[np].value == 0 <=> (forall i. (0 <= i < deposits.length) => deposits[i] != np)
	// forall np. bonded[np].value == 0 => bonded[np].index == 0
	// forall np. bonded[np].value != 0 => deposits[bonded[np].index] == np [also implies index is in range of deposits array]
	// [distinct] forall np1,np2. (np1 != np2 && bonded[np1].value != 0 && bonded[np2].value != 0) => bonded[np1].index != bonded[np2].index
	// [distinct array] forall i1,i2. i1 != i2 => deposits[i1] != deposits[i2]
	// universe includes parameters to updateBondedDeposit: 
	// 	np universe is noticePeriod and arg_noticePeriod
	// 	index universe is bonded[noticePeriod].index and bonded[arg_noticePeriod].index [if they do not exist, invariant 2 imply they are 0]
	//		as well as _lenNoticePeriods-1 (case of deletion) and 0 (if len is at least 1)
	env _e;
	env eF;
	env e_;

	address arg_account; uint256 arg_value; uint256 arg_noticePeriod;
	require arg_account == account; // simplification of quantifiers - not quantifying on account
	
	uint256 _lenDeposits = sinvoke _lenNoticePeriods(_e,account);
	
	uint256 _bondValue; uint256 _bondIndex;
	_bondValue,_bondIndex = sinvoke getBondedDeposit(_e,account,noticePeriod);
	
	uint256 _arg_bondValue; uint256 _arg_bondIndex;
	_arg_bondValue, _arg_bondIndex = sinvoke getBondedDeposit(_e,arg_account,arg_noticePeriod);
	
	// invariant 2 assumption:
	require _arg_bondValue == 0 => _arg_bondIndex == 0;
	require _bondValue == 0 => _bondIndex == 0;
	
	// this is OK by invariant 2:
	require (0 <= _bondIndex && _bondIndex < _lenDeposits);
	require (0 <= _arg_bondIndex && _arg_bondIndex < _lenDeposits);
	
	// invariant 1 assumption: depends on which indices are actually in the universe:
	uint256 _element = sinvoke getFromNoticePeriods(_e,account,_bondIndex);
	uint256 _arg_element = sinvoke getFromNoticePeriods(_e,arg_account,_arg_bondIndex);
	uint256 _last_element = sinvoke getFromNoticePeriods(_e,arg_account,_lenDeposits-1);
	uint256 _zero_element = sinvoke getFromNoticePeriods(_e,arg_account,0);
	
	uint256 _last_bondValue; uint256 _last_bondIndex; 
	_last_bondValue, _last_bondIndex = sinvoke getBondedDeposit(_e,arg_account,_last_element);
	require _last_bondValue != 0; // can't store 0's in the array (another invariant...)
	require _last_bondIndex == _lenDeposits-1; // because it's the index from which we started
	require _lenDeposits > 0 => _zero_element != 0; // can't store 0's in the array (another invariant...)
	
	require _bondValue == 0 <=> (_element != noticePeriod && _arg_element != noticePeriod && _last_element != noticePeriod && _zero_element != noticePeriod); // partial instantiation?
	
	// invariant 3 assumption
	require _bondValue != 0 => _element == noticePeriod;
	
	// distinct assumption
		// for noticePeriod and arg_noticePeriod
	require (_bondValue != 0 && _arg_bondValue != 0 && noticePeriod != arg_noticePeriod) => (_bondIndex != _arg_bondIndex && _element != _arg_element);
		// for noticePeriod and _lenDeposits-1 element (_last_bondIndex)
	require (_bondValue != 0 && _last_bondValue != 0 && noticePeriod != _last_bondIndex) => (_bondIndex != _last_bondIndex && _element != _last_element);	
		// for noticePeriod and _zero_element (if exists)
	require (_lenDeposits > 0) => ((_bondValue != 0 && noticePeriod != _zero_element) => (_bondIndex != 0 && _element != _zero_element)	);
	
	// distinct assumption for array
		// zero and noticePeriod's index
	if (_bondValue > 0 && _lenDeposits > 0) {
		require _bondIndex != 0 => noticePeriod != _zero_element;
	}
	
	sinvoke ext_updateBondedDeposit(eF,arg_account,arg_value,arg_noticePeriod);
		
	// starting assertions
	uint256 lenDeposits_ = sinvoke _lenNoticePeriods(e_,account);
	
	uint256 bondValue_; uint256 bondIndex_;
	bondValue_,bondIndex_ = sinvoke getBondedDeposit(e_,account,noticePeriod);
	
	uint256 arg_bondValue_; uint256 arg_bondIndex_;
	arg_bondValue_, arg_bondIndex_ = sinvoke getBondedDeposit(e_,arg_account,arg_noticePeriod);
	
	// these are valid only if the value is non zero
	uint256 element_ = sinvoke getFromNoticePeriods(e_,account,bondIndex_);
	uint256 arg_element_ = sinvoke getFromNoticePeriods(e_,arg_account,arg_bondIndex_);
	
	// invariant 2 assertion
	assert bondValue_ == 0 => bondIndex_ == 0, "Bonded map cannot store a zero valued bond unless the index is zero";
	// invariant 3 assertion
	assert bondValue_ != 0 => element_ == noticePeriod, "Violated invariant linking noticePeriods array and bonded map";
	// invariant 1 assertion - suspect it's only partially stated here - e.g. for _lenDeposits-1 but also "any i"
	assert bondValue_ == 0 <=> (element_ != noticePeriod && arg_element_ != noticePeriod), "If value is zero, no element in the array contains the key";
	// distinct assertion (partial for maps, and not including array distinct assertion)
	assert (bondValue_ != 0 && arg_bondValue_ != 0 && noticePeriod != arg_noticePeriod) => bondIndex_ != arg_bondIndex_, "Indices for existing distinct keys must be distinct";
}

rule check_update_bonded_deposit_rule2_weights(address account, uint256 noticePeriod, uint256 value) {
	// Changes account's weight and total weight by getDepositWeight(value=(value - bonded[np].value),np)
	env _e;
	env eF;
	env e_;
	env ePure;

	uint256 _bondValue; 
	_bondValue, _ = sinvoke getBondedDeposit(_e,account,noticePeriod);
	uint256 _accountWeight = sinvoke getAccountWeight(_e,account);
	uint256 _totalWeight = sinvoke totalWeight(_e);
	
	uint expectedValueChange = value - _bondValue;
	
	//uint256 expectedWeightChange = sinvoke getDepositWeight((value-_bondValue, ...
	
	sinvoke ext_updateBondedDeposit(eF,account,value,noticePeriod);
		
	uint256 bondValue_;
	bondValue_, _ = sinvoke getBondedDeposit(e_,account,noticePeriod);
	uint256 accountWeight_ = sinvoke getAccountWeight(e_,account);
	uint256 totalWeight_ = sinvoke totalWeight(e_);
	
	uint actualValueChange = bondValue_ - _bondValue;
	
	uint256 weightOldBond = sinvoke getDepositWeight(ePure,_bondValue,noticePeriod);
	uint256 weightNewBond = sinvoke getDepositWeight(ePure,value,noticePeriod);
	
	assert actualValueChange == expectedValueChange, "Unexpected change in value of bond in chosen notice period";
	assert totalWeight_ - _totalWeight == accountWeight_ - _accountWeight, "Change in total weight and in account weight is not the same";
	assert accountWeight_ == _accountWeight - weightOldBond + weightNewBond, "Unexepcted change in weight";	
	// we're not using distributivity to compute the change because getDepositWeight works with uints and not with ints (and we don't want to encode all the inequalities to avoid negative values).
}


rule check_update_bonded_deposit_rule3_deletion(address account, uint256 noticePeriod, uint256 value, uint256 otherIndex) {
	// deletion : value == 0
	// new index of np must be 0 too. (i.e. deleted from array and overwrite map's stored index).
	// Also, current index must be a value != np, or actually deleted the last element so this index does not exist anymore.
		
	env _e;
	env eF;
	env e_;

	require value == 0; // deletion check
	
	uint256 _bondValue; uint256 _bondIndex;
	_bondValue,_bondIndex = sinvoke getBondedDeposit(_e,account,noticePeriod);
	uint256 _lenDeposits = sinvoke _lenNoticePeriods(_e,account);
	
	uint256 movedIndex = _lenDeposits - 1;
	uint256 movedElement = sinvoke getFromNoticePeriods(_e, account, movedIndex);
	require movedElement != noticePeriod; // no duplicates in noticePeriods array
	
	require 0 <= otherIndex && otherIndex < _lenDeposits-1 && otherIndex != _bondIndex;
	uint256 _otherElement = sinvoke getFromNoticePeriods(_e,account,otherIndex);
	
	sinvoke ext_updateBondedDeposit(eF,account,value,noticePeriod);
	
	uint256 bondValue_; uint256 bondIndex_;
	bondValue_,bondIndex_ = sinvoke getBondedDeposit(e_,account,noticePeriod);
	uint256 lenDeposits_ = sinvoke _lenNoticePeriods(e_,account);
	
	uint256 otherElement_ = sinvoke getFromNoticePeriods(e_,account,otherIndex);
	
	assert lenDeposits_ == _lenDeposits - 1, "Did not delete an element";
	assert bondIndex_ == 0, "If deleting a bond, must overwrite all fields of bond in the bonded map";
	
	if (_bondIndex < _lenDeposits-1) {
		uint256 newElementInDeletedLocation = sinvoke getFromNoticePeriods(e_,account,_bondIndex);
		assert newElementInDeletedLocation == movedElement, "Unexpected hole in deleted index";
	}
	
	assert otherElement_ == _otherElement, "Changed unrelated index $otherIndex from ${_otherElement} to ${otherElement_}";
}


rule check_update_bonded_deposit_rule4_insertion(address account, uint256 noticePeriod, uint256 value) {
	// insert : current bond value == 0
	// Index of np can be set to 0 only if original deposits len was 0.
	// New array length must be +1 compared to previous one.
		
	env _e;
	env eF;
	env e_;

	uint256 _bondValue; uint256 _bondIndex;
	_bondValue,_bondIndex = sinvoke getBondedDeposit(_e,account,noticePeriod);
	require _bondValue == 0;
	
	uint256 _lenDeposits = sinvoke _lenNoticePeriods(_e,account);
	
	sinvoke ext_updateBondedDeposit(eF,account,value,noticePeriod);
	
	uint256 bondValue_; uint256 bondIndex_;
	bondValue_,bondIndex_ = sinvoke getBondedDeposit(e_,account,noticePeriod);
	uint256 lenDeposits_ = sinvoke _lenNoticePeriods(e_,account);
	
	assert lenDeposits_ == _lenDeposits + 1, "Did not add an element";
	assert bondIndex_ == 0 => _lenDeposits == 0, "Cannot add index 0 if deposits length is already non-zero";
	assert bondIndex_ == _lenDeposits, "Expected new bond index to be original length of the array, got mismatch";
}

// update notified deposit
rule check_update_notified_deposit_inv123(address account, uint256 availabilityTime) {
	// forall np. bonded[np].value == 0 <=> (forall i. (0 <= i < deposits.length) => deposits[i] != np)
	// forall np. bonded[np].value == 0 => bonded[np].index == 0
	// forall np. bonded[np].value != 0 => deposits[bonded[np].index] == np [also implies index is in range of deposits array]
	// [distinct] forall np1,np2. (np1 != np2 && bonded[np1].value != 0 && bonded[np2].value != 0) => bonded[np1].index != bonded[np2].index
	// [distinct array] forall i1,i2. i1 != i2 => deposits[i1] != deposits[i2]
	// universe includes parameters to updateBondedDeposit: 
	// 	np universe is availabilityTime and arg_availabilityTime
	// 	index universe is bonded[availabilityTime].index and bonded[arg_availabilityTime].index [if they do not exist, invariant 2 imply they are 0]
	//		as well as _lenAvailabilityTimes-1 (case of deletion) and 0 (if len is at least 1)
	env _e;
	env eF;
	env e_;

	address arg_account; uint256 arg_value; uint256 arg_availabilityTime;
	require arg_account == account; // simplification of quantifiers - not quantifying on account
	
	uint256 _lenArray = sinvoke _lenAvailabilityTimes(_e,account);
	
	uint256 _bondValue; uint256 _bondIndex;
	_bondValue,_bondIndex = sinvoke getNotifiedDeposit(_e,account,availabilityTime);
	
	uint256 _arg_bondValue; uint256 _arg_bondIndex;
	_arg_bondValue, _arg_bondIndex = sinvoke getNotifiedDeposit(_e,arg_account,arg_availabilityTime);
	
	// invariant 2 assumption:
	require _arg_bondValue == 0 => _arg_bondIndex == 0;
	require _bondValue == 0 => _bondIndex == 0;
	
	// this is OK by invariant 2:
	require (0 <= _bondIndex && _bondIndex < _lenArray);
	require (0 <= _arg_bondIndex && _arg_bondIndex < _lenArray);
	
	// invariant 1 assumption: depends on which indices are actually in the universe:
	uint256 _element = sinvoke getFromAvailabilityTimes(_e,account,_bondIndex);
	uint256 _arg_element = sinvoke getFromAvailabilityTimes(_e,arg_account,_arg_bondIndex);
	uint256 _last_element = sinvoke getFromAvailabilityTimes(_e,arg_account,_lenArray-1);
	uint256 _zero_element = sinvoke getFromAvailabilityTimes(_e,arg_account,0);
	
	uint256 _last_bondValue; uint256 _last_bondIndex; 
	_last_bondValue, _last_bondIndex = sinvoke getNotifiedDeposit(_e,arg_account,_last_element);
	require _last_bondValue != 0; // can't store 0's in the array (another invariant...)
	require _last_bondIndex == _lenArray-1; // because it's the index from which we started
	require _lenArray > 0 => _zero_element != 0; // can't store 0's in the array (another invariant...)
	
	require _bondValue == 0 <=> (_element != availabilityTime && _arg_element != availabilityTime && _last_element != availabilityTime && _zero_element != availabilityTime); // partial instantiation?
	
	// invariant 3 assumption
	require _bondValue != 0 => _element == availabilityTime;
	
	// distinct assumption
		// for availabilityTime and arg_availabilityTime
	require (_bondValue != 0 && _arg_bondValue != 0 && availabilityTime != arg_availabilityTime) => (_bondIndex != _arg_bondIndex && _element != _arg_element);
		// for availabilityTime and _lenArray-1 element (_last_bondIndex)
	require (_bondValue != 0 && _last_bondValue != 0 && availabilityTime != _last_bondIndex) => (_bondIndex != _last_bondIndex && _element != _last_element);	
		// for availabilityTime and _zero_element (if exists)
	require (_lenArray > 0) => ((_bondValue != 0 && availabilityTime != _zero_element) => (_bondIndex != 0 && _element != _zero_element)	);
	
	// distinct assumption for array
		// zero and availabilityTime's index
	if (_bondValue > 0 && _lenArray > 0) {
		require _bondIndex != 0 => availabilityTime != _zero_element;
	}
	
	sinvoke ext_updateNotifiedDeposit(eF,arg_account,arg_value,arg_availabilityTime);
		
	// starting assertions
	uint256 lenArray_ = sinvoke _lenAvailabilityTimes(e_,account);
	
	uint256 bondValue_; uint256 bondIndex_;
	bondValue_,bondIndex_ = sinvoke getNotifiedDeposit(e_,account,availabilityTime);
	
	uint256 arg_bondValue_; uint256 arg_bondIndex_;
	arg_bondValue_, arg_bondIndex_ = sinvoke getNotifiedDeposit(e_,arg_account,arg_availabilityTime);
	
	// these are valid only if the value is non zero
	uint256 element_ = sinvoke getFromAvailabilityTimes(e_,account,bondIndex_);
	uint256 arg_element_ = sinvoke getFromAvailabilityTimes(e_,arg_account,arg_bondIndex_);
	
	// invariant 2 assertion
	assert bondValue_ == 0 => bondIndex_ == 0, "Bonded map cannot store a zero valued bond unless the index is zero";
	// invariant 3 assertion
	assert bondValue_ != 0 => element_ == availabilityTime, "Violated invariant linking availabilityTimes array and bonded map";
	// invariant 1 assertion - suspect it's only partially stated here - e.g. for _lenArray-1 but also "any i"
	assert bondValue_ == 0 <=> (element_ != availabilityTime && arg_element_ != availabilityTime), "If value is zero, no element in the array contains the key";
	// distinct assertion (partial for maps, and not including array distinct assertion)
	assert (bondValue_ != 0 && arg_bondValue_ != 0 && availabilityTime != arg_availabilityTime) => bondIndex_ != arg_bondIndex_, "Indices for existing distinct keys must be distinct";
}

rule check_update_notified_deposit_rule2_weights(address account, uint256 availabilityTime, uint256 value) {
	// Changes account's weight and total weight by value //getDepositWeight(value=(value - bonded[np].value),np)
	env _e;
	env eF;
	env e_;
	env ePure;

	uint256 _bondValue; 
	_bondValue, _ = sinvoke getNotifiedDeposit(_e,account,availabilityTime);
	uint256 _accountWeight = sinvoke getAccountWeight(_e,account);
	uint256 _totalWeight = sinvoke totalWeight(_e);
	
	uint expectedValueChange = value - _bondValue;
	
	//uint256 expectedWeightChange = sinvoke getDepositWeight((value-_bondValue, ...
	
	sinvoke ext_updateNotifiedDeposit(eF,account,value,availabilityTime);
		
	uint256 bondValue_;
	bondValue_, _ = sinvoke getNotifiedDeposit(e_,account,availabilityTime);
	uint256 accountWeight_ = sinvoke getAccountWeight(e_,account);
	uint256 totalWeight_ = sinvoke totalWeight(e_);
	
	uint actualValueChange = bondValue_ - _bondValue;
	
	uint256 weightOldBond = _bondValue; // sinvoke getDepositWeight(ePure,_bondValue,noticePeriod);
	uint256 weightNewBond = value; //sinvoke getDepositWeight(ePure,value,noticePeriod);
	
	assert actualValueChange == expectedValueChange, "Unexpected change in value of bond in chosen availability time";
	assert totalWeight_ - _totalWeight == accountWeight_ - _accountWeight, "Change in total weight and in account weight is not the same";
	assert accountWeight_ == _accountWeight - weightOldBond + weightNewBond, "Unexepcted change in weight";	
}


rule check_update_notified_deposit_rule3_deletion(address account, uint256 availabilityTime, uint256 value, uint256 otherIndex) {
	// deletion : value == 0
	// new index of np must be 0 too. (i.e. deleted from array and overwrite map's stored index).
	// Also, current index must be a value != np, or actually deleted the last element so this index does not exist anymore.
		
	env _e;
	env eF;
	env e_;

	require value == 0; // deletion check
	
	uint256 _bondValue; uint256 _bondIndex;
	_bondValue,_bondIndex = sinvoke getNotifiedDeposit(_e,account,availabilityTime);
	uint256 _lengthAvailabilityTimes = sinvoke _lenAvailabilityTimes(_e,account);
	
	uint256 movedIndex = _lengthAvailabilityTimes - 1;
	uint256 movedElement = sinvoke getFromAvailabilityTimes(_e, account, movedIndex);
	require movedElement != availabilityTime; // no duplicates in availabilityTimes array
	
	require 0 <= otherIndex && otherIndex < _lengthAvailabilityTimes-1 && otherIndex != _bondIndex;
	uint256 _otherElement = sinvoke getFromAvailabilityTimes(_e,account,otherIndex);
	
	sinvoke ext_updateNotifiedDeposit(eF,account,value,availabilityTime);
	
	uint256 bondValue_; uint256 bondIndex_;
	bondValue_,bondIndex_ = sinvoke getNotifiedDeposit(e_,account,availabilityTime);
	uint256 lengthAvailabilityTimes_ = sinvoke _lenAvailabilityTimes(e_,account);
	
	uint256 otherElement_ = sinvoke getFromAvailabilityTimes(e_,account,otherIndex);
	
	assert lengthAvailabilityTimes_ == _lengthAvailabilityTimes - 1, "Did not delete an element";
	assert bondIndex_ == 0, "If deleting a notified bond, must overwrite all fields of bond in the notified map";
	
	if (_bondIndex < _lengthAvailabilityTimes-1) {
		uint256 newElementInDeletedLocation = sinvoke getFromAvailabilityTimes(e_,account,_bondIndex);
		assert newElementInDeletedLocation == movedElement, "Unexpected hole in deleted index";
	}
	
	assert otherElement_ == _otherElement, "Changed unrelated index $otherIndex from ${_otherElement} to ${otherElement_}";
}


rule check_update_notified_deposit_rule4_insertion(address account, uint256 availabilityTime, uint256 value) {
	// insert : current bond value == 0
	// Index of np can be set to 0 only if original deposits len was 0.
	// New array length must be +1 compared to previous one.
		
	env _e;
	env eF;
	env e_;

	uint256 _bondValue; uint256 _bondIndex;
	_bondValue,_bondIndex = sinvoke getNotifiedDeposit(_e,account,availabilityTime);
	require _bondValue == 0;
	
	uint256 _lengthAvailabilityTimes = sinvoke _lenAvailabilityTimes(_e,account);
	
	sinvoke ext_updateNotifiedDeposit(eF,account,value,availabilityTime);
	
	uint256 bondValue_; uint256 bondIndex_;
	bondValue_,bondIndex_ = sinvoke getNotifiedDeposit(e_,account,availabilityTime);
	uint256 lengthAvailabilityTimes_ = sinvoke _lenAvailabilityTimes(e_,account);
	
	assert lengthAvailabilityTimes_ == _lengthAvailabilityTimes + 1, "Did not add an element";
	assert bondIndex_ == 0 => _lengthAvailabilityTimes == 0, "Cannot add index 0 if availability times array length is already non-zero";
	assert bondIndex_ == _lengthAvailabilityTimes, "Expected new bond index to be original length of the array, got mismatch";
}


// initialization rules
rule only_initializer_changes_initialized_field(method f) {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = sinvoke initialized(_e);
	
	require f != initialize;
	calldataarg arg;
	invoke f(eF,arg);
	
	bool isInitialized_ = sinvoke initialized(e_);
	
	assert _isInitialized == isInitialized_, "Method $f is not expected to change initialization field from ${_isInitialized} to ${isInitialized_}";
}

rule check_initializer {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = sinvoke initialized(_e);
	
	calldataarg arg;
	invoke initialize(eF,arg);
	bool successInit = !lastReverted;
	
	bool isInitialized_ = sinvoke initialized(e_);
	
	assert _isInitialized => !successInit, "initialize() must revert if already initialized";
	assert successInit => isInitialized_, "When initialize() succeeds, must set initialization field to true";
}


// all these invariants should be asserted to hold in construction