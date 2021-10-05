import { generateKeys, generateMnemonic } from '@celo/utils/lib/account'
import { flags } from '@oclif/command'
import prompts from 'prompts'
import { displaySendTx, printValueMap } from '../../utils/cli'
import { ReleaseGoldBaseCommand } from '../../utils/release-gold-base'

export default class AdminRevoke extends ReleaseGoldBaseCommand {
  static hidden = true

  static description = 'Take all possible steps to revoke given contract instance.'

  static flags = {
    ...ReleaseGoldBaseCommand.flags,
    yesreally: flags.boolean({ description: 'Override interactive prompt to confirm revocation' }),
  }

  static args = []

  static examples = ['admin-revoke --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    const { flags: _flags } = this.parse(AdminRevoke)

    if (!_flags.yesreally) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirmation',
        message: 'Are you sure you want to revoke this contract? (y/n)',
      })

      if (!response.confirmation) {
        console.info('Aborting due to user response')
        process.exit(0)
      }
    }

    this.kit.defaultAccount = await this.releaseGoldWrapper.getReleaseOwner()

    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    if (!isRevoked) {
      await displaySendTx(
        'releasegold: revokeBeneficiary',
        this.releaseGoldWrapper.revokeBeneficiary(),
        undefined,
        'ReleaseScheduleRevoked'
      )
    }

    const accounts = await this.kit.contracts.getAccounts()
    const isAccount = await accounts.isAccount(this.contractAddress)
    if (isAccount) {
      const election = await this.kit.contracts.getElection()
      const electionVotes = await election.getTotalVotesByAccount(this.contractAddress)
      const isElectionVoting = electionVotes.isGreaterThan(0)

      const governance = await this.kit.contracts.getGovernance()
      const isGovernanceVoting = await governance.isVoting(this.contractAddress)

      if (isElectionVoting || isGovernanceVoting) {
        // rotate vote signers
        const voteSigner = await accounts.getVoteSigner(this.contractAddress)
        if (voteSigner !== this.contractAddress) {
          const keys = await generateKeys(await generateMnemonic())
          const pop = await accounts.generateProofOfKeyPossessionLocally(
            this.contractAddress,
            keys.address,
            keys.privateKey
          )
          await displaySendTx(
            'accounts: rotateVoteSigner',
            await this.releaseGoldWrapper.authorizeVoteSigner(keys.address, pop),
            undefined,
            'VoteSignerAuthorized'
          )
        }

        // handle governance votes
        if (isGovernanceVoting) {
          const isUpvoting = await governance.isUpvoting(this.contractAddress)
          if (isUpvoting) {
            await displaySendTx(
              'governance: revokeUpvote',
              await governance.revokeUpvote(this.contractAddress),
              undefined,
              'ProposalUpvoteRevoked'
            )
          }

          const isVotingReferendum = await governance.isVotingReferendum(this.contractAddress)
          if (isVotingReferendum) {
            await displaySendTx(
              'governance: revokeVotes',
              governance.revokeVotes(),
              undefined,
              'ProposalVoteRevoked'
            )
          }
        }

        // handle election votes
        if (isElectionVoting) {
          const txos = await this.releaseGoldWrapper.revokeAllVotesForAllGroups()
          for (const txo of txos) {
            await displaySendTx('election: revokeVotes', txo, undefined, [
              'ValidatorGroupPendingVoteRevoked',
              'ValidatorGroupActiveVoteRevoked',
            ])
          }
        }
      }

      await displaySendTx(
        'releasegold: unlockAllGold',
        await this.releaseGoldWrapper.unlockAllGold(),
        undefined,
        'GoldUnlocked'
      )
    }

    const stabletoken = await this.kit.contracts.getStableToken()
    const cusdBalance = await stabletoken.balanceOf(this.contractAddress)
    if (cusdBalance.isGreaterThan(0)) {
      await displaySendTx(
        'releasegold: rescueCUSD',
        this.releaseGoldWrapper.transfer(this.kit.defaultAccount, cusdBalance),
        undefined,
        'Transfer'
      )
    }

    const remainingLockedGold = await this.releaseGoldWrapper.getRemainingLockedBalance()
    if (remainingLockedGold.isZero()) {
      await displaySendTx(
        'releasegold: refundAndFinalize',
        this.releaseGoldWrapper.refundAndFinalize(),
        undefined,
        'ReleaseGoldInstanceDestroyed'
      )
    } else {
      console.log('Some gold is still locked, printing pending withdrawals...')
      const lockedGold = await this.kit.contracts.getLockedGold()
      const pendingWithdrawals = await lockedGold.getPendingWithdrawals(this.contractAddress)
      pendingWithdrawals.forEach((w) => printValueMap(w))
    }
  }
}
