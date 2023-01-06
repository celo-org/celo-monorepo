![CELO Bug Bounty Program Intigriti](https://i.imgur.com/fyrJi0R.png)

# Security

## Security Announcements

> Public announcements of new releases with security fixes and of disclosure of any vulnerabilities will be made in the Celo Forum's [Security Announcements](https://forum.celo.org/c/security-announcements/) channel.

# Reporting a Vulnerability
 We’re extremely grateful for security researchers and users that report vulnerabilities to the Celo community. All reports are thoroughly investigated.

### **Please do not file a public ticket** mentioning any vulnerability.

The Celo community asks that all suspected vulnerabilities be privately and responsibly disclosed.

## Creating a report:
1.  Submit your vulnerability to [Celo on Intigriti](https://www.intigriti.com).
	- This is currently a private program, and a public launch has been planned. If you would like to participate in the private program please create an account on intigriti.com, and send an email to intigrity.com support asking them to invite you to this program. 
3. You can also email the [security@clabs.co](mailto:security@clabs.co) list with the details of reproducing the vulnerability as well as the usual details expected for all bug reports.

## Primary Focus 
- Celo protocol,  but the team may be able to assist in coordinating a response to a vulnerability in the third-party apps or tools in the Celo ecosystem.



# In Scope

| In Scope                                    |
|---------------------------------------------|
| https://celo.org                            |
| https://*.celo.org                          |
| https://github.com/celo-org/celo-blockchain |
| https://github.com/celo-org/celo-monorepo   |




# Out of Scope - Application & Domains

| Out of Scope - Application                                                             | Out of Scope Domains   |
|----------------------------------------------------------------------------------------|------------------------|
| Self-XSS that cannot be used to exploit other users                                    | https://learn.celo.org |
| Verbose messages/files/directory listings without disclosing any sensitive information |                        |
| CORS misconfiguration on non-sensitive endpoints                                       |                        |
| Missing cookie flags                                                                   |                        |
| Missing security headers                                                               |                        |
| Cross-site Request Forgery with no or low impact                                       |                        |
| Presence of autocomplete attribute on web forms                                        |                        |
| Reverse tab-nabbing                                                                     |                        |
| Bypassing rate-limits or the non-existence of rate-limits.                             |                        |
| Best practices violations (password complexity, expiration, re-use, etc.)              |                        |
| Clickjacking on pages with no sensitive actions                                        |                        |
| CSV Injection                                                                          |                        |
| Blind SSRF without proven business impact (DNS pingback only is not sufficient)        |                        |
| Disclosed and/or misconfigured Google API key (including maps)                         |                        |
| Host header injection without proven business impact                                   |                        |
| Sessions not being invalidated (logout, enabling 2FA, ..)                              |                        |
| Hyperlink injection/takeovers                                                          |                        |
| Mixed content type issues                                                              |                        |
| Cross-domain referer leakage                                                           |                        |
| Anything related to email spoofing, SPF, DMARC or DKIM                                 |                        |
| Content injection                                                                      |                        |
| Username / email enumeration                                                           |                        |
| E-mail bombing                                                                         |                        |
| HTTP Request smuggling without any proven impact                                       |                        |
| Homograph attacks                                                                      |                        |
| XMLRPC enabled                                                                         |                        |
| Banner grabbing / Version disclosure                                                   |                        |
| Open ports without an accompanying proof-of-concept demonstrating vulnerability        |                        |
| Weak SSL configurations and SSL/TLS scan reports                                       |                        |
| Not stripping metadata of images                                                       |                        |
| Disclosing API keys without proven impact                                              |                        |
| Same-site scripting                                                                    |                        |
| Subdomain takeover without taken over the subdomain                                    |                        |
| Arbitrary file upload without proof of the existence of the uploaded file              |                        

# Out of Scope Mobile

-   Shared links leaked through the system clipboard
-   Any URIs leaked because a malicious app has permission to view URIs opened
-   The absence of certificate pinning
-   Sensitive data in URLs/request bodies when protected by TLS
-   Lack of obfuscation
-   Path disclosure in the binary
-   Lack of jailbreak & root detection
-   Crashes due to malformed URL Schemes
-   Lack of binary protection (anti-debugging) controls, mobile SSL pinning
-   Snapshot/Pasteboard leakage
-   Runtime hacking exploits (exploits only possible in a jailbroken environment)
-   API key leakage used for insensitive activities/actions
-   Attacks requiring physical access to the victim's device

# Frequently Asked Questions

-   ### What will happen if a vulnerability is reported and is known to the company from their own tests,? 
	- It will be flagged as a duplicate
-   ### What kind of exploits are excluded from the program or may be lowered in severity? 
	- Reports that state that software is out of date/vulnerable without a proof-of-concept
	- Theoretical security issues with no realistic exploit scenario(s) or attack surfaces
	-  Issues that would require complex end user interactions to be exploited, may be excluded or be lowered in severity
	 - Spam, social engineering and physical intrusion
	 - DoS/DDoS attacks or brute force attacks
	 - Vulnerabilities that are limited to non-current browsers (older than 3 versions) will not be accepted
	 - Attacks requiring physical access to a victim’s computer/device will not be accepted. 
	 - Man in The Middle 
	- Compromised User Accounts
- ### Do you accept recently disclosed zero-day vulnerabilities?
	-  We need time to patch our systems just like everyone else - please give us 2 weeks before reporting 


# Optional Method for Disclosure
### You may encrypt your email using this GPG key (but encryption is NOT required)

```
PGP Fingerprint ID: A22B62A5EAFB6948
```

