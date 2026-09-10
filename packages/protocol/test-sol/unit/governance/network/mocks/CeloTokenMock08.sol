// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";

/**
 * @title A mock GoldToken for 0.8 testing.
 * Simulates balance-based transfers without requiring the TRANSFER precompile.
 * Implements allocatedSupply() used by EpochRewards.
 */
contract CeloTokenMock08 {
  uint8 public constant decimals = 18;
  address public registry;
  mapping(address => uint256) balances;
  mapping(address => mapping(address => uint256)) allowed;

  function setRegistry(address registryAddress) external {
    registry = registryAddress;
  }

  function allocatedSupply() external view returns (uint256) {
    uint256 celoSupplyCap = 1000000000 ether;
    address treasury = IRegistry(registry).getAddressForOrDie(
      keccak256(abi.encodePacked("CeloUnreleasedTreasury"))
    );
    return celoSupplyCap - ICeloUnreleasedTreasury(treasury).getRemainingBalanceToRelease();
  }

  function transfer(address to, uint256 amount) external returns (bool) {
    return _transfer(msg.sender, to, amount);
  }

  function transferFrom(address from, address to, uint256 amount) external returns (bool) {
    return _transfer(from, to, amount);
  }

  function _transfer(address from, address to, uint256 amount) internal returns (bool) {
    if (balances[from] < amount) {
      return false;
    }
    balances[from] -= amount;
    balances[to] += amount;
    return true;
  }

  function setBalanceOf(address a, uint256 value) external {
    balances[a] = value;
  }

  function balanceOf(address a) public view returns (uint256) {
    return balances[a];
  }

  function approve(address spender, uint256 value) external returns (bool) {
    allowed[msg.sender][spender] = value;
    return true;
  }

  function allowance(address owner, address spender) external view returns (uint256) {
    return allowed[owner][spender];
  }
}
