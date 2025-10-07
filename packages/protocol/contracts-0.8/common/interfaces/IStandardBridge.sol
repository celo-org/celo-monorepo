// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

/**
 * @title This interface describes the functions specific to the Superbridge's Standard Bridge contract.
 */
interface IStandardBridge {
  /// @notice Sends ERC20 tokens to a receiver's address on the other chain. Note that if the
  ///         ERC20 token on the other chain does not recognize the local token as the correct
  ///         pair token, the ERC20 bridge will fail and the tokens will be returned to sender on
  ///         this chain.
  /// @param _localToken  Address of the ERC20 on this chain.
  /// @param _remoteToken Address of the corresponding token on the remote chain.
  /// @param _to          Address of the receiver.
  /// @param _amount      Amount of local tokens to deposit.
  /// @param _minGasLimit Minimum amount of gas that the bridge can be relayed with.
  /// @param _extraData   Extra data to be sent with the transaction. Note that the recipient will
  ///                     not be triggered with this data, but it will be emitted and can be used
  ///                     to identify the transaction.
  function bridgeERC20To(
    address _localToken,
    address _remoteToken,
    address _to,
    uint256 _amount,
    uint32 _minGasLimit,
    bytes calldata _extraData
  ) external;
}
