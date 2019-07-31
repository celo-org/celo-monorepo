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
			uint256[] noticePeriods;
			uint256[] availabilityTimes;
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

}