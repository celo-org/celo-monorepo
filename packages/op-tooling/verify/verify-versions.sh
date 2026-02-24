#!/usr/bin/env bash
set -eo pipefail

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── EIP-1967 Slots ─────────────────────────────────────────
IMPL_SLOT="0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
ADMIN_SLOT="0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"

# ── Celo Sepolia Proxy Addresses ────────────────────────────
SYSTEM_CONFIG_PROXY="0x760a5F022C9940f4A074e0030be682F560d29818"
OPTIMISM_PORTAL_PROXY="0x44AE3D41a335a7d05EB533029917aAd35662dcC2"
L1_STANDARD_BRIDGE_PROXY="0xEc18a3c30131A0Db4246e785355fBc16E2eAF408"
L1_CROSS_DOMAIN_MESSENGER_PROXY="0x70B0e58E6039831954eDE2EA1e9EF8a51680E4fD"
L1_ERC721_BRIDGE_PROXY="0xB8c8dCBCCd0f7C5e7a2184b13B85D461d8711e96"
OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY="0x261BE2eD7241feD9c746e0B5DFf3A4a335991377"
DISPUTE_GAME_FACTORY_PROXY="0x57C45d82D1a995F1e135B8D7EDc0a6BB5211cfAA"
ANCHOR_STATE_REGISTRY_PROXY="0xD73BA8168A61F3E917F0930D5C0401aA47e269D6"
SUPERCHAIN_CONFIG_PROXY="0x31bEef32135c90AE8E56Fb071B3587de289Aaf77"
CELO_SUPERCHAIN_CONFIG_PROXY="0x5c34140A1273372211Bd75184ccc9e434B38d86b"
PROTOCOL_VERSIONS_PROXY="0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd"
PERMISSIONED_DELAYED_WETH_PROXY="0x082F5f58B664CD1d51F9845fEE322aBA2cED9CbA"

# ── Non-Proxied ─────────────────────────────────────────────
PROXY_ADMIN="0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e"
PROXY_ADMIN_OWNER="0x5e60d897Cd62588291656b54655e98ee73f0aabF"
ADDRESS_MANAGER="0x8f0c6FC85A53551d87899aC2a5Af2B48C793eB63"

