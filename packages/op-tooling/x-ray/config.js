// ── EIP-1967 Storage Slots ─────────────────────────────────
export const EIP1967 = {
  IMPL_SLOT: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
  ADMIN_SLOT: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
}

export const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

// ── Network Configurations ─────────────────────────────────
export const NETWORKS = {
  mainnet: {
    id: 'mainnet',
    label: 'Celo Mainnet',
    shortLabel: 'Mainnet',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    addresses: {
      SYSTEM_CONFIG_PROXY: '0x89E31965D844a309231B1f17759Ccaf1b7c09861',
      OPTIMISM_PORTAL_PROXY: '0xc5c5D157928BDBD2ACf6d0777626b6C75a9EAEDC',
      L1_STANDARD_BRIDGE_PROXY: '0x9C4955b92F34148dbcfDCD82e9c9eCe5CF2badfe',
      L1_CROSS_DOMAIN_MESSENGER_PROXY: '0x1AC1181fc4e4F877963680587AEAa2C90D7EbB95',
      L1_ERC721_BRIDGE_PROXY: '0x3C519816C5BdC0a0199147594F83feD4F5847f13',
      OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY: '0x6f0E4f1EB98A52EfaCF7BE11d48B9d9d6510A906',
      DISPUTE_GAME_FACTORY_PROXY: '0xFbAC162162f4009Bb007C6DeBC36B1dAC10aF683',
      ANCHOR_STATE_REGISTRY_PROXY: '0x9F18D91949731E766f294A14027bBFE8F28328CC',
      SUPERCHAIN_CONFIG_PROXY: '0x95703e0982140D16f8ebA6d158FccEde42f04a4C',
      CELO_SUPERCHAIN_CONFIG_PROXY: '0xa440975E5A6BB19Bc3Bee901d909BB24b0f43D33',
      PROTOCOL_VERSIONS_PROXY: '0x1b6dEB2197418075AB314ac4D52Ca1D104a8F663',
      PERMISSIONED_DELAYED_WETH_PROXY: '0x9c314E8057025F2982aa4B3923Abd741A8e8DE91',
      PROXY_ADMIN: '0x783A434532Ee94667979213af1711505E8bFE374',
      ADDRESS_MANAGER: '0x55093104b76FAA602F9d6c35A5FFF576bE78d753',
      ACCESS_MANAGER: '0xF59a19c5578291cB7fd22618D16281aDf76f2816',
    },
  },
  sepolia: {
    id: 'sepolia',
    label: 'Celo Sepolia Testnet',
    shortLabel: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    addresses: {
      SYSTEM_CONFIG_PROXY: '0x760a5F022C9940f4A074e0030be682F560d29818',
      OPTIMISM_PORTAL_PROXY: '0x44AE3D41a335a7d05EB533029917aAd35662dcC2',
      L1_STANDARD_BRIDGE_PROXY: '0xEc18a3c30131A0Db4246e785355fBc16E2eAF408',
      L1_CROSS_DOMAIN_MESSENGER_PROXY: '0x70B0e58E6039831954eDE2EA1e9EF8a51680E4fD',
      L1_ERC721_BRIDGE_PROXY: '0xB8c8dCBCCd0f7C5e7a2184b13B85D461d8711e96',
      OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY: '0x261BE2eD7241feD9c746e0B5DFf3A4a335991377',
      DISPUTE_GAME_FACTORY_PROXY: '0x57C45d82D1a995F1e135B8D7EDc0a6BB5211cfAA',
      ANCHOR_STATE_REGISTRY_PROXY: '0xD73BA8168A61F3E917F0930D5C0401aA47e269D6',
      SUPERCHAIN_CONFIG_PROXY: '0x31bEef32135c90AE8E56Fb071B3587de289Aaf77',
      CELO_SUPERCHAIN_CONFIG_PROXY: '0x5c34140A1273372211Bd75184ccc9e434B38d86b',
      PROTOCOL_VERSIONS_PROXY: '0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd',
      PERMISSIONED_DELAYED_WETH_PROXY: '0x082F5f58B664CD1d51F9845fEE322aBA2cED9CbA',
      PROXY_ADMIN: '0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e',
      ADDRESS_MANAGER: '0x8f0c6FC85A53551d87899aC2a5Af2B48C793eB63',
      ACCESS_MANAGER: '0x188A7797B65e715b1dC9c85B908B9151dFe6C483',
    },
  },
  chaos: {
    id: 'chaos',
    label: 'Chaos Testnet',
    shortLabel: 'Chaos',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    addresses: {
      SYSTEM_CONFIG_PROXY: '0x6baf5959cc06a39793c338e6586f49473c731b4c',
      OPTIMISM_PORTAL_PROXY: '0x101f7d8038beb55d92919e9f944feb0faf211a9b',
      L1_STANDARD_BRIDGE_PROXY: '0x95f39a9dd86e4c777fd6dc4404d94fd32c23ea30',
      L1_CROSS_DOMAIN_MESSENGER_PROXY: '0x8627c42d20358d7064f3776c0a543195db8d5b22',
      L1_ERC721_BRIDGE_PROXY: '0x493ec8a8956d1239d01450a6adb6f7f091d2a81f',
      OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY: '0x92fa5b9a26580b7ecc495ffab4cbc0d995be5b5a',
      DISPUTE_GAME_FACTORY_PROXY: '0x338ac809e6a045cfc8aeb16ff8a4329147b61afb',
      ANCHOR_STATE_REGISTRY_PROXY: '0x7a7d0d1b0114e8a5a489f488b9ccab0611333687',
      SUPERCHAIN_CONFIG_PROXY: '0x7801D0a005d13CB66f8113BC28cb2640D8f44A6F',
      CELO_SUPERCHAIN_CONFIG_PROXY: '0xc731e02cb012e8d6e6f36cffb05d300e262d34bf',
      PROTOCOL_VERSIONS_PROXY: '0x433a83893DDA68B941D4aefA908DED9c599522ad',
      PERMISSIONED_DELAYED_WETH_PROXY: '0x9a95f7f7cdbb5195674a32d1579504e8fd302cc9',
      PROXY_ADMIN: '0xb2a0c2b49cdc2d3f0a0a291be0a6c20559ec053e',
      ADDRESS_MANAGER: '0xe79a9c96f2ea3340add851f83dbfdc2ff4ceb838',
      ACCESS_MANAGER: '0x47634F0B37f5A4d19C52045565934db761eF56cD',
    },
  },
  localhost: {
    id: 'localhost',
    label: 'Localhost Fork',
    shortLabel: 'Localhost',
    rpcUrl: 'http://localhost:8545',
    explorerUrl: null,
    addresses: {},
  },
}

