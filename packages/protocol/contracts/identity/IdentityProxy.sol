pragma solidity ^0.5.13;

import "../common/ExternalCall.sol";

contract IdentityProxy {
  address public deployer;

  constructor() public {
    deployer = msg.sender;
  }

  modifier onlyDeployer() {
    require(msg.sender == deployer, "Only callable by original deployer");
    _;
  }

  function makeCall(address destination, uint256 value, bytes calldata data) external onlyDeployer {
    ExternalCall.execute(destination, value, data);
  }
}
