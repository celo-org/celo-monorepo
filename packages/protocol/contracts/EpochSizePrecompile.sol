// TODO move this to test folder
pragma solidity >=0.8.7 <0.8.20;


contract EpochSizePrecompile {
  address constant _address = address(0xff - 7);

  uint256 public constant epochSize = 17280;

  function getAddress() external returns (address){
    return _address;
  }

  fallback (bytes calldata) external payable returns (bytes memory) {
    return abi.encodePacked(epochSize);
  }
  //   bytes memory returnData = abi.encode(epochSize);
  //       assembly {
  //           let rds := mload(returnData)
  //           return(add(returnData, 0x20), rds)
  //       }

}