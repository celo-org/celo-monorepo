pragma solidity ^0.5.13;

import { IMentoExchange } from "../interfaces/IMentoExchange.sol";

contract MockMentoExchange is IMentoExchange {
  string private _name;

  constructor(string memory name_) public {
    _name = name_;
  }

  function name() external view returns (string memory) {
    return _name;
  }

  function getAmountOut(address, address, uint256, uint256, uint256)
    external
    view
    returns (uint256, uint256, uint256)
  {
    return (0, 0, 0);
  }

  function getUpdatedBuckets(address, address, uint256, uint256, bytes32)
    external
    view
    returns (uint256, uint256)
  {
    return (0, 0);
  }
}
