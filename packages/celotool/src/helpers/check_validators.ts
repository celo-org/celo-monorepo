import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
const web3 = new Web3('http://localhost:8545')
const from: string = process.env.CELO_ACCOUNT_ADDRESS || '0x0'
;(async () => {
  const kit = newKitFromWeb3(web3)
  const validatorContract = await kit.contracts.getValidators()
  const validatorList = await validatorContract.getRegisteredValidators()
  console.log(validatorList)
  const me = await validatorContract.getValidator(from)
  console.log(me.publicKey.length)
  const electionContract = await kit.contracts.getElection()
  console.log(await electionContract.getEligibleValidatorGroupsVotes())
})()
