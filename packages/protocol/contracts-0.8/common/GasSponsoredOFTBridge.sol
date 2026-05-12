// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts8/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts8/token/ERC20/utils/SafeERC20.sol";

import "../../contracts/stability/interfaces/ISortedOracles.sol";
import "./interfaces/ILayerZeroOFT.sol";

/**
 * @title GasSponsoredOFTBridge
 * @notice Enables users to bridge tokens out of Celo via LayerZero OFT without holding CELO.
 * The contract sponsors the CELO needed for the LayerZero messaging fee and charges the user
 * the equivalent amount in the bridged token, using Celo's SortedOracles for the CELO/token
 * exchange rate.
 *
 * Supports multiple tokens — each registered OFT is mapped to its token and oracle config.
 *
 * Combined with Celo's fee currency system (where transaction gas can also be paid in USDT),
 * this allows the entire bridge operation to be paid in a single stablecoin.
 *
 * Adapted from Arbitrum's TransactionValueHelper
 * (0xa90f03c856D01F698E7071B393387cd75a8a319A) for the Celo ecosystem.
 */
contract GasSponsoredOFTBridge is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  // ---------------------------------------------------------------------------
  // Types
  // ---------------------------------------------------------------------------

  struct OFTConfig {
    IERC20 token; // The ERC-20 token the OFT bridges (e.g. USDT, USDC)
    address oracleRateFeedId; // Rate feed ID for this token in SortedOracles
    uint256 tokenPrecision; // 10^decimals of the token (e.g. 1e6 for USDT)
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  event LogSetMaxGas(uint256 maxGas);
  event LogSetPriceFactor(uint256 oldPriceFactor, uint256 newPriceFactor);
  event LogSetSortedOracles(address indexed oldOracle, address indexed newOracle);
  event LogOperatorChanged(address indexed operator, bool enabled);
  event LogOFTConfigSet(
    address indexed oft,
    address indexed token,
    address oracleRateFeedId,
    uint256 tokenPrecision
  );
  event LogOFTConfigRemoved(address indexed oft);
  event LogSend(
    address indexed sender,
    address indexed oft,
    uint256 amountLD,
    uint256 nativeFee,
    uint256 feeInToken,
    uint256 totalAmount
  );
  event LogExecute(address indexed operator, address indexed target, uint256 value, bytes data);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /// @notice Maximum CELO (in wei) the contract will spend per send() call.
  uint256 public maxGas;

  /// @notice Precision constant for CELO (18 decimals).
  uint256 public constant NATIVE_PRECISION = 1e18;

  /// @notice Markup applied to the oracle rate (12000 / 10000 = 1.2x by default).
  uint256 public priceFactor;
  uint256 public constant PRICE_FACTOR_PRECISION = 10_000;

  /// @notice Celo SortedOracles contract for CELO/token exchange rates.
  ISortedOracles public sortedOracles;

  /// @notice Addresses authorized to call execute().
  mapping(address => bool) public operators;

  /// @notice Registered OFT contracts and their token configuration.
  /// @dev If oftConfigs[oft].token == address(0), the OFT is not registered.
  mapping(address => OFTConfig) public oftConfigs;

  // ---------------------------------------------------------------------------
  // Modifiers
  // ---------------------------------------------------------------------------

  modifier onlyOperators() {
    require(operators[msg.sender] || msg.sender == owner(), "Not operator or owner");
    _;
  }

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  /**
   * @param _sortedOracles Address of the Celo SortedOracles contract.
   * @param _maxGas Initial cap on CELO spent per send() call.
   */
  constructor(ISortedOracles _sortedOracles, uint256 _maxGas) {
    require(address(_sortedOracles) != address(0), "Oracle is zero address");

    sortedOracles = _sortedOracles;
    maxGas = _maxGas;
    priceFactor = 12_000; // 1.2x default markup
  }

  receive() external payable {}

  // ---------------------------------------------------------------------------
  // Core
  // ---------------------------------------------------------------------------

  /**
   * @notice Bridge tokens via LayerZero OFT, paying both the bridge amount and LZ
   *         messaging fee in the OFT's token. The contract fronts the CELO for the
   *         messaging fee and charges the caller the equivalent in the token (plus markup).
   * @dev The caller must have approved this contract for at least
   *      `_sendParam.amountLD + feeInToken` of the OFT's token. Use quoteSend() to
   *      estimate the total.
   * @param _oft The registered OFT contract to route the bridge through.
   * @param _sendParam LayerZero SendParam (destination, recipient, amount, etc.).
   * @param _fee LayerZero MessagingFee (nativeFee, lzTokenFee).
   * @return msgReceipt LayerZero messaging receipt.
   * @return oftReceipt OFT receipt with actual amounts sent/received.
   */
  function send(
    IOFT _oft,
    SendParam calldata _sendParam,
    MessagingFee calldata _fee
  )
    external
    nonReentrant
    returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt)
  {
    OFTConfig memory config = oftConfigs[address(_oft)];
    require(address(config.token) != address(0), "OFT not registered");
    require(_fee.lzTokenFee == 0, "LZ token fee not supported");
    require(_fee.nativeFee <= maxGas, "Gas limit exceeded");
    require(address(this).balance >= _fee.nativeFee, "Insufficient CELO balance");

    uint256 celoBefore = address(this).balance;

    // Pull bridge amount from user and approve OFT to spend it.
    config.token.safeTransferFrom(msg.sender, address(this), _sendParam.amountLD);
    // Reset allowance to 0 first to avoid safeApprove revert on non-zero -> non-zero.
    config.token.safeApprove(address(_oft), 0);
    config.token.safeApprove(address(_oft), _sendParam.amountLD);

    // Execute the OFT send, sponsoring the CELO.
    (msgReceipt, oftReceipt) = _oft.send{ value: _fee.nativeFee }(_sendParam, _fee, address(this));

    // Reset leftover allowance to prevent dangling approvals.
    config.token.safeApprove(address(_oft), 0);

    // Calculate how much CELO was actually spent.
    uint256 celoSpent = celoBefore - address(this).balance;

    // Convert CELO spent to token amount using oracle rate + markup.
    uint256 feeInToken = _celoToToken(celoSpent, config);

    // Charge the user for the CELO that was spent.
    config.token.safeTransferFrom(msg.sender, address(this), feeInToken);

    emit LogSend(
      msg.sender,
      address(_oft),
      _sendParam.amountLD,
      celoSpent,
      feeInToken,
      _sendParam.amountLD + feeInToken
    );
  }

  /**
   * @notice Estimate the total token amount a user needs for a send() call.
   * @param _oft The OFT contract (must be registered).
   * @param _sendParam The send parameters (only amountLD is used).
   * @param _fee The messaging fee (only nativeFee is used).
   * @return totalAmount amountLD + fee converted to token.
   */
  function quoteSend(
    IOFT _oft,
    SendParam calldata _sendParam,
    MessagingFee calldata _fee
  ) external view returns (uint256 totalAmount) {
    OFTConfig memory config = oftConfigs[address(_oft)];
    require(address(config.token) != address(0), "OFT not registered");
    uint256 feeInToken = _celoToToken(_fee.nativeFee, config);
    totalAmount = _sendParam.amountLD + feeInToken;
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  /**
   * @notice Register an OFT with its token and oracle configuration.
   * @param _oft The OFT contract address.
   * @param _token The ERC-20 token the OFT bridges.
   * @param _oracleRateFeedId Rate feed ID for the token in SortedOracles.
   */
  function setOFTConfig(
    address _oft,
    IERC20Metadata _token,
    address _oracleRateFeedId
  ) external onlyOwner {
    require(_oft != address(0), "OFT is zero address");
    require(address(_token) != address(0), "Token is zero address");
    require(_oracleRateFeedId != address(0), "Feed ID is zero address");

    uint256 precision = 10 ** _token.decimals();
    oftConfigs[_oft] = OFTConfig({
      token: IERC20(address(_token)),
      oracleRateFeedId: _oracleRateFeedId,
      tokenPrecision: precision
    });

    emit LogOFTConfigSet(_oft, address(_token), _oracleRateFeedId, precision);
  }

  /**
   * @notice Remove an OFT registration (disables bridging through it).
   * @param _oft The OFT contract address to remove.
   */
  function removeOFTConfig(address _oft) external onlyOwner {
    require(address(oftConfigs[_oft].token) != address(0), "OFT not registered");
    delete oftConfigs[_oft];
    emit LogOFTConfigRemoved(_oft);
  }

  function setMaxGas(uint256 _maxGas) external onlyOwner {
    maxGas = _maxGas;
    emit LogSetMaxGas(_maxGas);
  }

  function setPriceFactor(uint256 _newPriceFactor) external onlyOwner {
    require(_newPriceFactor > 0, "Price factor must be > 0");
    uint256 old = priceFactor;
    priceFactor = _newPriceFactor;
    emit LogSetPriceFactor(old, _newPriceFactor);
  }

  function setSortedOracles(ISortedOracles _sortedOracles) external onlyOwner {
    require(address(_sortedOracles) != address(0), "Oracle is zero address");
    address old = address(sortedOracles);
    sortedOracles = _sortedOracles;
    emit LogSetSortedOracles(old, address(_sortedOracles));
  }

  function setOperator(address _operator, bool _enabled) external onlyOwner {
    operators[_operator] = _enabled;
    emit LogOperatorChanged(_operator, _enabled);
  }

  /**
   * @notice Execute an arbitrary call with native value. Intended for operator
   *         maintenance tasks (e.g. withdrawing accumulated fees, rebalancing CELO).
   * @dev Cannot target this contract to prevent self-destructive calls.
   */
  function execute(address _to, uint256 _value, bytes calldata _data) external onlyOperators {
    require(_to != address(this), "Cannot call self");
    (bool success, ) = _to.call{ value: _value }(_data);
    require(success, "Execute call failed");
    emit LogExecute(msg.sender, _to, _value, _data);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /**
   * @dev Convert a CELO amount to the equivalent token amount using SortedOracles,
   *      then apply the priceFactor markup.
   *
   *      SortedOracles.medianRate(rateFeedId) returns (numerator, denominator) where
   *      numerator/denominator represents the token-per-CELO rate in fixed-point 1e24.
   *
   *      tokenAmount = celoAmount * (numerator / denominator) * (tokenPrecision / NATIVE_PRECISION)
   *                  * (priceFactor / PRICE_FACTOR_PRECISION)
   */
  function _celoToToken(
    uint256 _celoAmount,
    OFTConfig memory _config
  ) internal view returns (uint256) {
    (uint256 numerator, uint256 denominator) = sortedOracles.medianRate(_config.oracleRateFeedId);
    // denominator == 0 means no oracle rates exist (SortedOracles returns 0 when numRates == 0).
    // Note: isOldestReportExpired is NOT used here because it doesn't follow the
    // equivalentToken mapping that medianRate uses — it would always return true for
    // rate feeds that rely on an equivalent token (e.g. USDT adapter → cUSD).
    require(denominator > 0, "No oracle rate available");
    require(numerator > 0, "Oracle rate numerator is zero");

    return
      (_celoAmount * numerator * _config.tokenPrecision * priceFactor) /
      (denominator * NATIVE_PRECISION * PRICE_FACTOR_PRECISION);
  }
}
