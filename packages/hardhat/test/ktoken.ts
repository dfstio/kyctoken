import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';

//import { KERC20__factory } from '@kyctoken/hardhat';
import { KYC } from '@kyctoken/hardhat';

enum Operation {
    TransferFrom,
    TransferTo
}

describe('KERC20 - hardhat', function () {
    this.timeout(10000);
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshopt in every test.
    async function deployToken() {
        // Contracts are deployed using the first signer/account by default
        const [owner] = await ethers.getSigners();
        const price = 1000;

        const Contract = await ethers.getContractFactory('KERC20');
        const contract = await Contract.deploy('KYC token TST', 'KTST', BigInt(1e9) * BigInt(1e18), price);

        return { contract, owner, price };
    }

    async function limit1() {
        const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
        const ONE_MONTH_IN_SECS = 30 * 24 * 60 * 60;
        const ONE_DAY_IN_SECS = 24 * 60 * 60;
        //const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

        // Contracts are deployed using the first signer/account by default
        const [owner, account1, account2] = await ethers.getSigners();
        const price = 1000;

        const Contract = await ethers.getContractFactory('KERC20');
        const contract = await Contract.deploy('KYC token TST', 'KTST', BigInt(1e9) * BigInt(1e18), price);
        await contract.mint(account1.address, ethers.utils.parseEther('1000'));
        await contract.mint(account2.address, ethers.utils.parseEther('1000'));
        const limits: KYC.KYClimitStruct[] = [{ amount: ethers.utils.parseEther('10000'), period: ONE_DAY_IN_SECS }];
        const currentTimestampInSeconds: number = await time.latest();
        const expiry: number = currentTimestampInSeconds + ONE_YEAR_IN_SECS;
        const verification: KYC.KYCverificationStruct = { expiry, limits };
        await contract.addVerification(account1.address, Operation.TransferFrom, verification);
        await contract.addVerification(account1.address, Operation.TransferTo, verification);
        await contract.addVerification(account2.address, Operation.TransferFrom, verification);
        await contract.addVerification(account2.address, Operation.TransferTo, verification);
        return { contract, owner, account1, account2 };
    }

    async function limit2() {
        const TWO_YEARS_IN_SECS = 2 * 365 * 24 * 60 * 60;
        const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
        const ONE_MONTH_IN_SECS = 30 * 24 * 60 * 60;
        const ONE_DAY_IN_SECS = 24 * 60 * 60;
        //const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

        // Contracts are deployed using the first signer/account by default
        const [owner, account1, account2] = await ethers.getSigners();
        const price = 1000;

        const Contract = await ethers.getContractFactory('KERC20');
        const contract = await Contract.deploy('KYC token TST', 'KTST', BigInt(1e9) * BigInt(1e18), price);
        await contract.mint(account1.address, ethers.utils.parseEther('100000'));
        await contract.mint(account2.address, ethers.utils.parseEther('100000'));
        const limits: KYC.KYClimitStruct[] = [
            { amount: ethers.utils.parseEther('10000'), period: ONE_DAY_IN_SECS },
            { amount: ethers.utils.parseEther('30000'), period: ONE_MONTH_IN_SECS },
            { amount: ethers.utils.parseEther('100000'), period: ONE_YEAR_IN_SECS }
        ];
        const currentTimestampInSeconds: number = await time.latest();
        const expiry: number = currentTimestampInSeconds + TWO_YEARS_IN_SECS;
        const verification: KYC.KYCverificationStruct = { expiry, limits };
        await contract.addVerification(account1.address, Operation.TransferFrom, verification);
        await contract.addVerification(account1.address, Operation.TransferTo, verification);
        await contract.addVerification(account2.address, Operation.TransferFrom, verification);
        await contract.addVerification(account2.address, Operation.TransferTo, verification);
        return { contract, owner, account1, account2 };
    }

    async function init() {
        return await loadFixture(deployToken);
    }

    async function initLimit1() {
        return await loadFixture(limit1);
    }

    async function initLimit2() {
        return await loadFixture(limit2);
    }

    describe('Deployment', function () {
        it('Should set the right price', async function () {
            const { contract, owner, price } = await init();

            expect(await contract.getPrice()).to.equal(price);
        });

        it('Should set the right owner', async function () {
            const { contract, owner, price } = await init();

            expect(await contract.owner()).to.equal(owner.address);
        });
    });

    describe('Transfers - limit1', function () {
        it('Should transfer first 4000', async function () {
            const { contract, owner, account1, account2 } = await initLimit1();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });

        it('Should transfer second 4000', async function () {
            const { contract, owner, account1, account2 } = await initLimit1();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });
        it('Should refuse to transfer third 4000', async function () {
            const { contract, owner, account1, account2 } = await initLimit1();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'TransferFailed')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });
        it('Should transfer third 4000 in next day', async function () {
            const { contract, owner, account1, account2 } = await initLimit1();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            const currentTimestampInSeconds: number = await time.latest();
            const ONE_DAY_IN_SECS = 24 * 60 * 60;
            await time.increaseTo(currentTimestampInSeconds + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });
        it('Should not transfer after 2 years', async function () {
            const { contract, owner, account1, account2 } = await initLimit1();
            const TWO_YEARS_IN_SECS = 2 * 365 * 24 * 60 * 60;
            await time.increaseTo((await time.latest()) + TWO_YEARS_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'TransferFailed')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });

        
    });

    describe('Transfers - limit2', function () {
        it('Should transfer first 4000', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });

        it('Should transfer second 4000', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });
        it('Should refuse to transfer third 4000', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'TransferFailed')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });
        it('Should transfer third 4000 in next day', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            const currentTimestampInSeconds: number = await time.latest();
            const ONE_DAY_IN_SECS = 24 * 60 * 60;
            await time.increaseTo(currentTimestampInSeconds + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
        });

        it('Should transfer third 10000 in next day', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            const currentTimestampInSeconds: number = await time.latest();
            const ONE_DAY_IN_SECS = 24 * 60 * 60;
            await time.increaseTo(currentTimestampInSeconds + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));
        });

        it('Should not transfer third 11000 in next day', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('4')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('4'));
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('5')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('5'));
            const currentTimestampInSeconds: number = await time.latest();
            const ONE_DAY_IN_SECS = 24 * 60 * 60;
            await time.increaseTo(currentTimestampInSeconds + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('11')))
                .to.emit(contract, 'TransferFailed')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('11'));
        });
        it('Should not transfer 40000 in one month', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));
            const currentTimestampInSeconds: number = await time.latest();
            const ONE_DAY_IN_SECS = 24 * 60 * 60;

            await time.increaseTo((await time.latest()) + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));

            await time.increaseTo((await time.latest()) + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));

            await time.increaseTo((await time.latest()) + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'TransferFailed')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));
        });
        
                it('Should transfer 40000 next year', async function () {
            const { contract, owner, account1, account2 } = await initLimit2();
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));
            const currentTimestampInSeconds: number = await time.latest();
            const ONE_DAY_IN_SECS = 24 * 60 * 60;

            await time.increaseTo((await time.latest()) + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));

            await time.increaseTo((await time.latest()) + ONE_DAY_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));

			const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
            await time.increaseTo((await time.latest()) + ONE_YEAR_IN_SECS);
            await expect(contract.connect(account1).transfer(account2.address, ethers.utils.parseEther('10')))
                .to.emit(contract, 'Transfer')
                .withArgs(account1.address, account2.address, ethers.utils.parseEther('10'));
        });

    });
});
