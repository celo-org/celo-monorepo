pragma solidity ^0.5.13;

import "./interfaces/ICeloVersionedContract.sol";
import "./interfaces/IMetaTransactionWalletDeployer.sol";
import "./proxies/MetaTransactionWalletProxy.sol";

contract MetaTransactionWalletDeployer is IMetaTransactionWalletDeployer, ICeloVersionedContract {
  event WalletDeployed(address indexed owner, address indexed wallet, address implementation);

  /**
     * @notice Returns the storage, major, minor, and patch version of the contract.
     * @return The storage, major, minor, and patch version of the contract.
     */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 1);
  }

  /**
     * @notice Used to deploy a MetaTransactionWalletProxy, set the implementation,
     * initialize, transfer ownership and emit an event.
     * @param owner The external account which will act as signer and owner of the proxy
     * @param implementation The address of the implementation which the proxy will point to
     * @param initCallData calldata pointing to a method on implementation used to initialize
     */
  function deploy(address owner, address implementation, bytes calldata initCallData) external {
    MetaTransactionWalletProxy proxy = new MetaTransactionWalletProxy();
    proxy._setAndInitializeImplementation(implementation, initCallData);
    proxy._transferOwnership(owner);

    emit WalletDeployed(owner, address(proxy), implementation);
  }
}
