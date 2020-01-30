import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Link from 'src/shared/InlineAnchor'
import menuItems, { CeloLinks } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'

class Agreement extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.terms, NameSpaces.common] }
  }
  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph
          title={t('agreementTitle')}
          path={NameSpaces.terms}
          description={t('metaDescription')}
        />
        <View style={styles.container}>
          <GridRow
            allStyle={standardStyles.centered}
            desktopStyle={standardStyles.blockMarginBottom}
            tabletStyle={standardStyles.blockMarginBottomTablet}
            mobileStyle={standardStyles.blockMarginBottomMobile}
          >
            <Cell span={Spans.fourth}>{}</Cell>
            <Cell span={Spans.three4th} style={standardStyles.centered}>
              <H1 style={textStyles.center}>{t('agreementTitle')}</H1>
            </Cell>
          </GridRow>
          <GridRow>
            <Cell span={Spans.fourth}>
              <Text style={fonts.h6}>Valid as of July 17, 2019</Text>
            </Cell>
            <Cell span={Spans.three4th}>
              <Text style={fonts.p}>
                {`This User Agreement and Test Terms (“Agreement”) constitute a contract between you and A Protocol Inc. (“Company” or “Celo” and including all affiliates) and applies to your use of the Celo Products, including the Celo Wallet, and other features, technologies and functionalities offered by the Company to you through a website, app, or through other means (the “Celo Services.”) as part of a limited test. The Celo Services are provided to you subject to this Agreement as well as the Celo Privacy Policy available at `}{' '}
                <Link href={menuItems.PRIVACY.link}>celo.org/privacy</Link>,
                {`incorporated by this Agreement by this reference.

This Agreement covers use of the Celo ‘Alfajores’ Network, a test network (‘Celo Test’) running a version of the Celo Protocol. Any balance amounts on this network are not redeemable for real value.
						
The Celo Products and Services are provided to you for a limited time as part of a test. (“Celo Test”). The Company is launching this test to better understand how participants may engage with new technologies to send payments, interact with other participants in the Celo ecosystem, and engage with opportunities to participate in the ecosystem. You should know that your participation in this test is entirely voluntary, but if you are participating in the Celo Test, you must strictly adhere to the terms and conditions of this Agreement.
						
The Company reserves the right to block any and all access you may have to the Products and Services.
						
You understand that you are participating in a test, and that the Celo Services provided to you as part of the Celo Test neither constitute references nor representations of currencies, fiat currencies, cryptocurrencies, or other units of value.	
						
1. Eligibility: The Celo Test is open only to those who have been invited by the Company to participate, sign up at `}{' '}
                <Link href={CeloLinks.playStoreWallet}>{CeloLinks.playStoreWallet}</Link>
                {`, and who are at least 18 years of age at the time of enrollment. The Celo Test is only open to residents of Argentina who have been so qualified, and is void where prohibited by law.
						
2. Test Terms: By participating in the Celo Test, you agree to be fully unconditionally bound by this Agreement, and you represent and warrant that you meet all eligibility requirements. In addition, you agree to accept the decisions of the Company as final and binding as it relates to the terms and conditions of the Celo Test. You understand and agree that use of the Celo Products and Services is for purposes of a test only, and you will neither be sending nor receiving money in any form.
									
3. Participation: Participation that is either incomplete or does not adhere to the rules or specifications of this Agreement may be disqualified at the sole discretion of the Company. You will not use fraudulent methods or otherwise attempt to circumvent the provisions of this Agreement. You agree to abide by all laws applicable to your use of the Celo Products and Services. By your participation, you agree to allow the Company to use your data (including, but not limited to, your interactions with the Celo Products and Services, transactions, and messages) to improve its products and services. Further, you agree that the Company may share anonymized data with third parties.
						
4. Terms & Conditions: the Company reserves the right, in its sole discretion, to cancel, terminate, modify or suspend the Celo Test should virus, bug, non-authorized human intervention, fraud, or other cause beyond the Company’s control corrupt or affect the administration, security, fairness, or proper conduct of the Celo Test. The Company reserves the right, in its sole discretion, to disqualify any individual who tampers or attempts to tamper with the entry process or the operation of the Celo Test or related Celo Products and Services or website, or violates these Terms & Conditions, including violating any law or guidelines.
						
The Company has the right, in its sole discretion, to maintain the integrity of the Celo Test, to void transactions or actions for any reason, including, but not limited to fraud, attempted manipulation, harassment or other inappropriate conduct, as determined by the Company. Any attempt by you to deliberately damage any website or undermine the legitimate operation of the Celo Test may be a violation of law. Should such attempt be made, the Company reserves the right to seek damages to the fullest extent permitted by law.
						
The Company reserves the right in its sole and absolute discretion to terminate the Celo Test at any time and without prior notice. Further, the Company reserves the right in its sole and absolute discretion to alter any terms and conditions related to the Celo Test at any time without prior notice.
						
5. Limitation of Liability: By entering, You agree to release and hold harmless the Company and its subsidiaries, affiliates, advertising and promotion agencies, partners, representatives, agents, successors, assigns, employees, officers, and directors from any liability, illness, injury, death, loss, litigation, claim, or damage that may occur, directly or indirectly, whether caused by negligence or not, from: (i) your participation in the Celo Test and/or your acceptance, possession, use, or misuse of any Celo Products or Services; (ii) technical failures of any kind, including but not limited to the malfunction of any computer, smart phone, cable, network, hardware, or software, or other mechanical equipment; (iii) the unavailability or inaccessibility of any transmissions, telephone, or Internet service; (iv) unauthorized human intervention in any part of the entry process or the Celo Test; (v) electronic or human error in the administration of the Celo Test or with the Celo Products or Services.
						
6. Disputes: The Parties acknowledge that this is a limited test with limited liability and responsibility on behalf of the Company. The Company is interested in hearing about your experience with the Celo Test, with the Celo Products and Services, and wishes to resolve any potential dispute amicably. As a condition of participating in the Celo Test, participant agrees that any and all disputes that cannot be resolved between the parties, and causes of action arising out of or connected with this Celo Test, shall be resolved individually, without resort to any form of class action, exclusively before a court located in Buenos Aires having jurisdiction. Further, in any such dispute, under no circumstances shall participant be permitted to obtain awards for, and hereby waives all rights to, punitive, incidental, or consequential damages, including reasonable attorney’s fees, other than participant’s actual out-of-pocket expenses (i.e. costs associated with entering this Celo Test). You further waive all rights to have damages multiplied or increased.
					
7. Privacy Policy: Information submitted by you as part of the Celo Test is subject to the Privacy Policy. To read the Privacy Policy, click`}{' '}
                <Link href="/privacy">here.</Link>
                {`
                
8. SMS Considerations and Agreement: By participating in the Celo Test, you agree to receive text messages from the Company and other participants in the Celo Test. Further, if you agree to participate in Celo Rewards, you agree to send text messages to participate in verification processes. You understand that standard text messaging rates may apply, depending on your carrier. The Celo Test is designed to work with most wireless carriers, but the Company makes no guarantee that all wireless service providers will be compatible with the Celo Test or that any mobile phone used will be capable of sending and receiving text messages.
						
You understand that your wireless service provider(s) may charge you for each text message, including any error message, that is sent and/or received in connection with the Celo Test. It is recommended that you consult with your wireless service provider’s pricing plan for any applicable details. By participating in the Celo Test, you are solely responsible for any wireless charges.
                `}
              </Text>
            </Cell>
          </GridRow>
        </View>
      </>
    )
  }
}

export default withNamespaces(NameSpaces.terms)(Agreement)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
})
