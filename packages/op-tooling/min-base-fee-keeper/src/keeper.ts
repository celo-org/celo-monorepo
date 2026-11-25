// Sets SystemConfig.minBaseFee so that a reference tx (USDT transfer paid in USDT) costs
// TARGET_USD_PER_TX. Throws KeeperError on anything that needs a human.
import {
  type Address,
  BaseError,
  type Chain,
  ContractFunctionRevertedError,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatUnits,
  getAddress,
  http,
  parseAbi,
  parseUnits,
  stringToHex,
} from 'viem'
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts'
import { celo, mainnet, sepolia } from 'viem/chains'

// roles: the Roles proxy, once deployed. The ROLES env var overrides it.
const NETWORKS = {
  mainnet: {
    chain: mainnet,
    systemConfig: '0x89E31965D844a309231B1f17759Ccaf1b7c09861',
    roles: undefined,
  },
  sepolia: {
    chain: sepolia,
    systemConfig: '0x760a5F022C9940f4A074e0030be682F560d29818',
    roles: '0xad1058cafa8FEE9E21558f9728fBF8F5da4Ed334',
  },
  chaos: {
    chain: sepolia,
    systemConfig: '0x6bAf5959Cc06a39793c338E6586f49473C731b4c',
    roles: '0x9A25668C97B68cD19541F7fA7073B56f834dC8fF',
  },
} as const satisfies Record<
  string,
  { chain: Chain; systemConfig: Address; roles: Address | undefined }
>

export const ROLE_KEY = stringToHex('MIN_BASE_FEE_KEEPER', { size: 32 })
// Always Celo Mainnet, also when updating Sepolia.
const CHAINLINK_CELO_USD = '0x0568fd19986748ceff3301e55c0eb1e729e0ab7e'

const chainlinkAbi = parseAbi([
  'function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)',
  'function decimals() view returns (uint8)',
])
const systemConfigAbi = parseAbi([
  'function minBaseFee() view returns (uint64)',
  'function setMinBaseFee(uint64)',
])
const rolesAbi = parseAbi([
  'function execTransactionWithRole(address to, uint256 value, bytes data, uint8 operation, bytes32 roleKey, bool shouldRevert) returns (bool)',
  'error ConditionViolation(uint8 status, bytes32 info)',
  'error NoMembership()',
  'error ModuleTransactionFailed()',
])
// Status in Roles v2.1.1 PermissionChecker.sol.
const ROLES_STATUS = [
  'Ok',
  'DelegateCallNotAllowed',
  'TargetAddressNotAllowed',
  'FunctionNotAllowed',
  'SendNotAllowed',
  'OrViolation',
  'NorViolation',
  'ParameterNotAllowed',
  'ParameterLessThanAllowed',
  'ParameterGreaterThanAllowed',
  'ParameterNotAMatch',
  'NotEveryArrayElementPasses',
  'NoArrayElementPasses',
  'ParameterNotSubsetOfAllowed',
  'BitmaskOverflow',
  'BitmaskNotAllowed',
  'CustomConditionViolation',
  'AllowanceExceeded',
  'CallAllowanceExceeded',
  'EtherAllowanceExceeded',
]

export class KeeperError extends Error {}

export interface Config {
  network: keyof typeof NETWORKS
  l1RpcUrl: string
  l2RpcUrl: string
  coinbaseUrl: string
  roles: Address
  // Parsed at load, so a bad key fails every run, not only the first one that sends.
  account?: PrivateKeyAccount
  dryRun: boolean
  // USD with 18 decimals, like wei, so the floor comes out in wei per gas.
  targetUsdPerTx: bigint
  referenceGas: bigint
  maxPriceAgeSeconds: bigint
  maxPriceDeviationBps: bigint
  minChangeBps: bigint
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const required = (name: string): string => {
    const value = env[name]
    if (!value) throw new KeeperError(`set ${name}`)
    return value
  }
  const int = (name: string, fallback: bigint): bigint => (env[name] ? BigInt(env[name]) : fallback)
  const usd = (name: string, fallback: string): bigint => {
    const value = env[name] ?? fallback
    if (!/^\d+(\.\d+)?$/.test(value) || parseUnits(value, 18) === 0n) {
      throw new KeeperError(`${name}=${value} is not a positive USD amount`)
    }
    return parseUnits(value, 18)
  }

