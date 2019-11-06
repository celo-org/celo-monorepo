import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

interface LineItemProps {
  currencySymbol: string
  amount?: string
  title: string
  titleIcon?: React.ReactNode
  isLoading?: boolean
  hasError?: boolean
}

function LineItemRow({
  currencySymbol,
  amount,
  title,
  titleIcon,
  isLoading,
  hasError,
}: LineItemProps) {
  return (
    <View style={style.lineItemRow}>
      <View style={style.lineItemDescription}>
        <Text style={style.lineItemText}>{title}</Text>
        {titleIcon}
      </View>
      {!!amount && <Text style={style.lineItemText}>{amount}</Text>}
      {hasError && <Text style={style.lineItemText}>---</Text>}
      {isLoading && (
        <View style={style.loadingContainer}>
          <ActivityIndicator size="small" color={colors.celoGreen} />
        </View>
      )}
    </View>
  )
}

export default LineItemRow

const style = StyleSheet.create({
  lineItemDescription: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  lineItemText: {
    ...fontStyles.subSmall,
    color: colors.dark,
  },
  loadingContainer: {
    transform: [{ scale: 0.7 }],
  },
})
