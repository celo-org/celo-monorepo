pragma specify 0.1

methods {
	extractFunctionSignature() returns uint256
	extractMyFunctionSignature() returns uint256
}

rule checkMyFunctionSignatureExtraction {
	env e;
	assert sinvoke extractMyFunctionSignature(e) == 1259665493, "is not equal to 0x4b14f855";
}