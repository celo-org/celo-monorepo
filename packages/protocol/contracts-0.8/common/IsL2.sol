pragma solidity >=0.8.0 <0.8.20;

/**
 * @title Based on predeploy returns whether this is L1 or L2.
 */
contract IsL2Check {
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  modifier onlyL2() {
    revert("This method is not supported in L2 anymore.");
    _;
  }

  function IsL2() public view returns (bool) {
    return address(proxyAdminAddress).code.length > 0;
  }

  function IsL1() public view returns (bool) {
    return !IsL2();
  }
}