export const LOAD_ORDER = ['mainnet', 'sepolia', 'chaos']

// ── Contract Definitions ───────────────────────────────────
// Proxied contracts (use EIP-1967 slots for impl + admin)
export const PROXIED_CONTRACTS = [
  { key: 'SystemConfig', section: 'superchain' },
  { key: 'CeloSuperchainConfig', section: 'superchain' },
  { key: 'SuperchainConfig', section: 'superchain' },
  { key: 'OptimismPortal', section: 'bridge' },
  { key: 'L1StandardBridge', section: 'bridge' },
  { key: 'L1ERC721Bridge', section: 'bridge' },
  { key: 'OptimismMintableERC20Factory', section: 'bridge' },
  { key: 'DisputeGameFactory', section: 'dispute' },
  { key: 'AnchorStateRegistry', section: 'dispute' },
  { key: 'DelayedWETH', section: 'dispute' },
  { key: 'ProtocolVersions', section: 'protocol' },
]

// Resolved delegate proxy (uses AddressManager for impl lookup)
export const RESOLVED_CONTRACTS = [
  { key: 'L1CrossDomainMessenger', resolveName: 'OVM_L1CrossDomainMessenger', section: 'bridge' },
]

// Address key → proxy address key mapping
export function proxyKey(contractKey) {
  const map = {
    SystemConfig: 'SYSTEM_CONFIG_PROXY',
    CeloSuperchainConfig: 'CELO_SUPERCHAIN_CONFIG_PROXY',
    SuperchainConfig: 'SUPERCHAIN_CONFIG_PROXY',
    OptimismPortal: 'OPTIMISM_PORTAL_PROXY',
    L1StandardBridge: 'L1_STANDARD_BRIDGE_PROXY',
    L1CrossDomainMessenger: 'L1_CROSS_DOMAIN_MESSENGER_PROXY',
    L1ERC721Bridge: 'L1_ERC721_BRIDGE_PROXY',
    OptimismMintableERC20Factory: 'OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY',
    DisputeGameFactory: 'DISPUTE_GAME_FACTORY_PROXY',
    AnchorStateRegistry: 'ANCHOR_STATE_REGISTRY_PROXY',
    DelayedWETH: 'PERMISSIONED_DELAYED_WETH_PROXY',
    ProtocolVersions: 'PROTOCOL_VERSIONS_PROXY',
  }
  return map[contractKey]
}

