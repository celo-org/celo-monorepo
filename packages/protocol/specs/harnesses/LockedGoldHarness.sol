pragma solidity ^0.5.8;

import "contracts/governance/LockedGold.sol";

contract LockedGoldHarness is LockedGold {

	function _votingDelegate(address account) public view returns (address) {
		return getVoterFromAccount(account);
	}
		
	function _validatingDelegate(address account) public view returns (address) {
		return getValidatorFromAccount(account);
	}
		
	function _exists(address account) public view returns (bool) {
		return isAccount(account);
	}
		
	// delegate functions wrapped - TODO: Get rid of by calling with the arguments instead with calldataarg
	function delegateValidating(address delegate, uint8 v, bytes32 r, bytes32 s) public {
		authorizeValidator(delegate, v, r, s);
	}
	
	function delegateVoting(address delegate, uint8 v, bytes32 r, bytes32 s) public {
		authorizeVoter(delegate, v, r, s);
	}
	
	// these could revert. chanage! SG TODO
	/*function getAccountFromRewardsRecipient(address accountOrDelegate) public view returns (address) {
		return getAccountFromDelegateAndRole(accountOrDelegate,DelegateRole.Rewards);
	}*/
	
	
	// TODO: Note in the harness we assume already that getAddressFor always returns just the registry address
	/*function _isValidating(address account) public view returns (bool) {
		IValidators validators = IValidators(registry.getAddressFor(VALIDATORS_REGISTRY_ID));
		return validators.isValidating(account);
	}*/
	
	/*
	function ext_updateLockedCommitment(address accountAddr, uint256 value, uint256 noticePeriod) public {
		Account storage account = accounts[accountAddr];
		uint128 safeValue = safeCast128(value);
		updateLockedCommitment(account,value,noticePeriod);
	}
	*/
	/*function ext_updateNotifiedDeposit(address accountAddr, uint256 value, uint256 availabilityTime) public {
		Account storage account = accounts[accountAddr];
		uint128 safeValue = safeCast128(value);
		updateNotifiedDeposit(account,value,availabilityTime);
	}*/
	

}