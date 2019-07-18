import * as React from 'react'
import { Image, StyleSheet } from 'react-native'

interface Props {
  href: string
  source: any
}

export default class SocialLogo extends React.PureComponent<Props> {
  render() {
    const { href, source } = this.props
    return (
      <a href={href}>
        <Image source={source} style={styles.size} />
      </a>
    )
  }
}

const styles = StyleSheet.create({
  size: {
    height: 60,
    width: 60,
  },
})
