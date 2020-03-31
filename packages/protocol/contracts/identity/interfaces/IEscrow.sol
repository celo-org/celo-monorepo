pragma solidity ^0.5.3;

interface IEscrow {
  function transfer(
    bytes32 identifier,
    address token,
    uint256 value,
    uint256 expirySeconds,
    address paymentId,
    uint256 minAttestations
  ) external returns (bool);

  function withdraw(address paymentID, uint8 v, bytes32 r, bytes32 s) external returns (bool);

  function revoke(address paymentID) external returns (bool);

  function getReceivedPaymentIds(bytes32 identifier) external view returns (address[] memory);

  function getSentPaymentIds(address sender) external view returns (address[] memory);
}
