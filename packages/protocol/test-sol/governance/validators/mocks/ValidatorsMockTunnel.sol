// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "@celo-contracts/governance/test/ValidatorsMock.sol";
import { Test as ForgeTest } from "forge-std/Test.sol";

contract ValidatorsMockTunnel is ForgeTest {
  ValidatorsMock private tunnelValidators;
  address validatorContractAddress;

  constructor(address _validatorContractAddress) public {
    validatorContractAddress = _validatorContractAddress;
    tunnelValidators = ValidatorsMock(validatorContractAddress);
  }

  struct InitParams {
    address registryAddress;
    uint256 groupRequirementValue;
    uint256 groupRequirementDuration;
    uint256 validatorRequirementValue;
    uint256 validatorRequirementDuration;
    uint256 validatorScoreExponent;
    uint256 validatorScoreAdjustmentSpeed;
  }

  struct InitParams2 {
    uint256 _membershipHistoryLength;
    uint256 _slashingMultiplierResetPeriod;
    uint256 _maxGroupSize;
    uint256 _commissionUpdateDelay;
    uint256 _downtimeGracePeriod;
  }

  function MockInitialize(
    address sender,
    InitParams calldata params,
    InitParams2 calldata params2
  ) external returns (bool, bytes memory) {
    bytes memory data = abi.encodeWithSignature(
      "initialize(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)",
      params.registryAddress,
      params.groupRequirementValue,
      params.groupRequirementDuration,
      params.validatorRequirementValue,
      params.validatorRequirementDuration,
      params.validatorScoreExponent,
      params.validatorScoreAdjustmentSpeed,
      params2._membershipHistoryLength,
      params2._slashingMultiplierResetPeriod,
      params2._maxGroupSize,
      params2._commissionUpdateDelay,
      params2._downtimeGracePeriod
    );
    vm.prank(sender);
    (bool success, ) = address(tunnelValidators).call(data);
    require(success, "unsuccessful tunnel call");
  }
}
