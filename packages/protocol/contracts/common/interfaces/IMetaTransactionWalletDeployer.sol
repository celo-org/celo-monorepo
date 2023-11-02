// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IMetaTransactionWalletDeployer {
  function deploy(address, address, bytes calldata) external;
}
