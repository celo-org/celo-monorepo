import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import Spinner from 'src/shared/Spinner'
import { colors } from 'src/styles'

class LeaderBoardLoading extends React.PureComponent<I18nProps> {
  render() {
    return (
      <View style={styles.leaderBoardLoading}>
        <Spinner size={'medium'} color={colors.white} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  leaderBoardLoading: {
    backgroundColor: colors.dark,
    alignItems: 'center',
  },
})

export default withNamespaces('dev')(LeaderBoardLoading)
