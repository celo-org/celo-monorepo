import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, fontSizes } from 'src/utils/styles'

interface BottomButtonProps {
  buttonMessage: string
  onPress: () => void
}

export default class BottomButton extends React.Component<BottomButtonProps> {
  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <View style={styles.submitButtonContainer}>
          <Text style={styles.submitButtonText}> {this.props.buttonMessage} </Text>
        </View>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  submitButtonContainer: {
    backgroundColor: colors.GREEN,
    height: 64,
    alignContent: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: fontSizes.bodyTextSize,
    color: 'white',
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'center',
  },
})
