import { fontStyles } from '@celo/react-components/styles/fonts'
import { getCountryEmoji, parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  e164PhoneNumber: string
  defaultCountryCode: string
}

export class PhoneNumberWithFlag extends React.PureComponent<Props> {
  render() {
    const parsedNumber = parsePhoneNumber(this.props.e164PhoneNumber, this.props.defaultCountryCode)
    return (
      <View style={style.container}>
        <Text style={[fontStyles.telephoneHeadline, style.countryCodeContainer]}>
          {parsedNumber
            ? getCountryEmoji(
                this.props.e164PhoneNumber,
                parsedNumber.countryCode,
                parsedNumber.regionCode
              )
            : getCountryEmoji(this.props.e164PhoneNumber)}
        </Text>
        <Text style={fontStyles.telephoneHeadline}>
          {(parsedNumber && parsedNumber.displayNumber) || ''}
        </Text>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: '#EEEEEE',
    paddingLeft: 6,
    paddingRight: 3,
    marginRight: 5,
  },
})

export default PhoneNumberWithFlag
