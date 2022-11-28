pragma solidity ^0.5.13;

import { IPricingModule } from "../interfaces/IPricingModule.sol";

contract MockPricingModule is IPricingModule {
  string private _name;

  constructor(string memory name_) public {
    _name = name_;
  }

  function name() external view returns (string memory) {
    return _name;
  }

  function getAmountOut(uint256, uint256, uint256, uint256) external view returns (uint256) {
    return 0;
  }

  function getAmountIn(uint256, uint256, uint256, uint256) external view returns (uint256) {
    return 0;
  }
}
