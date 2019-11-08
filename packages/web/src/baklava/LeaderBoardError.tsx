import * as React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { colors } from 'src/styles'
import { H3 } from 'src/fonts/Fonts'

interface Props {
  error: any
}

class LeaderBoardError extends React.PureComponent<Props & I18nProps> {
  render() {
    const { t, error } = this.props
    return (
      <View style={styles.leaderBoardError}>
        <H3 style={styles.leaderBoardErrorTitle}>{t('leaderboardError')}</H3>
        <Text style={styles.leaderBoardErrorMessage}>{JSON.stringify(error.message, null, 2)}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  leaderBoardError: {
    backgroundColor: colors.dark,
    alignItems: 'center',
  },
  leaderBoardErrorTitle: {
    color: colors.red,
    marginBottom: '2em',
  },
  leaderBoardErrorMessage: {
    fontFamily: 'monospace',
    color: colors.red,
  },
})

export default withNamespaces(NameSpaces.baklava)(LeaderBoardError)
