import { createPublicClient, http, parseAbi, getAddress } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import {
  NETWORKS,
  EIP1967,
  ZERO_ADDR,
  PROXIED_CONTRACTS,
  RESOLVED_CONTRACTS,
  proxyKey,
  implLookup,
  gameVersionTag,
  resolveSingletons,
  CONTRACT_PROPS,
  GAME_IMMUTABLE_VARS,
  DISCOVERY_MAP,
} from './config.js'

// ── ABI Fragments ──────────────────────────────────────────
const ABI = {
  version: parseAbi(['function version() view returns (string)']),
  owner: parseAbi(['function owner() view returns (address)']),
  getThreshold: parseAbi(['function getThreshold() view returns (uint256)']),
  getOwners: parseAbi(['function getOwners() view returns (address[])']),
  getAddress: parseAbi(['function getAddress(string) view returns (address)']),
  // Contract property getters
  superchainConfig: parseAbi(['function superchainConfig() view returns (address)']),
  guardian: parseAbi(['function guardian() view returns (address)']),
  gameImpls: parseAbi(['function gameImpls(uint32) view returns (address)']),
  systemConfig: parseAbi(['function systemConfig() view returns (address)']),
  optimismPortal: parseAbi(['function optimismPortal() view returns (address)']),
  l1CrossDomainMessenger: parseAbi(['function l1CrossDomainMessenger() view returns (address)']),
  l1StandardBridge: parseAbi(['function l1StandardBridge() view returns (address)']),
  l1ERC721Bridge: parseAbi(['function l1ERC721Bridge() view returns (address)']),
  optimismMintableERC20Factory: parseAbi([
    'function optimismMintableERC20Factory() view returns (address)',
  ]),
  disputeGameFactory: parseAbi(['function disputeGameFactory() view returns (address)']),
  portal: parseAbi(['function portal() view returns (address)']),
  MESSENGER: parseAbi(['function MESSENGER() view returns (address)']),
  bridge: parseAbi(['function bridge() view returns (address)']),
  respectedGameType: parseAbi(['function respectedGameType() view returns (uint32)']),
  paused: parseAbi(['function paused() view returns (bool)']),
  // New getters
  minimumGasLimit: parseAbi(['function minimumGasLimit() view returns (uint64)']),
  maximumGasLimit: parseAbi(['function maximumGasLimit() view returns (uint64)']),
  unsafeBlockSigner: parseAbi(['function unsafeBlockSigner() view returns (address)']),
  batchInbox: parseAbi(['function batchInbox() view returns (address)']),
  startBlock: parseAbi(['function startBlock() view returns (uint256)']),
  minBaseFee: parseAbi(['function minBaseFee() view returns (uint64)']),
  gasPayingToken: parseAbi(['function gasPayingToken() view returns (address, uint8)']),
  isCustomGasToken: parseAbi(['function isCustomGasToken() view returns (bool)']),
  gasPayingTokenName: parseAbi(['function gasPayingTokenName() view returns (string)']),
  gasPayingTokenSymbol: parseAbi(['function gasPayingTokenSymbol() view returns (string)']),
  ethLockbox: parseAbi(['function ethLockbox() view returns (address)']),
  balance: parseAbi(['function balance() view returns (uint256)']),
  l2TokenBridge: parseAbi(['function l2TokenBridge() view returns (address)']),
  initBonds: parseAbi(['function initBonds(uint32) view returns (uint256)']),
  anchorGame: parseAbi(['function anchorGame() view returns (address)']),
  config: parseAbi(['function config() view returns (address)']),
  retirementTimestamp: parseAbi(['function retirementTimestamp() view returns (uint256)']),
  required: parseAbi(['function required() view returns (uint256)']),
  recommended: parseAbi(['function recommended() view returns (uint256)']),
  oracle: parseAbi(['function oracle() view returns (address)']),
  // Immutables – proxied contract impls
  proofMaturityDelaySeconds: parseAbi([
    'function proofMaturityDelaySeconds() view returns (uint256)',
  ]),
  disputeGameFinalityDelaySeconds: parseAbi([
    'function disputeGameFinalityDelaySeconds() view returns (uint256)',
  ]),
  delay: parseAbi(['function delay() view returns (uint256)']),
  challengePeriod: parseAbi(['function challengePeriod() view returns (uint256)']),
  minProposalSize: parseAbi(['function minProposalSize() view returns (uint256)']),
  // Immutables – game templates
  proposer: parseAbi(['function proposer() view returns (address)']),
  challenger: parseAbi(['function challenger() view returns (address)']),
  absolutePrestate: parseAbi(['function absolutePrestate() view returns (bytes32)']),
  maxGameDepth: parseAbi(['function maxGameDepth() view returns (uint256)']),
  splitDepth: parseAbi(['function splitDepth() view returns (uint256)']),
  maxClockDuration: parseAbi(['function maxClockDuration() view returns (uint64)']),
  clockExtension: parseAbi(['function clockExtension() view returns (uint64)']),
  vm: parseAbi(['function vm() view returns (address)']),
  weth: parseAbi(['function weth() view returns (address)']),
  anchorStateRegistry: parseAbi(['function anchorStateRegistry() view returns (address)']),
  l2ChainId: parseAbi(['function l2ChainId() view returns (uint256)']),
  gameType: parseAbi(['function gameType() view returns (uint32)']),
  // Immutables – OPSuccinctFaultDisputeGame
  maxChallengeDuration: parseAbi(['function maxChallengeDuration() view returns (uint64)']),
  maxProveDuration: parseAbi(['function maxProveDuration() view returns (uint64)']),
  sp1Verifier: parseAbi(['function sp1Verifier() view returns (address)']),
  rollupConfigHash: parseAbi(['function rollupConfigHash() view returns (bytes32)']),
  aggregationVkey: parseAbi(['function aggregationVkey() view returns (bytes32)']),
  rangeVkeyCommitment: parseAbi(['function rangeVkeyCommitment() view returns (bytes32)']),
  challengerBond: parseAbi(['function challengerBond() view returns (uint256)']),
  accessManager: parseAbi(['function accessManager() view returns (address)']),
}

