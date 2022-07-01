pragma solidity 0.5.13;

import { IBreakerBox } from "./interfaces/IBreakerBox.sol";

import { AddressLinkedList, LinkedList } from "../common/linkedlists/AddressLinkedList.sol";
import { UsingRegistry } from "../common/UsingRegistry.sol";
import { Exchange } from "./Exchange.sol";

/**
 * @title   BreakerBox
 * @notice  The BreakerBox stores references to Mento exchanges and breakers.
 *
 */
contract BreakerBox is IBreakerBox, UsingRegistry {
  using AddressLinkedList for LinkedList.List;

  /**
   * @notice Tracks known exchanges and the trading modes they are in.
   */
  mapping(address => TradingModeInfo) public exchangeTradingModes;

  /**
   * @notice List of breakers to be checked.
   */
  LinkedList.List public breakers;

  /**
   * @dev Constructor
   * @param breaker Address of a breaker to be added to the breaker list
   * @param exchanges Exchanges to be added to the mapping of exchange-tradingModes
   */
  constructor(address breaker, address[] memory exchanges) public {
    _transferOwnership(msg.sender);
    addBreaker(breaker);
    addExchanges(exchanges);
  }

  /**
   * @notice Adds a breaker to the end of the list of breakers.
   * @param breaker The address of the breaker to be added.
   */
  function addBreaker(address breaker) public onlyOwner {
    breakers.push(breaker);
    emit BreakerAdded(breaker);
  }

  /**
   * @notice Removes the specified breaker from the list of breakers.
   * @param breaker The address of the breaker to be removed.
   */
  function removeBreaker(address breaker) external onlyOwner {
    breakers.remove(breaker);
    emit BreakerRemoved(breaker);
  }

  /**
   * @notice Adds a breaker to the list of breakers at a specified position.
   * @param breaker The address of the breaker to be added.
   * @param prevBreaker The address of the breaker that should come before the new breaker.
   * @param nextBreaker The address of the breaker that should come after the new breaker.
   */
  function insertBreaker(address breaker, address prevBreaker, address nextBreaker)
    external
    onlyOwner
  {
    breakers.insert(breaker, prevBreaker, nextBreaker);
    emit BreakerAdded(breaker);
  }

  /**
   * @notice Adds an exchange to the mapping of monitored exchanges.
   * @param exchange The address of the exchange to be added.
   */
  function addExchange(address exchange) public onlyOwner {
    require(exchange != address(0), "Exchange address cannot be zero address");

    TradingModeInfo memory info = exchangeTradingModes[exchange];
    require(info.lastUpdated == 0, "Exchange already exists");
    // TODO: Check address is reserve exchange spender?? CUSD exchange is not spender :(
    // require(reserve.isExchangeSpender[spender], "Address is not an exchange");)

    info.tradingMode = 0; // Default trading mode (Bi-directional).
    info.lastUpdated = block.timestamp;
    exchangeTradingModes[exchange] = info;

    emit ExchangeAdded(exchange);
  }

  /**
   * @notice Adds the specified exchanges to the mapping of monitored exchanges.
   * @param exchanges The array of exchange addresses to be added
   */
  function addExchanges(address[] memory exchanges) public onlyOwner {
    for (uint256 i = 0; i < exchanges.length; i++) {
      addExchange(exchanges[i]);
    }
  }

  /**
   * @notice Removes an exchange from the mapping of monitored exchanges.
   * @param exchange The address of the exchange to be removed.
   */
  function removeExchange(address exchange) external onlyOwner {
    require(exchange != address(0), "Exchange address cannot be zero address");

    TradingModeInfo memory info = exchangeTradingModes[exchange];
    require(info.lastUpdated > 0, "Exchange has not been added");

    delete exchangeTradingModes[exchange];

    emit ExchangeRemoved(exchange);
  }
}
