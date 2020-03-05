import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1, Li, TABLE, TD, TH, TR, Ul } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import Link from 'src/shared/Link'
import { fonts, standardStyles, textStyles } from 'src/styles'

export default class Privacy extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <OpenGraph
          title="Privacy Policy"
          path={'/privacy'}
          description={
            'This page informs you of our policies regarding the collection, use and disclosure of Personal Information when you use our Service.'
          }
        />
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.blockMarginBottom}
          tabletStyle={standardStyles.blockMarginBottomTablet}
          mobileStyle={standardStyles.blockMarginBottomMobile}
        >
          <Cell span={Spans.fourth}>{}</Cell>
          <Cell span={Spans.three4th}>
            <H1>Privacy Policy</H1>
          </Cell>
        </GridRow>
        <GridRow>
          <Cell span={Spans.fourth}>
            <Text style={fonts.h6}>Valid as of Feb 24, 2020</Text>
          </Cell>
          <Cell span={Spans.three4th}>
            <P>
              This Privacy Policy and Cookies Statement describes how A Protocol Inc. and its
              affiliated companies (referred to in this document as “Celo,” “we,” “us” or “our”)
              collects, uses, shares and otherwise processes Personal Data (defined below)
              including:
            </P>
            <Ul>
              <Li>
                Visitors to our website(s), mobile applications and other online properties (“Site”
                or “Sites”)
              </Li>
              <Li>Any other individual about whom Celo may obtain Personal Data</Li>
            </Ul>
            <P>
              In this Privacy Policy, “Personal Data” means information that (either in isolation or
              in combination with other information held by Celo) enables you to be identified as an
              individual or recognized directly or indirectly. We may collect Personal Data when you
              use our Sites.
            </P>
          </Cell>
        </GridRow>
        <SideTitledSection span={Spans.three4th} title="Overview">
          <P>
            Unless we specifically state otherwise, Celo is the data processor of the Personal Data
            we process, and is therefore responsible for ensuring that the systems and processes we
            use are compliant with data protection laws, to the extent applicable to us.
          </P>
          <P>
            Celo personnel are required to comply with this Privacy Policy and complete data
            protection training, where appropriate.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Collection of Personal Data">
          <P>
            Celo collects information that you provide directly to us when you browse our Site,
            register to receive newsletter requests or other information, provide feedback through
            surveys, participate in any interactive features on our Sites including contests,
            promotions, challenges, activities or events.
          </P>
          <P>
            We also collect data provided by job applicants or others on our Sites or offline means
            in connection with employment or consulting opportunities, which may also be subject to
            other Policies.
          </P>
          <P>
            We may also collect Computer Internet Protocol (IP) address, unique device identifier
            (“UDID”), cookies, web beacons, web server logs and other technologies and other data
            linked to a device, and data about usage of our Sites (Usage Data). A “cookie” is a text
            file that websites send to a visitor’s computer or other Internet-connected device to
            identify the visitor’s browser or to store information or settings in the browser. A
            “web beacon,” also known as an Internet tag, pixel tag or clear GIF, links web pages to
            web servers and their cookies and may be used to transmit information collected through
            cookies back to a web server.
          </P>
          <P>
            Other types of information we may collect include your name, email address, username,
            password, phone number, location and any other information you choose to provide.
          </P>
          <P>
            We may use these automated technologies to collect information about your equipment,
            browsing actions, and usage patterns. The information we obtain in this manner may
            include your device IP address, identifiers associated with your devices, types of
            devices connected to our services, web browser characteristics, device characteristics,
            language preferences, referring/exit pages, clickstream data, and dates and times of
            visits to our Site.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Use of Personal Data">
          <P>We use the Personal Data that we collect:</P>
          <Ul>
            <Li>
              <B>To make our Sites more intuitive and easier to use</B> we use device data, cookies
              and other information that you may provide. This data is necessary for our legitimate
              interests in monitoring how our Sites are used to help us improve these Sites, and the
              information and tools available on these Sites.
            </Li>
            <Li>
              To provide <B>relevant marketing </B>including providing you with information about
              events or services that may be of interest to you. It is necessary for our legitimate
              interests to process this information in order to provide you with tailored and
              relevant marketing, updates and invitations.
            </Li>
            <Li>
              To<B>
                {' '}
                consider individuals for employment and contractor opportunities and manage
                on-boarding processes{' '}
              </B>
              we use job applicant data. The processing is necessary for the purposes of recruitment
              and on-boarding.
            </Li>
            <Li>To carry out any other purpose for which the information was collected.</Li>
          </Ul>
          <P>
            We may also use automated technologies to collect information about your equipment,
            browsing actions, and usage patterns. The information we obtain in this manner may
            include your device IP address, identifiers associated with your devices, types of
            devices connected to our services, web browser characteristics, device characteristics,
            language preferences, referring/exit pages, clickstream data, and dates and times of
            visits to our Site.
          </P>
          <P>
            The information we collect through cookies and similar technologies helps Celo (1)
            remember your information so you will not have to re-enter it; (2) understand how you
            use and interact with our website; (3) measure the usability of our website and the
            effectiveness of our communications; and (4) otherwise manage and enhance our website,
            and help ensure it is working properly. Your browser may tell you how to be notified
            when you receive certain types of cookies or how to restrict or disable certain types of
            cookies. Please note, however, that without cookies you may not be able to use all of
            the features of our website.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Marketing Choices">
          <P>
            You have control regarding our use of Personal Data for direct marketing. In certain
            markets, you will need to expressly consent before receiving marketing. In all markets,
            you can choose to not receive marketing communications at any time. If you no longer
            wish to receive marketing communications from Celo, or remain on a mailing list to which
            you previously subscribed, or receive any other marketing communication, please follow
            the unsubscribe link in the relevant communications or contact us as specified below.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="How we share your information">
          <Ul>
            <Li>
              With vendors, consultants and other service providers who need access to such
              information to carry out work on our behalf;
            </Li>
            <Li>
              In response to a request for information if we believe disclosure is in accordance
              with any applicable law, regulation or legal process, or as otherwise required by any
              applicable law, rule or regulation;
            </Li>
            <Li>
              If we believe your actions are inconsistent with our user agreements or policies, or
              to protect the rights, property and safety of us or any third-party;
            </Li>
            <Li>
              In connection with, or during negotiations of, any merger, sale of company assets,
              financing or acquisition of all or a portion of our business to another company;
            </Li>
            <Li>With your consent or at your direction; and</Li>
            <Li>
              We may also share aggregated or de-identified information, which cannot reasonably be
              used to identify you.
            </Li>
          </Ul>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Celo Sub-Processors">
          <P>We use the following sub-processors to operate our Services:</P>
          <TABLE>
            <TR>
              <TH>Third-Party Service or Vendor</TH>
              <TH>Type of Service</TH>
              <TH>Location</TH>
            </TR>
            <TR>
              <TD>Segment.io Inc.</TD>
              <TD>Site Visitor Data Platform</TD>
              <TD>United States</TD>
            </TR>
            <TR>
              <TD>Google</TD>
              <TD>Site Visitor Analytics</TD>
              <TD>United States</TD>
            </TR>
            <TR>
              <TD>Lever, Inc.</TD>
              <TD>Applicant Tracking Platform</TD>
              <TD>United States</TD>
            </TR>
            <TR>
              <TD>ActiveCampaign, LLC</TD>
              <TD>Visitor Tracking and Communication Platform</TD>
              <TD>United States</TD>
            </TR>
            <TR>
              <TD>Mixpanel</TD>
              <TD>Site Visitor Analytics</TD>
              <TD>United States</TD>
            </TR>
            <TR>
              <TD>ipstack</TD>
              <TD>IP Address Geolocation</TD>
              <TD>Austria</TD>
            </TR>
          </TABLE>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Legal Bases For Processing (For EEA Users)">
          <P>
            If you are an individual from the European Economic Area (“EEA”), we collect and process
            your Personal Data only where we have legal basis for doing so under applicable EU laws.
            The legal basis depends on the Services you use and how you use them. This means we
            collect and use your personal data only:
          </P>
          <Ul>
            <Li>
              To operate our business, including to improve and develop our services, for fraud
              prevention purposes, improve user experience, or other legitimate interest;
            </Li>
            <Li>To fulfill contractual responsibilities; and/or</Li>
            <Li>As otherwise in compliance with law.</Li>
          </Ul>
          <P>
            If you have any questions about the legal basis for processing, please contact us at the
            address listed in the “Contact Us” section.
          </P>
        </SideTitledSection>
        <SideTitledSection
          span={Spans.three4th}
          title="Transfer of Personal Data To Other Countries"
        >
          <P>
            We may transfer your Personal Data to countries outside the United Kingdom and the
            European Economic Area (“EEA”), including, but not limited to the United States, where
            Celo’s headquarters and some of its IT systems (including email) are located.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="How We Protect Your Information">
          <P>
            Protecting your information is important to us. We maintain administrative, technical
            and physical safeguards designed to protect against accidental, unlawful or unauthorized
            destruction, loss, alteration, access, disclosure or use of Personal Data.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="How Long We Retain Your Information">
          <P>
            We strive to only keep your Personal Data only for the period of time needed for
            legitimate business purposes. In certain circumstances, however, legal or regulatory
            obligations may require us to retain records for a longer than we otherwise would.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Children’s Information">
          <P>
            Our Services are not directed to children under the age of 16. If you learn that a child
            under the age of 16 has provided us with personal information without consent, please
            contact us.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Your Rights">
          <P>
            If you are in the EEA you have have the right, subject to certain exceptions, to request
            a copy of the Personal Data we are processing about you, to require that any incomplete
            or inaccurate Personal Data is amended, to request that we delete your Personal Data
            (although we may not be able to delete certain data due to legal or other obligations),
            to object to the use of your Personal Data or to withdraw consent.
          </P>
          <P>
            If you are in the EEA, you also have a right to lodge a complaint with the local data
            protection authority if you believe that we have not complied with the applicable data
            protection laws.
          </P>
          <P>
            You may also contact us to address and resolve concerns you may have about our use of
            your Personal Data. Please contact us at{' '}
            <Link href="mailto:privacy@celo.org"><a>privacy@celo.org</a></Link>.
          </P>
        </SideTitledSection>
        <SideTitledSection span={Spans.three4th} title="Changes To This Privacy Policy">
          <P>
            We reserve the right to change and update this Privacy Policy from time to time. If we
            make changes, you will be notified of the change by the date at the top of Privacy
            Policy, which will reflect the last date updated.
          </P>
        </SideTitledSection>
        <SideTitledSection
          span={Spans.three4th}
          title="Third-Party Services, Applications, and Websites"
        >
          <P>
            Certain third-party services, websites, or applications you use, or navigate to from our
            Services may have separate user terms and privacy policies that are independent of this
            Policy. This includes, for example, websites owned and operated by our customers or
            partners. We are not responsible for the privacy practices of these third-party services
            or applications. We recommend carefully reviewing the user terms and privacy statement
            of each third-party service, website, and/or application prior to use.
          </P>
        </SideTitledSection>
      </View>
    )
  }
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={[fonts.p, styles.paragraph]}>{children}</Text>
}

function B({ children }: { children: React.ReactNode }) {
  return <Text style={textStyles.heavy}>{children}</Text>
}

const styles = StyleSheet.create({
  container: {
    marginTop: 100,
  },
  paragraph: {
    marginBottom: 24,
  },
})
