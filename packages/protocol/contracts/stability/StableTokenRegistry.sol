pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/Initializable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/interfaces/IRegistry.sol";

/**
 * @title contract that lists what stable coins are deployed as part of Celo's Stability protocol.
 */
contract StableTokenRegistry is Initializable, Ownable {
  using SafeMath for uint256;
  mapping(string => string) public stableTokens;
  string[] public fiatTickers;

  IRegistry public registry;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param existingFiatTickers Collection of fiat currencies issued already.
   * @param existingStableTokenContractNames Collection of stable token smart contract names.
   */
  function initialize(
    string[] calldata existingFiatTickers,
    string[] calldata existingStableTokenContractNames
  ) external initializer {
    _transferOwnership(msg.sender);
    require(
      existingFiatTickers.length == existingStableTokenContractNames.length,
      "Array length mismatch"
    );
    for (uint256 i = 0; i < existingFiatTickers.length; i++) {
      stableTokens[fiatTickers[i]] = existingFiatTickers[i];
    }
  }

  /**
   * @notice Returns fiat currencies that have been issued.
   * @return A collection of currencies issued.
   */
  function getFiatTickers() external view returns (string[] memory) {
    return fiatTickers;
  }

  /**
   * @notice Returns all the contract instances created.
   * @return collection of stable token contracts.
   */
  function getContractInstances() external view returns (string[] memory) {
    string[] memory contracts;
    for (uint256 i = 0; i < fiatTickers.length; i++) {
      contracts[i] = stableTokens[fiatTickers[i]];
    }
    return contracts;
  }

  /**
   * @notice Removes unwamted token instances.
   * @param fiatTicker The type of currency that is no longer supported.
   * @param index The index in fiatTickers of fiatTicker.
   */
  function removeStableToken(string calldata fiatTicker, uint256 index) external onlyOwner {
    stableTokens[fiatTicker] = "";
    uint256 numFiats = fiatTickers.length;
    require(index < numFiats, "Index is invalid");
    require(
      keccak256(bytes(fiatTicker)) == keccak256(bytes(fiatTickers[index])),
      "Index does not match fiatTicker"
    );
    uint256 newNumFiats = numFiats.sub(1);

    if (index != newNumFiats) {
      fiatTickers[index] = fiatTickers[newNumFiats];
    }
    fiatTickers[newNumFiats] = "";
    fiatTickers.length = newNumFiats;
  }

  /**
   * @notice Gives an address permission to spend Reserve without limit.
   * @param fiatTicker The address that is allowed to spend Reserve funds.
   */
  function addNewStableToken(string calldata fiatTicker, string calldata stableTokenContractName)
    external
    onlyOwner
  {
    registry.getAddressForOrDie(keccak256(abi.encodePacked(stableTokenContractName)));
    require(bytes(fiatTicker).length != 0, "fiatTicker cant be an empty string");
    require(
      bytes(stableTokenContractName).length != 0,
      "stableTokenContractName cant be an empty string"
    );
    require(bytes(stableTokens[fiatTicker]).length != 0, "This registry already exists");
    stableTokens[fiatTicker] = stableTokenContractName;
    fiatTickers.push(fiatTicker);
  }

}
