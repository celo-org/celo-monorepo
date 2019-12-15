from minitester import compareResultsWithExpected,get_errors
import json
import sys

args = sys.argv[1:]
actualFilename=args[0]
expectedFilename=args[1]

print("Actual file: %s" % (actualFilename))
print("Expected file: %s" % (expectedFilename))

with open(actualFilename) as actualFile:
	with open(expectedFilename) as expectedFile:
		actual = json.load(actualFile)
		expected = json.load(expectedFile)

		testres = True
		result = compareResultsWithExpected("test",actual["rules"],expected["rules"],actual["assertMessages"],expected["assertMessages"],testres)
		print(result)
		print(get_errors())
		sys.exit(0 if result else 1)

