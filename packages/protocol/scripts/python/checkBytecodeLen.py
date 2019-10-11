# TODO: implement in TS

import json
import os

buildPath = "./build/contracts"

bytecodeLimit = 2**15 + 2**14 # note: doubled from Ethereum's bytecode limit
print("Limit: " + str(bytecodeLimit))

for fileName in os.listdir(buildPath):
  with open(buildPath + '/' + fileName, 'r') as f:
    contractData = json.load(f)
    contractLen = len(contractData["deployedBytecode"]) / 2
    if contractLen > bytecodeLimit:
      print("\t" + fileName + " bytecode len of " + str(contractLen))
    else:
      print(fileName + " bytecode len of " + str(contractLen))
