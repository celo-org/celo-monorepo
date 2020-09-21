pragma solidity ^0.5.13;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./interfaces/ICeloVersionedContract.sol";
import "./interfaces/IMetaTransactionWalletDeployer.sol";
import "./proxies/MetaTransactionWalletProxy.sol";
import "./ExternalCall.sol";
import "./Initializable.sol";
import "./MetaTransactionWallet.sol";

contract MetaTransactionWalletDeployer is
  IMetaTransactionWalletDeployer,
  ICeloVersionedContract,
  Initializable,
  Ownable
{
  using SafeMath for uint256;
  using BytesLib for bytes;

  mapping(address => address) public wallets;
  mapping(address => bool) public canDeploy;

  event WalletDeployed(address indexed owner, address indexed wallet, address implementation);
  event DeployerStatusGranted(address indexed addr);
  event DeployerStatusRevoked(address indexed addr);

  /**
     * @dev Verifies that the sender is allowed to deploy a wallet
     */
  modifier onlyCanDeploy() {
    require(msg.sender == owner() || canDeploy[msg.sender] == true, "not-allowed");
    _;
  }

  /**
     * @notice Returns the storage, major, minor, and patch version of the contract.
     * @return The storage, major, minor, and patch version of the contract.
     */
  function getVersionNumber() public pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
     * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
     * @param initialDeployers a list of addresses that are allowed to deploy wallets
     */
  function initialize(address[] calldata initialDeployers) external initializer {
    _transferOwnership(msg.sender);
    for (uint256 i = 0; i < initialDeployers.length; i++) {
      _changeDeployerAllowance(initialDeployers[i], true);
    }
  }

  /**
     * @notice Change the deployer status of an address
     * @param target The address to be allowed as a deployer
     * @param allowedToDeploy toggle whether the address is allowed or not
     */
  function changeDeployerAllowance(address target, bool allowedToDeploy) external onlyOwner {
    _changeDeployerAllowance(target, allowedToDeploy);
  }

  /**
     * @notice Implementation of the allowance change
     * @param target The address to be allowed as a deployer
     * @param allowedToDeploy toggle whether the address is allowed or not
     */
  function _changeDeployerAllowance(address target, bool allowedToDeploy) internal {
    canDeploy[target] = allowedToDeploy;
    if (allowedToDeploy == true) {
      emit DeployerStatusGranted(target);
    } else {
      emit DeployerStatusRevoked(target);
    }
  }

  /**
     * @notice Used to deploy a MetaTransactionWalletProxy, set the implementation,
     * initialize, transfer ownership and emit an event.
     * @param owner The external account which will act as signer and owner of the proxy
     * @param implementation The address of the implementation which the proxy will point to
     */
  function deploy(address owner, address implementation, bytes calldata initCallData)
    external
    onlyCanDeploy
  {
    require(wallets[owner] == address(0), "wallet-already-deployed");

    MetaTransactionWalletProxy proxy = new MetaTransactionWalletProxy();
    proxy._setAndInitializeImplementation(implementation, initCallData);
    proxy._transferOwnership(owner);
    wallets[owner] = address(proxy);

    emit WalletDeployed(owner, address(proxy), implementation);
  }
}
