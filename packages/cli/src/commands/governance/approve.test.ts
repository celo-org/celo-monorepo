import { Address } from '@celo/connect'
import { newKitFromWeb3 } from '@celo/contractkit'
import { GovernanceWrapper } from '@celo/contractkit/lib/wrappers/Governance'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Approve from './approve'

process.env.NO_SYNCCHECK = 'true'

const expConfig = NetworkConfig.governance

testWithGanache('governance:approve cmd', (web3: Web3) => {
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
  const kit = newKitFromWeb3(web3)
  const proposalID = '1'

  let accounts: Address[] = []
  let governance: GovernanceWrapper

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    await governance
      .propose([], 'URL')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    await timeTravel(expConfig.dequeueFrequency, web3)
  })
  test('approve fails if approver not passed in', async () => {
    await expect(Approve.run(['--from', accounts[0], '--proposalID', proposalID])).rejects.toThrow(
      "Some checks didn't pass!"
    )
  })
  test('can approve with multisig option', async () => {
    await Approve.run(['--from', accounts[0], '--proposalID', proposalID, '--useMultiSig'])
    expect(await governance.isApproved(proposalID)).toBeTruthy()
  })
})
