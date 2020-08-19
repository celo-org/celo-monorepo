import { Address } from '@celo/utils/lib/address'
import Web3 from 'web3'
import { Tx } from 'web3-core'
import { RemoteWallet } from './remote-wallet'
import { Signer } from './signers/signer'
import { ACCOUNT_ADDRESS1, CHAIN_ID, TYPED_DATA } from './test-utils'

class RemoteWalletImpl extends RemoteWallet<Signer> {
  protected async loadAccountSigners(): Promise<Map<Address, Signer>> {
    return new Map<Address, Signer>()
  }
}

describe('RemoteWallet', () => {
  let wallet: RemoteWalletImpl

  // validate env file
  beforeEach(() => {
    wallet = new RemoteWalletImpl()
  })

  describe('without initializing', () => {
    const knownAddress = ACCOUNT_ADDRESS1
    let celoTransaction: Tx
    beforeEach(() => {
      celoTransaction = {
        from: knownAddress,
        to: knownAddress,
        chainId: CHAIN_ID,
        value: Web3.utils.toWei('1', 'ether'),
        nonce: 0,
        gas: '10',
        gasPrice: '99',
        feeCurrency: '0x124356',
        gatewayFeeRecipient: '0x1234',
        gatewayFee: '0x5678',
        data: '0xabcdef',
      }
    })

    test('fails calling getAccounts', () => {
      try {
        wallet.getAccounts()
        throw new Error('Expected exception to be thrown')
      } catch (e) {
        expect(e.message).toBe('wallet needs to be initialized first')
      }
    })

    test('fails calling hasAccount', () => {
      try {
        wallet.hasAccount(ACCOUNT_ADDRESS1)
        throw new Error('Expected exception to be thrown')
      } catch (e) {
        expect(e.message).toBe('wallet needs to be initialized first')
      }
    })

    test('fails calling signTransaction', async () => {
      await expect(wallet.signTransaction(celoTransaction)).rejects.toThrowError()
    })

    test('fails calling signPersonalMessage', async () => {
      await expect(wallet.signPersonalMessage(ACCOUNT_ADDRESS1, 'test')).rejects.toThrowError()
    })

    test('fails calling signTypedData', async () => {
      await expect(wallet.signTypedData(ACCOUNT_ADDRESS1, TYPED_DATA)).rejects.toThrowError()
    })
  })
})