// ── Client Factory ─────────────────────────────────────────
const clients = {}

function getClient(networkId) {
  if (clients[networkId]) return clients[networkId]
  const cfg = NETWORKS[networkId]
  let chain
  if (networkId === 'mainnet') chain = mainnet
  else if (networkId === 'localhost') {
    chain = {
      id: 31337,
      name: 'Localhost',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [cfg.rpcUrl] } },
    }
  } else chain = sepolia
  clients[networkId] = createPublicClient({
    chain,
    transport: http(cfg.rpcUrl, {
      batch: { wait: 50 },
      retryCount: 2,
      retryDelay: 1000,
    }),
  })
  return clients[networkId]
}

export function resetClient(networkId) {
  delete clients[networkId]
}

// ── Low-Level Helpers ──────────────────────────────────────

async function readStorage(client, addr, slot) {
  try {
    const raw = await client.getStorageAt({ address: addr, slot })
    if (!raw || raw === '0x' + '0'.repeat(64)) return ZERO_ADDR
    return getAddress('0x' + raw.slice(26))
  } catch {
    return ZERO_ADDR
  }
}

async function readVersion(client, addr) {
  try {
    return await client.readContract({ address: addr, abi: ABI.version, functionName: 'version' })
  } catch {
    return null
  }
}

async function readOwner(client, addr) {
  try {
    const result = await client.readContract({
      address: addr,
      abi: ABI.owner,
      functionName: 'owner',
    })
    return result === ZERO_ADDR ? null : result
  } catch {
    return null
  }
}

async function readGameImpl(client, dgfAddr, gameType) {
  try {
    const addr = await client.readContract({
      address: dgfAddr,
      abi: ABI.gameImpls,
      functionName: 'gameImpls',
      args: [gameType],
    })
    return addr === ZERO_ADDR ? null : addr
  } catch {
    return null
  }
}

async function resolveFromAddressManager(client, amAddr, name) {
  try {
    return await client.readContract({
      address: amAddr,
      abi: ABI.getAddress,
      functionName: 'getAddress',
      args: [name],
    })
  } catch {
    return null
  }
}

/**
 * Generic safe read — calls any known ABI getter by function name.
 * Returns the raw value on success, null on revert.
 */
async function safeRead(client, addr, fnName, args) {
  const abi = ABI[fnName]
  if (!abi) return null
  try {
    return await client.readContract({
      address: addr,
      abi,
      functionName: fnName,
      args: args || undefined,
    })
  } catch {
    return null
  }
}

// ── Address Classification ─────────────────────────────────

export async function classifyAddress(client, addr) {
  if (!addr || addr === ZERO_ADDR) return { type: 'zero', details: null }

  try {
    const code = await client.getCode({ address: addr })
    if (!code || code === '0x') return { type: 'EOA', details: null }
  } catch {
    return { type: 'unknown', details: null }
  }

  // Try Safe detection
  try {
    const threshold = await client.readContract({
      address: addr,
      abi: ABI.getThreshold,
      functionName: 'getThreshold',
    })
    if (threshold && threshold > 0n) {
      let owners = []
      try {
        owners = await client.readContract({
          address: addr,
          abi: ABI.getOwners,
          functionName: 'getOwners',
        })
      } catch {
        /* ignore */
      }
      return {
        type: 'Safe',
        details: { threshold: Number(threshold), owners: owners.map((o) => o) },
      }
    }
  } catch {
    /* not a Safe */
  }

  // Try Ownable
  const owner = await readOwner(client, addr)
  if (owner) return { type: 'Contract', details: { owner } }

  return { type: 'Contract', details: null }
}

