// This is a more unusual Celotool command. It basically helps you to execute Hotfixes on testnets. Because constructing proposals is difficult to do via a CLI, you should define them here in code. There are two examples below that you can start from.

import { newKitFromWeb3 } from '@celo/contractkit'
import { hotfixToHash, ProposalBuilder, proposalToJSON } from '@celo/governance'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { randomBytes } from 'crypto'
import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import Web3 from 'web3'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'hotfix'

export const describe = 'runs a hotfix'

type EthstatsArgv = UpgradeArgv

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: EthstatsArgv) => {
  exitIfCelotoolHelmDryRun()
  try {
    const kit = newKitFromWeb3(new Web3(getFornoUrl(argv.celoEnv)))
    const governance = await kit.contracts.getGovernance()
    const keys = getPrivateKeysFor(
      AccountType.VALIDATOR,
      fetchEnv(envVar.MNEMONIC),
      parseInt(fetchEnv(envVar.VALIDATORS), 10)
    )
    const addresses = keys.map(privateKeyToAddress)

    console.info('Add keys to ContractKit')
    for (const key of keys) {
      kit.connection.addAccount(key)
    }

    // Here you'll want to assert the current state
    // Example A: Update a var on a Celo Core Contract
    // const attestations = await kit.contracts.getAttestations()
    // const currentNumber = await attestations.attestationExpiryBlocks()
    // if (currentNumber !== 727) {
    //   throw new Error(`Expected current number to be 727, but was ${currentNumber}`)
    // }

    // Example B: Repoint a Celo Core Contract proxy
    // const validatorsProxyAddress = await kit.registry.addressFor(CeloContract.Validators)
    // const currentValidatorsImplementationAddress = await getImplementationOfProxy(
    //   kit.web3,
    //   validatorsProxyAddress
    // )
    // const desiredImplementationAddress = '0xd18620a5eBE0235023602bB4d490E1e96703EddD'
    // console.info('Current Implementation Address: ', currentValidatorsImplementationAddress)

    // console.info('\nBuild Proposal')

    const proposalBuilder = new ProposalBuilder(kit)

    // Example A
    // proposalBuilder.addJsonTx({
    //   contract: CeloContract.Attestations,
    //   function: 'setAttestationExpiryBlocks',
    //   // @ts-ignore
    //   args: [728],
    //   value: '0',
    // })

    // Example B
    // proposalBuilder.addProxyRepointingTx(validatorsProxyAddress, desiredImplementationAddress)

    const proposal = await proposalBuilder.build()
    if (proposal.length === 0) {
      console.error('\nPlease see examples in hotfix.ts and add transactions')
      process.exit(1)
    }
    // If your proposal is just made of Celo Registry contract methods, you can print it out
    console.info('Proposal: ', await proposalToJSON(kit, proposal))

    const salt = randomBytes(32)
    console.info(`Salt: ${salt.toString('hex')}`)

    const proposalHash = hotfixToHash(kit, proposal, salt)
    console.info(`Proposal Hash: ${proposalHash.toString('hex')}`)

    console.info('\nWhitelist the hotfix')
    await concurrentMap(25, addresses, async (address, index) => {
      try {
        await governance.whitelistHotfix(proposalHash).sendAndWaitForReceipt({ from: address })
      } catch (error) {
        console.error(
          `Error whitelisting for validator ${index} (${address}): ${
            error instanceof Error ? JSON.stringify(error) : error?.toString()
          }`
        )
      }
    })

    let hotfixRecord = await governance.getHotfixRecord(proposalHash)
    console.info('Hotfix Record: ', hotfixRecord)

    console.info('\nApprove the hotfix')
    await governance.approveHotfix(proposalHash).sendAndWaitForReceipt({ from: addresses[0] })
    hotfixRecord = await governance.getHotfixRecord(proposalHash)
    console.info('Hotfix Record: ', hotfixRecord)

    // This is on master, but not on baklava yet
    const canPass = await governance.isHotfixPassing(proposalHash)
    const tally = await governance.hotfixWhitelistValidatorTally(proposalHash)

    if (!canPass) {
      throw new Error(`Hotfix cannot pass. Currently tally is ${tally}`)
    }

    console.info('\nPrepare the hotfix')
    await governance.prepareHotfix(proposalHash).sendAndWaitForReceipt({ from: addresses[0] })
    hotfixRecord = await governance.getHotfixRecord(proposalHash)
    console.info('\nHotfix Record: ', hotfixRecord)

    if (hotfixRecord.preparedEpoch.toNumber() === 0) {
      console.error('Hotfix could not be prepared')
      throw new Error()
    }
    console.info('\nExecute the hotfix')
    await governance.executeHotfix(proposal, salt).sendAndWaitForReceipt({ from: addresses[0] })

    hotfixRecord = await governance.getHotfixRecord(proposalHash)
    console.info('\nHotfix Record: ', hotfixRecord)

    if (!hotfixRecord.executed) {
      console.error('Hotfix could somehow not be executed')
      throw new Error()
    }

    // Assert any state to be sure it worked

    // Example A
    // const newNumber = await attestations.attestationExpiryBlocks()
    // if (newNumber !== 728) {
    //   throw new Error(`Expected current number to be 728, but was ${newNumber}`)
    // }

    // Example B
    // const newValidatorsImplementationAddress = await getImplementationOfProxy(
    //   kit.web3,
    //   validatorsProxyAddress
    // )
    // if (!eqAddress(newValidatorsImplementationAddress, desiredImplementationAddress)) {
    //   throw new Error(
    //     `Expected new implementation address to be ${desiredImplementationAddress}, but was ${newValidatorsImplementationAddress}`
    //   )
    // }

    console.info('Hotfix successfully executed!')
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
