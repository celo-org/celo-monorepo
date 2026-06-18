#!/usr/bin/env bash
set -eo pipefail

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
case "$NETWORK" in
  sepolia|chaos|mainnet) ;;
  *)
    echo "Usage: NETWORK=[sepolia|chaos|mainnet] $0"
    echo "  sepolia  — Celo Sepolia Testnet"
    echo "  chaos    — Chaos Testnet"
    echo "  mainnet  — Celo Mainnet"
    exit 1
    ;;
esac

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

# ── Network-Specific Addresses ─────────────────────────────
case "$NETWORK" in
  sepolia)
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
    ADDRESS_MANAGER="0x8f0c6FC85A53551d87899aC2a5Af2B48C793eB63"
    ;;

  chaos)
    # ── Chaos Testnet Proxy Addresses ───────────────────────────
    SYSTEM_CONFIG_PROXY="0x624ce254d4d0e84e4179897c9e9b97784f37f6fd"
    OPTIMISM_PORTAL_PROXY="0x37e3521cc2c2e3fc12ad4adc36aa8f6b6b686473"
    L1_STANDARD_BRIDGE_PROXY="0xb2f2468d0ab462da6cab2ef547fefd3511e33d14"
    L1_CROSS_DOMAIN_MESSENGER_PROXY="0x88bc63f650a49a5b3d10035cd5bdab036da0e3d8"
    L1_ERC721_BRIDGE_PROXY="0xe9b3351f4632df6609ab6434c17667ecb97a5f6d"
    OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY="0x80a8c6c150bdbd0f0c6ac7fc71c42fd6523f8284"
    DISPUTE_GAME_FACTORY_PROXY="0xc0215f0202418568c06b899f5e11245dbf717802"
    ANCHOR_STATE_REGISTRY_PROXY="0x06ec7ffc5ec88b750152bc26e4a456345a57c286"
    SUPERCHAIN_CONFIG_PROXY="0x852A5763dA3Fdf51a8b816E02b91A054904Bd8B0"
    CELO_SUPERCHAIN_CONFIG_PROXY="0xd1ed48c497abc6276804b16e72045f0dd5878e2a"
    PROTOCOL_VERSIONS_PROXY="0x433a83893DDA68B941D4aefA908DED9c599522ad"
    PERMISSIONED_DELAYED_WETH_PROXY="0x6089ec4cf7c5d571901f32b2cb51ae01f14d65c5"
    # ── Non-Proxied ─────────────────────────────────────────────
    PROXY_ADMIN="0x6151d1cc7724ee7594f414c152320757c9c5844e"
    ADDRESS_MANAGER="0xfc7950601fd0b3d07fcb8899a6dfaf578eac8fec"
    ;;

  mainnet)
    # ── Celo Mainnet Proxy Addresses ──────────────────────────────
    SYSTEM_CONFIG_PROXY="0x89E31965D844a309231B1f17759Ccaf1b7c09861"
    OPTIMISM_PORTAL_PROXY="0xc5c5D157928BDBD2ACf6d0777626b6C75a9EAEDC"
    L1_STANDARD_BRIDGE_PROXY="0x9C4955b92F34148dbcfDCD82e9c9eCe5CF2badfe"
    L1_CROSS_DOMAIN_MESSENGER_PROXY="0x1AC1181fc4e4F877963680587AEAa2C90D7EbB95"
    L1_ERC721_BRIDGE_PROXY="0x3C519816C5BdC0a0199147594F83feD4F5847f13"
    OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY="0x6f0E4f1EB98A52EfaCF7BE11d48B9d9d6510A906"
    DISPUTE_GAME_FACTORY_PROXY="0xFbAC162162f4009Bb007C6DeBC36B1dAC10aF683"
    ANCHOR_STATE_REGISTRY_PROXY="0x9F18D91949731E766f294A14027bBFE8F28328CC"
    SUPERCHAIN_CONFIG_PROXY="0x95703e0982140D16f8ebA6d158FccEde42f04a4C"
    CELO_SUPERCHAIN_CONFIG_PROXY="0xa440975E5A6BB19Bc3Bee901d909BB24b0f43D33"
    PROTOCOL_VERSIONS_PROXY="0x1b6dEB2197418075AB314ac4D52Ca1D104a8F663"
    PERMISSIONED_DELAYED_WETH_PROXY="0x9c314E8057025F2982aa4B3923Abd741A8e8DE91"
    # ── Non-Proxied ─────────────────────────────────────────────
    PROXY_ADMIN="0x783A434532Ee94667979213af1711505E8bFE374"
    ADDRESS_MANAGER="0x55093104b76FAA602F9d6c35A5FFF576bE78d753"
    ;;
