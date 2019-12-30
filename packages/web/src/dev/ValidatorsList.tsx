import * as React from 'react'
import { H1 } from 'src/fonts/Fonts'
import { StyleSheet, View, Clipboard } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'
import Chevron, { Direction } from 'src/icons/chevron'
import css from 'src/dev/ValidatorsList.scss'

const fakeAddress = () =>
  '0x' +
  Number(Math.floor(Math.random() * 9 ** 10 + 7 ** 10))
    .toString(16)
    .repeat(5)

const validatorGroupsMock = new Array(10).fill(0).map((_, i) => ({
  name: `Validator Group #${i}`,
  description:
    'Validator description lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commo.',
  elected: Math.floor(Math.random() * 15),
  online: Math.floor(Math.random() * 5),
  address: fakeAddress(),
  votes: Math.random() * 10,
  gold: Math.random() * 100,
  usd: Math.random() * 1300,
  uptime: 99.9,
  validators: new Array(3).fill(0).map((_, j) => ({
    name: `Validator ${i}.${j}`,
    elected: Math.random() > 0.2,
    online: Math.random() > 0.2,
    address: fakeAddress(),
    gold: Math.random() * 100,
    usd: Math.random() * 1300,
    uptime: 99.9,
  })),
}))

export interface State {
  expanded?: number
}

class ValidatorsListApp extends React.PureComponent<I18nProps, State> {
  state = {
    expanded: undefined,
  }

  cutAddress(address: string) {
    return address.toUpperCase().replace(/^0x([a-f0-9]{4}).+([a-f0-9]{4})$/i, '0x$1...$2')
  }

  formatNumber(n: number, decimals: number = Infinity) {
    return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  copyAddress(address: string) {
    Clipboard.setString(address)
  }

  expand(expanded: number) {
    if (this.state.expanded === expanded) {
      this.setState({ expanded: undefined })
    } else {
      this.setState({ expanded })
    }
  }

  render() {
    const { expanded } = this.state
    return (
      <View style={styles.cover}>
        <View style={styles.container}>
          <H1 style={[textStyles.center, standardStyles.sectionMarginTablet]}>Test</H1>
          <table className={css['table']}>
            <tr className={css['table__heading']}>
              <th className={css['table__cell--title-padding']}>Name</th>
              <th className={css['table__cell--center']}>Elected</th>
              <th className={css['table__cell--center']}>Online</th>
              <th>Address</th>
              <th className={css['table__cell--center']}>Votes received</th>
              <th className={css['table__cell--center']}>CUSD</th>
              <th className={css['table__cell--center']}>CGLD</th>
              <th className={css['table__cell--center']}>Uptime</th>
            </tr>
            {validatorGroupsMock.map((group, i) => (
              <>
                <tr key={i}>
                  <td
                    onClick={() => this.expand(i)}
                    className={[css['table__cell--title'], css['table__cell--clickable']].join(' ')}
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
                    {this.cutAddress(group.address)}
                    <span className={css.copy} onClick={() => this.copyAddress(group.address)}>
                      copy
                    </span>
                  </td>
                  <td className={css['table__cell--center']}>{group.votes.toFixed(2)}%</td>
                  <td className={css['table__cell--center']}>{this.formatNumber(group.usd, 2)}</td>
                  <td className={css['table__cell--center']}>{this.formatNumber(group.gold, 2)}</td>
                  <td className={css['table__cell--center']}>{group.uptime.toFixed(1)}%</td>
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
                              css['table'],
                              css['table--secondary'],
                              css['validator-list-expansion__table'],
                            ].join(' ')}
                          >
                            <tr className={css['table__heading']}>
                              <th>Name</th>
                              <th className={css['table__cell--center']}>Elected</th>
                              <th className={css['table__cell--center']}>Online</th>
                              <th>Address</th>
                              <th className={css['table__cell--center']}>CUSD</th>
                              <th className={css['table__cell--center']}>CGLD</th>
                              <th className={css['table__cell--center']}>Uptime</th>
                            </tr>
                            {group.validators.map((validator, j) => (
                              <tr key={`${i}.${j}`}>
                                <td className={css['table__cell--title']}>{validator.name}</td>
                                <td className={css['table__cell--center']}>
                                  <span
                                    className={[
                                      css['circle'],
                                      css[`circle--${validator.elected ? 'ok' : 'error'}`],
                                    ].join(' ')}
                                  />
                                </td>
                                <td className={css['table__cell--center']}>
                                  <span
                                    className={[
                                      css['circle'],
                                      css[`circle--${validator.online ? 'ok' : 'error'}`],
                                    ].join(' ')}
                                  />
                                </td>
                                <td>
                                  {this.cutAddress(validator.address)}
                                  <span
                                    className={css.copy}
                                    onClick={() => this.copyAddress(validator.address)}
                                  >
                                    copy
                                  </span>
                                </td>
                                <td className={css['table__cell--center']}>
                                  {this.formatNumber(validator.usd, 2)}
                                </td>
                                <td className={css['table__cell--center']}>
                                  {this.formatNumber(validator.gold, 2)}
                                </td>
                                <td className={css['table__cell--center']}>
                                  {validator.uptime.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </table>
        </View>
      </View>
    )
  }
}

export default withNamespaces('dev')(ValidatorsListApp)

const styles = StyleSheet.create({
  container: {
    // marginTop: HEADER_HEIGHT,
  },
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
