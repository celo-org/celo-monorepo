import csv
import json
from decimal import *

HOUR = 60 * 60
DAY = HOUR * 24
YEAR = DAY * 365
MONTH = YEAR / 12

def constructObject(row):
  grant = {}
  grant['identifier'] = 'TODO'
  grant['releaseStartTime'] = row[6]
  vestingSchedule = row[10]
  grant['releaseCliffTimek] = int(row[12])
  grant['numReleasePeriods'] = int(row[11])
  grant['releasePeriod'] = int(row[13])
  totalGrant = Decimal(row[3].replace(',',''))
  grant['amountReleasedPerPeriod'] = str(round(totalGrant / Decimal(grant['numReleasePeriods']), 18))
  grant['revocable'] = True
  grant['beneficiary'] = row[2]
  grant['releaseOwner'] = '0x65578A43610f2Ccb46A283f325AB47F1bd9D687C'
  grant['refundAddress'] = '0x671D520ae3E89Ea5383A5d7162bCed79FD25CdEe'
  grant['subjectToLiquidityProvision'] = True
  grant['initialDistributionRatio'] = 1000
  grant['canValidate'] = False
  grant['canVote'] = True
  return grant

with open('grant_csvs/apiraus.csv', newline='') as grants:
  with open('grant_jsons/aProtocolRAU.json', 'w') as outfile:
    spamreader = csv.reader(grants, delimiter=',')
    result = []
    i = 0
    for row in spamreader:
      if i < 4 or i > 7:
        i += 1
        continue
      grant = constructObject(row)
      result.append(grant)
      i += 1

    json.dump(result, outfile, indent=2)

  