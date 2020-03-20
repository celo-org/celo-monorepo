import { newKitFromWeb3 } from '@celo/contractkit'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import CreateAccount from './create-account'
import LockedGold from './locked-gold'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:locked-gold cmd', (web3: Web3) => {
  let contractAddress: string
  let kit: any

  beforeEach(async () => {
    const contractCanValdiate = true
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      contractCanValdiate
    )
    kit = newKitFromWeb3(web3)
    await CreateAccount.run(['--contract', contractAddress])
  })

  test('can lock gold with pending withdrawals', async () => {
    const lockedGold = await kit.contracts.getLockedGold()
    await LockedGold.run(['--contract', contractAddress, '--action', 'lock', '--value', '100'])
    await LockedGold.run(['--contract', contractAddress, '--action', 'unlock', '--value', '50'])
    await LockedGold.run(['--contract', contractAddress, '--action', 'lock', '--value', '75'])
    await LockedGold.run(['--contract', contractAddress, '--action', 'unlock', '--value', '50'])
    const pendingWithdrawalsTotalValue = await lockedGold.getPendingWithdrawalsTotalValue(
      contractAddress
    )
    await expect(pendingWithdrawalsTotalValue.toFixed()).toBe('50')
  })
})
