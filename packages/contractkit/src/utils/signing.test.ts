import { ACCOUNT_ADDRESSES, ACCOUNT_PRIVATE_KEYS } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { LocalSigner, NativeSigner, parseSignature } from '@celo/utils/lib/signatureUtils'

// This only really tests signatureUtils in @celo/utils, but is tested here
// to avoid the web3/ganache setup in @celo/utils
testWithGanache('Signing', (web3) => {
  const account = ACCOUNT_ADDRESSES[0]
  const pKey = ACCOUNT_PRIVATE_KEYS[0]

  const nativeSigner = NativeSigner(web3.eth.sign, account)
  const localSigner = LocalSigner(pKey)

  it('signs a message the same way via RPC and with an explicit private key', async () => {
    const message = 'message'
    const nativeSignature = await nativeSigner.sign(message)
    const localSignature = await localSigner.sign(message)

    expect(parseSignature(message, nativeSignature, account)).toEqual(
      parseSignature(message, localSignature, account)
    )
  })

  it('signs a message that was hashed the same way via RPC and with an explicit private key', async () => {
    // This test checks that the prefixing in `signMessage` appropriately considers hex strings
    // as bytes the same way the native RPC signing would
    const message = web3.utils.soliditySha3('message')
    const nativeSignature = await nativeSigner.sign(message)
    const localSignature = await localSigner.sign(message)

    expect(parseSignature(message, nativeSignature, account)).toEqual(
      parseSignature(message, localSignature, account)
    )
  })
})
