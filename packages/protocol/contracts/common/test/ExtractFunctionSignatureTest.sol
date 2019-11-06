pragma solidity ^0.5.3;

import "../ExtractFunctionSignature.sol";

contract ExtractFunctionSignatureTest {
  // using ExtractFunctionSignature;
  function extractFunctionSignature(bytes memory input) public pure returns (bytes4) {
    return ExtractFunctionSignature.extractFunctionSignature(input);
  }
}
