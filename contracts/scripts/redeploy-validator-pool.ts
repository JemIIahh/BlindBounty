import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const USDC = '0x3af9232009C5da30AdA366B6E09849A040162A1a';

  const ValidatorPool = await ethers.getContractFactory('ValidatorPool');
  const pool = await ValidatorPool.deploy(USDC);
  await pool.waitForDeployment();
  const addr = await pool.getAddress();
  console.log('ValidatorPool:', addr);
  console.log('Update VALIDATOR_POOL_ADDRESS in backend .env and frontend constants');
}

main().catch(console.error);
