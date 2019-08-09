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
import { EcoFundFields, EcoFundKeys } from 'fullstack/EcoFundFields'

const EcoFund = React.memo(function EcoFundComponent({ t }: I18nProps) {
  const inputStyle = [standardStyles.input, fonts.p, formStyles.input]
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
      <Cell span={Spans.half}>
        <FormContainer route="/ecosystem" blankForm={blankForm()} validateWith={validateFields}>
          {({ onAltSubmit, onInput, formState }) => (
            <Form>
              <TextInput
                style={[inputStyle, formState.errors.includes('name') && formStyles.errorBorder]}
                focusStyle={standardStyles.inputFocused}
                placeholder={t('form.name')}
                placeholderTextColor={colors.placeholderGray}
                name="name"
                value={formState.form.name}
                onChange={onInput}
                required={true}
              />
              <Button
                text={t('submit')}
                kind={BTN.PRIMARY}
                onPress={onAltSubmit}
                size={SIZE.big}
                align={'center'}
              />
              {formState.isComplete && (
                <Text style={[textStyles.center, fonts.p, standardStyles.elementalMarginTop]}>
                  {t('form.fellowshipSubmitted')}
                </Text>
              )}
            </Form>
          )}
        </FormContainer>
      </Cell>
    </GridRow>
  )
})

function blankForm(): EcoFundKeys {
  return { name: '' }
}

function validateFields(fields: EcoFundKeys) {
  return []
}

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