# ── Known Impl Addresses ───────────────────────────────────
# Returns: "initial" | "v4.1.0" | "v5.0.0" | "UNKNOWN"
# Lookup tables encoded as functions (bash 3.2 compat)
impl_lookup() {
  local name="$1"
  local addr
  addr=$(echo "$2" | tr '[:upper:]' '[:lower:]')

  case "$name" in
    SystemConfig)
      case "$addr" in
        0x1edd39f1662fa3f3c4003b013e899c2cff976377) echo "initial" ;;
        0xa9c79551ea70d311f5153a27cba12396e5128b9c) echo "v4.1.0" ;;
        0xe5dc3c0a3489b81a6f3ae3bb49bf9ccbfb85a3db) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    OptimismPortal)
      case "$addr" in
        0x229ac4d29814249ba4830eb0e5b133df664ce4d7) echo "initial" ;;
        0x661dfa933f77148dc8d84b06646a2868d7ae5deb) echo "v4.1.0" ;;
        0x2c431080fc733e259654f3b91e39468d9a85ac9b) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    L1StandardBridge)
      case "$addr" in
        0x4063c3824d993784a169470e05dacc1b8501d972) echo "initial" ;;
        0x6e3c2b6af57bc789e80bb8952cf1dfdafa804e25) echo "v4.1.0" ;;
        0xfa707f45a23370d9154af4457401274e38fa2d8a) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    L1CrossDomainMessenger)
      case "$addr" in
        0xc1dd01079a4358aec262ad5080239542433d077a) echo "initial" ;;
        0xa183a771b6c5f6e88cd351bbdc40e1ecd4521cad) echo "v4.1.0" ;;
        0xe45d2d835d0b2d3c7f4fee1eaa19a068d0ba8a88) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    L1ERC721Bridge)
      case "$addr" in
        0xef32aa47df0800b8619d0522fa82a68dd4b9a8d7) echo "initial" ;;
        0x7f1d12fb2911eb095278085f721e644c1f675696) echo "v4.1.0" ;;
        0x74f1ac50eb0be98853805d381c884f5f9abdecf9) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    OptimismMintableERC20Factory)
      case "$addr" in
        0xd6e36ca5ef4babe6f890534bd8479b9561c22f94) echo "initial" ;;
        0x6a52641d87a600ba103ccdfbe3eb02ac7e73c04a) echo "v4.1.0" ;;
        0x149bd036f5f57d0ff4b5f102c9d46e3c0eb2c016) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    DisputeGameFactory)
      case "$addr" in
        0x0468d6dfbcb060cea717459a4026339d60fb34d9) echo "initial" ;;
        0x33d1e8571a85a538ed3d5a4d88f46c112383439d) echo "v4.1.0" ;;
        0x74fac1d45b98bae058f8f566201c9a81b85c7d50) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    AnchorStateRegistry)
      case "$addr" in
        0xe8e958be5a891ff9aac5410c3923dbafd99174bb) echo "initial" ;;
        0xeb69cc681e8d4a557b30dffbad85affd47a2cf2e) echo "v4.1.0" ;;
        # v5.0.0 same as v4.1.0
        *) echo "UNKNOWN" ;;
      esac ;;
    SuperchainConfig)
      case "$addr" in
        0x1b8ca63db2e3e37c1def34f24e4c88ed422bd7c1) echo "initial" ;;
        0xce28685eb204186b557133766eca00334eb441e4) echo "v4.1.0" ;;
        0xb08cc720f511062537ca78bdb0ae691f04f5a957) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    CeloSuperchainConfig)
      case "$addr" in
        0x00cdf709c093702c8019889e7df32d1735b80355) echo "initial" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    ProtocolVersions)
      case "$addr" in
        0x9a7ca01b64ce656b927248af08692ed2714c68e0) echo "initial" ;;
        0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c) echo "v4.1.0" ;;
        0x1f734b89bb1b422b9910118fb8d44c06e33d4dda) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    DelayedWETH)
      case "$addr" in
        0xe8249b2cffc3f71e433918c5267c71bf1e1fdc1e) echo "initial" ;;
        0xb86a464cc743440fddaa43900e05318ef4818b29) echo "v4.1.0" ;;
        # v5.0.0 same as v4.1.0
        *) echo "UNKNOWN" ;;
      esac ;;
    PreimageOracle)
      case "$addr" in
        0x855828ea44a0ce2596fdf49bea5b2859c0453704) echo "initial" ;;
        0x1fb8cdfc6831fc866ed9c51af8817da5c287add3) echo "v4.1.0" ;;
        # v5.0.0 same as v4.1.0
        *) echo "UNKNOWN" ;;
      esac ;;
    MIPS)
      case "$addr" in
        0x0a691eed7be53f27f3c3b796061cdb8565da0b2a) echo "initial" ;;
        0x07babe08ee4d07dba236530183b24055535a7011) echo "v4.1.0" ;;
        0x6463dee3828677f6270d83d45408044fc5edb908) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    *) echo "UNKNOWN" ;;
  esac
}

# ── Helpers ─────────────────────────────────────────────────

addr_from_slot() {
  local raw
  raw=$(cast storage "$1" "$2" -r "$RPC_URL" 2>/dev/null || echo "0x0000000000000000000000000000000000000000000000000000000000000000")
  echo "0x${raw:26}"
}

get_version() {
  cast call "$1" "version()(string)" -r "$RPC_URL" 2>/dev/null || echo "N/A"
}

