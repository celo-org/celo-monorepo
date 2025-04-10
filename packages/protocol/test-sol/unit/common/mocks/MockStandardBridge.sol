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

    event BridgeERC20Initiated(
        address indexed localToken,
        address indexed remoteToken,
        address indexed from,
        address to,
        uint256 amount,
        bytes extraData
    );

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

        emit BridgeERC20Initiated(_localToken, _remoteToken, msg.sender, _to, _amount, _extraData);
    }
}
