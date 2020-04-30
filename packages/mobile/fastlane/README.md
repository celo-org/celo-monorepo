fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew cask install fastlane`

# Available Actions
## Android
### android clean
```
fastlane android clean
```
Clean the Android application
### android build
```
fastlane android build
```
Build the Android application - requires environment param
### android integration
```
fastlane android integration
```
Ship Integration to Playstore Internal
### android staging
```
fastlane android staging
```
Ship Staging to Playstore Internal
### android production
```
fastlane android production
```
Ship Production to Playstore Alpha.
### android alfajores
```
fastlane android alfajores
```
Ship Alfajores to Playstore Internal
### android pilotapp
```
fastlane android pilotapp
```
Ship Pilot to Playstore Internal
### android build_apk
```
fastlane android build_apk
```
Build an Android apk
### android build_bundle
```
fastlane android build_bundle
```
Build an Android bundle

----

## iOS
### ios build
```
fastlane ios build
```
Build the iOS application - requires environment param
### ios alfajores
```
fastlane ios alfajores
```
Ship Alfajores to TestFlight
### ios pilotapp
```
fastlane ios pilotapp
```
Ship Pilot to TestFlight

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