get_code_size() {
  local code
  code=$(cast code "$1" -r "$RPC_URL" 2>/dev/null || echo "0x")
  echo $(( (${#code} - 2) / 2 ))
}

classify_address() {
  local addr="$1"
  local size
  size=$(get_code_size "$addr")
  if [ "$size" -eq 0 ]; then
    echo "EOA"
    return
  fi
  local threshold
  threshold=$(cast call "$addr" "getThreshold()(uint256)" -r "$RPC_URL" 2>/dev/null || echo "")
  if [ -n "$threshold" ] && [ "$threshold" != "0" ]; then
    local owners
    owners=$(cast call "$addr" "getOwners()(address[])" -r "$RPC_URL" 2>/dev/null || echo "[]")
    echo "Safe (threshold=$threshold, owners=$owners)"
    return
  fi
  local owner
  owner=$(cast call "$addr" "owner()(address)" -r "$RPC_URL" 2>/dev/null || echo "")
  if [ -n "$owner" ] && [ "$owner" != "0x0000000000000000000000000000000000000000" ]; then
    echo "Contract (owner=$owner)"
    return
  fi
  echo "Contract (${size}B)"
}

colorize_tag() {
  local tag="$1"
  case "$tag" in
    initial)  echo -e "${YELLOW}v3 (initial)${RESET}" ;;
    v4.1.0)   echo -e "${GREEN}v4.1.0${RESET}" ;;
    v5.0.0)   echo -e "${MAGENTA}v5.0.0${RESET}" ;;
    *)        echo -e "${RED}UNKNOWN${RESET}" ;;
  esac
}

hr() { printf "${DIM}"; printf '─%.0s' $(seq 1 80); printf "${RESET}\n"; }

# ── Print Functions ─────────────────────────────────────────

print_proxied_contract() {
  local name="$1"
  local proxy="$2"

  local impl_addr admin_addr version tag

  impl_addr=$(addr_from_slot "$proxy" "$IMPL_SLOT")
  admin_addr=$(addr_from_slot "$proxy" "$ADMIN_SLOT")
  version=$(get_version "$proxy")
  tag=$(impl_lookup "$name" "$impl_addr")

  echo -e "${BOLD}${CYAN}$name${RESET}"
  echo -e "  Proxy:          ${BLUE}$proxy${RESET}"
  echo -e "  Implementation: ${BLUE}$impl_addr${RESET}  →  $(colorize_tag "$tag")"
  echo -e "  Version:        $version"

  local admin_lower
  admin_lower=$(echo "$admin_addr" | tr '[:upper:]' '[:lower:]')
  if [ "$admin_lower" != "0x0000000000000000000000000000000000000000" ]; then
    local admin_type
    admin_type=$(classify_address "$admin_addr")
    echo -e "  EIP-1967 Admin: ${BLUE}$admin_addr${RESET}  →  $admin_type"
  fi
  echo ""
}

print_resolved_delegate_proxy() {
  local name="$1"
  local proxy="$2"
  local resolve_name="$3"

  local impl_addr version tag

  impl_addr=$(cast call "$ADDRESS_MANAGER" "getAddress(string)(address)" "$resolve_name" -r "$RPC_URL" 2>/dev/null || echo "0x0")
  version=$(get_version "$proxy")
  tag=$(impl_lookup "$name" "$impl_addr")

  echo -e "${BOLD}${CYAN}$name${RESET}  ${DIM}(ResolvedDelegateProxy)${RESET}"
  echo -e "  Proxy:          ${BLUE}$proxy${RESET}"
  echo -e "  Implementation: ${BLUE}$impl_addr${RESET}  →  $(colorize_tag "$tag")"
  echo -e "  Version:        $version"
  echo -e "  AddressManager: ${BLUE}$ADDRESS_MANAGER${RESET}  (key: $resolve_name)"
  echo ""
}

print_singleton() {
  local name="$1"
  local addr="$2"

  local version tag addr_type
  version=$(get_version "$addr")
  tag=$(impl_lookup "$name" "$addr")
  addr_type=$(classify_address "$addr")

  echo -e "${BOLD}${CYAN}$name${RESET}  ${DIM}(singleton)${RESET}"
  echo -e "  Address:  ${BLUE}$addr${RESET}  →  $(colorize_tag "$tag")"
  echo -e "  Version:  $version"
  echo -e "  Type:     $addr_type"
  echo ""
}

print_admin_contract() {
  local name="$1"
  local addr="$2"

  local addr_type
  addr_type=$(classify_address "$addr")
  echo -e "${BOLD}${CYAN}$name${RESET}"
  echo -e "  Address:  ${BLUE}$addr${RESET}"
  echo -e "  Type:     $addr_type"

  local owner
  owner=$(cast call "$addr" "owner()(address)" -r "$RPC_URL" 2>/dev/null || echo "")
  if [ -n "$owner" ] && [ "$owner" != "0x0000000000000000000000000000000000000000" ]; then
    local owner_type
    owner_type=$(classify_address "$owner")
    echo -e "  Owner:    ${BLUE}$owner${RESET}  →  $owner_type"
  fi
  echo ""
}

