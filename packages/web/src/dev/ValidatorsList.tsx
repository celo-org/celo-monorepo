import { BigNumber } from 'bignumber.js'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import css from 'src/dev/ValidatorsList.scss'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'
import { formatNumber, cutAddress, copyToClipboad, weiToDecimal } from 'src/utils/utils'

interface ValidatorsListProps {
  data: any
  isLoading: boolean
}

export interface State {
  expanded: number | undefined
}

class ValidatorsListApp extends React.PureComponent<ValidatorsListProps & I18nProps, State> {
  state = {
    expanded: undefined,
  }

  expand(expanded: number) {
    if (this.state.expanded === expanded) {
      this.setState({ expanded: undefined })
    } else {
      this.setState({ expanded })
    }
  }

  cleanData({ celoValidatorGroups, latestBlock }: any) {
    const totalVotes: BigNumber = celoValidatorGroups
      .map(({ votes }) => new BigNumber(votes))
      .reduce((acc: BigNumber, _) => acc.plus(_), new BigNumber(0))

    return celoValidatorGroups
      .map(({ account, affiliates, votes }) => {
        const group = account
        const gName = group.name
        return {
          name: (gName || '').length <= 20 ? gName : `${gName.substr(0, 17)}...`,
          address: group.address,
          usd: weiToDecimal(group.usd),
          gold: weiToDecimal(group.lockedGold),
          votes: new BigNumber(votes)
            .dividedBy(totalVotes)
            .multipliedBy(100)
            .toString(),
          validators: affiliates.edges.map((validator) => {
            const {
              address,
              elected,
              online,
              account: { name, usd, lockedGold },
              score,
            } = validator.node
            return {
              name: (name || '').length <= 20 ? name : `${name.substr(0, 17)}...`,
              address,
              usd: weiToDecimal(usd),
              gold: weiToDecimal(lockedGold),
              elected: elected === latestBlock,
              online: online === latestBlock,
              uptime: (+score * 100) / 10 ** 24,
            }
          }),
        }
      })
      .map((group) => {
        const data = group.validators.reduce(
          ({ elected, online, uptime }, validator) => ({
            elected: elected + +validator.elected,
            online: online + +validator.online,
            uptime: uptime + validator.uptime,
          }),
          { elected: 0, online: 0, uptime: 0 }
        )
        data.uptime = data.uptime / group.validators.length
        return {
          ...group,
          ...data,
        }
      })
  }

  render() {
    const { expanded } = this.state
    const { data } = this.props
    const validatorGroups = data ? this.cleanData(data) : []
    return (
      <View style={styles.cover}>
        <View>
          <H1 style={[textStyles.center, standardStyles.sectionMarginTablet, textStyles.invert]}>
            Validator Explorer
          </H1>
          <table className={[css.table, css['main-table']].join(' ')}>
            <thead>
              <tr className={css.table__heading}>
                <th className={css['table__cell--title-padding']}>Name</th>
                <th className={css['table__cell--center']}>Elected</th>
                <th className={css['table__cell--center']}>Online</th>
                <th>Address</th>
                <th className={css['table__cell--center']}>Votes received</th>
                <th className={css['table__cell--center']}>CUSD</th>
                <th className={css['table__cell--center']}>CGLD</th>
                <th className={css['table__cell--center']}>Uptime</th>
              </tr>
            </thead>
            <tbody>
              {validatorGroups.map((group, i) => (
                <>
                  <tr key={i}>
                    <td
                      onClick={this.expand.bind(this, i)}
                      className={[css['table__cell--title'], css['table__cell--clickable']].join(
                        ' '
                      )}
                    >
                      <span className={css['table__cell--title-arrow']}>
                        <Chevron
                          direction={i === expanded ? Direction.down : Direction.right}
                          opacity={i === expanded ? 1 : 0.4}
                          color={colors.white}
                          size={10}
                        />
                      </span>
                      {group.name}
                    </td>
                    <td
                      className={[
                        css[`table__cell--${group.elected ? '' : 'error-'}hightlight`],
                        css['table__cell--center'],
                      ].join(' ')}
                    >
                      {group.elected}
                    </td>
                    <td
                      className={[
                        css[`table__cell--${group.online ? '' : 'error-'}hightlight`],
                        css['table__cell--center'],
                      ].join(' ')}
                    >
                      {group.online}
                    </td>
                    <td>
                      {cutAddress(group.address)}
                      <span className={css.copy} onClick={copyToClipboad.bind(this, group.address)}>
                        copy
                      </span>
                    </td>
                    <td className={css['table__cell--center']}>{formatNumber(group.votes, 2)}%</td>
                    <td className={css['table__cell--center']}>{formatNumber(group.usd, 2)}</td>
                    <td className={css['table__cell--center']}>{formatNumber(group.gold, 2)}</td>
                    <td className={css['table__cell--center']}>{formatNumber(group.uptime, 1)}%</td>
                  </tr>
                  {i === expanded && (
                    <tr>
                      <td colSpan={8}>
                        <div className={css['validator-list-expansion']}>
                          <div className={css['validator-list-expansion__description']}>
                            {group.description}
                          </div>
                          {group.validators && (
                            <table
                              className={[
                                css.table,
                                css['table--secondary'],
                                css['validator-list-expansion__table'],
                              ].join(' ')}
                            >
                              <thead>
                                <tr className={css.table__heading}>
                                  <th>Name</th>
                                  <th className={css['table__cell--center']}>Elected</th>
                                  <th className={css['table__cell--center']}>Online</th>
                                  <th>Address</th>
                                  <th className={css['table__cell--center']}>CUSD</th>
                                  <th className={css['table__cell--center']}>CGLD</th>
                                  <th className={css['table__cell--center']}>Uptime</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.validators.map((validator, j) => (
                                  <tr key={`${i}.${j}`}>
                                    <td className={css['table__cell--title']}>{validator.name}</td>
                                    <td className={css['table__cell--center']}>
                                      <span
                                        className={[
                                          css.circle,
                                          css[`circle--${validator.elected ? 'ok' : 'error'}`],
                                        ].join(' ')}
                                      />
                                    </td>
                                    <td className={css['table__cell--center']}>
                                      <span
                                        className={[
                                          css.circle,
                                          css[`circle--${validator.online ? 'ok' : 'error'}`],
                                        ].join(' ')}
                                      />
                                    </td>
                                    <td>
                                      {cutAddress(validator.address)}
                                      <span
                                        className={css.copy}
                                        onClick={copyToClipboad.bind(this, validator.address)}
                                      >
                                        copy
                                      </span>
                                    </td>
                                    <td className={css['table__cell--center']}>
                                      {formatNumber(validator.usd, 2)}
                                    </td>
                                    <td className={css['table__cell--center']}>
                                      {formatNumber(validator.gold, 2)}
                                    </td>
                                    <td className={css['table__cell--center']}>
                                      {formatNumber(validator.uptime, 1)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </View>
      </View>
    )
  }
}

export default withNamespaces('dev')(ValidatorsListApp)

const styles = StyleSheet.create({
  content: {
    paddingBottom: 10,
  },
  cover: {
    marginTop: HEADER_HEIGHT,
    backgroundColor: colors.dark,
    maxWidth: '100vw',
    overflow: 'hidden',
  },
})
