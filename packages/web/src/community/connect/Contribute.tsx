import { StyleSheet, View } from 'react-native'
import CoverAction from 'src/dev/CoverAction'
import { H1, H3 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, withScreenSize } from 'src/layout/ScreenSize'
import menuItems from 'src/shared/menu-items'
import { colors, standardStyles, textStyles } from 'src/styles'

function Contribute({ t, isMobile }: I18nProps & ScreenProps) {
  return (
    <View style={styles.background}>
      <GridRow
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
      >
        <Cell span={Spans.full}>
          <H3 style={[textStyles.invert, standardStyles.elementalMarginBottom]}>
            {t('contribute.smallTitle')}
          </H3>
          <H1 style={textStyles.invert} ariaLevel="2">
            {t('contribute.title')}
          </H1>
        </Cell>
      </GridRow>
      <GridRow
        mobileStyle={standardStyles.sectionMarginBottomMobile}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        desktopStyle={standardStyles.sectionMarginBottom}
      >
        <Cell span={Spans.third}>
          <CoverAction
            containerStyle={styles.actionArea}
            title={t('contribute.codeTitle')}
            graphic={require('src/dev/features/evm.png')}
            isMobile={isMobile}
            text={t('contribute.codeText')}
            link={{ text: t('contribute.codeLink'), href: menuItems.BUILD.link }}
          />
        </Cell>
        <Cell span={Spans.third}>
          <CoverAction
            containerStyle={styles.actionArea}
            title={t('contribute.fundTitle')}
            graphic={require('src/community/EcosystemFund.png')}
            isMobile={isMobile}
            text={t('contribute.fundText')}
            link={{ text: t('contribute.fundLink'), href: menuItems.ECOSYSTEM.link }}
          />
        </Cell>
        <Cell span={Spans.third}>
          <CoverAction
            containerStyle={styles.actionArea}
            title={t('contribute.fellowTitle')}
            graphic={require('src/community/Fellowship.png')}
            isMobile={isMobile}
            text={t('contribute.fellowText')}
            link={{ text: t('contribute.fellowLink'), href: menuItems.FELLOWSHIP.link }}
          />
        </Cell>
      </GridRow>
    </View>
  )
}

export default withScreenSize(withNamespaces(NameSpaces.community)(Contribute))

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.dark,
  },
  actionArea: {
    marginTop: 20,
    width: '100%',
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 30,
    maxWidth: 270,
  },
})
