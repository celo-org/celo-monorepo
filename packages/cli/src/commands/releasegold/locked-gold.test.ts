import { newKitFromWeb3 } from '@celo/contractkit'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import CreateAccount from './create-account'
import LockedGold from './locked-gold'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:locked-gold cmd', (web3: Web3) => {
  let contractAddress: string
  let kit: any

  beforeEach(async () => {
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3
    )
    kit = newKitFromWeb3(web3)
    await testLocally(CreateAccount, ['--contract', contractAddress])
  })

  test('can lock celo with pending withdrawals', async () => {
    const lockedGold = await kit.contracts.getLockedGold()
    await testLocally(LockedGold, [
      '--contract',
      contractAddress,
      '--action',
      'lock',
      '--value',
      '100',
    ])
    await testLocally(LockedGold, [
      '--contract',
      contractAddress,
      '--action',
      'unlock',
      '--value',
      '50',
    ])
    await testLocally(LockedGold, [
      '--contract',
      contractAddress,
      '--action',
      'lock',
      '--value',
      '75',
    ])
    await testLocally(LockedGold, [
      '--contract',
      contractAddress,
      '--action',
      'unlock',
      '--value',
      '50',
    ])
    const pendingWithdrawalsTotalValue = await lockedGold.getPendingWithdrawalsTotalValue(
      contractAddress
    )
    await expect(pendingWithdrawalsTotalValue.toFixed()).toBe('50')
  })
})
