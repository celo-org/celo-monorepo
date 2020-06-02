import ContactCircle from '@celo/react-components/components/ContactCircle'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MinimalContact } from 'react-native-contacts'

export interface Props {
  name: string
  iconSize: number
  defaultCountryCode: string
  contact?: MinimalContact
  address?: string
  e164Number?: string
  thumbnailPath?: string
}

export class Avatar extends React.PureComponent<Props> {
  render() {
    const {
      contact,
      thumbnailPath,
      address,
      e164Number,
      defaultCountryCode,
      iconSize,
      name,
    } = this.props

    return (
      <View style={style.container}>
        <ContactCircle
          contact={contact}
          thumbnailPath={thumbnailPath}
          name={name}
          address={address}
          size={iconSize}
        />
        <Text
          style={[fontStyles.bodySmallSemiBold, style.contactName]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
        {e164Number ? (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164Number || ''}
            defaultCountryCode={defaultCountryCode}
          />
        ) : null}

        {!e164Number && address ? (
          <Text
            style={[fontStyles.bodySmall, fontStyles.light, style.contactName]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {'#' + address}
          </Text>
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
  contactName: {
    paddingTop: 6,
    marginHorizontal: 20,
    textAlign: 'center',
  },
})

export default Avatar