// ── Version Tags ───────────────────────────────────────────
export const VERSION_TAGS = {
  initial: { label: 'v3 (Isthmus)', color: 'amber' },
  'v4.1.0': { label: 'v4.1 (pre-Jovian)', color: 'green' },
  'v5.0.0': { label: 'v5 (Jovian)', color: 'purple' },
}

// ── Implementation Address Lookup Tables ───────────────────
// Maps lowercased impl address → version tag
// Ported directly from verify-versions.sh impl_lookup()
const IMPL_TABLE = {
  SystemConfig: {
    '0x1edd39f1662fa3f3c4003b013e899c2cff976377': 'initial', // Sepolia
    '0x6078853b915221d79eacbcbb491f0f1da853f05f': 'initial', // Chaos
    '0x9c61c5a8ff9408b83ac92571278550097a9d2bb5': 'initial', // Mainnet
    '0xa9c79551ea70d311f5153a27cba12396e5128b9c': 'v4.1.0',
    '0xe5dc3c0a3489b81a6f3ae3bb49bf9ccbfb85a3db': 'v5.0.0',
  },
  OptimismPortal: {
    '0x229ac4d29814249ba4830eb0e5b133df664ce4d7': 'initial', // Sepolia
    '0x4f306d5be1c85531d804b708981de90a37ac4fdd': 'initial', // Chaos
    '0x215a5ff85308a72a772f09b520da71d3520e9ac7': 'initial', // Mainnet
    '0x661dfa933f77148dc8d84b06646a2868d7ae5deb': 'v4.1.0', // Sepolia
    '0x2c431080fc733e259654f3b91e39468d9a85ac9b': 'v5.0.0', // Sepolia
    '0x3e36032b97b87231be90aab35f8a02113b984888': 'v5.0.0', // Chaos
  },
  L1StandardBridge: {
    '0x4063c3824d993784a169470e05dacc1b8501d972': 'initial', // Sepolia
    '0x31b139435516f99c3a51c4fef0e32ed8b22072dd': 'initial', // Chaos
    '0x28841965b26d41304905a836da5c0921da7dbb84': 'initial', // Mainnet
    '0x6e3c2b6af57bc789e80bb8952cf1dfdafa804e25': 'v4.1.0',
    '0xfa707f45a23370d9154af4457401274e38fa2d8a': 'v5.0.0',
  },
  L1CrossDomainMessenger: {
    '0xc1dd01079a4358aec262ad5080239542433d077a': 'initial', // Sepolia
    '0x398bf85d24331fc3360f184e35c9b80779ae2dab': 'initial', // Chaos
    '0x807124f75ff2120b2f26d7e6f9e39c03ee9de212': 'initial', // Mainnet
    '0xa183a771b6c5f6e88cd351bbdc40e1ecd4521cad': 'v4.1.0',
    '0xe45d2d835d0b2d3c7f4fee1eaa19a068d0ba8a88': 'v5.0.0',
  },
  L1ERC721Bridge: {
    '0xef32aa47df0800b8619d0522fa82a68dd4b9a8d7': 'initial', // Sepolia
    '0x9be0120a5b29e64a0b4cee301e8c9cf9aaa02d76': 'initial', // Chaos
    '0x7ae1d3bd877a4c5ca257404ce26be93a02c98013': 'initial', // Mainnet
    '0x7f1d12fb2911eb095278085f721e644c1f675696': 'v4.1.0',
    '0x74f1ac50eb0be98853805d381c884f5f9abdecf9': 'v5.0.0',
  },
  OptimismMintableERC20Factory: {
    '0xd6e36ca5ef4babe6f890534bd8479b9561c22f94': 'initial', // Sepolia
    '0x927a91facfbb86013f729b56da5d823d8d2708bc': 'initial', // Chaos
    '0x5493f4677a186f64805fe7317d6993ba4863988f': 'initial', // Mainnet
    '0x6a52641d87a600ba103ccdfbe3eb02ac7e73c04a': 'v4.1.0',
    '0x149bd036f5f57d0ff4b5f102c9d46e3c0eb2c016': 'v5.0.0',
  },
  DisputeGameFactory: {
    '0x0468d6dfbcb060cea717459a4026339d60fb34d9': 'initial', // Sepolia
    '0x6e3c055ea934c04f23e9e292bd2706b72d762bb0': 'initial', // Chaos
    '0x4bba758f006ef09402ef31724203f316ab74e4a0': 'initial', // Mainnet
    '0x33d1e8571a85a538ed3d5a4d88f46c112383439d': 'v4.1.0',
    '0x74fac1d45b98bae058f8f566201c9a81b85c7d50': 'v5.0.0',
  },
  AnchorStateRegistry: {
    '0xe8e958be5a891ff9aac5410c3923dbafd99174bb': 'initial', // Sepolia
    '0x68bc45e9774889efc5a317e9361bba655d33973c': 'initial', // Chaos
    '0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2': 'initial', // Mainnet
    '0xeb69cc681e8d4a557b30dffbad85affd47a2cf2e': 'v4.1.0', // Sepolia
    '0xcc9a707187585a5a4d15b0211310b86bec224fcc': 'v5.0.0', // Chaos
  },
  SuperchainConfig: {
    '0x1b8ca63db2e3e37c1def34f24e4c88ed422bd7c1': 'initial', // Sepolia
    '0xd76201f29bff97df757141c281f84dd66f3398db': 'initial', // Chaos
    // Mainnet initial uses same binary as v5.0.0 (b08cc720)
    '0xce28685eb204186b557133766eca00334eb441e4': 'v4.1.0',
    '0xb08cc720f511062537ca78bdb0ae691f04f5a957': 'v5.0.0',
  },
  CeloSuperchainConfig: {
    '0x00cdf709c093702c8019889e7df32d1735b80355': 'initial', // Sepolia
    '0x4a7ac982962ce927288df6f3eb8bc34bea15ea67': 'initial', // Chaos
    '0x693cfd911523ccae1a14ade2501ae4a0a463b446': 'initial', // Mainnet
  },
  DelayedWETH: {
    '0xe8249b2cffc3f71e433918c5267c71bf1e1fdc1e': 'initial', // Sepolia
    '0x008bed3ac2ba61a6c17c52e012b7b6d647954fe0': 'initial', // Chaos
    '0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796': 'initial', // Mainnet
    '0xb86a464cc743440fddaa43900e05318ef4818b29': 'v4.1.0', // Sepolia
    '0x596ca58673d9909d1578d314f2dd4e71fc3cdcfb': 'v5.0.0', // Chaos
  },
  PreimageOracle: {
    '0x855828ea44a0ce2596fdf49bea5b2859c0453704': 'initial',
    '0x58fd9886ea355a7082041a6073dac61a5740594c': 'initial', // Chaos
    '0xd59bb1d50dfeadc2cc3a7bed43c3bc4065b0ed4b': 'v5.0.0', // Chaos (New)
  },
  MIPS: {
    '0x0a691eed7be53f27f3c3b796061cdb8565da0b2a': 'initial',
    '0xf3ae9abc9bb2b4dc269f11eed2a9e5b26177773a': 'initial', // Chaos
    '0xaa59a0777648bc75cd10364083e878c1ccd6112a': 'initial', // Mainnet
    '0x07babe08ee4d07dba236530183b24055535a7011': 'v4.1.0', // Sepolia
    '0x6463dee3828677f6270d83d45408044fc5edb908': 'v5.0.0', // Sepolia
    '0x9dd9fd5a9ed48d12a2adb7525972069c078fe0ec': 'v5.0.0', // Chaos
  },
}

