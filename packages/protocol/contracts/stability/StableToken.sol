pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IStableToken.sol";
import "../common/interfaces/ICeloToken.sol";
import "../common/CalledByVm.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/Freezable.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

/**
 * @title An ERC20 compliant token with adjustable supply.
 */
// solhint-disable-next-line max-line-length
contract StableToken is
  Ownable,
  Initializable,
  UsingRegistry,
  UsingPrecompiles,
  Freezable,
  CalledByVm,
  IStableToken,
  IERC20,
  ICeloToken
{
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  event InflationFactorUpdated(uint256 factor, uint256 lastUpdated);

  event InflationParametersUpdated(uint256 rate, uint256 updatePeriod, uint256 lastUpdated);

  event Transfer(address indexed from, address indexed to, uint256 value);

  event TransferComment(string comment);

  string internal name_;
  string internal symbol_;
  uint8 internal decimals_;

  // Stored as units. Value can be found using unitsToValue().
  mapping(address => uint256) internal balances;
  uint256 internal totalSupply_;

  // Stored as values. Units can be found using valueToUnits().
  mapping(address => mapping(address => uint256)) internal allowed;

  // STABILITY FEE PARAMETERS

  // The `rate` is how much the `factor` is adjusted by per `updatePeriod`.
  // The `factor` describes units/value of StableToken, and is greater than or equal to 1.
  // The `updatePeriod` governs how often the `factor` is updated.
  // `factorLastUpdated` indicates when the inflation factor was last updated.
  struct InflationState {
    FixidityLib.Fraction rate;
    FixidityLib.Fraction factor;
    uint256 updatePeriod;
    uint256 factorLastUpdated;
  }

  InflationState inflationState;

  /**
   * @notice recomputes and updates inflation factor if more than `updatePeriod`
   * has passed since last update.
   */
  modifier updateInflationFactor() {
    FixidityLib.Fraction memory updatedInflationFactor;
    uint256 lastUpdated;

    (updatedInflationFactor, lastUpdated) = getUpdatedInflationFactor();

    if (lastUpdated != inflationState.factorLastUpdated) {
      inflationState.factor = updatedInflationFactor;
      inflationState.factorLastUpdated = lastUpdated;
      emit InflationFactorUpdated(inflationState.factor.unwrap(), inflationState.factorLastUpdated);
    }
    _;
  }

  /**
   * @param _name The name of the stable token (English)
   * @param _symbol A short symbol identifying the token (e.g. "cUSD")
   * @param _decimals Tokens are divisible to this many decimal places.
   * @param registryAddress Address of the Registry contract.
   * @param inflationRate weekly inflation rate.
   * @param inflationFactorUpdatePeriod how often the inflation factor is updated.
   */
  function initialize(
    string calldata _name,
    string calldata _symbol,
    uint8 _decimals,
    address registryAddress,
    uint256 inflationRate,
    uint256 inflationFactorUpdatePeriod,
    address[] calldata initialBalanceAddresses,
    uint256[] calldata initialBalanceValues
  ) external initializer {
    require(inflationRate != 0, "Must provide a non-zero inflation rate");
    require(inflationFactorUpdatePeriod > 0, "inflationFactorUpdatePeriod must be > 0");

    _transferOwnership(msg.sender);

    totalSupply_ = 0;
    name_ = _name;
    symbol_ = _symbol;
    decimals_ = _decimals;

    inflationState.rate = FixidityLib.wrap(inflationRate);
    inflationState.factor = FixidityLib.fixed1();
    inflationState.updatePeriod = inflationFactorUpdatePeriod;
    // solhint-disable-next-line not-rely-on-time
    inflationState.factorLastUpdated = now;

    require(initialBalanceAddresses.length == initialBalanceValues.length, "Array length mismatch");
    for (uint256 i = 0; i < initialBalanceAddresses.length; i = i.add(1)) {
      _mint(initialBalanceAddresses[i], initialBalanceValues[i]);
    }
    setRegistry(registryAddress);
  }

  /**
   * @notice Updates Inflation Parameters.
   * @param rate new rate.
   * @param updatePeriod how often inflationFactor is updated.
   */
  function setInflationParameters(uint256 rate, uint256 updatePeriod)
    external
    onlyOwner
    updateInflationFactor
  {
    require(rate != 0, "Must provide a non-zero inflation rate.");
    require(updatePeriod > 0, "updatePeriod must be > 0");
    inflationState.rate = FixidityLib.wrap(rate);
    inflationState.updatePeriod = updatePeriod;

    emit InflationParametersUpdated(
      rate,
      updatePeriod,
      // solhint-disable-next-line not-rely-on-time
      now
    );
  }

  /**
   * @notice Increase the allowance of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The increment of the amount of StableToken approved to the spender.
   * @return True if the transaction succeeds.
   */
  function increaseAllowance(address spender, uint256 value)
    external
    updateInflationFactor
    returns (bool)
  {
    require(spender != address(0), "reserved address 0x0 cannot have allowance");
    uint256 oldValue = allowed[msg.sender][spender];
    uint256 newValue = oldValue.add(value);
    allowed[msg.sender][spender] = newValue;
    emit Approval(msg.sender, spender, newValue);
    return true;
  }

  /**
   * @notice Decrease the allowance of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The decrement of the amount of StableToken approved to the spender.
   * @return True if the transaction succeeds.
   */
  function decreaseAllowance(address spender, uint256 value)
    external
    updateInflationFactor
    returns (bool)
  {
    uint256 oldValue = allowed[msg.sender][spender];
    uint256 newValue = oldValue.sub(value);
    allowed[msg.sender][spender] = newValue;
    emit Approval(msg.sender, spender, newValue);
    return true;
  }

  /**
   * @notice Approve a user to transfer StableToken on behalf of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The amount of StableToken approved to the spender.
   * @return True if the transaction succeeds.
   */
  function approve(address spender, uint256 value) external updateInflationFactor returns (bool) {
    require(spender != address(0), "reserved address 0x0 cannot have allowance");
    allowed[msg.sender][spender] = value;
    emit Approval(msg.sender, spender, value);
    return true;
  }

  /**
   * @notice Mints new StableToken and gives it to 'to'.
   * @param to The account for which to mint tokens.
   * @param value The amount of StableToken to mint.
   */
  function mint(address to, uint256 value) external updateInflationFactor returns (bool) {
    require(
      msg.sender == registry.getAddressFor(EXCHANGE_REGISTRY_ID) ||
        msg.sender == registry.getAddressFor(VALIDATORS_REGISTRY_ID),
      "Only the Exchange and Validators contracts are authorized to mint"
    );
    return _mint(to, value);
  }

  /**
   * @notice Mints new StableToken and gives it to 'to'.
   * @param to The account for which to mint tokens.
   * @param value The amount of StableToken to mint.
   */
  function _mint(address to, uint256 value) private returns (bool) {
    require(to != address(0), "0 is a reserved address");
    if (value == 0) {
      return true;
    }

    uint256 units = _valueToUnits(inflationState.factor, value);
    totalSupply_ = totalSupply_.add(units);
    balances[to] = balances[to].add(units);
    emit Transfer(address(0), to, value);
    return true;
  }

  /**
   * @notice Transfer token for a specified address
   * @param to The address to transfer to.
   * @param value The amount to be transferred.
   * @param comment The transfer comment.
   * @return True if the transaction succeeds.
   */
  function transferWithComment(address to, uint256 value, string calldata comment)
    external
    updateInflationFactor
    onlyWhenNotFrozen
    returns (bool)
  {
    bool succeeded = transfer(to, value);
    emit TransferComment(comment);
    return succeeded;
  }

  /**
   * @notice Burns StableToken from the balance of msg.sender.
   * @param value The amount of StableToken to burn.
   */
  function burn(uint256 value)
    external
    onlyRegisteredContract(EXCHANGE_REGISTRY_ID)
    updateInflationFactor
    returns (bool)
  {
    uint256 units = _valueToUnits(inflationState.factor, value);
    require(units <= balances[msg.sender], "value exceeded balance of sender");
    totalSupply_ = totalSupply_.sub(units);
    balances[msg.sender] = balances[msg.sender].sub(units);
    emit Transfer(msg.sender, address(0), units);
    return true;
  }

  /**
   * @notice Transfers StableToken from one address to another on behalf of a user.
   * @param from The address to transfer StableToken from.
   * @param to The address to transfer StableToken to.
   * @param value The amount of StableToken to transfer.
   * @return True if the transaction succeeds.
   */
  function transferFrom(address from, address to, uint256 value)
    external
    updateInflationFactor
    onlyWhenNotFrozen
    returns (bool)
  {
    uint256 units = _valueToUnits(inflationState.factor, value);
    require(to != address(0), "transfer attempted to reserved address 0x0");
    require(units <= balances[from], "transfer value exceeded balance of sender");
    require(
      value <= allowed[from][msg.sender],
      "transfer value exceeded sender's allowance for recipient"
    );

    balances[to] = balances[to].add(units);
    balances[from] = balances[from].sub(units);
    allowed[from][msg.sender] = allowed[from][msg.sender].sub(value);
    emit Transfer(from, to, value);
    return true;
  }

  /**
   * @return The name of the stable token.
   */
  function name() external view returns (string memory) {
    return name_;
  }

  /**
   * @return The symbol of the stable token.
   */
  function symbol() external view returns (string memory) {
    return symbol_;
  }

  /**
   * @return The number of decimal places to which StableToken is divisible.
   */
  function decimals() external view returns (uint8) {
    return decimals_;
  }

  /**
   * @notice Gets the amount of owner's StableToken allowed to be spent by spender.
   * @param accountOwner The owner of the StableToken.
   * @param spender The spender of the StableToken.
   * @return The amount of StableToken owner is allowing spender to spend.
   */
  function allowance(address accountOwner, address spender) external view returns (uint256) {
    return allowed[accountOwner][spender];
  }

  /**
   * @notice Gets the balance of the specified address using the presently stored inflation factor.
   * @param accountOwner The address to query the balance of.
   * @return The balance of the specified address.
   */
  function balanceOf(address accountOwner) external view returns (uint256) {
    return unitsToValue(balances[accountOwner]);
  }

  /**
   * @return The total value of StableToken in existence
   * @dev Though totalSupply_ is stored in units, this returns value.
   */
  function totalSupply() external view returns (uint256) {
    return unitsToValue(totalSupply_);
  }

  /**
   * @notice gets inflation parameters.
   * @return rate
   * @return factor
   * @return updatePeriod
   * @return factorLastUpdated
   */
  function getInflationParameters() external view returns (uint256, uint256, uint256, uint256) {
    return (
      inflationState.rate.unwrap(),
      inflationState.factor.unwrap(),
      inflationState.updatePeriod,
      inflationState.factorLastUpdated
    );
  }

  /**
   * @notice Returns the units for a given value given the current inflation factor.
   * @param value The value to convert to units.
   * @return The units corresponding to `value` given the current inflation factor.
   * @dev We don't compute the updated inflationFactor here because
   * we assume any function calling this will have updated the inflation factor.
   */
  function valueToUnits(uint256 value) external view returns (uint256) {
    FixidityLib.Fraction memory updatedInflationFactor;

    (updatedInflationFactor, ) = getUpdatedInflationFactor();
    return _valueToUnits(updatedInflationFactor, value);
  }

  /**
   * @notice Returns the value of a given number of units given the current inflation factor.
   * @param units The units to convert to value.
   * @return The value corresponding to `units` given the current inflation factor.
   */
  function unitsToValue(uint256 units) public view returns (uint256) {
    FixidityLib.Fraction memory updatedInflationFactor;

    (updatedInflationFactor, ) = getUpdatedInflationFactor();

    // We're ok using FixidityLib.divide here because updatedInflationFactor is
    // not going to surpass maxFixedDivisor any time soon.
    // Quick upper-bound estimation: if annual inflation were 5% (an order of
    // magnitude more than the initial proposal of 0.5%), in 500 years, the
    // inflation factor would be on the order of 10**10, which is still a safe
    // divisor.
    return FixidityLib.newFixed(units).divide(updatedInflationFactor).fromFixed();
  }

  /**
   * @notice Returns the units for a given value given the current inflation factor.
   * @param value The value to convert to units.
   * @return The units corresponding to `value` given the current inflation factor.
   * @dev we assume any function calling this will have updated the inflation factor.
   */
  function _valueToUnits(FixidityLib.Fraction memory inflationFactor, uint256 value)
    private
    pure
    returns (uint256)
  {
    return inflationFactor.multiply(FixidityLib.newFixed(value)).fromFixed();
  }

  /**
   * @notice Computes the up-to-date inflation factor.
   * @return current inflation factor.
   * @return lastUpdated time when the returned inflation factor went into effect.
   */
  function getUpdatedInflationFactor() private view returns (FixidityLib.Fraction memory, uint256) {
    /* solhint-disable not-rely-on-time */
    if (now < inflationState.factorLastUpdated.add(inflationState.updatePeriod)) {
      return (inflationState.factor, inflationState.factorLastUpdated);
    }

    uint256 numerator;
    uint256 denominator;

    // TODO: handle retroactive updates given decreases to updatePeriod
    uint256 timesToApplyInflation = now.sub(inflationState.factorLastUpdated).div(
      inflationState.updatePeriod
    );

    (numerator, denominator) = fractionMulExp(
      inflationState.factor.unwrap(),
      FixidityLib.fixed1().unwrap(),
      inflationState.rate.unwrap(),
      FixidityLib.fixed1().unwrap(),
      timesToApplyInflation,
      decimals_
    );

    // This should never happen. If something went wrong updating the
    // inflation factor, keep the previous factor
    if (numerator == 0 || denominator == 0) {
      return (inflationState.factor, inflationState.factorLastUpdated);
    }

    FixidityLib.Fraction memory currentInflationFactor = FixidityLib.wrap(numerator).divide(
      FixidityLib.wrap(denominator)
    );
    uint256 lastUpdated = inflationState.factorLastUpdated.add(
      inflationState.updatePeriod.mul(timesToApplyInflation)
    );

    return (currentInflationFactor, lastUpdated);
    /* solhint-enable not-rely-on-time */
  }

  /**
   * @notice Transfers `value` from `msg.sender` to `to`
   * @param to The address to transfer to.
   * @param value The amount to be transferred.
   */
  // solhint-disable-next-line no-simple-event-func-name
  function transfer(address to, uint256 value)
    public
    updateInflationFactor
    onlyWhenNotFrozen
    returns (bool)
  {
    return _transfer(to, value);
  }

  /**
   * @notice Transfers StableToken from one address to another
   * @param to The address to transfer StableToken to.
   * @param value The amount of StableToken to be transferred.
   */
  function _transfer(address to, uint256 value) internal returns (bool) {
    require(to != address(0), "transfer attempted to reserved address 0x0");
    uint256 units = _valueToUnits(inflationState.factor, value);
    require(balances[msg.sender] >= units, "transfer value exceeded balance of sender");
    balances[msg.sender] = balances[msg.sender].sub(units);
    balances[to] = balances[to].add(units);
    emit Transfer(msg.sender, to, value);
    return true;
  }

  /**
   * @notice Reserve balance for making payments for gas in this StableToken currency.
   * @param from The account to reserve balance from
   * @param value The amount of balance to reserve
   * @dev Note that this function is called by the protocol when paying for tx fees in this
   * currency. After the tx is executed, gas is refunded to the sender and credited to the
   * various tx fee recipients via a call to `creditGasFees`. Note too that the events emitted
   * by `creditGasFees` reflect the *net* gas fee payments for the transaction.
   */
  function debitGasFees(address from, uint256 value)
    external
    onlyVm
    onlyWhenNotFrozen
    updateInflationFactor
  {
    uint256 units = _valueToUnits(inflationState.factor, value);
    balances[from] = balances[from].sub(units);
    totalSupply_ = totalSupply_.sub(units);
  }

  /**
   * @notice Alternative function to credit balance after making payments
   * for gas in this StableToken currency.
   * @param from The account to debit balance from
   * @param feeRecipient Coinbase address
   * @param gatewayFeeRecipient Gateway address
   * @param communityFund Community fund address
   * @param tipTxFee Coinbase fee
   * @param baseTxFee Community fund fee
   * @param gatewayFee Gateway fee
   * @dev Note that this function is called by the protocol when paying for tx fees in this
   * currency. Before the tx is executed, gas is debited from the sender via a call to
   * `debitGasFees`. Note too that the events emitted by `creditGasFees` reflect the *net* gas fee
   * payments for the transaction.
   */
  function creditGasFees(
    address from,
    address feeRecipient,
    address gatewayFeeRecipient,
    address communityFund,
    uint256 refund,
    uint256 tipTxFee,
    uint256 gatewayFee,
    uint256 baseTxFee
  ) external onlyVm onlyWhenNotFrozen {
    uint256 units = _valueToUnits(inflationState.factor, refund);
    balances[from] = balances[from].add(units);

    units = units.add(_creditGas(from, communityFund, baseTxFee));
    units = units.add(_creditGas(from, feeRecipient, tipTxFee));
    units = units.add(_creditGas(from, gatewayFeeRecipient, gatewayFee));
    totalSupply_ = totalSupply_.add(units);
  }

  function _creditGas(address from, address to, uint256 value) internal returns (uint256) {
    if (to == address(0)) {
      return 0;
    }
    uint256 units = _valueToUnits(inflationState.factor, value);
    balances[to] = balances[to].add(units);
    emit Transfer(from, to, value);
    return units;
  }

}
