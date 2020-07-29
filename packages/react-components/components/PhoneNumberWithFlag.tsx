import colorsV2 from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { getCountryEmoji, parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  e164PhoneNumber: string
  defaultCountryCode?: string
}

export class PhoneNumberWithFlag extends React.PureComponent<Props> {
  render() {
    const parsedNumber = parsePhoneNumber(this.props.e164PhoneNumber, this.props.defaultCountryCode)
    return (
      <View style={style.container}>
        <Text style={[fontStyles.small, style.countryCodeContainer]}>
          {parsedNumber
            ? getCountryEmoji(
                this.props.e164PhoneNumber,
                parsedNumber.countryCode,
                parsedNumber.regionCode
              )
            : getCountryEmoji(this.props.e164PhoneNumber)}
        </Text>
        <Text style={[fontStyles.small, style.phoneNumber]}>
          {parsedNumber ? `+${parsedNumber.countryCode} ${parsedNumber.displayNumber}` : ''}
        </Text>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  countryCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  phoneNumber: {
    color: colorsV2.gray4,
  },
})

export default PhoneNumberWithFlag
