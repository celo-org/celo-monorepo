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

  /**
   * @notice Performs an arbitrary call.
   * @param destination The address the call.
   * @param value The value of native token to transfer.
   * @param data The calldata to send with the call.
   * @dev This can only be called by the deployer of this contract, presumably
   * the IdentityProxyHub after it checks the identity heuristic.
   */
  function makeCall(address destination, uint256 value, bytes calldata data) external onlyDeployer {
    ExternalCall.execute(destination, value, data);
  }
}
