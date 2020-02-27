import * as React from 'react'
import { ImageSourcePropType, StyleSheet, Text, View, ViewStyle } from 'react-native'
import {
  clabs,
  clabsPreview,
  laboratoria,
  laboratoriaPreview,
  wwf,
  wwfPreview,
} from 'src/alliance/images/index'
import { H2, H3, H4 } from 'src/fonts/Fonts'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import Photo from 'src/shared/Photo'
import { fonts, standardStyles, textStyles } from 'src/styles'

export default function Affirmations() {
  const { t } = useTranslation(NameSpaces.alliance)
  return (
    <View>
      <GridRow
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
      >
        <Cell span={Spans.full}>
          <H3>{t('affirmations.smallTitle')}</H3>
          <H2>{t('affirmations.title')}</H2>
        </Cell>
      </GridRow>
      <Exemplar
        belief={<TransItalic i18nKey="affirmations.laboratoriaBelief" />}
        copy={t('affirmations.laboratoriaCopy')}
        image={laboratoria}
        preview={laboratoriaPreview}
        logo={<View />}
        contentStyle={styles.laborStyle}
      />
      <Exemplar
        belief={<TransItalic i18nKey="affirmations.wwfBelief" />}
        copy={t('affirmations.wwfCopy')}
        image={wwf}
        preview={wwfPreview}
        logo={<View />}
        button={{ text: t('affirmations.wwfButton'), href: '/TODO' }}
        contentStyle={styles.cLabStyle}
      />
      <Exemplar
        belief={<TransItalic i18nKey="affirmations.cLabsBelief" />}
        copy={t('affirmations.cLabsCopy')}
        image={clabs}
        preview={clabsPreview}
        button={{ text: t('affirmations.cLabsButton'), href: '/TODO' }}
        logo={<View />}
        contentStyle={styles.wwfStyle}
      />
    </View>
  )
}

interface Props {
  image: ImageSourcePropType
  preview: ImageSourcePropType
  logo: React.ReactNode
  belief: React.ReactNode
  copy: string
  contentStyle?: ViewStyle
  button?: {
    text: string
    href: string
  }
}

function Exemplar({ image, logo, belief, copy, button, preview, contentStyle }: Props) {
  const { isMobile } = useScreenSize()
  return (
    <GridRow allStyle={standardStyles.elementalMargin}>
      <Cell span={Spans.half}>
        <View style={contentStyle}>
          {logo}
          <H4 style={standardStyles.elementalMargin}>{belief}</H4>
          <Text style={fonts.p}>{copy}</Text>
          {button && (
            <Button
              style={standardStyles.blockMarginTopMobile}
              kind={BTN.NAKED}
              size={SIZE.normal}
              text={button.text}
              href={button.href}
            />
          )}
        </View>
      </Cell>
      <Cell span={Spans.half}>
        <View style={!isMobile && styles.photoContainer}>
          <Photo image={image} ratio={471 / 550} preview={preview} />
        </View>
      </Cell>
    </GridRow>
  )
}

function TransItalic({ i18nKey }: { i18nKey: string }) {
  return (
    <Trans ns={NameSpaces.alliance} i18nKey={i18nKey}>
      <Text style={textStyles.italic}>""</Text>
    </Trans>
  )
}

const styles = StyleSheet.create({
  photoContainer: { paddingHorizontal: 20 },
  laborStyle: { maxWidth: 440 },
  cLabStyle: { maxWidth: 475 },
  wwfStyle: { maxWidth: 400 },
})
