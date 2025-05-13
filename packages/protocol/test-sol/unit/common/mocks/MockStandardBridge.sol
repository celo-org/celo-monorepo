// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

contract MockStandardBridge {
  address public lastLocalToken;
  address public lastRemoteToken;
  address public lastTo;
  uint256 public lastAmount;
  uint32 public lastMinGasLimit;
  bytes public lastExtraData;

  /// @notice Sends ERC20 tokens to a receiver's address on the other chain.
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
  ) external {
    IERC20(_localToken).transferFrom(msg.sender, address(this), _amount);

    lastLocalToken = _localToken;
    lastRemoteToken = _remoteToken;
    lastTo = _to;
    lastAmount = _amount;
    lastMinGasLimit = _minGasLimit;
    lastExtraData = _extraData;
  }
}
