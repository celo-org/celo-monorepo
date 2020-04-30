
def getFunctionsSet(ruleSettings):
    # ruleSettings must include "FAIL" and "SUCCESS" sections
    if type(ruleSettings) == str:
        raise Exception("Expected a list for rule results, not a string %s" % (ruleSettings))
    functionSet = set(ruleSettings["FAIL"]) | set(ruleSettings["SUCCESS"])
    if "UNKNOWN" in ruleSettings:
        functionSet |= set(ruleSettings["UNKNOWN"])
    if "TIMEOUT" in ruleSettings:
        functionSet |= set(ruleSettings["TIMEOUT"])
    return functionSet
