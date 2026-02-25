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
    },
  },
  chaos: {
    id: 'chaos',
    label: 'Chaos Testnet',
    shortLabel: 'Chaos',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    addresses: {
      SYSTEM_CONFIG_PROXY: '0x624ce254d4d0e84e4179897c9e9b97784f37f6fd',
      OPTIMISM_PORTAL_PROXY: '0x37e3521cc2c2e3fc12ad4adc36aa8f6b6b686473',
      L1_STANDARD_BRIDGE_PROXY: '0xb2f2468d0ab462da6cab2ef547fefd3511e33d14',
      L1_CROSS_DOMAIN_MESSENGER_PROXY: '0x88bc63f650a49a5b3d10035cd5bdab036da0e3d8',
      L1_ERC721_BRIDGE_PROXY: '0xe9b3351f4632df6609ab6434c17667ecb97a5f6d',
      OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY: '0x80a8c6c150bdbd0f0c6ac7fc71c42fd6523f8284',
      DISPUTE_GAME_FACTORY_PROXY: '0xc0215f0202418568c06b899f5e11245dbf717802',
      ANCHOR_STATE_REGISTRY_PROXY: '0x06ec7ffc5ec88b750152bc26e4a456345a57c286',
      SUPERCHAIN_CONFIG_PROXY: '0x852A5763dA3Fdf51a8b816E02b91A054904Bd8B0',
      CELO_SUPERCHAIN_CONFIG_PROXY: '0xd1ed48c497abc6276804b16e72045f0dd5878e2a',
      PROTOCOL_VERSIONS_PROXY: '0x433a83893DDA68B941D4aefA908DED9c599522ad',
      PERMISSIONED_DELAYED_WETH_PROXY: '0x6089ec4cf7c5d571901f32b2cb51ae01f14d65c5',
      PROXY_ADMIN: '0x6151d1cc7724ee7594f414c152320757c9c5844e',
      ADDRESS_MANAGER: '0xfc7950601fd0b3d07fcb8899a6dfaf578eac8fec',
    },
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
  'v4.1.0': { label: 'v4.1.0 (pre-Jovian)', color: 'green' },
  'v5.0.0': { label: 'v5.0.0 (Jovian)', color: 'purple' },
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
    '0x8f3af3a2abf706a6b1a334d15833f72de6efad93': 'initial', // Chaos
    '0x215a5ff85308a72a772f09b520da71d3520e9ac7': 'initial', // Mainnet
    '0x661dfa933f77148dc8d84b06646a2868d7ae5deb': 'v4.1.0', // Sepolia
    '0x4fd87a100bd869080789a178c53fdeac5e23ae4c': 'v4.1.0', // Chaos
    '0x2c431080fc733e259654f3b91e39468d9a85ac9b': 'v5.0.0', // Sepolia
    '0x5b0faa24146d607bd72b9b472d2d0f2c7ccd19ae': 'v5.0.0', // Chaos
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
    '0xb38a2b523c6c2effa7473cf54adac0ba1ade99b2': 'v4.1.0', // Chaos
    // v5.0.0 uses same impl as v4.1.0
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
    '0x37c91ad60e49cf606bfefe96122629c2488d982d': 'initial', // Chaos
    '0x693cfd911523ccae1a14ade2501ae4a0a463b446': 'initial', // Mainnet
  },
  DelayedWETH: {
    '0xe8249b2cffc3f71e433918c5267c71bf1e1fdc1e': 'initial', // Sepolia
    '0x158ec618e7b6e14ab039a9fade14f15cfdb8e2e7': 'initial', // Chaos
    '0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796': 'initial', // Mainnet
    '0xb86a464cc743440fddaa43900e05318ef4818b29': 'v4.1.0', // Sepolia
    '0x6803e87a24c8019f42e89dc06a4c8749373e99ad': 'v4.1.0', // Chaos
    // v5.0.0 uses same impl as v4.1.0
  },
  PreimageOracle: {
    '0x855828ea44a0ce2596fdf49bea5b2859c0453704': 'initial',
    '0xf6516bcb58cd4b2d2a4325cc329b97627053cf83': 'v4.1.0', // Chaos
    // v5.0.0 uses same impl as v4.1.0
  },
  MIPS: {
    '0x0a691eed7be53f27f3c3b796061cdb8565da0b2a': 'initial',
    '0xaa59a0777648bc75cd10364083e878c1ccd6112a': 'initial', // Mainnet
    '0x07babe08ee4d07dba236530183b24055535a7011': 'v4.1.0', // Sepolia
    '0x0c908f56eb51e01ed055d2dff5b5842a5f0f28b2': 'v4.1.0', // Chaos
    '0x6463dee3828677f6270d83d45408044fc5edb908': 'v5.0.0', // Sepolia
    '0x96dc36d70491000d9f16e1b25afa1876ecfc994e': 'v5.0.0', // Chaos
  },
}

