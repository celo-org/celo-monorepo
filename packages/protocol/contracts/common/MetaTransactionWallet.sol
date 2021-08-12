pragma solidity ^0.5.13;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./interfaces/ICeloVersionedContract.sol";
import "./interfaces/IMetaTransactionWallet.sol";
import "./ExternalCall.sol";
import "./Initializable.sol";
import "./Signatures.sol";

contract MetaTransactionWallet is
  IMetaTransactionWallet,
  ICeloVersionedContract,
  Initializable,
  Ownable
{
  using SafeMath for uint256;
  using BytesLib for bytes;

  bytes32 public eip712DomainSeparator;
  // The EIP712 typehash for ExecuteMetaTransaction, i.e. keccak256(
  // "ExecuteMetaTransaction(address destination,uint256 value,bytes data,uint256 nonce)");
  bytes32 public constant EIP712_EXECUTE_META_TRANSACTION_TYPEHASH = (
    0x509c6e92324b7214543573524d0bb493d654d3410fa4f4937b3d2f4a903edd33
  );

  // TODO: Add EIP712_EXECUTE_META_TRANSACTION_WITH_REFUND_TYPEHASH

  uint256 public nonce;
  address public signer;
  address public guardian;

  event SignerSet(address indexed signer);
  event GuardianSet(address indexed guardian);
  event WalletRecovered(address indexed newSigner);
  event EIP712DomainSeparatorSet(bytes32 eip712DomainSeparator);
  event Deposit(address indexed sender, uint256 value);
  event FailedMetaTransaction(string error);

  event TransactionExecution(
    address indexed destination,
    uint256 value,
    bytes data,
    bytes returnData
  );

  event MetaTransactionExecution(
    address indexed destination,
    uint256 value,
    bytes data,
    uint256 indexed nonce,
    bytes returnData
  );

  event MetaTransactionWithRefundExecution(
    address indexed destination,
    uint256 value,
    bytes data,
    uint256 indexed nonce,
    uint256 maxGasPrice,
    uint256 metaGasLimit,
    bytes returnData
  );

  // onlyGuardian functions can only be called when the guardian is not the zero address and
  // the caller is the guardian.
  modifier onlyGuardian() {
    // Note that if the guardian is not set (e.g. its address 0), this require statement will fail.
    require(guardian == msg.sender, "Caller is not the guardian");
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @dev Fallback function allows to deposit ether.
   */
  function() external payable {
    if (msg.value > 0) emit Deposit(msg.sender, msg.value);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 1);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _signer The address authorized to execute transactions via this wallet.
   */
  function initialize(address _signer) external initializer {
    _setSigner(_signer);
    setEip712DomainSeparator();
    // MetaTransactionWallet owns itself, which necessitates that all onlyOwner functions
    // be called via executeTransaction or executeMetaTransaction.
    // If the signer was the owner, onlyOwner functions would not be callable via
    // meta-transactions.
    _transferOwnership(address(this));
  }

  /**
   * @notice Transfers control of the wallet to a new signer.
   * @param _signer The address authorized to execute transactions via this wallet.
   */
  function setSigner(address _signer) external onlyOwner {
    _setSigner(_signer);
  }

  /**
   * @notice Sets the wallet's guardian address.
   * @param _guardian The address authorized to change the wallet's signer
   */
  function setGuardian(address _guardian) external onlyOwner {
    guardian = _guardian;
    emit GuardianSet(guardian);
  }

  /**
   * @notice Changes the wallet's signer
   * @param newSigner The new signer address
   */
  function recoverWallet(address newSigner) external onlyGuardian {
    _setSigner(newSigner);
    emit WalletRecovered(newSigner);
  }

  /**
   * @notice Sets the EIP-712 domain separator.
   * @dev Should be called every time the wallet is upgraded to a new version.
   */
  function setEip712DomainSeparator() public {
    uint256 id;
    assembly {
      id := chainid
    }
    // Note: `version` is the storage.major part of this contract's version (an
    // increase to either of these could mean backwards incompatibilities).
    eip712DomainSeparator = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("MetaTransactionWallet")),
        keccak256("1.1"),
        id,
        address(this)
      )
    );
    emit EIP712DomainSeparatorSet(eip712DomainSeparator);
  }

  /**
   * @notice Returns the struct hash of the MetaTransaction
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param _nonce The nonce for this meta-transaction local to this wallet.
   * @return The digest of the provided meta-transaction.
   */
  function _getMetaTransactionStructHash(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 _nonce
  ) internal view returns (bytes32) {
    return
      keccak256(
        abi.encode(
          EIP712_EXECUTE_META_TRANSACTION_TYPEHASH,
          destination,
          value,
          keccak256(data),
          _nonce
        )
      );
  }

  /**
   * @notice Returns the struct hash of the refundable meta-transaction
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param _nonce The nonce for this meta-transaction local to this wallet.
   * @param maxGasPrice The maximum gas price the user is willing to pay.
   * @param metaGasLimit The gas limit for just the meta-transaction.
   * @return The digest of the provided meta-transaction.
   */
  function _getMetaTransactionWithRefundStructHash(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 _nonce,
    uint256 maxGasPrice,
    uint256 metaGasLimit
  ) internal view returns (bytes32) {
    return
      keccak256(
        abi.encode(
          EIP712_EXECUTE_META_TRANSACTION_TYPEHASH,
          destination,
          value,
          keccak256(data),
          _nonce,
          maxGasPrice,
          metaGasLimit
        )
      );
  }

  /**
   * @notice Returns the digest of the provided meta-transaction, to be signed by `sender`.
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param _nonce The nonce for this meta-transaction local to this wallet.
   * @return The digest of the provided meta-transaction.
   */
  function getMetaTransactionDigest(
    address destination,
    uint256 value,
    bytes calldata data,
    uint256 _nonce
  ) external view returns (bytes32) {
    bytes32 structHash = _getMetaTransactionStructHash(destination, value, data, _nonce);
    return Signatures.toEthSignedTypedDataHash(eip712DomainSeparator, structHash);
  }

  /**
   * @notice Returns the digest of the provided meta-transaction, to be signed by `sender`.
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param _nonce The nonce for this meta-transaction local to this wallet.
   * @param maxGasPrice The maximum gas price the user is willing to pay.
   * @param metaGasLimit The gas limit for just the meta-transaction.
   * @return The digest of the provided meta-transaction.
   */
  function getMetaTransactionWithRefundDigest(
    address destination,
    uint256 value,
    bytes calldata data,
    uint256 _nonce,
    uint256 maxGasPrice,
    uint256 metaGasLimit
  ) external view returns (bytes32) {
    bytes32 structHash = _getMetaTransactionWithRefundStructHash(
      destination,
      value,
      data,
      _nonce,
      maxGasPrice,
      metaGasLimit
    );
    return Signatures.toEthSignedTypedDataHash(eip712DomainSeparator, structHash);
  }

  /**
   * @notice Returns the address that signed the provided meta-transaction.
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param _nonce The nonce for this meta-transaction local to this wallet.
   * @param v The recovery id of the ECDSA signature of the meta-transaction.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return The address that signed the provided meta-transaction.
   */
  function getMetaTransactionSigner(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 _nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (address) {
    bytes32 structHash = _getMetaTransactionStructHash(destination, value, data, _nonce);
    return Signatures.getSignerOfTypedDataHash(eip712DomainSeparator, structHash, v, r, s);
  }

  /**
   * @notice Returns the address that signed the provided refundable meta-transaction.
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param _nonce The nonce for this meta-transaction local to this wallet.
   * @param maxGasPrice The maximum gas price the user is willing to pay.
   * @param metaGasLimit The gas limit for just the meta-transaction.
   * @param v The recovery id of the ECDSA signature of the meta-transaction.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return The address that signed the provided meta-transaction.
   */
  function getMetaTransactionWithRefundSigner(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 _nonce,
    uint256 maxGasPrice,
    uint256 metaGasLimit,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (address) {
    bytes32 structHash = _getMetaTransactionWithRefundStructHash(
      destination,
      value,
      data,
      _nonce,
      maxGasPrice,
      metaGasLimit
    );
    return Signatures.getSignerOfTypedDataHash(eip712DomainSeparator, structHash, v, r, s);
  }

  /**
   * @notice Executes a meta-transaction on behalf of the signer.
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param v The recovery id of the ECDSA signature of the meta-transaction.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return The return value of the meta-transaction execution.
   */
  function executeMetaTransaction(
    address destination,
    uint256 value,
    bytes calldata data,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (bytes memory) {
    address _signer = getMetaTransactionSigner(destination, value, data, nonce, v, r, s);
    require(_signer == signer, "Invalid meta-transaction signer");
    nonce = nonce.add(1);
    bytes memory returnData = ExternalCall.execute(destination, value, data);
    emit MetaTransactionExecution(destination, value, data, nonce.sub(1), returnData);
    return returnData;
  }

  /**
  * relayer? TODO determine if we can predict this request (question for komenci folks)
  * gatewayFee / gateWayFeeRecipient? (TODO: ask Contracts if better to omit these or add them for forward compatibility) 
  */

  /**
   * @notice Executes a refundable meta-transaction on behalf of the signer.
   * @param destination The address to which the meta-transaction is to be sent.
   * @param value The CELO value to be sent with the meta-transaction.
   * @param data The data to be sent with the meta-transaction.
   * @param maxGasPrice The maximum gas price the user is willing to pay.
   * @param gasLimit The gas limit for entire relayed transaction.
   * @param metaGasLimit The gas limit for just the meta-transaction.
   * @param v The recovery id of the ECDSA signature of the meta-transaction.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return The return value of the meta-transaction execution.
   */
  function executeMetaTransactionWithRefund(
    address destination,
    uint256 value,
    bytes calldata data,
    uint256 maxGasPrice,
    uint256 gasLimit,
    uint256 metaGasLimit,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (bytes memory) {
    require(gasLimit == gasleft(), "gasLimit different than limit authorized by signer"); // To ensure Komenci actually set the correct gas limit TODO ask Contracts about this
    require(tx.gasprice <= maxGasPrice, "gasprice exceeds limit authorized by signer");
    require(address(this).balance >= gasLimit.mul(tx.gasprice).add(value), "insufficient balance");
    require(msg.sender == tx.origin, "relayer must be EOA");
    if (data.length > 0) require(Address.isContract(destination), "Invalid contract address");
    require(gasLimit <= block.gaslimit, "Impossible gas limit");
    require(metaGasLimit < gasLimit, "metaGasLimit must be less than gasLimit");

    // checking gasCurrency is out of scope, would require pre-compile
    {
      address _signer = getMetaTransactionWithRefundSigner(
        destination,
        value,
        data,
        nonce,
        maxGasPrice,
        metaGasLimit,
        v,
        r,
        s
      );
      require(_signer == signer, "Invalid meta-transaction signer");
    }

    nonce = nonce.add(1);

    bytes memory returnData;

    {
      // TODO: ask Contracts
      uint256 buffer1 = 4949; // TODO: determine this constant (gas required for operations after destination.call.value)

      if (
        address(this).balance >= metaGasLimit.add(buffer1).mul(tx.gasprice).add(value) &&
        metaGasLimit < (gasleft() * 63) / 64
      ) {
        bool success;
        (success, returnData) = destination.call.value(value).gas(metaGasLimit)(data);

        if (!success) {
          emit FailedMetaTransaction("Meta Transaction with refund failed");
        } else {
          emit MetaTransactionWithRefundExecution(
            destination,
            value,
            data,
            nonce.sub(1),
            maxGasPrice,
            metaGasLimit,
            returnData
          );
        }

      } else {
        returnData = "";
      }
    }

    {
      uint256 buffer2 = 4747; // TODO: determine this constant (gas required for operations after and including msg.sender.transfer)
      msg.sender.transfer(gasLimit.sub(gasleft()).add(buffer2).mul(tx.gasprice));
    }

    return returnData;
  }

  /**
   * @notice Executes a transaction on behalf of the signer.
   * @param destination The address to which the transaction is to be sent.
   * @param value The CELO value to be sent with the transaction.
   * @param data The data to be sent with the transaction.
   * @return The return value of the transaction execution.
   */
  function executeTransaction(address destination, uint256 value, bytes memory data)
    public
    returns (bytes memory)
  {
    // Allowing the owner to call execute transaction allows, when the contract is self-owned,
    // for the signer to sign and execute a batch of transactions via a meta-transaction.
    require(msg.sender == signer || msg.sender == owner(), "Invalid transaction sender");
    bytes memory returnData = ExternalCall.execute(destination, value, data);
    emit TransactionExecution(destination, value, data, returnData);
    return returnData;
  }

  /**
   * @notice Executes multiple transactions on behalf of the signer.`
   * @param destinations The address to which each transaction is to be sent.
   * @param values The CELO value to be sent with each transaction.
   * @param data The concatenated data to be sent in each transaction.
   * @param dataLengths The length of each transaction's data.
   * @return The return values of all transactions appended as bytes and an array of the length
   *         of each transaction output which will be 0 if a transaction had no output 
   */
  function executeTransactions(
    address[] calldata destinations,
    uint256[] calldata values,
    bytes calldata data,
    uint256[] calldata dataLengths
  ) external returns (bytes memory, uint256[] memory) {
    require(
      destinations.length == values.length && values.length == dataLengths.length,
      "Input arrays must be same length"
    );

    bytes memory returnValues;
    uint256[] memory returnLengths = new uint256[](destinations.length);
    uint256 dataPosition = 0;
    for (uint256 i = 0; i < destinations.length; i = i.add(1)) {
      bytes memory returnVal = executeTransaction(
        destinations[i],
        values[i],
        sliceData(data, dataPosition, dataLengths[i])
      );
      returnValues = abi.encodePacked(returnValues, returnVal);
      returnLengths[i] = returnVal.length;
      dataPosition = dataPosition.add(dataLengths[i]);
    }

    require(dataPosition == data.length, "data cannot have extra bytes appended");
    return (returnValues, returnLengths);
  }

  /**
   * @notice Returns a slice from a byte array.
   * @param data The byte array.
   * @param start The start index of the slice to take.
   * @param length The length of the slice to take.
   * @return A slice from a byte array.
   */
  function sliceData(bytes memory data, uint256 start, uint256 length)
    internal
    returns (bytes memory)
  {
    // When length == 0 bytes.slice does not seem to always return an empty byte array.
    bytes memory sliced;
    if (length > 0) {
      sliced = data.slice(start, length);
    }
    return sliced;
  }

  function _setSigner(address _signer) internal {
    require(_signer != address(0), "cannot assign zero address as signer");
    signer = _signer;
    emit SignerSet(signer);
  }

}
