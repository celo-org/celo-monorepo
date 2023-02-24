pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IFeeCurrencyWhitelist.sol";

import "../common/Initializable.sol";

import "../common/interfaces/ICeloVersionedContract.sol";

/**
 * @title Holds a whitelist of the ERC20+ tokens that can be used to pay for gas
 * Not including the native Celo token
 */
contract FeeCurrencyWhitelist is
  IFeeCurrencyWhitelist,
  Ownable,
  Initializable,
  ICeloVersionedContract
{
  // Array of all the tokens enabled
  address[] public whitelist;
  // Array of all the non-Mento tokens enabled
  address[] public nonMentoTokenWhitelist;

  event FeeCurrencyWhitelisted(address token);
  event NonMentoFeeCurrencyWhitelisted(address token);

  event FeeCurrencyWhitelistRemoved(address token);
  event NonMentoFeeCurrencyWhitelistRemoved(address token);

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
   * @dev Add a token to the whitelist
   * @param tokenAddress The address of the token to add.
   */
  function addNonMentoToken(address tokenAddress) external onlyOwner {
    nonMentoTokenWhitelist.push(tokenAddress);
    whitelist.push(tokenAddress);
    emit FeeCurrencyWhitelisted(tokenAddress);
    emit NonMentoFeeCurrencyWhitelisted(tokenAddress);
  }

  /**
   * @notice Adds a non-Mento token as enabled fee currency. Tokens added with 
   * addNonMentoToken should be removed with this function.
   * @param tokenAddress The address of the token to remove.
   * @param index the index of the token in the whitelist array.
   * @param indexNonMento the index of the token in the nonMentoTokenWhitelist array.
   */
  function removeNonMentoToken(address tokenAddress, uint256 index, uint256 indexNonMento)
    public
    onlyOwner
  {
    require(nonMentoTokenWhitelist[indexNonMento] == tokenAddress, "Index does not match");

    removeToken(tokenAddress, index);

    uint256 length = nonMentoTokenWhitelist.length;
    nonMentoTokenWhitelist[indexNonMento] = nonMentoTokenWhitelist[length - 1];
    nonMentoTokenWhitelist.pop();
    emit NonMentoFeeCurrencyWhitelistRemoved(tokenAddress);
  }

  /**
   * @notice Removes a Mento token as enabled fee token. Tokens added with addToken should be 
   * removed with this function.
   * @param tokenAddress The address of the token to remove.
   * @param index The index of the token in the whitelist array.
   */
  function removeToken(address tokenAddress, uint256 index) public onlyOwner {
    require(whitelist[index] == tokenAddress, "Index does not match");
    uint256 length = whitelist.length;
    whitelist[index] = whitelist[length - 1];
    whitelist.pop();
    emit FeeCurrencyWhitelistRemoved(tokenAddress);
  }

  /**
   * @dev Add a Mento token to the whitelist
   * @param tokenAddress The address of the token to add.
   */
  function addToken(address tokenAddress) external onlyOwner {
    whitelist.push(tokenAddress);
    emit FeeCurrencyWhitelisted(tokenAddress);
  }

  /**
   * @return a list of all tokens enabled as gas fee currency
   */
  function getWhitelist() external view returns (address[] memory) {
    return whitelist;
  }

  /**
   * @return a list of all the nonMento tokens enabled as gas fee currency
   */
  function getWhitelistNonMento() external view returns (address[] memory) {
    return nonMentoTokenWhitelist;
  }
}
