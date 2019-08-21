pragma solidity ^0.5.8;

import "contracts/governance/BondedDeposits.sol";

contract BondedDepositsHarness is BondedDeposits {

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
		return accounts[account].deposits.noticePeriods.length;
	}
	
	function _lenAvailabilityTimes(address account) public view returns (uint256) { 
		return accounts[account].deposits.availabilityTimes.length;
	}
	
	function _rewardsDelegate(address account) public view returns (address) {
		return accounts[account].rewards.delegate;
	}
	
	function _rewardsLastRedeemed(address account) public view returns (uint96) {
		return accounts[account].rewards.lastRedeemed;
	}
	
	function _votingDelegate(address account) public view returns (address) {
		return accounts[account].voting.delegate;	
	}
	
	function _votingFrozen(address account) public view returns (bool) {
		return accounts[account].voting.frozen;
	}
	
	function _validatingDelegate(address account) public view returns (address) {
		return accounts[account].validating.delegate;
	}
	
	function _weight(address account) public view returns (uint256) {
		return accounts[account].weight;
	}
	
	function _exists(address account) public view returns (bool) {
		return accounts[account].exists;
	}
	
	function _isValidating(address account) public view returns (bool) {
		IValidators validators = IValidators(registry.getAddressFor(VALIDATORS_REGISTRY_ID));
		return validators.isValidating(account);
	}
	
	
	function ext_updateBondedDeposit(address accountAddr, uint256 value, uint256 noticePeriod) public {
		Account storage account = accounts[accountAddr];
		uint128 safeValue = safeCast128(value);
		updateBondedDeposit(account,value,noticePeriod);
	}
	
	function getFromNoticePeriods(address accountAddr,uint256 index) public view returns (uint256) {
		Account storage account = accounts[accountAddr];
		return account.deposits.noticePeriods[index];
	}
	
	function ext_updateNotifiedDeposit(address accountAddr, uint256 value, uint256 availabilityTime) public {
		Account storage account = accounts[accountAddr];
		uint128 safeValue = safeCast128(value);
		updateNotifiedDeposit(account,value,availabilityTime);
	}
	
	function getFromAvailabilityTimes(address accountAddr,uint256 index) public view returns (uint256) {
		Account storage account = accounts[accountAddr];
		return account.deposits.availabilityTimes[index];
	}
	
}