import { FellowAppShape } from 'fullstack/Fellowship'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import FormContainer, { emailIsValid, hasField } from 'src/forms/Form'
import { Form } from 'src/forms/FormComponents'
import { LabeledInput } from 'src/forms/LabeledInput'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import Spinner from 'src/shared/Spinner'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

export class FellowshipForm extends React.Component<I18nProps> {
  render() {
    const { t } = this.props
    return (
      <FormContainer route="/fellowship" blankForm={blankForm()} validateWith={validateFields}>
        {({ onAltSubmit, onInput, formState }) => (
          <Form style={styles.form}>
            <GridRow
              allStyle={gridStyle}
              tabletStyle={styles.emailNameArea}
              mobileStyle={styles.emailNameArea}
            >
              <Cell span={Spans.fourth} style={styles.paddingVertical} tabletSpan={Spans.full}>
                <LabeledInput
                  name="name"
                  label={t('form.name')}
                  value={formState.form.name}
                  onInput={onInput}
                  allErrors={formState.errors}
                />
              </Cell>
              <Cell span={Spans.fourth} style={styles.paddingVertical} tabletSpan={Spans.full}>
                <LabeledInput
                  label={t('form.email')}
                  name="email"
                  value={formState.form.email}
                  onInput={onInput}
                  allErrors={formState.errors}
                />
              </Cell>
            </GridRow>
            <GridRow allStyle={gridStyle}>
              <Cell span={Spans.half} tabletSpan={Spans.full} style={styles.paddingVertical}>
                <LabeledInput
                  multiline={true}
                  name="ideas"
                  label={t('form.ideas')}
                  onInput={onInput}
                  allErrors={formState.errors}
                  value={formState.form.ideas}
                />
                <LabeledInput
                  multiline={true}
                  label={t('form.bio')}
                  name="bio"
                  onInput={onInput}
                  allErrors={formState.errors}
                  value={formState.form.bio}
                />
                <LabeledInput
                  multiline={true}
                  label={t('form.deliverables')}
                  name="deliverables"
                  onInput={onInput}
                  allErrors={formState.errors}
                  value={formState.form.deliverables}
                />
                <LabeledInput
                  name="resume"
                  label={t('form.resume')}
                  onInput={onInput}
                  allErrors={formState.errors}
                  value={formState.form.resume}
                />
              </Cell>
            </GridRow>

            <GridRow
              desktopStyle={standardStyles.sectionMarginBottom}
              mobileStyle={standardStyles.sectionMarginBottomMobile}
              allStyle={[standardStyles.centered, standardStyles.elementalMarginTop]}
            >
              <Cell span={Spans.half} style={standardStyles.centered}>
                <Button
                  iconLeft={formState.isLoading && <Spinner size={'small'} color={colors.white} />}
                  text={!formState.isLoading && t('submit')}
                  kind={BTN.PRIMARY}
                  onPress={onAltSubmit}
                  size={SIZE.big}
                  disabled={formState.isLoading}
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
  paddingVertical: {
    paddingVertical: 0,
  },
})

const gridStyle = [standardStyles.centered, styles.paddingVertical]

export default withNamespaces('community')(FellowshipForm)
