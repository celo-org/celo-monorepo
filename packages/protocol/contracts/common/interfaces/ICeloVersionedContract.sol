pragma solidity ^0.5.13;

interface ICeloVersionedContract {
  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
    * @return storage Storage version of the contract.
    * @return major Major version of the contract.
    * @return minor Minor version of the contract.
    * @return patch Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);
}