# ── Main ────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}╔═════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   OP Stack Contract Verification — Celo Sepolia Testnet     ║${RESET}"
echo -e "${BOLD}╚═════════════════════════════════════════════════════════════╝${RESET}"
echo -e "  RPC: ${DIM}$RPC_URL${RESET}"
echo -e "  Block: ${DIM}$(cast block-number -r "$RPC_URL" 2>/dev/null || echo "N/A")${RESET}"
echo ""

echo -e "${BOLD}Legend:${RESET}  ${YELLOW}■${RESET} v3 (initial/Isthmus)  ${GREEN}■${RESET} v4.1.0  ${MAGENTA}■${RESET} v5.0.0  ${RED}■${RESET} UNKNOWN"
echo ""

echo -e "${BOLD}═══ ADMIN & OWNERSHIP ═══${RESET}"
hr
print_admin_contract "ProxyAdmin" "$PROXY_ADMIN"
print_admin_contract "ProxyAdminOwner (SystemOwnerSafe)" "$PROXY_ADMIN_OWNER"

echo -e "${BOLD}═══ SUPERCHAIN TOPOLOGY (Celo-specific) ═══${RESET}"
echo -e "  ${DIM}SystemConfig → CeloSuperchainConfig → SuperchainConfig${RESET}"
hr

print_proxied_contract "SystemConfig" "$SYSTEM_CONFIG_PROXY"

CELO_SC_ADDR=$(cast call "$SYSTEM_CONFIG_PROXY" "superchainConfig()(address)" -r "$RPC_URL" 2>/dev/null || echo "unknown")
echo -e "  ${DIM}SystemConfig.superchainConfig() → ${CELO_SC_ADDR}${RESET}"
echo ""

print_proxied_contract "CeloSuperchainConfig" "$CELO_SUPERCHAIN_CONFIG_PROXY"

OP_SC_ADDR=$(cast call "$CELO_SUPERCHAIN_CONFIG_PROXY" "superchainConfig()(address)" -r "$RPC_URL" 2>/dev/null || echo "unknown")
echo -e "  ${DIM}CeloSuperchainConfig.superchainConfig() → ${OP_SC_ADDR}${RESET}"
echo ""

print_proxied_contract "SuperchainConfig" "$SUPERCHAIN_CONFIG_PROXY"

echo -e "${BOLD}═══ CORE BRIDGE CONTRACTS ═══${RESET}"
hr
print_proxied_contract "OptimismPortal" "$OPTIMISM_PORTAL_PROXY"
print_proxied_contract "L1StandardBridge" "$L1_STANDARD_BRIDGE_PROXY"
print_resolved_delegate_proxy "L1CrossDomainMessenger" "$L1_CROSS_DOMAIN_MESSENGER_PROXY" "OVM_L1CrossDomainMessenger"
print_proxied_contract "L1ERC721Bridge" "$L1_ERC721_BRIDGE_PROXY"
print_proxied_contract "OptimismMintableERC20Factory" "$OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY"

echo -e "${BOLD}═══ DISPUTE / FAULT PROOF ═══${RESET}"
hr
print_proxied_contract "DisputeGameFactory" "$DISPUTE_GAME_FACTORY_PROXY"
print_proxied_contract "AnchorStateRegistry" "$ANCHOR_STATE_REGISTRY_PROXY"
print_proxied_contract "DelayedWETH" "$PERMISSIONED_DELAYED_WETH_PROXY"

echo -e "${BOLD}═══ PROTOCOL ═══${RESET}"
hr
print_proxied_contract "ProtocolVersions" "$PROTOCOL_VERSIONS_PROXY"

echo -e "${BOLD}═══ SINGLETONS (non-upgradeable) ═══${RESET}"
hr

DGF_IMPL=$(addr_from_slot "$DISPUTE_GAME_FACTORY_PROXY" "$IMPL_SLOT")
DGF_TAG=$(impl_lookup "DisputeGameFactory" "$DGF_IMPL")