esac

# ── Dynamic topology discovery (post-upgrade aware) ─────────
# After a v4+ upgrade, SystemConfig.superchainConfig() points to the NEW CeloSuperchainConfig
# proxy (not the pre-v4 hardcoded one). Same for AnchorStateRegistry via PermissionedGame.
# X-ray uses this live discovery; verify-versions mirrors the same strategy so it reports
# correct post-upgrade state on a fork.
ZERO_ADDR="0x0000000000000000000000000000000000000000"

LIVE_CSC=$(cast call "$SYSTEM_CONFIG_PROXY" "superchainConfig()(address)" -r "$RPC_URL" 2>/dev/null || echo "")
if [ -n "$LIVE_CSC" ] && [ "$LIVE_CSC" != "$ZERO_ADDR" ]; then
  CELO_SUPERCHAIN_CONFIG_PROXY="$LIVE_CSC"
fi

LIVE_PG_IMPL=$(cast call "$DISPUTE_GAME_FACTORY_PROXY" "gameImpls(uint32)(address)" 1 -r "$RPC_URL" 2>/dev/null || echo "")
if [ -n "$LIVE_PG_IMPL" ] && [ "$LIVE_PG_IMPL" != "$ZERO_ADDR" ]; then
  LIVE_ASR=$(cast call "$LIVE_PG_IMPL" "anchorStateRegistry()(address)" -r "$RPC_URL" 2>/dev/null || echo "")
  if [ -n "$LIVE_ASR" ] && [ "$LIVE_ASR" != "$ZERO_ADDR" ]; then
    ANCHOR_STATE_REGISTRY_PROXY="$LIVE_ASR"
  fi
fi

