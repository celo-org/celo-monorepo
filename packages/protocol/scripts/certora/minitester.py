import subprocess
import json
from testFunctions import *
import platform
import sys
import os
import csv
import glob

errors = ""
warnings = ""

def addError(errors, testName, rule, ruleResult, expectedResult="", funcName=""):
    errors += "Violation in "+testName+": "+rule
    if funcName != "":
        errors+=", " + funcName
    errors+=" result is "+ruleResult+"."
    if expectedResult != "":
        errors += "Should be "+expectedResult
    errors +="\n"
    return errors

# compare jar results with expected
# @param rulesResults is a dictionary that includes all the rule names and their results from the jar output
# @param expectedRulesResults is a dictionary that includes all the rule names and their results from tester file
# @param assertMessages is a dictionary that includes all the rule names and their assertion messages from the jar output
# @param expectedAssertionMessages is a dictionary that includes all the rule names and their assertion messages from tester file
# @param test is a boolean indicator of current test (test==false <=> at least one error occured)
def compareResultsWithExpected(testName, rulesResults, expectedRulesResults, assertMessages, expectedAssertionMessages, test):
    global errors
    global warnings
    
    if rulesResults != expectedRulesResults:
        for rule in rulesResults.keys():
            if rule in expectedRulesResults.keys():
                if type(rulesResults[rule]) == str: # flat rule ( ruleName: result )
                    if rulesResults[rule] != expectedRulesResults[rule]:
                        test = False
                        errors = addError(errors, testName, rule, rulesResults[rule], expectedRulesResults[rule])
                        
                else: # nested rule ( ruleName: {result1: [funcionts list], result2: [funcionts list] ... } )
                    expectedFuncSet = getFunctionsSet(expectedRulesResults[rule])
                    gotFuncSet = getFunctionsSet(rulesResults[rule])
                                        
                    #warnings = checkMissingFunctions(warnings, testName, rule, expectedFuncSet, gotFuncSet)
                    
                    for result, funcList in rulesResults[rule].items():
                        funcList.sort()
                        expectedRulesResults[rule][result].sort()
                        if funcList != expectedRulesResults[rule][result]: # compare functions sets (current results with expected)
                            for funcName in funcList:
                                # if funcion appears in current results but does not appear in the expected ones
                                if funcName not in expectedRulesResults[rule][result]: 
                                    test = False
                                    errors = addError(errors, testName, rule, result, "", funcName)
            else:
                test = False
                errors+= testName+", "+rule +" is not listed in 'rules'. Expected rules: " + ','.join(expectedRulesResults.keys()) + "\n"
    
    # if assertMessages field is defined (in tester)
    if expectedAssertionMessages:        
        for rule in expectedAssertionMessages.keys():
            if rule not in assertMessages: # current rule is missing from 'assertMessages' section in current results
                test = False
                errors+= testName+", rule \""+rule +"\" does not appear in the output. Please, remove unnecessary rules.\n"
            elif expectedAssertionMessages[rule] != assertMessages[rule]: # assertion messages are different from each other
                test = False
                errors+= testName+", rule \""+rule +"\": wrong assertion message. Got: \""+assertMessages[rule]+"\". Expected: \"" + expectedAssertionMessages[rule] + "\".\n"
    return test
    
def get_errors():
    return errors
    
