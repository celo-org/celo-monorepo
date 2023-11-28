pragma solidity >=0.5.0;

interface IUniswapV2FactoryMin {
  function getPair(address tokenA, address tokenB) external view returns (address pair);
}
