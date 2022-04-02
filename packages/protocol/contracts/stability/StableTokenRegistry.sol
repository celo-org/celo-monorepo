pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/Initializable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/interfaces/IRegistry.sol";
import "../common/UsingRegistry.sol";

/**
 * @title contract that lists what stable coins are deployed as part of Celo's Stability protocol.
 */
contract StableTokenRegistry is Initializable, Ownable {
  using SafeMath for uint256;
  mapping(bytes => bytes) public stableTokens;
  bytes[] public fiatTickers;

  IRegistry public registry;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param fiatTicker Collection of fiat currencies issued already.
   * @param stableTokenContractName Collection of stable token smart contract names.
   */
  function initialize(bytes calldata fiatTicker, bytes calldata stableTokenContractName)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    addNewStableToken(bytes("USD"), bytes("StableToken"));
    addNewStableToken(bytes("EUR"), bytes("StableTokenEUR"));
    addNewStableToken(bytes("BRL"), bytes("StableTokenBRL"));
    addNewStableToken(fiatTicker, stableTokenContractName);
  }

  /**
   * @notice Returns all the contract instances created.
   * @return collection of stable token contracts.
   */
  function getContractInstances() external view returns (bytes memory, uint256[] memory) {
    // bytes[] memory contracts;
    uint256 totalLength = 0;
    for (uint256 i = 0; i < fiatTickers.length; i++) {
      totalLength += stableTokens[fiatTickers[i]].length;
    }
    uint256 numOfContracts = fiatTickers.length;
    bytes memory concatenated = new bytes(totalLength);
    uint256 lastIndex = 0;
    uint256[] memory lengths = new uint256[](numOfContracts);
    for (uint256 i = 0; i < numOfContracts; i++) {
      bytes storage contractName = stableTokens[fiatTickers[i]];
      lengths[i] = contractName.length;
      for (uint256 j = 0; j < lengths[i]; j++) {
        concatenated[lastIndex] = contractName[j];
        lastIndex++;
      }
    }
    return (concatenated, lengths);
  }

  /**
   * @notice Removes unwamted token instances.
   * @param fiatTicker The currency that is no longer supported.
   * @param index The index in fiatTickers of fiatTicker.
   */
  function removeStableToken(bytes calldata fiatTicker, uint256 index) external onlyOwner {
    delete stableTokens[fiatTicker];
    uint256 numFiats = fiatTickers.length;
    require(index < numFiats, "Index is invalid");
    for (uint256 i = 0; i < fiatTicker.length; i++) {
      if (fiatTicker[i] != 0) {
        require(
          fiatTicker[i] == fiatTickers[index][i],
          "source doesn't match the existing fiatTicker"
        );
      }
    }
    uint256 newNumFiats = numFiats.sub(1);

    if (index != newNumFiats) {
      fiatTickers[index] = fiatTickers[newNumFiats];
    }
    delete fiatTickers[newNumFiats];
    fiatTickers.length = newNumFiats;
  }

  /**
   * @notice Adds new Fiat Ticker and Stable Token contract to the registry.
   * @param fiatTicker The currency we are trying to add in the registry.
   * @param stableTokenContractName The contract we are trying to add in the registry.
   */
  function addNewStableToken(bytes memory fiatTicker, bytes memory stableTokenContractName)
    public
    onlyOwner
  {
    // registry.getAddressForOrDie(keccak256(abi.encodePacked(stableTokenContractName)));
    require(fiatTicker.length != 0, "fiatTicker cant be an empty string");
    require(stableTokenContractName.length != 0, "stableTokenContractName cant be an empty string");
    require(stableTokens[fiatTicker].length == 0, "This registry already exists");
    stableTokens[fiatTicker] = stableTokenContractName;
    fiatTickers.push(fiatTicker);
  }

  /**
   * @notice Queries a corresponding StableToken contract name based on fiat ticker.
   * @param fiatTicker Type of currency to query corresponding contract.
   */
  function queryStableTokenContractNames(bytes memory fiatTicker) public returns (bytes memory) {
    return stableTokens[fiatTicker];
  }
}
