pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library ExternalCall {
  using SafeMath for uint256;

  event FailedMetaTransaction(string error);

  /**
   * @notice Executes external call.
   * @param destination The address to call.
   * @param value The CELO value to be sent.
   * @param data The data to be sent.
   * @return The call return value.
   */
  function execute(address destination, uint256 value, bytes memory data)
    internal
    returns (bytes memory)
  {
    if (data.length > 0) require(Address.isContract(destination), "Invalid contract address");
    bool success;
    bytes memory returnData;
    (success, returnData) = destination.call.value(value)(data);
    require(success, "Transaction execution failed.");
    return returnData;
  }

  /**
   * @notice Executes external call with refund to sender.
   * @param destination The address to call.
   * @param value The CELO value to be sent.
   * @param gasLimit Gas limit for entire transaction including initial relay.
   * @param metaGasLimit Gas limit for Meta Transaction.
   * @param data The data to be sent.
   * @return The call return value.
   */
  function executeWithRefund(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 gasLimit,
    uint256 metaGasLimit
  ) internal returns (bytes memory) {
    if (data.length > 0) require(Address.isContract(destination), "Invalid contract address");
    bool success;
    bytes memory returnData;
    uint256 buffer1 = 4949; // TODO: determine this constant (gas required for operations after msg.sender.transfer)
    uint256 buffer2 = 4747;
    uint256 partialRefund = gasLimit.sub(gasLeft()); //May not actually be worth it
    msg.sender.transfer(partialRefund);
    if (address(this).balance >= metaGasLimit.add(value).add(buffer1)) {
      (success, returnData) = destination.call.value(value).gas(metaGasLimit)(data);
      if (!success) {
        emit FailedMetaTransaction("Meta Transaction with refund failed"); //Can we emit an event from a library?
      }
    }

    msg.sender.transfer(gasLimit.sub(gasLeft()).sub(partialRefund).add(buffer2));
    return returnData;
  }
}
