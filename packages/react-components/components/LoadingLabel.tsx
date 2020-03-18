import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, TextStyle, View } from 'react-native'

interface Props {
  isLoading: boolean
  loadingLabelText: string
  labelText?: string
  labelTextStyle?: TextStyle
  valueText?: string | React.ReactNode
  valueTextStyle?: TextStyle
}

// A label/value row that shows a small spinner when value is not yet available
export default class LoadingLabel extends React.PureComponent<Props> {
  render() {
    const {
      isLoading,
      loadingLabelText,
      labelText,
      valueText,
      labelTextStyle,
      valueTextStyle,
    } = this.props
    return (
      <View style={style.container}>
        {isLoading && (
          <>
            <Text style={[fontStyles.bodySmall, labelTextStyle]}>{loadingLabelText}</Text>
            <ActivityIndicator style={style.loadingIcon} size="small" color={colors.celoGreen} />
          </>
        )}
        {!isLoading && labelText && (
          <>
            <Text style={[fontStyles.bodySmall, labelTextStyle]}>{labelText}</Text>
            {valueText && <Text style={[fontStyles.bodySmall, valueTextStyle]}>{valueText}</Text>}
          </>
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginHorizontal: 5,
    transform: [
      {
        scale: 0.7,
      },
      {
        translateY: -3,
      },
    ],
  },
})
