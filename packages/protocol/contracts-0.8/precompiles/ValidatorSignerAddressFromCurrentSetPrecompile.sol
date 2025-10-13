// TODO move this to test folder
pragma solidity >=0.8.7 <0.8.20;

// import "forge-std/console.sol";
import "../../contracts/common/interfaces/IRegistry.sol";
import "../../contracts/governance/interfaces/IValidators.sol";

contract ValidatorSignerAddressFromCurrentSetPrecompile {
  address constant ADDRESS = address(0xff - 5);

  uint256 public constant EPOCH_SIZE = 100;

  address[] validators;

  address internal constant registryAddress = 0x000000000000000000000000000000000000ce10;

  receive() external payable {}

  fallback(bytes calldata input) external payable returns (bytes memory) {
    uint256 index = getUint256FromBytes(input, 0);
    return abi.encodePacked(uint256(uint160(validators[index])));
  }

  function getAddress() public pure returns (address) {
    return ADDRESS;
  }

  function getUint256FromBytes(bytes memory bs, uint256 start) internal pure returns (uint256) {
    return uint256(getBytes32FromBytes(bs, start));
  }

  function setValidators() external {
    IRegistry registry = IRegistry(registryAddress);
    address validatorsAddress = registry.getAddressForString("Validators");
    IValidators validatorsContract = IValidators(validatorsAddress);
    address[] memory registeredValidators = validatorsContract.getRegisteredValidators();
    for (uint256 i = 0; i < registeredValidators.length; i++) {
      validators.push(registeredValidators[i]);
    }
  }

  /**
   * @notice Converts bytes to bytes32.
   * @param bs byte[] data
   * @param start offset into byte data to convert
   * @return bytes32 data
   */
  function getBytes32FromBytes(bytes memory bs, uint256 start) internal pure returns (bytes32) {
    require(bs.length >= start + 32, "slicing out of range");
    bytes32 x;
    assembly {
      x := mload(add(bs, add(start, 32)))
    }
    return x;
  }
}
