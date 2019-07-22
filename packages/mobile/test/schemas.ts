import { RootState } from 'src/redux/reducers'

const schemaVersions = [
  // Default (version -1 schema)
  {
    app: {
      inviteCodeEntered: false,
      loggedIn: false,
      numberVerified: false,
      error: null,
      dismissErrorAfter: null,
      language: null,
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
      startedVerification: false,
      askedContactsPermission: false,
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
      dismissedEarnRewards: false,
      dismissedInviteFriends: false,
    },
    invite: {
      isSendingInvite: false,
      invitees: {},
      redeemedInviteCode: '',
      redeemComplete: false,
    },
    escrow: {
      sentEscrowedPayments: [],
      currentPaymentId: '',
    },
  },
]

export function getLatestSchema(): Partial<RootState> {
  return schemaVersions[schemaVersions.length - 1] as Partial<RootState>
}
