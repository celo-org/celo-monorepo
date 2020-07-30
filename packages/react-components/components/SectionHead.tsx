import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  text: string
  bubbleText?: string | null
}

export default class SectionHead extends React.PureComponent<Props> {
  render() {
    return (
      <View style={style.sectionHead}>
        <Text style={fontStyles.sectionLabel}>{this.props.text}</Text>
        {this.props.bubbleText && (
          <Text style={[fontStyles.notification, style.bubble]}>{this.props.bubbleText}</Text>
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  sectionHead: {
    backgroundColor: colors.gray1,
    paddingHorizontal: 10,
    height: 36,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bubble: {
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.onboardingBlue,
    borderRadius: 10,
    padding: 1,
    margin: 5,
    height: 20,
    width: 20,
  },
})
