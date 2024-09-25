pragma solidity >=0.5.13 <0.9.0;

interface IBlocker {
  function isBlocked() external view returns (bool);
}
