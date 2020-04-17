import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import ah from 'src/community/ah-logo.png'
import polychain from 'src/community/polychain-logo.png'
import { H2 } from 'src/fonts/Fonts'
import { ErrorDisplay, ErrorKeys } from 'src/forms/ErrorDisplay'
import FormContainer, { emailIsValid, hasField } from 'src/forms/Form'
import { Form } from 'src/forms/FormComponents'
import { LabeledInput } from 'src/forms/LabeledInput'
import SubmitButton from 'src/forms/SubmitButton'
import SuccessDisplay from 'src/forms/SuccessDisplay'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Rings from 'src/logos/RingsGlyph'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems, { hashNav } from 'src/shared/menu-items'
import Navigation from 'src/shared/navigation'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import {
  Application,
  ApplicationFields,
  ApplicationKeys,
  Recommendation,
  RecommendationFields,
  RecommendationKeys,
  Tables,
} from '../../fullstack/EcoFundFields'

interface State {
  table: Tables
}

class EcoFund extends React.PureComponent<I18nProps & ScreenProps, State> {
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
    const { t, screen } = this.props
    return (
      <GridRow
        nativeID={hashNav.connect.fund}
        desktopStyle={[standardStyles.sectionMarginTop]}
        tabletStyle={[standardStyles.sectionMarginTopTablet]}
        mobileStyle={[standardStyles.sectionMarginTopMobile]}
      >
        <Cell span={Spans.half} style={screen !== ScreenSizes.MOBILE && styles.insideEdge}>
          <H2>{t('ecoFund.title')}</H2>
          <Text style={[fonts.p, textStyles.italic]}>{t('ecoFund.poweredBy')}</Text>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('ecoFund.description')}</Text>
          <View style={[standardStyles.row, standardStyles.elementalMargin, standardStyles.wrap]}>
            <View style={styles.partners}>
              <Text style={[fonts.h6, styles.partnerText]}>{t('ecoFund.generalPartner')}</Text>
              <Image
                resizeMode="contain"
                accessibilityLabel="Polychain"
                source={{ uri: polychain }}
                style={styles.polyChain}
              />
            </View>
            <View style={styles.partners}>
              <Text style={[fonts.h6, styles.partnerText]}>{t('ecoFund.limitedPartners')}</Text>
              <View style={[standardStyles.row, styles.limitedPartners]}>
                <Rings color={colors.dark} height={40} />
                <Image
                  resizeMode="contain"
                  accessibilityLabel="a16z"
                  source={ah}
                  style={styles.a16z}
                />
              </View>
            </View>
          </View>
          <Button
            style={styles.button}
            text={t('ecoFund.link')}
            kind={BTN.NAKED}
            size={SIZE.normal}
            href={menuItems.BUILD.link}
          />
        </Cell>
        <Cell span={Spans.half}>
          <View
            style={[
              standardStyles.row,
              standardStyles.centered,
              screen === ScreenSizes.MOBILE
                ? standardStyles.blockMarginTop
                : standardStyles.elementalMarginBottom,
            ]}
          >
            <Navigation
              onPress={this.selectApplication}
              text={t('ecoFund.applyForFunding')}
              selected={this.state.table === Tables.Applicants}
            />
            <Navigation
              onPress={this.selectRecommendation}
              text={t('ecoFund.recommendProject')}
              selected={this.state.table === Tables.Recommendations}
            />
          </View>
          <View style={standardStyles.elementalMarginTop}>
            <View
              style={[
                styles.formContainer,
                this.state.table !== Tables.Applicants && styles.hidden,
              ]}
            >
              <FormContainer
                key={Tables.Applicants}
                route={`/ecosystem/${Tables.Applicants}`}
                // @ts-ignore
                blankForm={blankApplicationForm}
                validateWith={invalidApplicationFields}
              >
                {({ onSubmit, onInput, formState }) => (
                  <Form>
                    {ApplicationKeys.map((key) => (
                      <LabeledInput
                        key={key}
                        displayErrorAs={
                          key === 'founderEmail' || key === 'coFounderEmail'
                            ? ErrorKeys.email
                            : undefined
                        }
                        label={ApplicationFields[key]}
                        value={formState.form[key]}
                        name={key}
                        multiline={key === 'product'}
                        onInput={onInput}
                        allErrors={formState.errors}
                      />
                    ))}
                    <SubmitButton
                      isLoading={formState.isLoading}
                      text={t('apply')}
                      onPress={onSubmit}
                      size={SIZE.big}
                      style={standardStyles.elementalMarginBottom}
                      align={'flex-start'}
                    />
                    <SuccessDisplay
                      isShowing={formState.isComplete}
                      message={t('common:applicationSubmitted')}
                    />
                    <ErrorDisplay isShowing={!!formState.apiError} field={formState.apiError} />
                  </Form>
                )}
              </FormContainer>
            </View>
            <View
              style={[
                styles.formContainer,
                this.state.table !== Tables.Recommendations && styles.hidden,
                styles.shorterForm,
              ]}
            >
              <FormContainer
                key={Tables.Recommendations}
                route={`/ecosystem/${Tables.Recommendations}`}
                // @ts-ignore
                blankForm={blankRecForm}
                validateWith={invalidRecFields}
              >
                {({ onSubmit: onSubmit, onInput, formState }) => (
                  <Form>
                    {RecommendationKeys.map((key) => (
                      <LabeledInput
                        key={key}
                        displayErrorAs={key === 'founderEmail' ? ErrorKeys.email : undefined}
                        label={RecommendationFields[key]}
                        value={formState.form[key]}
                        name={key}
                        multiline={key === 'why'}
                        onInput={onInput}
                        allErrors={formState.errors}
                      />
                    ))}
                    <SubmitButton
                      isLoading={formState.isLoading}
                      text={t('recommend')}
                      onPress={onSubmit}
                      style={standardStyles.elementalMarginBottom}
                      size={SIZE.big}
                      align={'flex-start'}
                    />
                    <SuccessDisplay
                      isShowing={formState.isComplete}
                      message={t('recommendationSubmitted')}
                    />
                    <ErrorDisplay isShowing={!!formState.apiError} field={formState.apiError} />
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

const blankRecForm: Recommendation = {
  org: '',
  email: '',
  founderEmail: '',
  founderName: '',
  why: '',
}

function invalidRecFields(fields: Record<keyof Recommendation, string>) {
  return Object.keys(fields).filter((key: keyof Recommendation) => {
    return key === 'founderEmail' || key === 'email'
      ? !emailIsValid(fields[key])
      : !hasField(fields[key])
  })
}

const blankApplicationForm: Application = {
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

export default withScreenSize(withNamespaces(NameSpaces.community)(EcoFund))

const styles = StyleSheet.create({
  limitedPartners: {
    alignItems: 'center',
  },
  polyChain: {
    marginRight: 40,
    marginBottom: 3,
    width: 190,
    height: 35,
  },
  a16z: {
    width: 128,
    height: 35,
    marginHorizontal: 30,
  },
  hidden: {
    // @ts-ignore
    visibility: 'hidden',
  },
  shorterForm: {
    position: 'absolute',
  },
  button: {
    marginVertical: 15,
  },
  partners: {
    justifyContent: 'space-between',
  },
  partnerText: {
    marginTop: 20,
    marginBottom: 10,
  },
  insideEdge: {
    paddingRight: 30,
  },
  formContainer: {
    width: '100%',
  },
})
