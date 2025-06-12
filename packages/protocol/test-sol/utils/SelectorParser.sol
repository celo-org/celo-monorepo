// SPDX-License-Identifier: Unlicensed
pragma solidity >=0.5.13 <0.9.0;

// Foundry imports
import { Vm } from "forge-std-8/Vm.sol";

// Local imports
import { StringUtils } from "@celo-contracts/common/libraries/StringUtils.sol";

library SelectorParser {
  using StringUtils for string;

  // internal function to convert value of string to selector
  function _parseSelector(string memory _str) internal pure returns (bytes4) {
    // cast string to raw bytes
    bytes memory bytes_ = bytes(_str);
    // loop over string and interpret as bytes
    uint256 value_ = 0;
    for (uint i = 0; i < bytes_.length; i++) {
      uint8 c = uint8(bytes_[i]);
      // interpret ASCII character as byte
      value_ =
        value_ *
        16 +
        (
          c >= 48 && c <= 57
            ? c - 48 // 0-9
            : c >= 97 && c <= 102
              ? c - 87 // a-f
              : c >= 65 && c <= 70
                ? c - 55 // A-F
                : 0
        );
    }
    return bytes4(uint32(value_));
  }

  // internal function to read function selector from prepared file
  function getSelector(
    string memory _json,
    string[] memory _functionsWithTypes,
    string memory _functionName,
    Vm _vm
  ) internal pure returns (bytes4) {
    // loop over functions with types (eg: transfer(address,uint256))
    for (uint256 i = 0; i < _functionsWithTypes.length; i++) {
      string memory functionWithTypes_ = _functionsWithTypes[i];
      // check if function with type starts with desired function name (eg: transfer)
      if (functionWithTypes_.startsWith(_functionName)) {
        // load value of selector from json
        bytes memory selectorValue_ = _vm.parseJson(
          _json,
          string.concat("['", functionWithTypes_, "']")
        );
        // decode value to string
        string memory selectorString_ = abi.decode(selectorValue_, (string));
        // return parsed value as bytes4
        return _parseSelector(selectorString_);
      }
    }
    // revert if selector not found
    revert(string.concat("selector for function ", _functionName, " not present in contract"));
  }
}
