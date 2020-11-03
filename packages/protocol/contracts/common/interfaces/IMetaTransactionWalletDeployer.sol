pragma solidity ^0.5.3;

interface IMetaTransactionWalletDeployer {
  function deploy(address, address, bytes calldata) external;
}