// ── Contract Property Fetching ─────────────────────────────

/**
 * Fetch unified contract properties from CONTRACT_PROPS.
 * Returns array of { label, value, type, expected, valid }.
 */
async function fetchContractProps(client, addr, contractKey, networkAddrs) {
  const defs = CONTRACT_PROPS[contractKey]
  if (!defs || defs.length === 0 || !addr) return []

  const results = await Promise.all(
    defs.map(async (def) => {
      let value = await safeRead(client, addr, def.fn, def.args)
      if (value === null || value === undefined) return null

      // Handle tuple returns (e.g., gasPayingToken returns [address, uint8])
      if (Array.isArray(value)) value = value[0]

      const type = def.type || 'address'
      const expects = Array.isArray(def.expect) ? def.expect : def.expect ? [def.expect] : []
      const expectedAddrs = expects.map((k) => networkAddrs[k]).filter(Boolean)
      let valid = null
      if (expectedAddrs.length > 0 && value) {
        const valStr = (typeof value === 'string' ? value : String(value)).toLowerCase()
        valid = expectedAddrs.some((e) => valStr === e.toLowerCase())
      }

      return { label: def.label, value, type, expected: expectedAddrs[0] || null, valid }
    })
  )

  return results.filter(Boolean)
}

// ── Immutable Variable Fetching ────────────────────────────

/**
 * Fetch immutable variables from an implementation or singleton address.
 * Returns array of { label, value, type }.
 */
async function fetchImmutables(client, targetAddr, defs, networkAddrs) {
  if (!defs || defs.length === 0 || !targetAddr || targetAddr === ZERO_ADDR) return []

  const results = await Promise.all(
    defs.map(async (def) => {
      const value = await safeRead(client, targetAddr, def.fn)
      if (value === null || value === undefined) return null

      const type = def.type || 'uint256'
      const expects = Array.isArray(def.expect) ? def.expect : def.expect ? [def.expect] : []
      const expectedAddrs = networkAddrs ? expects.map((k) => networkAddrs[k]).filter(Boolean) : []
      let valid = null
      if (expectedAddrs.length > 0 && value) {
        const valStr = (typeof value === 'string' ? value : String(value)).toLowerCase()
        valid = expectedAddrs.some((e) => valStr === e.toLowerCase())
      }

      return {
        label: def.label,
        fn: def.fn,
        value,
        type,
        expect: def.expect || null,
        valid,
      }
    })
  )

  return results.filter(Boolean)
}

/**
 * Fetch immutable variables from a game template address.
 */
async function fetchGameImmutables(client, gameAddr, gameType, networkAddrs) {
  const defs = GAME_IMMUTABLE_VARS[gameType]
  if (!defs || !gameAddr) return []
  return fetchImmutables(client, gameAddr, defs, networkAddrs)
}

// ── Contract Data Fetching ─────────────────────────────────

async function fetchProxiedContract(client, networkId, contractKey) {
  const cfg = NETWORKS[networkId]
  const addrKey = proxyKey(contractKey)
  const proxy = cfg.addresses[addrKey]
  if (!proxy) return null

  const [impl, admin, version, owner] = await Promise.all([
    readStorage(client, proxy, EIP1967.IMPL_SLOT),
    readStorage(client, proxy, EIP1967.ADMIN_SLOT),
    readVersion(client, proxy),
    readOwner(client, proxy),
  ])

  const tag = implLookup(contractKey, impl, networkId, version)

  // Fetch unified properties
  const props = await fetchContractProps(client, proxy, contractKey, cfg.addresses)

  return {
    key: contractKey,
    proxy,
    impl,
    admin,
    version,
    owner,
    tag,
    props,
  }
}

async function fetchResolvedContract(client, networkId, contractKey, resolveName) {
  const cfg = NETWORKS[networkId]
  const addrKey = proxyKey(contractKey)
  const proxy = cfg.addresses[addrKey]
  const am = cfg.addresses.ADDRESS_MANAGER
  if (!proxy || !am) return null

  const [impl, version, owner] = await Promise.all([
    resolveFromAddressManager(client, am, resolveName),
    readVersion(client, proxy),
    readOwner(client, proxy),
  ])

  const tag = implLookup(contractKey, impl, networkId, version)

  // Fetch unified properties
  const props = await fetchContractProps(client, proxy, contractKey, cfg.addresses)

  return {
    key: contractKey,
    proxy,
    impl,
    admin: null, // ResolvedDelegateProxy has no EIP-1967 admin
    version,
    owner,
    tag,
    resolvedVia: 'AddressManager',
    addressManager: am,
    resolveName,
    props,
  }
}

