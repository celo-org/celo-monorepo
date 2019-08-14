import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import { ErrorMessage, Form, styles as formStyles, TextInput } from 'src/forms/FormComponents'
import { ah, polychain } from 'src/home/logos/logos'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Rings from 'src/logos/RingsLight'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import FormContainer, { emailIsValid, hasField } from 'src/shared/Form'
import Navigation from 'src/shared/navigation'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import {
  Application,
  ApplicationKeys,
  ApplicationFields,
  Recommendation,
  RecommendationKeys,
  RecommendationFields,
  Tables,
} from '../../fullstack/EcoFundFields'
import Fade from 'react-reveal/Fade'

interface State {
  table: Tables
}

class EcoFund extends React.PureComponent<I18nProps, State> {
  state = {
    table: Tables.Applicants,
  }

  selectApplication = () => {
    this.setState({ table: Tables.Applicants })
  }
  selectRecommendation = () => {
    this.setState({ table: Tables.Recommendations })
  }

  render() {
    const { t } = this.props
    const inputStyle = [
      standardStyles.input,
      fonts.p,
      formStyles.input,
      standardStyles.elementalMarginBottom,
    ]
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
          <View style={[standardStyles.row, standardStyles.centered]}>
            <Navigation
              onPress={this.selectApplication}
              text={t('applyForFunding')}
              selected={this.state.table === Tables.Applicants}
            />
            <Navigation
              onPress={this.selectRecommendation}
              text={t('recommendProject')}
              selected={this.state.table === Tables.Recommendations}
            />
          </View>
          <View>
            <View style={this.state.table !== Tables.Applicants && styles.hidden}>
              <FormContainer
                route={`/ecosystem/${Tables.Applicants}`}
                blankForm={blankApplicationForm}
                validateWith={invalidApplicationFields}
              >
                {({ onAltSubmit, onInput, formState }) => (
                  <Form>
                    {ApplicationKeys.map((key) => (
                      <TextInput
                        multiline={key === 'about' || key === 'product'}
                        numberOfLines={3}
                        key={`${Tables.Applicants}-${key}`}
                        style={[
                          inputStyle,
                          formState.errors.includes(key) && formStyles.errorBorder,
                        ]}
                        focusStyle={standardStyles.inputFocused}
                        placeholder={ApplicationFields[key]}
                        placeholderTextColor={colors.placeholderGray}
                        name={key}
                        value={formState.form[key]}
                        onChange={onInput}
                        required={true}
                      />
                    ))}
                    <Button
                      text={t('apply')}
                      kind={BTN.PRIMARY}
                      onPress={onAltSubmit}
                      size={SIZE.big}
                      align={'flex-start'}
                    />
                    {formState.isComplete && (
                      <Text style={[textStyles.center, fonts.p, standardStyles.elementalMarginTop]}>
                        {t('form.fellowshipSubmitted')}
                      </Text>
                    )}
                  </Form>
                )}
              </FormContainer>
            </View>
            <View style={this.state.table !== Tables.Recommendations && styles.hidden}>
              <FormContainer
                route={`/ecosystem/${Tables.Recommendations}`}
                blankForm={blankRecForm}
                validateWith={invalidRecFields}
              >
                {({ onAltSubmit, onInput, formState }) => (
                  <Form>
                    {RecommendationKeys.map((key) => (
                      <TextInput
                        multiline={key === 'why'}
                        numberOfLines={5}
                        key={`${Tables.Recommendations}-${key}`}
                        style={[
                          inputStyle,
                          formState.errors.includes(key) && formStyles.errorBorder,
                        ]}
                        focusStyle={standardStyles.inputFocused}
                        placeholder={RecommendationFields[key]}
                        placeholderTextColor={colors.placeholderGray}
                        name={key}
                        value={formState.form[key]}
                        onChange={onInput}
                        required={true}
                      />
                    ))}
                    <Button
                      text={t('recommend')}
                      kind={BTN.PRIMARY}
                      onPress={onAltSubmit}
                      size={SIZE.big}
                      align={'flex-start'}
                    />
                    {formState.isComplete && (
                      <Text style={[textStyles.center, fonts.p, standardStyles.elementalMarginTop]}>
                        {t('form.fellowshipSubmitted')}
                      </Text>
                    )}
                  </Form>
                )}
              </FormContainer>
            </View>
          </View>
        </Cell>
      </GridRow>
    )
  }
}

const blankRecForm = {
  org: '',
  email: '',
  founderEmail: '',
  founderName: '',
  why: '',
}

function invalidRecFields(fields: Recommendation) {
  return Object.keys(fields).filter((key) => {
    return key === 'founderEmail' || key === 'founderName'
      ? !emailIsValid(fields[key])
      : !hasField(fields[key])
  })
}

const blankApplicationForm = {
  org: '',
  url: '',
  product: '',
  about: '',
  founderEmail: '',
  coFounderEmail: '',
  video: '',
}

function invalidApplicationFields(fields: Record<keyof Application, string>) {
  return Object.keys(fields).filter((key) => {
    if (key === 'founderEmail') {
      return !emailIsValid(fields[key])
    } else if (key === 'coFounderEmail') {
      return fields.coFounderEmail.length > 0 ? !emailIsValid(fields[key]) : false
    } else if (key === 'video') {
      return false
    } else {
      return !hasField(fields[key])
    }
  })
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
  hidden: {
    height: 0,
    opacity: 0,
  },
})
