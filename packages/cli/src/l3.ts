import { RPC_L3_ENDPOINT, RPC_L3_PASSWORD, RPC_L3_USER } from '@kyctoken/config';
const RPC_L3 = {
    url: RPC_L3_ENDPOINT,
    user: RPC_L3_USER,
    password: RPC_L3_PASSWORD
};
const RPC_L3_AXIOS: string = 'https://' + RPC_L3_USER + ':' + RPC_L3_PASSWORD + '@' + RPC_L3_ENDPOINT.replace('https://', '');

import { ethers } from 'ethers';
import axios from 'axios';

export function formatWinstonTime(ms: number): string {
    if (ms === undefined) return '';
    if (ms < 1000) return ms.toString() + ' ms';
    if (ms < 60 * 1000) return parseInt((ms / 1000).toString()).toString() + ' sec';
    if (ms < 60 * 60 * 1000) return parseInt((ms / 1000 / 60).toString()).toString() + ' min';
    return parseInt((ms / 1000 / 60 / 60).toString()).toString() + ' h';
}

export async function L3(): Promise<number> {
    const provider = new ethers.providers.JsonRpcProvider(RPC_L3);
    const balance = await provider.getBalance('0x1871c9CC2a3A5eB2108f567d87e60131E0EfD32f');
    console.log('Balance is', Number(balance) / 1000000000000000000);

    const block = await provider.getBlock('latest'); //"latest"

    const date = new Date(block.timestamp * 1000);
    const startTime = Date.now();
    const delay_ms = startTime - block.timestamp * 1000;
    const delay = formatWinstonTime(delay_ms);

    //console.log("Block:", block);
    console.log('Block:', block.number, 'minted', delay, 'ago at', date.toUTCString());
    if (delay_ms > 10 * 60 * 1000)
        console.log('Blockchain is not producing blocks, last block is', block.number, 'minted', delay, 'ago at', date.toUTCString());

    // txpool status
    const dataTxPool = {
        jsonrpc: '2.0',
        method: 'txpool_status',
        params: [],
        id: 1
    };

    const responseTxPool = await axios.post(RPC_L3_AXIOS, dataTxPool);
    console.log('txpool status:');
    console.log('    pending:', parseInt(responseTxPool.data.result.pending.toString()));
    console.log('    queued: ', parseInt(responseTxPool.data.result.queued.toString()));

    //clique status
    const data = { jsonrpc: '2.0', method: 'clique_status', params: [], id: 1 };

    const response = await axios.post(RPC_L3_AXIOS, data);
    console.log('clique status:', response.data.result);
    if (response.data.result.inturnPercent !== 100) console.log('Clique inturn percent is low: ', response.data.result.inturnPercent, '%');

    return <number>response.data.result.inturnPercent;
}
