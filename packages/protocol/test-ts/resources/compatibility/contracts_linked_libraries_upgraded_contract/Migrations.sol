pragma solidity ^0.5.3;

contract Migrations {
  address public owner;
  uint256 public last_completed_migration; // solhint-disable var-name-mixedcase

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  constructor() public {
    owner = msg.sender;
  }

  function setCompleted(uint256 completed) external restricted {
    last_completed_migration = completed; // solhint-disable var-name-mixedcase
  }

  // solhint-disable-next-line func-param-name-mixedcase
  function upgrade(address new_address) external restricted {
    Migrations upgraded = Migrations(new_address);
    upgraded.setCompleted(last_completed_migration);
  }
}
