pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IOdisPayments.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistryV2.sol";
import "../common/libraries/ReentrancyGuard.sol";

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
