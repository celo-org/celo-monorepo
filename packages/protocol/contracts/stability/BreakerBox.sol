pragma solidity ^0.5.13;

import { IBreakerBox } from "./interfaces/IBreakerBox.sol";
import { IBreaker } from "./interfaces/IBreaker.sol";
import { IReserve } from "./interfaces/IReserve.sol";

import { AddressLinkedList, LinkedList } from "../common/linkedlists/AddressLinkedList.sol";
import { UsingRegistry } from "../common/UsingRegistry.sol";
import { Initializable } from "../common/Initializable.sol";
import { Exchange } from "./Exchange.sol";

/**
 * @title   BreakerBox
 * @notice  The BreakerBox stores references to Mento exchanges and breakers.
 */
contract BreakerBox is IBreakerBox, Initializable, UsingRegistry {
  using AddressLinkedList for LinkedList.List;

  /* ==================== State Variables ==================== */

  address[] public exchanges;
  mapping(address => TradingModeInfo) public exchangeTradingModes; // Maps exchange address to its current trading mode info
  mapping(uint256 => address) public tradingModeBreaker; // Maps a trading mode to a breaker
  mapping(address => uint256) public breakerTradingMode; // Maps a breaker to a trading mode
  LinkedList.List private breakers; // Ordered list of breakers to be checked.

  modifier validateBreaker(address breaker, uint256 tradingMode) {
    require(!isBreaker(breaker), "This breaker has already been added");
    require(
      tradingModeBreaker[tradingMode] == address(0),
      "There is already a breaker added with the same trading mode"
    );
    require(tradingMode != 0, "The default trading mode can not have a breaker");
    _;
  }

  /* ==================== Constructor ==================== */

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @param breaker Address of a breaker to be added to the breaker list
   * @param _exchanges Exchanges to be added to the mapping of exchange-tradingModes
   * @param registryAddress The address of the registry contract
   */
  function initilize(
    address breaker,
    uint256 tradingMode,
    address[] calldata _exchanges,
    address registryAddress
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    addBreaker(breaker, tradingMode);
    addExchanges(_exchanges);
  }

  /* ==================== Restricted Functions ==================== */

  /* ---------- Breakers ---------- */

  /**
   * @notice Adds a breaker to the end of the list of breakers & the tradingMode-Breaker mapping.
   * @param breaker The address of the breaker to be added.
   * @param tradingMode The trading mode of the breaker to be added.
   */
  function addBreaker(address breaker, uint256 tradingMode)
    public
    onlyOwner
    validateBreaker(breaker, tradingMode)
  {
    tradingModeBreaker[tradingMode] = breaker;
    breakerTradingMode[breaker] = tradingMode;
    breakers.push(breaker);
    emit BreakerAdded(breaker);
  }

  /**
   * @notice Adds a breaker to the list of breakers at a specified position.
   * @param breaker The address of the breaker to be added.
   * @param tradingMode The trading mode of the breaker to be added.
   * @param prevBreaker The address of the breaker that should come before the new breaker.
   * @param nextBreaker The address of the breaker that should come after the new breaker.
   */
  function insertBreaker(
    address breaker,
    uint256 tradingMode,
    address prevBreaker,
    address nextBreaker
  ) external onlyOwner validateBreaker(breaker, tradingMode) {
    tradingModeBreaker[tradingMode] = breaker;
    breakerTradingMode[breaker] = tradingMode;
    breakers.insert(breaker, prevBreaker, nextBreaker);
    emit BreakerAdded(breaker);
  }

  /**
   * @notice Removes the specified breaker from the list of breakers.
   * @param breaker The address of the breaker to be removed.
   * @dev Will set any exchange using this breakers trading mode to the default trading mode
   */
  function removeBreaker(address breaker) external onlyOwner {
    require(isBreaker(breaker), "This breaker has not been added");

    uint256 tradingMode = breakerTradingMode[breaker];

    // Set any exchanges using this breakers trading mode to the default mode
    address[] memory activeExchanges = exchanges;
    TradingModeInfo memory tradingModeInfo;

    for (uint256 i = 0; i < activeExchanges.length; ++i) {
      tradingModeInfo = exchangeTradingModes[activeExchanges[i]];
      if (tradingModeInfo.tradingMode == tradingMode) {
        setExchangeTradingMode(activeExchanges[i], 0);
      }
    }

    delete tradingModeBreaker[tradingMode];
    delete breakerTradingMode[breaker];
    breakers.remove(breaker);

    emit BreakerRemoved(breaker);
  }

  /* ---------- Exchanges ---------- */

  /**
   * @notice Adds an exchange to the mapping of monitored exchanges.
   * @param exchange The address of the exchange to be added.
   */
  function addExchange(address exchange) public onlyOwner {
    TradingModeInfo memory info = exchangeTradingModes[exchange];
    require(info.lastUpdatedTime == 0, "Exchange has already been added");

    IReserve reserve = IReserve(registry.getAddressForOrDie(RESERVE_REGISTRY_ID));
    require(
      reserve.isExchangeSpender(exchange) ||
        registry.getAddressForOrDie(EXCHANGE_REGISTRY_ID) == exchange,
      "Exchange is not a reserve spender"
    );

    info.tradingMode = 0; // Default trading mode (Bi-directional).
    info.lastUpdatedTime = block.timestamp;
    info.lastUpdatedBlock = block.number;
    exchangeTradingModes[exchange] = info;
    exchanges.push(exchange);

    emit ExchangeAdded(exchange);
  }

  /**
   * @notice Adds the specified exchanges to the mapping of monitored exchanges.
   * @param newExchanges The array of exchange addresses to be added
   */
  function addExchanges(address[] memory newExchanges) public onlyOwner {
    for (uint256 i = 0; i < newExchanges.length; i++) {
      addExchange(newExchanges[i]);
    }
  }

  /**
   * @notice Removes an exchange from the mapping of monitored exchanges.
   * @param exchange The address of the exchange to be removed.
   */
  function removeExchange(address exchange) external onlyOwner {
    uint256 exchangeIndex;
    for (uint256 i = 0; i < exchanges.length; ++i) {
      if (exchanges[i] == exchange) {
        exchangeIndex = i;
        break;
      }
    }

    require(exchanges[exchangeIndex] == exchange, "Exchange has not been added");

    uint256 lastIndex = exchanges.length - 1;
    if (exchangeIndex != lastIndex) {
      exchanges[exchangeIndex] = exchanges[lastIndex];
    }

    exchanges.pop();

    delete exchangeTradingModes[exchange];
    emit ExchangeRemoved(exchange);
  }

  /**
   * @notice Sets the trading mode for the specified exchange.
   * @param exchange The address of the exchange.
   * @param tradingMode The trading mode that should be set.
   */
  function setExchangeTradingMode(address exchange, uint256 tradingMode) public onlyOwner {
    require(
      tradingMode == 0 || tradingModeBreaker[tradingMode] != address(0),
      "Trading mode must be default or have a breaker set"
    );

    TradingModeInfo memory info = exchangeTradingModes[exchange];
    require(info.lastUpdatedTime > 0, "Exchange has not been added");

    info.tradingMode = tradingMode;
    info.lastUpdatedTime = block.timestamp;
    info.lastUpdatedBlock = block.number;
    exchangeTradingModes[exchange] = info;

    emit TradingModeUpdated(exchange, tradingMode);
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

  /**
   * @notice Returns addresses of exchanges that have been added.
   */
  function getExchanges() external view returns (address[] memory) {
    return exchanges;
  }

  /* ==================== Check Breakers ==================== */

  /**
   * @notice Checks breakers for a specified exchange to determine the trading mode. If an exchange
   * @param exchangeAddress The address of the exchange to run the checks for.
   * @return currentTradingMode Returns an int representing the current trading mode for the specified exchange.
   */
  function checkBreakers(address exchangeAddress) external returns (uint256 currentTradingMode) {
    TradingModeInfo memory info = exchangeTradingModes[exchangeAddress];

    // Last updated should always have a value gt 0, if it doesn't we can assume this exchange has not been added.
    if (info.lastUpdatedTime == 0) {
      return 0;
    }

    // Check if a breaker has non default trading mode & try to reset
    if (info.tradingMode != 0) {
      IBreaker breaker = IBreaker(tradingModeBreaker[info.tradingMode]);

      uint256 cooldown = breaker.getCooldown();
      bool tryReset = ((cooldown > 0) && (cooldown + info.lastUpdatedTime) <= block.timestamp);

      if (tryReset) {
        bool canReset = breaker.shouldReset(exchangeAddress);
        if (canReset) {
          info.tradingMode = 0;
          info.lastUpdatedTime = block.timestamp;
          info.lastUpdatedBlock = block.number;
          exchangeTradingModes[exchangeAddress] = info;
          emit ResetSuccessful(exchangeAddress, address(breaker));
          return info.tradingMode;
        } else {
          emit ResetAttemptCriteriaFail(exchangeAddress, address(breaker));
          return info.tradingMode;
        }
      } else {
        emit ResetAttemptNotCool(exchangeAddress, address(breaker));
        return info.tradingMode;
      }
    }

    address[] memory _breakers = breakers.getKeys();

    // Check all breakers
    for (uint256 i = 0; i < _breakers.length; ++i) {
      IBreaker breaker = IBreaker(_breakers[i]);
      bool tripBreaker = breaker.shouldTrigger(exchangeAddress);
      if (tripBreaker) {
        info.tradingMode = breakerTradingMode[address(breaker)];
        info.lastUpdatedTime = block.timestamp;
        info.lastUpdatedBlock = block.number;
        exchangeTradingModes[exchangeAddress] = info;
        emit BreakerTripped(address(breaker), exchangeAddress);
        return info.tradingMode;
      }
    }

    return info.tradingMode;
  }
}
