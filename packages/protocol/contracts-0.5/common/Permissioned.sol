pragma solidity ^0.5.13;

contract Permissioned {
  /**
   * @notice Modifier that restricts function calls to a specific permitted address.
   * @param permittedAddress The address that is allowed to call the function.
   */
  modifier onlyPermitted(address permittedAddress) {
    require(msg.sender == permittedAddress, "Only permitted address can call");
    _;
  }
}
