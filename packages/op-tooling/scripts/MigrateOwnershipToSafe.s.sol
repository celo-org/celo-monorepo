// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IProxyAdmin } from "interfaces/universal/IProxyAdmin.sol";
import { IAddressManager } from "interfaces/legacy/IAddressManager.sol";
import { ISystemConfig } from "interfaces/L1/ISystemConfig.sol";
import { IDisputeGameFactory } from "interfaces/dispute/IDisputeGameFactory.sol";

/// @title MigrateOwnershipToSafe
/// @notice Migrates OP Stack L1 contract ownership from an EOA to a Gnosis Safe.
///         Performs 4 operations in a single broadcast:
///           1. ProxyAdmin.transferOwnership()        - controls all proxy upgrades + AddressManager
///           2. SystemConfig.transferOwnership()       - owns L2 system configuration parameters
///           3. DisputeGameFactory.transferOwnership() - owns game type registration + implementations
///           4. SuperchainConfig changeProxyAdmin()    - migrates from separate ProxyAdmin to main one
///
///         After execution, the Safe controls:
///           - All ERC1967 proxy upgrades (via ProxyAdmin)
///           - L1CrossDomainMessenger (via AddressManager, owned by ProxyAdmin)
///           - SystemConfig parameters
///           - DisputeGameFactory game implementations
///           - SuperchainConfig upgrades (now under main ProxyAdmin)
///
///         Env vars (all required):
///           NEW_SAFE              - address of the target Gnosis Safe
///           PROXY_ADMIN           - ProxyAdmin contract address
///           ADDRESS_MANAGER       - AddressManager contract address
///           SC_OLD_PROXY_ADMIN    - SuperchainConfig's separate ProxyAdmin (for migration)
///           SYSTEM_CONFIG         - SystemConfig proxy address
///           OPTIMISM_PORTAL       - OptimismPortal proxy address
///           L1_STANDARD_BRIDGE    - L1StandardBridge proxy address
///           L1_ERC721_BRIDGE      - L1ERC721Bridge proxy address
///           OPTIMISM_MINTABLE_ERC20_FACTORY - OptimismMintableERC20Factory proxy address
///           DISPUTE_GAME_FACTORY  - DisputeGameFactory proxy address
///           ANCHOR_STATE_REGISTRY - AnchorStateRegistry proxy address
///           DELAYED_WETH          - DelayedWETH (permissioned) proxy address
///           PROTOCOL_VERSIONS     - ProtocolVersions proxy address
///           CELO_SUPERCHAIN_CONFIG - CeloSuperchainConfig proxy address
///           SUPERCHAIN_CONFIG     - SuperchainConfig proxy address
///
///         Usage:
///           forge script MigrateOwnershipToSafe.s.sol \
///             --root $OP_DIR/packages/contracts-bedrock \
///             --rpc-url $L1_RPC_URL --private-key $PK --broadcast
contract MigrateOwnershipToSafe is Script {
  // ── Constants ────────────────────────────────────────────────────

  /// @notice EIP-1967 admin storage slot.
  bytes32 internal constant ADMIN_SLOT =
    0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

  // ── Types ────────────────────────────────────────────────────────

  /// @notice Bundled config to avoid stack-too-deep in run().
  struct Config {
    address proxyAdminAddr;
    address newSafe;
    address scOldProxyAdmin;
    IProxyAdmin proxyAdmin;
    IAddressManager addrManager;
    ISystemConfig systemConfig;
    IDisputeGameFactory dgFactory;
    address[11] proxies;
    string[11] names;
  }

  // ── Events ───────────────────────────────────────────────────────

  event OwnershipMigratedToSafe(
    address indexed proxyAdmin,
    address indexed previousOwner,
    address indexed newSafe
  );

  // ── Entry Point ──────────────────────────────────────────────────

  function run() external {
    address newSafe_ = vm.envAddress("NEW_SAFE");

    Config memory cfg_ = _loadConfig(newSafe_);

    _logHeader(cfg_);
    _preflight(cfg_, newSafe_);
    address currentOwner_ = _executeMigration(cfg_, newSafe_);
    _verifyPostMigration(cfg_);

    emit OwnershipMigratedToSafe(cfg_.proxyAdminAddr, currentOwner_, newSafe_);
  }

  // ── Config Loading ──────────────────────────────────────────────

  function _loadConfig(address _newSafe) internal returns (Config memory cfg_) {
    cfg_.newSafe = _newSafe;

    cfg_.proxyAdminAddr = vm.envAddress("PROXY_ADMIN");
    cfg_.proxyAdmin = IProxyAdmin(cfg_.proxyAdminAddr);
    cfg_.addrManager = IAddressManager(vm.envAddress("ADDRESS_MANAGER"));
    cfg_.scOldProxyAdmin = vm.envAddress("SC_OLD_PROXY_ADMIN");

    cfg_.names[0] = "SystemConfig";
    cfg_.names[1] = "OptimismPortal";
    cfg_.names[2] = "L1StandardBridge";
    cfg_.names[3] = "L1ERC721Bridge";
    cfg_.names[4] = "OptimismMintableERC20Factory";
    cfg_.names[5] = "DisputeGameFactory";
    cfg_.names[6] = "AnchorStateRegistry";
    cfg_.names[7] = "DelayedWETH";
    cfg_.names[8] = "ProtocolVersions";
    cfg_.names[9] = "CeloSuperchainConfig";
    cfg_.names[10] = "SuperchainConfig";

    cfg_.proxies[0] = vm.envAddress("SYSTEM_CONFIG");
    cfg_.proxies[1] = vm.envAddress("OPTIMISM_PORTAL");
    cfg_.proxies[2] = vm.envAddress("L1_STANDARD_BRIDGE");
    cfg_.proxies[3] = vm.envAddress("L1_ERC721_BRIDGE");
    cfg_.proxies[4] = vm.envAddress("OPTIMISM_MINTABLE_ERC20_FACTORY");
    cfg_.proxies[5] = vm.envAddress("DISPUTE_GAME_FACTORY");
    cfg_.proxies[6] = vm.envAddress("ANCHOR_STATE_REGISTRY");
    cfg_.proxies[7] = vm.envAddress("DELAYED_WETH");
    cfg_.proxies[8] = vm.envAddress("PROTOCOL_VERSIONS");
    cfg_.proxies[9] = vm.envAddress("CELO_SUPERCHAIN_CONFIG");
    cfg_.proxies[10] = vm.envAddress("SUPERCHAIN_CONFIG");

    cfg_.systemConfig = ISystemConfig(cfg_.proxies[0]);
    cfg_.dgFactory = IDisputeGameFactory(cfg_.proxies[5]);
  }

  // ── Logging ──────────────────────────────────────────────────────

  function _logHeader(Config memory _cfg) internal pure {
    console.log("");
    console.log("=== MigrateOwnershipToSafe ===");
    console.log("  Target Safe:    ", _cfg.newSafe);
    console.log("  ProxyAdmin:     ", _cfg.proxyAdminAddr);
    console.log("  AddressManager: ", address(_cfg.addrManager));
    console.log("  SC Old Admin:   ", _cfg.scOldProxyAdmin);
    console.log("");
  }

  // ── Pre-flight Checks ────────────────────────────────────────────

  function _preflight(Config memory _cfg, address _newSafe) internal view {
    console.log("=== Pre-flight Checks ===");
    console.log("");

    // 1. ProxyAdmin ownership
    address currentOwner_ = _cfg.proxyAdmin.owner();
    console.log("ProxyAdmin owner:", currentOwner_);
    require(currentOwner_ != _newSafe, "ProxyAdmin already owned by target Safe");
    require(currentOwner_ != address(0), "ProxyAdmin has zero owner");

    // 2. AddressManager ownership
    address amOwner_ = _cfg.addrManager.owner();
    console.log("AddressManager owner:", amOwner_);
    if (amOwner_ != _cfg.proxyAdminAddr) {
      console.log("  [WARN] AddressManager NOT owned by ProxyAdmin");
      console.log("         Expected:", _cfg.proxyAdminAddr);
      console.log("         Actual:  ", amOwner_);
      console.log("         L1CrossDomainMessenger may need separate ownership transfer");
    } else {
      console.log("  [OK] Owned by ProxyAdmin");
    }

    // 3. SystemConfig ownership
    address scOwner_ = _cfg.systemConfig.owner();
    console.log("SystemConfig owner:", scOwner_);
    if (scOwner_ == _newSafe) {
      console.log("  [SKIP] Already owned by target Safe");
    } else {
      console.log("  [OK] Will transfer from", scOwner_);
    }

    // 4. DisputeGameFactory ownership
    address dgfOwner_ = _cfg.dgFactory.owner();
    console.log("DisputeGameFactory owner:", dgfOwner_);
    if (dgfOwner_ == _newSafe) {
      console.log("  [SKIP] Already owned by target Safe");
    } else {
      console.log("  [OK] Will transfer from", dgfOwner_);
    }

    // 5. SuperchainConfig proxy admin
    address scAdmin_ = _adminOf(_cfg.proxies[10]);
    console.log("SuperchainConfig admin:", scAdmin_);
    if (scAdmin_ == _cfg.proxyAdminAddr) {
      console.log("  [SKIP] Already on correct ProxyAdmin");
    } else if (scAdmin_ == _cfg.scOldProxyAdmin) {
      address oldAdminOwner_ = IProxyAdmin(scAdmin_).owner();
      console.log("  [OK] On separate ProxyAdmin (will migrate)");
      console.log("       Old ProxyAdmin owner:", oldAdminOwner_);
    } else {
      console.log("  [!!] Unknown admin - aborting");
      console.log("       Expected:", _cfg.scOldProxyAdmin);
      console.log("       Actual:  ", scAdmin_);
      revert("SuperchainConfig has unexpected admin");
    }

    // 6. EIP-1967 admin verification (pre-transfer baseline)
    console.log("");
    console.log("=== Pre-migration: EIP-1967 Admin Verification ===");
    console.log("  (SuperchainConfig expected [!!] - will be migrated)");
    _verifyAdmins(_cfg.proxies, _cfg.names, _cfg.proxyAdminAddr);
  }

  // ── Migration Execution ──────────────────────────────────────────

  function _executeMigration(
    Config memory _cfg,
    address _newSafe
  ) internal returns (address currentOwner_) {
    currentOwner_ = _cfg.proxyAdmin.owner();
    address scOwner_ = _cfg.systemConfig.owner();
    address dgfOwner_ = _cfg.dgFactory.owner();
    address scAdmin_ = _adminOf(_cfg.proxies[10]);

    uint256 steps_;
    if (scOwner_ != _newSafe) steps_++;
    if (dgfOwner_ != _newSafe) steps_++;
    if (scAdmin_ != _cfg.proxyAdminAddr) steps_++;
    steps_++; // ProxyAdmin always transfers
    uint256 step_;

    console.log("");
    console.log("=== Executing Migration ===");
    console.log("  Target:", _newSafe);
    console.log("  Steps: ", steps_);
    console.log("");

    vm.startBroadcast();

    // Step 1: ProxyAdmin ownership (always)
    step_++;
    console.log("  [%d/%d] ProxyAdmin.transferOwnership()", step_, steps_);
    console.log("         From:", currentOwner_);
    _cfg.proxyAdmin.transferOwnership(_newSafe);

    // Step 2: SystemConfig ownership
    if (scOwner_ != _newSafe) {
      step_++;
      console.log("  [%d/%d] SystemConfig.transferOwnership()", step_, steps_);
      console.log("         From:", scOwner_);
      _cfg.systemConfig.transferOwnership(_newSafe);
    }

    // Step 3: DisputeGameFactory ownership
    if (dgfOwner_ != _newSafe) {
      step_++;
      console.log("  [%d/%d] DisputeGameFactory.transferOwnership()", step_, steps_);
      console.log("         From:", dgfOwner_);
      _cfg.dgFactory.transferOwnership(_newSafe);
    }

    // Step 4: SuperchainConfig proxy admin migration
    if (scAdmin_ != _cfg.proxyAdminAddr) {
      step_++;
      console.log("  [%d/%d] SuperchainConfig.changeProxyAdmin()", step_, steps_);
      console.log("         Old admin:", scAdmin_);
      console.log("         New admin:", _cfg.proxyAdminAddr);
      IProxyAdmin(scAdmin_).changeProxyAdmin(payable(_cfg.proxies[10]), _cfg.proxyAdminAddr);
    }

    vm.stopBroadcast();

    console.log("");
    console.log("  All %d step(s) executed.", steps_);
  }

  // ── Post-migration Verification ──────────────────────────────────

  function _verifyPostMigration(Config memory _cfg) internal view {
    console.log("");
    console.log("=== Post-migration Verification ===");

    // ProxyAdmin
    address newOwner_ = _cfg.proxyAdmin.owner();
    console.log("ProxyAdmin owner:", newOwner_);
    require(newOwner_ == _cfg.newSafe, "ProxyAdmin ownership transfer FAILED");
    console.log("  [OK] ProxyAdmin.owner() == Safe");

    // SystemConfig
    address scOwner_ = _cfg.systemConfig.owner();
    console.log("SystemConfig owner:", scOwner_);
    if (scOwner_ == _cfg.newSafe) {
      console.log("  [OK] SystemConfig.owner() == Safe");
    } else {
      console.log("  [!!] Unexpected:", scOwner_);
    }

    // DisputeGameFactory
    address dgfOwner_ = _cfg.dgFactory.owner();
    console.log("DisputeGameFactory owner:", dgfOwner_);
    if (dgfOwner_ == _cfg.newSafe) {
      console.log("  [OK] DisputeGameFactory.owner() == Safe");
    } else {
      console.log("  [!!] Unexpected:", dgfOwner_);
    }

    // AddressManager (should still be owned by ProxyAdmin)
    address amOwner_ = _cfg.addrManager.owner();
    if (amOwner_ == _cfg.proxyAdminAddr) {
      console.log("  [OK] AddressManager.owner() == ProxyAdmin");
    } else {
      console.log("  [!!] AddressManager.owner() changed:", amOwner_);
    }

    // SuperchainConfig admin
    address scAdmin_ = _adminOf(_cfg.proxies[10]);
    if (scAdmin_ == _cfg.proxyAdminAddr) {
      console.log("  [OK] SuperchainConfig admin == ProxyAdmin");
    } else {
      console.log("  [!!] SuperchainConfig admin:", scAdmin_);
    }

    // Full EIP-1967 admin verification
    console.log("");
    console.log("=== Post-migration: EIP-1967 Admin Verification ===");
    uint256 issues_ = _verifyAdmins(_cfg.proxies, _cfg.names, _cfg.proxyAdminAddr);

    console.log("");
    if (issues_ == 0) {
      console.log("[SUCCESS] All contracts verified. Ownership migrated to Safe.");
    } else {
      console.log("[WARNING] %d contract(s) have unexpected EIP-1967 admin.", issues_);
      console.log("          These may need manual changeProxyAdmin() calls.");
    }
  }

  // ── Internal Helpers ─────────────────────────────────────────────

  /// @notice Reads the EIP-1967 admin address from a proxy's storage.
  function _adminOf(address _proxy) internal view returns (address) {
    return address(uint160(uint256(vm.load(_proxy, ADMIN_SLOT))));
  }

  /// @notice Verifies EIP-1967 admin slot for all proxies.
  /// @return issues_ Number of proxies with unexpected admin.
  function _verifyAdmins(
    address[11] memory _proxies,
    string[11] memory _names,
    address _expectedAdmin
  ) internal view returns (uint256 issues_) {
    for (uint256 i = 0; i < _proxies.length; i++) {
      address admin_ = _adminOf(_proxies[i]);
      if (admin_ == _expectedAdmin) {
        console.log("  [OK]", _names[i]);
      } else {
        console.log("  [!!]", _names[i]);
        console.log("       Admin:   ", admin_);
        console.log("       Expected:", _expectedAdmin);
        issues_++;
      }
    }
  }
}
