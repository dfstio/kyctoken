import { RPC_L3_ENDPOINT, RPC_L3_PASSWORD, RPC_L3_USER, KYC_L3_ADDRESS, KEY_OWNER } from '@kyctoken/config';
import { KERC20__factory } from '@kyctoken/hardhat';
import { KYC } from '@kyctoken/hardhat';

const RPC_L3 = {
    url: RPC_L3_ENDPOINT,
    user: RPC_L3_USER,
    password: RPC_L3_PASSWORD
};

import { ethers } from 'ethers';

export async function setLimit(account: string): Promise<KYC.KYCverificationStruct> {
    const provider = new ethers.providers.JsonRpcProvider(RPC_L3);
    const wallet = new ethers.Wallet(KEY_OWNER);
    const signer = wallet.connect(provider);
    //const bridge = new ethers.Contract(BRIDGE_L3, BridgeJSON, signer);
    const address = wallet.address;
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address} is ${Number(balance) / 1000000000000000000}`);

    const kyc = KERC20__factory.connect(KYC_L3_ADDRESS, signer);

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

    const limits: KYC.KYClimitStruct[] = [
        { amount: BigInt(1000) * BigInt(1e18), period: 60 },
        { amount: BigInt(10000) * BigInt(1e18), period: 600 }
    ];
    const currentTimestampInSeconds: number = Math.round(Date.now() / 1000);
    const ONE_DAY_IN_SECS: number = 24 * 60 * 60;
    const expiry: number = currentTimestampInSeconds + ONE_DAY_IN_SECS;
    const verification: KYC.KYCverificationStruct = { expiry, limits };
    const operation = 0;

    const tx = await kyc.addVerification(account, operation, verification);
    console.log('TX sent: ', tx.hash);
    const receipt = await tx.wait(2);
    console.log('Transaction block:', receipt.blockNumber);
    const check1 = await kyc.kycTest(account, operation, BigInt(0.5 * 1e18));
    console.log(`Check KYC ${KYC_L3_ADDRESS} for 0.5 is ${check1}`);

    const check2 = await kyc.kycTest(account, operation, BigInt(10 * 1e18));
    console.log(`Check KYC ${KYC_L3_ADDRESS} for 10 is ${check2}`);

    return verification;
}
