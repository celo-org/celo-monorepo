// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";

import "./UsingRegistry.sol";
import "../common/Freezable.sol";
import "../common/FixidityLib.sol";
import "../common/Initializable.sol";

import "../common/interfaces/IFeeHandler.sol";
import "../common/interfaces/IFeeHandlerSeller.sol";

// TODO move to IStableToken when it adds method getExchangeRegistryId
import "./interfaces/IStableTokenMento.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/interfaces/ICeloToken.sol";

// Using the minimal required signatures in the interfaces so more contracts could be compatible
import "../common/libraries/ReentrancyGuard.sol";

// An implementation of FeeHandler as described in CIP-52
// See https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0052.md
contract FeeHandler is
  Ownable,
  Initializable,
  UsingRegistry,
  ICeloVersionedContract,
  Freezable,
  IFeeHandler,
  ReentrancyGuard
{
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;
  using EnumerableSet for EnumerableSet.AddressSet;

  struct TokenState {
    address handler;
    FixidityLib.Fraction maxSlippage;
    // Max amounts that can be burned in a day for a token
    uint256 dailySellLimit;
    // Max amounts that can be burned today for a token
    uint256 currentDaySellLimit;
    uint256 toDistribute;
    // Historical amounts burned by this contract
    uint256 pastBurn;
    uint256 lastLimitDay;
    uint256 toBurn;
  }

  struct Beneficiary {
    FixidityLib.Fraction fraction;
    string name;
    bool exists;
  }

  uint256 public constant FIXED1_UINT = 1000000000000000000000000;

  // Min units that can be burned
  uint256 public constant MIN_BURN = 200;

  // last day the daily limits were updated
  uint256 private deprecated_lastLimitDay; // deprecated

  // reason it's inverse it's because it used to be burnFraction and was migrated
  // ignoreRenaming_ prefix allows the tooling to ignore the variable renaming
  FixidityLib.Fraction private ignoreRenaming_inverseCarbonFraction; // 80%

  address public ignoreRenaming_carbonFeeBeneficiary;

  uint256 private deprecated_celoToBeBurned; // deprecated

  // This mapping can not be public because it contains a FixidityLib.Fraction
  // and that'd be only supported with experimental features in this
  // compiler version
  mapping(address => TokenState) private tokenStates;

  // Celo not included in this list
  EnumerableSet.AddressSet private activeTokens;
  // does not include carbon fund
  FixidityLib.Fraction private totalFractionOfOtherBeneficiaries;

  mapping(address => Beneficiary) private otherBeneficiaries;
  EnumerableSet.AddressSet private otherBeneficiariesAddresses;

  event SoldAndBurnedToken(address token, uint256 value);
  event DailyLimitSet(address tokenAddress, uint256 newLimit);
  event DailyLimitHit(address token, uint256 burning);
  event MaxSlippageSet(address token, uint256 maxSlippage);
  event DailySellLimitUpdated(uint256 amount);
  event FeeBeneficiarySet(address newBeneficiary);
  event BurnFractionSet(uint256 fraction);
  event TokenAdded(address tokenAddress, address handlerAddress);
  event TokenRemoved(address tokenAddress);
  event DistributionAmountSet(address tokenAddress, uint256 amount);
  event CarbonFractionSet(uint256 fraction);
  event BeneficiaryAdded(address beneficiary);
  event BeneficiaryNameSet(address beneficiary, string name);
  event BeneficiaryFractionSet(address beneficiary, uint256 fraction);
  event BeneficiaryRemoved(address beneficiary);

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize(
    address _registryAddress,
    address newFeeBeneficiary,
    uint256 newCarbonFraction,
    address[] calldata tokens,
    address[] calldata handlers,
    uint256[] calldata newLimits,
    uint256[] calldata newMaxSlippages
  ) external initializer {
    require(tokens.length == handlers.length, "handlers length should match tokens length");
    require(tokens.length == newLimits.length, "limits length should match tokens length");
    require(
      tokens.length == newMaxSlippages.length,
      "maxSlippage length should match tokens length"
    );

    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    _setCarbonFeeBeneficiary(newFeeBeneficiary);
    _setCarbonFraction(newCarbonFraction);

    for (uint256 i = 0; i < tokens.length; i++) {
      _addToken(tokens[i], handlers[i]);
      _setDailySellLimit(tokens[i], newLimits[i]);
      _setMaxSplippage(tokens[i], newMaxSlippages[i]);
    }
  }

  // Without this the contract cant receive Celo as native transfer
  function() external payable {}

  function setCarbonFraction(uint256 newFraction) external onlyOwner {
    _setCarbonFraction(newFraction);
  }

  function setDistributionAndBurnAmounts(address tokenAddress) external {
    return _setDistributionAndBurnAmounts(tokenStates[tokenAddress], IERC20(tokenAddress));
  }

  function changeOtherBeneficiaryAllocation(
    address beneficiary,
    uint256 _newFraction
  ) external onlyOwner {
    FixidityLib.Fraction memory newFraction = FixidityLib.wrap(_newFraction);
    _setBeneficiaryFraction(beneficiary, newFraction);
  }

  function addOtherBeneficiary(
    address beneficiary,
    uint256 _newFraction,
    string calldata name
  ) external onlyOwner {
    require(otherBeneficiaries[beneficiary].exists == false, "Beneficiary already exists");
    FixidityLib.Fraction memory newFraction = FixidityLib.wrap(_newFraction);

    otherBeneficiaries[beneficiary].exists = true;
    _setBeneficiaryFraction(beneficiary, newFraction);
    _setBeneficiaryName(beneficiary, name);
    otherBeneficiariesAddresses.add(beneficiary);

    emit BeneficiaryAdded(beneficiary);
  }

  function removeOtherBeneficiary(address beneficiary) external onlyOwner {
    require(otherBeneficiaries[beneficiary].exists, "Beneficiary not found");
    totalFractionOfOtherBeneficiaries = totalFractionOfOtherBeneficiaries.subtract(
      otherBeneficiaries[beneficiary].fraction
    );
    otherBeneficiariesAddresses.remove(beneficiary);
    delete otherBeneficiaries[beneficiary];
    emit BeneficiaryRemoved(beneficiary);
  }

  function setBeneficiaryFraction(
    address beneficiaryAddress,
    uint256 _newFraction
  ) external onlyOwner {
    FixidityLib.Fraction memory newFraction = FixidityLib.wrap(_newFraction);
    _setBeneficiaryFraction(beneficiaryAddress, newFraction);
  }

  function setBeneficiaryName(address beneficiary, string calldata name) external onlyOwner {
    _setBeneficiaryName(beneficiary, name);
  }

  /**
    @dev Sets the fee beneficiary address to the specified address.
    @param beneficiary The address to set as the fee beneficiary.
  */
  function setCarbonFeeBeneficiary(address beneficiary) external onlyOwner {
    return _setCarbonFeeBeneficiary(beneficiary);
  }

  /**
    @dev Sets the burn fraction to the specified value. Token has to have a handler set.
    @param tokenAddress The address of the token to sell
  */
  function sell(address tokenAddress) external {
    return _sell(tokenAddress);
  }

  /**
    @dev Adds a new token to the contract with the specified token and handler addresses.
    @param tokenAddress The address of the token to add.
    @param handlerAddress The address of the handler contract for the specified token.
  */
  function addToken(address tokenAddress, address handlerAddress) external onlyOwner {
    _addToken(tokenAddress, handlerAddress);
  }

  /**
    @notice Allows the owner to activate a specified token.
    @param tokenAddress The address of the token to be activated.
  */
  function activateToken(address tokenAddress) external onlyOwner {
    _activateToken(tokenAddress);
  }

  /**
    @dev Deactivates the specified token by marking it as inactive.
    @param tokenAddress The address of the token to deactivate.
  */
  function deactivateToken(address tokenAddress) external onlyOwner {
    _deactivateToken(tokenAddress);
  }

  /**
    @notice Allows the owner to set a handler contract for a specified token.
    @param tokenAddress The address of the token to set the handler for.
    @param handlerAddress The address of the handler contract to be set.
  */
  function setHandler(address tokenAddress, address handlerAddress) external onlyOwner {
    _setHandler(tokenAddress, handlerAddress);
  }

  function removeToken(address tokenAddress) external onlyOwner {
    _removeToken(tokenAddress);
  }

  /**
    @dev Distributes the available tokens for the specified token address to the fee beneficiary.
    @param tokenAddress The address of the token for which to distribute the available tokens.
  */
  function distribute(address tokenAddress) external {
    TokenState storage tokenState = tokenStates[tokenAddress];
    _setDistributionAndBurnAmounts(tokenState, IERC20(tokenAddress));
    return _distribute(tokenAddress);
  }

  /**
   * @notice Allows owner to set max slippage for a token.
   * @param token Address of the token to set.
   * @param newMax New sllipage to set, as Fixidity fraction.
   */
  function setMaxSplippage(address token, uint256 newMax) external onlyOwner {
    _setMaxSplippage(token, newMax);
  }

  /**
   * @notice Allows owner to set the daily burn limit for a token.
   * @param token Address of the token to set.
   * @param newLimit The new limit to set, in the token units.
   */
  function setDailySellLimit(address token, uint256 newLimit) external onlyOwner {
    _setDailySellLimit(token, newLimit);
  }

  /**
  @dev Burns CELO tokens according to burnFraction.
  */
  function burnCelo() external {
    return _burnCelo();
  }

  /**
    @dev Distributes the available tokens for all registered tokens to the feeBeneficiaries.
  */
  function distributeAll() external {
    return _distributeAll();
  }

  /**
    @dev Handles all the registered tokens.
  */
  function handleAll() external {
    return _handleAll();
  }

  function handle(address tokenAddress) external {
    return _handle(tokenAddress);
  }

  /**
    * @notice Allows owner to transfer tokens of this contract. It's meant for governance to
      trigger use cases not contemplated in this contract.
      CAUTION: this function does not update internal accounting, so it may leave the contract
      inconsistent. It should be used as last resort.
      @param token The address of the token to transfer.
      @param recipient The address of the recipient to transfer the tokens to.
      @param value The amount of tokens to transfer.
      @return A boolean indicating whether the transfer was successful or not.
    */
  function transfer(
    address token,
    address recipient,
    uint256 value
  ) external onlyOwner returns (bool) {
    return IERC20(token).transfer(recipient, value);
  }

  function getCeloToBeBurned() external view returns (uint256) {
    return getCeloTokenState().toBurn;
  }

  /**
   * @param token The address of the token to query.
   * @return The amount burned for a token.
   */
  function getPastBurnForToken(address token) external view returns (uint256) {
    return tokenStates[token].pastBurn;
  }

  function carbonFeeBeneficiary() external view returns (address) {
    return ignoreRenaming_carbonFeeBeneficiary;
  }

  /**
    @dev Returns the handler address for the specified token.
    @param tokenAddress The address of the token for which to return the handler.
    @return The address of the handler contract for the specified token.
  */
  function getTokenHandler(address tokenAddress) external view returns (address) {
    return tokenStates[tokenAddress].handler;
  }

  /**
    @dev Returns a boolean indicating whether the specified token is active or not.
    @param tokenAddress The address of the token for which to retrieve the active status.
    @return A boolean representing the active status of the specified token.
  */
  function getTokenActive(address tokenAddress) external view returns (bool) {
    return _getTokenActive(tokenAddress);
  }

  /**
    @dev Returns the maximum slippage percentage for the specified token.
    @param tokenAddress The address of the token for which to retrieve the maximum
     slippage percentage.
    @return The maximum slippage percentage as a uint256 value.
  */
  function getTokenMaxSlippage(address tokenAddress) external view returns (uint256) {
    return FixidityLib.unwrap(tokenStates[tokenAddress].maxSlippage);
  }

  /**
    @dev Returns the daily burn limit for the specified token.
    @param tokenAddress The address of the token for which to retrieve the daily burn limit.
    @return The daily burn limit as a uint256 value.
  */

  function getTokenDailySellLimit(address tokenAddress) external view returns (uint256) {
    return tokenStates[tokenAddress].dailySellLimit;
  }

  /**
    @dev Returns the current daily sell limit for the specified token.
    @param tokenAddress The address of the token for which to retrieve the current daily limit.
    @return The current daily limit as a uint256 value.
  */
  function getTokenCurrentDaySellLimit(address tokenAddress) external view returns (uint256) {
    return tokenStates[tokenAddress].currentDaySellLimit;
  }

  /**
    @dev Returns the amount of tokens available to distribute for the specified token.
    @param tokenAddress The address of the token for which to retrieve the amount of
    tokens available to distribute.
    @return The amount of tokens available to distribute as a uint256 value.
  */
  function getTokenToDistribute(address tokenAddress) external view returns (uint256) {
    return tokenStates[tokenAddress].toDistribute;
  }

  function getTokenToBurn(address tokenAddress) external view returns (uint256) {
    return tokenStates[tokenAddress].toBurn;
  }

  function getCarbonFraction() external view returns (uint256) {
    return getCarbonFractionFixidity().unwrap();
  }

  function getBurnFraction() external view returns (uint256) {
    return getBurnFractionFixidity().unwrap();
  }

  function getOtherBeneficiariesInfo(
    address beneficiary
  ) external view returns (uint256, string memory, bool) {
    Beneficiary storage otherBeneficiary = otherBeneficiaries[beneficiary];
    require(otherBeneficiary.exists, "Beneficiary not found");
    return (otherBeneficiary.fraction.unwrap(), otherBeneficiary.name, otherBeneficiary.exists);
  }

  function getTotalFractionOfOtherBeneficiariesAndCarbon() external view returns (uint256) {
    return getTotalFractionOfOtherBeneficiariesAndCarbonFixidity().unwrap();
  }

  function getOtherBeneficiariesAddresses() external view returns (address[] memory) {
    return otherBeneficiariesAddresses.values;
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 2, 0, 0);
  }

  /**
   * @param token The address of the token to query.
   * @param amountToBurn The amount of the token to burn.
   * @return Returns true if burning amountToBurn would exceed the daily limit.
   */
  function dailySellLimitHit(address token, uint256 amountToBurn) public returns (bool) {
    TokenState storage tokenState = tokenStates[token];

    if (tokenState.dailySellLimit == 0) {
      // if no limit set, assume uncapped
      return false;
    }

    uint256 currentDay = now / 1 days;
    // Pattern borrowed from Reserve.sol
    if (currentDay > tokenState.lastLimitDay) {
      tokenState.lastLimitDay = currentDay;
      tokenState.currentDaySellLimit = tokenState.dailySellLimit;
    }

    return amountToBurn >= tokenState.currentDaySellLimit;
  }

  function getActiveTokens() public view returns (address[] memory) {
    return activeTokens.values;
  }

  function _getBurnFraction() internal view returns (uint256) {
    return getBurnFractionFixidity().unwrap();
  }

  function _setDistributionAndBurnAmounts(TokenState storage tokenState, IERC20 token) internal {
    uint256 balanceOfToken = token.balanceOf(address(this));
    uint256 balanceToProcess = balanceOfToken.sub(tokenState.toDistribute).sub(tokenState.toBurn);
    _setDistributeAfterBurn(tokenState, balanceToProcess);

    emit DistributionAmountSet(address(token), tokenState.toDistribute);
  }

  function _executePayment(address tokenAddress, address beneficiary, uint256 amount) internal {
    require(
      _getTokenActive(tokenAddress) ||
        tokenAddress == registry.getAddressForOrDie(CELO_TOKEN_REGISTRY_ID),
      "Token needs to be active"
    );

    uint256 balanceToDistribute = amount;

    if (balanceToDistribute == 0) {
      // don't distribute with zero balance
      return;
    }

    IERC20 token = IERC20(tokenAddress);
    token.transfer(beneficiary, balanceToDistribute);
  }

  function _setDistributeAfterBurn(
    TokenState storage tokenState,
    uint256 balanceToProcess
  ) internal returns (uint256) {
    uint256 balanceToBurn = FixidityLib
      .newFixed(balanceToProcess)
      .multiply(getBurnFractionFixidity())
      .fromFixed();
    tokenState.toBurn = tokenState.toBurn.add(balanceToBurn);
    tokenState.toDistribute = tokenState.toDistribute.add(balanceToProcess.sub(balanceToBurn));
    return tokenState.toBurn;
  }

  function shouldBurn() public view returns (bool) {
    return _getBurnFraction() != 0;
  }

  function checkTotalBeneficiary() internal view {
    require(
      getTotalFractionOfOtherBeneficiariesAndCarbonFixidity().lte(FixidityLib.fixed1()),
      "Total beneficiaries fraction must be less than 1"
    );
  }

  function _setCarbonFraction(uint256 _newFraction) internal {
    FixidityLib.Fraction memory newFraction = FixidityLib.wrap(_newFraction);
    require(newFraction.lte(FixidityLib.fixed1()), "New cargon fraction can't be greather than 1");
    ignoreRenaming_inverseCarbonFraction = FixidityLib.fixed1().subtract(newFraction);
    checkTotalBeneficiary();
    emit CarbonFractionSet(_newFraction);
  }

  function _setBeneficiaryFraction(
    address beneficiaryAddress,
    FixidityLib.Fraction memory newFraction
  ) internal {
    Beneficiary storage beneficiary = otherBeneficiaries[beneficiaryAddress];
    require(beneficiary.exists, "Beneficiary not found");
    totalFractionOfOtherBeneficiaries = totalFractionOfOtherBeneficiaries.add(newFraction);
    checkTotalBeneficiary();
    beneficiary.fraction = newFraction;
    emit BeneficiaryFractionSet(beneficiaryAddress, newFraction.unwrap());
  }

  function _setBeneficiaryName(address beneficiary, string memory name) internal {
    require(otherBeneficiaries[beneficiary].exists, "Beneficiary not found");
    otherBeneficiaries[beneficiary].name = name;
    emit BeneficiaryNameSet(beneficiary, name);
  }

  function getTotalFractionOfOtherBeneficiariesAndCarbonFixidity()
    internal
    view
    returns (FixidityLib.Fraction memory)
  {
    return totalFractionOfOtherBeneficiaries.add(getCarbonFractionFixidity());
  }

  // avoid using UsingRegistry contract
  function getCeloTokenAddress() internal view returns (address) {
    return registry.getAddressForOrDie(CELO_TOKEN_REGISTRY_ID);
  }

  function getCarbonFractionFixidity() internal view returns (FixidityLib.Fraction memory) {
    return FixidityLib.fixed1().subtract(ignoreRenaming_inverseCarbonFraction);
  }

  function getBurnFractionFixidity() internal view returns (FixidityLib.Fraction memory) {
    return FixidityLib.fixed1().subtract(getTotalFractionOfOtherBeneficiariesAndCarbonFixidity());
  }

  function _getTokenActive(address tokenAddress) internal view returns (bool) {
    return activeTokens.contains(tokenAddress);
  }

  /**
   * @notice Burns all the Celo balance of this contract.
   */
  function _burnCelo() private {
    address celoTokenAddress = getCeloTokenAddress();
    TokenState storage tokenState = tokenStates[celoTokenAddress];
    _setDistributionAndBurnAmounts(tokenState, IERC20(celoTokenAddress));

    if (tokenState.toBurn == 0) {
      return;
    }

    ICeloToken(celoTokenAddress).burn(tokenState.toBurn);
    tokenState.toBurn = 0;
  }

  /**
   * @notice Updates the current day limit for a token.
   * @param token The address of the token to query.
   * @param amountBurned the amount of the token that was burned.
   */
  function updateLimits(address token, uint256 amountBurned) private {
    TokenState storage tokenState = tokenStates[token];

    if (tokenState.dailySellLimit == 0) {
      // if no limit set, assume uncapped
      return;
    }
    tokenState.currentDaySellLimit = tokenState.currentDaySellLimit.sub(amountBurned);
    emit DailySellLimitUpdated(amountBurned);
  }

  function _setCarbonFeeBeneficiary(address beneficiary) private {
    ignoreRenaming_carbonFeeBeneficiary = beneficiary;
    emit FeeBeneficiarySet(beneficiary);
  }

  function _addToken(address tokenAddress, address handlerAddress) private {
    require(handlerAddress != address(0), "Can't set handler to zero");
    TokenState storage tokenState = tokenStates[tokenAddress];
    tokenState.handler = handlerAddress;

    activeTokens.add(tokenAddress);
    emit TokenAdded(tokenAddress, handlerAddress);
  }

  function _activateToken(address tokenAddress) private {
    TokenState storage tokenState = tokenStates[tokenAddress];
    require(
      tokenState.handler != address(0) || tokenAddress == getCeloTokenAddress(),
      "Handler has to be set to activate token"
    );
    activeTokens.add(tokenAddress);
  }

  function _deactivateToken(address tokenAddress) private {
    activeTokens.remove(tokenAddress);
  }

  function _setHandler(address tokenAddress, address handlerAddress) private {
    require(handlerAddress != address(0), "Can't set handler to zero, use deactivateToken");
    TokenState storage tokenState = tokenStates[tokenAddress];
    tokenState.handler = handlerAddress;
  }

  function _removeToken(address tokenAddress) private {
    _deactivateToken(tokenAddress);
    TokenState storage tokenState = tokenStates[tokenAddress];
    tokenState.handler = address(0);
    emit TokenRemoved(tokenAddress);
  }

  function _sell(address tokenAddress) private onlyWhenNotFrozen nonReentrant {
    if (!shouldBurn()) {
      return;
    }
    IERC20 token = IERC20(tokenAddress);

    TokenState storage tokenState = tokenStates[tokenAddress];
    require(_getTokenActive(tokenAddress), "Token needs to be active to sell");
    require(
      FixidityLib.unwrap(tokenState.maxSlippage) != 0,
      "Max slippage has to be set to sell token"
    );

    _setDistributionAndBurnAmounts(tokenState, token);

    uint256 balanceToBurn = tokenState.toBurn;

    if (dailySellLimitHit(tokenAddress, balanceToBurn)) {
      // in case the limit is hit, burn the max possible
      balanceToBurn = tokenState.currentDaySellLimit;
      emit DailyLimitHit(tokenAddress, balanceToBurn);
    }

    // small numbers cause rounding errors and zero case should be skipped
    if (balanceToBurn < MIN_BURN) {
      return;
    }

    token.transfer(tokenState.handler, balanceToBurn);
    IFeeHandlerSeller handler = IFeeHandlerSeller(tokenState.handler);

    uint256 celoReceived = handler.sell(
      tokenAddress,
      getCeloTokenAddress(),
      balanceToBurn,
      FixidityLib.unwrap(tokenState.maxSlippage)
    );

    // substract from toBurn only the amount that was burned
    tokenState.toBurn = tokenState.toBurn.sub(balanceToBurn);
    getCeloTokenState().toBurn = getCeloTokenState().toBurn.add(celoReceived);
    tokenState.pastBurn = tokenState.pastBurn.add(balanceToBurn);
    updateLimits(tokenAddress, balanceToBurn);

    emit SoldAndBurnedToken(tokenAddress, balanceToBurn);
  }

  function _calculateDistributeAmounts(
    FixidityLib.Fraction memory thisTokenFraction,
    FixidityLib.Fraction memory totalFractionOfOtherBeneficiariesAndCarbonFixidity,
    uint256 toDistribute
  ) private pure returns (uint256) {
    FixidityLib.Fraction memory proportionOfThisToken = thisTokenFraction.divide(
      totalFractionOfOtherBeneficiariesAndCarbonFixidity
    );

    FixidityLib.Fraction memory toDistributeFraction = FixidityLib.newFixed(toDistribute).multiply(
      proportionOfThisToken
    );

    return toDistributeFraction.fromFixed();
  }

  function _distribute(address tokenAddress) private onlyWhenNotFrozen nonReentrant {
    require(
      ignoreRenaming_carbonFeeBeneficiary != address(0),
      "Can't distribute to the zero address"
    );
    TokenState storage tokenState = tokenStates[tokenAddress];

    FixidityLib.Fraction
      memory totalFractionOfOtherBeneficiariesAndCarbonFixidity = getTotalFractionOfOtherBeneficiariesAndCarbonFixidity();

    uint256 carbonFundAmount = _calculateDistributeAmounts(
      getCarbonFractionFixidity(),
      totalFractionOfOtherBeneficiariesAndCarbonFixidity,
      tokenState.toDistribute
    );

    _executePayment(tokenAddress, ignoreRenaming_carbonFeeBeneficiary, carbonFundAmount);

    for (uint256 i = 0; i < EnumerableSet.length(otherBeneficiariesAddresses); i++) {
      address beneficiary = otherBeneficiariesAddresses.get(i);
      Beneficiary storage otherBeneficiary = otherBeneficiaries[beneficiary];

      uint256 amount = _calculateDistributeAmounts(
        otherBeneficiary.fraction,
        totalFractionOfOtherBeneficiariesAndCarbonFixidity,
        tokenState.toDistribute
      );

      _executePayment(tokenAddress, beneficiary, amount);
    }

    tokenState.toDistribute = 0;
  }

  function _setMaxSplippage(address token, uint256 newMax) private {
    TokenState storage tokenState = tokenStates[token];
    require(newMax != 0, "Cannot set max slippage to zero");
    tokenState.maxSlippage = FixidityLib.wrap(newMax);
    require(
      FixidityLib.lte(tokenState.maxSlippage, FixidityLib.fixed1()),
      "Splippage must be less than or equal to 1"
    );
    emit MaxSlippageSet(token, newMax);
  }

  function _setDailySellLimit(address token, uint256 newLimit) private {
    TokenState storage tokenState = tokenStates[token];
    tokenState.dailySellLimit = newLimit;
    emit DailyLimitSet(token, newLimit);
  }

  function _distributeAll() private {
    for (uint256 i = 0; i < EnumerableSet.length(activeTokens); i++) {
      address token = activeTokens.get(i);
      _distribute(token);
    }
    // distribute Celo
    _distribute(getCeloTokenAddress());
  }

  function _handleAll() private {
    _handle(activeTokens.values);
  }

  function _handleCelo() private {
    _burnCelo();
    address celoToken = getCeloTokenAddress();
    _distribute(celoToken);
  }

  // tokenAddress can be Celo
  function _handle(address tokenAddress) private {
    address celoToken = getCeloTokenAddress();
    if (tokenAddress != celoToken) {
      _sell(tokenAddress);
      _distribute(tokenAddress);
    }
    _handleCelo();
  }

  // tokenAddresses should not contain the Celo address
  function _handle(address[] memory tokenAddresses) private {
    // Celo doesn't have to be exchanged for anything
    for (uint256 i = 0; i < tokenAddresses.length; i++) {
      address token = tokenAddresses[i];
      _sell(token);
      _distribute(token);
    }

    _handleCelo();
  }

  function getCeloTokenState() private view returns (TokenState storage) {
    return tokenStates[getCeloTokenAddress()];
  }
}