  const network = env.NETWORK ?? 'mainnet'
  if (!Object.hasOwn(NETWORKS, network)) throw new KeeperError(`unknown NETWORK=${network}`)
  if (![undefined, 'true', 'false'].includes(env.DRY_RUN)) {
    throw new KeeperError(`DRY_RUN=${env.DRY_RUN} is not true or false`)
  }
  const dryRun = env.DRY_RUN === 'true'
  const privateKey = env.KEEPER_PRIVATE_KEY?.trim() as Hex | undefined
  if (!dryRun && !privateKey) throw new KeeperError('set KEEPER_PRIVATE_KEY')

  return {
    network: network as Config['network'],
    l1RpcUrl: required('L1_RPC_URL'),
    l2RpcUrl: env.L2_RPC_URL ?? 'https://forno.celo.org',
    coinbaseUrl: env.COINBASE_URL ?? 'https://api.coinbase.com/v2/prices/CELO-USD/spot',
    roles: getAddress(
      env.ROLES ?? NETWORKS[network as Config['network']].roles ?? required('ROLES')
    ),
    account: privateKey ? privateKeyToAccount(privateKey) : undefined,
    dryRun,
    targetUsdPerTx: usd('TARGET_USD_PER_TX', '0.002'),
    referenceGas: int('REFERENCE_GAS', 115_501n),
    maxPriceAgeSeconds: int('MAX_PRICE_AGE', 3600n), // Chainlink updates CELO/USD about every 4.5 min
    maxPriceDeviationBps: int('MAX_PRICE_DEVIATION_BPS', 300n), // 3%
    minChangeBps: int('MIN_CHANGE_BPS', 100n), // skip updates below 1%
  }
}

// floor [wei/gas] = target [USD/tx] / gas [gas/tx] / price [USD/CELO], with the target in 18 decimals
// and price = answer / 10^decimals.
export function computeFloor(
  targetUsdPerTx: bigint,
  referenceGas: bigint,
  answer: bigint,
  decimals: number
): bigint {
  return (targetUsdPerTx * 10n ** BigInt(decimals)) / (referenceGas * answer)
}

// |a - b| relative to b, in basis points, rounded down.
export function diffBps(a: bigint, b: bigint): bigint {
  return ((a > b ? a - b : b - a) * 10_000n) / b
}

export type Result = {
  status: 'skipped' | 'dry-run' | 'sent'
  chainlink: string
  priceAgeSeconds: string
  coinbase: string
  deviationBps: string
  current: string
  floor: string
  changeBps: string
  txHash?: Hex
}

export type Log = (message: string, fields?: Record<string, unknown>) => void

