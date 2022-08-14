import { RPC_L3_ENDPOINT, RPC_L3_PASSWORD, RPC_L3_USER, KYC_L3_ADDRESS, KEY_OWNER, RPC_MUMBAI, TRADER_ADDRESS } from '@kyctoken/config';
import { KERC20__factory } from '@kyctoken/hardhat';
import { KYC } from '@kyctoken/hardhat';
import { mumbaiGas } from './mumbai';
import tokens from '@kyctoken/config/mumbai-tokens.json';

const RPC_L3 = {
    url: RPC_L3_ENDPOINT,
    user: RPC_L3_USER,
    password: RPC_L3_PASSWORD
};

enum Operation {
    TransferFrom,
    TransferTo
}

import { ethers } from 'ethers';

export async function trader(): Promise<void> {
    await setLimit(TRADER_ADDRESS, true);
}

export async function setLimit(account: string, isTrader: boolean = false): Promise<void> {
    const provider: ethers.providers.Provider = new ethers.providers.JsonRpcProvider(RPC_MUMBAI);
    const wallet: ethers.Wallet = new ethers.Wallet(KEY_OWNER);
    const signer: ethers.Wallet = wallet.connect(provider);
    const address: string = wallet.address;
    const balance: ethers.BigNumber = await provider.getBalance(address);
    console.log(`Balance of ${address} is ${ethers.utils.formatEther(balance)}, setting now limits to ${account}:`);

    for (let i = 0; i < tokens.length; i++) {
        console.log(tokens[i].token, ':');
        await limit(account, tokens[i].address, Operation.TransferFrom, signer, isTrader);
        await limit(account, tokens[i].address, Operation.TransferTo, signer, isTrader);
    }
}

/*
    export type KYClimitStruct = {
	   amount: PromiseOrValue<BigNumberish>;
	   period: PromiseOrValue<BigNumberish>;
	 };


	 export type KYCverificationStruct = {
	   expiry: PromiseOrValue<BigNumberish>;
	   limits: KYC.KYClimitStruct[];
	 };
	 
	  addVerification(
		account: PromiseOrValue<string>,
		operation: PromiseOrValue<BigNumberish>,
		_verification: KYC.KYCverificationStruct,
		overrides?: Overrides & { from?: PromiseOrValue<string> }
	  ): Promise<ContractTransaction>;


	  precheck(
		account: PromiseOrValue<string>,
		operation: PromiseOrValue<BigNumberish>,
		amount: PromiseOrValue<BigNumberish>,
		overrides?: CallOverrides
	  ): Promise<[boolean, string] & { result: boolean; reason: string }>;

 	*/

async function limit(
    account: string,
    contract: string,
    operation: Operation,
    signer: ethers.Wallet,
    isTrader: boolean
): Promise<KYC.KYCverificationStruct> {
    const kyc = KERC20__factory.connect(contract, signer);
    const limits: KYC.KYClimitStruct[] = isTrader
        ? [{ amount: ethers.utils.parseEther('1000000'), period: 60 }]
        : [
              { amount: ethers.utils.parseEther('1000'), period: 60 },
              { amount: ethers.utils.parseEther('10000'), period: 600 }
          ];
    const currentTimestampInSeconds: number = Math.round(Date.now() / 1000);
    const ONE_DAY_IN_SECS: number = 24 * 60 * 60;
    const expiry: number = currentTimestampInSeconds + ONE_DAY_IN_SECS;
    const verification: KYC.KYCverificationStruct = { expiry, limits };
    try {
        const tx = await kyc.addVerification(account, operation, verification, await mumbaiGas());

        console.log(
            `TX sent to contract ${contract} for address ${account}, operation ${operation === Operation.TransferFrom ? 'from' : 'to'}: `,
            tx.hash
        );
        const receipt = await tx.wait(2);
        console.log('Transaction block:', receipt.blockNumber);
        const check1 = await kyc.kycTest(account, operation, BigInt(0.5 * 1e18));
        console.log(`Check KYC for 0.5 is ${check1}`);

        const check2 = await kyc.kycTest(account, operation, BigInt(10 * 1e18));
        console.log(`Check KYC for 10 is ${check2}`);
    } catch (error) {
        console.error('catch', (<any>error).toString().substr(0, 500));
    }

    return verification;
}
