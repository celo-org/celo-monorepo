pragma solidity ^0.5.8;

import "contracts/governance/LockedGold.sol";

contract LockedGoldHarness is LockedGold {

	function _lenNoticePeriods(address account) public view returns (uint256) {
		return getNoticePeriodsLen(account);
	}
	
	function _lenAvailabilityTimes(address account) public view returns (uint256) { 
		return getAvailabilityTimesLen(account);
	}
	
	function _rewardsDelegate(address account) public view returns (address) {
		return getDelegateFromAccountAndRole(account, DelegateRole.Rewards);
	}
	
	function _votingDelegate(address account) public view returns (address) {
		return getDelegateFromAccountAndRole(account, DelegateRole.Voting);
	}
		
	function _validatingDelegate(address account) public view returns (address) {
		return getDelegateFromAccountAndRole(account, DelegateRole.Validating);
	}
	
	function _weight(address account) public view returns (uint256) {
		return accounts[account].weight;
	}
	
	function _exists(address account) public view returns (bool) {
		return accounts[account].exists;
	}
	
	function _getFromNoticePeriods(address _account,uint256 index) public view returns (uint256) {
		return getFromNoticePeriods(_account,index);
	}
	
	function _getFromAvailabilityTimes(address _account,uint256 index) public view returns (uint256) {
		return getFromAvailabilityTimes(_account,index);
	}
	
	// delegate functions wrapped - TODO: Get rid of by calling with the arguments instead with calldataarg
	function delegateValidating(address delegate, uint8 v, bytes32 r, bytes32 s) public {
		_delegateRole(DelegateRole.Validating, delegate, v, r, s);
	}
	
	function delegateVoting(address delegate, uint8 v, bytes32 r, bytes32 s) public {
		_delegateRole(DelegateRole.Voting, delegate, v, r, s);
	}
	
	// these could revert. chanage! SG TODO
	function getAccountFromRewardsRecipient(address accountOrDelegate) public view returns (address) {
		return getAccountFromDelegateAndRole(accountOrDelegate,DelegateRole.Rewards);
	}
	
	function getAccountFromVoter(address accountOrDelegate) public view returns (address) {
		return getAccountFromDelegateAndRole(accountOrDelegate,DelegateRole.Voting);
	}
	
	function getAccountFromValidator(address accountOrDelegate) public view returns (address) {
		return getAccountFromDelegateAndRole(accountOrDelegate,DelegateRole.Validating);
	}
	
	// TODO: Note in the harness we assume already that getAddressFor always returns just the registry address
	function _isValidating(address account) public view returns (bool) {
		IValidators validators = IValidators(registry.getAddressFor(VALIDATORS_REGISTRY_ID));
		return validators.isValidating(account);
	}
	
	
	function ext_updateLockedCommitment(address accountAddr, uint256 value, uint256 noticePeriod) public {
		Account storage account = accounts[accountAddr];
		uint128 safeValue = safeCast128(value);
		updateLockedCommitment(account,value,noticePeriod);
	}
	
	function ext_updateNotifiedDeposit(address accountAddr, uint256 value, uint256 availabilityTime) public {
		Account storage account = accounts[accountAddr];
		uint128 safeValue = safeCast128(value);
		updateNotifiedDeposit(account,value,availabilityTime);
	}
	

}