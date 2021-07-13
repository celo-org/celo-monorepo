import { getSignatureForMetaTransaction, MetaTransaction } from '@celo/protocol/lib/meta-tx-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertEqualBN,
  assumeOwnership,
  getDerivedKey,
  getVerificationCodeSignature,
  KeyOffsets,
  unlockAndAuthorizeKey,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { ensureLeading0x, privateKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import {
  AccountsContract,
  AccountsInstance,
  AttestationsTestContract,
  AttestationsTestInstance,
  MetaTransactionWalletContract,
  MetaTransactionWalletDeployerContract,
  MetaTransactionWalletDeployerInstance,
  MetaTransactionWalletInstance,
  MockRandomContract,
  MockRandomInstance,
  MockValidatorsContract,
  ProxyCloneFactoryContract,
  ProxyCloneFactoryInstance,
  ProxyContract,
  ProxyInstance,
  RegistryInstance,
  StableTokenInstance,
} from 'types'

const executeMetaTransaction = async (
  signer: string,
  mtw: MetaTransactionWalletInstance,
  metaTx: MetaTransaction
) => {
  const { v, r, s } = await getSignatureForMetaTransaction(signer, mtw.address, metaTx)
  return mtw.executeMetaTransaction(metaTx.destination, metaTx.value, metaTx.data, v, r, s)
}

const getExecuteMetaTransactionData = async (
  signer: string,
  mtw: MetaTransactionWalletInstance,
  metaTx: MetaTransaction
) => {
  const { v, r, s } = await getSignatureForMetaTransaction(signer, mtw.address, metaTx)
  // @ts-ignore
  return mtw.contract.methods
    .executeMetaTransaction(metaTx.destination, metaTx.value, metaTx.data, v, r, s)
    .encodeABI()
}

const logCosts = false
const logCost = (output: string) => {
  if (logCosts) {
    // tslint:disable-next-line:no-console
    console.log(output)
  }
}

const Accounts: AccountsContract = artifacts.require('Accounts')
const Attestations: AttestationsTestContract = artifacts.require('AttestationsTest')
const MTW: MetaTransactionWalletContract = artifacts.require('MetaTransactionWallet')
const MTWDeployer: MetaTransactionWalletDeployerContract = artifacts.require(
  'MetaTransactionWalletDeployer'
)
const Proxy: ProxyContract = artifacts.require('InitializableProxy')
const ProxyCloneFactory: ProxyCloneFactoryContract = artifacts.require('ProxyCloneFactory')
const Random: MockRandomContract = artifacts.require('MockRandom')
const Validators: MockValidatorsContract = artifacts.require('MockValidators')
contract('Komenci Onboarding', (_accounts: string[]) => {
  let accounts: AccountsInstance
  let stableToken: StableTokenInstance
  let mtw: MetaTransactionWalletInstance
  let random: MockRandomInstance
  let registry: RegistryInstance
  let relayermtw: MetaTransactionWalletInstance
  let transactions: any[]
  const attestationExpiryBlocks = (60 * 60) / 5
  const selectIssuersWaitBlocks = 4
  const maxAttestations = 20
  const user: string = _accounts[1]
  // Random hex strings
  const dek = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
  const identifier = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e016111111'
  const numAttestations = 3
  // $0.05
  const perAttestationFee = '50000000000000000'
  // $0.15
  const attestationFee = '150000000000000000'
  before(async () => {
    stableToken = await getDeployedProxiedContract('StableToken', artifacts)
    // The komenci version is set as a test contract because we are not using it with a proxy.
    relayermtw = await MTW.new(true)
    await relayermtw.initialize(_accounts[0])

    // Set up the required mocks that will allow verification to work with ganache.
    registry = await getDeployedProxiedContract('Registry', artifacts)
    random = await Random.new()
    accounts = await Accounts.new(true)
    await accounts.initialize(registry.address)
    // Take ownership of the registry contract to point it to the mocks.
    await assumeOwnership(['Registry'], _accounts[0])
    await registry.setAddressFor(CeloContractName.Random, random.address)
    await registry.setAddressFor(CeloContractName.Accounts, accounts.address)
    const mockValidators = await Validators.new()
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)

    await Promise.all(
      _accounts.map(async (account) => {
        await accounts.createAccount({ from: account })
        await unlockAndAuthorizeKey(
          KeyOffsets.VALIDATING_KEY_OFFSET,
          accounts.authorizeValidatorSigner,
          account,
          _accounts
        )
        await unlockAndAuthorizeKey(
          KeyOffsets.ATTESTING_KEY_OFFSET,
          accounts.authorizeAttestationSigner,
          account,
          _accounts
        )
      })
    )
  })

  describe('With AttestationsV1', () => {
    let attestations: AttestationsTestInstance
    before(async () => {
      // Attestations uses some precompiles that are not implemented in ganache.
      // TODO: Put a proxy in front of it.
      attestations = await Attestations.new()
      await attestations.initialize(
        registry.address,
        attestationExpiryBlocks,
        selectIssuersWaitBlocks,
        maxAttestations,
        [stableToken.address],
        [perAttestationFee]
      )
      await attestations.__setValidators(
        _accounts.map((account) =>
          privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account, _accounts))
        )
      )
    })

    describe('Current flow', () => {
      let mtwDeployer: MetaTransactionWalletDeployerInstance
      before(async () => {
        mtwDeployer = await MTWDeployer.new()
        mtw = await MTW.new(false)
      })

      it('should onboard a new user', async () => {
        let totalCost = 0

        const deploymentTx = await mtwDeployer.deploy(
          user,
          mtw.address,
          // @ts-ignore
          mtw.contract.methods.initialize(ensureLeading0x(user)).encodeABI()
        )
        logCost(`Deploying and initializing a proxy takes ${deploymentTx.receipt.gasUsed} gas`)
        totalCost += deploymentTx.receipt.gasUsed
        mtw = await MTW.at(deploymentTx.logs[0].args.wallet)

        let { v, r, s } = await getParsedSignatureOfAddress(web3, mtw.address, user)
        const setAccount = {
          value: 0,
          destination: accounts.address,
          // @ts-ignore
          data: accounts.contract.methods.setAccount('', dek, user, v, r, s).encodeABI(),
          nonce: 0,
        }
        const setAccountTx = await executeMetaTransaction(user, mtw, setAccount)
        logCost(`Setting the account takes ${setAccountTx.receipt.gasUsed} gas`)
        totalCost += setAccountTx.receipt.gasUsed

        await stableToken.transfer(relayermtw.address, attestationFee)

        const approve = {
          value: 0,
          destination: stableToken.address,
          // @ts-ignore
          data: stableToken.contract.methods
            .approve(attestations.address, attestationFee)
            .encodeABI(),
          nonce: 1,
        }
        const approveMeta = {
          value: 0,
          destination: mtw.address,
          data: await getExecuteMetaTransactionData(user, mtw, approve),
        }

        const request = {
          value: 0,
          destination: attestations.address,
          // @ts-ignore
          data: attestations.contract.methods
            .request(identifier, numAttestations, stableToken.address)
            .encodeABI(),
          nonce: 2,
        }
        const requestMeta = {
          value: 0,
          destination: mtw.address,
          data: await getExecuteMetaTransactionData(user, mtw, request),
        }

        const transfer = {
          value: 0,
          destination: stableToken.address,
          // @ts-ignore
          data: stableToken.contract.methods.transfer(mtw.address, attestationFee).encodeABI(),
        }

        transactions = [transfer, approveMeta, requestMeta]
        const requestTx = await relayermtw.executeTransactions(
          transactions.map((t) => t.destination),
          transactions.map((t) => t.value),
          ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
          transactions.map((t) => trimLeading0x(t.data).length / 2)
        )
        logCost(`Requesting attestations takes ${requestTx.receipt.gasUsed} gas`)
        totalCost += requestTx.receipt.gasUsed

        // Add fake randomness so that issuers can be selected.
        const requestBlockNumber = await web3.eth.getBlockNumber()
        await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')

        const select = {
          value: 0,
          destination: attestations.address,
          // @ts-ignore
          data: attestations.contract.methods.selectIssuers(identifier).encodeABI(),
          nonce: 3,
        }
        const selectTx = await executeMetaTransaction(user, mtw, select)
        logCost(`Selecting issuers takes ${selectTx.receipt.gasUsed} gas`)
        totalCost += selectTx.receipt.gasUsed

        const issuers = await attestations.getAttestationIssuers(identifier, mtw.address)
        for (let i = 0; i < numAttestations; i++) {
          const issuer = issuers[i]
          ;({ v, r, s } = await getVerificationCodeSignature(
            mtw.address,
            issuer,
            identifier,
            _accounts
          ))
          const complete = {
            value: 0,
            destination: attestations.address,
            // @ts-ignore
            data: attestations.contract.methods.complete(identifier, v, r, s).encodeABI(),
            nonce: i + 4,
          }
          const completeTx = await executeMetaTransaction(user, mtw, complete)
          logCost(`Completing an attestation takes ${completeTx.receipt.gasUsed} gas`)
          totalCost += completeTx.receipt.gasUsed
        }
        const [completed, total] = await attestations.getAttestationStats(identifier, mtw.address)
        assertEqualBN(completed, numAttestations)
        assertEqualBN(total, numAttestations)
        logCost(`Onboarding a user takes ${totalCost} gas`)
      })
      // Deploying and initializing a proxy takes 695743 gas
      // Setting the account takes 189023 gas
      // Requesting attestations takes 219860 gas
      // Selecting issuers takes 249338 gas
      // Completing an attestation takes 144778 gas
      // Completing an attestation takes 104194 gas
      // Completing an attestation takes 104146 gas
      // Onboarding a user takes 1707082 gas
    })

    describe('With EIP-1167', () => {
      let proxyCloneFactory: ProxyCloneFactoryInstance
      before(async () => {
        const proxy: ProxyInstance = await Proxy.new()
        proxyCloneFactory = await ProxyCloneFactory.new()
        await proxyCloneFactory.setImplementationAddress(proxy.address)
        mtw = await MTW.new(false)
      })

      // The same as the current komenci flow, but using EIP-1167 proxies, and transferring the
      // proxy ownership to the proxy rather than the user (this does not affect gas costs in
      // this flow, but will save gas in future flows which use a pool of pre-deployed proxies)
      describe('Current flow', () => {
        it('should onboard a new user', async () => {
          let totalCost = 0

          const deploymentTx = await proxyCloneFactory.deploy(
            mtw.address,
            // @ts-ignore
            mtw.contract.methods.initialize(ensureLeading0x(user)).encodeABI()
          )
          logCost(`Deploying a proxy takes ${deploymentTx.receipt.gasUsed} gas`)
          totalCost += deploymentTx.receipt.gasUsed
          const proxy = await Proxy.at(deploymentTx.logs[1].args.proxyClone)
          mtw = await MTW.at(proxy.address)

          let { v, r, s } = await getParsedSignatureOfAddress(web3, mtw.address, user)
          const setAccount = {
            value: 0,
            destination: accounts.address,
            // @ts-ignore
            data: accounts.contract.methods.setAccount('', dek, user, v, r, s).encodeABI(),
            nonce: 0,
          }
          const setAccountTx = await executeMetaTransaction(user, mtw, setAccount)
          logCost(`Setting the account takes ${setAccountTx.receipt.gasUsed} gas`)
          totalCost += setAccountTx.receipt.gasUsed

          await stableToken.transfer(relayermtw.address, attestationFee)

          // Is is cheaper to submit these two as separate meta transaction than as a single
          // meta transaction batch by ~10k gas.
          const approve = {
            value: 0,
            destination: stableToken.address,
            // @ts-ignore
            data: stableToken.contract.methods
              .approve(attestations.address, attestationFee)
              .encodeABI(),
            nonce: 1,
          }
          const approveMeta = {
            value: 0,
            destination: mtw.address,
            data: await getExecuteMetaTransactionData(user, mtw, approve),
          }

          const request = {
            value: 0,
            destination: attestations.address,
            // @ts-ignore
            data: attestations.contract.methods
              .request(identifier, numAttestations, stableToken.address)
              .encodeABI(),
            nonce: 2,
          }
          const requestMeta = {
            value: 0,
            destination: mtw.address,
            data: await getExecuteMetaTransactionData(user, mtw, request),
          }

          const transfer = {
            value: 0,
            destination: stableToken.address,
            // @ts-ignore
            data: stableToken.contract.methods.transfer(mtw.address, attestationFee).encodeABI(),
          }

          transactions = [transfer, approveMeta, requestMeta]
          const requestTx = await relayermtw.executeTransactions(
            transactions.map((t) => t.destination),
            transactions.map((t) => t.value),
            ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
            transactions.map((t) => trimLeading0x(t.data).length / 2)
          )
          logCost(`Requesting attestations takes ${requestTx.receipt.gasUsed} gas`)
          totalCost += requestTx.receipt.gasUsed

          // Add fake randomness so that issuers can be selected.
          const requestBlockNumber = await web3.eth.getBlockNumber()
          await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')

          const select = {
            value: 0,
            destination: attestations.address,
            // @ts-ignore
            data: attestations.contract.methods.selectIssuers(identifier).encodeABI(),
            nonce: 3,
          }
          const selectTx = await executeMetaTransaction(user, mtw, select)
          logCost(`Selecting issuers takes ${selectTx.receipt.gasUsed} gas`)
          totalCost += selectTx.receipt.gasUsed

          const issuers = await attestations.getAttestationIssuers(identifier, mtw.address)
          for (let i = 0; i < numAttestations; i++) {
            const issuer = issuers[i]
            ;({ v, r, s } = await getVerificationCodeSignature(
              mtw.address,
              issuer,
              identifier,
              _accounts
            ))
            const complete = {
              value: 0,
              destination: attestations.address,
              // @ts-ignore
              data: attestations.contract.methods.complete(identifier, v, r, s).encodeABI(),
              nonce: i + 4,
            }
            const completeTx = await executeMetaTransaction(user, mtw, complete)
            logCost(`Completing an attestation takes ${completeTx.receipt.gasUsed} gas`)
            totalCost += completeTx.receipt.gasUsed
          }
          const [completed, total] = await attestations.getAttestationStats(identifier, mtw.address)
          assertEqualBN(completed, numAttestations)
          assertEqualBN(total, numAttestations)
          logCost(`Onboarding a user takes ${totalCost} gas`)
        })
        // Deploying a proxy takes 187488 gas
        // Setting the account takes 189943 gas
        // Requesting attestations takes 221676 gas
        // Selecting issuers takes 250184 gas
        // Completing an attestation takes 145670 gas
        // Completing an attestation takes 105110 gas
        // Completing an attestation takes 105066 gas
        // Onboarding a user takes 1205137 gas
        // Total gas cost: 70.6% of current.
        // Throughput increase: 41.7%.
      })
    })
  })
})
