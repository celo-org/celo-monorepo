pragma solidity >=0.5.13 <0.9.0;

interface IProxy {
  // function() external payable;
  function _transferOwnership(address newOwner) external;
  function _setAndInitializeImplementation(address implementation, bytes calldata callbackData)
    external
    payable;
  function _getImplementation() external view returns (address implementation);
}
