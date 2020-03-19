import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import TransferGold from './transfergold'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('reserve:transfergold cmd', (web3: Web3) => {
  test('transferGold fails if spender not passed in', async () => {
    const accounts = await web3.eth.getAccounts()
    await expect(
      TransferGold.run([
        '--from',
        accounts[0],
        '--value',
        '1',
        '--to',
        '0x91c987bf62D25945dB517BDAa840A6c661374402',
      ])
    ).rejects.toThrow("Some checks didn't pass!")
  })
  test('can transferGold with multisig option', async () => {
    const accounts = await web3.eth.getAccounts()
    await TransferGold.run([
      '--from',
      accounts[0],
      '--value',
      '1',
      '--to',
      '0x91c987bf62D25945dB517BDAa840A6c661374402',
      '--useMultiSig',
    ])
  })
})
