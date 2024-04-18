// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/ExtractFunctionSignature.sol";

contract ExtractFunctionSignatureWrapper {
  function extractFunctionSignature(bytes memory input) public pure returns (bytes4) {
    return ExtractFunctionSignature.extractFunctionSignature(input);
  }
}

contract TestTransactions {
  mapping(uint256 => uint256) public values;

  function getValue(uint256 key) external view returns (uint256) {
    return values[key];
  }

  function setValue(uint256 key, uint256 value, bool shouldSucceed) external {
    require(shouldSucceed);
    values[key] = value;
  }
}

contract ExtractFunctionSignatureTest is Test {
  ExtractFunctionSignatureWrapper extractFunctionSignature;
  TestTransactions testTransactions;

  function setUp() public {
    extractFunctionSignature = new ExtractFunctionSignatureWrapper();
    testTransactions = new TestTransactions();
  }

  function test_ExtractFunctionSignature() public {
    // Arrange
    bytes memory data = abi.encodeWithSignature("setValue(uint256,uint256,bool)", 1, 1, true);
    bytes4 expectedSignature = bytes4(keccak256("setValue(uint256,uint256,bool)"));

    // Act
    bytes4 result = extractFunctionSignature.extractFunctionSignature(data);

    // Assert
    assertEq(result, expectedSignature);
  }
}
