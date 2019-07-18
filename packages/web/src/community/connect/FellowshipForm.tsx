import { FellowAppShape } from 'fullstack/Fellowship'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import {
  ErrorMessage,
  Form,
  HolisticField,
  NameErrorArea,
  styles as formStyles,
  TextInput,
} from 'src/forms/FormComponents'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import FormContainer, { emailIsValid, hasField } from 'src/shared/Form'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
export class FellowshipForm extends React.Component<I18nProps & ScreenProps> {
  render() {
    const { t, screen } = this.props
    const isMobile = screen === ScreenSizes.TABLET || screen === ScreenSizes.MOBILE
    const inputStyle = [standardStyles.input, fonts.p, formStyles.input]
    const cellStyle = isMobile ? formStyles.zeroVertical : formStyles.verticalSpace
    return (
      <FormContainer route="/fellowship" blankForm={blankForm()} validateWith={validateFields}>
        {({ onAltSubmit, onInput, formState }) => (
          <Form style={styles.form}>
            <GridRow tabletStyle={styles.emailNameArea} mobileStyle={styles.emailNameArea}>
              {!isMobile && <NameErrorArea t={t} formState={formState} isMobile={isMobile} />}
              <Cell span={Spans.fourth} tabletSpan={Spans.full} style={cellStyle}>
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
              </Cell>
              {isMobile && <NameErrorArea t={t} formState={formState} isMobile={isMobile} />}
              <Cell span={Spans.fourth} tabletSpan={Spans.full} style={cellStyle}>
                <TextInput
                  focusStyle={standardStyles.inputFocused}
                  style={[inputStyle, formState.errors.includes('email') && formStyles.errorBorder]}
                  placeholder={t('form.email')}
                  placeholderTextColor={colors.placeholderGray}
                  name="email"
                  type="email"
                  value={formState.form.email}
                  onChange={onInput}
                  required={true}
                />
              </Cell>
              <Cell
                span={Spans.fourth}
                tabletSpan={Spans.three4th}
                style={[
                  formStyles.validationMessage,
                  formStyles.alignStart,
                  isMobile && formStyles.verticalSpace,
                ]}
              >
                <ErrorMessage allErrors={formState.errors} field={'email'} t={t} />
              </Cell>
            </GridRow>
            <GridRow tabletStyle={styles.rowMobile} mobileStyle={styles.rowMobile}>
              <HolisticField
                isMobile={isMobile}
                multiline={true}
                fieldName="ideas"
                onChange={onInput}
                errors={formState.errors}
                t={t}
                value={formState.form.ideas}
              />
            </GridRow>
            <GridRow tabletStyle={styles.rowMobile} mobileStyle={styles.rowMobile}>
              <HolisticField
                isMobile={isMobile}
                multiline={true}
                fieldName="bio"
                onChange={onInput}
                errors={formState.errors}
                t={t}
                value={formState.form.bio}
              />
            </GridRow>
            <GridRow tabletStyle={styles.rowMobile} mobileStyle={styles.rowMobile}>
              <HolisticField
                isMobile={isMobile}
                multiline={true}
                fieldName="deliverables"
                onChange={onInput}
                errors={formState.errors}
                t={t}
                value={formState.form.deliverables}
              />
            </GridRow>
            <GridRow tabletStyle={styles.rowMobile} mobileStyle={styles.rowMobile}>
              <HolisticField
                isMobile={isMobile}
                fieldName="resume"
                onChange={onInput}
                errors={formState.errors}
                t={t}
                value={formState.form.resume}
              />
            </GridRow>

            <GridRow
              desktopStyle={standardStyles.sectionMarginBottom}
              mobileStyle={standardStyles.sectionMarginBottomMobile}
              allStyle={[standardStyles.centered, standardStyles.elementalMarginTop]}
            >
              <Cell span={Spans.half} style={standardStyles.centered}>
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
              </Cell>
            </GridRow>
          </Form>
        )}
      </FormContainer>
    )
  }
}

function blankForm() {
  return { name: '', email: '', ideas: '', bio: '', resume: '', deliverables: '' }
}

function validateFields(fields: FellowAppShape) {
  return Object.keys(fields).filter((key) => {
    return key === 'email' ? !emailIsValid(fields[key]) : !hasField(fields[key])
  })
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
  },
  rowMobile: {
    flexDirection: 'column-reverse',
  },
  emailNameArea: {
    flexDirection: 'column',
  },
})

export default withNamespaces('community')(withScreenSize(FellowshipForm))
