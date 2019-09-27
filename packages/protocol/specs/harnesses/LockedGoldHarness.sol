pragma solidity ^0.5.8;

import "contracts/governance/LockedGold.sol";

contract LockedGoldHarness is LockedGold {

	/**
		struct Deposit {
			uint128 value;
			uint128 index;
		  }
		struct Deposits {
			// Maps a notice period in seconds to a bonded deposit.
			mapping(uint256 => Deposit) bonded;
			// Maps an availability time in seconds since epoch to a notified deposit.
			mapping(uint256 => Deposit) notified;
			uint256[] noticePeriods; // index maps to notice period which is a key in bonded?
			uint256[] availabilityTimes; // index maps to availability time which is a key in notified?
		  }

		  struct Rewards {
			// Each account may delegate their right to receive rewards rewards to exactly one address.
			// This address must not hold an account and must not be delegated to by any other account or
			// by the same account for any other purpose.
			address delegate;
			// The timestamp of the last time that rewards were redeemed.
			uint96 lastRedeemed;
		  }

		  struct Voting {
			// Each account may delegate their right to vote to exactly one address. This address must not
			// hold an account and must not be delegated to by any other account or by the same account
			// for any other purpose.
			address delegate;
			// Frozen accounts may not vote, but may redact votes.
			bool frozen;
		  }

		  struct Validating {
			// Each account may delegate the right to register a Validator or Validator Group to exactly
			// one address. This address must not hold an account and must not be delegated to by any other
			// account or by the same account for any other purpose.
			address delegate;
		  }

		  struct Account {
			bool exists;
			// The weight of the account in validator elections, governance, and block rewards.
			uint256 weight;
			Voting voting;
			Rewards rewards;
			Deposits deposits;
			Validating validating;
		  }
	 */

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