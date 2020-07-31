pragma solidity ^0.5.3;

interface IMetaTransactionWallet {
  function setSigner(address) external;
  function setEip712DomainSeparator(uint256) external;
  // function getTransactionSigner(address, uint256, bytes calldata, uint256, uint8, bytes32, bytes32) external view returns (address);
  function executeMetaTransaction(address, uint256, bytes calldata, uint8, bytes32, bytes32)
    external
    returns (bytes memory);
  function executeTransaction(address, uint256, bytes calldata, uint256)
    external
    returns (bytes memory);
}
