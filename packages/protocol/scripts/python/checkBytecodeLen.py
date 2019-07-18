# TODO: implement in TS

import json
import os

buildPath = "./build/contracts"

bytecodeLimit = 24576

for fileName in os.listdir(buildPath):
  with open(buildPath + '/' + fileName, 'r') as f:
    contractData = json.load(f)
    contractLen = len(contractData["deployedBytecode"])
    if (contractLen / 2 > bytecodeLimit):
      print(fileName + " bytecode len of " + str(contractLen/2) + " too long")