// Network-specific override addresses (same binary different tag per network)
const NETWORK_OVERRIDES = {
  ProtocolVersions: {
    '0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c': { _default: 'initial' }, // Mainnet
    '0x9a7ca01b64ce656b927248af08692ed2714c68e0': { _default: 'initial' }, // Sepolia
    '0xb0eb0b64b765851e34ca0bc473206e6c7415b1a5': { _default: 'initial' }, // Chaos
  },
  PreimageOracle: {
    '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3': { mainnet: 'initial', _default: 'v4.1.0' },
  },
}

// ── Version String → Release Tag Fallback ────────────────
// Maps contract version strings to release tags when impl address
// is not found in IMPL_TABLE (e.g. local Anvil forks with fresh deploys).
const VERSION_STRING_MAP = {
  CeloSuperchainConfig: {
    '1.0.0-celo': 'v4.1.0',
  },
  OptimismPortal: {
    '5.0.0': 'v4.1.0',
  },
}

/**
 * Look up implementation address → version tag.
 * Falls back to contract version string when address is unknown.
 * Returns 'initial' | 'v4.1.0' | 'v5.0.0' | null
 */
export function implLookup(contractName, addr, network, version) {
  if (!addr) return null
  const lower = addr.toLowerCase()
  const resolvedNet =
    network === 'localhost' ? NETWORKS.localhost.sourceNetwork || network : network

  // Check network-specific overrides first
  const overrides = NETWORK_OVERRIDES[contractName]
  if (overrides && overrides[lower]) {
    const entry = overrides[lower]
    return entry[resolvedNet] || entry._default || null
  }

  // Check standard table
  const table = IMPL_TABLE[contractName]
  const fromAddr = table ? table[lower] || null : null
  if (fromAddr) return fromAddr

  // Fallback: map contract version string → release tag
  if (version) {
    const vsm = VERSION_STRING_MAP[contractName]
    if (vsm && vsm[version]) return vsm[version]
  }

  return null
}

