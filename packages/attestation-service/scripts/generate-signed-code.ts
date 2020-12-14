import { newKit } from '@celo/contractkit'
import { SignatureUtils } from '@celo/utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { attestationSecurityCode as buildSecurityCodeTypedData } from '@celo/utils/lib/typed-data-constructors'

async function main() {
  const [privateKey, code] = process.argv.slice(2)

  const kit = newKit('http://localhost:8545')
  kit.addAccount(privateKey)

  const typedData = buildSecurityCodeTypedData(code)
  console.log(
    SignatureUtils.serializeSignature(
      await kit.signTypedData(privateKeyToAddress(privateKey), typedData)
    )
  )
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
