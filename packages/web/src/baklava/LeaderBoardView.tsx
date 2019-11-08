import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, standardStyles } from 'src/styles'

interface State {
  page: number
}

interface Props {
  data: any
}

const COLORS = [colors.gold, colors.primary, colors.red, colors.purple, colors.lightBlue]

class LeaderBoardView extends React.Component<Props & I18nProps, State> {
  state = {
    page: 0,
  }

  public expand = () => {
    const { page } = this.state
    this.setState({ page: page + 1 })
  }

  public render() {
    const { t, data } = this.props
    const { page } = this.state

    // TODO: move to graphql
    const accountsFiltered = data.addresses.slice(0, COLORS.length * (page + 1))

    const maxBalance = Math.max(
      ...accountsFiltered.map((account: any) => account.fetched_coin_balance)
    )

    return (
      <View style={styles.leaderBoard}>
        {accountsFiltered.map((account: any, index: number) => {
          const relBalance = account.fetched_coin_balance / maxBalance
          const rowColor = COLORS[index % COLORS.length]
          return (
            <View key={account.hash} style={styles.leaderBoardRow}>
              <Text style={{ color: rowColor }}>{account.hash.substr(2)}</Text>
              <View style={[styles.leaderBoardAxis, styles.animations, styles.appear]}>
                <View
                  style={{
                    borderBottomColor: rowColor,
                    borderBottomWidth: 2,
                    width: `${relBalance * 100 - 10}%`,
                  }}
                />
                <OvalCoin size={14} color={rowColor} />
              </View>
            </View>
          )
        })}
        <View style={[styles.leaderBoardAxis, styles.leaderBoardRow]}>
          <Text style={[styles.leaderBoardAxisFirstItem, styles.leaderBoardAxisItem]}>0 cGLD</Text>
          <Text style={styles.leaderBoardAxisItem}>{(maxBalance / 1e18).toFixed(2)} cGLD</Text>
        </View>
        <View style={[styles.buttonExpand, standardStyles.elementalMarginTop]}>
          <Button
            text={t('expandLeaderBoard')}
            kind={BTN.NAKED}
            size={SIZE.normal}
            onPress={this.expand}
          />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  animations: {
    animationDuration: '3s',
    animationIterationCount: '1',
    animationTimingFunction: 'linear',
    animationFillMode: 'both',
  },
  appear: {
    animationKeyframes: [
      {
        '0%': {
          transform: 'scaleX(0)',
          transformOrigin: '0% 0%',
          opacity: 0.2,
        },
        '100%': {
          transform: 'scaleX(1)',
          transformOrigin: '0% 0%',
          opacity: 1,
        },
      },
    ],
  },
  leaderBoard: {
    paddingLeft: '5em',
    paddingRight: '5em',
    paddingBottom: '3em',
    backgroundColor: colors.dark,
  },
  leaderBoardRow: {
    marginTop: '2em',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '70vw',
    maxWidth: '1000px',
  },
  leaderBoardAxis: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderBoardAxisFirstItem: {
    flex: 1,
  },
  leaderBoardAxisItem: {
    color: 'white',
  },
  buttonExpand: {
    alignItems: 'center',
  },
})

export default withNamespaces(NameSpaces.baklava)(LeaderBoardView)
