import SmallButton from '@celo/react-components/components/SmallButton'
import TopAlert from '@celo/react-components/components/TopAlert'
import Error from '@celo/react-components/icons/Error'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

export enum NotificationTypes {
  MESSAGE = 'message',
  ERROR = 'error',
}

interface State {
  cachedTitle?: string | null
  cachedText: string | null
  visible: boolean
}

interface Props {
  title?: string | null
  text: string | null
  onPress: () => void
  type: NotificationTypes
  dismissAfter: number | null
  buttonMessage?: string | null
}

class SmartTopAlert extends React.Component<Props, State> {
  timeout: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      cachedTitle: props.title,
      cachedText: props.text,
      visible: !!props.text,
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.text && prevProps.text !== this.props.text) {
      this.setState({ cachedText: this.props.text, cachedTitle: this.props.title })
      if (this.timeout) {
        clearTimeout(this.timeout)
        this.timeout = null
      }
      if (this.props.dismissAfter) {
        this.timeout = window.setTimeout(prevProps.onPress, this.props.dismissAfter)
      }
    }
  }

  render() {
    const { text, type, onPress, buttonMessage } = this.props
    const { cachedText, cachedTitle } = this.state
    const height = buttonMessage ? 105 : 36
    const numberOfLines = buttonMessage ? 2 : 1
    const isError = type === NotificationTypes.ERROR
    const bgColor = isError ? colors.errorRed : colors.messageBlue

    return (
      <TouchableOpacity onPress={onPress}>
        <TopAlert
          height={height}
          backgroundColor={bgColor}
          visible={!!text}
          style={buttonMessage ? styles.container : null}
        >
          {isError && <Error style={styles.errorIcon} />}
          <Text
            style={[fontStyles.bodySmall, styles.text, isError && fontStyles.semiBold]}
            numberOfLines={numberOfLines}
          >
            {!!cachedTitle && (
              <Text style={[styles.text, fontStyles.semiBold]}> {cachedTitle} </Text>
            )}
            {cachedText}
          </Text>
          {this.props.buttonMessage && (
            <SmallButton
              onPress={onPress}
              text={this.props.buttonMessage}
              solid={false}
              style={styles.button}
              textStyle={styles.buttonText}
            />
          )}
        </TopAlert>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  text: {
    color: 'white',
    lineHeight: 20,
    textAlign: 'center',
  },
  errorIcon: {
    marginHorizontal: 5,
  },
  button: {
    marginTop: 8,
    borderColor: colors.white,
    alignSelf: 'center',
  },
  buttonText: {
    color: colors.white,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'column',
  },
})

export default SmartTopAlert
