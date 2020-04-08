import csv
import json
from decimal import *

HOUR = 60 * 60
DAY = HOUR * 24
YEAR = DAY * 365
MONTH = YEAR / 12

def constructObject(row):
  grant = {}
  print(row)
  grant["releaseStartTime"] = row[19]
  grant["releaseCliffTime"] = int(row[18])
  grant["numReleasePeriods"] = int(row[17])
  grant["releasePeriod"] = int(row[16])
  totalGrant = Decimal(row[4].replace(',',''))
  grant["amountReleasedPerPeriod"] = str(round(totalGrant / Decimal(grant["numReleasePeriods"]), 18))
  grant["revocable"] = True
  grant['beneficiary'] = row[0]
  grant["releaseOwner"] = "0x4C3796289e3EF4fA93F0eD891d03210582Ce3DE3"
  grant["refundAddress"] = "0x6E36F0D3cF12aa592FF88D03938584562c9239cA"
  grant["subjectToLiquidityProvision"] = True
  grant["initialDistributionRatio"] = 1000
  grant["canValidate"] = False
  grant["canVote"] = True
  return grant

with open('grant_csvs/clabsraus.csv', newline='') as grants:
  with open('grant_jsons/cLabsRAU.json', 'w') as outfile:
    spamreader = csv.reader(grants, delimiter=',')
    result = []
    i = 0
    for row in spamreader:
      if i < 14 or i > 88:
        i += 1
        continue
      grant = constructObject(row)
      result.append(grant)
      i += 1

    json.dump(result, outfile, indent=2)

  