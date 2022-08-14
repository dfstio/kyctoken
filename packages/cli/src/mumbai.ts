import axios from 'axios';
import { ethers } from 'ethers';

export interface Gas {
    maxFeePerGas: ethers.BigNumber;
    maxPriorityFeePerGas: ethers.BigNumber;
}

export async function mumbaiGas(multiplier: number = 2): Promise<Gas> {
    const isProd = false;
    const { data } = await axios({
        method: 'get',
        url: isProd ? 'https://gasstation-mainnet.matic.network/v2' : 'https://gasstation-mumbai.matic.today/v2'
    });
    console.log('Mumbai current gas rate:', data.fast.maxFee.toFixed(0));
    const gas: Gas = {
        maxFeePerGas: ethers.utils.parseUnits(`${Math.ceil(data.fast.maxFee * multiplier)}`, 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits(`${Math.ceil(data.fast.maxPriorityFee * multiplier)}`, 'gwei')
    };
    return gas;
}
