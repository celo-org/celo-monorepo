pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/Initializable.sol";

/**
 * @title Contract for storing blockchain parameters that can be set by governance.
 */
contract BlockchainParams is Ownable, Initializable {

  string public minimumClientVersion;

  event MinimumClientVersionSet(string minimumClientVersion);

  /**
   * @notice Initializes critical variables.
   * @param _minimumClientVersion Minimum client version that can be used in the chain.
   */
  function initialize(string calldata _minimumClientVersion) external initializer {
    _transferOwnership(msg.sender);
    setMinimumClientVersion(_minimumClientVersion);
  }

  /**
   * @notice Sets the minimum client version.
   * @param _minimumClientVersion Minimum client version that can be used in the chain.
   */
  function setMinimumClientVersion(string memory _minimumClientVersion) public onlyOwner {
    require(bytes(_minimumClientVersion).length > 0, "Minimum client version cannot be empty string");
    minimumClientVersion = _minimumClientVersion;
    emit MinimumClientVersionSet(_minimumClientVersion);
  }

}