// ── Automatic Re-deployment Discovery ─────────────────────

/**
 * Scan fetched contracts for cross-reference mismatches that indicate a re-deployment.
 * When a property’s `expect` address doesn’t match the on-chain value, the on-chain
 * address is the “new” contract. We fetch its full data and store it as a discovered
 * contract, while the original (at the expected proxy address) becomes the “old”.
 *
 * Returns Map<contractKey, { discoveredAddr, sourceContract, sourceField }>
 */
async function discoverRedeployedContracts(client, networkId, data) {
  const cfg = NETWORKS[networkId]
  const addrs = cfg.addresses
  const discoveries = new Map()

  // Scan all fetched contracts for cross-ref mismatches
  for (const [key, contract] of Object.entries(data.contracts)) {
    if (!contract.props) continue
    for (const prop of contract.props) {
      if (prop.valid !== false) continue // only mismatches
      if (!prop.expected) continue // no expected address to compare against

      // Find which address key this property was expecting
      const defs = CONTRACT_PROPS[key]
      if (!defs) continue
      const def = defs.find((d) => d.label === prop.label)
      if (!def?.expect) continue

      // Resolve which address keys were expected
      const expectKeys = Array.isArray(def.expect) ? def.expect : [def.expect]

      // Check each expected key against DISCOVERY_MAP
      for (const expectKey of expectKeys) {
        const targetContractKey = DISCOVERY_MAP[expectKey]
        if (!targetContractKey) continue // not a discoverable contract

        // The on-chain value is the NEW address (different from expected)
        const discoveredAddr = typeof prop.value === 'string' ? prop.value : String(prop.value)
        if (!discoveredAddr || discoveredAddr === ZERO_ADDR) continue

        // Only discover if we don’t already have it and it’s truly different
        if (discoveries.has(targetContractKey)) continue
        const expectedAddr = addrs[expectKey]
        if (discoveredAddr.toLowerCase() === expectedAddr?.toLowerCase()) continue

        discoveries.set(targetContractKey, {
          discoveredAddr: getAddress(discoveredAddr),
          sourceContract: key,
          sourceField: prop.label,
        })
      }
    }
  }

  // Also scan game immutables for cross-ref mismatches
  for (const [, game] of Object.entries(data.games || {})) {
    if (!game?.immutables) continue
    for (const imm of game.immutables) {
      if (imm.valid !== false) continue
      if (!imm.expect) continue

      const expectKeys = Array.isArray(imm.expect) ? imm.expect : [imm.expect]
      for (const expectKey of expectKeys) {
        const targetContractKey = DISCOVERY_MAP[expectKey]
        if (!targetContractKey) continue

        const discoveredAddr = typeof imm.value === 'string' ? imm.value : String(imm.value)
        if (!discoveredAddr || discoveredAddr === ZERO_ADDR) continue
        if (discoveries.has(targetContractKey)) continue

        const expectedAddr = addrs[expectKey]
        if (discoveredAddr.toLowerCase() === expectedAddr?.toLowerCase()) continue

        discoveries.set(targetContractKey, {
          discoveredAddr: getAddress(discoveredAddr),
          sourceContract: game.label || 'Game',
          sourceField: imm.label,
        })
      }
    }
  }

  for (const [name, singleton] of Object.entries(data.singletons || {})) {
    if (name.endsWith('Old')) continue
    if (!singleton?.props) continue
    for (const prop of singleton.props) {
      if (prop.valid !== false) continue
      if (!prop.expected) continue

      const defs = CONTRACT_PROPS[name]
      if (!defs) continue
      const def = defs.find((d) => d.label === prop.label)
      if (!def?.expect) continue

      const expectKeys = Array.isArray(def.expect) ? def.expect : [def.expect]
      for (const expectKey of expectKeys) {
        const targetContractKey = DISCOVERY_MAP[expectKey]
        if (!targetContractKey) continue

        const discoveredAddr = typeof prop.value === 'string' ? prop.value : String(prop.value)
        if (!discoveredAddr || discoveredAddr === ZERO_ADDR) continue
        if (discoveries.has(targetContractKey)) continue

        const expectedAddr = addrs[expectKey]
        if (discoveredAddr.toLowerCase() === expectedAddr?.toLowerCase()) continue

        discoveries.set(targetContractKey, {
          discoveredAddr: getAddress(discoveredAddr),
          sourceContract: name,
          sourceField: prop.label,
        })
      }
    }
  }

  if (discoveries.size === 0) return

  const SINGLETON_KEYS = new Set(['MIPS', 'PreimageOracle'])

  const fetchPromises = []
  for (const [contractKey, info] of discoveries) {
    fetchPromises.push(
      (async () => {
        const addr = info.discoveredAddr
        const isSingleton = SINGLETON_KEYS.has(contractKey)

        if (isSingleton) {
          const [version, classify, props] = await Promise.all([
            readVersion(client, addr),
            classifyAddress(client, addr),
            fetchContractProps(client, addr, contractKey, addrs),
          ])
          const tag = implLookup(contractKey, addr, networkId, version)

          const oldKey = contractKey + 'Old'
          const oldSingleton = data.singletons[contractKey]
          if (oldSingleton) {
            data.singletons[oldKey] = { ...oldSingleton }
          }

          data.singletons[contractKey] = {
            address: addr,
            version,
            tag,
            classify,
            props,
            discovered: true,
            discoveredFrom: info.sourceContract,
            discoveredField: info.sourceField,
          }
        } else {
          const [impl, admin, version, owner] = await Promise.all([
            readStorage(client, addr, EIP1967.IMPL_SLOT),
            readStorage(client, addr, EIP1967.ADMIN_SLOT),
            readVersion(client, addr),
            readOwner(client, addr),
          ])

          const tag = implLookup(contractKey, impl, networkId, version)
          const props = await fetchContractProps(client, addr, contractKey, addrs)

          const newContract = {
            key: contractKey,
            proxy: addr,
            impl,
            admin,
            version,
            owner,
            tag,
            props,
            discovered: true,
            discoveredFrom: info.sourceContract,
            discoveredField: info.sourceField,
          }

          const oldKey = contractKey + 'Old'
          const oldContract = data.contracts[contractKey]
          if (oldContract) {
            data.contracts[oldKey] = { ...oldContract, key: oldKey }
          }

          data.contracts[contractKey] = newContract
        }
      })()
    )
  }

  await Promise.all(fetchPromises)

  const cascadeDiscoveries = new Map()
  for (const [name, singleton] of Object.entries(data.singletons)) {
    if (!singleton.discovered || name.endsWith('Old') || !singleton.props) continue
    for (const prop of singleton.props) {
      if (prop.valid !== false || !prop.expected) continue
      const defs = CONTRACT_PROPS[name]
      if (!defs) continue
      const def = defs.find((d) => d.label === prop.label)
      if (!def?.expect) continue
      const expectKeys = Array.isArray(def.expect) ? def.expect : [def.expect]
      for (const expectKey of expectKeys) {
        const targetKey = DISCOVERY_MAP[expectKey]
        if (!targetKey || discoveries.has(targetKey) || cascadeDiscoveries.has(targetKey)) continue
        const dAddr = typeof prop.value === 'string' ? prop.value : String(prop.value)
        if (!dAddr || dAddr === ZERO_ADDR) continue
        const expectedAddr = addrs[expectKey]
        if (dAddr.toLowerCase() === expectedAddr?.toLowerCase()) continue
        cascadeDiscoveries.set(targetKey, {
          discoveredAddr: getAddress(dAddr),
          sourceContract: name,
          sourceField: prop.label,
        })
      }
    }
  }

  if (cascadeDiscoveries.size > 0) {
    const cascadePromises = []
    for (const [contractKey, info] of cascadeDiscoveries) {
      cascadePromises.push(
        (async () => {
          const addr = info.discoveredAddr
          const isSingleton = SINGLETON_KEYS.has(contractKey)
          if (isSingleton) {
            const [version, classify, props] = await Promise.all([
              readVersion(client, addr),
              classifyAddress(client, addr),
              fetchContractProps(client, addr, contractKey, addrs),
            ])
            const oldKey = contractKey + 'Old'
            const oldSingleton = data.singletons[contractKey]
            if (oldSingleton) data.singletons[oldKey] = { ...oldSingleton }
            data.singletons[contractKey] = {
              address: addr,
              version,
              tag: implLookup(contractKey, addr, networkId, version),
              classify,
              props,
              discovered: true,
              discoveredFrom: info.sourceContract,
              discoveredField: info.sourceField,
            }
          }
        })()
      )
    }
    await Promise.all(cascadePromises)
  }
}

