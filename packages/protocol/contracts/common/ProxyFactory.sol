pragma solidity ^0.5.13;

// import "@celo-contracts/common/interfaces/IProxy.sol";
import "./Proxy.sol";
import "./interfaces/IProxyFactory.sol";

contract ProxyFactory is IProxyFactory {
  function deployProxy(address owner) external returns (address) {
    return _deployProxy(owner);
  }

  function deployProxy() external returns (address) {
    return _deployProxy(msg.sender);
  }

  function _deployProxy(address owner) private returns (address) {
    Proxy proxy = new Proxy();
    proxy._transferOwnership(owner);
    return address(proxy);
  }

  // function deployArbitraryByteCode(address owner, bytes calldata initCode) external returns (address) {
  //   return _deployArbitraryByteCode(owner, initCode);
  // }
}
