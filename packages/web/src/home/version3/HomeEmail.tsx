import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import EmailForm from 'src/forms/EmailForm'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles } from 'src/styles'

type Props = I18nProps

function After({ t }) {
  return <Text style={fonts.h5}>{t('stayConnectedThanks')}</Text>
}

export const PARTNERSHIP_ID = 'partnerships'

class HomeEmail extends React.PureComponent<Props> {
  render() {
    const { t } = this.props

    return (
      <GridRow
        allStyle={[standardStyles.centered, styles.gridRow]}
        mobileStyle={[styles.mobile, standardStyles.sectionMarginMobile]}
        tabletStyle={[styles.tablet, standardStyles.sectionMarginTablet]}
        desktopStyle={[styles.desktop, standardStyles.sectionMargin]}
      >
        <Cell tabletSpan={Spans.full} span={Spans.half} style={styles.cell}>
          <Text id={PARTNERSHIP_ID} style={[fonts.h3, standardStyles.elementalMargin]}>
            {t('startConversation')}
          </Text>
          <Text style={fonts.p}>{t('reachOut')}</Text>
          <EmailForm
            submitText={t('submit')}
            route={'/partnerships-email'}
            whenComplete={<After t={this.props.t} />}
            isDarkMode={false}
          />
        </Cell>
        <Responsive large={styles.largeBorder}>
          <View style={styles.border} />
        </Responsive>
        <Cell tabletSpan={Spans.full} span={Spans.half} style={styles.cell}>
          <Text style={[fonts.h3, standardStyles.elementalMargin]}>{t('stayConnected')}</Text>
          <Text style={fonts.p}>{t('receiveUpdates')}</Text>
          <EmailForm
            submitText={t('signUp')}
            route={'/contacts'}
            whenComplete={<After t={this.props.t} />}
            isDarkMode={false}
          />
        </Cell>
      </GridRow>
    )
  }
}

export default withNamespaces('home')(HomeEmail)

const styles = StyleSheet.create({
  mobile: {
    flexDirection: 'column',
  },
  tablet: {
    flexDirection: 'column',
  },
  desktop: {
    flexDirection: 'row',
    marginHorizontal: 60,
  },
  border: {
    width: 340,
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 40,
  },
  largeBorder: {
    height: 150,
    width: 1,
    backgroundColor: colors.gray,
    marginHorizontal: 10,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 20,
    maxWidth: 600,
    flexGrow: 1,
    flexShrink: 1,
  },
  gridRow: {
    paddingHorizontal: 20,
  },
})
