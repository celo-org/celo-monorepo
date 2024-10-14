pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IFeeCurrencyWhitelist.sol";
import "../common/Initializable.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../../contracts-0.8/common/IsL2Check.sol";

/**
 * @title Holds a whitelist of the ERC20+ tokens that can be used to pay for gas
 * Not including the native Celo token
 */
contract FeeCurrencyWhitelist is
  IFeeCurrencyWhitelist,
  Ownable,
  Initializable,
  ICeloVersionedContract,
  IsL2Check
{
  // Array of all the tokens enabled
  address[] private deprecated_whitelist;

  event FeeCurrencyWhitelisted(address token);

  event FeeCurrencyWhitelistRemoved(address token);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @dev Add a token to the whitelist
   * @param tokenAddress The address of the token to add.
   */
  function addToken(address tokenAddress) external onlyOwner {
    deprecated_whitelist.push(tokenAddress);
    emit FeeCurrencyWhitelisted(tokenAddress);
  }

  /**
   * @return a list of all tokens enabled as gas fee currency.
   */
  function getWhitelist() external view returns (address[] memory) {
    return deprecated_whitelist;
  }

  /**
   * @notice Gets the whitelist item at the specified index.
   * @return Address of a token in the whitelist.
   * @dev Once Celo becomes an L2, use the FeeCurrencyDirectory contract
   * instead.
   */
  function whitelist(uint256 index) external view onlyL1 returns (address) {
    return deprecated_whitelist[index];
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 0);
  }

  /**
   * @notice Removes a Mento token as enabled fee token. Tokens added with addToken should be
   * removed with this function.
   * @param tokenAddress The address of the token to remove.
   * @param index The index of the token in the whitelist array.
   */
  function removeToken(address tokenAddress, uint256 index) public onlyOwner {
    require(deprecated_whitelist[index] == tokenAddress, "Index does not match");
    uint256 length = deprecated_whitelist.length;
    deprecated_whitelist[index] = deprecated_whitelist[length - 1];
    deprecated_whitelist.pop();
    emit FeeCurrencyWhitelistRemoved(tokenAddress);
  }
}
