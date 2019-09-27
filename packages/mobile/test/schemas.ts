import { PincodeType } from 'src/account/reducer'
import { RootState } from 'src/redux/reducers'

// Default (version -1 schema)
export const vNeg1Schema = {
  app: {
    inviteCodeEntered: false,
    loggedIn: false,
    numberVerified: false,
    error: null,
    dismissErrorAfter: null,
    language: 'es-AR',
    doingBackupFlow: false,
    message: null,
    dismissMessageAfter: null,
    analyticsEnabled: true,
  },
  networkInfo: {
    connected: true,
  },
  send: {
    isSending: false,
    suggestedFee: '',
    recentPhoneNumbers: [],
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
    isReady: false,
    syncProgress: 0,
    syncProgressData: {
      currentBlock: 0,
      highestBlock: 0,
      startBlock: 0,
    },
    latestBlockNumber: 0,
    account: '0x0000000000000000000000000000000000007E57',
    commentKey: '0x0000000000000000000000000000000000008F68',
    gasPriceLastUpdated: 0,
  },
  identity: {
    attestationCodes: [],
    numCompleteAttestations: 0,
    verificationFailed: false,
    addressToE164Number: {},
    e164NumberToAddress: {},
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
    accountCreationTime: 99999999999999,
    paymentRequests: [],
    showFakeData: false,
    backupCompleted: false,
    backupDelayedTime: 0,
    dismissedEarnRewards: false,
    dismissedInviteFriends: false,
  },
  invite: {
    isSendingInvite: false,
    invitees: {},
    redeemedInviteCode: '',
  },
  escrow: {
    isReclaiming: false,
    sentEscrowedPayments: [],
    suggestedFee: null,
  },
}

export const v0Schema = {
  ...vNeg1Schema,
  identity: {
    ...vNeg1Schema.identity,
    startedVerification: false,
    askedContactsPermission: false,
    isLoadingImportContacts: false,
  },
  invite: {
    ...vNeg1Schema.invite,
    redeemComplete: false,
  },
  send: {
    isSending: false,
    recentPhoneNumbers: undefined,
    recipientCache: undefined,
    recentRecipients: [],
  },
  recipients: {
    recipientCache: {},
  },
  web3: {
    ...vNeg1Schema.web3,
    syncProgress: {
      startingBlock: 0,
      currentBlock: 0,
      highestBlock: 0,
    },
  },
  localCurrency: {
    isLoading: false,
    symbol: 'MXN',
    exchangeRate: 1.33,
  },
}

export const v1Schema = {
  ...v0Schema,
  app: {
    ...v0Schema.app,
    language: 'es-419',
  },
}

export const v2Schema = {
  ...v1Schema,
  account: {
    ...v1Schema.account,
    pincodeType: PincodeType.Unset,
    isSettingPin: false,
  },
  invite: {
    ...v1Schema.invite,
    isRedeemingInvite: false,
  },
}

export function getLatestSchema(): Partial<RootState> {
  return v2Schema as Partial<RootState>
}
