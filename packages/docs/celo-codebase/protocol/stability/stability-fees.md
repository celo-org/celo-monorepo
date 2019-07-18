# Stability Fees

### **Parameters Governing the Stability Fee**

`inflationFactor` the current value/units of Celo Dollars

`inflationRate` the value/unit change of Celo Dollars per period of time

`inflationPeriod` how long we wait between rounds of applying inflation

`lastUpdatedTime` when we last changed the inflationFactor

### **Timing, Frequency, and Amount of Fee**

The `inflationPeriod` is initially set to weekly, so as to provide a predictable schedule. Once more than one `inflationPeriod` has passed since the last update, the fee is applied as part of a transfer or other erc20 standard event

The `inflationFactor` is initially set to 0.5% annually. Taken over a one week `inflationPeriod`, this gives us an initial `inflationFactor` of \(1.005\)^\(1/55\)

Both the period/frequency as well as amount of the fee are specified for a given stable token at initialization and subject to changes based on governance decisions

### **Stability Fee Levied on Balance**

Each account’s C$ balance is stored as ‘units’, and a constant fraction `inflationFactor` describes the units/value of Celo dollars. Using these two constants, the monetary value of a given balance can be computed as follows

`Account C$ Value = Account C$ Units * (1 / inflationRate (units/value))`

When a transaction occurs, a modifier checks if the stability fee needs updating and, if so, the inflationFactor is updated

### **Updates to the Inflation Factor**

To apply periodic inflation, the inflation factor must be updated at regular intervals. Every time an event triggering an inflationFactor update\(eg a transfer\) occurs, the `updateInflationFactor` modifier is called \(pseudocode below\), which does the following:

1.  Decides if more than one inflationPeriod has passed since we last updated inflation rate
2.  If so, find out how many inflationPeriods have passed
3.  Compute the new inflation rate and update the last updated time:

`inflationFactor` = `inflationFactor` \* \(`inflationRate` ^ `# inflationPeriods since last update`\)

### **Changes to Inflation Factor**

Desired inflation rates may vary over time. When a new rate needs to be set, a governance proposal is required to update the inflation rate. If successful, the above function is called, which ensures `inflationFactor` is up to date, then updates the `inflationRate` and `inflationPeriod` parameters.

### **Inflation Factor Update Schedule**

The `updateInflationFactor` modifier is called by the following functions:

- `setInflationParameters`
- `approve`
- `mint`
- `transferWithComment`
- `burn`
- `transferFrom`
- `transfer`
- `debitFrom`
