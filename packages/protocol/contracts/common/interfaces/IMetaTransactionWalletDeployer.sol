pragma solidity ^0.5.3;

interface IMetaTransactionWalletDeployer {
  function deploy(address, address, bytes calldata) external;
  function changeDeployerPermission(address, bool) external;
  function canDeploy(address) external view returns (bool);
}