// ── Game Version Tags ──────────────────────────────────────
const GAME_VERSIONS = {
  1: {
    // PermissionedGame
    '1.4.1': { tag: 'v3 (Isthmus)', color: 'amber' },
    '1.7.0': { tag: 'v4.1 (pre-Jovian)', color: 'green' },
    '1.8.0': { tag: 'v5 (Jovian)', color: 'purple' },
  },
  42: {
    // OPSuccinctGame
    '1.0.0': { tag: 'v3 (Isthmus)', color: 'amber' },
    '2.0.0': { tag: 'v5 (Jovian)', color: 'purple' },
  },
}

/**
 * Look up game version → tag info.
 * Returns { tag, color } or null
 */
export function gameVersionTag(gameType, version) {
  if (!version) return null
  const clean = version.replace(/"/g, '')
  const table = GAME_VERSIONS[gameType]
  if (!table) return null
  return table[clean] || null
}

// ── Singleton Address Resolution ───────────────────────────
// MIPS and PreimageOracle addresses depend on DisputeGameFactory impl version
export const SINGLETON_ADDRS = {
  v5: {
    sepolia: {
      MIPS: '0x6463dee3828677f6270d83d45408044fc5edb908',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
    mainnet: {
      MIPS: '0xaa59a0777648bc75cd10364083e878c1ccd6112a',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
    chaos: {
      MIPS: '0xF3ae9abc9bb2b4dc269F11eED2A9e5b26177773A',
      PreimageOracle: '0x58fD9886ea355a7082041a6073DAC61a5740594c',
    },
  },
  v4: {
    sepolia: {
      MIPS: '0x07babe08ee4d07dba236530183b24055535a7011',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
    mainnet: {
      MIPS: '0xaa59a0777648bc75cd10364083e878c1ccd6112a',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
    chaos: {
      MIPS: '0xF3ae9abc9bb2b4dc269F11eED2A9e5b26177773A',
      PreimageOracle: '0x58fD9886ea355a7082041a6073DAC61a5740594c',
    },
  },
  initial: {
    sepolia: {
      MIPS: '0x0a691eEd7bE53F27f3C3b796061Cdb8565dA0b2a',
      PreimageOracle: '0x855828eA44a0CE2596FDf49bEA5b2859c0453704',
    },
    chaos: {
      MIPS: '0xF3ae9abc9bb2b4dc269F11eED2A9e5b26177773A',
      PreimageOracle: '0x58fD9886ea355a7082041a6073DAC61a5740594c',
    },
    mainnet: {
      MIPS: '0xaa59a0777648bc75cd10364083e878c1ccd6112a',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
  },
}

/**
 * Resolve singleton addresses based on DGF impl tag.
 */
export function resolveSingletons(dgfTag, network) {
  const resolvedNet =
    network === 'localhost' ? NETWORKS.localhost.sourceNetwork || network : network
  if (dgfTag === 'v5.0.0') return SINGLETON_ADDRS.v5[resolvedNet]
  if (dgfTag === 'v4.1.0') return SINGLETON_ADDRS.v4[resolvedNet]
  return SINGLETON_ADDRS.initial[resolvedNet]
}

// ── localStorage Cache ─────────────────────────────────────
const CACHE_PREFIX = 'xray-'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCachedData(networkId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + networkId)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    return { data, timestamp, stale: Date.now() - timestamp > CACHE_TTL }
  } catch {
    return null
  }
}

export function setCachedData(networkId, data) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + networkId,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    )
  } catch {
    /* storage full or private browsing */
  }
}

// ── Re-deployment Discovery Map ──────────────────────────
// Maps address key → contract key for automatic re-deployment detection.
// When a cross-reference property (expect) returns a different address than expected,
// the contract at that unexpected address is auto-discovered and displayed alongside
// the original as (Old) / (New).
// Only contracts that CAN be re-deployed during upgrades should be listed here.
export const DISCOVERY_MAP = {
  ANCHOR_STATE_REGISTRY_PROXY: 'AnchorStateRegistry',
  DISPUTE_GAME_FACTORY_PROXY: 'DisputeGameFactory',
  PERMISSIONED_DELAYED_WETH_PROXY: 'DelayedWETH',
  MIPS_SINGLETON: 'MIPS',
  PREIMAGE_ORACLE_SINGLETON: 'PreimageOracle',
}

// ── Contract Properties ───────────────────────────────────
// Unified property definitions for each contract.
// fn: getter function name (for ABI lookup)
// label: display label (e.g., 'systemConfig()')
// expect?: address key for cross-reference validation
// args?: call arguments (e.g., [1] for gameImpls)
// type?: return type: 'bool', 'uint256', 'uint32', 'uint64', 'seconds', 'string', 'bytes32', 'duration'
// Default type is 'address' if expect is set, otherwise infer from value.
// All calls use try/catch — v3 contracts missing v5 getters gracefully return null.
export const CONTRACT_PROPS = {
  SystemConfig: [
    { fn: 'minimumGasLimit', label: 'minimumGasLimit()', type: 'uint64' },
    { fn: 'maximumGasLimit', label: 'maximumGasLimit()', type: 'uint64' },
    { fn: 'minBaseFee', label: 'minBaseFee()', type: 'uint64' },
    { fn: 'unsafeBlockSigner', label: 'unsafeBlockSigner()', type: 'address' },
    {
      fn: 'l1CrossDomainMessenger',
      label: 'l1CrossDomainMessenger()',
      expect: 'L1_CROSS_DOMAIN_MESSENGER_PROXY',
    },
    { fn: 'l1ERC721Bridge', label: 'l1ERC721Bridge()', expect: 'L1_ERC721_BRIDGE_PROXY' },
    { fn: 'l1StandardBridge', label: 'l1StandardBridge()', expect: 'L1_STANDARD_BRIDGE_PROXY' },
    {
      fn: 'disputeGameFactory',
      label: 'disputeGameFactory()',
      expect: 'DISPUTE_GAME_FACTORY_PROXY',
    },
    { fn: 'optimismPortal', label: 'optimismPortal()', expect: 'OPTIMISM_PORTAL_PROXY' },
    {
      fn: 'optimismMintableERC20Factory',
      label: 'optimismMintableERC20Factory()',
      expect: 'OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY',
    },
    { fn: 'batchInbox', label: 'batchInbox()', type: 'address' },
    { fn: 'startBlock', label: 'startBlock()', type: 'uint256' },
    { fn: 'gasPayingToken', label: 'gasPayingToken()', type: 'address' },
    { fn: 'isCustomGasToken', label: 'isCustomGasToken()', type: 'bool' },
    { fn: 'gasPayingTokenName', label: 'gasPayingTokenName()', type: 'string' },
    { fn: 'gasPayingTokenSymbol', label: 'gasPayingTokenSymbol()', type: 'string' },
    {
      fn: 'superchainConfig',
      label: 'superchainConfig()',
      expect: ['SUPERCHAIN_CONFIG_PROXY', 'CELO_SUPERCHAIN_CONFIG_PROXY'],
    },
    { fn: 'guardian', label: 'guardian()', type: 'address' },
    { fn: 'paused', label: 'paused()', type: 'bool' },
  ],
  CeloSuperchainConfig: [
    { fn: 'superchainConfig', label: 'superchainConfig()', expect: 'SUPERCHAIN_CONFIG_PROXY' },
    { fn: 'guardian', label: 'guardian()', type: 'address' },
    { fn: 'paused', label: 'paused()', type: 'bool' },
  ],
  SuperchainConfig: [
    { fn: 'paused', label: 'paused()', type: 'bool' },
    { fn: 'guardian', label: 'guardian()', type: 'address' },
  ],
  OptimismPortal: [
    { fn: 'systemConfig', label: 'systemConfig()', expect: 'SYSTEM_CONFIG_PROXY' },
    {
      fn: 'superchainConfig',
      label: 'superchainConfig()',
      expect: ['SUPERCHAIN_CONFIG_PROXY', 'CELO_SUPERCHAIN_CONFIG_PROXY'],
    },
    {
      fn: 'disputeGameFactory',
      label: 'disputeGameFactory()',
      expect: 'DISPUTE_GAME_FACTORY_PROXY',
    },
    {
      fn: 'anchorStateRegistry',
      label: 'anchorStateRegistry()',
      expect: 'ANCHOR_STATE_REGISTRY_PROXY',
    },
    { fn: 'guardian', label: 'guardian()', type: 'address' },
    { fn: 'balance', label: 'balance()', type: 'uint256' },
    { fn: 'paused', label: 'paused()', type: 'bool' },
    { fn: 'respectedGameType', label: 'respectedGameType()', type: 'uint32' },
    { fn: 'proofMaturityDelaySeconds', label: 'proofMaturityDelaySeconds()', type: 'seconds' },
    {
      fn: 'disputeGameFinalityDelaySeconds',
      label: 'disputeGameFinalityDelaySeconds()',
      type: 'seconds',
    },
    { fn: 'ethLockbox', label: 'ethLockbox()', type: 'address' },
  ],
  L1StandardBridge: [
    { fn: 'systemConfig', label: 'systemConfig()', expect: 'SYSTEM_CONFIG_PROXY' },
    {
      fn: 'superchainConfig',
      label: 'superchainConfig()',
      expect: ['SUPERCHAIN_CONFIG_PROXY', 'CELO_SUPERCHAIN_CONFIG_PROXY'],
    },
    { fn: 'paused', label: 'paused()', type: 'bool' },
    { fn: 'l2TokenBridge', label: 'l2TokenBridge()', type: 'address' },
  ],
  L1CrossDomainMessenger: [
    { fn: 'portal', label: 'portal()', expect: 'OPTIMISM_PORTAL_PROXY' },
    { fn: 'systemConfig', label: 'systemConfig()', expect: 'SYSTEM_CONFIG_PROXY' },
    {
      fn: 'superchainConfig',
      label: 'superchainConfig()',
      expect: ['SUPERCHAIN_CONFIG_PROXY', 'CELO_SUPERCHAIN_CONFIG_PROXY'],
    },
    { fn: 'paused', label: 'paused()', type: 'bool' },
  ],
  L1ERC721Bridge: [
    { fn: 'systemConfig', label: 'systemConfig()', expect: 'SYSTEM_CONFIG_PROXY' },
    {
      fn: 'superchainConfig',
      label: 'superchainConfig()',
      expect: ['SUPERCHAIN_CONFIG_PROXY', 'CELO_SUPERCHAIN_CONFIG_PROXY'],
    },
    { fn: 'paused', label: 'paused()', type: 'bool' },
  ],
  OptimismMintableERC20Factory: [
    { fn: 'bridge', label: 'bridge()', expect: 'L1_STANDARD_BRIDGE_PROXY' },
  ],
  DisputeGameFactory: [
    { fn: 'gameImpls', label: 'gameImpls(1)', args: [1], type: 'address' },
    { fn: 'gameImpls', label: 'gameImpls(42)', args: [42], type: 'address' },
    { fn: 'initBonds', label: 'initBonds(1)', args: [1], type: 'uint256' },
    { fn: 'initBonds', label: 'initBonds(42)', args: [42], type: 'uint256' },
  ],
  AnchorStateRegistry: [
    { fn: 'systemConfig', label: 'systemConfig()', expect: 'SYSTEM_CONFIG_PROXY' },
    {
      fn: 'disputeGameFactory',
      label: 'disputeGameFactory()',
      expect: 'DISPUTE_GAME_FACTORY_PROXY',
    },
    {
      fn: 'superchainConfig',
      label: 'superchainConfig()',
      expect: ['SUPERCHAIN_CONFIG_PROXY', 'CELO_SUPERCHAIN_CONFIG_PROXY'],
    },
    { fn: 'anchorGame', label: 'anchorGame()', type: 'address' },
    { fn: 'respectedGameType', label: 'respectedGameType()', type: 'uint32' },
    { fn: 'paused', label: 'paused()', type: 'bool' },
    {
      fn: 'disputeGameFinalityDelaySeconds',
      label: 'disputeGameFinalityDelaySeconds()',
      type: 'seconds',
    },
    { fn: 'retirementTimestamp', label: 'retirementTimestamp()', type: 'uint256' },
  ],
  DelayedWETH: [
    { fn: 'systemConfig', label: 'systemConfig()', expect: 'SYSTEM_CONFIG_PROXY' },
    { fn: 'delay', label: 'delay()', type: 'seconds' },
    {
      fn: 'config',
      label: 'config()',
      expect: ['SUPERCHAIN_CONFIG_PROXY', 'CELO_SUPERCHAIN_CONFIG_PROXY'],
    },
  ],
  ProtocolVersions: [
    { fn: 'required', label: 'required()', type: 'uint256' },
    { fn: 'recommended', label: 'recommended()', type: 'uint256' },
  ],
  MIPS: [{ fn: 'oracle', label: 'oracle()', type: 'address', expect: 'PREIMAGE_ORACLE_SINGLETON' }],
  PreimageOracle: [
    { fn: 'challengePeriod', label: 'challengePeriod()', type: 'seconds' },
    { fn: 'minProposalSize', label: 'minProposalSize()', type: 'uint256' },
  ],
}
// ── Game Template Immutables ─────────────────────────────
// Read from gameImpls() addresses (game template contracts).
export const GAME_IMMUTABLE_VARS = {
  1: [
    { fn: 'proposer', label: 'Proposer', type: 'address' },
    { fn: 'challenger', label: 'Challenger', type: 'address' },
    { fn: 'gameType', label: 'Game Type', type: 'uint32' },
    { fn: 'absolutePrestate', label: 'Absolute Prestate', type: 'bytes32' },
    { fn: 'maxGameDepth', label: 'Max Game Depth', type: 'uint256' },
    { fn: 'splitDepth', label: 'Split Depth', type: 'uint256' },
    { fn: 'maxClockDuration', label: 'Max Clock Duration', type: 'duration' },
    { fn: 'clockExtension', label: 'Clock Extension', type: 'duration' },
    { fn: 'vm', label: 'VM (BigStepper)', type: 'address', expect: 'MIPS_SINGLETON' },
    {
      fn: 'weth',
      label: 'DelayedWETH',
      type: 'address',
      expect: 'PERMISSIONED_DELAYED_WETH_PROXY',
    },
    {
      fn: 'anchorStateRegistry',
      label: 'AnchorStateRegistry',
      type: 'address',
      expect: 'ANCHOR_STATE_REGISTRY_PROXY',
    },
    { fn: 'l2ChainId', label: 'L2 Chain ID', type: 'uint256' },
  ],
  42: [
    { fn: 'gameType', label: 'Game Type', type: 'uint32' },
    { fn: 'maxChallengeDuration', label: 'Max Challenge Duration', type: 'duration' },
    { fn: 'maxProveDuration', label: 'Max Prove Duration', type: 'duration' },
    {
      fn: 'disputeGameFactory',
      label: 'DisputeGameFactory',
      type: 'address',
      expect: 'DISPUTE_GAME_FACTORY_PROXY',
    },
    { fn: 'sp1Verifier', label: 'SP1 Verifier', type: 'address' },
    { fn: 'rollupConfigHash', label: 'Rollup Config Hash', type: 'bytes32' },
    { fn: 'aggregationVkey', label: 'Aggregation VKey', type: 'bytes32' },
    { fn: 'rangeVkeyCommitment', label: 'Range VKey Commitment', type: 'bytes32' },
    { fn: 'challengerBond', label: 'Challenger Bond', type: 'uint256' },
    {
      fn: 'anchorStateRegistry',
      label: 'AnchorStateRegistry',
      type: 'address',
      expect: 'ANCHOR_STATE_REGISTRY_PROXY',
    },
    { fn: 'accessManager', label: 'Access Manager', type: 'address', expect: 'ACCESS_MANAGER' },
  ],
}
