pragma solidity ^0.5.3;

/**
 * @title Library with support functions to deal with addresses
 */
library AddressesHelper {

  /**
   * @dev isContract detect whether the address is 
   *      a contract address or externally owned account (EOA)
   * WARNING: Calling this function from a constructor will return false
   *          independently if the address given as parameter is a contract or EOA
   * @return true if it is a contract address
   */
  function isContract(address addr) internal view returns (bool) {
    uint256 size;
    /* solium-disable-next-line security/no-inline-assembly */
    assembly { size := extcodesize(addr) }
    return size > 0;
  }
}
