// SPDX-License-Identifier: Unlicensed
pragma solidity >=0.5.13 <0.9.0;

// Foundry imports
import { Vm } from "forge-std-8/Vm.sol";
import { stdJson } from "forge-std-8/StdJson.sol";

// Celo imports
import { IRegistry } from "@celo-contracts/common/interfaces/IRegistry.sol";

// Test imports
import { SelectorParser } from "@test-sol/utils/SelectorParser.sol";
import { StringUtils } from "@test-sol/utils/StringUtils.sol";

library ConstitutionHelper {
  using stdJson for string;
  using SelectorParser for string;
  using StringUtils for string;

  struct JsonFiles {
    string constitutionJson;
    string proxySelectors;
  }

  struct FileProps {
    string[] contractNames;
    string[] proxyNames;
    string[] proxySigs;
  }

  struct ConstitutionEntry {
    string contractName;
    address contractAddress;
    string functionName;
    bytes4 functionSelector;
    uint256 threshold;
  }

  function readConstitution(
    ConstitutionEntry[] storage _entries,
    IRegistry _registry,
    Vm _vm
  ) external {
    // get contracts from constitution
    JsonFiles memory files_ = JsonFiles(
      _vm.readFile("./governanceConstitution.json"), // constitution json
      _vm.readFile("./.tmp/selectors/Proxy.json") // proxy selectors
    );
    FileProps memory props_ = FileProps(
      _vm.parseJsonKeys(files_.constitutionJson, ""), // contract names
      _vm.parseJsonKeys(files_.constitutionJson, ".Proxy"), // proxy names
      _vm.parseJsonKeys(files_.proxySelectors, "") // proxy sigs
    );

    // vars for looping
    ConstitutionEntry memory entry_;
    string memory contractSelectors_;
    string[] memory functionsWithTypes_;
    string[] memory functionNames_;

    // loop over contract names
    for (uint256 i = 0; i < props_.contractNames.length; i++) {
      entry_.contractName = props_.contractNames[i];
      if (entry_.contractName.equals("Proxy")) {
        // skip proxy address
        continue;
      } else {
        // set address from registry
        entry_.contractAddress = _registry.getAddressForStringOrDie(entry_.contractName);
      }

      // load selectors for given contract from file
      contractSelectors_ = _vm.readFile(
        string.concat("./.tmp/selectors/", entry_.contractName, ".json")
      );

      // get function names with types
      functionsWithTypes_ = _vm.parseJsonKeys(contractSelectors_, "");

      // get functions names from constitution for contract
      functionNames_ = _vm.parseJsonKeys(
        files_.constitutionJson,
        string.concat(".", entry_.contractName)
      );

      // loop over function names
      uint256 functionsCount_ = functionNames_.length + props_.proxyNames.length;
      for (uint256 j = 0; j < functionsCount_; j++) {
        if (j < functionNames_.length) {
          // get function from contract implementation
          entry_.functionName = functionNames_[j];
        } else {
          // get function from proxy contract
          entry_.functionName = props_.proxyNames[j - functionNames_.length];
        }

        if (entry_.functionName.equals("default")) {
          // use empty selector as default
          entry_.functionSelector = hex"00000000";
        } else if (j < functionNames_.length) {
          // retrieve selector from contract selectors
          entry_.functionSelector = contractSelectors_.getSelector(
            functionsWithTypes_,
            entry_.functionName,
            _vm
          );
        } else {
          // retrieve selector from proxy selectors
          entry_.functionSelector = files_.proxySelectors.getSelector(
            props_.proxySigs,
            entry_.functionName,
            _vm
          );
        }

        // determine treshold from constitution
        if (j < functionNames_.length) {
          entry_.threshold = files_.constitutionJson.readUint(
            string.concat(".", entry_.contractName, ".", entry_.functionName)
          );
        } else {
          entry_.threshold = files_.constitutionJson.readUint(
            string.concat(".Proxy.", entry_.functionName)
          );
        }

        // push constitution to return array
        _entries.push(
          ConstitutionEntry(
            entry_.contractName,
            entry_.contractAddress,
            entry_.functionName,
            entry_.functionSelector,
            entry_.threshold
          )
        );
      }
    }
  }
}
