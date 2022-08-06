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
https://mumbai.polygonscan.com/address/0x91478CfAFbD29F4c89CD2e4e89506AFFb89651df  

## Usage:
```
Usage (from kyctoken folder): kyc [options] [command]

```


## TODO