case "$DGF_TAG" in
  v5.0.0)
    MIPS_ADDR="0x6463dee3828677f6270d83d45408044fc5edb908"
    PREIMAGE_ADDR="0x1fb8cdfc6831fc866ed9c51af8817da5c287add3"
    ;;
  v4.1.0)
    MIPS_ADDR="0x07babe08ee4d07dba236530183b24055535a7011"
    PREIMAGE_ADDR="0x1fb8cdfc6831fc866ed9c51af8817da5c287add3"
    ;;
  *)
    MIPS_ADDR="0x0a691eEd7bE53F27f3C3b796061Cdb8565dA0b2a"
    PREIMAGE_ADDR="0x855828eA44a0CE2596FDf49bEA5b2859c0453704"
    ;;
esac

print_singleton "PreimageOracle" "$PREIMAGE_ADDR"
print_singleton "MIPS" "$MIPS_ADDR"

echo -e "${BOLD}═══ UPGRADE STATUS MATRIX ═══${RESET}"
hr

printf "  ${BOLD}%-36s %-12s %s${RESET}\n" "Contract" "Version" "Impl Match"
printf "  %-36s %-12s %s\n" "────────────────────────────────────" "────────────" "──────────────"

check_and_print() {
  local name="$1"
  local proxy="$2"
  local impl ver tag
  impl=$(addr_from_slot "$proxy" "$IMPL_SLOT")
  ver=$(get_version "$proxy")
  tag=$(impl_lookup "$name" "$impl")
  printf "  %-36s %-12s %b\n" "$name" "$ver" "$(colorize_tag "$tag")"
}

check_and_print_resolved() {
  local name="$1"
  local proxy="$2"
  local resolve_name="$3"
  local impl ver tag
  impl=$(cast call "$ADDRESS_MANAGER" "getAddress(string)(address)" "$resolve_name" -r "$RPC_URL" 2>/dev/null || echo "0x0")
  ver=$(get_version "$proxy")
  tag=$(impl_lookup "$name" "$impl")
  printf "  %-36s %-12s %b\n" "$name" "$ver" "$(colorize_tag "$tag")"
}

check_and_print "SystemConfig"                  "$SYSTEM_CONFIG_PROXY"
check_and_print "CeloSuperchainConfig"          "$CELO_SUPERCHAIN_CONFIG_PROXY"
check_and_print "SuperchainConfig"              "$SUPERCHAIN_CONFIG_PROXY"
check_and_print "OptimismPortal"                "$OPTIMISM_PORTAL_PROXY"
check_and_print "L1StandardBridge"              "$L1_STANDARD_BRIDGE_PROXY"
check_and_print_resolved "L1CrossDomainMessenger" "$L1_CROSS_DOMAIN_MESSENGER_PROXY" "OVM_L1CrossDomainMessenger"
check_and_print "L1ERC721Bridge"                "$L1_ERC721_BRIDGE_PROXY"
check_and_print "OptimismMintableERC20Factory"  "$OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY"
check_and_print "DisputeGameFactory"            "$DISPUTE_GAME_FACTORY_PROXY"
check_and_print "AnchorStateRegistry"           "$ANCHOR_STATE_REGISTRY_PROXY"
check_and_print "DelayedWETH"                   "$PERMISSIONED_DELAYED_WETH_PROXY"
check_and_print "ProtocolVersions"              "$PROTOCOL_VERSIONS_PROXY"

PREIMAGE_VER=$(get_version "$PREIMAGE_ADDR")
PREIMAGE_TAG=$(impl_lookup "PreimageOracle" "$PREIMAGE_ADDR")
printf "  %-36s %-12s %b\n" "PreimageOracle (singleton)" "$PREIMAGE_VER" "$(colorize_tag "$PREIMAGE_TAG")"

MIPS_VER=$(get_version "$MIPS_ADDR")
MIPS_TAG=$(impl_lookup "MIPS" "$MIPS_ADDR")
printf "  %-36s %-12s %b\n" "MIPS (singleton)" "$MIPS_VER" "$(colorize_tag "$MIPS_TAG")"

echo ""
echo -e "${DIM}Done.${RESET}"
