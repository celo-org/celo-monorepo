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
   * @param destination The address to call.
   * @param data The calldata to send with the call.
   * @dev This can only be called by the deployer of this contract, presumably
   * the IdentityProxyHub after it checks the identity heuristic.
   * @return The return value of the external call.
   */
  function makeCall(address destination, bytes calldata data)
    external
    payable
    onlyDeployer
    returns (bytes memory)
  {
    return ExternalCall.execute(destination, msg.value, data);
  }
}
