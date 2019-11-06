import ContractUtils from './src/contract-utils-v2'
import GenesisBlockUtils from './src/genesis-block-utils'
import GoogleStorageUtils from './src/google-storage-utils'
import { Logger, LogLevel } from './src/logger'
import StaticNodeUtils from './src/static-node-utils'
import { Web3Utils } from './src/web3-utils'

export {
  Attestations,
  LockedGold,
  Escrow,
  Exchange,
  GasCurrencyWhitelist,
  GasPriceMinimum,
  GoldToken,
  Governance,
  Random,
  Registry,
  Reserve,
  SortedOracles,
  StableToken,
  Validators,
} from './contracts/index'
export {
  CeloFunctionCall,
  CeloLog,
  constructFunctionABICache,
  FunctionABICache,
  getFunctionSignatureFromInput,
  parseFunctionCall,
  parseLog,
} from './src/abi'
export { unlockAccount } from './src/account-utils'
export {
  ActionableAttestation,
  attestationMessageToSign,
  AttestationState,
  decodeAttestationCode,
  extractAttestationCodeFromMessage,
  findMatchingIssuer,
  getActionableAttestations,
  getAttestationFee,
  getAttestationState,
  getDataEncryptionKey,
  getWalletAddress,
  lookupPhoneNumbers,
  makeApproveAttestationFeeTx,
  makeCompleteTx,
  makeRequestTx,
  makeRevealTx,
  makeSetAccountTx,
  makeSetWalletAddressTx,
  messageContainsAttestationCode,
  sanitizeBase64,
  validateAttestationCode,
} from './src/attestations'
export {
  awaitConfirmation,
  CeloContract,
  Contracts,
  emptyTxLogger,
  getContracts,
  selectContractByAddress,
  SendTransaction,
  sendTransaction,
  sendTransactionAsync,
  sendTransactionAsyncWithWeb3Signing,
  SendTransactionLogEvent,
  SendTransactionLogEventType,
  TxLogger,
  TxPromises,
} from './src/contract-utils'
export {
  getAttestationsContract,
  getEscrowContract,
  getExchangeContract,
  getGasPriceMinimumContract,
  getGoldTokenContract,
  getStableTokenContract,
} from './src/contracts'
export {
  allowance,
  approveToken,
  balanceOf,
  CeloTokenType,
  convertToContractDecimals,
  getErc20Balance,
  getGoldTokenAddress,
  parseFromContractDecimals,
  selectTokenContractByIdentifier,
  transferToken,
  transferTokenWithComment,
} from './src/erc20-utils'
export { ContractUtils }
export { GenesisBlockUtils }
export { GoogleStorageUtils }
export { Logger as WalletKitLogger, LogLevel as WalletKitLogLevel }
export { StaticNodeUtils }
export { Web3Utils }
export { addLocalAccount, getAccountAddressFromPrivateKey } from './src/new-web3-utils'
