pragma solidity >=0.5.13 <0.9.0;

interface IProxyFactory {
  function deployProxy(address) external returns (address);
  function deployProxy() external returns (address);
}
