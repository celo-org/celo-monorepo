pragma solidity >=0.5.13 <0.8.20;

/**
 * @title Based on predeploy returns whether this is L1 or L2.
 */
contract IsL2Check {
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  modifier onlyL1() {
    if (isL2()) {
      revert("This method is not supported in L2 anymore.");
    }
    _;
  }

  function allowOnlyL1() view internal {
    if (isL2()) {
      revert("This method is not supported in L2 anymore.");
    }
  }

  function isL2() public view returns (bool) {
    return isContract(proxyAdminAddress);
  }

  function isContract(address _addr) private view returns (bool) {
    uint32 size;
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }
}
