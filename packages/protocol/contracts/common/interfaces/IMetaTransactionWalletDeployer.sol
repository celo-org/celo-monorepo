pragma solidity ^0.5.3;

interface IMetaTransactionWalletDeployer {
  function deploy(address, address, bytes calldata) external;
  function changeDeployerAllowance(address, bool) external;
  function canDeploy(address) external view returns (bool);
  function wallets(address) external view returns (address);
}
