pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./VestingInstance.sol";
import "./interfaces/IVestingFactory.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";

contract VestingFactory is Initializable, UsingRegistry, IVestingFactory {
  using SafeMath for uint256;

  // Mapping between beneficiary addresses and associated vesting contracts (schedules).
  mapping(address => address) public vestings;

  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  event NewVestingInstanceCreated(address indexed beneficiary, address atAddress);

  /**
   * @notice Factory function for creating a new vesting contract instance.
   * @param vestingBeneficiary Address of the beneficiary to whom vested tokens are transferred.
   * @param vestingNumPeriods Number of vesting periods.
   * @param vestingCliff Duration in seconds of the cliff in which tokens will begin to vest.
   * @param vestingStartTime The time (in Unix time) at which point vesting starts.
   * @param vestingPeriodSec Duration in seconds of the period in which the tokens will vest.
   * @param vestAmountPerPeriod The vesting amound per period.
   * @param vestingRevocable Whether the vesting is revocable or not.
   * @param vestingRevoker Address of the person revoking the vesting.
   * @param vestingMaxPausePeriod Maximum pause period in seconds.
   * @return The address of the newly created vesting instance.
   */
  function createVestingInstance(
    address payable vestingBeneficiary,
    uint256 vestingNumPeriods,
    uint256 vestingCliff,
    uint256 vestingStartTime,
    uint256 vestingPeriodSec,
    uint256 vestAmountPerPeriod,
    bool vestingRevocable,
    address payable vestingRevoker,
    uint256 vestingMaxPausePeriod
  ) external onlyOwner returns (address) {
    uint256 vestingAmount = vestingNumPeriods.mul(vestAmountPerPeriod);
    require(
      getGoldToken().balanceOf(address(this)) >= vestingAmount,
      "Factory balance is insufficient to create requested vesting contract"
    );

    require(
      vestings[vestingBeneficiary] == address(0),
      "Only one vesting contract per beneficiary allowed"
    );

    address newVestingInstance = address(
      new VestingInstance(
        vestingBeneficiary,
        vestingNumPeriods,
        vestingCliff,
        vestingStartTime,
        vestingPeriodSec,
        vestAmountPerPeriod,
        vestingRevocable,
        vestingRevoker,
        vestingMaxPausePeriod,
        address(registry)
      )
    );
    vestings[vestingBeneficiary] = newVestingInstance;
    getGoldToken().transfer(newVestingInstance, vestingAmount);
    emit NewVestingInstanceCreated(vestingBeneficiary, newVestingInstance);
    return newVestingInstance;
  }
}
