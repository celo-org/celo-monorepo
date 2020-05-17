import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { generateKeys, generateMnemonic } from '@celo/utils/src/account'
import { privateKeyToAddress } from '@celo/utils/src/address'
import { RpcWallet } from './rpc-wallet'

testWithGanache('rpc-wallet', (web3) => {
  const provider = web3.currentProvider

  it('should initialize with zero accounts', () => {
    const rpcWallet = new RpcWallet(provider)
    const accounts = rpcWallet.getAccounts()
    expect(accounts).toEqual([])
  })

  describe('once initialized', () => {
    const passphrase = 'ce10'
    let rpcWallet: RpcWallet
    let mnemonic: string
    let keys: any
    // let paramsPopulator: TxParamsNormalizer

    beforeAll(async () => {
      mnemonic = await generateMnemonic()
      keys = await generateKeys(mnemonic)
    })

    beforeEach(async () => {
      rpcWallet = new RpcWallet(provider)
      // paramsPopulator = new TxParamsNormalizer(rpcWallet.rpc)
    })

    it('SBAT add an account', async () => {
      await rpcWallet.addAccount(keys.privateKey, passphrase)
      const accounts = rpcWallet.getAccounts()
      expect(accounts).toEqual([privateKeyToAddress(keys.privateKey)])
    })

    it('SBAT to unlock added account', async () => {
      const account = await rpcWallet.addAccount(keys.privateKey, passphrase)
      await rpcWallet.unlockAccount(account, passphrase, 5)
      const isUnlocked = rpcWallet.isAccountUnlocked(account)
      expect(isUnlocked).toBeTruthy()
    })

    // TODO: enable when ganache supports eth_signTransaction
    // it('SBAT to sign tx from unlocked account', async () => {
    //   const account = await rpcWallet.addAccount(keys.privateKey, passphrase)
    //   const tx = await paramsPopulator.populate({ from: account })
    //   await rpcWallet.unlockAccount(account, passphrase, 100)
    //   await rpcWallet.signTransaction(tx)
    // })

    // it('SNBAT to sign tx from locked account', async () => {
    //   const account = await rpcWallet.addAccount(keys.privateKey, passphrase)
    //   await rpcWallet.unlockAccount(account, passphrase, 5)
    //   const isUnlocked = rpcWallet.isAccountUnlocked(account)
    //   expect(isUnlocked).toBeTruthy()
    // })
  })
})