export async function runKeeper(cfg: Config, log: Log, now = () => Date.now()): Promise<Result> {
  const { chain, systemConfig } = NETWORKS[cfg.network]
  const l1 = createPublicClient({ chain, transport: http(cfg.l1RpcUrl) })
  const l2 = createPublicClient({ chain: celo, transport: http(cfg.l2RpcUrl) })

  // Primary price: Chainlink CELO/USD on Celo Mainnet.
  const [[, answer, , updatedAt], decimals] = await Promise.all([
    l2.readContract({
      address: CHAINLINK_CELO_USD,
      abi: chainlinkAbi,
      functionName: 'latestRoundData',
    }),
    l2.readContract({ address: CHAINLINK_CELO_USD, abi: chainlinkAbi, functionName: 'decimals' }),
  ])
  const age = BigInt(Math.floor(now() / 1000)) - updatedAt
  if (age > cfg.maxPriceAgeSeconds) throw new KeeperError(`Chainlink price is ${age}s old`)
  if (answer <= 0n) throw new KeeperError(`Chainlink price ${answer}`)
  const chainlink = formatUnits(answer, decimals)

  // Cross-check: Coinbase spot.
  const coinbase = await fetchCoinbase(cfg.coinbaseUrl)
  const coinbaseAnswer = parseUnits(coinbase, decimals)
  if (coinbaseAnswer === 0n) throw new KeeperError(`Coinbase price ${coinbase}`)
  const deviationBps = diffBps(answer, coinbaseAnswer)
  if (deviationBps > cfg.maxPriceDeviationBps) {
    throw new KeeperError(
      `prices disagree by ${deviationBps} bps: Chainlink ${chainlink}, Coinbase ${coinbase}`
    )
  }

  const floor = computeFloor(cfg.targetUsdPerTx, cfg.referenceGas, answer, decimals)

  const current = await l1.readContract({
    address: systemConfig,
    abi: systemConfigAbi,
    functionName: 'minBaseFee',
  })
  const changeBps = current === 0n ? 10_000n : diffBps(floor, current)
  const prices = {
    chainlink,
    priceAgeSeconds: age.toString(),
    coinbase,
    deviationBps: deviationBps.toString(),
    current: current.toString(),
    floor: floor.toString(),
    changeBps: changeBps.toString(),
  }
  log(
    `CELO/USD ${chainlink} (${age}s old; Coinbase ${coinbase}, ${deviationBps} bps apart), ` +
      `floor ${current} -> ${floor} wei (${changeBps} bps)`,
    prices
  )

  if (changeBps < cfg.minChangeBps) {
    log(`change below ${cfg.minChangeBps} bps, skipping`)
    return { status: 'skipped', ...prices }
  }
  if (cfg.dryRun) {
    log('dry run, not sending')
    return { status: 'dry-run', ...prices }
  }

  const wallet = createWalletClient({ account: cfg.account!, chain, transport: http(cfg.l1RpcUrl) })
  const data = encodeFunctionData({
    abi: systemConfigAbi,
    functionName: 'setMinBaseFee',
    args: [floor],
  })
  // The Roles module enforces the bounds. If it rejects the call, gas estimation fails and
  // nothing is sent.
  const txHash = await wallet
    .writeContract({
      address: cfg.roles,
      abi: rolesAbi,
      functionName: 'execTransactionWithRole',
      args: [systemConfig, 0n, data, 0, ROLE_KEY, true],
    })
    .catch((e: unknown) => {
      throw revertError(e, floor) ?? e
    })
  log(`sent ${txHash}`, { txHash })
  const receipt = await l1.waitForTransactionReceipt({ hash: txHash })
  if (receipt.status !== 'success') throw new KeeperError(`tx ${txHash} reverted`)
  log(`floor set to ${floor} wei in block ${receipt.blockNumber}`)
  return { status: 'sent', ...prices, txHash }
}

function revertError(e: unknown, floor: bigint): KeeperError | undefined {
  const revert =
    e instanceof BaseError ? e.walk((c) => c instanceof ContractFunctionRevertedError) : null
  if (!(revert instanceof ContractFunctionRevertedError) || !revert.data) return undefined
  const { errorName, args } = revert.data
  const reason =
    errorName === 'ConditionViolation'
      ? ROLES_STATUS[Number(args?.[0])] ?? `status ${args?.[0]}`
      : revert.reason ?? errorName
  return new KeeperError(`setting floor ${floor} wei reverted: ${reason}`)
}

async function fetchCoinbase(url: string): Promise<string> {
  let amount: unknown
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    amount = ((await res.json()) as { data?: { amount?: unknown } }).data?.amount
  } catch (e) {
    throw new KeeperError(`Coinbase fetch failed: ${(e as Error).message}`)
  }
  if (typeof amount !== 'string' || !/^\d+(\.\d+)?$/.test(amount)) {
    throw new KeeperError(`Coinbase returned ${JSON.stringify(amount)}`)
  }
  return amount
}
