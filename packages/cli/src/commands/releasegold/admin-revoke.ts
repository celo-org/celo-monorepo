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
      // rotate vote signers
      let voteSigner = await accounts.getVoteSigner(this.contractAddress)
      if (voteSigner !== this.contractAddress) {
        const password = 'bad_password'
        voteSigner = await this.web3.eth.personal.newAccount(password)
        await this.web3.eth.personal.unlockAccount(voteSigner, password, 1000)
        const pop = await accounts.generateProofOfKeyPossession(this.contractAddress, voteSigner)
        await displaySendTx(
          'accounts: rotateVoteSigner',
          await this.releaseGoldWrapper.authorizeVoteSigner(voteSigner, pop),
          undefined,
          'VoteSignerAuthorized'
        )
      }

      const election = await this.kit.contracts.getElection()
      const electionVotes = await election.getTotalVotesByAccount(this.contractAddress)
      const isElectionVoting = electionVotes.isGreaterThan(0)

      // handle election votes
      if (isElectionVoting) {
        const txos = await this.releaseGoldWrapper.revokeAllVotesForAllGroups()
        for (const txo of txos) {
          await displaySendTx('election: revokeVotes', txo, { from: voteSigner }, [
            'ValidatorGroupPendingVoteRevoked',
            'ValidatorGroupActiveVoteRevoked',
          ])
        }
      }

      const governance = await this.kit.contracts.getGovernance()
      const isGovernanceVoting = await governance.isVoting(this.contractAddress)

      // handle governance votes
      if (isGovernanceVoting) {
        const isUpvoting = await governance.isUpvoting(this.contractAddress)
        if (isUpvoting) {
          await displaySendTx(
            'governance: revokeUpvote',
            await governance.revokeUpvote(this.contractAddress),
            { from: voteSigner },
            'ProposalUpvoteRevoked'
          )
        }

        const isVotingReferendum = await governance.isVotingReferendum(this.contractAddress)
        if (isVotingReferendum) {
          await displaySendTx(
            'governance: revokeVotes',
            governance.revokeVotes(),
            { from: voteSigner },
            'ProposalVoteRevoked'
          )
        }
      }

      await displaySendTx(
        'releasegold: unlockAllGold',
        await this.releaseGoldWrapper.unlockAllGold(),
        undefined,
        'GoldUnlocked'
      )
    }

    // rescue any cUSD balance
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

    // attempt to refund and finalize, surface pending withdrawals
    const remainingLockedGold = await this.releaseGoldWrapper.getRemainingLockedBalance()
    if (remainingLockedGold.isZero()) {
      await displaySendTx(
        'releasegold: refundAndFinalize',
        this.releaseGoldWrapper.refundAndFinalize(),
        undefined,
        'ReleaseGoldInstanceDestroyed'
      )
    } else {
      console.log('Some celo is still locked, printing pending withdrawals...')
      const lockedGold = await this.kit.contracts.getLockedGold()
      const pendingWithdrawals = await lockedGold.getPendingWithdrawals(this.contractAddress)
      pendingWithdrawals.forEach((w) => printValueMap(w))
    }
  }
}
