import csv
import time
import os
import sys

# Expects a csv file with three columns:
#   timestamp:   integer, seconds from unix epoch
#   stableValue: integer or float, the amount of StableToken equal to the next column's
#                amount of GoldToken
#   goldValue:   integer or float, the amount of GoldToken equal to the previous column's
#                amount of StableToken
with open(sys.argv[1]) as rates:
  data = list(csv.reader(rates))

# Derive the index of the row to fetch for the current time
firstTimestamp = int(data[1][0])
interval = int(data[2][0]) - firstTimestamp
now = int(time.time())
currentIndex = ((now - firstTimestamp) // interval) + 1

timestamp, numerator, denominator = data[currentIndex]

reportCmd = f'yarn celocli oracle:report --token StableToken --numerator {numerator}'\
            f' --denominator {denominator} --from {sys.argv[2]}'
os.system(reportCmd)