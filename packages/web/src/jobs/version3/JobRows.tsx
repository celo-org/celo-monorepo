import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import { LeverJob } from 'src/jobs/lever'
import { ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { fonts, standardStyles } from 'src/styles'

class JobRowBase extends React.PureComponent<LeverJob & ScreenProps & I18nProps> {
  render() {
    const { text, categories, screen, t } = this.props
    const isTablet = screen === ScreenSizes.TABLET
    return (
      <View style={[styles.container, standardStyles.elementalMarginBottom]}>
        <View style={[styles.cell, styles.title, isTablet && styles.tabletTitle]}>
          <View style={styles.innerTitle}>
            <Text
              accessibilityRole="link"
              target="blank"
              href={this.props.hostedUrl}
              style={fonts.h6}
            >
              {text}
            </Text>
          </View>
        </View>
        <View style={[styles.cell, styles.commitment]}>
          <Text style={fonts.legal}>{categories.commitment}</Text>
        </View>
        <View style={[styles.cell, styles.location, isTablet && styles.tabletLocation]}>
          <Text style={fonts.legal}>{t(categories.location)}</Text>
        </View>
        <View style={[styles.cell, styles.apply]}>
          <Button text={'Apply'} kind={BTN.NAKED} href={this.props.hostedUrl} size={SIZE.normal} />
        </View>
      </View>
    )
  }
}
export const JobRow = withNamespaces('jobs')(JobRowBase)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    margin: 10,
  },
  title: {
    flex: 4,
    marginLeft: 0,
  },
  tabletTitle: {
    flex: 2,
  },
  innerTitle: {
    maxWidth: 240,
  },
  commitment: {
    flex: 1,
  },
  location: {
    flex: 3,
  },
  tabletLocation: {
    flex: 2,
  },
  apply: {
    flex: 1,
    marginRight: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
})

// tslint:disable-next-line:max-classes-per-file
class MobileJobRowBase extends React.PureComponent<LeverJob & I18nProps> {
  render() {
    const { text, categories, hostedUrl, t } = this.props

    return (
      <View style={standardStyles.elementalMargin}>
        <Button kind={BTN.DARKNAKED} text={text} href={hostedUrl} size={SIZE.normal} />
        <View style={mobileStyles.row}>
          <View style={mobileStyles.commitment}>
            <Text style={fonts.legal}>{categories.commitment}</Text>
          </View>
          <View style={mobileStyles.location}>
            <Text style={fonts.legal}>{t(categories.location)}</Text>
          </View>
        </View>
      </View>
    )
  }
}
export const MobileJobRow = withNamespaces('jobs')(MobileJobRowBase)
const mobileStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: 10,
  },
  commitment: {
    flex: 1,
  },
  location: {
    flex: 3,
  },
})