# ── Derived Addresses ──────────────────────────────────────
PROXY_ADMIN_OWNER=$(cast call "$PROXY_ADMIN" "owner()(address)" -r "$RPC_URL" 2>/dev/null || echo "0x0000000000000000000000000000000000000000")

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
        # Celo Sepolia initial
        0x1edd39f1662fa3f3c4003b013e899c2cff976377) echo "initial" ;;
        # Chaos initial
        0x6078853b915221d79eacbcbb491f0f1da853f05f) echo "initial" ;;
        # Mainnet initial
        0x9c61c5a8ff9408b83ac92571278550097a9d2bb5) echo "initial" ;;
        0xa9c79551ea70d311f5153a27cba12396e5128b9c) echo "v4.1.0" ;;
        0xe5dc3c0a3489b81a6f3ae3bb49bf9ccbfb85a3db) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    OptimismPortal)
      case "$addr" in
        # Celo Sepolia initial
        0x229ac4d29814249ba4830eb0e5b133df664ce4d7) echo "initial" ;;
        # Chaos initial
        0x8f3af3a2abf706a6b1a334d15833f72de6efad93) echo "initial" ;;
        # Mainnet initial
        0x215a5ff85308a72a772f09b520da71d3520e9ac7) echo "initial" ;;
        0x661dfa933f77148dc8d84b06646a2868d7ae5deb) echo "v4.1.0" ;; # Celo Sepolia
        0x4fd87a100bd869080789a178c53fdeac5e23ae4c) echo "v4.1.0" ;; # Chaos
        0x2c431080fc733e259654f3b91e39468d9a85ac9b) echo "v5.0.0" ;; # Celo Sepolia
        0x5b0faa24146d607bd72b9b472d2d0f2c7ccd19ae) echo "v5.0.0" ;; # Chaos
        *) echo "UNKNOWN" ;;
      esac ;;
    L1StandardBridge)
      case "$addr" in
        # Celo Sepolia initial
        0x4063c3824d993784a169470e05dacc1b8501d972) echo "initial" ;;
        # Chaos initial
        0x31b139435516f99c3a51c4fef0e32ed8b22072dd) echo "initial" ;;
        # Mainnet initial
        0x28841965b26d41304905a836da5c0921da7dbb84) echo "initial" ;;
        0x6e3c2b6af57bc789e80bb8952cf1dfdafa804e25) echo "v4.1.0" ;;
        0xfa707f45a23370d9154af4457401274e38fa2d8a) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    L1CrossDomainMessenger)
      case "$addr" in
        # Celo Sepolia initial
        0xc1dd01079a4358aec262ad5080239542433d077a) echo "initial" ;;
        # Chaos initial
        0x398bf85d24331fc3360f184e35c9b80779ae2dab) echo "initial" ;;
        # Mainnet initial
        0x807124f75ff2120b2f26d7e6f9e39c03ee9de212) echo "initial" ;;
        0xa183a771b6c5f6e88cd351bbdc40e1ecd4521cad) echo "v4.1.0" ;;
        0xe45d2d835d0b2d3c7f4fee1eaa19a068d0ba8a88) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    L1ERC721Bridge)
      case "$addr" in
        # Celo Sepolia initial
        0xef32aa47df0800b8619d0522fa82a68dd4b9a8d7) echo "initial" ;;
        # Chaos initial
        0x9be0120a5b29e64a0b4cee301e8c9cf9aaa02d76) echo "initial" ;;
        # Mainnet initial
        0x7ae1d3bd877a4c5ca257404ce26be93a02c98013) echo "initial" ;;
        0x7f1d12fb2911eb095278085f721e644c1f675696) echo "v4.1.0" ;;
        0x74f1ac50eb0be98853805d381c884f5f9abdecf9) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    OptimismMintableERC20Factory)
      case "$addr" in
        # Celo Sepolia initial
        0xd6e36ca5ef4babe6f890534bd8479b9561c22f94) echo "initial" ;;
        # Chaos initial
        0x927a91facfbb86013f729b56da5d823d8d2708bc) echo "initial" ;;
        # Mainnet initial
        0x5493f4677a186f64805fe7317d6993ba4863988f) echo "initial" ;;
        0x6a52641d87a600ba103ccdfbe3eb02ac7e73c04a) echo "v4.1.0" ;;
        0x149bd036f5f57d0ff4b5f102c9d46e3c0eb2c016) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    DisputeGameFactory)
      case "$addr" in
        # Celo Sepolia initial
        0x0468d6dfbcb060cea717459a4026339d60fb34d9) echo "initial" ;;
        # Chaos initial
        0x6e3c055ea934c04f23e9e292bd2706b72d762bb0) echo "initial" ;;
        # Mainnet initial
        0x4bba758f006ef09402ef31724203f316ab74e4a0) echo "initial" ;;
        0x33d1e8571a85a538ed3d5a4d88f46c112383439d) echo "v4.1.0" ;;
        0x74fac1d45b98bae058f8f566201c9a81b85c7d50) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    AnchorStateRegistry)
      case "$addr" in
        # Celo Sepolia initial
        0xe8e958be5a891ff9aac5410c3923dbafd99174bb) echo "initial" ;;
        # Chaos initial
        0x68bc45e9774889efc5a317e9361bba655d33973c) echo "initial" ;;
        # Mainnet initial
        0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2) echo "initial" ;;
        0xeb69cc681e8d4a557b30dffbad85affd47a2cf2e) echo "v4.1.0" ;; # Celo Sepolia
        0xb38a2b523c6c2effa7473cf54adac0ba1ade99b2) echo "v4.1.0" ;; # Chaos
        # v5.0.0 same as v4.1.0
        *) echo "UNKNOWN" ;;
      esac ;;
    SuperchainConfig)
      case "$addr" in
        # Celo Sepolia initial
        0x1b8ca63db2e3e37c1def34f24e4c88ed422bd7c1) echo "initial" ;;
        # Chaos initial
        0xd76201f29bff97df757141c281f84dd66f3398db) echo "initial" ;;
        # Mainnet initial uses same binary as v5.0.0 (b08cc720)
        0xce28685eb204186b557133766eca00334eb441e4) echo "v4.1.0" ;;
        0xb08cc720f511062537ca78bdb0ae691f04f5a957) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    CeloSuperchainConfig)
      case "$addr" in
        # Celo Sepolia initial
        0x00cdf709c093702c8019889e7df32d1735b80355) echo "initial" ;;
        # Chaos initial
        0x37c91ad60e49cf606bfefe96122629c2488d982d) echo "initial" ;;
        # Mainnet initial
        0x693cfd911523ccae1a14ade2501ae4a0a463b446) echo "initial" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    ProtocolVersions)
      case "$addr" in
        # Celo Sepolia initial
        0x9a7ca01b64ce656b927248af08692ed2714c68e0) echo "initial" ;;
        # Chaos initial
        0xb0eb0b64b765851e34ca0bc473206e6c7415b1a5) echo "initial" ;;
        # Same binary across v3/v4 (version() = 1.1.0); mainnet deployed at v3
        0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c)
          if [ "$NETWORK" = "mainnet" ]; then echo "initial"; else echo "v4.1.0"; fi ;;
        0x1f734b89bb1b422b9910118fb8d44c06e33d4dda) echo "v5.0.0" ;;
        *) echo "UNKNOWN" ;;
      esac ;;
    DelayedWETH)
      case "$addr" in
        # Celo Sepolia initial
        0xe8249b2cffc3f71e433918c5267c71bf1e1fdc1e) echo "initial" ;;
        # Chaos initial
        0x158ec618e7b6e14ab039a9fade14f15cfdb8e2e7) echo "initial" ;;
        # Mainnet initial
        0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796) echo "initial" ;;
        0xb86a464cc743440fddaa43900e05318ef4818b29) echo "v4.1.0" ;; # Celo Sepolia
        0x6803e87a24c8019f42e89dc06a4c8749373e99ad) echo "v4.1.0" ;; # Chaos
        # v5.0.0 same as v4.1.0
        *) echo "UNKNOWN" ;;
      esac ;;
    PreimageOracle)
      case "$addr" in
        0x855828ea44a0ce2596fdf49bea5b2859c0453704) echo "initial" ;;
        # Same binary across v3/v4/v5 (version() = 1.1.4); mainnet deployed at v3
        0x1fb8cdfc6831fc866ed9c51af8817da5c287add3)
          if [ "$NETWORK" = "mainnet" ]; then echo "initial"; else echo "v4.1.0"; fi ;;
        0xf6516bcb58cd4b2d2a4325cc329b97627053cf83) echo "v4.1.0" ;; # Chaos
        # v5.0.0 same as v4.1.0
        *) echo "UNKNOWN" ;;
      esac ;;
    MIPS)
      case "$addr" in
        0x0a691eed7be53f27f3c3b796061cdb8565da0b2a) echo "initial" ;;
        # Mainnet initial
        0xaa59a0777648bc75cd10364083e878c1ccd6112a) echo "initial" ;;
        0x07babe08ee4d07dba236530183b24055535a7011) echo "v4.1.0" ;; # Celo Sepolia
        0x0c908f56eb51e01ed055d2dff5b5842a5f0f28b2) echo "v4.1.0" ;; # Chaos
        0x6463dee3828677f6270d83d45408044fc5edb908) echo "v5.0.0" ;; # Celo Sepolia
        0x96dc36d70491000d9f16e1b25afa1876ecfc994e) echo "v5.0.0" ;; # Chaos
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
    initial)  echo -e "${YELLOW}v3 (Isthmus)${RESET}" ;;
    v4.1.0)   echo -e "${GREEN}v4.1.0 (pre-Jovian)${RESET}" ;;
    v5.0.0)   echo -e "${MAGENTA}v5.0.0 (Jovian)${RESET}" ;;
    *)        echo "" ;;
  esac
}

