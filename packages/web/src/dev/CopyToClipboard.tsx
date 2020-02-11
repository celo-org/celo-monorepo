import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from 'src/styles'
import { copyToClipboad } from 'src/utils/utils'
import CopyIcon from 'src/icons/CopyIcon'

interface Props {
  content: string
}

interface State {
  copied: boolean
  hover: boolean
}

class CopyToClipboard extends React.PureComponent<Props, State> {
  state = {
    copied: false,
    hover: false,
  }

  copy(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!this.state.copied) {
      copyToClipboad(this.props.content)
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    }
  }

  // Simulating css hover
  // hover(hover: boolean) {
  //   this.setState({hover})
  // }

  render() {
    const { copied, hover } = this.state
    const copy = this.copy.bind(this)
    return (
      <View
        style={[styles.container]}
        onClick={copy}
        /*onMouseOver={this.hover.bind(this, true)}*/
        /*onMouseEnter={this.hover.bind(this, true)}*/
        /*onMouseLeave={this.hover.bind(this, false)}*/
      >
        {copied ? (
          <Text style={[styles.copied]}>Copied</Text>
        ) : (
          <Text style={[styles.icon]}>
            <CopyIcon color={hover ? colors.white : colors.grayHeavy} size={16} />
          </Text>
        )}
      </View>
    )
  }
}

export default CopyToClipboard

const styles = StyleSheet.create({
  container: {
    display: 'inline-flex',
    paddingHorizontal: 8,
    height: 14,
  },
  icon: {
    display: 'inline-flex',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 14,
    height: 14,

    color: colors.grayHeavy,
    // ':hover': {
    //   color: colors.white,
    // },
  },
  copied: {
    fontSize: 14,
    lineHeight: 14,
    height: 14,
    color: colors.primary,
  },
})
