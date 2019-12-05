import subprocess
import json
#import re
from testFunctions import *
import platform
import sys
import os
import csv
import glob

# compare jar results with expected
# @param rulesResults is a dictionary that includes all the rule names and their results from the jar output
# @param expectedRulesResults is a dictionary that includes all the rule names and their results from tester file
# @param assertMessages is a dictionary that includes all the rule names and their assertion messages from the jar output
# @param expectedAssertionMessages is a dictionary that includes all the rule names and their assertion messages from tester file
# @param test is a boolean indicator of current test (test==false <=> at least one error occured)
def compareResultsWithExpected(testName, rulesResults, expectedRulesResults, assertMessages, expectedAssertionMessages, test):
    
    if rulesResults != expectedRulesResults:
        for rule in rulesResults.keys():
            if rule in expectedRulesResults.keys():
                if type(rulesResults[rule]) == str: # flat rule ( ruleName: result )
                    if rulesResults[rule] != expectedRulesResults[rule]:
                        test = False
                        
                else: # nested rule ( ruleName: {result1: [funcionts list], result2: [funcionts list] ... } )
                    expectedFuncSet = getFunctionsSet(expectedRulesResults[rule])
                    gotFuncSet = getFunctionsSet(rulesResults[rule])
                                        
                    for result, funcList in rulesResults[rule].items():
                        if funcList.sort() != expectedRulesResults[rule][result].sort(): # compare functions sets (current results with expected)
                            for funcName in funcList:
                                # if funcion appears in current results but does not appear in the expected ones
                                if funcName not in expectedRulesResults[rule][result]: 
                                    test = False
            else:
                test = False
    
    # if assertMessages field is defined (in tester)
    if expectedAssertionMessages:        
        for rule in expectedAssertionMessages.keys():
            if rule not in assertMessages: # current rule is missing from 'assertMessages' section in current results
                test = False
            elif expectedAssertionMessages[rule] != assertMessages[rule]: # assertion messages are different from each other
                test = False
    return test
    
    
