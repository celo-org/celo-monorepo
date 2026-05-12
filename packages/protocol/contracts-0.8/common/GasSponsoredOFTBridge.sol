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
 * @author cLabs
 * @notice Enables users to bridge tokens out of Celo via LayerZero OFT without holding CELO.
 *
 * The contract pre-funds CELO to cover the LayerZero messaging fee on behalf of the user,
 * then charges the user the equivalent amount in the bridged token (e.g. USDT), converting
 * at the live Celo SortedOracles rate plus a configurable markup (default 1.2x).
 *
 * Supports multiple tokens simultaneously — each registered OFT is mapped to its own
 * ERC-20 token and oracle rate feed via the `oftConfigs` mapping.
 *
 * Combined with Celo's fee currency system (where the transaction gas itself can be paid
 * in USDT), this allows the entire bridge operation — tx gas, bridge amount, and LZ
 * messaging fee — to be paid 100% in a single stablecoin, with zero CELO required.
 *
 * Mainnet deployment: 0x60Cc7285ccA898c232FB392362A748117998acf3 (Celo, chain 42220)
 * Tested end-to-end: Celo → Arbitrum via USDT0 OFT (0xf10e161027410128e63e75d0200fb6d34b2db243)
 *
 * Adapted from Arbitrum's TransactionValueHelper
 * (0xa90f03c856D01F698E7071B393387cd75a8a319A).
 *
 * @dev Architecture:
 *
 *   User (holds only USDT)
 *     │
 *     ├─ TX gas: paid in USDT via Celo fee currency
 *     │
 *     └─ calls bridge.send(oft, sendParam, fee)
 *          │
 *          ├─ transferFrom(user → bridge, amountLD)        // pull bridge tokens
 *          ├─ approve(OFT, amountLD)
 *          ├─ OFT.send{value: celoFee}(sendParam, fee)     // bridge sponsors CELO
 *          ├─ celoSpent = celoBefore - balance              // measure actual CELO used
 *          ├─ feeInToken = _celoToToken(celoSpent)          // convert via oracle + markup
 *          ├─ transferFrom(user → bridge, feeInToken)       // charge user the fee in token
 *          └─ emit LogSend(...)
 *
 * @dev Trust model:
 *   - Owner: can register/remove OFTs, set oracle, set maxGas/priceFactor, set operators.
 *   - Operators: can call execute() for maintenance (withdraw fees, rebalance CELO).
 *     execute() is an unrestricted arbitrary-call primitive (cannot target this contract).
 *     Operators should be trusted addresses (e.g. a multisig).
 *   - Users: only interact via send(). Must approve the bridge for amountLD + feeInToken.
 *     Use quoteSend() to estimate the total before approving.
 *
 * @dev Oracle notes:
 *   - Uses SortedOracles.medianRate(rateFeedId) which returns (numerator, denominator)
 *     in 1e24 fixed-point representing the token-per-CELO rate.
 *   - The rateFeedId may differ from the token address when using the equivalentToken
 *     mapping (e.g. USDT adapter → cUSD rate feed).
 *   - isOldestReportExpired() is NOT used because it doesn't follow the equivalentToken
 *     mapping — it would always return true for adapter-based rate feeds. The
 *     denominator > 0 check is sufficient (SortedOracles returns 0 when no rates exist).
 */
