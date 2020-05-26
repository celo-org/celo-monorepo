import * as React from 'react'
import { Text, View } from 'react-native'
import { brandStyles } from 'src/eventkit/common/constants'
import Page, { ROOT } from 'src/eventkit/common/Page'
import { H1, H4, Li, Ul } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import InlineAnchor from 'src/shared/InlineAnchor'
import menuItems, { hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

export default React.memo(
  withNamespaces(NameSpaces.events)(function Intro({ t }: I18nProps) {
    return (
      <>
        <Page
          title="Home"
          path={ROOT}
          metaDescription={t('flavor.introduction')}
          sections={[{ id: hashNav.eventsIntro.overview, children: <Overview /> }]}
        />
      </>
    )
  })
)

const Overview = withNamespaces(NameSpaces.events)(function _Overview({ t }: I18nProps) {
  return (
    <View style={brandStyles.gap}>
      <H1 style={standardStyles.elementalMarginBottom}>{t('flavor.title')}</H1>

      <Text style={fonts.p}>{t('flavor.introduction')}</Text>
      <Text style={fonts.p}>
        {t('flavor.introductionP2')}
        <Ul>
          <Trans ns={NameSpaces.brand} i18nKey={'flavor.introductionBullets'}>
            <Li>{}</Li>
            <Ul>
              <Li>{}</Li>
              <Li>{}</Li>
            </Ul>
            <Li>{}</Li>
            <Li>{}</Li>
            <Li>{}</Li>
          </Trans>
        </Ul>
      </Text>
    </View>
  )
})
