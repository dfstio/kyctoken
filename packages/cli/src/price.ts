import { RPC_L3_ENDPOINT, RPC_L3_PASSWORD, RPC_L3_USER, KYC_L3_ADDRESS, KEY_OWNER } from '@kyctoken/config';
import { KYC__factory } from '@kyctoken/hardhat';
//import { KYC } from '@kyctoken/hardhat';

const RPC_L3 = {
    url: RPC_L3_ENDPOINT,
    user: RPC_L3_USER,
    password: RPC_L3_PASSWORD
};

import { ethers } from 'ethers';

export async function setPrice(price: number): Promise<number> {
    const provider = new ethers.providers.JsonRpcProvider(RPC_L3);
    const wallet = new ethers.Wallet(KEY_OWNER);
    const signer = wallet.connect(provider);
    //const bridge = new ethers.Contract(BRIDGE_L3, BridgeJSON, signer);
    const address = wallet.address;
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address} is ${Number(balance) / 1000000000000000000}`);

    const kyc = KYC__factory.connect(KYC_L3_ADDRESS, signer);
    const oldPrice = await kyc.getPrice();
    console.log(`Old price in KYC ${KYC_L3_ADDRESS} is ${Number(oldPrice)}`);
    const tx = await kyc.setPrice(price);
    console.log('TX sent: ', tx.hash);
    const receipt = await tx.wait(2);
    console.log('Transaction block:', receipt.blockNumber);
    const newPrice = await kyc.getPrice();
    console.log(`New price in KYC ${KYC_L3_ADDRESS} is ${Number(newPrice)}`);

    return Number(newPrice);
}
