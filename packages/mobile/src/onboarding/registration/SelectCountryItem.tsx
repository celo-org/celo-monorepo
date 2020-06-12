import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { LocalizedCountry } from '@celo/utils/src/countries'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  country: LocalizedCountry
  isSelected: boolean
  onSelect: (country: LocalizedCountry) => void
  testID?: string
}

export default function SelectCountryItem({ country, isSelected, onSelect, testID }: Props) {
  function onPress() {
    onSelect(country)
  }

  return (
    <Touchable onPress={onPress} testID={testID}>
      <View style={styles.contentContainer}>
        <Text style={styles.flag} numberOfLines={1}>
          {country.emoji}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {country.countryCallingCode} {country.displayName}
        </Text>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.gray2,
  },
  name: {
    ...fontStyles.regular,
    flex: 1,
    marginRight: 16,
  },
  flag: {
    fontSize: 20,
    marginLeft: 4,
    marginRight: 16,
  },
  circle: {
    paddingTop: 2,
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inactive,
  },
})
