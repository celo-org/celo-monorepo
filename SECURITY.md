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
-----BEGIN PGP PUBLIC KEY BLOCK-----

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
r9YaEiDVo3F6nA==
=juyY
-----END PGP PUBLIC KEY BLOCK-----
```