// ── Full Network Fetch ─────────────────────────────────────

/**
 * Fetch all data for a network.
 * onProgress(completed, total, sectionName) called as data arrives.
 * Returns the full network data object.
 */
export async function fetchNetworkData(networkId, onProgress) {
  const client = getClient(networkId)
  const cfg = NETWORKS[networkId]
  const addrs = cfg.addresses

  let completed = 0
  const total = 40 // approximate total steps
  const tick = (section) => {
    completed++
    onProgress?.(completed, total, section)
  }

  const data = {
    networkId,
    blockNumber: null,
    chainId: null,
    admin: {},
    contracts: {},
    games: {},
    singletons: {},
  }

  // ── Phase 1: Block number + Admin ──────────────────────
  try {
    data.blockNumber = Number(await client.getBlockNumber())
  } catch {
    data.blockNumber = null
  }
  try {
    data.chainId = Number(await client.getChainId())
  } catch {
    data.chainId = null
  }
  tick('admin')

  // ProxyAdmin owner + classify
  const [proxyAdminOwner, proxyAdminClassify] = await Promise.all([
    readOwner(client, addrs.PROXY_ADMIN),
    classifyAddress(client, addrs.PROXY_ADMIN),
  ])
  data.admin.proxyAdmin = {
    address: addrs.PROXY_ADMIN,
    owner: proxyAdminOwner,
    classify: proxyAdminClassify,
  }
  tick('admin')

  // ProxyAdminOwner (SystemOwnerSafe) classify
  if (proxyAdminOwner) {
    const ownerClassify = await classifyAddress(client, proxyAdminOwner)
    data.admin.proxyAdminOwner = {
      address: proxyAdminOwner,
      classify: ownerClassify,
    }
    // Classify each PAO sub-owner (detect nested Safes for threshold display)
    if (ownerClassify.type === 'Safe' && ownerClassify.details?.owners?.length > 0) {
      const subResults = await Promise.all(
        ownerClassify.details.owners.map((o) => classifyAddress(client, o))
      )
      const ownerDetails = {}
      ownerClassify.details.owners.forEach((o, i) => {
        ownerDetails[o.toLowerCase()] = subResults[i]
      })
      data.admin.proxyAdminOwner.ownerDetails = ownerDetails
    }
  }
  tick('admin')

  // ── Phase 2: Proxied contracts (parallel batches) ──────
  const proxiedPromises = PROXIED_CONTRACTS.map(async (c) => {
    const result = await fetchProxiedContract(client, networkId, c.key)
    tick(c.section)
    return result
  })

  const resolvedPromises = RESOLVED_CONTRACTS.map(async (c) => {
    const result = await fetchResolvedContract(client, networkId, c.key, c.resolveName)
    tick(c.section)
    return result
  })

  const allContracts = await Promise.all([...proxiedPromises, ...resolvedPromises])
  for (const c of allContracts) {
    if (c) data.contracts[c.key] = c
  }

  // (superchain pointers and guardian now fetched as props inside contracts)
  tick('superchain')
  tick('bridge')

  // ── Phase 5: Singletons (MIPS + PreimageOracle) ────────
  // Resolved before games so MIPS_SINGLETON is available for game immutable expect validation.
  const dgf = data.contracts.DisputeGameFactory
  const dgfTag = dgf?.tag
  const singletonAddrs = resolveSingletons(dgfTag, networkId)

  if (singletonAddrs) {
    addrs.MIPS_SINGLETON = singletonAddrs.MIPS
    addrs.PREIMAGE_ORACLE_SINGLETON = singletonAddrs.PreimageOracle

    const [mipsVer, preimageVer, mipsClassify, preimageClassify, mipsProps, preimageProps] =
      await Promise.all([
        readVersion(client, singletonAddrs.MIPS),
        readVersion(client, singletonAddrs.PreimageOracle),
        classifyAddress(client, singletonAddrs.MIPS),
        classifyAddress(client, singletonAddrs.PreimageOracle),
        fetchContractProps(client, singletonAddrs.MIPS, 'MIPS', addrs),
        fetchContractProps(client, singletonAddrs.PreimageOracle, 'PreimageOracle', addrs),
      ])

    data.singletons.MIPS = {
      address: singletonAddrs.MIPS,
      version: mipsVer,
      tag: implLookup('MIPS', singletonAddrs.MIPS, networkId, mipsVer),
      classify: mipsClassify,
      props: mipsProps,
    }
    data.singletons.PreimageOracle = {
      address: singletonAddrs.PreimageOracle,
      version: preimageVer,
      tag: implLookup('PreimageOracle', singletonAddrs.PreimageOracle, networkId, preimageVer),
      classify: preimageClassify,
      props: preimageProps,
    }
  }
  tick('singletons')
  tick('singletons')

  // ── Phase 6: Dispute games ─────────────────────────────
  const [game1Addr, game42Addr] = await Promise.all([
    readGameImpl(client, addrs.DISPUTE_GAME_FACTORY_PROXY, 1),
    readGameImpl(client, addrs.DISPUTE_GAME_FACTORY_PROXY, 42),
  ])
  tick('games')

  for (const [gameType, addr, label] of [
    [1, game1Addr, 'PermissionedGame'],
    [42, game42Addr, 'OPSuccinctGame'],
  ]) {
    if (addr) {
      const [ver, classify, immutables] = await Promise.all([
        readVersion(client, addr),
        classifyAddress(client, addr),
        fetchGameImmutables(client, addr, gameType, addrs),
      ])
      data.games[gameType] = {
        address: addr,
        version: ver,
        tag: gameVersionTag(gameType, ver),
        classify,
        label,
        immutables,
      }
      tick('games')
    }
  }

  // ── Phase 6b: Auto-discover re-deployed contracts ──────
  await discoverRedeployedContracts(client, networkId, data)
  tick('discovery')

  // ── Phase 7: Classify admins (batch) ───────────────────
  const adminsToClassify = []
  for (const c of Object.values(data.contracts)) {
    if (c.admin && c.admin !== ZERO_ADDR && !c._adminClassified) {
      adminsToClassify.push(c)
    }
  }

  // Batch classify unique admin addresses
  const uniqueAdmins = [...new Set(adminsToClassify.map((c) => c.admin))]
  const adminResults = await Promise.all(uniqueAdmins.map((a) => classifyAddress(client, a)))
  const adminMap = {}
  uniqueAdmins.forEach((a, i) => {
    adminMap[a.toLowerCase()] = adminResults[i]
  })

  for (const c of Object.values(data.contracts)) {
    if (c.admin && adminMap[c.admin.toLowerCase()]) {
      c.adminClassify = adminMap[c.admin.toLowerCase()]
    }
  }
  tick('classify')

  // ── Phase 8: Classify owners (batch) ───────────────────
  const uniqueOwners = [
    ...new Set(
      Object.values(data.contracts)
        .map((c) => c.owner)
        .filter((o) => o && o !== ZERO_ADDR)
    ),
  ]
  if (uniqueOwners.length > 0) {
    const ownerResults = await Promise.all(uniqueOwners.map((a) => classifyAddress(client, a)))
    const ownerMap = {}
    uniqueOwners.forEach((a, i) => {
      ownerMap[a.toLowerCase()] = ownerResults[i]
    })
    for (const c of Object.values(data.contracts)) {
      if (c.owner && ownerMap[c.owner.toLowerCase()]) {
        c.ownerClassify = ownerMap[c.owner.toLowerCase()]
      }
    }
  }
  tick('classify')

  return data
}

