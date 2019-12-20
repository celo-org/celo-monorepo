import * as React from 'react'
import { Text, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import Page, { ROOT } from 'src/brandkit/common/Page'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import InlineAnchor from 'src/shared/InlineAnchor'
import menuItems from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

export default React.memo(
  withNamespaces(NameSpaces.brand)(function Intro({ t }: I18nProps) {
    return (
      <>
        <Page
          title="Home"
          path={ROOT}
          metaDescription={t('home.introduction')}
          sections={[{ id: 'overview', children: <Overview /> }]}
        />
      </>
    )
  })
)

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <View style={brandStyles.gap}>
      <H1 style={standardStyles.elementalMarginBottom}>{t('home.title')}</H1>
      <H4 style={standardStyles.blockMarginBottom}>{t('home.introduction')}</H4>
      <Text style={[fonts.h5, standardStyles.elementalMarginBottom]}>{t('home.useageTitle')}</Text>
      <Text style={fonts.p}>
        <Trans ns={NameSpaces.brand} i18nKey="home.useageText">
          <InlineAnchor href={menuItems.CODE_OF_CONDUCT.link}>Code Of Conduct</InlineAnchor>
        </Trans>
      </Text>
    </View>
  )
})
