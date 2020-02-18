pragma solidity ^0.5.3;
/* solhint-disable no-inline-assembly, avoid-low-level-calls, func-name-mixedcase, func-order */

import "./Initializable.sol";
import "./libraries/AddressesHelper.sol";

/// @title Multisignature wallet - Allows multiple parties to agree on transactions before
/// execution.
/// @author Stefan George - <stefan.george@consensys.net>
contract MultiSig is Initializable {
  /*
   *  Events
   */
  event Confirmation(address indexed sender, uint256 indexed transactionId);
  event Revocation(address indexed sender, uint256 indexed transactionId);
  event Submission(uint256 indexed transactionId);
  event Execution(uint256 indexed transactionId);
  event ExecutionFailure(uint256 indexed transactionId);
  event Deposit(address indexed sender, uint256 value);
  event OwnerAddition(address indexed owner);
  event OwnerRemoval(address indexed owner);
  event RequirementChange(uint256 required);

  /*
   *  Constants
   */
  uint256 public constant MAX_OWNER_COUNT = 50;

  /*
   *  Storage
   */
  mapping(uint256 => Transaction) public transactions;
  mapping(uint256 => mapping(address => bool)) public confirmations;
  mapping(address => bool) public isOwner;
  address[] public owners;
  uint256 public required;
  uint256 public transactionCount;

  struct Transaction {
    address destination;
    uint256 value;
    bytes data;
    bool executed;
  }

  /*
   *  Modifiers
   */
  modifier onlyWallet() {
    require(msg.sender == address(this), "msg.sender was not multisig wallet");
    _;
  }

  modifier ownerDoesNotExist(address owner) {
    require(!isOwner[owner], "owner already existed");
    _;
  }

  modifier ownerExists(address owner) {
    require(isOwner[owner], "owner does not exist");
    _;
  }

  modifier transactionExists(uint256 transactionId) {
    require(transactions[transactionId].destination != address(0), "transaction does not exist");
    _;
  }

  modifier confirmed(uint256 transactionId, address owner) {
    require(confirmations[transactionId][owner], "transaction was not confirmed for owner");
    _;
  }

  modifier notConfirmed(uint256 transactionId, address owner) {
    require(!confirmations[transactionId][owner], "transaction was already confirmed for owner");
    _;
  }

  modifier notExecuted(uint256 transactionId) {
    require(!transactions[transactionId].executed, "transaction was executed already");
    _;
  }

  modifier notNull(address _address) {
    require(_address != address(0), "address was null");
    _;
  }

  modifier validRequirement(uint256 ownerCount, uint256 _required) {
    require(
      ownerCount <= MAX_OWNER_COUNT && _required <= ownerCount && _required != 0 && ownerCount != 0,
      "invalid requirement"
    );
    _;
  }

  /// @dev Fallback function allows to deposit ether.
  function() external payable {
    if (msg.value > 0) emit Deposit(msg.sender, msg.value);
  }

  /*
   * Public functions
   */
  /// @dev Contract constructor sets initial owners and required number of confirmations.
  /// @param _owners List of initial owners.
  /// @param _required Number of required confirmations.
  function initialize(address[] calldata _owners, uint256 _required)
    external
    initializer
    validRequirement(_owners.length, _required)
  {
    for (uint256 i = 0; i < _owners.length; i++) {
      require(
        !isOwner[_owners[i]] && _owners[i] != address(0),
        "owner was null or already given owner status"
      );
      isOwner[_owners[i]] = true;
    }
    owners = _owners;
    required = _required;
  }

  /// @dev Allows to add a new owner. Transaction has to be sent by wallet.
  /// @param owner Address of new owner.
  function addOwner(address owner)
    external
    onlyWallet
    ownerDoesNotExist(owner)
    notNull(owner)
    validRequirement(owners.length + 1, required)
  {
    isOwner[owner] = true;
    owners.push(owner);
    emit OwnerAddition(owner);
  }

  /// @dev Allows to remove an owner. Transaction has to be sent by wallet.
  /// @param owner Address of owner.
  function removeOwner(address owner) external onlyWallet ownerExists(owner) {
    isOwner[owner] = false;
    for (uint256 i = 0; i < owners.length - 1; i++)
      if (owners[i] == owner) {
        owners[i] = owners[owners.length - 1];
        break;
      }
    owners.length -= 1;
    if (required > owners.length) changeRequirement(owners.length);
    emit OwnerRemoval(owner);
  }

  /// @dev Allows to replace an owner with a new owner. Transaction has to be sent by wallet.
  /// @param owner Address of owner to be replaced.
  /// @param newOwner Address of new owner.
  function replaceOwner(address owner, address newOwner)
    external
    onlyWallet
    ownerExists(owner)
    notNull(newOwner)
    ownerDoesNotExist(newOwner)
  {
    for (uint256 i = 0; i < owners.length; i++)
      if (owners[i] == owner) {
        owners[i] = newOwner;
        break;
      }
    isOwner[owner] = false;
    isOwner[newOwner] = true;
    emit OwnerRemoval(owner);
    emit OwnerAddition(newOwner);
  }

  /// @dev Allows to change the number of required confirmations. Transaction has to be sent by
  /// wallet.
  /// @param _required Number of required confirmations.
  function changeRequirement(uint256 _required)
    public
    onlyWallet
    validRequirement(owners.length, _required)
  {
    required = _required;
    emit RequirementChange(_required);
  }

  /// @dev Allows an owner to submit and confirm a transaction.
  /// @param destination Transaction target address.
  /// @param value Transaction ether value.
  /// @param data Transaction data payload.
  /// @return Returns transaction ID.
  function submitTransaction(address destination, uint256 value, bytes calldata data)
    external
    returns (uint256 transactionId)
  {
    transactionId = addTransaction(destination, value, data);
    confirmTransaction(transactionId);
  }

  /// @dev Allows an owner to confirm a transaction.
  /// @param transactionId Transaction ID.
  function confirmTransaction(uint256 transactionId)
    public
    ownerExists(msg.sender)
    transactionExists(transactionId)
    notConfirmed(transactionId, msg.sender)
  {
    confirmations[transactionId][msg.sender] = true;
    emit Confirmation(msg.sender, transactionId);
    executeTransaction(transactionId);
  }

  /// @dev Allows an owner to revoke a confirmation for a transaction.
  /// @param transactionId Transaction ID.
  function revokeConfirmation(uint256 transactionId)
    external
    ownerExists(msg.sender)
    confirmed(transactionId, msg.sender)
    notExecuted(transactionId)
  {
    confirmations[transactionId][msg.sender] = false;
    emit Revocation(msg.sender, transactionId);
  }

  /// @dev Allows anyone to execute a confirmed transaction.
  /// @param transactionId Transaction ID.
  function executeTransaction(uint256 transactionId)
    public
    ownerExists(msg.sender)
    confirmed(transactionId, msg.sender)
    notExecuted(transactionId)
  {
    if (isConfirmed(transactionId)) {
      Transaction storage txn = transactions[transactionId];
      txn.executed = true;
      if (external_call(txn.destination, txn.value, txn.data.length, txn.data))
        emit Execution(transactionId);
      else {
        emit ExecutionFailure(transactionId);
        txn.executed = false;
      }
    }
  }

  // call has been separated into its own function in order to take advantage
  // of the Solidity's code generator to produce a loop that copies tx.data into memory.
  function external_call(address destination, uint256 value, uint256 dataLength, bytes memory data)
    private
    returns (bool)
  {
    bool result;

    if (dataLength > 0)
      require(AddressesHelper.isContract(destination), "Invalid contract address");

    /* solhint-disable max-line-length */
    assembly {
      let x := mload(0x40) // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
      let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
      result := call(
        sub(gas, 34710), // 34710 is the value that solidity is currently emitting
        // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
        // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
        destination,
        value,
        d,
        dataLength, // Size of the input (in bytes) - this is what fixes the padding problem
        x,
        0 // Output is ignored, therefore the output size is zero
      )
    }
    /* solhint-enable max-line-length */
    return result;
  }

  /// @dev Returns the confirmation status of a transaction.
  /// @param transactionId Transaction ID.
  /// @return Confirmation status.
  function isConfirmed(uint256 transactionId) public view returns (bool) {
    uint256 count = 0;
    for (uint256 i = 0; i < owners.length; i++) {
      if (confirmations[transactionId][owners[i]]) count += 1;
      if (count == required) return true;
    }
  }

  /*
   * Internal functions
   */
  /// @dev Adds a new transaction to the transaction mapping, if transaction does not exist yet.
  /// @param destination Transaction target address.
  /// @param value Transaction ether value.
  /// @param data Transaction data payload.
  /// @return Returns transaction ID.
  function addTransaction(address destination, uint256 value, bytes memory data)
    internal
    notNull(destination)
    returns (uint256 transactionId)
  {
    transactionId = transactionCount;
    transactions[transactionId] = Transaction({
      destination: destination,
      value: value,
      data: data,
      executed: false
    });
    transactionCount += 1;
    emit Submission(transactionId);
  }

  /*
   * Web3 call functions
   */
  /// @dev Returns number of confirmations of a transaction.
  /// @param transactionId Transaction ID.
  /// @return Number of confirmations.
  function getConfirmationCount(uint256 transactionId) external view returns (uint256 count) {
    for (uint256 i = 0; i < owners.length; i++)
      if (confirmations[transactionId][owners[i]]) count += 1;
  }

  /// @dev Returns total number of transactions after filers are applied.
  /// @param pending Include pending transactions.
  /// @param executed Include executed transactions.
  /// @return Total number of transactions after filters are applied.
  function getTransactionCount(bool pending, bool executed) external view returns (uint256 count) {
    for (uint256 i = 0; i < transactionCount; i++)
      if ((pending && !transactions[i].executed) || (executed && transactions[i].executed))
        count += 1;
  }

  /// @dev Returns list of owners.
  /// @return List of owner addresses.
  function getOwners() external view returns (address[] memory) {
    return owners;
  }

  /// @dev Returns array with owner addresses, which confirmed transaction.
  /// @param transactionId Transaction ID.
  /// @return Returns array of owner addresses.
  function getConfirmations(uint256 transactionId)
    external
    view
    returns (address[] memory _confirmations)
  {
    address[] memory confirmationsTemp = new address[](owners.length);
    uint256 count = 0;
    uint256 i;
    for (i = 0; i < owners.length; i++)
      if (confirmations[transactionId][owners[i]]) {
        confirmationsTemp[count] = owners[i];
        count += 1;
      }
    _confirmations = new address[](count);
    for (i = 0; i < count; i++) _confirmations[i] = confirmationsTemp[i];
  }

  /// @dev Returns list of transaction IDs in defined range.
  /// @param from Index start position of transaction array.
  /// @param to Index end position of transaction array.
  /// @param pending Include pending transactions.
  /// @param executed Include executed transactions.
  /// @return Returns array of transaction IDs.
  function getTransactionIds(uint256 from, uint256 to, bool pending, bool executed)
    external
    view
    returns (uint256[] memory _transactionIds)
  {
    uint256[] memory transactionIdsTemp = new uint256[](transactionCount);
    uint256 count = 0;
    uint256 i;
    for (i = 0; i < transactionCount; i++)
      if ((pending && !transactions[i].executed) || (executed && transactions[i].executed)) {
        transactionIdsTemp[count] = i;
        count += 1;
      }
    _transactionIds = new uint256[](to - from);
    for (i = from; i < to; i++) _transactionIds[i - from] = transactionIdsTemp[i];
  }
}
