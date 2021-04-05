import { MetaTransaction, getSignatureForMetaTransaction } from '@celo/protocol/lib/meta-tx-utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  AttestationsTestContract,
  AttestationsTestInstance,
  AttestationsV2TestContract,
  AttestationsV2TestInstance,
  AccountsInstance,
  StableTokenInstance,
  MockRandomInstance,
  MockRandomContract,
  MockValidatorsContract,
  MetaTransactionWalletContract,
  MetaTransactionWalletInstance,
  MetaTransactionWalletDeployerContract,
  MetaTransactionWalletDeployerInstance,
  ProxyContract,
  ProxyInstance,
  ProxyCloneFactoryContract,
  ProxyCloneFactoryInstance,
  RegistryInstance,
} from 'types'
import { AttestationUtils } from '@celo/utils'

enum KeyOffsets {
  VALIDATING_KEY_OFFSET,
  ATTESTING_KEY_OFFSET,
  NEW_VALIDATING_KEY_OFFSET,
  VOTING_KEY_OFFSET,
}

// Private keys of each of the 10 miners, in the same order as their addresses in 'accounts'.
const accountPrivateKeys: string[] = [
  '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
  '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
  '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
  '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
  '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
  '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
  '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
  '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
  '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
  '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
]

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

const Attestations: AttestationsTestContract = artifacts.require('AttestationsTest')
const MTW: MetaTransactionWalletContract = artifacts.require('MetaTransactionWallet')
const MTWDeployer: MetaTransactionWalletDeployerContract = artifacts.require(
  'MetaTransactionWalletDeployer'
)
const Validators: MockValidatorsContract = artifacts.require('MockValidators')
const Random: MockRandomContract = artifacts.require('MockRandom')

