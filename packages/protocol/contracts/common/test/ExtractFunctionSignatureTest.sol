pragma solidity >=0.8.7 <0.8.20;

import "../ExtractFunctionSignature.sol";

contract ExtractFunctionSignatureTest {
  // using ExtractFunctionSignature;
  function extractFunctionSignature(bytes memory input) public pure returns (bytes4) {
    return ExtractFunctionSignature.extractFunctionSignature(input);
  }
}
