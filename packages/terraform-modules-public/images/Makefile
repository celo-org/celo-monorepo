alfajores-full:
	packer build \
		-var 'sync_mode=full' \
		-var 'additional_params="--alfajores"' \
		-var 'network_name=alfajores' \
		-force node.json

alfajores-lightest:
	packer build \
		-var 'sync_mode=lightest' \
		-var 'additional_params="--alfajores"' \
		-var 'network_name=alfajores' \
		-force node.json

mainnet-full:
	packer build \
		-var 'sync_mode=full' \
		-var 'network_name=mainnet' \
		-force node.json

mainnet-lightest:
	packer build \
		-var 'sync_mode=lightest' \
		-var 'network_name=mainnet' \
		-force node.json

alfajores: alfajores-lightest alfajores-full

mainnet: mainnet-lightest mainnet-full

.PHONY: alfajores alfajores-full alfajores-lightest mainnet mainnet-full mainnet-lightest