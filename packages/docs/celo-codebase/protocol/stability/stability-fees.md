# Stability Fees

## **Parameters Governing the Stability Fee**

`inflationPeriod` how long to wait between rounds of applying inflation

`inflationRate` the multiplier by which the inflation factor is adjusted per `inflationPeriod`

## **Timing, Frequency, and Amount of Fee**

The `inflationRate` is the multiplier by which the `inflationFactor` is increased per `inflationPeriod`. It is initially set to `1` which leaves it to governance to enable the stability fee later on.

Both, the `inflationRate` as well as the `inflationPeriod`, are specified for a given stable token and subject to changes based on governance decisions.

## **Stability Fee Levied on Balance**

Each account’s stable token balance is stored as ‘units’, and `inflationFactor` describes the units/value ratio. The Celo Dollar value of an account can therefore be computed as follows.

`Account cUSD Value = Account cUSD Units / inflationFactor`

When a transaction occurs, a modifier checks if the stability fee needs updating and, if so, the `inflationFactor` is updated.

## **Updates to the Inflation Factor**

To apply periodic inflation, the inflation factor must be updated at regular intervals. Every time an event triggering an `inflationFactor` update\(eg a transfer\) occurs, the `updateInflationFactor` modifier is called \(pseudocode below\), which does the following:

1. Decide if on or more `inflationPeriod` have passed since the last time `inflationFactor` was updated
2. If so, find out how many have passed
3. Compute the new `inflationFactor` and update the last updated time:

`inflationFactor` = `inflationFactor` \* `inflationRate` ^ `# inflationPeriods since last update`

## **Changes to Inflation Factor**

Desired inflation rates may vary over time. When a new rate needs to be set, a governance proposal is required to update the inflation rate. If successful, the above function is called, which ensures `inflationFactor` is up to date, then updates the `inflationRate` and `inflationPeriod` parameters.

## **Inflation Factor Update Schedule**

The `updateInflationFactor` modifier is called by the following functions:

* `setInflationParameters`
* `approve`
* `mint`
* `transferWithComment`
* `burn`
* `transferFrom`
* `transfer`
* `debitFrom`

