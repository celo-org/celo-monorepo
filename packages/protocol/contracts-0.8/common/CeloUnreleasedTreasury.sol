// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.9;

import "@openzeppelin/contracts8/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";

import "./UsingRegistry.sol";
import "../common/IsL2Check.sol";

import "../../contracts/common/Initializable.sol";
import "./interfaces/ICeloUnreleasedTreasuryInitializer.sol";

/**
 * @title Contract for unreleased Celo tokens.
 */
contract CeloUnreleasedTreasury is UsingRegistry, ReentrancyGuard, Initializable, IsL2Check {
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
    require(address(this).balance >= amount, "Insufficient balance.");
    require(getCeloToken().transfer(to, amount), "CELO transfer failed.");
    emit Released(to, amount);
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
