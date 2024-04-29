pragma solidity >=0.5.13 <0.9.0;

interface IOwnable {
  // WARNING: owner() in ownable is public, not external
  function owner() external view returns (address);
}
