pragma solidity >=0.5.0;

interface IUniswapV2PairMin {
  function getReserves()
    external
    view
    returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}
