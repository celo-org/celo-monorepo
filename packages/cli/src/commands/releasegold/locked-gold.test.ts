import { newKitFromWeb3 } from '@celo/contractkit'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import CreateAccount from './create-account'
import LockedGold from './locked-gold'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:locked-gold cmd', (web3: Web3) => {
  test('can lock gold with pending withdrawals', async () => {
    const contractCanValdiate = true
    const contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      contractCanValdiate
    )
    const kit = newKitFromWeb3(web3)
    const lockedGold = await kit.contracts.getLockedGold()
    await CreateAccount.run(['--contract', contractAddress])
    await LockedGold.run(['--contract', contractAddress, '--action', 'lock', '--value', '100'])
    await LockedGold.run(['--contract', contractAddress, '--action', 'unlock', '--value', '50'])
    await LockedGold.run(['--contract', contractAddress, '--action', 'lock', '--value', '75'])
    await LockedGold.run(['--contract', contractAddress, '--action', 'unlock', '--value', '50'])
    const pendingWithdrawalsTotalValue = await lockedGold.getPendingWithdrawalsTotalValue(
      contractAddress
    )
    expect(pendingWithdrawalsTotalValue.toFixed()).toBe('50')
  })
})