// Network-specific override addresses (same binary different tag per network)
const NETWORK_OVERRIDES = {
  ProtocolVersions: {
    '0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c': { mainnet: 'initial', _default: 'v4.1.0' },
  },
  PreimageOracle: {
    '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3': { mainnet: 'initial', _default: 'v4.1.0' },
  },
}

/**
 * Look up implementation address → version tag.
 * Returns 'initial' | 'v4.1.0' | 'v5.0.0' | null
 */
export function implLookup(contractName, addr, network) {
  if (!addr) return null
  const lower = addr.toLowerCase()

  // Check network-specific overrides first
  const overrides = NETWORK_OVERRIDES[contractName]
  if (overrides && overrides[lower]) {
    const entry = overrides[lower]
    return entry[network] || entry._default || null
  }

  // Check standard table
  const table = IMPL_TABLE[contractName]
  if (!table) return null
  return table[lower] || null
}

// ── Game Version Tags ──────────────────────────────────────
const GAME_VERSIONS = {
  1: {
    // PermissionedGame
    '1.4.1': { tag: 'Isthmus', color: 'amber' },
    '1.7.0': { tag: 'pre-Jovian', color: 'green' },
    '1.8.0': { tag: 'Jovian', color: 'purple' },
  },
  42: {
    // OPSuccinctGame
    '1.0.0': { tag: 'Isthmus', color: 'amber' },
    '2.0.0': { tag: 'Jovian', color: 'purple' },
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
    chaos: {
      MIPS: '0x96dc36d70491000d9f16e1b25afa1876ecfc994e',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
    mainnet: {
      MIPS: '0xaa59a0777648bc75cd10364083e878c1ccd6112a',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
  },
  v4: {
    sepolia: {
      MIPS: '0x07babe08ee4d07dba236530183b24055535a7011',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
    chaos: {
      MIPS: '0x0c908f56eb51e01ed055d2dff5b5842a5f0f28b2',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
    mainnet: {
      MIPS: '0xaa59a0777648bc75cd10364083e878c1ccd6112a',
      PreimageOracle: '0x1fb8cdfc6831fc866ed9c51af8817da5c287add3',
    },
  },
  initial: {
    sepolia: {
      MIPS: '0x0a691eEd7bE53F27f3C3b796061Cdb8565dA0b2a',
      PreimageOracle: '0x855828eA44a0CE2596FDf49bEA5b2859c0453704',
    },
    chaos: {
      MIPS: '0x0a691eEd7bE53F27f3C3b796061Cdb8565dA0b2a',
      PreimageOracle: '0x855828eA44a0CE2596FDf49bEA5b2859c0453704',
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
  if (dgfTag === 'v5.0.0') return SINGLETON_ADDRS.v5[network]
  if (dgfTag === 'v4.1.0') return SINGLETON_ADDRS.v4[network]
  return SINGLETON_ADDRS.initial[network]
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

// ── Cross-Reference Definitions ──────────────────────────
// Getters to call on each proxy to validate cross-contract wiring.
// 'expect' = address key in NETWORKS[n].addresses that the result should match.
// 'type' overrides the default 'address' return type.
// 'args' = optional call arguments (e.g. gameImpls(1)).
// All calls use try/catch — v3 contracts missing v5 getters gracefully return null.
export const CONTRACT_REFS = {
  SystemConfig: [
    { fn: 'optimismPortal', label: 'OptimismPortal', expect: 'OPTIMISM_PORTAL_PROXY' },
    {
      fn: 'l1CrossDomainMessenger',
      label: 'L1CrossDomainMessenger',
      expect: 'L1_CROSS_DOMAIN_MESSENGER_PROXY',
    },
    { fn: 'l1StandardBridge', label: 'L1StandardBridge', expect: 'L1_STANDARD_BRIDGE_PROXY' },
    { fn: 'l1ERC721Bridge', label: 'L1ERC721Bridge', expect: 'L1_ERC721_BRIDGE_PROXY' },
    {
      fn: 'optimismMintableERC20Factory',
      label: 'MintableERC20Factory',
      expect: 'OPTIMISM_MINTABLE_ERC20_FACTORY_PROXY',
    },
    { fn: 'disputeGameFactory', label: 'DisputeGameFactory', expect: 'DISPUTE_GAME_FACTORY_PROXY' },
    { fn: 'superchainConfig', label: 'SuperchainConfig', expect: 'SUPERCHAIN_CONFIG_PROXY' },
  ],
  OptimismPortal: [
    { fn: 'systemConfig', label: 'SystemConfig', expect: 'SYSTEM_CONFIG_PROXY' },
    { fn: 'respectedGameType', label: 'Respected Game Type', type: 'uint32' },
  ],
  L1CrossDomainMessenger: [
    { fn: 'portal', label: 'OptimismPortal', expect: 'OPTIMISM_PORTAL_PROXY' },
    { fn: 'systemConfig', label: 'SystemConfig', expect: 'SYSTEM_CONFIG_PROXY' },
  ],
  L1StandardBridge: [
    { fn: 'MESSENGER', label: 'L1CrossDomainMessenger', expect: 'L1_CROSS_DOMAIN_MESSENGER_PROXY' },
    { fn: 'systemConfig', label: 'SystemConfig', expect: 'SYSTEM_CONFIG_PROXY' },
  ],
  L1ERC721Bridge: [
    { fn: 'MESSENGER', label: 'L1CrossDomainMessenger', expect: 'L1_CROSS_DOMAIN_MESSENGER_PROXY' },
    { fn: 'systemConfig', label: 'SystemConfig', expect: 'SYSTEM_CONFIG_PROXY' },
  ],
  OptimismMintableERC20Factory: [
    { fn: 'bridge', label: 'L1StandardBridge', expect: 'L1_STANDARD_BRIDGE_PROXY' },
  ],
  AnchorStateRegistry: [
    { fn: 'systemConfig', label: 'SystemConfig', expect: 'SYSTEM_CONFIG_PROXY' },
    { fn: 'disputeGameFactory', label: 'DisputeGameFactory', expect: 'DISPUTE_GAME_FACTORY_PROXY' },
  ],
  DelayedWETH: [{ fn: 'systemConfig', label: 'SystemConfig', expect: 'SYSTEM_CONFIG_PROXY' }],
  DisputeGameFactory: [
    { fn: 'gameImpls', label: 'gameImpls(1) — PermissionedGame', args: [1], type: 'address' },
    { fn: 'gameImpls', label: 'gameImpls(42) — OPSuccinctGame', args: [42], type: 'address' },
  ],
  SuperchainConfig: [{ fn: 'guardian', label: 'Guardian', type: 'address' }],
  CeloSuperchainConfig: [{ fn: 'guardian', label: 'Guardian', type: 'address' }],
}

// ── Pausable Contracts ───────────────────────────────────
export const PAUSABLE_CONTRACTS = ['SystemConfig', 'SuperchainConfig', 'CeloSuperchainConfig']

// ── Immutable Variables ──────────────────────────────────
// Read from impl address (not proxy) since immutables are baked into bytecode.
// For singletons (PreimageOracle), read from the singleton address directly.
// All calls use try/catch — missing getters on older versions return null.
export const IMMUTABLE_VARS = {
  OptimismPortal: [
    { fn: 'proofMaturityDelaySeconds', label: 'Proof Maturity Delay', type: 'seconds' },
    { fn: 'disputeGameFinalityDelaySeconds', label: 'DG Finality Delay', type: 'seconds' },
  ],
  AnchorStateRegistry: [
    { fn: 'disputeGameFinalityDelaySeconds', label: 'DG Finality Delay', type: 'seconds' },
  ],
  DelayedWETH: [{ fn: 'delay', label: 'WETH Delay', type: 'seconds' }],
  PreimageOracle: [
    { fn: 'challengePeriod', label: 'Challenge Period', type: 'seconds' },
    { fn: 'minProposalSize', label: 'Min Proposal Size', type: 'uint256' },
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
    { fn: 'vm', label: 'VM (BigStepper)', type: 'address' },
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
    { fn: 'accessManager', label: 'Access Manager', type: 'address' },
  ],
}
