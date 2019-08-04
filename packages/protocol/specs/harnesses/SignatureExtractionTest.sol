pragma solidity ^0.5.0;

contract SignatureExtractionTest {

	bytes _data;
	
	function extractFunctionSignature() public returns (uint256) {
		bytes4 signature = _extractFunctionSignature(_data);
		return uint256(bytes32(signature));
	}
	
	function extractMyFunctionSignature() public returns (uint256) {
		require(msg.data.length < 10000);
		return uint256(bytes32(_extractFunctionSignature(msg.data)));
	}
	
	function _extractFunctionSignature(bytes memory input) private pure returns (bytes4) {
		bytes4 output;
		/* solhint-disable no-inline-assembly */
		assembly {
		  mstore(output, input)
		  mstore(add(output, 4), add(input, 4))
		}
		/* solhint-enable no-inline-assembly */
		return output;
	}
  
}