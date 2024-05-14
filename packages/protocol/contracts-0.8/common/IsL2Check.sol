pragma solidity >=0.5.13 <0.8.20;

/**
 * @title Based on predeploy returns whether this is L1 or L2.
 */
contract IsL2Check {
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  modifier onlyL1() {
    if (isL2()) {
      revert("This method is no longer supported in L2.");
    }
    _;
  }
  modifier onlyL2() {
    if (isL1()) {
      revert("This method is not supported in L1.");
    }
    _;
  }

  function isL2() public view returns (bool) {
    return isContract(proxyAdminAddress);
  }

  function isL1() public view returns (bool) {
    return !isL2();
  }

  function isContract(address _addr) private view returns (bool) {
    uint32 size;
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }
}
