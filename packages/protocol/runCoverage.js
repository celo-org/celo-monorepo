const ganache = require('@celo/ganache-cli')
const { exec } = require('./lib/test-utils')
const network = require('./truffle.js').networks.development
const datadir = require('./.solcover.js').datadir

function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, 1000 * seconds))
}

async function runCoverage() {
  const argv = require('minimist')(process.argv.slice(2), {
    boolean: ['local', 'gas'],
  })

  try {
    await exec('mkdir', [datadir])
    // We need to bring up a ganache network with Celo changes in order to predeploy the registry
    // proxy contract, as the version of ganache used by coverage tool.
    const server = ganache.server({
      default_balance_ether: network.defaultBalance,
      network_id: network.network_id,
      mnemonic: network.mnemonic,
      gasPrice: network.gasPrice,
      db_path: datadir,
    })
    // Bring Celo Ganache up and down so that we can save the genesis block to pass to testrpc-sc.
    await new Promise((resolve, reject) => {
      server.listen(network.port, (err, blockchain) => {
        if (err) {
          reject(err)
        } else {
          resolve(blockchain)
        }
      })
    })
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
    await exec('yarn', ['run', 'solidity-coverage'])
  } catch (e) {
    console.log(e.stdout)
    process.stdout.write('\n')
    await exec('rm', ['-rf', datadir])
    process.nextTick(() => process.exit(1))
  }
}

runCoverage()
