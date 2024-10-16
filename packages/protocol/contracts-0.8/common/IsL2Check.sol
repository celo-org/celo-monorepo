pragma solidity >=0.5.13 <0.8.20;

/**
 * @title Based on predeploy returns whether this is L1 or L2.
 */
contract IsL2Check {
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  /**
   * @notice Throws if called on L2.
   */
  modifier onlyL1() {
    allowOnlyL1();
    _;
  }

  /**
   * @notice Throws if called on L1.
   */
  modifier onlyL2() {
    if (!isL2()) {
      revert("This method is not supported in L1.");
    }
    _;
  }

  /**
   * @notice Checks to see if current network is Celo L2.
   * @return Whether or not the current network is a Celo L2.
   */
  function isL2() internal view returns (bool) {
    uint32 size;
    address _addr = proxyAdminAddress;
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }

  /**
   * @notice Used to restrict usage of the parent function to L1 execution.
   * @dev Reverts if called on a Celo L2 network.
   */
  function allowOnlyL1() internal view {
    if (isL2()) {
      revert("This method is no longer supported in L2.");
    }
  }
}
