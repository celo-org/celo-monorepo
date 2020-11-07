import { contactsToRecipients, RecipientKind, sortRecipients } from 'src/recipients/recipient'
import {
  mockContactList,
  mockDisplayNumber,
  mockE164Number,
  mockRecipient,
  mockRecipient2,
  mockRecipient3,
  mockRecipient4,
} from 'test/values'

describe('contactsToRecipients', () => {
  it('returns a recipient per phone number', () => {
    const countryCode = '+1'
    const recipients = contactsToRecipients(mockContactList, countryCode)

    if (!recipients) {
      return expect(false).toBeTruthy()
    }

    const recipientsWithE164Numbers = Object.values(recipients.e164NumberToRecipients)
    const recipientsWithoutE164Numbers = Object.values(recipients.otherRecipients)

    expect(recipientsWithE164Numbers).toHaveLength(2)
    expect(recipientsWithE164Numbers[1]).toMatchObject({
      kind: RecipientKind.Contact,
      displayName: 'Alice The Person',
      displayId: '(209) 555-9790',
      e164PhoneNumber: '+12095559790',
      phoneNumberLabel: 'mobile',
      contactId: '1',
    })
    expect(recipientsWithE164Numbers[0]).toMatchObject({
      kind: RecipientKind.Contact,
      displayName: 'Bob Bobson',
      displayId: mockDisplayNumber,
      e164PhoneNumber: mockE164Number,
      phoneNumberLabel: 'home',
      contactId: '2',
    })
    expect(recipientsWithoutE164Numbers).toHaveLength(1)
    expect(recipientsWithoutE164Numbers[0]).toMatchObject({
      kind: RecipientKind.Contact,
      displayName: 'Bob Bobson',
      displayId: '100200',
      phoneNumberLabel: 'mobile',
      contactId: '2',
    })
  })
})

describe('Recipient sorting', () => {
  const recipients = [mockRecipient2, mockRecipient, mockRecipient4, mockRecipient3]
  it('Sorts recipients without any prioritized', () => {
    expect(sortRecipients(recipients)).toStrictEqual([
      mockRecipient3,
      mockRecipient2,
      mockRecipient,
      mockRecipient4,
    ])
  })
  it('Sorts recipients with some prioritized', () => {
    const prioritized = { [mockRecipient.e164PhoneNumber!]: { contactId: 'contactId' } }
    expect(sortRecipients(recipients, prioritized)).toStrictEqual([
      mockRecipient,
      mockRecipient3,
      mockRecipient2,
      mockRecipient4,
    ])
  })
})
