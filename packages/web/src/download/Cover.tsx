import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import AppLogo from 'src/download/AppLogo'
import PhoneIllo from 'src/download/PhoneIllo'
import RequestFunds from 'src/fauceting/RequestFunds'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { standardStyles, textStyles } from 'src/styles'
import { RequestType } from '../../server/FirebaseClient'

export default withScreenSize(
  withNamespaces(NameSpaces.download)(function DownloadCover({
    t,
    screen,
  }: I18nProps & ScreenProps) {
    const isMobile = screen === ScreenSizes.MOBILE
    return (
      <View style={styles.zIndex}>
        <GridRow
          desktopStyle={standardStyles.sectionMargin}
          tabletStyle={standardStyles.sectionMarginTablet}
          mobileStyle={standardStyles.blockMarginMobile}
        >
          <Cell
            span={Spans.three4th}
            tabletSpan={Spans.full}
            style={[styles.container, !isMobile ? standardStyles.row : styles.mobileContainer]}
          >
            <View style={[styles.flex1, styles.content, isMobile && standardStyles.centered]}>
              <AppLogo />
              <H1 style={[textStyles.invert, isMobile ? styles.titleMobile : styles.title]}>
                {t('coverTitle')}
              </H1>
              <H4
                style={[
                  textStyles.invert,
                  standardStyles.elementalMarginBottom,
                  isMobile && textStyles.center,
                ]}
              >
                {t('coverSubTitle')}
              </H4>
              <RequestFunds kind={RequestType.Invite} />
            </View>
            <View
              style={[
                standardStyles.centered,
                styles.flex1,
                isMobile ? styles.mobilePhone : styles.phone,
              ]}
            >
              <PhoneIllo />
            </View>
          </Cell>
        </GridRow>
      </View>
    )
  })
)

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  mobileContainer: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  title: {
    marginTop: 20,
  },
  titleMobile: { marginTop: 20, textAlign: 'center' },
  flex1: {
    flex: 1,
  },
  phone: {
    height: '50vh',
    maxWidth: '45vw',
  },
  content: {
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  mobilePhone: {
    height: '33vh',
    maxHeight: 300,
    marginBottom: 20,
    maxWidth: '60vw',
  },
  zIndex: {
    zIndex: 20,
  },
})
