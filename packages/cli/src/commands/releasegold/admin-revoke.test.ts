import { serializeSignature } from '@celo/base/lib/signatureUtils'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { GovernanceWrapper } from '@celo/contractkit/lib/wrappers/Governance'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import {
  getContractFromEvent,
  NetworkConfig,
  testWithGanache,
  timeTravel,
} from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
// import ElectionVote from '../election/vote'
import Approve from '../governance/approve'
import GovernanceVote from '../governance/vote'
import AdminRevoke from './admin-revoke'
import Authorize from './authorize'
import CreateAccount from './create-account'
import LockedGold from './locked-gold'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:admin-revoke cmd', (web3: Web3) => {
  let kit: ContractKit
  let contractAddress: string
  let releaseGoldWrapper: ReleaseGoldWrapper
  let accounts: string[]

  beforeEach(async () => {
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      { index: 1 } // revocable: true
    )
    kit = newKitFromWeb3(web3)
    releaseGoldWrapper = new ReleaseGoldWrapper(kit, newReleaseGold(web3, contractAddress))
    const amt = await releaseGoldWrapper.getCurrentReleasedTotalAmount()
    console.log('released', amt)
    accounts = await web3.eth.getAccounts()
  })

  test('will revoke', async () => {
    await AdminRevoke.run(['--contract', contractAddress, '--yesreally'])
    const revokedContract = await getContractFromEvent(
      'ReleaseScheduleRevoked(uint256,uint256)',
      web3
    )
    expect(revokedContract).toBe(contractAddress)
  })

  describe('#when account exists with locked gold', () => {
    const value = '1'

    beforeEach(async () => {
      await CreateAccount.run(['--contract', contractAddress])
      await LockedGold.run([
        '--contract',
        contractAddress,
        '--action',
        'lock',
        '--value',
        value,
        '--yes',
      ])
    })

    test('will unlock all gold', async () => {
      await AdminRevoke.run(['--contract', contractAddress, '--yesreally'])
      const lockedGold = await kit.contracts.getLockedGold()
      const lockedAmount = await lockedGold.getAccountTotalLockedGold(releaseGoldWrapper.address)
      expect(lockedAmount.isZero()).toBeTruthy()
    })

    describe('#when account has authorized a vote signer', () => {
      let voteSigner: string
      let accountsWrapper: AccountsWrapper

      beforeEach(async () => {
        voteSigner = accounts[2]
        accountsWrapper = await kit.contracts.getAccounts()
        const pop = await accountsWrapper.generateProofOfKeyPossession(contractAddress, voteSigner)
        await Authorize.run([
          '--contract',
          contractAddress,
          '--role',
          'vote',
          '--signer',
          voteSigner,
          '--signature',
          serializeSignature(pop),
        ])
      })

      test('will rotate vote signer', async () => {
        await AdminRevoke.run(['--contract', contractAddress, '--yesreally'])
        const newVoteSigner = await accountsWrapper.getVoteSigner(contractAddress)
        expect(newVoteSigner).not.toEqual(voteSigner)
      })

      describe('#when account has voted', () => {
        const proposalID = '1'
        let governance: GovernanceWrapper

        beforeEach(async () => {
          // from vote.test.ts
          const expConfig = NetworkConfig.governance
          const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
          governance = await kit.contracts.getGovernance()
          await governance
            .propose([], 'URL')
            .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
          await timeTravel(expConfig.dequeueFrequency, web3)
          await Approve.run(['--from', accounts[0], '--proposalID', proposalID, '--useMultiSig'])
          await GovernanceVote.run([
            '--from',
            voteSigner,
            '--proposalID',
            proposalID,
            '--value',
            'Yes',
          ])

          // const election = await kit.contracts.getElection()
          // election.
          // await ElectionVote.run(['--from', voteSigner, '--value', value, '--for', ])
        })

        test('will revoke governance votes', async () => {
          await AdminRevoke.run(['--contract', contractAddress, '--yesreally'])
          const isVoting = await governance.isVoting(contractAddress)
          expect(isVoting).toBeFalsy()
        })
      })
    })
  })
})
