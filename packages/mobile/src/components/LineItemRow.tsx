import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native'

interface LineItemProps {
  style?: ViewStyle
  textStyle?: TextStyle
  amount?: string | React.ReactNode
  title: string | React.ReactNode
  titleIcon?: React.ReactNode
  isLoading?: boolean
  hasError?: boolean
}

export default function LineItemRow({
  style,
  textStyle: textStyleProp,
  amount,
  title,
  titleIcon,
  isLoading,
  hasError,
}: LineItemProps) {
  const textStyle = [styles.text, textStyleProp]

  return (
    <View style={[styles.container, style]}>
      <View style={styles.description}>
        <Text style={textStyle}>{title}</Text>
        {titleIcon}
      </View>
      {!!amount && <Text style={textStyle}>{amount}</Text>}
      {hasError && <Text style={textStyle}>---</Text>}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.celoGreen} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  text: {
    ...fontStyles.body,
    fontSize: 15,
    color: colors.dark,
  },
  loadingContainer: {
    transform: [{ scale: 0.7 }],
  },
})
