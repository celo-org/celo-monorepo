pragma solidity ^0.8.13;

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

interface IDecimals is IERC20 {
   function decimals() external view returns (uint8);
}