game_version_tag() {
  local game_type="$1"
  local ver="${2//\"/}"
  case "$game_type" in
    1)
      case "$ver" in
        1.4.1) echo -e "${YELLOW}Isthmus${RESET}" ;;
        1.7.0) echo -e "${GREEN}pre-Jovian${RESET}" ;;
        1.8.0) echo -e "${MAGENTA}Jovian${RESET}" ;;
        *)     echo "" ;;
      esac ;;
    42)
      case "$ver" in
        1.0.0) echo -e "${YELLOW}Isthmus${RESET}" ;;
        2.0.0) echo -e "${MAGENTA}Jovian${RESET}" ;;
        *)     echo "" ;;
      esac ;;
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
  local colored_tag; colored_tag=$(colorize_tag "$tag")
  if [ -n "$colored_tag" ]; then
    echo -e "  Implementation: ${BLUE}$impl_addr${RESET}  →  $colored_tag"
  else
    echo -e "  Implementation: ${BLUE}$impl_addr${RESET}"
  fi
  echo -e "  Version:        $version"

  local admin_lower
  admin_lower=$(echo "$admin_addr" | tr '[:upper:]' '[:lower:]')
  if [ "$admin_lower" != "0x0000000000000000000000000000000000000000" ]; then
    local admin_type
    admin_type=$(classify_address "$admin_addr")
    echo -e "  EIP-1967 Admin: ${BLUE}$admin_addr${RESET}  →  $admin_type"
  fi

  local contract_owner
  contract_owner=$(cast call "$proxy" "owner()(address)" -r "$RPC_URL" 2>/dev/null || echo "")
  if [ -n "$contract_owner" ] && [ "$contract_owner" != "0x0000000000000000000000000000000000000000" ]; then
    echo -e "  Owner:          ${BLUE}$contract_owner${RESET}"
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
  local colored_tag; colored_tag=$(colorize_tag "$tag")
  if [ -n "$colored_tag" ]; then
    echo -e "  Implementation: ${BLUE}$impl_addr${RESET}  →  $colored_tag"
  else
    echo -e "  Implementation: ${BLUE}$impl_addr${RESET}"
  fi
  echo -e "  Version:        $version"
  echo -e "  AddressManager: ${BLUE}$ADDRESS_MANAGER${RESET}  (key: $resolve_name)"

  local contract_owner
  contract_owner=$(cast call "$proxy" "owner()(address)" -r "$RPC_URL" 2>/dev/null || echo "")
  if [ -n "$contract_owner" ] && [ "$contract_owner" != "0x0000000000000000000000000000000000000000" ]; then
    echo -e "  Owner:          ${BLUE}$contract_owner${RESET}"
  fi
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
  local colored_tag; colored_tag=$(colorize_tag "$tag")
  if [ -n "$colored_tag" ]; then
    echo -e "  Address:  ${BLUE}$addr${RESET}  →  $colored_tag"
  else
    echo -e "  Address:  ${BLUE}$addr${RESET}"
  fi
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

