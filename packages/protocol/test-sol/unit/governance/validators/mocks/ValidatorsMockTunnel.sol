// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "@celo-contracts/governance/interfaces/IValidators.sol";
import { Test as ForgeTest } from "forge-std/Test.sol";

contract ValidatorsMockTunnel is ForgeTest {
  IValidators private tunnelValidators;
  address validatorContractAddress;

  struct InitParamsTunnel {
    // The number of blocks to delay a ValidatorGroup's commission
    uint256 commissionUpdateDelay;
    uint256 deprecated_downtimeGracePeriod;
  }

  constructor(address _validatorContractAddress) public {
    validatorContractAddress = _validatorContractAddress;
    tunnelValidators = IValidators(validatorContractAddress);
  }

  struct InitParams {
    address registryAddress;
    uint256 groupRequirementValue;
    uint256 groupRequirementDuration;
    uint256 validatorRequirementValue;
    uint256 validatorRequirementDuration;
  }

  struct InitParams2 {
    uint256 _membershipHistoryLength;
    uint256 _slashingMultiplierResetPeriod;
    uint256 _maxGroupSize;
    uint256 _commissionUpdateDelay;
    uint256 _downtimeGracePeriod;
  }

  // TODO move this to a generic Tunnel helper contract, add to other tunnels.
  /*
   * Recovers the string encoded in return data from a failing call.
   * The data is the RLP encoding of Error(<error string>).
   * See https://docs.soliditylang.org/en/v0.5.17/control-structures.html#revert
   * for details.
   */
  function recoverErrorString(bytes memory errorData) internal returns (string memory) {
    // Offset in `errorData` due to it starting with the signature for Error(string)
    uint256 signatureLength = 4;
    uint256 stringEncodingLength = errorData.length - signatureLength;
    // Buffer to store the encoded string
    bytes memory stringEncodingData = new bytes(stringEncodingLength);

    // The string encoding should be 32-byte aligned, as per RLP encoding
    assert(stringEncodingLength % 32 == 0);

    // Start the offset at 32, since the first 32 bytes of a `bytes` variable in
    // memory are used to store its length
    for (uint256 offset = 32; offset <= stringEncodingLength; offset += 32) {
      assembly {
        mstore(add(stringEncodingData, offset), mload(add(errorData, add(signatureLength, offset))))
      }
    }
    string memory errorString = abi.decode(stringEncodingData, (string));
    return errorString;
  }

  function MockInitialize(
    address sender,
    InitParams calldata params,
    InitParams2 calldata params2
  ) external returns (bool, bytes memory) {
    InitParamsTunnel memory initParamsTunnel = InitParamsTunnel({
      commissionUpdateDelay: params2._commissionUpdateDelay,
      deprecated_downtimeGracePeriod: params2._downtimeGracePeriod
    });

    bytes memory data = abi.encodeWithSignature(
      "initialize(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,(uint256,uint256))",
      params.registryAddress,
      params.groupRequirementValue,
      params.groupRequirementDuration,
      params.validatorRequirementValue,
      params.validatorRequirementDuration,
      params2._membershipHistoryLength,
      params2._slashingMultiplierResetPeriod,
      params2._maxGroupSize,
      initParamsTunnel
    );
    vm.prank(sender);
    (bool success, bytes memory errorData) = address(tunnelValidators).call(data);
    if (!success) {
      string memory errorString = recoverErrorString(errorData);
      require(success, errorString);
    }
  }
}
