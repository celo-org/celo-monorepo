pragma solidity ^0.5.13;

/**
 * @title contract that lists what stable coins are deployed as part of Celo's Stability protocol.
 */
contract StableTokenRegistry {
  mapping(string => string) public stableTokens;
  string[] public fiatTickers;
  string[] public contracts;

  /**
  * @notice Sets initialized == true on implementation contracts
  * @param test Set to true to skip implementation initialization
  */
  constructor(bool test) public Initializable(test) {}
  /**
  * @notice adds fiat currencies to fiatTickers collection
  * @param currencyType the type of currency we're trying to push into the collection  
  */
  function addFiatTickers(string _currencyType) external onlyOwner {
    //also check if it already exists in the array, if it does then don't add
    //so I can make sure there are no dublicates
    require(!stableTokens[currencyType], "Stable token hasn't been issued");
    stableTokens[currencyType] = true;
    fiatTickers.push(currencyType);
  }

  /**
   * @notice Returns fiat currencies that have been issued.
   * @return A collection of currencies issued.
   */
  function getFiatTickers() external view returns (string[] memory) {
    return fiatTickers;
  }

  /**
   * @notice Returns contracts that have been issued.
   * @return A collection of contracts issued.
   */
  function getContracts() external view returns (string[] memory) {
    return contracts;
  }

  /**
   * @notice Returns queried stable contract.
   * @return stable contract.
   */
  function queryContractByFiatType(string _fiatTicker) public view returns (string) {
    return stableTokens[_fiatTicker];
  }
}