case "$NETWORK" in
  sepolia) NETWORK_LABEL="Celo Sepolia Testnet" ;;
  chaos)   NETWORK_LABEL="Chaos Testnet" ;;
  mainnet) NETWORK_LABEL="Celo Mainnet" ;;
esac

TITLE="OP Stack Contract Verification — ${NETWORK_LABEL}"
TITLE_LEN=${#TITLE}
PAD_LEN=$(( TITLE_LEN + 6 ))
BORDER=$(printf '═%.0s' $(seq 1 "$PAD_LEN"))

echo ""
echo -e "${BOLD}╔${BORDER}╗${RESET}"
echo -e "${BOLD}║   ${TITLE}   ║${RESET}"
echo -e "${BOLD}╚${BORDER}╝${RESET}"
echo -e "  RPC: ${DIM}$RPC_URL${RESET}"
echo -e "  Block: ${DIM}$(cast block-number -r "$RPC_URL" 2>/dev/null || echo "N/A")${RESET}"
echo ""

echo -e "${BOLD}Legend:${RESET}  ${YELLOW}■${RESET} v3 (Isthmus)  ${GREEN}■${RESET} v4.1.0 (pre-Jovian)  ${MAGENTA}■${RESET} v5.0.0 (Jovian)"
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

GUARDIAN_ADDR=$(cast call "$OPTIMISM_PORTAL_PROXY" "guardian()(address)" -r "$RPC_URL" 2>/dev/null || echo "unknown")
if [ "$GUARDIAN_ADDR" != "unknown" ] && [ "$GUARDIAN_ADDR" != "0x0000000000000000000000000000000000000000" ]; then
  GUARDIAN_TYPE=$(classify_address "$GUARDIAN_ADDR")
  echo -e "  ${DIM}OptimismPortal.guardian() → ${RESET}${BLUE}$GUARDIAN_ADDR${RESET}  →  $GUARDIAN_TYPE"
  echo ""
fi
print_proxied_contract "L1StandardBridge" "$L1_STANDARD_BRIDGE_PROXY"
print_resolved_delegate_proxy "L1CrossDomainMessenger" "$L1_CROSS_DOMAIN_MESSENGER_PROXY" "OVM_L1CrossDomainMessenger"
print_proxied_contract "L1ERC721Bridge" "$L1_ERC721_BRIDGE_PROXY"
print_proxied_contract "OptimismMintableERC20Factory" "$OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY"

echo -e "${BOLD}═══ DISPUTE / FAULT PROOF ═══${RESET}"
hr
print_proxied_contract "DisputeGameFactory" "$DISPUTE_GAME_FACTORY_PROXY"
print_proxied_contract "AnchorStateRegistry" "$ANCHOR_STATE_REGISTRY_PROXY"
print_proxied_contract "DelayedWETH" "$PERMISSIONED_DELAYED_WETH_PROXY"

echo -e "${BOLD}═══ DISPUTE GAMES ═══${RESET}"
hr

# Query game implementations from DisputeGameFactory
# gameImpls(GameType) returns the implementation address for that game type
# Type 1 = Permissioned, Type 42 = OP Succinct
ZERO_ADDR="0x0000000000000000000000000000000000000000"
GAME_IMPL_1=$(cast call "$DISPUTE_GAME_FACTORY_PROXY" "gameImpls(uint32)(address)" 1 -r "$RPC_URL" 2>/dev/null || echo "$ZERO_ADDR")
GAME_IMPL_42=$(cast call "$DISPUTE_GAME_FACTORY_PROXY" "gameImpls(uint32)(address)" 42 -r "$RPC_URL" 2>/dev/null || echo "$ZERO_ADDR")

for GAME_TYPE_ID in 1 42; do
  case "$GAME_TYPE_ID" in
    1)  GAME_NAME="PermissionedGame (type 1)"; GAME_ADDR="$GAME_IMPL_1" ;;
    42) GAME_NAME="OPSuccinctGame (type 42)"; GAME_ADDR="$GAME_IMPL_42" ;;
  esac
  if [ "$GAME_ADDR" != "$ZERO_ADDR" ]; then
    GAME_VER=$(get_version "$GAME_ADDR")
    GAME_TAG=$(game_version_tag "$GAME_TYPE_ID" "$GAME_VER")
    GAME_TYPE=$(classify_address "$GAME_ADDR")
    echo -e "${BOLD}${CYAN}$GAME_NAME${RESET}  ${DIM}(singleton)${RESET}"
    if [ -n "$GAME_TAG" ]; then
      echo -e "  Address:  ${BLUE}$GAME_ADDR${RESET}  →  $GAME_TAG"
    else
      echo -e "  Address:  ${BLUE}$GAME_ADDR${RESET}"
    fi
    echo -e "  Version:  $GAME_VER"
    echo -e "  Type:     $GAME_TYPE"
    echo ""
  else
    echo -e "${BOLD}${CYAN}$GAME_NAME${RESET}  ${DIM}(not set)${RESET}"
    echo ""
  fi
