import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KeeperError, ROLE_KEY, computeFloor, diffBps, loadConfig } from './keeper.js'

test('floor at $0.0723 per CELO is about 239.5 Gwei', () => {
  // Chainlink CELO/USD has 8 decimals.
  assert.equal(computeFloor(2_000_000_000_000_000n, 115_501n, 7_230_000n, 8), 239_500_240_595n)
})

test('floor doubles when CELO halves', () => {
  const full = computeFloor(2_000_000_000_000_000n, 115_501n, 8_000_000n, 8)
  const half = computeFloor(2_000_000_000_000_000n, 115_501n, 4_000_000n, 8)
  assert.ok(half - full * 2n <= 1n, `${half} vs 2 × ${full}`) // integer division rounds down
})

test('diffBps is relative to the second value and rounds down', () => {
  assert.equal(diffBps(110n, 100n), 1000n)
  assert.equal(diffBps(90n, 100n), 1000n)
  assert.equal(diffBps(100_999n, 100_000n), 99n)
})

test('role key matches cast format-bytes32-string', () => {
  assert.equal(ROLE_KEY, '0x4d494e5f424153455f4645455f4b454550455200000000000000000000000000')
})

test('loadConfig requires a key unless dry run', () => {
  const env = { L1_RPC_URL: 'http://l1', ROLES: '0x0000000000000000000000000000000000000001' }
  assert.throws(() => loadConfig(env), KeeperError)
  assert.equal(loadConfig({ ...env, DRY_RUN: 'true' }).dryRun, true)
  assert.throws(() => loadConfig({ ...env, DRY_RUN: 'true', KEEPER_PRIVATE_KEY: 'ab'.repeat(32) }))
  assert.throws(() => loadConfig({ ...env, DRY_RUN: 'true', NETWORK: 'alfajores' }), KeeperError)
  assert.throws(() => loadConfig({ ...env, DRY_RUN: 'true', NETWORK: 'constructor' }), KeeperError)
  assert.throws(() => loadConfig({ ...env, DRY_RUN: '1', KEEPER_PRIVATE_KEY: '0x01' }), KeeperError)
})

test('TARGET_USD_PER_TX is in USD, 18 decimals internally', () => {
  const env = {
    L1_RPC_URL: 'http://l1',
    ROLES: '0x0000000000000000000000000000000000000001',
    DRY_RUN: 'true',
  }
  assert.equal(loadConfig(env).targetUsdPerTx, 2_000_000_000_000_000n)
  assert.equal(
    loadConfig({ ...env, TARGET_USD_PER_TX: '0.0015' }).targetUsdPerTx,
    1_500_000_000_000_000n
  )
  for (const bad of ['0', '-0.002', '$0.002', '2e-3', '']) {
    assert.throws(() => loadConfig({ ...env, TARGET_USD_PER_TX: bad }), KeeperError, bad)
  }
})
