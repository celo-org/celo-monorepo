import { PincodeType } from 'src/account/reducer'
import { AppState } from 'src/app/actions'
import { RootState } from 'src/redux/reducers'

// Default (version -1 schema)
export const vNeg1Schema = {
  app: {
    inviteCodeEntered: false,
    loggedIn: false,
    numberVerified: false,
    error: null,
    dismissErrorAfter: null,
    language: 'es-419',
    doingBackupFlow: false,
    message: null,
    dismissMessageAfter: null,
    analyticsEnabled: true,
    lockWithPinEnabled: false,
    appState: AppState.Active,
    locked: false,
    lastTimeBackgrounded: 0,
  },
  networkInfo: {
    connected: true,
    rehydrated: true,
  },
  send: {
    isSending: false,
    recentRecipients: [],
    recentPayments: [],
  },
  recipients: {
    recipientCache: {},
  },
  goldToken: {
    balance: null,
    educationCompleted: false,
    lastFetch: null,
  },
  stableToken: {
    balance: null,
    educationCompleted: false,
    lastFetch: null,
  },
  home: {
    loading: false,
    notifications: [],
  },
  medianator: {
    exchangeRate: '1',
  },
  transactions: {
    standbyTransactions: [],
  },
  web3: {
    syncProgress: {
      startingBlock: 0,
      currentBlock: 100,
      highestBlock: 100,
    },
    latestBlockNumber: 0,
    account: '0x0000000000000000000000000000000000007E57',
    accountInWeb3Keystore: '0x0000000000000000000000000000000000007E57',
    commentKey: '0x0000000000000000000000000000000000008F68',
    gasPriceLastUpdated: 0,
    fornoMode: false,
    contractKitReady: true,
  },
  geth: {
    initialized: 'INITIALIZED',
    connected: true,
    gethStartedThisSession: false,
  },
  identity: {
    attestationCodes: [],
    numCompleteAttestations: 0,
    verificationFailed: false,
    addressToE164Number: {},
    e164NumberToAddress: {},
    e164NumberToSalt: {},
    startedVerification: false,
    askedContactsPermission: false,
    isLoadingImportContacts: false,
    acceptedAttestationCodes: [],
    verificationStatus: 0,
    hasSeenVerificationNux: false,
    contactMappingProgress: {
      current: 0,
      total: 0,
    },
  },
  account: {
    name: 'John Doe',
    e164PhoneNumber: '+14155556666',
    defaultCountryCode: '+1',
    contactDetails: {
      contactId: 'contactId',
      thumbnailPath: null,
    },
    devModeActive: false,
    devModeClickCount: 0,
    photosNUXClicked: false,
    pincodeSet: false,
    pincodeType: PincodeType.Unset,
    isSettingPin: false,
    accountCreationTime: 99999999999999,
    backupCompleted: false,
    backupDelayedTime: 0,
    socialBackupCompleted: false,
    incomingPaymentRequests: [],
    outgoingPaymentRequests: [],
    dismissedGetVerified: false,
    dismissedInviteFriends: false,
    promptFornoIfNeeded: false,
    acceptedTerms: false,
  },
  invite: {
    isSendingInvite: false,
    isRedeemingInvite: false,
    isSkippingInvite: false,
    invitees: {},
    redeemedTempAccountPrivateKey: '',
    redeemComplete: false,
  },
  escrow: {
    isReclaiming: false,
    sentEscrowedPayments: [],
    suggestedFee: null,
  },
  localCurrency: {
    isLoading: false,
    exchangeRate: '1.33',
    preferredCurrencyCode: 'MXN',
    fetchedCurrencyCode: 'MXN',
  },
  imports: {
    isImportingWallet: false,
  },
  exchange: {
    exchangeRatePair: null,
    history: {
      isLoading: false,
      celoGoldExchangeRates: [],
      lastTimeUpdated: 0,
    },
    tobinTax: '0',
  },
}

