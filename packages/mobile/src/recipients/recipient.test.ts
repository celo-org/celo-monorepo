import { contactsToRecipients, sortRecipients } from 'src/recipients/recipient'
import {
  mockContactList,
  mockDisplayNumber,
  mockE164Number,
  mockRecipient,
  mockRecipient2,
  mockRecipient3,
} from 'test/values'

describe('contactsToRecipients', () => {
  it('returns a recipient per phone number', () => {
    const countryCode = '+1'
    const recipients = contactsToRecipients(mockContactList, countryCode)

    if (!recipients) {
      return expect(false).toBeTruthy()
    }

    const recipientsWithE164Numbers = Object.values(recipients.e164NumberToRecipients)

    expect(recipientsWithE164Numbers).toHaveLength(2)
    expect(recipientsWithE164Numbers[1]).toMatchObject({
      name: 'Alice The Person',
      displayNumber: '(209) 555-9790',
      e164PhoneNumber: '+12095559790',
      contactId: '1',
    })
    expect(recipientsWithE164Numbers[0]).toMatchObject({
      name: 'Bob Bobson',
      displayNumber: mockDisplayNumber,
      e164PhoneNumber: mockE164Number,
      contactId: '2',
    })
  })
})

describe('Recipient sorting', () => {
  const recipients = [mockRecipient2, mockRecipient, mockRecipient3]
  it('Sorts recipients without any prioritized', () => {
    expect(sortRecipients(recipients)).toStrictEqual([
      mockRecipient3,
      mockRecipient2,
      mockRecipient,
    ])
  })
  it('Sorts recipients with some prioritized', () => {
    const prioritized = { [mockRecipient.e164PhoneNumber!]: { contactId: 'contactId' } }
    expect(sortRecipients(recipients, prioritized)).toStrictEqual([
      mockRecipient,
      mockRecipient3,
      mockRecipient2,
    ])
  })
})
