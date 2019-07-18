import { attestationsRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  add0x,
  convertToContractDecimals,
  deployProxyAndImplementation,
  generatePublicKeyFromPrivateKey,
  getDeployedProxiedContract,
  sendTransactionWithPrivateKey,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import * as minimist from 'minimist'
import { AttestationsInstance, RegistryInstance, StableTokenInstance } from 'types'
import { TransactionObject } from 'web3/eth/types'
const initializeArgs = async (): Promise<[string, string, string[], string[]]> => {
  const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
    'StableToken',
    artifacts
  )

  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )

  const attestationFee = await convertToContractDecimals(
    config.attestations.attestationRequestFeeInDollars,
    stableToken
  )
  return [
    registry.address,
    config.attestations.attestationExpirySeconds.toString(),
    [stableToken.address],
    [attestationFee.toString()],
  ]
}

async function setDataEncryptionKey(attestations: AttestationsInstance, privateKey: string) {
  const publicKey = add0x(generatePublicKeyFromPrivateKey(privateKey.slice(2)))

  // @ts-ignore
  const txData: TransactionObject<void> = attestations.contract.methods.setAccountDataEncryptionKey(
    publicKey
  )

  return sendTransactionWithPrivateKey(web3, txData, privateKey, {
    // @ts-ignore
    to: attestations.contract.options.address,
  })
}

module.exports = deployProxyAndImplementation<AttestationsInstance>(
  web3,
  artifacts,
  'Attestations',
  initializeArgs,
  async (attestations: AttestationsInstance) => {
    const argv = minimist(process.argv, {
      string: ['keys'],
      default: { keys: '' },
    })
    const valKeys: string[] = argv.keys ? argv.keys.split(',') : []

    await Promise.all(valKeys.map((key) => setDataEncryptionKey(attestations, key)))

    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )

    await setInRegistry(attestations, registry, attestationsRegistryId)
  }
)
