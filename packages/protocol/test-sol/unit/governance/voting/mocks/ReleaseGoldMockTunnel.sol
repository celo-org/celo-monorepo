// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "@celo-contracts/governance/ReleaseGold.sol";
import { Test as ForgeTest } from "forge-std/Test.sol";

contract ReleaseGoldMockTunnel is ForgeTest {
  ReleaseGold private releaseGoldTunnel;
  address payable releaseGoldContractAddress;

  struct InitParams {
    uint256 releaseStartTime;
    uint256 releaseCliffTime;
    uint256 numReleasePeriods;
    uint256 releasePeriod;
    uint256 amountReleasedPerPeriod;
    bool revocable;
    address payable _beneficiary;
  }

  struct InitParams2 {
    address _releaseOwner;
    address payable _refundAddress;
    bool subjectToLiquidityProvision;
    uint256 initialDistributionRatio;
    bool _canValidate;
    bool _canVote;
    address registryAddress;
  }

  constructor(address _releaseGoldContractAddress) public {
    releaseGoldContractAddress = address(uint160(_releaseGoldContractAddress));
    releaseGoldTunnel = ReleaseGold(releaseGoldContractAddress);
  }

  function MockInitialize(
    address sender,
    InitParams calldata params,
    InitParams2 calldata params2
  ) external returns (bool, bytes memory) {
    bytes4 selector = bytes4(
      keccak256(
        "initialize(uint256,uint256,uint256,uint256,uint256,bool,address,address,address,bool,uint256,bool,bool,address)"
      )
    );

    bytes memory dataFirstHalf;
    {
      // Encode the first half of the parameters
      dataFirstHalf = abi.encode(
        params.releaseStartTime,
        params.releaseCliffTime,
        params.numReleasePeriods,
        params.releasePeriod,
        params.amountReleasedPerPeriod,
        params.revocable,
        params._beneficiary
      );
    }

    bytes memory dataSecondHalf;
    {
      // Encode the second half of the parameters
      dataSecondHalf = abi.encode(
        params2._releaseOwner,
        params2._refundAddress,
        params2.subjectToLiquidityProvision,
        params2.initialDistributionRatio,
        params2._canValidate,
        params2._canVote,
        params2.registryAddress
      );
    }

    // Concatenate the selector, first half, and second half
    bytes memory data = abi.encodePacked(selector, dataFirstHalf, dataSecondHalf);

    vm.prank(sender);
    (bool success, ) = address(releaseGoldTunnel).call(data);
    require(success, "unsuccessful tunnel call");
  }
}
