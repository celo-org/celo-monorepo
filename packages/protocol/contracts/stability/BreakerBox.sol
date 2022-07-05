pragma solidity ^0.5.13;

import { IBreakerBox } from "./interfaces/IBreakerBox.sol";
import { IBreaker } from "./interfaces/IBreaker.sol";

import { AddressLinkedList, LinkedList } from "../common/linkedlists/AddressLinkedList.sol";
import { UsingRegistry } from "../common/UsingRegistry.sol";
import { Exchange } from "./Exchange.sol";

/**
 * @title   BreakerBox
 * @notice  The BreakerBox stores references to Mento exchanges and breakers.
 */
contract BreakerBox is IBreakerBox, UsingRegistry {
  using AddressLinkedList for LinkedList.List;

  /* ==================== State Variables ==================== */

  mapping(address => TradingModeInfo) public exchangeTradingModes; // Maps exchange address to its current trading mode info
  mapping(uint256 => address) public tradingModeBreaker; // Maps a trading mode to a breaker
  LinkedList.List private breakers; // Ordered list of breakers to be checked.

  /* ==================== Constructor ==================== */

  /**
   * @param breaker Address of a breaker to be added to the breaker list
   * @param exchanges Exchanges to be added to the mapping of exchange-tradingModes
   */
  constructor(IBreaker breaker, address[] memory exchanges) public {
    _transferOwnership(msg.sender);
    addBreaker(breaker);
    addExchanges(exchanges);
  }

  /* ==================== Restricted Functions ==================== */

  /* ---------- Breakers ---------- */

  /**
   * @notice Adds a breaker to the end of the list of breakers & the tradingMode-Breaker mapping.
   * @param breaker The address of the breaker to be added.
   */
  function addBreaker(IBreaker breaker) public onlyOwner {
    require(
      tradingModeBreaker[breaker.getTradingMode()] == address(0),
      "There is already a breaker added with the same trading mode"
    );
    require(!isBreaker(address(breaker)), "This breaker has already been added");

    tradingModeBreaker[breaker.getTradingMode()] = address(breaker);
    breakers.push(address(breaker));
    emit BreakerAdded(address(breaker));
  }

  /**
   * @notice Removes the specified breaker from the list of breakers.
   * @param breaker The address of the breaker to be removed.
   */
  function removeBreaker(IBreaker breaker) external onlyOwner {
    require(isBreaker(address(breaker)), "This breaker has not been added");

    uint256 tradingMode = breaker.getTradingMode();
    require(
      tradingModeBreaker[tradingMode] == address(breaker),
      "This breaker does not match stored trading mode"
    );

    // TODO: Check if any exchanges are using breaker

    delete tradingModeBreaker[tradingMode];
    breakers.remove(address(breaker));
    emit BreakerRemoved(address(breaker));
  }

  /**
   * @notice Adds a breaker to the list of breakers at a specified position.
   * @param breaker The address of the breaker to be added.
   * @param prevBreaker The address of the breaker that should come before the new breaker.
   * @param nextBreaker The address of the breaker that should come after the new breaker.
   */
  function insertBreaker(IBreaker breaker, address prevBreaker, address nextBreaker)
    external
    onlyOwner
  {
    require(!isBreaker(address(breaker)), "This breaker has already been added");
    require(
      tradingModeBreaker[breaker.getTradingMode()] == address(0),
      "There is already a breaker added with the same trading mode"
    );

    tradingModeBreaker[breaker.getTradingMode()] = address(breaker);
    breakers.insert(address(breaker), prevBreaker, nextBreaker);
    emit BreakerAdded(address(breaker));
  }

  /* ---------- Exchanges ---------- */

  /**
   * @notice Adds an exchange to the mapping of monitored exchanges.
   * @param exchange The address of the exchange to be added.
   */
  function addExchange(address exchange) public onlyOwner {
    require(exchange != address(0), "Exchange address cannot be zero address");

    TradingModeInfo memory info = exchangeTradingModes[exchange];
    require(info.lastUpdatedTime == 0, "Exchange already exists");
    // TODO: Check address is reserve exchange spender?? CUSD exchange is not spender :(
    // require(reserve.isExchangeSpender[spender], "Address is not an exchange");)

    info.tradingMode = 0; // Default trading mode (Bi-directional).
    info.lastUpdatedTime = block.timestamp;
    info.lastUpdatedBlock = block.number;
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
    delete exchangeTradingModes[exchange];
    emit ExchangeRemoved(exchange);
  }

  /**
   * @notice Sets the trading mode for the specified exchange.
   * @param exchange The address of the exchange.
   * @param tradingMode The trading mode that should be set.
   */
  function setExchangeTradingMode(address exchange, uint256 tradingMode) external onlyOwner {
    require(exchange != address(0), "Exchange address cannot be zero address");
    require(
      tradingMode == 0 || tradingModeBreaker[tradingMode] != address(0),
      "Trading mode must be default or have a breaker set"
    );

    TradingModeInfo memory info = exchangeTradingModes[exchange];
    require(info.lastUpdatedTime > 0, "Exchange has not been added");

    info.tradingMode = 0;
    info.lastUpdatedTime = block.timestamp;
    info.lastUpdatedBlock = block.number;
    exchangeTradingModes[exchange] = info;

    //TODO: log

  }

  /* ==================== View Functions ==================== */

  /**
   * @notice Returns an array of breaker addresses from start to end.
   * @return An ordered list of breakers.
   */
  function getBreakers() external view returns (address[] memory) {
    return breakers.getKeys();
  }

  /**
   * @notice Checks whether a breaker with the specifed address has been added.
   */
  function isBreaker(address breaker) public view returns (bool) {
    return breakers.contains(breaker);
  }

  /* ==================== Check Breakers ==================== */

  /**
   * @notice Checks breakers for a specified exchange to determine the trading mode. If an exchange
   * @param exchangeAddress The address of the exchange to run the checks for.
   * @return currentTradingMode Returns an int representing the current trading mode for the specified exchange.
   */
  function checkBreakers(address exchangeAddress) external returns (uint256 currentTradingMode) {
    require(exchangeAddress != address(0), "Exchange address cannot be zero address");

    TradingModeInfo memory info = exchangeTradingModes[exchangeAddress];
    require(info.lastUpdatedTime > 0, "Exchange has not been added to BreakerBox"); //Last updated should always have a value.

    // Skip check if last check was in the same block
    if (info.lastUpdatedBlock == block.number) {
      return info.tradingMode;
    }

    // Check if a breaker has non default trading mode & try to reset
    if (info.tradingMode != 0) {
      IBreaker breaker = IBreaker(tradingModeBreaker[info.tradingMode]);
      bool tryReset = (breaker.getCooldown() + info.lastUpdatedTime) >= block.timestamp;
      if (tryReset) {
        bool canReset = breaker.shouldReset(exchangeAddress);
        if (canReset) {
          info.tradingMode = 0;
          info.lastUpdatedTime = block.timestamp;
          info.lastUpdatedBlock = block.number;
          exchangeTradingModes[exchangeAddress] = info;
          return info.tradingMode;
        } else {
          return info.tradingMode; // Exchange cannot be reset
        }
      } else {
        return info.tradingMode; // Cooldown time has not passed
      }
    }

    address[] memory _breakers = breakers.getKeys();

    // Check all breakers
    for (uint256 i = 0; i < _breakers.length; ++i) {
      IBreaker breaker = IBreaker(_breakers[i]);
      bool tripBreaker = breaker.shouldTrigger(exchangeAddress);
      if (tripBreaker) {
        info.tradingMode = breaker.getTradingMode();
        info.lastUpdatedTime = block.timestamp;
        info.lastUpdatedBlock = block.number;
        exchangeTradingModes[exchangeAddress] = info;
        return info.tradingMode;
      }
    }

    return info.tradingMode;
  }
}
