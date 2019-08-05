const ganache = require('@celo/ganache-cli')
const glob = require('glob-fs')({
  gitignore: false,
})
const { exec } = require('./lib/test-utils')
const minimist = require('minimist')

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, 1000 * seconds))

async function startGanache() {
  const server = ganache.server({
    default_balance_ether: 1000000,
    gasPrice: 0,
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
    network_id: '1101',
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
    boolean: ['local', 'gas', 'coverage', 'verbose-rpc'],
  })

  try {
    const closeGanache = await startGanache()
    // if we are running on cirlce ci (!local) we need to wait
    if (!argv.local) {
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
    // process.stdout.write('\n')
    process.nextTick(() => process.exit(1))
  }
}

test()
