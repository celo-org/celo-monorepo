pragma solidity ^0.5.3;

interface IMetaTransactionWallet {
  function setSigner(address) external;
  function setEip712DomainSeparator() external;
  function executeTransaction(address, uint256, bytes calldata) external returns (bytes memory);
  function executeTransactions(address[] calldata, uint256[] calldata, bytes calldata) external;
  function executeMetaTransaction(address, uint256, bytes calldata, uint8, bytes32, bytes32)
    external
    returns (bytes memory);
}
