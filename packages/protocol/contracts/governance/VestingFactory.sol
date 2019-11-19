pragma solidity ^0.5.3;

import "./VestingInstance.sol";

contract VestingFactory {
  // mapping between beneficiary addresses and associated vesting contracts (schedules)
  mapping(address => VestingInstance) public hasVestedAt;

  /**
     * @notice Factory function for creating a new vesting contract instance
     * @param beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param vestingAmount the amount that is to be vested by the contract
     * @param vestingCliff duration in seconds of the cliff in which tokens will begin to vest
     * @param vestingStartTime the time (as Unix time) at which point vesting starts
     * @param vestingPeriodSec duration in seconds of the period in which the tokens will vest
     * @param vestAmountPerPeriod the vesting amound per period where period is the vestingAmount distributed over the vestingPeriodSec
     * @param revocable whether the vesting is revocable or not
     * @param revoker address of the person revoking the vesting
     * @param refundDestination address of the refund receiver after the vesting is deemed revoked
     */
  function createVestingInstance(
    address beneficiary,
    uint256 vestingAmount,
    uint256 vestingCliff,
    uint256 vestingStartTime,
    uint256 vestingPeriodSec,
    uint256 vestAmountPerPeriod,
    bool revokable,
    address revoker,
    address refundDestination
  ) public {
    // creation of a new vesting contract
    hasVestedAt[beneficiary] = new VestingInstance(
      beneficiary,
      vestingAmount,
      vestingCliff,
      vestingStartTime,
      vestingPeriodSec,
      vestAmountPerPeriod,
      revokable,
      revoker,
      refundDestination
    );
  }
}
