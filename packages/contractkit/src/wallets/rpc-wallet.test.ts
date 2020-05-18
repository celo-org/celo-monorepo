import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { generateKeys, generateMnemonic } from '@celo/utils/src/account'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/src/address'
import { RpcWallet } from './rpc-wallet'

testWithGanache('rpc-wallet', (web3) => {
  const provider = web3.currentProvider

  it('should initialize with default accounts', async () => {
    const rpcWallet = new RpcWallet(provider)
    await rpcWallet.init()
    const accounts = rpcWallet.getAccounts()
    const web3Accounts = await web3.eth.getAccounts()
    expect(accounts).toEqual(web3Accounts.map(normalizeAddressWith0x))
  })

  describe('once initialized', () => {
    const passphrase = 'ce10'
    let rpcWallet: RpcWallet
    let mnemonic: string
    let keys: any
    // let paramsPopulator: TxParamsNormalizer

    beforeEach(async () => {
      mnemonic = await generateMnemonic()
      keys = await generateKeys(mnemonic)
      rpcWallet = new RpcWallet(provider)
      await rpcWallet.init()
      // paramsPopulator = new TxParamsNormalizer(rpcWallet.rpc)
    })

    it('should add account', async () => {
      await rpcWallet.addAccount(keys.privateKey, passphrase)
      const accounts = rpcWallet.getAccounts()
      expect(accounts).toContain(normalizeAddressWith0x(privateKeyToAddress(keys.privateKey)))
    })

    it('should indicate unlocked', async () => {
      const account = await rpcWallet.addAccount(keys.privateKey, passphrase)
      await rpcWallet.unlockAccount(account, passphrase, 10)
      const isUnlocked = rpcWallet.isAccountUnlocked(account)
      expect(isUnlocked).toBeTruthy()
    })

    it('should indicate locked when buffer not exceeded', async () => {
      const account = await rpcWallet.addAccount(keys.privateKey, passphrase)
      await rpcWallet.unlockAccount(account, passphrase, 5)
      const isUnlocked = rpcWallet.isAccountUnlocked(account)
      expect(isUnlocked).toBeFalsy()
    })

    // TODO: enable when ganache supports eth_signTransaction
    // see https://github.com/trufflesuite/ganache-core/issues/408
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