// ── Network Health Analysis ─────────────────────────────────

// Acknowledged exceptions — known patterns on specific networks that should not alert.
// SuperchainConfig on mainnet uses a separate admin because Optimism Foundation maintains it directly.
const ACKNOWLEDGED_ADMIN = { mainnet: ['SuperchainConfig'] }

// SystemConfig.owner() is set to cLabs Safe (not ProxyAdminOwner) — this is intentional.
const ACKNOWLEDGED_OWNER = {
  mainnet: ['SystemConfig'],
  sepolia: ['SystemConfig'],
  chaos: ['SystemConfig'],
}

/**
 * Analyze a single network for internal consistency anomalies.
 * Detects admin outliers, owner outliers, and EOA ProxyAdminOwner.
 */
function analyzeNetwork(data) {
  if (!data) return []
  const net = data.networkId
  const alerts = []
  const proxyAdminAddr = data.admin?.proxyAdmin?.address

  // 1. ProxyAdminOwner should be a Safe multisig, never an EOA
  const paOwnerType = data.admin?.proxyAdminOwner?.classify?.type
  if (paOwnerType === 'EOA') {
    alerts.push({
      severity: 'critical',
      category: 'ownership',
      network: net,
      contract: 'ProxyAdminOwner',
      field: 'address',
      message: `ProxyAdminOwner on ${net} is an EOA (expected Safe multisig)`,
    })
  }

  // 2. Admin consistency — every proxied contract should use the network's ProxyAdmin
  if (proxyAdminAddr) {
    const ack = ACKNOWLEDGED_ADMIN[net] || []
    for (const [key, contract] of Object.entries(data.contracts)) {
      if (!contract.admin || contract.admin === ZERO_ADDR) continue
      if (key.endsWith('Old')) continue // Old contracts are expected pre-upgrade artifacts
      if (contract.admin.toLowerCase() === proxyAdminAddr.toLowerCase()) continue
      if (ack.includes(key)) continue
      alerts.push({
        severity: 'critical',
        category: 'admin',
        network: net,
        contract: key,
        field: 'admin',
        message: `${key} on ${net} uses a different admin than ProxyAdmin`,
      })
    }
  }

  // 3. Owner consistency — detect outliers against the dominant owner
  const contractsWithOwner = Object.entries(data.contracts).filter(
    ([k, c]) => c.owner && !k.endsWith('Old')
  )
  if (contractsWithOwner.length >= 2) {
    const counts = {}
    for (const [, c] of contractsWithOwner) {
      const o = c.owner.toLowerCase()
      counts[o] = (counts[o] || 0) + 1
    }
    const dominantOwner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    const ackOwner = ACKNOWLEDGED_OWNER[net] || []
    for (const [key, contract] of contractsWithOwner) {
      if (contract.owner.toLowerCase() !== dominantOwner) {
        if (ackOwner.includes(key)) continue
        alerts.push({
          severity: 'critical',
          category: 'ownership',
          network: net,
          contract: key,
          field: 'owner',
          message: `${key} on ${net} has a different owner than other contracts`,
        })
      }
    }
  }

  // 4. Cross-reference validation failures
  const discoveredKeys = new Set(
    Object.entries(data.contracts)
      .filter(([, c]) => c.discovered)
      .map(([k]) => k)
  )
  const discoveredSingletonKeys = new Set(
    Object.entries(data.singletons || {})
      .filter(([, s]) => s.discovered)
      .map(([n]) => n)
  )
  for (const [key, contract] of Object.entries(data.contracts)) {
    if (key.endsWith('Old')) continue
    if (!contract.props) continue
    for (const prop of contract.props) {
      if (prop.valid !== false) continue
      const def = CONTRACT_PROPS[key]?.find((d) => d.label === prop.label)
      const expectKeys = def?.expect ? (Array.isArray(def.expect) ? def.expect : [def.expect]) : []
      const triggeredDiscovery = expectKeys.some((ek) => {
        const target = DISCOVERY_MAP[ek]
        return target && (discoveredKeys.has(target) || discoveredSingletonKeys.has(target))
      })
      if (triggeredDiscovery) continue
      alerts.push({
        severity: 'critical',
        category: 'cross-ref',
        network: net,
        contract: key,
        field: prop.label,
        message: `${key}.${prop.label} on ${net} points to unexpected address`,
      })
    }
  }
  for (const [, game] of Object.entries(data.games || {})) {
    if (!game?.immutables) continue
    for (const imm of game.immutables) {
      if (imm.valid !== false) continue
      const expectKeys = imm.expect ? (Array.isArray(imm.expect) ? imm.expect : [imm.expect]) : []
      const triggeredDiscovery = expectKeys.some((ek) => {
        const target = DISCOVERY_MAP[ek]
        return target && (discoveredKeys.has(target) || discoveredSingletonKeys.has(target))
      })
      if (triggeredDiscovery) continue
      alerts.push({
        severity: 'critical',
        category: 'cross-ref',
        network: net,
        contract: game.label || 'Game',
        field: imm.label,
        message: `${game.label || 'Game'}.${imm.label} on ${net} points to unexpected address`,
      })
    }
  }

  // 5. Re-deployment discoveries (proxied contracts)
  for (const [key, contract] of Object.entries(data.contracts)) {
    if (!contract.discovered) continue
    alerts.push({
      severity: 'warning',
      category: 'discovery',
      network: net,
      contract: key,
      field: 'proxy',
      message: `${key} on ${net} was re-deployed — new contract auto-discovered from ${contract.discoveredFrom}.${contract.discoveredField}`,
    })
  }

  // 6. Re-deployment discoveries (singletons)
  for (const [name, info] of Object.entries(data.singletons || {})) {
    if (!info.discovered) continue
    alerts.push({
      severity: 'warning',
      category: 'discovery',
      network: net,
      contract: name,
      field: 'address',
      message: `${name} on ${net} was re-deployed — new singleton auto-discovered from ${info.discoveredFrom}.${info.discoveredField}`,
    })
  }

  return alerts
}

