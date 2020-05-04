const ganache = require('@celo/ganache-cli')
const glob = require('glob-fs')({
  gitignore: false,
})
const { exec, waitForPortOpen } = require('./lib/test-utils')
const minimist = require('minimist')
const networkName = 'development'
const network = require('./truffle-config.js').networks[networkName]

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, 1000 * seconds))

// As documented https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables
const isCI = process.env.CI === 'true'

async function startGanache() {
  const server = ganache.server({
    default_balance_ether: network.defaultBalance,
    network_id: network.network_id,
    mnemonic: network.mnemonic,
    gasPrice: network.gasPrice,
    gasLimit: 20000000,
    allowUnlimitedContractSize: true,
  })

  await new Promise((resolve, reject) => {
    server.listen(8545, (err, blockchain) => {
      if (err) {
        reject(err)
      } else {
        resolve(blockchain)
      }
    })
  })

  return () =>
    new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
}

async function test() {
  const argv = minimist(process.argv.slice(2), {
    boolean: ['gas', 'coverage', 'verbose-rpc'],
  })

  try {
    const closeGanache = await startGanache()
    if (isCI) {
      // If we are running on circle ci we need to wait for ganache to be up.
      await waitForPortOpen('localhost', 8545, 60)
    }

    // --reset is a hack to trick truffle into using 20M gas.
    let testArgs = ['run', 'truffle', 'test', '--reset']
    if (argv['verbose-rpc']) {
      testArgs.push('--verbose-rpc')
    }
    if (argv.coverage) {
      testArgs = testArgs.concat(['--network', 'coverage'])
    } else {
      testArgs = testArgs.concat(['--network', networkName])
    }
    if (argv.gas) {
      testArgs = testArgs.concat(['--color', '--gas'])
    }

    const testGlob =
      argv._.length > 0
        ? argv._.map((testName) => `test/\*\*/${testName}.ts`).join(' ')
        : `test/\*\*/*.ts`
    const testFiles = glob.readdirSync(testGlob)
    if (testFiles.length === 0) {
      // tslint:disable-next-line: no-console
      console.error(`No test files matched with ${testGlob}`)
      process.exit(1)
    }
    testArgs = testArgs.concat(testFiles)

    await exec('yarn', testArgs)
    await closeGanache()
  } catch (e) {
    // tslint:disable-next-line: no-console
    console.error(e.stdout ? e.stdout : e)
    process.nextTick(() => process.exit(1))
  }
}

test()
