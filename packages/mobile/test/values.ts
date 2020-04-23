/* Shared mock values to facilitate testing */
import BigNumber from 'bignumber.js'
import { MinimalContact } from 'react-native-contacts'
import { NotificationTypes, PaymentRequest, PaymentRequestStatus } from 'src/account/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import { AttestationCode } from 'src/identity/verification'
import {
  RecipientKind,
  RecipientWithContact,
  RecipientWithMobileNumber,
} from 'src/recipients/recipient'

export const mockName = 'John Doe'
export const mockAccount = '0x0000000000000000000000000000000000007E57'
export const mockAccount2 = '0x1Ff482D42D8727258A1686102Fa4ba925C46Bc42'

export const mockMnemonic =
  'prosper winner find donate tape history measure umbrella agent patrol want rhythm old unable wash wrong need fluid hammer coach reveal plastic trust lake'

export const mockMnemonicShard1 =
  'prosper winner find donate tape history measure umbrella agent patrol want rhythm celo'
export const mockMnemonicShard2 =
  'celo old unable wash wrong need fluid hammer coach reveal plastic trust lake'

export const mockPrivateDEK = Buffer.from(
  '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04',
  'hex'
)
export const mockPublicDEK = '02c9cacca8c5c5ebb24dc6080a933f6d52a072136a069083438293d71da36049dc'
export const mockPrivateDEK2 = Buffer.from(
  '855c5f9d5fc53962537eaf9a0f3ea40a7bc7e57a119e8473fffef24be20bffff',
  'hex'
)
export const mockPublicDEK2 = '024c158e98449d9ca4dddeaa12c2432a5e7d38a48a53299fd22c51daf8d409957a'

export const mockContractAddress = '0x000000000000000000000000000000000000CE10'
export const mockE164Number = '+14155550000'
export const mockE164NumberHash =
  '0xefbc804cdddcb76544e1dd2c25e9624edae290d175ccd20538e5cae06c7dbe9e'
export const mockDisplayNumber = '(415) 555-0000'
export const mockE164Number2 = '+12095559790'
export const mockDisplayNumber2 = '(209) 555-9790'
export const mockComment = 'Rent request for June, it is already late!!!'
export const mockCountryCode = '+1'

export const mockQrCodeData = `{"address":"${mockAccount}","e164PhoneNumber":"${mockE164Number}","displayName":"${mockName}"}`

export const mockInvitableRecipient: RecipientWithContact = {
  kind: RecipientKind.Contact,
  displayName: mockName,
  displayId: '14155550000',
  e164PhoneNumber: mockE164Number,
  contactId: 'contactId',
  phoneNumberLabel: 'phoneNumLabel',
}

export const mockRecipient: RecipientWithContact = {
  ...mockInvitableRecipient,
  address: mockAccount,
}

export const mockE164NumberToInvitableRecipient = {
  [mockE164Number]: mockInvitableRecipient,
}

export const mockRecipientCache = {
  [mockE164Number]: mockRecipient,
}

export const mockRecipientWithPhoneNumber: RecipientWithMobileNumber = {
  kind: RecipientKind.MobileNumber,
  address: mockAccount,
  displayName: mockName,
  displayId: '14155550000',
  e164PhoneNumber: mockE164Number,
}

export const mockNavigation = {
  state: {
    params: { recipient: mockRecipient },
    index: 0,
    routes: [],
    isTransitioning: false,
    key: 'key',
    routeName: 'routeName',
  },
  dispatch: jest.fn(),
  goBack: jest.fn(),
  dismiss: jest.fn(),
  navigate: jest.fn(),
  openDrawer: jest.fn(),
  closeDrawer: jest.fn(),
  toggleDrawer: jest.fn(),
  getParam: jest.fn(() => mockRecipient),
  setParams: jest.fn(),
  addListener: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  isFocused: jest.fn(),
  dangerouslyGetParent: jest.fn(),
  emit: jest.fn(),
  isFirstRouteInParent: jest.fn(),
}
export const mockAddressToE164Number: AddressToE164NumberType = {
  [mockAccount]: mockE164Number,
}
export const mockE164NumberToAddress: E164NumberToAddressType = { [mockE164Number]: [mockAccount] }

export const mockAttestationMessage: AttestationCode = {
  code:
    'ab8049b95ac02e989aae8b61fddc10fe9b3ac3c6aebcd3e68be495570b2d3da15aabc691ab88de69648f988fab653ac943f67404e532cfd1013627f56365f36501',
  issuer: '848920b14154b6508b8d98e7ee8159aa84b579a4',
}

export const mockContactWithPhone: MinimalContact = {
  recordID: '1',
  displayName: 'Alice The Person',
  phoneNumbers: [
    {
      label: 'mobile',
      number: mockDisplayNumber2,
    },
  ],
  thumbnailPath: '//path/',
}

export const mockContactWithPhone2: MinimalContact = {
  recordID: '2',
  displayName: 'Bob Bobson',
  phoneNumbers: [
    { label: 'home', number: mockE164Number },
    { label: 'mobile', number: '100200' },
  ],
  thumbnailPath: '',
}

export const mockContactList = [mockContactWithPhone2, mockContactWithPhone]

export const mockEscrowedPayment: EscrowedPayment = {
  senderAddress: mockAccount2,
  recipientPhone: mockE164Number,
  paymentID: mockAccount,
  currency: SHORT_CURRENCIES.DOLLAR,
  amount: new BigNumber(10),
  timestamp: new BigNumber(10000),
  expirySeconds: new BigNumber(50000),
}

const date = new Date('Tue Mar 05 2019 13:44:06 GMT-0800 (Pacific Standard Time)')
const currency = SHORT_CURRENCIES.DOLLAR
export const mockPaymentRequests: PaymentRequest[] = [
  {
    amount: '200000.00',
    uid: 'FAKE_ID_1',
    timestamp: date,
    comment: 'Dinner for me and the gals, PIZZAA!',
    requesterE164Number: mockE164Number,
    requesteeAddress: mockAccount,
    requesterAddress: mockAccount2,
    status: PaymentRequestStatus.REQUESTED,
    currency,
    notified: true,
    type: NotificationTypes.PAYMENT_REQUESTED,
  },
  {
    timestamp: date,
    amount: '180.89',
    uid: 'FAKE_ID_2',
    comment: 'My Birthday Present. :) Am I not the best? Celebration. Bam!',
    requesterE164Number: mockE164Number,
    requesteeAddress: mockAccount,
    requesterAddress: mockAccount2,
    status: PaymentRequestStatus.REQUESTED,
    currency,
    notified: true,
    type: NotificationTypes.PAYMENT_REQUESTED,
  },
  {
    timestamp: date,
    amount: '180.89',
    uid: 'FAKE_ID_3',
    comment: 'My Birthday Present. :) Am I not the best? Celebration. Bam!',
    requesterE164Number: mockE164Number,
    requesteeAddress: mockAccount,
    requesterAddress: mockAccount2,
    status: PaymentRequestStatus.REQUESTED,
    currency,
    notified: true,
    type: NotificationTypes.PAYMENT_REQUESTED,
  },
]
