// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/utils/math/SafeMath.sol";
import "@openzeppelin/contracts8/interfaces/IERC20.sol";
import "@openzeppelin/contracts8/token/ERC20/utils/SafeERC20.sol";

import "../../contracts/identity/interfaces/IOdisPayments.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";

import "../../contracts/common/Initializable.sol";
import "../../contracts-0.8/common/UsingRegistryV2.sol";
import "../../contracts/common/libraries/ReentrancyGuard.sol";

/**
 * @title Stores balance to be used for ODIS quota calculation.
 */
contract OdisPayments is
  IOdisPayments,
  ICeloVersionedContract,
  ReentrancyGuard,
  Ownable,
  Initializable,
  UsingRegistryV2
{
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // Store amount sent (all time) from account to this contract.
  // Values in totalPaidCUSD should only ever be incremented, since ODIS relies
  // on all-time paid balance to compute every quota.
  mapping(address => uint256) public totalPaidCUSD;

  event PaymentMade(address indexed account, uint256 valueInCUSD);

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialization.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Sends cUSD to this contract to pay for ODIS quota (for queries).
   * @param account The account whose balance to increment.
   * @param value The amount in cUSD to pay.
   * @dev Throws if cUSD transfer fails.
   */
  function payInCUSD(address account, uint256 value) external nonReentrant {
    IERC20(registryContract.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID)).safeTransferFrom(
      msg.sender,
      address(this),
      value
    );
    totalPaidCUSD[account] = totalPaidCUSD[account].add(value);
    emit PaymentMade(account, value);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
