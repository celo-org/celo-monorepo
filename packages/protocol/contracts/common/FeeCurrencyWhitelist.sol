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
  // it is not enforce that underlyingTokens in the same order as their underlying
  // whitelisted address
  address[] public underlyingTokens;
  mapping(address => address) public adapters;

  event FeeCurrencyWhitelisted(address token);

  event FeeCurrencyWhitelistRemoved(address token);
  event AdaptorSet(address underlyingToken, address adapter);
  event UnderlyinTokenSet(address underlyingToken);
  event UnderlyinTokenRemoved(address underlyingToken);

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
  function setAdaptor(address token, address adaptor) external onlyOwner {
    adapters[token] = adaptor;
    emit AdaptorSet(token, adaptor);
  }

  // TODO make external
  function getAdaptor(address underlyingToken) public view returns(address){
    address result = adapters[underlyingToken];
    return (result != address(0))? result: underlyingToken;
  }

  function setUnderlyinToken(address tokenAddress) external onlyOwner() {
    underlyingTokens.push(tokenAddress);
    emit UnderlyinTokenSet(tokenAddress);
  }

  function getUnderlyingTokens() external view returns(address[] memory){
    return underlyingTokens;
  }

  // TODO when this contracts gets moved to Solidity 0.8 it should
  // return an array of tuples
  // secuence of underlyingtoken and it's corresponding adapter
  function getWhitelistUnderlyngPairs() external view returns(address[] memory){
    uint256 outLenght = underlyingTokens.length*2;
    address[] memory result = new address[](outLenght);

    for (uint256 i=0; i < underlyingTokens.length; i++){
      address underlyingToken = underlyingTokens[i];
      result[i*2] = getAdaptor(underlyingToken);
      result[(i*2)+1] = underlyingToken;
    }
    return result;
  }

  function removeUnderlyinTokens(address tokenAddress, uint256 index) external onlyOwner {
    require(underlyingTokens[index] == tokenAddress, "Index does not match");
    uint256 length = underlyingTokens.length;
    underlyingTokens[index] = underlyingTokens[length - 1];
    underlyingTokens.pop();
    emit UnderlyinTokenRemoved(tokenAddress);
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
