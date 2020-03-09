import { ContractKit, newKitFromWeb3, CeloContract } from '@celo/contractkit'
import Web3 from 'web3'

const CRAWLER_WEB3 = process.env['CRAWLER_WEB3'] || 'http://localhost:8545'

// read all from table
// when they were last modified?

async function main() {
  const web3 = new Web3(CRAWLER_WEB3)
  const kit: ContractKit = newKitFromWeb3(web3)
  const token = await kit.contracts.getStableToken()
  const oracle = await kit.contracts.getSortedOracles()
  console.log(await oracle.medianRate(CeloContract.StableToken), token.address, oracle.address)
}

main()
