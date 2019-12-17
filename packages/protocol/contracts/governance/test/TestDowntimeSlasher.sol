pragma solidity ^0.5.3;

import "../DowntimeSlasher.sol";
import "./SlashingTestUtils.sol";

contract TestDowntimeSlasher is
  DowntimeSlasher,
  SlashingTestUtils
  /*
  function debug(uint256 endBlock) public view returns (uint256, address, address) {
    uint256 startBlock = endBlock - slashableDowntime;
    address startSigner = validatorSignerAddress(startSignerIndex, startBlock);
    address endSigner = validatorSignerAddress(endSignerIndex, endBlock);
    return (startBlock, startSigner, endSigner);
  }*/
{}
