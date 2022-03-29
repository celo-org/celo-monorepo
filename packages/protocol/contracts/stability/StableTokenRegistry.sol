pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/Initializable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/interfaces/IRegistry.sol";

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
   * @param existingFiatTickers Collection of fiat currencies issued already.
   * @param existingStableTokenContractNames Collection of stable token smart contract names.
   */
  function initialize(
    bytes32[] calldata existingFiatTickers,
    bytes32[] calldata existingStableTokenContractNames
  ) external initializer {
    require(
      existingFiatTickers.length == existingStableTokenContractNames.length,
      "Array length mismatch"
    );
    _transferOwnership(msg.sender);
    for (uint256 i = 0; i < existingFiatTickers.length; i++) {
      addNewStableToken(
        abi.encodePacked(existingFiatTickers[i]),
        abi.encodePacked(existingStableTokenContractNames[i])
      );
    }
  }

  /**
   * @notice Returns all the contract instances created.
   * @return collection of stable token contracts.
   */
  function getContractInstances() external view returns (bytes memory, uint256[] memory) {
    bytes[] memory contracts;
    uint256 totalLength = 0;
    for (uint256 i = 0; i < fiatTickers.length; i++) {
      contracts[i] = stableTokens[fiatTickers[i]];
      totalLength += stableTokens[fiatTickers[i]].length;
    }
    uint256 numOfContracts = contracts.length;
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
    require(
      keccak256(fiatTicker) == keccak256(fiatTickers[index]),
      "Source fiatTicker does not match the one in the storage on given index"
    );
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
    require(bytes(fiatTicker).length != 0, "fiatTicker cant be an empty string");
    require(
      bytes(stableTokenContractName).length != 0,
      "stableTokenContractName cant be an empty string"
    );
    require(stableTokens[fiatTicker].length == 0, "This registry already exists");
    stableTokens[fiatTicker] = stableTokenContractName;
    fiatTickers.push(fiatTicker);
  }
}
