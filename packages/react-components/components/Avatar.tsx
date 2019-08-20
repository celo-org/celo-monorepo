import ContactCircle from '@celo/react-components/components/ContactCircle'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { getContactPhoneNumber } from '@celo/utils/src/contacts'
import { getE164Number } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MinimalContact } from 'react-native-contacts'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

interface Props {
  contact?: MinimalContact
  recipient?: Recipient
  name?: string
  address?: string
  e164Number?: string
  defaultCountryCode: string
  iconSize: number
}

export class Avatar extends React.PureComponent<Props> {
  render() {
    const { contact, recipient, address, defaultCountryCode, iconSize, name } = this.props
    let { e164Number } = this.props
    const userName = contact ? contact.displayName : name
    let nameOrAddress = userName ? userName : address
    if (!e164Number && contact) {
      const phoneNumber = getContactPhoneNumber(contact)
      if (phoneNumber) {
        const possibleE164Number = getE164Number(phoneNumber, defaultCountryCode)
        if (possibleE164Number) {
          e164Number = possibleE164Number
        }
      }
    }

    if (nameOrAddress && nameOrAddress.startsWith('0x')) {
      nameOrAddress = '#' + nameOrAddress.substring(2, 17) + '...'
    }

    return (
      <View style={style.container}>
        <ContactCircle
          style={style.contactCircle}
          contact={contact}
          thumbnailPath={recipient ? getRecipientThumbnail(recipient) : undefined}
          name={userName}
          address={address}
          size={iconSize}
        />
        <Text
          style={[fontStyles.bodySmallSemiBold, style.contactName]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {nameOrAddress}
        </Text>
        {e164Number ? (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164Number || ''}
            defaultCountryCode={defaultCountryCode}
          />
        ) : null}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: 10,
  },
  contactCircle: {
    alignSelf: 'center',
    margin: 'auto',
  },
  contactName: {
    paddingTop: 6,
    marginHorizontal: 20,
    textAlign: 'center',
  },
})

export default Avatar
