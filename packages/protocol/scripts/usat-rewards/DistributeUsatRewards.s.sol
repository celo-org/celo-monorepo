// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.15;

import "forge-std-8/Script.sol";

interface IERC20 {
  function transfer(address to, uint256 value) external returns (bool);
  function balanceOf(address owner) external view returns (uint256);
  function decimals() external view returns (uint8);
  function symbol() external view returns (string memory);
}

/**
 * @title DistributeUsatRewards
 * @notice Pays out USA₮ launch-campaign rewards (the P2P + hold milestones) from a
 *         hot wallet to the accounts listed in a recipients JSON file produced from
 *         the Dune per-account rewards ledger (query 7506058).
 *
 * Double-payment protection is layered, with the on-chain record as the authority:
 *
 *   1. The Dune ledger computes owed = earned − paid, where paid is the USA₮ the
 *      distributor wallet already sent to each recipient on-chain — a wallet paid
 *      its 0.30 in the past is listed owing only the remainder. fetch-recipients.py
 *      triggers a FRESH execution before every run, folds in any local-ledger
 *      surplus Dune has not indexed yet, and then clears the ledger's amounts.
 *   2. The local paid ledger (recorded from broadcast receipts) therefore only
 *      ever holds payments made after the last fetch; this script subtracts it
 *      in full. A payment is counted exactly once — either by Dune or by the
 *      ledger, never both.
 *
 * Re-running with the same file — including after a mid-run failure — therefore
 * only sends the outstanding remainder, and a fully-paid list sends nothing.
 *
 * Both files share the shape (lists index-aligned, wallets strictly ascending):
 *   {
 *     "recipients": ["0x...", ...],
 *     "amounts":    [200000, ...]    // micro-USA₮
 *   }
 *
 * Environment variables:
 *   RECIPIENTS_FILE   owed list (default: scripts/usat-rewards/recipients.json)
 *   PAID_LEDGER_FILE  local payout history (default: scripts/usat-rewards/paid-ledger.json;
 *                     a missing file means "trust Dune alone")
 *   USAT_ADDRESS      token address (default: canonical USA₮ on Celo mainnet)
 *   MAX_PER_WALLET    per-wallet cap in micro-USA₮ (default: 5000000 = 5 USA₮, the
 *                     campaign maximum after the 10x bump of 2026-09-02: P2P 2.00
 *                     + hold 3.00); any larger owed entry aborts the run
 *   PRIVATE_KEY       hot wallet key; if unset, supply a signer on the command line
 *
 * Always simulate first (run without --broadcast) and check the logged totals.
 */
contract DistributeUsatRewards is Script {
  address internal constant USAT_MAINNET = 0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771;

  function run() external {
    string memory recipientsPath = vm.envOr(
      "RECIPIENTS_FILE",
      string("scripts/usat-rewards/recipients.json")
    );
    string memory paidLedgerPath = vm.envOr(
      "PAID_LEDGER_FILE",
      string("scripts/usat-rewards/paid-ledger.json")
    );
    IERC20 usat = IERC20(vm.envOr("USAT_ADDRESS", USAT_MAINNET));
    uint256 maxPerWallet = vm.envOr("MAX_PER_WALLET", uint256(5_000_000));

    string memory json = vm.readFile(recipientsPath);
    (address[] memory recipients, uint256[] memory owed) = parseEntries(json);
    require(recipients.length > 0, "empty recipients list");

    for (uint256 i = 0; i < recipients.length; i++) {
      require(owed[i] > 0, "zero amount");
      require(owed[i] <= maxPerWallet, "amount exceeds MAX_PER_WALLET");
    }

    uint256[] memory payable_ = subtractPaid(recipients, owed, paidLedgerPath);

    uint256 total = 0;
    uint256 outstanding = 0;
    for (uint256 i = 0; i < payable_.length; i++) {
      if (payable_[i] > 0) {
        total += payable_[i];
        outstanding++;
      }
    }

    uint256 key = vm.envOr("PRIVATE_KEY", uint256(0));
    address sender = key != 0 ? vm.addr(key) : msg.sender;

    console.log("Token:", address(usat), usat.symbol());
    console.log("Hot wallet:", sender);
    console.log("Recipients in file:", recipients.length);
    console.log("Already fully paid (skipped):", recipients.length - outstanding);
    console.log("Outstanding recipients:", outstanding);
    console.log("Total payout (micro-USAT):", total);

    if (total == 0) {
      console.log("Nothing to pay - every recipient is already covered.");
      return;
    }

    uint256 balance = usat.balanceOf(sender);
    console.log("Hot wallet balance (micro-USAT):", balance);
    require(balance >= total, "hot wallet balance below total payout");

    if (key != 0) {
      vm.startBroadcast(key);
    } else {
      vm.startBroadcast();
    }
    for (uint256 i = 0; i < payable_.length; i++) {
      if (payable_[i] > 0) {
        require(usat.transfer(recipients[i], payable_[i]), "transfer failed");
      }
    }
    vm.stopBroadcast();

    console.log("Done. Paid wallets:", outstanding);
    console.log("Paid total (micro-USAT):", total);
    console.log("Record this run: ./scripts/usat-rewards/record-payments.py updates the paid ledger.");
  }

  /// Parses and validates {recipients, amounts} from a JSON document. The
  /// strictly-ascending requirement doubles as an O(n) duplicate check and
  /// enables the two-pointer merge below.
  function parseEntries(
    string memory json
  ) internal pure returns (address[] memory recipients, uint256[] memory amounts) {
    recipients = vm.parseJsonAddressArray(json, ".recipients");
    amounts = vm.parseJsonUintArray(json, ".amounts");
    require(recipients.length == amounts.length, "recipients/amounts length mismatch");
    for (uint256 i = 0; i < recipients.length; i++) {
      require(recipients[i] != address(0), "zero-address recipient");
      if (i > 0) {
        require(recipients[i] > recipients[i - 1], "recipients not strictly ascending");
      }
    }
  }

  /// Subtracts the local paid ledger from the owed amounts (floored at 0).
  /// The owed amounts are already net of every payment Dune had indexed at fetch
  /// time, and fetch-recipients.py folds any ledger surplus into them and then
  /// clears the ledger's amounts — so post-fetch the ledger only ever contains
  /// payments made AFTER the fetch, and full subtraction here never counts a
  /// payment twice. Both lists are strictly ascending: two-pointer merge, O(n).
  function subtractPaid(
    address[] memory recipients,
    uint256[] memory owed,
    string memory paidLedgerPath
  ) internal returns (uint256[] memory payable_) {
    payable_ = new uint256[](recipients.length);
    for (uint256 i = 0; i < owed.length; i++) {
      payable_[i] = owed[i];
    }
    if (!vm.isFile(paidLedgerPath)) {
      console.log("Paid ledger not found (trusting the Dune snapshot alone):", paidLedgerPath);
      return payable_;
    }
    (address[] memory paidWallets, uint256[] memory paidAmounts) = parseEntries(
      vm.readFile(paidLedgerPath)
    );
    uint256 j = 0;
    for (uint256 i = 0; i < recipients.length; i++) {
      while (j < paidWallets.length && paidWallets[j] < recipients[i]) {
        j++;
      }
      if (j < paidWallets.length && paidWallets[j] == recipients[i]) {
        payable_[i] = paidAmounts[j] >= owed[i] ? 0 : owed[i] - paidAmounts[j];
      }
    }
  }
}
