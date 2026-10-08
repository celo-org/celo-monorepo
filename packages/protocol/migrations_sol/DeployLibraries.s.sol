pragma solidity >=0.8.7 <0.8.20;

import { Script } from "forge-std-8/Script.sol";
import { console } from "forge-std/console.sol";

/**
 * Deploys the linked libraries on a live chain, in the order given by LIBRARY_ARTIFACTS.
 * Replaces `forge create --unlocked` from deploy_libraries.sh: the deployer key comes from the
 * environment, and the bytecode from the isolated library build in .tmp/libraries.
 */
contract DeployLibraries is Script {
  function run() external {
    string[] memory artifacts = vm.envString("LIBRARY_ARTIFACTS", ",");
    vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));
    for (uint256 i = 0; i < artifacts.length; i++) {
      bytes memory code = vm.getCode(artifacts[i]);
      address lib;
      assembly {
        lib := create(0, add(code, 0x20), mload(code))
      }
      require(lib != address(0), "library deployment failed");
      console.log("LIBRARY", artifacts[i], lib);
    }
    vm.stopBroadcast();
  }
}