contract('Komenci Onboarding', (_accounts: string[]) => {
  async function getVerificationCodeSignature(
    account: string,
    issuer: string,
    identifier: string
  ): Promise<[number, string, string]> {
    const privateKey = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, issuer)
    const { v, r, s } = AttestationUtils.attestToIdentifier(identifier, account, privateKey)
    return [v, r, s]
  }

  const getDerivedKey = (offset: number, address: string) => {
    const pKey = accountPrivateKeys[_accounts.indexOf(address)]
    const aKey = Buffer.from(pKey.slice(2), 'hex')
    aKey.write((aKey[0] + offset).toString(16))
    return '0x' + aKey.toString('hex')
  }

  const unlockAndAuthorizeKey = async (offset: number, authorizeFn: any, account: string) => {
    const key = getDerivedKey(offset, account)
    const addr = privateKeyToAddress(key)
    // @ts-ignore
    await web3.eth.personal.importRawKey(key, 'passphrase')
    await web3.eth.personal.unlockAccount(addr, 'passphrase', 1000000)

    const signature = await getParsedSignatureOfAddress(web3, account, addr)
    return authorizeFn(addr, signature.v, signature.r, signature.s, {
      from: account,
    })
  }

  let accounts: AccountsInstance
  let attestations: AttestationsTestInstance
  let stableToken: StableTokenInstance
  let mtw: MetaTransactionWalletInstance
  let mtwDeployer: MetaTransactionWalletDeployerInstance
  let random: MockRandomInstance
  let komencimtw: MetaTransactionWalletInstance
  /*
   * Setup:
   * 1. Deploy MetaTransactionWalletDeployer
   *
   * Onboarding:
   * 1. Deploy and initialize a proxy: https://github.com/celo-org/komenci/blob/96695393b5299f606a7a3e88bccd33fceb20b4fa/apps/onboarding/src/wallet/wallet.service.ts#L98
   * 2. SetAccount meta-tx
   * 3. Batch
   *   a.) cUSD transfer
   *   b.) cUSD approval meta-tx
   *   c.) requestAttestations meta-tx
   * 4. Select issuers meta-tx
   * 5. Complete attestations meta-txs
   */

  before(async () => {
    accounts = await getDeployedProxiedContract('Accounts', artifacts)
    stableToken = await getDeployedProxiedContract('StableToken', artifacts)
    mtw = await MTW.new(false)
    // The komenci version is set as a test contract because we are not using it with a proxy.
    komencimtw = await MTW.new(true)
    await komencimtw.initialize(_accounts[0])
    random = await Random.new()
    const registry: RegistryInstance = await getDeployedProxiedContract('Registry', artifacts)
    // Note this only works for now because we deleted the governance migration
    await registry.setAddressFor(CeloContractName.Random, random.address)

    // Attestations uses some precompiles that are not implemented in ganache.
    // TODO: Put a proxy in front of it.
    const attestationExpiryBlocks = (60 * 60) / 5
    const selectIssuersWaitBlocks = 4
    const maxAttestations = 20
    const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())
    attestations = await Attestations.new()
    await attestations.initialize(
      registry.address,
      attestationExpiryBlocks,
      selectIssuersWaitBlocks,
      maxAttestations,
      [stableToken.address],
      [attestationFee]
    )
    await attestations.__setValidators(
      _accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account))
      )
    )

    const mockValidators = await Validators.new()
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await Promise.all(
      _accounts.map(async (account) => {
        await accounts.createAccount({ from: account })
        await unlockAndAuthorizeKey(
          KeyOffsets.VALIDATING_KEY_OFFSET,
          accounts.authorizeValidatorSigner,
          account
        )
        await unlockAndAuthorizeKey(
          KeyOffsets.ATTESTING_KEY_OFFSET,
          accounts.authorizeAttestationSigner,
          account
        )
      })
    )
  })

  const user: string = _accounts[1]
  const dek = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
  const identifier = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e016111111'
  const numAttestations = 3
  // const attestationFee = web3.utils.toWei(numAttestations * 0.05, 'ether').toString()
  const attestationFee = '150000000000000000'

  describe('Current flow', () => {
    before(async () => {
      mtwDeployer = await MTWDeployer.new()
    })

    it('should onboard a new user', async () => {
      let totalCost = 0

      const deploymentTx = await mtwDeployer.deploy(
        user,
        mtw.address,
        // @ts-ignore
        mtw.contract.methods.initialize(ensureLeading0x(user)).encodeABI()
      )
      console.log(`Deploying and initializing a proxy takes ${deploymentTx.receipt.gasUsed} gas`)
      totalCost += deploymentTx.receipt.gasUsed
      // Switch over to using the proxied MTW.
      const proxyAddress = deploymentTx.logs[0].args.wallet
      mtw = await MTW.at(proxyAddress)

      let { v, r, s } = await getParsedSignatureOfAddress(web3, mtw.address, user)
      // @ts-ignore
      const setAccount = {
        value: 0,
        destination: accounts.address,
        data: accounts.contract.methods.setAccount('', dek, user, v, r, s).encodeABI(),
        nonce: 0,
      }
      const setAccountTx = await executeMetaTransaction(user, mtw, setAccount)
      console.log(`Setting the account takes ${setAccountTx.receipt.gasUsed} gas`)
      totalCost += setAccountTx.receipt.gasUsed

      await stableToken.transfer(komencimtw.address, attestationFee)

      // @ts-ignore
      const approve = {
        value: 0,
        destination: stableToken.address,
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

      // @ts-ignore
      const request = {
        value: 0,
        destination: attestations.address,
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

      // @ts-ignore
      const transfer = {
        value: 0,
        destination: stableToken.address,
        data: stableToken.contract.methods.transfer(mtw.address, attestationFee).encodeABI(),
      }

      const transactions = [transfer, approveMeta, requestMeta]
      const requestTx = await komencimtw.executeTransactions(
        transactions.map((t) => t.destination),
        transactions.map((t) => t.value),
        ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
        transactions.map((t) => trimLeading0x(t.data).length / 2)
      )
      console.log(`Requesting attestations takes ${requestTx.receipt.gasUsed} gas`)
      totalCost += requestTx.receipt.gasUsed

      // Add fake randomness so that issuers can be selected.
      const selectIssuersWaitBlocks = 4
      const requestBlockNumber = await web3.eth.getBlockNumber()
      await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')

      // @ts-ignore
      const select = {
        value: 0,
        destination: attestations.address,
        data: attestations.contract.methods.selectIssuers(identifier).encodeABI(),
        nonce: 3,
      }
      const selectTx = await executeMetaTransaction(user, mtw, select)
      console.log(`Selecting issuers takes ${selectTx.receipt.gasUsed} gas`)
      totalCost += selectTx.receipt.gasUsed

      const issuers = await attestations.getAttestationIssuers(identifier, mtw.address)
      for (let i = 0; i < numAttestations; i++) {
        const issuer = issuers[i]
        ;[v, r, s] = await getVerificationCodeSignature(mtw.address, issuer, identifier)
        // @ts-ignore
        const complete = {
          value: 0,
          destination: attestations.address,
          data: attestations.contract.methods.complete(identifier, v, r, s).encodeABI(),
          nonce: i + 4,
        }
        const completeTx = await executeMetaTransaction(user, mtw, complete)
        console.log(`Completing an attestation takes ${completeTx.receipt.gasUsed} gas`)
        totalCost += completeTx.receipt.gasUsed
      }
      console.log(`Onboarding a user takes ${totalCost} gas`)
      /*
       *  Deploying and initializing a proxy takes 695743 gas
          Setting the account takes 189023 gas
          Requesting attestations takes 219860 gas
          Selecting issuers takes 249338 gas
          Completing an attestation takes 144778 gas
          Completing an attestation takes 104194 gas
          Completing an attestation takes 104146 gas
          Onboarding a user takes 1707082 gas
       */
    })
  })

  describe('Plus EIP-1167', () => {
    const Proxy: ProxyContract = artifacts.require('ProxyV2')
    const ProxyCloneFactory: ProxyCloneFactoryContract = artifacts.require('ProxyCloneFactory')
    let proxyCloneFactory: ProxyCloneFactoryInstance
    before(async () => {
      const proxy: ProxyInstance = await Proxy.new()
      proxyCloneFactory = await ProxyCloneFactory.new()
      await proxyCloneFactory.setProxyAddress(proxy.address)
    })

    it('should onboard a new user', async () => {
      let totalCost = 0

      await stableToken.transfer(komencimtw.address, attestationFee)

      // Possibly batch completions
      const deploymentTx = await proxyCloneFactory.deployAndFund(
        // TODO: Should proxy ownership be transferred to itself instead of the signer?
        komencimtw.address,
        mtw.address,
        // @ts-ignore
        mtw.contract.methods.initialize(ensureLeading0x(komencimtw.address)).encodeABI()
      )
      console.log(`Deploying a proxy takes ${deploymentTx.receipt.gasUsed} gas`)
      totalCost += deploymentTx.receipt.gasUsed
      // console.log(deploymentTx.logs)
      const proxy = await Proxy.at(deploymentTx.logs[1].args.proxy)
      mtw = await MTW.at(proxy.address)

      // @ts-ignore
      const ownership = {
        value: 0,
        destination: proxy.address,
        data: proxy.contract.methods._transferOwnership(user).encodeABI(),
      }
      // Set signer is only owner and so it needs to be called via the mtw
      // @ts-ignore
      const signerData = mtw.contract.methods.setSigner(user).encodeABI()
      // @ts-ignore
      const signer = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods.executeTransaction(mtw.address, 0, signerData).encodeABI(),
      }
      let transactions = [ownership, signer]
      const ownershipTx = await komencimtw.executeTransactions(
        transactions.map((t) => t.destination),
        transactions.map((t) => t.value),
        ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
        transactions.map((t) => trimLeading0x(t.data).length / 2)
      )
      console.log(`Transferring ownership to the user takes ${ownershipTx.receipt.gasUsed} gas`)

      // Batch these three transactions into
      // mtw.executeMetaTransaction(mtw.executeTransactions([setAccount, approve, request]))
      // and then batch that into komencimtw.executeTransactions([transfer, batchmetatx])
      //
      // The alternative would be for setAccount, approve, and request each to be their own
      // meta transactions, and then to roll things up into a single batch.
      // It's not clear which is more efficient but I suspect the former as it reduces the number
      // of signature verifications and overwrites of the nonce from 3 to 1.
      let { v, r, s } = await getParsedSignatureOfAddress(web3, mtw.address, user)
      // @ts-ignore
      const setAccountData = accounts.contract.methods
        .setAccount('', dek, user, v, r, s)
        .encodeABI()
      // @ts-ignore
      const setAccount = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods
          .executeTransaction(accounts.address, 0, setAccountData)
          .encodeABI(),
      }

      // @ts-ignore
      const approveData = stableToken.contract.methods
        .approve(attestations.address, attestationFee)
        .encodeABI()
      // @ts-ignore
      const approve = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods
          .executeTransaction(stableToken.address, 0, approveData)
          .encodeABI(),
      }

      // @ts-ignore
      const requestData = attestations.contract.methods
        .request(identifier, numAttestations, stableToken.address)
        .encodeABI()
      // @ts-ignore
      const request = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods
          .executeTransaction(attestations.address, 0, requestData)
          .encodeABI(),
      }

      transactions = [setAccount, approve, request]
      // @ts-ignore
      const executeTxsData = mtw.contract.methods
        .executeTransactions(
          transactions.map((t) => t.destination),
          transactions.map((t) => t.value),
          ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
          transactions.map((t) => trimLeading0x(t.data).length / 2)
        )
        .encodeABI()

      const executeTxs = { value: 0, destination: mtw.address, data: executeTxsData, nonce: 0 }
      const executeTxsMetaData = await getExecuteMetaTransactionData(user, mtw, executeTxs)
      const executeTxsMetaTx = { value: 0, destination: mtw.address, data: executeTxsMetaData }

      // @ts-ignore
      const transfer = {
        value: 0,
        destination: stableToken.address,
        data: stableToken.contract.methods.transfer(mtw.address, attestationFee).encodeABI(),
      }

      transactions = [transfer, executeTxsMetaTx]
      // transactions = [transfer]
      const requestTx = await komencimtw.executeTransactions(
        transactions.map((t) => t.destination),
        transactions.map((t) => t.value),
        ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
        transactions.map((t) => trimLeading0x(t.data).length / 2)
      )
      console.log(`Requesting attestations takes ${requestTx.receipt.gasUsed} gas`)
      totalCost += requestTx.receipt.gasUsed

      // Add fake randomness so that issuers can be selected.
      const selectIssuersWaitBlocks = 4
      const requestBlockNumber = await web3.eth.getBlockNumber()
      await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')

      // @ts-ignore
      const select = {
        value: 0,
        destination: attestations.address,
        data: attestations.contract.methods.selectIssuers(identifier).encodeABI(),
        nonce: 1,
      }
      const selectTx = await executeMetaTransaction(user, mtw, select)
      console.log(`Selecting issuers takes ${selectTx.receipt.gasUsed} gas`)
      totalCost += selectTx.receipt.gasUsed

      const issuers = await attestations.getAttestationIssuers(identifier, mtw.address)
      for (let i = 0; i < numAttestations; i++) {
        const issuer = issuers[i]
        ;[v, r, s] = await getVerificationCodeSignature(mtw.address, issuer, identifier)
        // @ts-ignore
        const complete = {
          value: 0,
          destination: attestations.address,
          data: attestations.contract.methods.complete(identifier, v, r, s).encodeABI(),
          nonce: i + 2,
        }
        const completeTx = await executeMetaTransaction(user, mtw, complete)
        console.log(`Completing an attestation takes ${completeTx.receipt.gasUsed} gas`)
        totalCost += completeTx.receipt.gasUsed
      }
      console.log(`Onboarding a user takes ${totalCost} gas`)
      /*
       * Deploying a proxy takes 188946 gas
         Funding takes 111138 gas
         Pool operations take 300084 gas
         Requesting attestations takes 270070 gas
         Selecting issuers takes 299593 gas
         Completing an attestation takes 160681 gas
         Completing an attestation takes 105077 gas
         Completing an attestation takes 105057 gas
         Onboarding a user takes 1240562 gas
       */
    })
  })

  describe('Plus AttestationsV2', () => {
    const Proxy: ProxyContract = artifacts.require('ProxyV2')
    const ProxyCloneFactory: ProxyCloneFactoryContract = artifacts.require('ProxyCloneFactory')
    const AttestationsV2: AttestationsV2TestContract = artifacts.require('AttestationsV2Test')
    let attestationsV2: AttestationsV2TestInstance
    let proxyCloneFactory: ProxyCloneFactoryInstance
    before(async () => {
      // Attestations uses some precompiles that are not implemented in ganache.
      // TODO: Put a proxy in front of it.
      const attestationExpiryBlocks = (60 * 60) / 5
      const selectIssuersWaitBlocks = 4
      const maxAttestations = 20
      const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())
      attestationsV2 = await AttestationsV2.new()
      const registry: RegistryInstance = await getDeployedProxiedContract('Registry', artifacts)
      await attestationsV2.initialize(
        registry.address,
        attestationExpiryBlocks,
        selectIssuersWaitBlocks,
        maxAttestations,
        attestationFee
      )
      await attestationsV2.__setValidators(
        _accounts.map((account) =>
          privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account))
        )
      )
      const proxy: ProxyInstance = await Proxy.new()
      proxyCloneFactory = await ProxyCloneFactory.new()
      await proxyCloneFactory.setProxyAddress(proxy.address)
    })

    it('should onboard a new user', async () => {
      let totalCost = 0

      // Possibly batch completions
      const deploymentTx = await proxyCloneFactory.deployAndFund(
        // TODO: Should proxy ownership be transferred to itself instead of the signer?
        komencimtw.address,
        mtw.address,
        // @ts-ignore
        mtw.contract.methods.initialize(ensureLeading0x(komencimtw.address)).encodeABI()
      )
      console.log(`Deploying a proxy takes ${deploymentTx.receipt.gasUsed} gas`)
      totalCost += deploymentTx.receipt.gasUsed
      // console.log(deploymentTx.logs)
      const proxy = await Proxy.at(deploymentTx.logs[1].args.proxy)
      mtw = await MTW.at(proxy.address)

      // @ts-ignore
      const ownership = {
        value: 0,
        destination: proxy.address,
        data: proxy.contract.methods._transferOwnership(user).encodeABI(),
      }
      // Set signer is only owner and so it needs to be called via the mtw
      // @ts-ignore
      const signerData = mtw.contract.methods.setSigner(user).encodeABI()
      // @ts-ignore
      const signer = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods.executeTransaction(mtw.address, 0, signerData).encodeABI(),
      }
      let transactions = [ownership, signer]
      const ownershipTx = await komencimtw.executeTransactions(
        transactions.map((t) => t.destination),
        transactions.map((t) => t.value),
        ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
        transactions.map((t) => trimLeading0x(t.data).length / 2)
      )
      console.log(`Transferring ownership to the user takes ${ownershipTx.receipt.gasUsed} gas`)

      await web3.eth.sendTransaction({
        from: _accounts[0],
        to: komencimtw.address,
        value: attestationFee,
      })
      // Batch these three transactions into
      // mtw.executeMetaTransaction(mtw.executeTransactions([setAccount, approve, request]))
      // and then batch that into komencimtw.executeTransactions([transfer, batchmetatx])
      //
      // The alternative would be for setAccount, approve, and request each to be their own
      // meta transactions, and then to roll things up into a single batch.
      // It's not clear which is more efficient but I suspect the former as it reduces the number
      // of signature verifications and overwrites of the nonce from 3 to 1.
      let { v, r, s } = await getParsedSignatureOfAddress(web3, mtw.address, user)
      // @ts-ignore
      const setAccountData = accounts.contract.methods
        .setAccount('', dek, user, v, r, s)
        .encodeABI()
      // @ts-ignore
      const setAccount = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods
          .executeTransaction(accounts.address, 0, setAccountData)
          .encodeABI(),
      }

      // @ts-ignore
      const requestData = attestationsV2.contract.methods
        .request(identifier, numAttestations)
        .encodeABI()
      // @ts-ignore
      const request = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods
          .executeTransaction(attestationsV2.address, attestationFee, requestData)
          .encodeABI(),
      }

      transactions = [setAccount, request]
      // @ts-ignore
      const executeTxsData = mtw.contract.methods
        .executeTransactions(
          transactions.map((t) => t.destination),
          transactions.map((t) => t.value),
          ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
          transactions.map((t) => trimLeading0x(t.data).length / 2)
        )
        .encodeABI()

      const executeTxs = { value: 0, destination: mtw.address, data: executeTxsData, nonce: 0 }
      const executeTxsMetaData = await getExecuteMetaTransactionData(user, mtw, executeTxs)
      const executeTxsMetaTx = { value: 0, destination: mtw.address, data: executeTxsMetaData }

      // @ts-ignore
      const transfer = { value: attestationFee, destination: mtw.address, data: '0x' }

      const transactions2 = [transfer, executeTxsMetaTx]
      const requestTx = await komencimtw.executeTransactions(
        transactions2.map((t) => t.destination),
        transactions2.map((t) => t.value),
        ensureLeading0x(transactions2.map((t) => trimLeading0x(t.data)).join('')),
        transactions2.map((t) => trimLeading0x(t.data).length / 2)
      )
      console.log(`Requesting attestations takes ${requestTx.receipt.gasUsed} gas`)
      totalCost += requestTx.receipt.gasUsed
      console.log(await attestationsV2.getAttestationStats(identifier, user))

      // Add fake randomness so that issuers can be selected.
      const selectIssuersWaitBlocks = 4
      const requestBlockNumber = await web3.eth.getBlockNumber()
      await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')

      const issuers = await Promise.all([
        attestationsV2.getIssuer(identifier, mtw.address, 0, 0),
        attestationsV2.getIssuer(identifier, mtw.address, 0, 1),
        attestationsV2.getIssuer(identifier, mtw.address, 0, 2),
      ])
      for (let i = 0; i < numAttestations; i++) {
        const issuer = issuers[i]
        ;[v, r, s] = await getVerificationCodeSignature(mtw.address, issuer, identifier)
        // @ts-ignore
        const complete = {
          value: 0,
          destination: attestationsV2.address,
          data: attestationsV2.contract.methods.complete(identifier, 0, i, v, r, s).encodeABI(),
          nonce: i + 1,
        }
        const completeTx = await executeMetaTransaction(user, mtw, complete)
        console.log(`Completing an attestation takes ${completeTx.receipt.gasUsed} gas`)
        totalCost += completeTx.receipt.gasUsed
      }
      console.log(`Onboarding a user takes ${totalCost} gas`)
      /*
          Deploying a proxy takes 188967 gas
          Transferring ownership to the user takes 73095 gas
          Requesting attestations takes 402604 gas
          Completing an attestation takes 160115 gas
          Completing an attestation takes 125466 gas
          Completing an attestation takes 131540 gas
          Onboarding a user takes 1008692 gas
       */
    })
  })

  describe.only('Plus delayed ownership transfer', () => {
    const Proxy: ProxyContract = artifacts.require('ProxyV2')
    const ProxyCloneFactory: ProxyCloneFactoryContract = artifacts.require('ProxyCloneFactory')
    const AttestationsV2: AttestationsV2TestContract = artifacts.require('AttestationsV2Test')
    let attestationsV2: AttestationsV2TestInstance
    let proxyCloneFactory: ProxyCloneFactoryInstance
    before(async () => {
      // Attestations uses some precompiles that are not implemented in ganache.
      // TODO: Put a proxy in front of it.
      const attestationExpiryBlocks = (60 * 60) / 5
      const selectIssuersWaitBlocks = 4
      const maxAttestations = 20
      const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())
      attestationsV2 = await AttestationsV2.new()
      const registry: RegistryInstance = await getDeployedProxiedContract('Registry', artifacts)
      await attestationsV2.initialize(
        registry.address,
        attestationExpiryBlocks,
        selectIssuersWaitBlocks,
        maxAttestations,
        attestationFee
      )
      await attestationsV2.__setValidators(
        _accounts.map((account) =>
          privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account))
        )
      )
      const proxy: ProxyInstance = await Proxy.new()
      proxyCloneFactory = await ProxyCloneFactory.new()
      await proxyCloneFactory.setProxyAddress(proxy.address)
    })

    it('should onboard a new user', async () => {
      let totalCost = 0

      // Possibly batch completions
      const deploymentTx = await proxyCloneFactory.deployAndFund(
        // TODO: Should proxy ownership be transferred to itself instead of the signer?
        komencimtw.address,
        mtw.address,
        // @ts-ignore
        mtw.contract.methods.initialize(ensureLeading0x(komencimtw.address)).encodeABI()
      )
      console.log(`Deploying and funding a proxy takes ${deploymentTx.receipt.gasUsed + 21000} gas`)
      totalCost += deploymentTx.receipt.gasUsed
      const proxy = await Proxy.at(deploymentTx.logs[1].args.proxy)
      mtw = await MTW.at(proxy.address)
      // TODO(asa): Find a way to bundle this into the deployment tx
      await web3.eth.sendTransaction({
        from: _accounts[0],
        to: proxy.address,
        value: attestationFee,
      })

      let { v, r, s } = await getParsedSignatureOfAddress(web3, mtw.address, user)
      // @ts-ignore
      const setAccountData = accounts.contract.methods
        .setAccount('', dek, user, v, r, s)
        .encodeABI()
      // @ts-ignore
      const setAccount = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods
          .executeTransaction(accounts.address, 0, setAccountData)
          .encodeABI(),
      }

      // @ts-ignore
      const requestData = attestationsV2.contract.methods
        .request(identifier, numAttestations)
        .encodeABI()
      // @ts-ignore
      const request = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods
          .executeTransaction(attestationsV2.address, attestationFee, requestData)
          .encodeABI(),
      }

      // @ts-ignore
      const ownership = {
        value: 0,
        destination: proxy.address,
        data: proxy.contract.methods._transferOwnership(user).encodeABI(),
      }
      // Set signer is only owner and so it needs to be called via the mtw
      // @ts-ignore
      const signerData = mtw.contract.methods.setSigner(user).encodeABI()
      // @ts-ignore
      const signer = {
        value: 0,
        destination: mtw.address,
        data: mtw.contract.methods.executeTransaction(mtw.address, 0, signerData).encodeABI(),
      }

      let transactions = [setAccount, request, ownership, signer]
      const requestTx = await komencimtw.executeTransactions(
        transactions.map((t) => t.destination),
        transactions.map((t) => t.value),
        ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
        transactions.map((t) => trimLeading0x(t.data).length / 2)
      )
      console.log(`Requesting attestations takes ${requestTx.receipt.gasUsed} gas`)
      totalCost += requestTx.receipt.gasUsed

      // Add fake randomness so that issuers can be selected.
      const selectIssuersWaitBlocks = 4
      const requestBlockNumber = await web3.eth.getBlockNumber()
      await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')

      const issuers = await Promise.all([
        attestationsV2.getIssuer(identifier, mtw.address, 0, 0),
        attestationsV2.getIssuer(identifier, mtw.address, 0, 1),
        attestationsV2.getIssuer(identifier, mtw.address, 0, 2),
      ])
      for (let i = 0; i < numAttestations; i++) {
        const issuer = issuers[i]
        ;[v, r, s] = await getVerificationCodeSignature(mtw.address, issuer, identifier)
        // @ts-ignore
        const complete = {
          value: 0,
          destination: attestationsV2.address,
          data: attestationsV2.contract.methods.complete(identifier, 0, i, v, r, s).encodeABI(),
          nonce: i,
        }
        const completeTx = await executeMetaTransaction(user, mtw, complete)
        console.log(`Completing an attestation takes ${completeTx.receipt.gasUsed} gas`)
        totalCost += completeTx.receipt.gasUsed
      }
      console.log(`Onboarding a user takes ${totalCost} gas`)
      /*
       *  Deploying and funding a proxy takes 208891 gas
          Requesting attestations takes 332871 gas
          Completing an attestation takes 175095 gas
          Completing an attestation takes 125466 gas
          Completing an attestation takes 131540 gas
          Onboarding a user takes 952863 gas
       */
    })
  })
})