done

echo -e "${BOLD}═══ PROTOCOL ═══${RESET}"
hr
print_proxied_contract "ProtocolVersions" "$PROTOCOL_VERSIONS_PROXY"

echo -e "${BOLD}═══ SINGLETONS (non-upgradeable) ═══${RESET}"
hr

DGF_IMPL=$(addr_from_slot "$DISPUTE_GAME_FACTORY_PROXY" "$IMPL_SLOT")
DGF_TAG=$(impl_lookup "DisputeGameFactory" "$DGF_IMPL")

case "$DGF_TAG" in
  v5.0.0)
    case "$NETWORK" in
      sepolia)  MIPS_ADDR="0x6463dee3828677f6270d83d45408044fc5edb908" ;;
      chaos)    MIPS_ADDR="0x96dc36d70491000d9f16e1b25afa1876ecfc994e" ;;
      mainnet)  MIPS_ADDR="0xaa59a0777648bc75cd10364083e878c1ccd6112a" ;; # mainnet initial = v3 MIPS
    esac
    PREIMAGE_ADDR="0x1fb8cdfc6831fc866ed9c51af8817da5c287add3"
    ;;
  v4.1.0)
    case "$NETWORK" in
      sepolia)  MIPS_ADDR="0x07babe08ee4d07dba236530183b24055535a7011" ;;
      chaos)    MIPS_ADDR="0x0c908f56eb51e01ed055d2dff5b5842a5f0f28b2" ;;
      mainnet)  MIPS_ADDR="0xaa59a0777648bc75cd10364083e878c1ccd6112a" ;; # mainnet initial = v3 MIPS
    esac
    PREIMAGE_ADDR="0x1fb8cdfc6831fc866ed9c51af8817da5c287add3"
    ;;
  *)
    case "$NETWORK" in
      sepolia)
        MIPS_ADDR="0x0a691eEd7bE53F27f3C3b796061Cdb8565dA0b2a"
        PREIMAGE_ADDR="0x855828eA44a0CE2596FDf49bEA5b2859c0453704"
        ;;
      chaos)
        MIPS_ADDR="0x0a691eEd7bE53F27f3C3b796061Cdb8565dA0b2a"  # same initial as Sepolia
        PREIMAGE_ADDR="0x855828eA44a0CE2596FDf49bEA5b2859c0453704"
        ;;
      mainnet)
        MIPS_ADDR="0xaa59a0777648bc75cd10364083e878c1ccd6112a"
        PREIMAGE_ADDR="0x1fb8cdfc6831fc866ed9c51af8817da5c287add3"
        ;;
    esac
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
  local colored_tag; colored_tag=$(colorize_tag "$tag")
  if [ -n "$colored_tag" ]; then
    printf "  %-36s %-12s %b\n" "$name" "$ver" "$colored_tag"
  else
    printf "  %-36s %-12s\n" "$name" "$ver"
  fi
}

