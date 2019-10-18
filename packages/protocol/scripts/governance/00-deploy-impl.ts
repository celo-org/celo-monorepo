import * as fs from 'fs'
import * as path from 'path'
const Web3 = require('web3')

// Change CWD to protocol root
process.chdir(path.join(__dirname, '../..'))

if (process.argv.length !== 3) {
  console.error('Missing Argument: Need to pass contractName')
  process.exit(1)
}

const contractName = process.argv[2]

// tslint:disable-next-line: no-console
console.log('Will deploy ', contractName)

const filename = `./build/contracts/${contractName}.json`
if (!fs.existsSync(filename)) {
  console.error(`${filename} does not exists`)
  process.exit(1)
}

async function main() {
  const outputJson = JSON.parse(fs.readFileSync(filename).toString())
  const bytecode = outputJson.bytecode

  // This is the address that the port forward opens
  const web3 = new Web3('http://localhost:8545')

  const accounts = await web3.eth.getAccounts()

  if (accounts.length === 0) {
    console.error(`No accounts, check your environment`)
    process.exit(1)
  }

  const res = await web3.eth.sendTransaction({
    from: accounts[0],
    // no to: means contract deployment
    // really high gas just in case
    gas: 8000000,
    data: bytecode,
  })

  console.log(res)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
