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
  const chain = networkId === 'mainnet' ? mainnet : sepolia
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
      const expected = def.expect ? networkAddrs[def.expect] : null
      let valid = null
      if (expected && value) {
        const valStr = typeof value === 'string' ? value : String(value)
        valid = valStr.toLowerCase() === expected.toLowerCase()
      }

      return { label: def.label, value, type, expected, valid }
    })
  )

  return results.filter(Boolean)
}

// ── Immutable Variable Fetching ────────────────────────────

/**
 * Fetch immutable variables from an implementation or singleton address.
 * Returns array of { label, value, type }.
 */
async function fetchImmutables(client, targetAddr, defs) {
  if (!defs || defs.length === 0 || !targetAddr || targetAddr === ZERO_ADDR) return []

  const results = await Promise.all(
    defs.map(async (def) => {
      const value = await safeRead(client, targetAddr, def.fn)
      if (value === null || value === undefined) return null

      return {
        label: def.label,
        fn: def.fn,
        value,
        type: def.type || 'uint256',
        expect: def.expect || null,
      }
    })
  )

  return results.filter(Boolean)
}

/**
 * Fetch immutable variables from a game template address.
 */
async function fetchGameImmutables(client, gameAddr, gameType) {
  const defs = GAME_IMMUTABLE_VARS[gameType]
  if (!defs || !gameAddr) return []
  return fetchImmutables(client, gameAddr, defs)
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

  const tag = implLookup(contractKey, impl, networkId)

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

  const tag = implLookup(contractKey, impl, networkId)

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

  // ── Phase 5: Dispute games ─────────────────────────────
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
        fetchGameImmutables(client, addr, gameType),
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

  // ── Phase 6: Singletons (MIPS + PreimageOracle) ────────
  const dgf = data.contracts.DisputeGameFactory
  const dgfTag = dgf?.tag
  const singletonAddrs = resolveSingletons(dgfTag, networkId)

  if (singletonAddrs) {
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
      tag: implLookup('MIPS', singletonAddrs.MIPS, networkId),
      classify: mipsClassify,
      props: mipsProps,
    }
    data.singletons.PreimageOracle = {
      address: singletonAddrs.PreimageOracle,
      version: preimageVer,
      tag: implLookup('PreimageOracle', singletonAddrs.PreimageOracle, networkId),
      classify: preimageClassify,
      props: preimageProps,
    }
  }
  tick('singletons')
  tick('singletons')

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

// ── Cross-Network Comparison ───────────────────────────────

export function compareNetworks(mainnetData, testnetDataArray) {
  const alerts = []
  if (!mainnetData) return alerts

  const mainAdminOwnerType = mainnetData.admin?.proxyAdminOwner?.classify?.type

  for (const td of testnetDataArray) {
    if (!td) continue
    const net = td.networkId

    // 1. ProxyAdmin owner type
    const testAdminOwnerType = td.admin?.proxyAdminOwner?.classify?.type
    if (mainAdminOwnerType && testAdminOwnerType && mainAdminOwnerType !== testAdminOwnerType) {
      alerts.push({
        severity: 'critical',
        category: 'ownership',
        network: net,
        contract: 'ProxyAdmin Owner',
        message: `${net} uses ${testAdminOwnerType} (mainnet uses ${mainAdminOwnerType})`,
      })
    }

    // 2. Contract ownership patterns
    for (const [key, mainContract] of Object.entries(mainnetData.contracts)) {
      const testContract = td.contracts[key]
      if (!testContract) continue

      // Admin consistency: check if testnet uses same ProxyAdmin for all contracts
      if (mainContract.admin && testContract.admin) {
        const mainUsesPA =
          mainContract.admin.toLowerCase() === mainnetData.admin.proxyAdmin.address.toLowerCase()
        const testUsesPA =
          testContract.admin.toLowerCase() === td.admin.proxyAdmin.address.toLowerCase()
        if (mainUsesPA && !testUsesPA) {
          alerts.push({
            severity: 'warning',
            category: 'admin',
            network: net,
            contract: key,
            message: `${key} on ${net} uses different ProxyAdmin than expected`,
          })
        }
      }

      // 3. Cross-reference validation failures (from props)
      if (testContract.props) {
        for (const prop of testContract.props) {
          if (prop.valid === false) {
            alerts.push({
              severity: 'warning',
              category: 'cross-ref',
              network: net,
              contract: key,
              message: `${key}.${prop.label} on ${net} points to unexpected address`,
            })
          }
        }
      }

      // 4. Paused state discrepancy (from props)
      const mainPausedProp = mainContract.props?.find((p) => p.label === 'paused()')
      const testPausedProp = testContract.props?.find((p) => p.label === 'paused()')
      const mainPaused = mainPausedProp?.value
      const testPaused = testPausedProp?.value
      if (mainPaused !== undefined && testPaused !== undefined && mainPaused !== testPaused) {
        alerts.push({
          severity: testPaused ? 'critical' : 'warning',
          category: 'paused',
          network: net,
          contract: key,
          message: `${key} on ${net} is ${testPaused ? 'PAUSED' : 'active'} (mainnet is ${
            mainPaused ? 'PAUSED' : 'active'
          })`,
        })
      }
    }
  }

  return alerts
}
