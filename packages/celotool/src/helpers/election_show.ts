import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
// import { displaySendTx } from '@celo/celocli/lib/utils/cli'
// import { importAndUnlockAccount } from "./utils";

const web3 = new Web3('http://localhost:8543')
// const keystorePath: string = process.env.KEYSTORE || "";

;(async () => {
  const kit = newKitFromWeb3(web3)
  // const account = await importAndUnlockAccount(web3, keystorePath)
  // const from = account.address
  const electionContract = await kit.contracts.getElection()
  console.log(
    Object.values(await electionContract.electableValidators()).map((num) => num.toString())
  )
  console.log(await electionContract.getEligibleValidatorGroupsVotes())
  console.log((await electionContract.electabilityThreshold()).toString())
})()