// ── Cross-Network Comparison ───────────────────────────────

export function compareNetworks(mainnetData, testnetDataArray) {
  const alerts = []

  // Per-network anomaly detection (including mainnet)
  const allNetworks = [mainnetData, ...testnetDataArray].filter(Boolean)
  for (const data of allNetworks) {
    alerts.push(...analyzeNetwork(data))
  }

  // Cross-network: paused state discrepancy (mainnet = source of truth)
  if (mainnetData) {
    for (const td of testnetDataArray) {
      if (!td) continue
      for (const [key, mainContract] of Object.entries(mainnetData.contracts)) {
        const testContract = td.contracts[key]
        if (!testContract) continue
        const mainPaused = mainContract.props?.find((p) => p.label === 'paused()')?.value
        const testPaused = testContract.props?.find((p) => p.label === 'paused()')?.value
        if (mainPaused !== undefined && testPaused !== undefined && mainPaused !== testPaused) {
          alerts.push({
            severity: 'critical',
            category: 'paused',
            network: td.networkId,
            contract: key,
            field: 'paused',
            message: `${key} on ${td.networkId} is ${
              testPaused ? 'PAUSED' : 'active'
            } (mainnet is ${mainPaused ? 'PAUSED' : 'active'})`,
          })
        }
      }
    }
  }

  const netOrder = { mainnet: 0, sepolia: 1, chaos: 2, localhost: 3 }
  alerts.sort(
    (a, b) =>
      (netOrder[a.network] ?? 9) - (netOrder[b.network] ?? 9) ||
      a.contract.localeCompare(b.contract)
  )
  return alerts
}
