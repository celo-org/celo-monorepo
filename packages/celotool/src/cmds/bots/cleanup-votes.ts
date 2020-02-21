import { newKit } from '@celo/contractkit'
import { ensureLeading0x } from '@celo/utils/lib/address'
import { AccountType, getPrivateKeysFor, privateKeyToAddress } from 'src/lib/generate_utils'
import { Argv } from 'yargs'

export const command = 'cleanup-votes'

interface CleanupVotesArgv {
  celoProvider: string
  numBots: number
  mnemonic: string
}

export const builder = (yargs: Argv) => {
  return yargs
    .option('celoProvider', {
      type: 'string',
      description: 'The node to use',
      default: 'http://localhost:8545',
    })
    .option('numBots', {
      type: 'number',
    })
    .option('mnemonic', {
      type: 'string',
    })
}

export const handler = async function cleanupVotes(argv: CleanupVotesArgv) {
  const kit = newKit(argv.celoProvider)
  const election = await kit.contracts.getElection()

  const botKeys = getPrivateKeysFor(AccountType.VOTING_BOT, argv.mnemonic, argv.numBots)

  for (const key of botKeys) {
    kit.addAccount(key)
    const botAccount = ensureLeading0x(privateKeyToAddress(key))

    const currentVotes = (await election.getVoter(botAccount)).votes
    for (const vote of currentVotes) {
      if (vote.active.isEqualTo(1)) {
        try {
          for (const tx of await election.revoke(botAccount, vote.group, vote.active)) {
            await tx.sendAndWaitForReceipt({ from: botAccount })
          }
          console.info(`revoked 1wei vote from bot ${botAccount} for group ${vote.group}`)
        } catch {
          console.error(
            `FAILED: could not revoke 1wei vote from bot ${botAccount} for group ${vote.group}`
          )
        }
      }
    }
  }
}
