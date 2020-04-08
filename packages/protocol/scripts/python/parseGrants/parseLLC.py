import csv
import json
from decimal import *
rate = Decimal("13.479466930217200000")

def constructObject(row, total):
  grant = {}
  grant["releaseStartTime"] = row[15]
  grant["releaseCliffTime"] = int(row[10])
  grant["numReleasePeriods"] = int(row[11])
  grant["releasePeriod"] = int(row[12])
  totalUnits = Decimal(str(row[5]).replace(',', ''))
  goldPrecise = rate * totalUnits
  amountReleasedPerPeriod = round(goldPrecise/Decimal(grant["numReleasePeriods"]), 18)
  total += round(goldPrecise, 18)
  grant["amountReleasedPerPeriod"] = str(amountReleasedPerPeriod)
  grant["revocable"] = True if row[1] == "Yes" else False
  grant['beneficiary'] = row[0]
  grant["releaseOwner"] = "0xF5791e83c2e78b6E2E6d37Af861ac663d7ec04fa"
  grant["refundAddress"] = "0x0000000000000000000000000000000000000000" if not grant["revocable"] else "0xe90bB6dE0996D41cb0A843A06839EEf38c6E5456"
  grant["subjectToLiquidityProvision"] = False
  grant["initialDistributionRatio"] = 0
  grant["canValidate"] = True if row[2] == "Yes" else False
  grant["canVote"] = True
  return grant, total

with open('grant_csvs/llcunits.csv', newline='') as grants:
  with open('grant_jsons/llcUnitsCanValidate.json', 'w') as outfileCanValidate:
    with open('grant_jsons/llcUnitsCannotValidate.json', 'w') as outfileCannotValidate:
      spamreader = csv.reader(grants, delimiter=',')
      canValidate = []
      cannotValidate = []
      total = Decimal(0)
      i = 0
      for row in spamreader:
        if i < 7 or i > 118:
          i += 1
          continue
        grant, total = constructObject(row, total)
        if grant:
          if grant['canValidate']:
            canValidate.append(grant)
          else:
            cannotValidate.append(grant)
        i += 1
      json.dump(canValidate, outfileCanValidate, indent=2)
      json.dump(cannotValidate, outfileCannotValidate, indent=2)
      print(Decimal("200000000") - total)

  