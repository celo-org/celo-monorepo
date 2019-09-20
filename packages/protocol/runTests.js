const ganache = require('@celo/ganache-cli')
const glob = require('glob-fs')({
  gitignore: false,
})
const { exec } = require('./lib/test-utils')
const minimist = require('minimist')
const network = require('./truffle.js').networks.development

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, 1000 * seconds))

// As documented https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables
const isCI = process.env.CI === 'true'

async function startGanache() {
  const server = ganache.server({
    default_balance_ether: network.defaultBalance,
    network_id: network.network_id,
    mnemonic: network.mnemonic,
    gasPrice: network.gasPrice,
    gasLimit: 8000000,
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
      // if we are running on circle ci we need to wait for ganache to be up
      // TODO(mcortesi): improvement: check for open port instead of a fixed wait time.
      await sleep(60)
    }

    let testArgs = ['run', 'truffle', 'test']
    if (argv['verbose-rpc']) {
      testArgs.push('--verbose-rpc')
    }
    if (argv.coverage) {
      testArgs = testArgs.concat(['--network', 'coverage'])
    }
    if (argv.gas) {
      testArgs = testArgs.concat(['--color', '--gas'])
    }
    if (argv._.length > 0) {
      const testGlob = argv._.map((testName) => `test/\*\*/${testName}.ts`).join(' ')
      const testFiles = glob.readdirSync(testGlob)
      if (testFiles.length === 0) {
        // tslint:disable-next-line: no-console
        console.error(`No tests matched with ${argv._}`)
        process.exit(1)
      }
      testArgs = testArgs.concat(testFiles)
    }
    await exec('yarn', testArgs)
    await closeGanache()
  } catch (e) {
    // tslint:disable-next-line: no-console
    console.error(e.stdout ? e.stdout : e)
    process.nextTick(() => process.exit(1))
  }
}

test()
