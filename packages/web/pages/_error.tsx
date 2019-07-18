import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Rise from 'src/join/Rise'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  statusCode: number
}

export default class Error extends React.PureComponent<Props> {
  static getInitialProps({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : '404'
    return { statusCode, namespacesRequired: [] }
  }

  render() {
    return (
      <View>
        <Rise willFall={true} />
        <View style={styles.container}>
          <View style={[styles.error, styles.background]}>
            <Text style={[fonts.h1, styles.superLarge, textStyles.center, styles.background]}>
              {this.props.statusCode}
            </Text>
            <Text style={[fonts.h4, textStyles.center, standardStyles.blockMarginBottomTablet]}>
              We can't find the page you are looking for
            </Text>
            <Button text={'Go Home'} kind={BTN.PRIMARY} href="/" align={'center'} size={SIZE.big} />
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    maxWidth: '100vw',
    maxHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  background: {
    backgroundColor: colors.white,
    borderRadius: 50,
    boxShadow: `0 0 5px 10px ${colors.white}`,
  },
  superLarge: {
    fontSize: 120,
    lineHeight: 120,
  },
  error: {
    alignSelf: 'center',
    justifyContent: 'center',
  },
})