contract GasSponsoredOFTBridge is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  // ---------------------------------------------------------------------------
  // Types
  // ---------------------------------------------------------------------------

  /// @notice Configuration for a registered OFT.
  /// @param token The ERC-20 token the OFT bridges (e.g. USDT at 0x48065f... on Celo).
  /// @param oracleRateFeedId The rate feed ID to query in SortedOracles for this token's
  ///        CELO exchange rate. May be a fee currency adapter address rather than the
  ///        token address itself (see MentoFeeCurrencyAdapter pattern).
  /// @param tokenPrecision 10^decimals of the token (e.g. 1e6 for 6-decimal USDT).
  struct OFTConfig {
    IERC20 token;
    address oracleRateFeedId;
    uint256 tokenPrecision;
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

  /// @notice Emitted on every successful bridge send.
  /// @param sender The user who initiated the bridge.
  /// @param oft The OFT contract used.
  /// @param amountLD The token amount bridged (in local decimals).
  /// @param nativeFee The CELO amount the bridge spent on the LZ messaging fee.
  /// @param feeInToken The token amount charged to the user for the CELO sponsorship.
  /// @param totalAmount amountLD + feeInToken (total token cost to the user).
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
  ///         Acts as a safety cap. Set to 0 to pause all sends.
  uint256 public maxGas;

  /// @notice Precision constant for CELO (18 decimals).
  uint256 public constant NATIVE_PRECISION = 1e18;

  /// @notice Markup multiplier for the fee conversion (basis: PRICE_FACTOR_PRECISION).
  ///         Default 12000 = 1.2x markup over the raw oracle rate.
  ///         Covers oracle lag, gas price volatility, and operational costs.
  uint256 public priceFactor;
  uint256 public constant PRICE_FACTOR_PRECISION = 10_000;

  /// @notice Celo SortedOracles contract used for all CELO/token exchange rate lookups.
  ISortedOracles public sortedOracles;

  /// @notice Addresses authorized to call execute() (in addition to the owner).
  mapping(address => bool) public operators;

  /// @notice Registered OFT contracts and their per-token configuration.
  /// @dev An OFT is considered registered iff oftConfigs[oft].token != address(0).
  ///      Use setOFTConfig() to register and removeOFTConfig() to deregister.
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

  /// @param _sortedOracles Address of the Celo SortedOracles contract.
  /// @param _maxGas Initial cap on CELO spent per send() call (in wei).
  constructor(ISortedOracles _sortedOracles, uint256 _maxGas) {
    require(address(_sortedOracles) != address(0), "Oracle is zero address");

    sortedOracles = _sortedOracles;
    maxGas = _maxGas;
    priceFactor = 12_000; // 1.2x default markup
  }

  /// @notice Accept CELO deposits to fund the gas sponsorship pool.
  receive() external payable {}

  // ---------------------------------------------------------------------------
  // Core
  // ---------------------------------------------------------------------------

  /**
   * @notice Bridge tokens via a registered LayerZero OFT. The contract sponsors the
   *         CELO for the LZ messaging fee and charges the caller the equivalent in the
   *         OFT's token at the live oracle rate (plus priceFactor markup).
   *
   * @dev Flow:
   *   1. Pull amountLD of token from user.
   *   2. Approve OFT and call OFT.send{value: nativeFee}().
   *   3. Measure actual CELO spent, convert to token via _celoToToken().
   *   4. Pull the fee amount from user.
   *
   * The caller must have approved this contract for at least (amountLD + feeInToken).
   * Use quoteSend() beforehand to estimate the total approval needed.
   *
   * @param _oft The registered OFT contract to route the bridge through.
   * @param _sendParam LayerZero SendParam. Note: `to` must be encoded as
   *        bytes32(uint256(uint160(recipientAddress))) for EVM destinations.
   * @param _fee LayerZero MessagingFee. Only nativeFee is supported (lzTokenFee must be 0).
   *        Obtain the correct nativeFee by calling OFT.quoteSend() beforehand.
   * @return msgReceipt LayerZero messaging receipt (contains guid, nonce, fee).
   * @return oftReceipt OFT receipt (contains amountSentLD, amountReceivedLD).
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

    // Calculate how much CELO was actually spent (may differ from _fee.nativeFee
    // if the OFT refunds unused CELO back to this contract).
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
   *         Returns amountLD + the fee converted from nativeFee at the current oracle rate.
   * @dev Reverts if the OFT is not registered or the oracle has no rate.
   *      The actual fee may differ slightly if the oracle rate changes between
   *      this call and the send() transaction.
   * @param _oft The OFT contract (must be registered).
   * @param _sendParam The send parameters (only amountLD is used for the quote).
   * @param _fee The messaging fee (only nativeFee is used for the quote).
   * @return totalAmount amountLD + feeInToken.
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
  // Admin — OFT registration
  // ---------------------------------------------------------------------------

  /**
   * @notice Register an OFT with its token and oracle configuration. Also serves as
   *         the whitelist — only registered OFTs can be used with send().
   * @dev The tokenPrecision is derived automatically from the token's decimals().
   *      Re-calling with the same _oft overwrites the previous config.
   * @param _oft The LayerZero OFT contract address (must implement IOFT.send()).
   * @param _token The ERC-20 token that the OFT bridges.
   * @param _oracleRateFeedId The SortedOracles rate feed ID for this token's CELO rate.
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
   * @notice Remove an OFT registration, disabling bridging through it.
   * @param _oft The OFT contract address to deregister.
   */
  function removeOFTConfig(address _oft) external onlyOwner {
    require(address(oftConfigs[_oft].token) != address(0), "OFT not registered");
    delete oftConfigs[_oft];
    emit LogOFTConfigRemoved(_oft);
  }

  // ---------------------------------------------------------------------------
  // Admin — global settings
  // ---------------------------------------------------------------------------

  /// @notice Update the maximum CELO the contract will spend per send() call.
  function setMaxGas(uint256 _maxGas) external onlyOwner {
    maxGas = _maxGas;
    emit LogSetMaxGas(_maxGas);
  }

  /// @notice Update the fee markup multiplier (basis: PRICE_FACTOR_PRECISION = 10000).
  ///         E.g. 12000 = 1.2x, 15000 = 1.5x, 10000 = no markup.
  function setPriceFactor(uint256 _newPriceFactor) external onlyOwner {
    require(_newPriceFactor > 0, "Price factor must be > 0");
    uint256 old = priceFactor;
    priceFactor = _newPriceFactor;
    emit LogSetPriceFactor(old, _newPriceFactor);
  }

  /// @notice Update the SortedOracles contract address.
  function setSortedOracles(ISortedOracles _sortedOracles) external onlyOwner {
    require(address(_sortedOracles) != address(0), "Oracle is zero address");
    address old = address(sortedOracles);
    sortedOracles = _sortedOracles;
    emit LogSetSortedOracles(old, address(_sortedOracles));
  }

  /// @notice Grant or revoke operator privileges for an address.
  function setOperator(address _operator, bool _enabled) external onlyOwner {
    operators[_operator] = _enabled;
    emit LogOperatorChanged(_operator, _enabled);
  }

  // ---------------------------------------------------------------------------
  // Admin — operator maintenance
  // ---------------------------------------------------------------------------

  /**
   * @notice Execute an arbitrary call with native value. Intended for operator
   *         maintenance: withdrawing accumulated token fees, rebalancing CELO,
   *         or emergency recovery.
   * @dev Cannot target this contract to prevent self-destructive calls.
   *      Operators are trusted — this function can call any external contract
   *      with any calldata. Ensure operators are secure (e.g. a multisig).
   * @param _to Target address (must not be this contract).
   * @param _value CELO value to send with the call.
   * @param _data Calldata for the external call.
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
   *      numerator/denominator represents the token-per-CELO rate in 1e24 fixed-point.
   *
   *      Formula:
   *        tokenAmount = celoAmount
   *                    × (numerator / denominator)        // oracle rate
   *                    × (tokenPrecision / NATIVE_PRECISION)  // decimal adjustment
   *                    × (priceFactor / PRICE_FACTOR_PRECISION) // markup
   *
   *      Example (USDT, 6 decimals, CELO ≈ $0.096, 1.2x markup):
   *        0.825 CELO → 0.825 × 0.096 × (1e6/1e18) × 1.2 = 0.094 USDT = 94,xxx units
   *
   * @param _celoAmount The CELO amount to convert (in wei, 18 decimals).
   * @param _config The OFT config containing oracleRateFeedId and tokenPrecision.
   * @return The equivalent token amount (in the token's native decimals).
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
