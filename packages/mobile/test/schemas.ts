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
  },
  send: {
    isSending: false,
    recentRecipients: [],
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
    invitees: {},
    redeemedInviteCode: '',
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

export const v0Schema = vNeg1Schema

export const v1Schema = {
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
  },
  send: {
    isSending: false,
    recentRecipients: [],
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
    redeemedInviteCode: '',
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

export function getLatestSchema(): Partial<RootState> {
  return v1Schema as Partial<RootState>
}
