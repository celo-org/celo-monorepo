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

const mockNameInvite = 'Jane Doe'
const mockName2Invite = 'George Bogart'
const mockE164NumberInvite = '+13105550000'
const mockDisplayNumberInvite = '13105550000'
const mockE164Number2Invite = '+21255550000'
const mockDisplayNumber2Invite = '21255550000'
const mockAccountInvite = '0x9335BaFcE54cAa0D6690d1D4DA6406568b52488F'
const mockAccountInvitePrivKey =
  '0xe59c12feb5ea13dabcc068a28d1d521a26e39464faa7bbcc01f43b8340e92fa6'
const mockAccount2Invite = '0x8e1Df47B7064D005Ef071a89D0D7dc8634BC8A9C'
const mockAccountInvite2PrivKey =
  '0xb33eac631fd3a415f3738649db8cad57da78b99ec92cd8f77b76b5dae2ebdf27'

export const mockInviteDetails = {
  timestamp: 1588200517518,
  e164Number: mockE164NumberInvite,
  tempWalletAddress: mockAccount.toLowerCase(),
  tempWalletPrivateKey: '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
  tempWalletRedeemed: false,
  inviteCode: 'ESnrL7zNxmP0kjpklcNbCWJJgStYn3xM0dugHh7a9yQ=',
  inviteLink: 'http://celo.page.link/PARAMS',
}

export const mockInviteDetails2 = {
  timestamp: 1588200517518,
  e164Number: mockE164Number2Invite,
  tempWalletAddress: mockAccountInvite.toLowerCase(),
  tempWalletPrivateKey: mockAccountInvitePrivKey,
  tempWalletRedeemed: false,
  inviteCode: 'sz6sYx/TpBXzc4ZJ24ytV9p4uZ7JLNj3e3a12uLr3yc=',
  inviteLink: 'http://celo.page.link/PARAMS',
}

// using the default mock values
export const mockInviteDetails3 = {
  timestamp: 1588200517518,
  e164Number: mockE164NumberInvite,
  tempWalletAddress: mockAccount2Invite.toLowerCase(),
  tempWalletPrivateKey: mockAccountInvite2PrivKey,
  tempWalletRedeemed: false,
  inviteCode: '5ZwS/rXqE9q8wGiijR1SGibjlGT6p7vMAfQ7g0DpL6Y=',
  inviteLink: 'http://celo.page.link/PARAMS',
}

const mockInvitableRecipient: RecipientWithContact = {
  kind: RecipientKind.Contact,
  displayName: mockName,
  displayId: '14155550000',
  e164PhoneNumber: mockE164Number,
  contactId: 'contactId',
  phoneNumberLabel: 'phoneNumLabel',
}

const mockInvitableRecipient2: RecipientWithContact = {
  kind: RecipientKind.Contact,
  displayName: mockNameInvite,
  displayId: mockDisplayNumberInvite,
  e164PhoneNumber: mockE164NumberInvite,
  contactId: 'contactId',
  phoneNumberLabel: 'phoneNumLabel',
}

const mockInvitableRecipient3: RecipientWithContact = {
  kind: RecipientKind.Contact,
  displayName: mockName2Invite,
  displayId: mockDisplayNumber2Invite,
  e164PhoneNumber: mockE164Number2Invite,
  contactId: 'contactId',
  phoneNumberLabel: 'phoneNumLabel',
}

export const mockRecipient: RecipientWithContact = {
  ...mockInvitableRecipient,
  address: mockAccount,
}

export const mockRecipient2: RecipientWithContact = {
  ...mockInvitableRecipient2,
  address: mockAccountInvite,
}

export const mockRecipient3: RecipientWithContact = {
  ...mockInvitableRecipient3,
  address: mockAccount2Invite,
}

export const mockE164NumberToInvitableRecipient = {
  [mockE164Number]: mockInvitableRecipient,
  [mockE164NumberInvite]: mockInvitableRecipient2,
  [mockE164Number2Invite]: mockInvitableRecipient3,
}

export const mockRecipientCache = {
  [mockE164Number]: mockRecipient,
  [mockE164NumberInvite]: mockInvitableRecipient2,
  [mockE164Number2Invite]: mockInvitableRecipient3,
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
  [mockAccountInvite]: mockE164NumberInvite,
  [mockAccount2Invite]: mockE164Number2Invite,
}

export const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164Number]: [mockAccount],
  [mockE164NumberInvite]: [mockAccountInvite],
  [mockE164Number2Invite]: [mockAccount2Invite],
}

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
