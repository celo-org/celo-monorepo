// TODO move this to test folder
pragma solidity >=0.8.7 <0.9;

import "forge-std/console.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/governance/interfaces/IValidators.sol";

contract NumberValidatorsInCurrentSetPrecompile {
  address constant ADDRESS = address(0xff - 6);

  uint256 public NumberOfValidators = 1;

  address internal constant registryAddress = 0x000000000000000000000000000000000000ce10;

  receive() external payable {}

  fallback(bytes calldata) external payable returns (bytes memory) {
    return abi.encodePacked(NumberOfValidators);
  }

  function setNumberOfValidators() external {
    IRegistry registry = IRegistry(registryAddress);
    address validatorsAddress = registry.getAddressForString("Validators");
    IValidators validatorsContract = IValidators(validatorsAddress);
    address[] memory registeredValidators = validatorsContract.getRegisteredValidators();
    NumberOfValidators = registeredValidators.length;
  }

  function getAddress() public pure returns (address) {
    return ADDRESS;
  }
}
