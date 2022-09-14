// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;

/*
 * @title Broker Admin Interface - all these functions should be only callable by the owner
 * @notice The broker is responsible for executing swaps and keeping track of trading limits
 */
interface IBrokerAdmin {
  /**
   * @notice Emitted when a ExchangeProvider is added
   * @param exchangeProvider the address of the ExchangeProvider.
   */
  event ExchangeProviderAdded(address indexed exchangeProvider);

  /**
   * @notice Emitted when a ExchangeProvider is removed
   * @param exchangeProvider the address of the ExchangeProvider.
   */
  event ExchangeProviderRemoved(address indexed exchangeProvider);

  /**
   * @notice Emitted the Reserve is updated
   * @param newAddress the new address
   * @param prevAddress the previous address
   */
  event ReserveUpdated(address indexed newAddress, address indexed prevAddress);

  /**
   * @notice Remove a exchange manager at an index
   * @param exchangeProvider the address of the exchange manager to remove
   * @param index the index in the exchange managers array
   */
  function removeExchangeProviders(address exchangeProvider, uint256 index) external;

  /**
   * @notice Add exchange manager
   * @param exchangeProvider the address of the exchange manager to add
   * @return index the index where it was inserted
   */
  function addExchangeProvider(address exchangeProvider) external returns (uint256 index);

  /**
   * @notice Set the reserve
   * @param reserve address
   */
  function setReserve(address reserve) external;
}
