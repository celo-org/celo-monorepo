pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IFeeCurrencyWhitelist.sol";

import "../common/Initializable.sol";

import "../common/interfaces/ICeloVersionedContract.sol";

/**
 * @title Holds a whitelist of the ERC20+ tokens that can be used to pay for gas
 */
contract FeeCurrencyWhitelist is
  IFeeCurrencyWhitelist,
  Ownable,
  Initializable,
  ICeloVersionedContract
{
  address[] public whitelist;
  address[] public nonMentoTokenWhitelist;

  event FeeCurrencyWhitelisted(address token);
  event NonMentoFeeCurrencyWhitelisted(address token);

  event FeeCurrencyWhitelistRemoved(address token);
  event NonMentFeeCurrencyWhitelistRemoved(address token);

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

  function removeNonMentoToken(address tokenAddress, uint256 index, uint256 indexNonMento)
    public
    onlyOwner
  {
    // TODO test me
    removeMentoToken(tokenAddress, index);
    require(nonMentoTokenWhitelist[indexNonMento] == tokenAddress, "Index does not match");
    uint256 length = nonMentoTokenWhitelist.length;
    nonMentoTokenWhitelist[length - 1] = nonMentoTokenWhitelist[indexNonMento]; // TODO fix
    nonMentoTokenWhitelist.pop();
    emit NonMentFeeCurrencyWhitelistRemoved(tokenAddress);
  }

  function removeMentoToken(address tokenAddress, uint256 index) public onlyOwner {
    // TODO test me
    require(whitelist[index] == tokenAddress, "Index does not match");
    uint256 length = whitelist.length;
    whitelist[length - 1] = whitelist[index]; // TODO fix
    whitelist.pop();
    emit FeeCurrencyWhitelistRemoved(tokenAddress);
  }

  /**
   * @dev Add a token to the whitelist
   * @param tokenAddress The address of the token to add.
   */
  function addToken(address tokenAddress) external onlyOwner {
    whitelist.push(tokenAddress);
    emit FeeCurrencyWhitelisted(tokenAddress);
  }

  function getWhitelist() external view returns (address[] memory) {
    return whitelist;
  }

  function getWhitelistNonMento() external view returns (address[] memory) {
    return nonMentoTokenWhitelist;
  }
}
