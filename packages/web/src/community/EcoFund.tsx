import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ah, polychain } from 'src/home/logos/logos'
import {
  ErrorMessage,
  Form,
  HolisticField,
  NameErrorArea,
  styles as formStyles,
  TextInput,
} from 'src/forms/FormComponents'
import { I18nProps, withNamespaces, NameSpaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import FormContainer, { emailIsValid, hasField } from 'src/shared/Form'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { H2 } from 'src/fonts/Fonts'
import { Image } from 'react-native'
import Rings from 'src/logos/RingsLight'

const EcoFund = React.memo(function EcoFundComponent({ t }: I18nProps) {
  return (
    <GridRow
      desktopStyle={[standardStyles.sectionMarginTop, standardStyles.blockMarginBottom]}
      tabletStyle={[standardStyles.sectionMarginTablet, standardStyles.blockMarginBottomTablet]}
      mobileStyle={[standardStyles.sectionMarginMobile, standardStyles.blockMarginBottomMobile]}
    >
      <Cell span={Spans.half}>
        <View style={[standardStyles.row, standardStyles.elementalMarginBottom, styles.partners]}>
          <Image
            resizeMode="contain"
            accessibilityLabel="Polychain"
            source={{ uri: polychain }}
            style={styles.polyChain}
          />
          <Rings color={colors.screenGray} height={25} />
          <Image resizeMode="contain" accessibilityLabel="a16z" source={ah} style={styles.a16z} />
        </View>
        <H2>{t('ecoFund.title')}</H2>
        <Text style={[fonts.p]}>{t('ecoFund.poweredBy')}</Text>
        <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('ecoFund.description')}</Text>
        <Button text={t('ecoFund.Link')} kind={BTN.NAKED} size={SIZE.normal} />
      </Cell>
      <Cell span={Spans.half}>{}</Cell>
    </GridRow>
  )
})

export default withNamespaces(NameSpaces.community)(EcoFund)

const styles = StyleSheet.create({
  partners: {
    alignItems: 'center',
  },
  polyChain: {
    marginRight: 20,
    width: 155,
    height: 35,
  },
  a16z: {
    width: 55,
    height: 25,
    marginHorizontal: 20,
  },
})
