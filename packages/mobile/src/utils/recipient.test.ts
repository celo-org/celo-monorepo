import { contactsToRecipients, RecipientKind } from 'src/utils/recipient'
import { mockAccount, mockContactList, mockDisplayNumber, mockE164Number } from 'test/values'

describe('contactsToRecipients', () => {
  it('returns a recipient per phone number', () => {
    const countryCode = '+1'
    const recipients = contactsToRecipients(mockContactList, countryCode, {
      [mockE164Number]: mockAccount,
    })

    if (!recipients) {
      return expect(false).toBeTruthy()
    }

    const recipientsWithE164Numbers = Object.values(recipients.e164NumberToRecipients)
    const recipientsWithoutE164Numbers = Object.values(recipients.otherRecipients)

    expect(recipientsWithE164Numbers).toHaveLength(2)
    expect(recipientsWithE164Numbers[1]).toMatchObject({
      kind: RecipientKind.Contact,
      displayName: 'Alice The Person',
      displayPhoneNumber: '(209) 555-9790',
      e164PhoneNumber: '+12095559790',
      phoneNumberLabel: 'mobile',
      contactId: '1',
    })
    expect(recipientsWithE164Numbers[0]).toMatchObject({
      kind: RecipientKind.Contact,
      displayName: 'Bob Bobson',
      displayPhoneNumber: mockDisplayNumber,
      e164PhoneNumber: mockE164Number,
      phoneNumberLabel: 'home',
      contactId: '2',
    })
    expect(recipientsWithoutE164Numbers).toHaveLength(1)
    expect(recipientsWithoutE164Numbers[0]).toMatchObject({
      kind: RecipientKind.Contact,
      displayName: 'Bob Bobson',
      displayPhoneNumber: '100200',
      phoneNumberLabel: 'mobile',
      contactId: '2',
    })
  })
})