check_and_print_resolved() {
  local name="$1"
  local proxy="$2"
  local resolve_name="$3"
  local impl ver tag
  impl=$(cast call "$ADDRESS_MANAGER" "getAddress(string)(address)" "$resolve_name" -r "$RPC_URL" 2>/dev/null || echo "0x0")
  ver=$(get_version "$proxy")
  tag=$(impl_lookup "$name" "$impl")
  local colored_tag; colored_tag=$(colorize_tag "$tag")
  if [ -n "$colored_tag" ]; then
    printf "  %-36s %-12s %b\n" "$name" "$ver" "$colored_tag"
  else
    printf "  %-36s %-12s\n" "$name" "$ver"
  fi
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

# Game type impls
for GAME_TYPE_ID in 1 42; do
  case "$GAME_TYPE_ID" in
    1)  GAME_NAME="PermissionedGame (type 1)"; GAME_ADDR="$GAME_IMPL_1" ;;
    42) GAME_NAME="OPSuccinctGame (type 42)"; GAME_ADDR="$GAME_IMPL_42" ;;
  esac
  if [ "$GAME_ADDR" != "$ZERO_ADDR" ]; then
    GAME_VER=$(get_version "$GAME_ADDR")
    GAME_TAG=$(game_version_tag "$GAME_TYPE_ID" "$GAME_VER")
    if [ -n "$GAME_TAG" ]; then
      printf "  %-36s %-12s %b\n" "$GAME_NAME" "$GAME_VER" "$GAME_TAG"
    else
      printf "  %-36s %-12s\n" "$GAME_NAME" "$GAME_VER"
    fi
  fi
done

PREIMAGE_VER=$(get_version "$PREIMAGE_ADDR")
PREIMAGE_TAG=$(impl_lookup "PreimageOracle" "$PREIMAGE_ADDR")
PREIMAGE_COLORED=$(colorize_tag "$PREIMAGE_TAG")
if [ -n "$PREIMAGE_COLORED" ]; then
  printf "  %-36s %-12s %b\n" "PreimageOracle (singleton)" "$PREIMAGE_VER" "$PREIMAGE_COLORED"
else
  printf "  %-36s %-12s\n" "PreimageOracle (singleton)" "$PREIMAGE_VER"
fi

MIPS_VER=$(get_version "$MIPS_ADDR")
MIPS_TAG=$(impl_lookup "MIPS" "$MIPS_ADDR")
MIPS_COLORED=$(colorize_tag "$MIPS_TAG")
if [ -n "$MIPS_COLORED" ]; then
  printf "  %-36s %-12s %b\n" "MIPS (singleton)" "$MIPS_VER" "$MIPS_COLORED"
else
  printf "  %-36s %-12s\n" "MIPS (singleton)" "$MIPS_VER"
fi

echo ""
echo -e "${DIM}Done.${RESET}"
