// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";

import "./UsingRegistry.sol";

import "../../contracts/common/Initializable.sol";
import "./interfaces/ICeloUnreleasedTreasuryInitializer.sol";

/**
 * @title Contract for unreleased Celo tokens.
 * @notice This contract is not allowed to receive transfers of CELO,
 * to avoid miscalculating the epoch rewards and to prevent any malicious actor
 * from routing stolen fund through the epoch reward distribution.
 */
contract CeloUnreleasedTreasury is
  ICeloUnreleasedTreasuryInitializer,
  UsingRegistry,
  ReentrancyGuard,
  Initializable
{
  bool internal hasAlreadyReleased;

  // Remaining epoch rewards to distribute.
  uint256 internal remainingBalanceToRelease;

  event Released(address indexed to, uint256 amount);

  modifier onlyEpochManager() {
    require(
      msg.sender == registry.getAddressForOrDie(EPOCH_MANAGER_REGISTRY_ID),
      "Only the EpochManager contract can call this function."
    );
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice A constructor for initialising a new instance of a CeloUnreleasedTreasury contract.
   * @param registryAddress The address of the registry core smart contract.
   
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Releases the Celo to the specified address.
   * @param to The address to release the amount to.
   * @param amount The amount to release.
   */
  function release(address to, uint256 amount) external onlyEpochManager {
    if (!hasAlreadyReleased) {
      remainingBalanceToRelease = address(this).balance;
      hasAlreadyReleased = true;
    }

    require(remainingBalanceToRelease >= amount, "Insufficient balance.");
    require(getCeloToken().transfer(to, amount), "CELO transfer failed.");
    remainingBalanceToRelease -= amount;
    emit Released(to, amount);
  }

  /**
   * @notice Returns the remaining balance this contract has left to release.
   * @dev This uses internal accounting of the released balance,
   * to avoid recounting CELO that was transferred back to this contract.
   */
  function getRemainingBalanceToRelease() external view returns (uint256) {
    if (!hasAlreadyReleased) {
      return address(this).balance;
    } else {
      return remainingBalanceToRelease;
    }
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
