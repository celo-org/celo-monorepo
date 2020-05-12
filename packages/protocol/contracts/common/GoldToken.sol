pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./CalledByVm.sol";
import "./Freezable.sol";
import "./Initializable.sol";
import "./interfaces/ICeloToken.sol";

contract GoldToken is Initializable, CalledByVm, Freezable, IERC20, ICeloToken {
  using SafeMath for uint256;

  // Address of the TRANSFER precompiled contract.
  // solhint-disable state-visibility
  address constant TRANSFER = address(0xff - 2);
  string constant NAME = "Celo Gold";
  string constant SYMBOL = "cGLD";
  uint8 constant DECIMALS = 18;
  uint256 internal totalSupply_;
  // solhint-enable state-visibility

  mapping(address => mapping(address => uint256)) internal allowed;

  event Transfer(address indexed from, address indexed to, uint256 value);

  event TransferComment(string comment);

  event Approval(address indexed owner, address indexed spender, uint256 value);

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress Address of the Registry contract.
   */
  function initialize(address registryAddress) external initializer {
    totalSupply_ = 0;
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Transfers Celo Gold from one address to another.
   * @param to The address to transfer Celo Gold to.
   * @param value The amount of Celo Gold to transfer.
   * @return True if the transaction succeeds.
   */
  // solhint-disable-next-line no-simple-event-func-name
  function transfer(address to, uint256 value) external returns (bool) {
    return _transfer(to, value);
  }

  /**
   * @notice Transfers Celo Gold from one address to another with a comment.
   * @param to The address to transfer Celo Gold to.
   * @param value The amount of Celo Gold to transfer.
   * @param comment The transfer comment
   * @return True if the transaction succeeds.
   */
  function transferWithComment(address to, uint256 value, string calldata comment)
    external
    returns (bool)
  {
    bool succeeded = _transfer(to, value);
    emit TransferComment(comment);
    return succeeded;
  }

  /**
   * @notice Approve a user to transfer Celo Gold on behalf of another user.
   * @param spender The address which is being approved to spend Celo Gold.
   * @param value The amount of Celo Gold approved to the spender.
   * @return True if the transaction succeeds.
   */
  function approve(address spender, uint256 value) external returns (bool) {
    require(spender != address(0), "cannot set allowance for 0");
    allowed[msg.sender][spender] = value;
    emit Approval(msg.sender, spender, value);
    return true;
  }

  /**
   * @notice Increases the allowance of another user.
   * @param spender The address which is being approved to spend Celo Gold.
   * @param value The increment of the amount of Celo Gold approved to the spender.
   * @return True if the transaction succeeds.
   */
  function increaseAllowance(address spender, uint256 value) external returns (bool) {
    require(spender != address(0), "cannot set allowance for 0");
    uint256 oldValue = allowed[msg.sender][spender];
    uint256 newValue = oldValue.add(value);
    allowed[msg.sender][spender] = newValue;
    emit Approval(msg.sender, spender, newValue);
    return true;
  }

  /**
   * @notice Decreases the allowance of another user.
   * @param spender The address which is being approved to spend Celo Gold.
   * @param value The decrement of the amount of Celo Gold approved to the spender.
   * @return True if the transaction succeeds.
   */
  function decreaseAllowance(address spender, uint256 value) external returns (bool) {
    uint256 oldValue = allowed[msg.sender][spender];
    uint256 newValue = oldValue.sub(value);
    allowed[msg.sender][spender] = newValue;
    emit Approval(msg.sender, spender, newValue);
    return true;
  }

  /**
   * @notice Transfers Celo Gold from one address to another on behalf of a user.
   * @param from The address to transfer Celo Gold from.
   * @param to The address to transfer Celo Gold to.
   * @param value The amount of Celo Gold to transfer.
   * @return True if the transaction succeeds.
   */
  function transferFrom(address from, address to, uint256 value)
    external
    onlyWhenNotFrozen
    returns (bool)
  {
    require(to != address(0), "transfer attempted to reserved address 0x0");
    require(value <= balanceOf(from), "transfer value exceeded balance of sender");
    require(
      value <= allowed[from][msg.sender],
      "transfer value exceeded sender's allowance for recipient"
    );

    bool success;
    (success, ) = TRANSFER.call.value(0).gas(gasleft())(abi.encode(from, to, value));
    require(success, "Celo Gold transfer failed");

    allowed[from][msg.sender] = allowed[from][msg.sender].sub(value);
    emit Transfer(from, to, value);
    return true;
  }

  /**
   * @notice Mints new cGLD and gives it to 'to'.
   * @param to The account for which to mint tokens.
   * @param value The amount of cGLD to mint.
   */
  function mint(address to, uint256 value) external onlyVm returns (bool) {
    if (value == 0) {
      return true;
    }

    totalSupply_ = totalSupply_.add(value);

    bool success;
    (success, ) = TRANSFER.call.value(0).gas(gasleft())(abi.encode(address(0), to, value));
    require(success, "Celo Gold transfer failed");

    emit Transfer(address(0), to, value);
    return true;
  }

  /**
   * @return The name of the Celo Gold token.
   */
  function name() external view returns (string memory) {
    return NAME;
  }

  /**
   * @return The symbol of the Celo Gold token.
   */
  function symbol() external view returns (string memory) {
    return SYMBOL;
  }

  /**
   * @return The number of decimal places to which Celo Gold is divisible.
   */
  function decimals() external view returns (uint8) {
    return DECIMALS;
  }

  /**
   * @return The total amount of Celo Gold in existence.
   */
  function totalSupply() external view returns (uint256) {
    return totalSupply_;
  }

  /**
   * @notice Gets the amount of owner's Celo Gold allowed to be spent by spender.
   * @param owner The owner of the Celo Gold.
   * @param spender The spender of the Celo Gold.
   * @return The amount of Celo Gold owner is allowing spender to spend.
   */
  function allowance(address owner, address spender) external view returns (uint256) {
    return allowed[owner][spender];
  }

  /**
   * @notice Increases the variable for total amount of Celo Gold in existence.
   * @param amount The amount to increase counter by
   */
  function increaseSupply(uint256 amount) external onlyVm {
    totalSupply_ = totalSupply_.add(amount);
  }

  /**
   * @notice Gets the balance of the specified address.
   * @param owner The address to query the balance of.
   * @return The balance of the specified address.
   */
  function balanceOf(address owner) public view returns (uint256) {
    return owner.balance;
  }

  /**
   * @notice internal Celo Gold transfer from one address to another.
   * @param to The address to transfer Celo Gold to.
   * @param value The amount of Celo Gold to transfer.
   * @return True if the transaction succeeds.
   */
  function _transfer(address to, uint256 value) internal onlyWhenNotFrozen returns (bool) {
    require(to != address(0), "transfer attempted to reserved address 0x0");
    require(value <= balanceOf(msg.sender), "transfer value exceeded balance of sender");

    bool success;
    (success, ) = TRANSFER.call.value(0).gas(gasleft())(abi.encode(msg.sender, to, value));
    require(success, "Celo Gold transfer failed");
    emit Transfer(msg.sender, to, value);
    return true;
  }
}
