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
  // it is not enforce that underlyingTokens in the same order as their respective
  // whitelisted address
  address[] public underlyingTokens;
  mapping(address => address) public adapters;

  event FeeCurrencyWhitelisted(address token);

  event FeeCurrencyWhitelistRemoved(address token);
  event AdapterSet(address underlyingToken, address adapter);
  event UnderlyingTokenSet(address underlyingToken);
  event UnderlyingTokenRemoved(address underlyingToken);

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
    return (1, 1, 2, 0);
  }

  // removed with address zero
  function setAdapter(address token, address adapter) external onlyOwner {
    adapters[token] = adapter;
    emit AdapterSet(token, adapter);
  }

  // TODO make external
  function getAdapter(address underlyingToken) public view returns (address) {
    address result = adapters[underlyingToken];
    return (result != address(0)) ? result : underlyingToken;
  }

  function removeAdapter(address token) external onlyOwner {
    delete adapters[token];
    emit AdapterSet(token, address(0));
  }

  function setUnderlyingToken(address tokenAddress) external onlyOwner() {
    underlyingTokens.push(tokenAddress);
    emit UnderlyingTokenSet(tokenAddress);
  }

  function getUnderlyingTokens() external view returns (address[] memory) {
    return underlyingTokens;
  }

  // TODO when this contracts gets moved to Solidity 0.8 it should
  // return an array of tuples
  // sequence of underlying token and it's corresponding adapter
  function getWhitelistUnderlingPairs() external view returns (address[] memory, address[] memory) {
    uint256 length = underlyingTokens.length;
    address[] memory tokensRes = new address[](length);
    address[] memory adaptersRes = new address[](length);

    for (uint256 i = 0; i < underlyingTokens.length; i++) {
      address underlyingToken = underlyingTokens[i];
      tokensRes[i] = underlyingToken;
      adaptersRes[i] = getAdapter(underlyingToken);
    }
    return (tokensRes, adaptersRes);
  }

  function removeUnderlyingTokens(address tokenAddress, uint256 index) external onlyOwner {
    require(underlyingTokens[index] == tokenAddress, "Index does not match");
    uint256 length = underlyingTokens.length;
    underlyingTokens[index] = underlyingTokens[length - 1];
    underlyingTokens.pop();
    emit UnderlyingTokenRemoved(tokenAddress);
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
   * @dev Add a token to the whitelist
   * @param tokenAddress The address of the token to add.
   */
  function addToken(address tokenAddress) external onlyOwner {
    whitelist.push(tokenAddress);
    emit FeeCurrencyWhitelisted(tokenAddress);
  }

  /**
   * @return a list of all tokens enabled as gas fee currency.
   */
  function getWhitelist() external view returns (address[] memory) {
    return whitelist;
  }
}
