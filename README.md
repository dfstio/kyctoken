# ERC20 token with KYC controls


## Installation

You need to install node and git. 

Install [hardhat](https://hardhat.org/getting-started/#installation) that is used for solidity contracts
	
	npm install --save-dev hardhat

and finally clone this repo

	git clone https://github.com/Benjamin-Herald/kyctoken
	cd kyctoken
	yarn

Put config.ts file with configuration into packages/config directory using template as example

Make sure that kyc command is executable by running from kyctoken folder

	chmod +x ./packages/cli/src/cli.ts
	npm link

Faucets:   
https://goerlifaucet.com/  
https://mumbaifaucet.com/



## Contracts

KYC contract is deployed to mumbai network at address 
https://mumbai.polygonscan.com/address/ 

## Usage:
```
Usage (from kyctoken folder): kyc [options] [command]

```


## TODO

QUOTER_ADDRESSES: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
pool: 0x7512e2646c841886edf12c29864e88a2243dc7ed
uniswap: 0xc36442b4a4522e871399cd717abdd847ab11fe88
