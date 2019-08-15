pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


import "./interfaces/IStableToken.sol";
import "../common/FractionUtil.sol";
import "../common/interfaces/IERC20Token.sol";
import "../common/interfaces/ICeloToken.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";


/**
 * @title An ERC20 compliant token with adjustable supply.
 */
// solhint-disable-next-line max-line-length
contract StableToken is IStableToken, IERC20Token, ICeloToken, Ownable, Initializable, UsingRegistry {
  using FractionUtil for FractionUtil.Fraction;
  using SafeMath for uint256;

  event MinterSet(address indexed _minter);

  event InflationFactorUpdated(
    uint256 numerator,
    uint256 denominator,
    uint256 lastUpdated
  );

  event InflationParametersUpdated(
    uint256 numerator,
    uint256 denominator,
    uint256 updatePeriod,
    uint256 lastUpdated
  );

  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );

  event TransferComment(
    string comment
  );

  address public minter;
  string internal name_;
  string internal symbol_;
  uint8 internal decimals_;

  // Stored as units. Value can be found using unitsToValue().
  mapping(address => uint256) internal balances;
  uint256 internal totalSupply_;

  // Stored as values. Units can be found using valueToUnits().
  mapping(address => mapping (address => uint256)) internal allowed;

  // STABILITY FEE PARAMETERS

  // The `rate` is how much the `factor` is adjusted by per `updatePeriod`.
  // The `factor` describes units/value of StableToken, and is greater than or equal to 1.
  // The `updatePeriod` governs how often the `factor` is updated.
  // `factorLastUpdated` indicates when the inflation factor was last updated.
  struct InflationState {
    FractionUtil.Fraction rate;
    FractionUtil.Fraction factor;
    uint256 updatePeriod;
    uint256 factorLastUpdated;
  }

  InflationState inflationState;

  /**
   * @notice Throws if called by any account other than the minter.
   */
  modifier onlyMinter() {
    require(msg.sender == minter, "sender was not minter");
    _;
  }

  /**
   * Only VM would be able to set the caller address to 0x0 unless someone
   * really has the private key for 0x0
   */
  modifier onlyVm() {
    require(msg.sender == address(0), "sender was not vm (reserved 0x0 addr)");
    _;
  }

  /**
   * @notice recomputes and updates inflation factor if more than `updatePeriod`
   * has passed since last update.
   */
  modifier updateInflationFactor() {
    FractionUtil.Fraction memory updatedInflationFactor;
    uint256 lastUpdated;

    (updatedInflationFactor, lastUpdated) = getUpdatedInflationFactor();

    if (lastUpdated != inflationState.factorLastUpdated) {
      inflationState.factor = updatedInflationFactor;
      inflationState.factorLastUpdated = lastUpdated;
      emit InflationFactorUpdated(
        inflationState.factor.numerator,
        inflationState.factor.denominator,
        inflationState.factorLastUpdated
      );
    }
    _;
  }

  /**
   * @param _name The name of the stable token (English)
   * @param _symbol A short symbol identifying the token (e.g. "cUSD")
   * @param _decimals Tokens are divisible to this many decimal places.
   * @param registryAddress Address of the Registry contract.
   * @param inflationRateNumerator numerator of weekly inflation rate.
   * @param inflationRateDenominator denominator of weekly inflation rate.
   * @param inflationFactorUpdatePeriod how often the inflation factor is updated.
   */
  function initialize(
    string calldata _name,
    string calldata _symbol,
    uint8 _decimals,
    address registryAddress,
    uint256 inflationRateNumerator,
    uint256 inflationRateDenominator,
    uint256 inflationFactorUpdatePeriod
  )
    external
    initializer
  {
    require(
      inflationRateNumerator != 0 && inflationRateDenominator != 0,
      "Must provide a non-zero inflation rate."
    );
    _transferOwnership(msg.sender);
    totalSupply_ = 0;
    name_ = _name;
    symbol_ = _symbol;
    decimals_ = _decimals;

    inflationState.rate = FractionUtil.Fraction(inflationRateNumerator, inflationRateDenominator);
    inflationState.factor = FractionUtil.Fraction(1, 1);
    inflationState.updatePeriod = inflationFactorUpdatePeriod;
    // solhint-disable-next-line not-rely-on-time
    inflationState.factorLastUpdated = now;

    setRegistry(registryAddress);
  }

  // Should this be tied to the registry?
  /**
   * @notice Updates 'minter'.
   * @param _minter An address with special permissions to modify its balance
   */
  function setMinter(address _minter) external onlyOwner {
    minter = _minter;
    emit MinterSet(minter);
  }

  /**
   * @notice Updates Inflation Parameters.
   * @param rateNumerator numerator of new rate.
   * @param rateDenominator denominator of new rate.
   * @param updatePeriod how often inflationFactor is updated.
   */
  function setInflationParameters(
    uint256 rateNumerator,
    uint256 rateDenominator,
    uint256 updatePeriod
  )
    external
    onlyOwner
    updateInflationFactor
  {
    require(
      rateNumerator != 0 && rateDenominator != 0,
      "Must provide a non-zero inflation rate."
    );
    inflationState.rate = FractionUtil.Fraction(
      rateNumerator,
      rateDenominator
    ).reduce();

    inflationState.updatePeriod = updatePeriod;

    emit InflationParametersUpdated(
      inflationState.rate.numerator,
      inflationState.rate.denominator,
      inflationState.updatePeriod,
      // solhint-disable-next-line not-rely-on-time
      now
    );
  }

  /**
   * @notice Approve a user to transfer StableToken on behalf of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The amount of StableToken approved to the spender.
   * @return True if the transaction succeeds.
   */
  function approve(
    address spender,
    uint256 value
  )
    external
    updateInflationFactor
    returns (bool)
  {
    allowed[msg.sender][spender] = value;
    emit Approval(msg.sender, spender, value);
    return true;
  }

  /**
   * @notice Mints new StableToken and gives it to 'to'.
   * @param to The account for which to mint tokens.
   * @param value The amount of StableToken to mint.
   */
  function mint(
    address to,
    uint256 value
  ) 
    external
    onlyMinter
    updateInflationFactor
    returns (bool)
  {
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
  function transferWithComment(
    address to,
    uint256 value,
    string calldata comment
  )
    external
    updateInflationFactor
    returns (bool)
  {
    bool succeeded = transfer(to, value);
    emit TransferComment(comment);
    return succeeded;
  }

  /**
   * @notice Burns StableToken from the balance of 'minter'.
   * @param value The amount of StableToken to burn.
   */
  function burn(uint256 value) external onlyMinter updateInflationFactor returns (bool) {
    uint256 units = _valueToUnits(inflationState.factor, value);
    require(units <= balances[msg.sender], "value exceeded balance of sender");
    totalSupply_ = totalSupply_.sub(units);
    balances[msg.sender] = balances[msg.sender].sub(units);
    return true;
  }

  /**
   * @notice Transfers StableToken from one address to another on behalf of a user.
   * @param from The address to transfer StableToken from.
   * @param to The address to transfer StableToken to.
   * @param value The amount of StableToken to transfer.
   * @return True if the transaction succeeds.
   */
  function transferFrom(
    address from,
    address to,
    uint256 value
  )
    external
    updateInflationFactor
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
   * @param owner The owner of the StableToken.
   * @param spender The spender of the StableToken.
   * @return The amount of StableToken owner is allowing spender to spend.
   */
  function allowance(address owner, address spender) external view returns (uint256) {
    return allowed[owner][spender];
  }

  /**
   * @notice Gets the balance of the specified address using the presently stored inflation factor.
   * @param owner The address to query the balance of.
   * @return The balance of the specified address.
   */
  function balanceOf(address owner) external view returns (uint256) {
    return unitsToValue(balances[owner]);
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
   * @return rateNumerator, rateDenominator,
   * factorNumerator, factorDenominator,
   * updatePeriod
   * factorLastUpdated
   */
  function getInflationParameters()
    external
    view
    returns (uint256, uint256, uint256, uint256, uint256, uint256)
  {
    return (
      inflationState.rate.numerator,
      inflationState.rate.denominator,
      inflationState.factor.numerator,
      inflationState.factor.denominator,
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
    FractionUtil.Fraction memory updatedInflationFactor;

    (updatedInflationFactor, ) = getUpdatedInflationFactor();
    return _valueToUnits(updatedInflationFactor, value);
  }

  /**
   * @notice Returns the value of a given number of units given the current inflation factor.
   * @param units The units to convert to value.
   * @return The value corresponding to `units` given the current inflation factor.
   */
  function unitsToValue(uint256 units) public view returns (uint256) {
    FractionUtil.Fraction memory updatedInflationFactor;

    (updatedInflationFactor, ) = getUpdatedInflationFactor();

    return updatedInflationFactor.inverse().mul(units);
  }

  /**
   * @notice Returns the units for a given value given the current inflation factor.
   * @param value The value to convert to units.
   * @return The units corresponding to `value` given the current inflation factor.
   * @dev we assume any function calling this will have updated the inflation factor.
   */
  function _valueToUnits(
    FractionUtil.Fraction memory inflationFactor,
    uint256 value
  )
    private
    pure
    returns (uint256)
  {
    return inflationFactor.mul(value);
  }

  /**
   * @notice Computes the up-to-date inflation factor.
   * @return numerator, denominator of the current inflation factor.
   * @return lastUpdated time when the returned inflation factor went into effect.
   */
  function getUpdatedInflationFactor()
    private
    view
    returns (FractionUtil.Fraction memory, uint256)
  {
    /* solhint-disable not-rely-on-time */
    if (now < inflationState.factorLastUpdated.add(inflationState.updatePeriod)) {
      return (inflationState.factor, inflationState.factorLastUpdated);
    }

    uint256 numerator;
    uint256 denominator;

    // TODO: handle retroactive updates given decreases to updatePeriod:
    // https://github.com/celo-org/celo-monorepo/issues/3929
    uint256 timesToApplyInflation = now.sub(inflationState.factorLastUpdated).div(
      inflationState.updatePeriod
    );

    (numerator, denominator) = fractionMulExp(
      inflationState.factor.numerator,
      inflationState.factor.denominator,
      inflationState.rate.numerator,
      inflationState.rate.denominator,
      timesToApplyInflation,
      decimals_
    );

    // This should never happen. If something went wrong updating the
    // inflation factor, keep the previous factor
    if (numerator == 0 || denominator == 0) {
      return (inflationState.factor, inflationState.factorLastUpdated);
    }

    FractionUtil.Fraction memory currentInflationFactor = FractionUtil.Fraction(
      numerator,
      denominator
    ).reduce();

    uint256 lastUpdated = inflationState.factorLastUpdated.add(
      inflationState.updatePeriod.mul(timesToApplyInflation)
    );

    return (currentInflationFactor, lastUpdated);
    /* solhint-enable not-rely-on-time */
  }

  /**
   * @notice calculate a * b^x for fractions a, b to `decimals` precision
   * @param aNumerator Numerator of first fraction
   * @param aDenominator Denominator of first fraction
   * @param bNumerator Numerator of exponentiated fraction
   * @param bDenominator Denominator of exponentiated fraction
   * @param exponent exponent to raise b to
   * @param _decimals precision
   * @return numererator/denominator of the computed quantity (not reduced).
   */
  function fractionMulExp(
    uint256 aNumerator,
    uint256 aDenominator,
    uint256 bNumerator,
    uint256 bDenominator,
    uint256 exponent,
    uint256 _decimals
  )
    public
    view
    returns(uint256, uint256)
  {
    require(aDenominator != 0 && bDenominator != 0);
    uint256 returnNumerator;
    uint256 returnDenominator;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      let newCallDataPosition := mload(0x40)
      mstore(0x40, add(newCallDataPosition, calldatasize))
      mstore(newCallDataPosition, aNumerator)
      mstore(add(newCallDataPosition, 32), aDenominator)
      mstore(add(newCallDataPosition, 64), bNumerator)
      mstore(add(newCallDataPosition, 96), bDenominator)
      mstore(add(newCallDataPosition, 128), exponent)
      mstore(add(newCallDataPosition, 160), _decimals)
      let delegatecallSuccess := staticcall(
        1050,                 // estimated gas cost for this function
        0xfc,
        newCallDataPosition,
        0xc4,                 // input size, 6 * 32 = 192 bytes
        0,
        0
      )

      let returnDataSize := returndatasize
      let returnDataPosition := mload(0x40)
      mstore(0x40, add(returnDataPosition, returnDataSize))
      returndatacopy(returnDataPosition, 0, returnDataSize)

      switch delegatecallSuccess
      case 0 {
        revert(returnDataPosition, returnDataSize)
      }
      default {
        returnNumerator := mload(returnDataPosition)
        returnDenominator := mload(add(returnDataPosition, 32))
      }
    }
    return (returnNumerator, returnDenominator);
  }

  /**
   * @notice Transfers `value` from `msg.sender` to `to`
   * @param to The address to transfer to.
   * @param value The amount to be transferred.
   */
   // solhint-disable-next-line no-simple-event-func-name
  function transfer(address to, uint256 value) public updateInflationFactor returns (bool) {
    return _transfer(to, value);
  }

  /**
   * @notice Deduct balance for making payments for gas in this StableToken currency.
   * @param from The account to debit balance from
   * @param value The value of balance to debit
   */
  function debitFrom(address from, uint256 value) public onlyVm updateInflationFactor {
    uint256 units = _valueToUnits(inflationState.factor, value);
    totalSupply_ = totalSupply_.sub(units);
    balances[from] = balances[from].sub(units);
  }

  /**
   * @notice Refund balance after making payments for gas in this StableToken currency.
   * @param to The account to credit balance to
   * @param value The amount of balance to credit
   * @dev We can assume that the inflation factor is up to date as `debitFrom`
   * will have been called in the same transaction
   */
  function creditTo(address to, uint256 value) public onlyVm {
    uint256 units = _valueToUnits(inflationState.factor, value);
    totalSupply_ = totalSupply_.add(units);
    balances[to] = balances[to].add(units);
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

}