export const v0Schema = {
  app: {
    inviteCodeEntered: false,
    loggedIn: false,
    numberVerified: false,
    error: null,
    dismissErrorAfter: null,
    language: 'es-419',
    doingBackupFlow: false,
    message: null,
    dismissMessageAfter: null,
    analyticsEnabled: true,
    lockWithPinEnabled: false,
    appState: AppState.Active,
    locked: false,
    lastTimeBackgrounded: 0,
  },
  networkInfo: {
    connected: true,
    rehydrated: true,
  },
  send: {
    isSending: false,
    recentRecipients: [],
    recentPayments: [],
  },
  recipients: {
    recipientCache: {},
  },
  goldToken: {
    balance: null,
    educationCompleted: false,
    lastFetch: null,
  },
  stableToken: {
    balance: null,
    educationCompleted: false,
    lastFetch: null,
  },
  home: {
    loading: false,
    notifications: [],
  },
  medianator: {
    exchangeRate: '1',
  },
  transactions: {
    standbyTransactions: [],
  },
  web3: {
    syncProgress: {
      startingBlock: 0,
      currentBlock: 100,
      highestBlock: 100,
    },
    latestBlockNumber: 0,
    account: '0x0000000000000000000000000000000000007E57',
    accountInWeb3Keystore: '0x0000000000000000000000000000000000007E57',
    commentKey: '0x0000000000000000000000000000000000008F68',
    gasPriceLastUpdated: 0,
    fornoMode: false,
    contractKitReady: true,
  },
  geth: {
    initialized: 'INITIALIZED',
    connected: true,
    gethStartedThisSession: false,
  },
  identity: {
    attestationCodes: [],
    numCompleteAttestations: 0,
    verificationFailed: false,
    addressToE164Number: {},
    e164NumberToAddress: {},
    e164NumberToSalt: {},
    startedVerification: false,
    askedContactsPermission: false,
    isLoadingImportContacts: false,
    acceptedAttestationCodes: [],
    verificationStatus: 0,
    hasSeenVerificationNux: false,
    contactMappingProgress: {
      current: 0,
      total: 0,
    },
  },
  account: {
    name: 'John Doe',
    e164PhoneNumber: '+14155556666',
    defaultCountryCode: '+1',
    contactDetails: {
      contactId: 'contactId',
      thumbnailPath: null,
    },
    devModeActive: false,
    devModeClickCount: 0,
    photosNUXClicked: false,
    pincodeSet: false,
    pincodeType: PincodeType.Unset,
    isSettingPin: false,
    accountCreationTime: 99999999999999,
    backupCompleted: false,
    backupDelayedTime: 0,
    socialBackupCompleted: false,
    incomingPaymentRequests: [],
    outgoingPaymentRequests: [],
    dismissedGetVerified: false,
    dismissedEarnRewards: false,
    dismissedInviteFriends: false,
    promptFornoIfNeeded: false,
    acceptedTerms: false,
  },
  invite: {
    isSendingInvite: false,
    isRedeemingInvite: false,
    isSkippingInvite: false,
    invitees: [],
    redeemedTempAccountPrivateKey: '',
    redeemComplete: false,
  },
  escrow: {
    isReclaiming: false,
    sentEscrowedPayments: [],
    suggestedFee: null,
  },
  localCurrency: {
    isLoading: false,
    exchangeRate: '1.33',
    preferredCurrencyCode: 'MXN',
    fetchedCurrencyCode: 'MXN',
  },
  imports: {
    isImportingWallet: false,
  },
  exchange: {
    exchangeRatePair: null,
    history: {
      isLoading: false,
      celoGoldExchangeRates: [],
      lastTimeUpdated: 0,
    },
    tobinTax: '0',
  },
}

export const v1Schema = {
  ...v0Schema,
  exchange: {
    ...v0Schema.exchange,
    history: {
      ...v0Schema.exchange.history,
      aggregatedExchangeRates: [],
      granularity: 60,
      range: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  },
  identity: {
    ...v0Schema.identity,
    importContactsProgress: {
      status: 0,
      current: 0,
      total: 0,
    },
    matchedContacts: {},
    secureSendPhoneNumberMapping: {},
  },
  transactions: {
    ...v0Schema.transactions,
    knownFeedTransactions: {},
    recentTxRecipientsCache: {},
  },
  account: {
    ...v0Schema.account,
    retryVerificationWithForno: true,
  },
  app: {
    ...v0Schema.app,
    requirePinOnAppOpen: false,
  },
}

export const v2Schema = {
  ...v1Schema,
  app: {
    ...v1Schema.app,
    sessionId: '',
  },
}

export const v3Schema = {
  ...v2Schema,
  account: {
    ...v2Schema.account,
    hasMigratedToNewBip39: false,
    choseToRestoreAccount: false,
  },
  identity: {
    ...v2Schema.identity,
    addressToDataEncryptionKey: {},
  },
  web3: {
    ...v2Schema.web3,
    isDekRegistered: false,
  },
  geth: {
    ...v2Schema.geth,
    chainHead: {
      number: 100,
      timestamp: 1596502618,
      hash: '0x0000000000000000000000000000000000000000000000000000000000000F00',
    },
  },
}

// Skipping v4 to match the Redux store version
// It's not critical but it's good to keep those in sync
export const v5Schema = {
  ...v3Schema,
  account: {
    ...v3Schema.account,
    incomingPaymentRequests: undefined,
    outgoingPaymentRequests: undefined,
    dismissedGoldEducation: false,
  },
  paymentRequest: {
    incomingPaymentRequests: [],
    outgoingPaymentRequests: [],
  },
  web3: {
    ...v3Schema.web3,
    dataEncryptionKey: '0x0000000000000000000000000000000000008F68',
    commentKey: undefined,
  },
  identity: {
    ...v3Schema.identity,
    lastRevealAttempt: null,
    verificationState: {
      isLoading: false,
      phoneHashDetails: {
        e164Number: '',
        phoneHash: '',
        pepper: '',
      },
      actionableAttestations: [],
      status: {
        isVerified: false,
        numAttestationsRemaining: 3,
        total: 0,
        completed: 0,
      },
      lastFetch: null,
    },
    addressToDisplayName: {},
  },
  exchange: {
    ...v3Schema.exchange,
    isLoading: false,
  },
  app: {
    ...v3Schema.app,
    minVersion: null,
  },
}

export function getLatestSchema(): Partial<RootState> {
  return v5Schema as Partial<RootState>
}
