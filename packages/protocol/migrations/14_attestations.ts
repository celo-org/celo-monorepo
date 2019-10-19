import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  add0x,
  convertToContractDecimals,
  deploymentForCoreContract,
  generatePublicKeyFromPrivateKey,
  getDeployedProxiedContract,
  sendTransactionWithPrivateKey,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { AttestationsInstance, StableTokenInstance } from 'types'
import { TransactionObject } from 'web3/eth/types'
const initializeArgs = async (): Promise<[string, string, string[], string[]]> => {
  const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
    'StableToken',
    artifacts
  )

  const attestationFee = await convertToContractDecimals(
    config.attestations.attestationRequestFeeInDollars,
    stableToken
  )
  return [
    config.registry.predeployedProxyAddress,
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

module.exports = deploymentForCoreContract<AttestationsInstance>(
  web3,
  artifacts,
  CeloContractName.Attestations,
  initializeArgs,
  async (attestations: AttestationsInstance) => {
    const valKeys: string[] = config.validators.validatorKeys
    await Promise.all(valKeys.map((key) => setDataEncryptionKey(attestations, key)))
  }
)
