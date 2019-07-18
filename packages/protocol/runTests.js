const ganache = require('@celo/ganache-cli')
const glob = require('glob-fs')({
  gitignore: false,
})
const { exec } = require('./lib/test-utils')
const network = require('./truffle.js').networks.development
const minimist = require('minimist')

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, 1000 * seconds))

async function startGanache() {
  const server = ganache.server({
    default_balance_ether: network.defaultBalance,
    network_id: network.network_id,
    mnemonic: network.mnemonic,
    gasPrice: network.gasPrice,
  })

  await new Promise((resolve, reject) => {
    server.listen(network.port, (err, blockchain) => {
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
    boolean: ['local', 'gas'],
  })

  try {
    const closeGanache = await startGanache()
    if (!argv.local) {
      await sleep(60)
    }

    let testArgs = ['run', 'truffle', 'test']
    if (argv.gas) {
      testArgs = testArgs.concat(['--color', '--gas'])
    }
    if (argv._.length > 0) {
      const testGlob = argv._.map((testName) => `test/\*\*/${testName}.ts`).join(' ')
      const testFiles = glob.readdirSync(testGlob)
      testArgs = testArgs.concat(testFiles)
    }
    await exec('yarn', testArgs)
    await closeGanache()
  } catch (e) {
    console.log(e.stdout)
    process.stdout.write('\n')
    process.nextTick(() => process.exit(1))
  }
}

test()
