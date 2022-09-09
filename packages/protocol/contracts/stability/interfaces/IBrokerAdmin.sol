// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;

/*
 * @title Broker Admin Interface - all these functions should be only callable by the owner
 * @notice The broker is responsible for executing swaps and keeping track of trading limits
 */
interface IBrokerAdmin {
  /**
   * @notice Emitted when a ExchangeManager is added
   * @param exchangeManager the address of the ExchangeManager.
   */
  event ExchangeManagerAdded(address indexed exchangeManager);

  /**
   * @notice Emitted when a ExchangeManager is removed
   * @param exchangeManager the address of the ExchangeManager.
   */
  event ExchangeManagerRemoved(address indexed exchangeManager);

  /**
   * @notice Emitted the Reserve is updated
   * @param newAddress the new address
   * @param prevAddress the previous address
   */
  event ReserveUpdated(address indexed newAddress, address indexed prevAddress);

  /**
   * @notice Remove a listing manager at an index
   * @param exchangeManager the address of the listing manager to remove
   * @param index the index in the listing managers array
   */
  function removeExchangeManagers(address exchangeManager, uint256 index) external;

  /**
   * @notice Add listing manager
   * @param exchangeManager the address of the listing manager to add
   * @return index the index where it was inserted
   */
  function addExchangeManager(address exchangeManager) external returns (uint256 index);

  /**
   * @notice Set the reserve
   * @param reserve address
   */
  function setReserve(address reserve) external;
}
