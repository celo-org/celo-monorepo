import * as React from 'react'
import { Text } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import InlineAnchor from 'src/shared/InlineAnchor'
import pagePaths from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

interface Props {
  textI18nKey: string
}

export default withNamespaces(NameSpaces.brand)(function CCLicense({
  textI18nKey,
  t,
}: Props & I18nProps) {
  return (
    <>
      <Text style={[fonts.h5, brandStyles.gap, standardStyles.blockMarginTop]}>
        {t('licenseTitle')}
      </Text>
      <Text style={[fonts.p, brandStyles.gap, standardStyles.elementalMargin]}>
        <Trans ns={NameSpaces.brand} i18nKey={textI18nKey}>
          <InlineAnchor href={pagePaths.CODE_OF_CONDUCT.link}>Code of Conduct</InlineAnchor>
        </Trans>
      </Text>
    </>
  )
})
