import csv
import json
from decimal import *

HOUR = 60 * 60
DAY = HOUR * 24
YEAR = DAY * 365
MONTH = YEAR / 12

def constructObject(row):
  grant = {}
  grant["releaseStartTime"] = row[8]
  grant["releaseCliffTime"] = int(row[7])
  grant["numReleasePeriods"] = int(row[9])
  grant["releasePeriod"] = int(row[6])
  totalGrant = Decimal(row[1].replace(',',''))
  grant["amountReleasedPerPeriod"] = str(round(totalGrant / Decimal(grant["numReleasePeriods"]), 18))
  grant["revocable"] = False
  grant['beneficiary'] = row[0]
  grant["releaseOwner"] = "0x2045001945af0C8DDa9DC50ab652723CD85fb6DB"
  grant["refundAddress"] = "0x0000000000000000000000000000000000000000"
  grant["subjectToLiquidityProvision"] = False
  grant["initialDistributionRatio"] = 1000
  grant["canValidate"] = True
  grant["canVote"] = True
  return grant

with open('grant_csvs/regd.csv', newline='') as grants:
  with open('grant_jsons/aProtocolRegD.json', 'w') as outfile:
    spamreader = csv.reader(grants, delimiter=',')
    result = []
    i = 0
    for row in spamreader:
      if i < 10 or i > 30:
        i += 1
        continue
      grant = constructObject(row)
      result.append(grant)
      i += 1

    json.dump(result, outfile, indent=2)

  