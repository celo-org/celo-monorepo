from test import compareResultsWithExpected,errors
import json

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
		result = compareResultsWithExpected("test",actual,expected,[],None,testres)
		print(result)
		sys.exit(0 if result else 1)

