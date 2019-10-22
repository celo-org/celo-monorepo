import CheckCircle from '@celo/react-components/icons/CheckCircle'
import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  word: string
  selected: boolean
  onSelectAnswer: (word: string, data: any) => void
  data?: any
  testID?: string
}

class SelectionOption extends React.Component<Props> {
  onPress = () => {
    this.props.onSelectAnswer(this.props.word, this.props.data)
  }

  render() {
    return (
      <TouchableOpacity onPress={this.onPress} testID={this.props.testID}>
        <View
          style={[
            styles.answerContainer,
            this.props.selected && { backgroundColor: colors.altDarkBg },
          ]}
        >
          <View style={styles.iconContainer}>
            {!this.props.selected && <View style={styles.circle} />}
            {this.props.selected && <CheckCircle />}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.answerText}>{this.props.word}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  answerContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
  },
  textContainer: {
    borderBottomWidth: 1,
    borderColor: colors.darkLightest,
    justifyContent: 'center',
    height: 60,
    width: variables.width - (12 * 2 + 24), // entire screen minus selection circle and padding around the circle
  },
  answerText: {
    fontSize: 16,
    color: colors.dark,
  },
  iconContainer: {
    marginHorizontal: 12,
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

export default SelectionOption
