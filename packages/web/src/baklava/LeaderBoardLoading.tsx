import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { colors } from 'src/styles'
import Spinner from 'src/shared/Spinner'

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

export default withNamespaces(NameSpaces.baklava)(LeaderBoardLoading)
