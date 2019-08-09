rule no_validate_delegation_when_validating {
	env _e;
	env eF;
	
	address account = eF.msg.sender;
	bool _isAccountValidating = sinvoke _isValidating(_e,account);

	calldataarg arg;
	invoke delegateValidating(eF,arg);
	bool succeededDelegate = !lastReverted;
	
	assert _isAccountValidating => !succeededDelegate, "Account successfully delegated validating even though it is already a validator";
} 

rule no_vote_delegation_when_voting {
	env _e;
	env eF;
	
	address account = eF.msg.sender;
	bool _isAccountVoting = sinvoke isVoting(_e,account);

	calldataarg arg;
	invoke delegateVoting(eF,arg);
	bool succeededDelegate = !lastReverted;
	
	assert _isAccountVoting => !succeededDelegate, "Account successfully delegated voting even though it is already a voter";
} 