pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";

contract Utils is Test {
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet addressSet;

  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

  function blockTravel(uint256 blockDelta) public {
    vm.roll(block.number + blockDelta);
  }

  function assertAlmostEqual(uint256 actual, uint256 expected, uint256 margin) public {
    uint256 diff = actual > expected ? actual - expected : expected - actual;
    assertTrue(diff <= margin, string(abi.encodePacked("Difference is ", uintToStr(diff))));
  }

  function uintToStr(uint256 _i) internal pure returns (string memory _uintAsString) {
    uint256 number = _i;
    if (number == 0) {
      return "0";
    }
    uint256 j = number;
    uint256 len;
    while (j != 0) {
      len++;
      j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint256 k = len - 1;
    while (number != 0) {
      bstr[k--] = bytes1(uint8(48 + (number % 10)));
      number /= 10;
    }
    return string(bstr);
  }

  function arraysEqual(address[] memory arr1, address[] memory arr2) public returns (bool) {
    if (arr1.length != arr2.length) {
      return false; // Arrays of different lengths cannot be equal
    }

    // Add addresses from arr1 to the set
    for (uint256 i = 0; i < arr1.length; i++) {
      addressSet.add(arr1[i]);
    }

    // Check if each address in arr2 is in the set
    for (uint256 i = 0; i < arr2.length; i++) {
      if (!addressSet.contains(arr2[i])) {
        clearSet(arr1);
        return false;
      }
    }

    clearSet(arr1);
    return true;
  }

  function clearSet(address[] memory arr1) private {
    for (uint256 i = 0; i < arr1.length; i++) {
      addressSet.remove(arr1[i]);
    }
  }

  // Generates pseudo random number in the range [min, max] using block attributes
  function generatePRN(uint256 min, uint256 max, uint256 salt) public view returns (uint256) {
    return
      (uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender, salt))) %
        (max - min + 1)) + min;
  }

  /**
    * @notice  Gets runtime code (or "deployedBytecode") at a contract address.
    *   Using the `.code` or `.runtime` property on a contract is only available in Solidity 0.8.0 and later.
    *   On Solity <0.8.0, inline assembly is necessary to retrieve the bytecode of a contract.
    *   This implementation is taken from the Solidity documentation.
    *   Source: https://docs.soliditylang.org/en/v0.4.24/assembly.html#example
    * @param _addr Contract address.
    * @return Runtime bytecode at contract address.
    */
  function getCodeAt(address _addr) public view returns (bytes memory o_code) {
    assembly {
      // retrieve the size of the code, this needs assembly
      let size := extcodesize(_addr)
      // allocate output byte array - this could also be done without assembly
      // by using o_code = new bytes(size)
      o_code := mload(0x40)
      // new "memory end" including padding
      mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
      // store length in memory
      mstore(o_code, size)
      // actually retrieve the code, this needs assembly
      extcodecopy(_addr, add(o_code, 0x20), 0, size)
    }
  }

  /**
    * @notice Removes CBOR encoded metadata from the tail of the deployedBytecode.
    * @param data Bytecode including the CBOR encoded tail.
    * @return Bytecode without the CBOR encoded metadata.
    */
  function removeMetadataFromBytecode(bytes memory data) public pure returns (bytes memory) {
    // Ensure the data length is at least enough to contain the length specifier
    require(data.length >= 2, "Data too short to contain a valid CBOR length specifier");

    // Calculate the length of the CBOR encoded section from the last two bytes
    uint16 cborLength = uint16(uint8(data[data.length - 2])) * 256 + uint16(uint8(data[data.length - 1]));

    // Ensure the length is valid (not greater than the data array length minus 2 bytes for the length field)
    require(cborLength <= data.length - 2, "Invalid CBOR length");

    // Calculate the new length of the data without the CBOR section
    uint newLength = data.length - 2 - cborLength;

    // Create a new byte array for the result
    bytes memory result = new bytes(newLength);

    // Copy data from the original byte array to the new one, excluding the CBOR section and its length field
    for (uint i = 0; i < newLength; i++) {
        result[i] = data[i];
    }

    return result;
  }
}
