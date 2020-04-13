import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1, H3, Li, ListType, Ul } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'

class StakeoffTerms extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.terms, NameSpaces.common] }
  }
  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph
          title={t('gameOfStakesTermsTitle')}
          path={NameSpaces.terms}
          description={t('gameOfStakesTermsMetaDescription')}
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
              <H1 style={textStyles.center}>{t('gameOfStakesTermsTitle')}</H1>
              <H3 style={textStyles.center}>{t('termsAndConditions')}</H3>
            </Cell>
          </GridRow>
          <GridRow>
            <Cell span={Spans.fourth}>
              <Text style={fonts.h6}>Last Updated October, 29 2019</Text>
            </Cell>
            <Cell span={Spans.three4th}>
              <Text
                style={fonts.p}
              >{`Thank you for joining the Great Celo Stake Off (“TGCSO”), the incentivized testnet for the Celo Protocol. TGCSO allows eligible participants (“Participants”) to engage with the betanet version of the Celo Protocol (“Protocol”) and, related to that participation and subject to these Terms and Conditions, Participants will have the opportunity to receive Celo Gold at the Mainnet launch of the Celo Protocol.   TGCSO will commence on the date prescribed by cLabs (the “Company”) and continue until terminated by the Company in its sole discretion (“TGCSO Period”). Participation in TGCSO is subject to these Terms and Conditions (the “Terms”) and the Company’s Privacy Policy (“Privacy Policy”), and all other agreements or terms as set forth by the Company. These Terms constitute a binding obligation between you and the Company. As used herein, “Celo Gold” means the native unit of value on the Mainnet Celo Protocol. 
              
YOUR PARTICIPATION IN TGCSO IS ENTIRELY VOLUNTARY, BUT IF YOU ARE PARTICIPATING IN TGCSO, YOU MUST STRICTLY ADHERE TO THE TERMS. IF, AS PART OF YOUR VOLUNTARY PARTICIPATION, YOU MEET THE CRITERIA LISTED BELOW, YOU MAY BE ELIGIBLE TO RECEIVE CERTAIN AMOUNTS OF CELO GOLD UNITS AND/OR CELO GOLD UPON THE MAINNET LAUNCH OF THE CELO PROTOCOL. YOU AGREE THAT ANY CELO GOLD UNITS OR CELO GOLD RECEIVED BY YOU WILL BE FOR YOUR SERVICES IN TESTING AND CONTRIBUTING TO THE CELO TECHNOLOGIES AS DEFINED BELOW AND AS PART OF THIS TGCSO.
              `}</Text>
              <Ul>
                <Li listStyle={ListType.numeric}>
                  Agreement to Terms. By using the Celo technology during TGCSO Period, including
                  the features, technologies and functionalities offered by the Company to you
                  through a website, app, or through other means (the “Celo Technologies.”) and
                  participating in TGCSO, you agree to be bound by these Terms. If you don’t agree
                  to be bound by these Terms, do not participate. If you are accessing and
                  participating in TGCSO on behalf of a company (such as your employer) or other
                  legal entity, you represent and warrant that you have the authority to bind that
                  company or other legal entity to these Terms. In that case, “you” and “your” will
                  refer to that company or other legal entity.
                </Li>
                <Li listStyle={ListType.numeric}>
                  Privacy Policy. Please refer to our Privacy Policy (available at{' '}
                  <Link href="https://celo.org/privacy">celo.org/privacy</Link>) for information on
                  the Company may collect, use and disclose information. You acknowledge and agree
                  that your participation in TGCSO is subject to this Privacy Policy.
                </Li>
                <Text style={[fonts.p, textStyles.heavy]}>
                  IMPORTANT NOTICE REGARDING ARBITRATION: WHEN YOU AGREE TO THESE TERMS YOU ARE
                  AGREEING (WITH LIMITED EXCEPTION) TO RESOLVE ANY DISPUTE BETWEEN YOU AND THE
                  COMPANY THROUGH BINDING, INDIVIDUAL ARBITRATION RATHER THAN IN COURT. PLEASE
                  REVIEW CAREFULLY SECTION 15 “DISPUTE RESOLUTION” BELOW FOR DETAILS REGARDING
                  ARBITRATION.
                </Text>
                <br />
                <Li listStyle={ListType.numeric}>
                  Changes to Terms. The Company may update the Terms at any time, in its sole
                  discretion. If it does so, the Company will deliver a notice either by posting the
                  updated Terms on <Link href="https://forum.celo.org">forum.celo.org</Link> (“TGCSO
                  Forum”) or through other communications. It’s important that you review any and
                  all updated Terms. If you continue to participate in TGCSO after the Company has
                  posted updated Terms, you are agreeing to be bound by the updated Terms. If you
                  don’t agree to be bound by the updated Terms, then you may not participate in
                  TGCSO anymore. Because TGCSO will evolve over TGCSO Period, the Company may change
                  or discontinue all or any part of TGCSO, at any time and without notice, at its
                  sole discretion.
                </Li>
                <Li listStyle={ListType.numeric}>
                  Eligibility. You may participate in TGCSO only if: (a) you are 18 years or older
                  and capable of forming a binding contract with the Company; (b) you are not a
                  citizen or resident of any jurisdiction designated by the United Nations, European
                  Union, any EU country, UK Treasury, or the U.S. Secretary of State as a country
                  supporting international terrorism, or to which U.S. nationals cannot lawfully
                  engage in transactions as designated by the Office of Foreign Assets Control,
                  including without limitation Cuba, Democratic People’s Republic of Korea, the
                  Crimea region of Ukraine, Iran, or Syria; and (c) you are not barred from
                  participating under applicable law. To claim or receive any Celo Gold as part of
                  TGCSO, you may not be an employee, consultant or affiliate of the Company and you
                  will be required to provide certain identifying documentation and information.
                  Failure to provide such identifying information and/or a failure to demonstrate
                  compliance with the restrictions herein may result in termination of your
                  participation, forfeiture of any accumulated Baklava Test Units (described below),
                  forfeiture of Celo Gold, and prohibition from participating in future testnet
                  challenges, and other actions.
                  <br />
                  You agree to comply with all applicable national, international and local laws,
                  ordinances and regulations in connection with your participation in TGCSO. Nothing
                  herein shall constitute an employment, consultancy, joint venture, or partnership
                  relationship between you and the Company.
                </Li>
                <Li listStyle={ListType.numeric}>
                  Description of TGCSO. The TGCSO, will operate in phases, with each phase focused
                  on different parts of Protocol. Please note that the Protocol upon which these
                  Terms are based is a partially audited release of what will be the Mainnet launch
                  of the Celo Protocol and related infrastructure. The Celo Technologies are
                  provided to you for a limited time as part of TGCSO. TGCSO is designed to build
                  the validator operational experience, establish security best practices and
                  improve the design of the Celo Technologies which will be incorporated into the
                  Mainnet launch of the open source Celo Protocol. Because upon Mainnet launch, the
                  Celo Protocol is decentralized, TGCSO is important to expose potential issues and
                  to improve participant experiences with the Celo Technologies so that the Company
                  may address potential issues before the Mainnet launch of the Celo Protocol.
                  <br />
                  <br />
                  You further understand and agree that:
                  <Ul>
                    <Li listStyle={ListType.alpha}>
                      {' '}
                      Access to TGCSO may require the use of your personal computer and/or mobile
                      devices, as well as communications with or use of data and storage on such
                      devices. You are responsible for any Internet connection or mobile fees and
                      charges that you may incur as part of your voluntary participation in TGCSO.
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      Certain information, including your wallet and on-chain transaction records,
                      are all public information and can be accessed by anyone, including
                      participants and non-participants of TGCSO.
                    </Li>
                  </Ul>
                </Li>
                <Li listStyle={ListType.numeric}>
                  Baklava Testnet Units (“BTUs”), Celo Gold Units, and Mainnet Celo Gold. BTUs will
                  be awarded to Participants during the course of TGCSO for activities including
                  running a validator or full node, passing Company operational security and
                  infrastructure audits, among other activities that will be posted at TGCSO Forum.
                  In addition, other aspects of TGCSO participation may be rewarded with Mainnet
                  Celo Gold, as also specified in TGCSO and below.
                  <Ul>
                    <Li listStyle={ListType.alpha}>
                      As part of TGCSO, the Company will deliver up to a total of 2,000,000 (two
                      million) Celo Gold at Mainnet launch of the Celo Protocol. Top performing
                      Participants, based on the total number of accumulated BTUs and as further
                      described at TGCSO Forum, may receive up to 60,000 Celo Gold at Mainnet launch
                      of the Celo Protocol. Other contributions to TGCSO may further be rewarded
                      with Celo Gold at Mainnet launch, as specified in TGCSO Forum.
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      All Participants who wish to receive Celo Gold at Mainnet launch will be
                      required to complete identification information,necessary attestations, and
                      other information to adhere to applicable laws and regulations required to
                      receive Celo Gold Units prior to the Mainnet launch or Celo Gold at or after
                      Mainnet launch. Participants understand that certain lock up periods may apply
                      to Celo Gold at Mainnet launch. Participants who do not provide the requested
                      information, or Participants who cannot receive Celo Gold Units or Celo Gold
                      for any reason will forfeit his/her right to Celo Gold Units and Celo Gold.{' '}
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      The Company reserves the right to block any and all access you may have to
                      TGCSO, to remove or reallocate any BTUs earned, and withhold or not pay any or
                      all Celo Gold Units and Mainnet Celo Gold if you have violated any of the
                      terms and conditions of the Terms (as determined solely by the Company) or if
                      you do not complete the necessary information or pass the review process to
                      enable the delivery of Celo Gold Units and/or Celo Gold.
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      You are responsible for the payment of all taxes associated with your receipt
                      Celo Gold Units and/or Celo Gold. You agree to provide the Company with any
                      additional information and complete any required tax or other forms relating
                      to your receipt of Celo Gold Units and/or Celo Gold.
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      BTUs, and any corresponding Celo Gold Units and Celo Gold, earned as a result
                      of fraudulent activities are null and void. The Company reserves the right to
                      request information about, review and investigate all TGCSO activities, and to
                      disqualify Participants if it believes a Participant has engaged in any
                      activity that is abusive, fraudulent, in bad faith or otherwise fails to meet
                      TGCSO standards and requirements. The Company may determine that BTUs earned
                      through legitimate actions (e.g., not fraud) are not affected by suspension or
                      termination.
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      If for any reason, as determined solely by the Company, the Participant is not
                      eligible to receive Celo Gold Units and/or Celo Gold, the Company will
                      endeavor, but will not be required, to provide some compensation to
                      Participant, again within the sole discretion of the Company.
                    </Li>
                  </Ul>
                </Li>
                <Li listStyle={ListType.numeric}>
                  Wallet. If you use a wallet application, you are responsible for the management of
                  the private keys for your wallet(s). The Company does not and will not manage,
                  store, collect or otherwise access the private keys for your wallet(s). You’re
                  responsible for all activities that occur using your wallet, whether or not you
                  know about them.
                </Li>
                <Li listStyle={ListType.numeric}>
                  Feedback. The Company (and the larger Celo community) welcomes feedback, comments
                  and suggestions for improvements to the Celo Technologies and the ultimate Mainnet
                  launch of the Celo Protocol (“Feedback”). You can submit Feedback by emailing
                  <Link href="mailto:stakeoff@celo.org">stakeoff@celo.org</Link>. You grant to the
                  Company and the ultimate, open source Mainnet launch of the Celo Protocol, a
                  non-exclusive, transferable, worldwide, perpetual, irrevocable, fully-paid,
                  royalty-free license, with the right to sublicense, under any and all intellectual
                  property rights that you own or control to use, copy, modify, create derivative
                  works based upon and otherwise exploit the Feedback for any purpose, in any form,
                  format, media or media channels now known or later developed or discovered.
                </Li>
                <Li listStyle={ListType.numeric}>
                  General Prohibitions and Company’s Enforcement Rights. You agree to the following:
                  <Ul>
                    <Li listStyle={ListType.alpha}>
                      To follow the Celo Community Code of Conduct as provided{' '}
                      <Link href="https://celo.org/code-of-conduct">here</Link>
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      You will not tamper with or hack TGCSO, the Celo Technology, the Company’s or
                      other participants’ computer systems,or the technical delivery systems of
                      Company’s providers including without limitation any attacks that may violate
                      Amazon Web Services Acceptable Use Policy and Google Cloud Platform's
                      Acceptable Use Policy;{' '}
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      You will not Interfere with, or attempt to interfere with, the access of any
                      user, host or network, including, without limitation, sending a virus,
                      overloading, flooding, spamming, creating, encouraging or implementing Sibyl
                      attacks or mail-bombing TGCSO, unless explicitly suggested by the Celo
                      security bounty program with details specified on TGCSO Forum ;
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      You will not impersonate or misrepresent your affiliation with any person or
                      entity;{' '}
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      You will not adversely affect the goodwill of the Company or the Protocol;
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      You will not violate any applicable law or regulation; and
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      You will not encourage or enable any other individual to do any of the
                      foregoing or otherwise violate the Terms.
                    </Li>
                  </Ul>
                  Although the Company is not obligated to monitor access to or participation in
                  TGCSO, it has the right to do so for the purpose of operating TGCSO, to ensure
                  compliance with the Terms and to comply with applicable law or other legal
                  requirements. The Company reserves the right, but is not obligated, to suspend or
                  terminate TGCSO at any time and without notice. The Company has the right to
                  investigate violations of the Terms or conduct that affects TGCSO. The Company may
                  further consult and cooperate with law enforcement authorities to prosecute those
                  who violate the law.
                </Li>
                <Li listStyle={ListType.numeric}>
                  Cancellation, Suspension or Termination of TGCSO.
                  <Ul>
                    <Li listStyle={ListType.alpha}>
                      The Company may, in its sole discretion, with or without prior notice and at
                      any time, modify or terminate, temporarily or permanently, any portion of
                      TGCSO.
                    </Li>
                  </Ul>
                </Li>
                <Li listStyle={ListType.numeric}>
                  Representations, Warranties and Disclaimers.
                  <Ul>
                    <Li listStyle={ListType.alpha}>
                      You must ensure that your wallet credentials are secure. If they are not,
                      people may compromise and take action on your wallet. You should avoid copying
                      scripts into your browser address bar, and avoid clicking on links, opening
                      attachments or visiting Internet resources you do not trust. You are
                      responsible for maintaining adequate security and control of any and all IDs,
                      passwords, hints, personal identification numbers (PINs), or any other codes
                      that you use to access your wallet or in relation to TGCSO. The Company
                      assumes no responsibility for any losses resulting from any compromise of your
                      wallet(s).
                    </Li>

                    <Li listStyle={ListType.alpha}>
                      YOU ACCEPT AND ACKNOWLEDGE THAT THERE ARE RISKS ASSOCIATED WITH PARTICIPATING
                      IN TGCSO INCLUDING, BUT NOT LIMITED TO, THE RISK OF FAILURE OF HARDWARE,
                      SOFTWARE AND INTERNET CONNECTIONS, THE RISK OF MALICIOUS SOFTWARE
                      INTRODUCTION, LOSS OF THE CELO GOLD AND/OR CELO GOLD UNITS HELD IN YOUR
                      WALLET(S), AND THE RISK THAT THIRD PARTIES MAY OBTAIN UNAUTHORIZED ACCESS TO
                      INFORMATION STORED WITHIN YOUR WALLET(S). YOU ACCEPT AND ACKNOWLEDGE THAT THE
                      COMPANY WILL NOT BE RESPONSIBLE FOR ANY LOSSES, FAILURES, DISRUPTIONS, ERRORS,
                      DISTORTIONS OR DELAYS YOU MAY EXPERIENCE WHEN PARTICIPATING IN TGCSO, HOWEVER
                      CAUSED.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      YOU ACCEPT AND ACKNOWLEDGE THAT THERE ARE RISKS ASSOCIATED WITH USING ANY
                      CRYPTOCURRENCY NETWORK, INCLUDING, BUT NOT LIMITED TO, THE RISK OF UNKNOWN
                      VULNERABILITIES IN OR UNANTICIPATED CHANGES TO THE NETWORK PROTOCOL. YOU
                      ACKNOWLEDGE AND ACCEPT THAT THE COMPANY HAS NO CONTROL OVER ANY CRYPTOCURRENCY
                      NETWORK AND WILL NOT BE RESPONSIBLE FOR ANY HARM OCCURRING AS A RESULT OF SUCH
                      RISKS. You have a sufficient understanding of the functionality, usage,
                      storage, transmission mechanisms, and other material characteristics of
                      cryptographic tokens, token storage mechanisms (such as token wallets),
                      distributed ledger technology, and decentralized software systems to
                      understand the terms of TGCSO and to appreciate the risks and implications
                      relating to TGCSO, BTUs, Celo Gold Units and Celo Gold.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      THE COMPANY WILL NOT BE RESPONSIBLE OR LIABLE TO YOU FOR ANY LOSS AND TAKES NO
                      RESPONSIBILITY FOR AND WILL NOT BE LIABLE TO YOU FOR YOUR PARTICIPATION IN
                      TGCSO, INCLUDING BUT NOT LIMITED TO ANY LOSSES, DAMAGES OR CLAIMS ARISING
                      FROM: (i) USER ERROR SUCH AS FORGOTTEN PASSWORDS, LOST OR MISSING PRIVATE
                      KEYS, INCORRECTLY CONSTRUCTED TRANSACTIONS, OR MISTYPED ADDRESSES; (ii) SERVER
                      FAILURE; (iii) CORRUPTED WALLET FILES; (iv) UNAUTHORIZED ACCESS TO
                      APPLICATIONS; OR (v) ANY UNAUTHORIZED THIRD PARTY ACTIVITIES, INCLUDING
                      WITHOUT LIMITATION THE USE OF VIRUSES, PHISHING, BRUTE FORCING OR OTHER MEANS
                      OF ATTACK AGAINST TGCSO.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      THE COMPANY MAKES NO WARRANTY THAT TGCSO INCLUDING THE SERVER THAT MAKES TGCSO
                      AVAILABLE, ARE FREE OF VIRUSES OR ERRORS, THAT IT WILL BE UNINTERRUPTED, OR
                      THAT DEFECTS WILL BE CORRECTED. THE COMPANY WILL NOT BE RESPONSIBLE OR LIABLE
                      TO YOU FOR ANY LOSS OF ANY KIND, FROM ACTION TAKEN, OR TAKEN IN RELIANCE ON
                      MATERIAL, OR INFORMATION, CONTAINED OR MADE AVAILABLE THROUGH TGCSO.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      BTUs, CELO GOLD UNITS AND ANY CELO GOLD THAT YOU MAY ULTIMATELY RECEIVE AS
                      PART OF TGCSO ARE PROVIDED “AS IS,” WITHOUT WARRANTY OF ANY KIND. WITHOUT
                      LIMITING THE FOREGOING, THE COMPANY EXPLICITLY DISCLAIMS ANY IMPLIED
                      WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, VALUE, QUIET
                      ENJOYMENT AND NON-INFRINGEMENT, AND ANY WARRANTIES ARISING OUT OF COURSE OF
                      DEALING OR USAGE OF TRADE. The Company makes no warranty that TGCSO will meet
                      your requirements or be available on an uninterrupted, secure, or error-free
                      basis. The Company makes no warranty regarding the quality, accuracy,
                      timeliness, truthfulness, completeness or reliability of any information or
                      materials offered in connection with TGCSO or on TGCSO Forum. YOU ASSUME ALL
                      RISK AND LIABILITY FOR THE RESULTS OBTAINED BY THE USE OF CELO TECHNOLOGIES
                      AND ANY RECEIVED CELO GOLD UNITS AND CELO GOLD AND REGARDLESS OF ANY ORAL OR
                      WRITTEN STATEMENTS MADE BY THE COMPANY, BY WAY OF TECHNICAL ADVICE OR
                      OTHERWISE, RELATED TO CELO GOLD UNITS AND CELO GOLD. ANY CELO GOLD UNITS AND
                      CELO GOLD THAT YOU ULTIMATELY MAY RECEIVE AS PART OF TGCSO MAY NOT HAVE A
                      MARKET AND MAY HAVE NO VALUE.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      You accept and assume all risks and liabilities that the Company and/or third
                      parties participating in TGCSO may be subject to investigative and punitive
                      actions from governmental authorities.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      You may suffer adverse tax consequences as a result of your participation in
                      TGCSO. you hereby represent that (i) you have consulted with a tax adviser
                      that you deem advisable in connection with your participation, or that you
                      have had the opportunity to obtain tax advice but have chosen not to do so,
                      (ii) the Company has not provided you with any tax advice with respect to your
                      participation, and (iii) you are not relying on the Company for any tax
                      advice. You agree to be fully responsible for any taxes resulting from your
                      TGCSO participation.
                    </Li>
                  </Ul>
                </Li>
                <Li listStyle={ListType.numeric}>
                  Indemnity. You will indemnify and hold harmless The Company, its affiliates, and
                  their respective officers, directors, employees and agents (together, the
                  “Released Parties”), from and against any claims, disputes, demands, liabilities,
                  damages, losses, and costs and expenses, including, without limitation, reasonable
                  legal and accounting fees arising out of or in any way connected with (i) your
                  access to or participation in TGCSO, (ii) your violation of the Terms, and (iii)
                  acceptance or use of Celo Gold Units or Celo Gold deliver to you in connection
                  with TGCSO.
                </Li>
                <Li listStyle={ListType.numeric}>
                  Limitation of Liability.
                  <Ul>
                    <Li listStyle={ListType.alpha}>
                      NEITHER THE RELEASED PARTIES NOR ANY OTHER PARTY INVOLVED IN TGCSO WILL BE
                      LIABLE FOR ANY INCIDENTAL, SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES, OR
                      DAMAGES FOR LOST PROFITS, LOST REVENUES, LOST SAVINGS, LOST BUSINESS
                      OPPORTUNITY, LOSS OF DATA OR GOODWILL, SERVICE INTERRUPTION, COMPUTER DAMAGE
                      OR SYSTEM FAILURE OR THE COST OF SUBSTITUTE ACTIVITIES OF ANY KIND ARISING OUT
                      OF OR IN CONNECTION WITH THESE TERMS OR YOUR PARTICIPATION IN, OR INABILITY TO
                      PARTICIPATE IN, TGCSO, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING
                      NEGLIGENCE), PRODUCT LIABILITY OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT
                      COMPANY OR ANY OTHER PARTY HAS BEEN INFORMED OF THE POSSIBILITY OF SUCH
                      DAMAGE, EVEN IF A LIMITED REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF
                      ITS ESSENTIAL PURPOSE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR
                      LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, SO THE ABOVE
                      LIMITATION MAY NOT APPLY TO YOU.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      IN NO EVENT WILL THE RELEASED PARTIES’ TOTAL LIABILITY TO YOU ARISING OUT OF
                      OR IN CONNECTION WITH THESE TERMS OR FROM THE PARTICIPATION IN, OR INABILITY
                      TO PARTICIPATE IN, TGCSO EXCEED THE TOTAL NUMBER OF BTUs STAKED BY YOU IN
                      TGCSO.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      THE EXCLUSIONS AND LIMITATIONS OF DAMAGES SET FORTH ABOVE ARE FUNDAMENTAL
                      ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN COMPANY AND YOU.
                    </Li>
                  </Ul>
                </Li>
                <Li listStyle={ListType.numeric}>
                  Governing Law and Forum Choice. These Terms and any action related thereto will be
                  governed by the laws of the state of California in the United States of America
                  without regard to its conflict of laws provisions. The exclusive jurisdiction for
                  all Disputes (defined below) will be in San Francisco, California, and you and
                  Company each waive any objection to such jurisdiction and venue.
                </Li>
                <Li listStyle={ListType.numeric}>
                  Dispute Resolution. You agree that, by participating in TGCSO, any dispute,
                  controversy, difference or claim arising out of, relating to or in connection with
                  this contract, or the breach, termination or invalidity thereof (together, the
                  “Disputes”), shall be finally settled by arbitration referred to the American
                  Arbitration Association in accordance with the Association’s arbitration rules.
                  The place of arbitration shall be in San Francisco, California. The language of
                  arbitration shall be English. The arbitral award shall be final and binding upon
                  both parties. YOU AND COMPANY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER
                  ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN
                  ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. Further, unless both you and
                  Company agree otherwise, the arbitrator may not consolidate more than one person's
                  claims with your claims, and may not otherwise preside over any form of a
                  representative or class proceeding. If this specific provision is found to be
                  unenforceable, then the entirety of this Dispute Resolution section shall be null
                  and void.
                </Li>
                <Li listStyle={ListType.numeric}>
                  General Terms.
                  <Ul>
                    <Li listStyle={ListType.alpha}>
                      <Text style={textStyles.heavy}>Entire Agreement.</Text> These Terms constitute
                      the entire and exclusive understanding and agreement between Company and you
                      regarding TGCSO, and the Terms supersede and replace any and all prior oral or
                      written understandings or agreements between Company and you regarding TGCSO.
                      If any provision of the Terms is held invalid or unenforceable by an
                      arbitrator or a court of competent jurisdiction, that provision will be
                      enforced to the maximum extent permissible and the other provisions of the
                      Terms will remain in full force and effect. You may not assign or transfer the
                      Terms, by operation of law or otherwise, without Company’s prior written
                      consent. Any attempt by you to assign or transfer the Terms, without such
                      consent, will be null and void. Company may freely assign or transfer these
                      Terms without restriction. Subject to the foregoing, these Terms will bind and
                      inure to the benefit of the parties, their successors and permitted assigns.
                      The Released Parties other than the Company are third party beneficiaries to
                      these Terms.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      <Text style={textStyles.heavy}>Notices.</Text> Any notices or other
                      communications provided by Company under the Terms, including those regarding
                      modifications to the Terms, will be given by posting to TGCSO Forum.
                    </Li>
                    <Li listStyle={ListType.alpha}>
                      <Text style={textStyles.heavy}>Waiver of Rights.</Text> Company’s failure to
                      enforce any right or provision of these Terms will not be considered a waiver
                      of such right or provision. The waiver of any such right or provision will be
                      effective only if in writing and signed by a duly authorized representative of
                      Company. Except as expressly set forth in these Terms, the exercise by either
                      party of any of its remedies under these Terms will be without prejudice to
                      its other remedies under these Terms or otherwise.
                    </Li>
                  </Ul>
                </Li>
                <Li listStyle={ListType.numeric}>
                  Contact Information. If you have any questions about these Terms or TGCSO, please
                  contact <Link href="mailto:stakeoff@celo.org">stakeoff@celo.org</Link>
                </Li>
              </Ul>
            </Cell>
          </GridRow>
        </View>
      </>
    )
  }
}

function Link({ children, href }) {
  return <Button text={children} href={href} kind={BTN.INLINE} />
}

export default withNamespaces(NameSpaces.terms)(StakeoffTerms)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
})
