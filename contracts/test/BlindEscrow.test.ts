import { expect } from "chai";
import { ethers } from "hardhat";
import { BlindEscrow, BlindReputation, TaskRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BlindEscrow", function () {
  let escrow: BlindEscrow;
  let token: any;
  let admin: HardhatEthersSigner;
  let agent: HardhatEthersSigner;
  let worker: HardhatEthersSigner;
  let verifier: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  const TASK_HASH = ethers.keccak256(ethers.toUtf8Bytes("encrypted-task-blob"));
  const EVIDENCE_HASH = ethers.keccak256(ethers.toUtf8Bytes("encrypted-evidence"));
  const AMOUNT = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)

  beforeEach(async function () {
    [admin, agent, worker, verifier, treasury] = await ethers.getSigners();

    // Deploy mock ERC-20 token
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy("Mock USDC", "MUSDC", 6);

    // Mint tokens to agent
    await token.mint(agent.address, ethers.parseUnits("10000", 6));

    // Deploy escrow
    const Escrow = await ethers.getContractFactory("BlindEscrow");
    escrow = await Escrow.deploy(treasury.address, verifier.address);

    // Agent approves escrow to spend tokens
    await token.connect(agent).approve(await escrow.getAddress(), ethers.MaxUint256);
  });

  describe("createTask", function () {
    it("should create a task and lock funds", async function () {
      const tx = await escrow.connect(agent).createTask(
        TASK_HASH, await token.getAddress(), AMOUNT, "photography", "Lagos, Nigeria"
      );

      const task = await escrow.getTask(1);
      expect(task.agent).to.equal(agent.address);
      expect(task.worker).to.equal(ethers.ZeroAddress);
      expect(task.amount).to.equal(AMOUNT);
      expect(task.taskHash).to.equal(TASK_HASH);
      expect(task.status).to.equal(0); // Funded
      expect(task.category).to.equal("photography");
      expect(task.locationZone).to.equal("Lagos, Nigeria");

      // Funds moved to contract
      expect(await token.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);

      // Event emitted
      await expect(tx).to.emit(escrow, "TaskCreated")
        .withArgs(1, agent.address, await token.getAddress(), AMOUNT, TASK_HASH, "photography", "Lagos, Nigeria");
    });

    it("should reject zero amount", async function () {
      await expect(
        escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), 0, "test", "test")
      ).to.be.revertedWith("amount must be > 0");
    });

    it("should reject empty task hash", async function () {
      await expect(
        escrow.connect(agent).createTask(ethers.ZeroHash, await token.getAddress(), AMOUNT, "test", "test")
      ).to.be.revertedWith("empty task hash");
    });

    it("should increment task IDs", async function () {
      await escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), AMOUNT, "a", "b");
      await escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), AMOUNT, "c", "d");

      const task1 = await escrow.getTask(1);
      const task2 = await escrow.getTask(2);
      expect(task1.category).to.equal("a");
      expect(task2.category).to.equal("c");
    });
  });

  describe("assignWorker", function () {
    beforeEach(async function () {
      await escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), AMOUNT, "photo", "Lagos");
    });

    it("should assign a worker", async function () {
      const tx = await escrow.connect(agent).assignWorker(1, worker.address);

      const task = await escrow.getTask(1);
      expect(task.worker).to.equal(worker.address);
      expect(task.status).to.equal(1); // Assigned

      await expect(tx).to.emit(escrow, "WorkerAssigned").withArgs(1, worker.address);
    });

    it("should reject non-agent", async function () {
      await expect(
        escrow.connect(worker).assignWorker(1, worker.address)
      ).to.be.revertedWith("not agent");
    });

    it("should reject zero address worker", async function () {
      await expect(
        escrow.connect(agent).assignWorker(1, ethers.ZeroAddress)
      ).to.be.revertedWith("invalid worker");
    });
  });

  describe("submitEvidence", function () {
    beforeEach(async function () {
      await escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), AMOUNT, "photo", "Lagos");
      await escrow.connect(agent).assignWorker(1, worker.address);
    });

    it("should submit evidence", async function () {
      const tx = await escrow.connect(worker).submitEvidence(1, EVIDENCE_HASH);

      const task = await escrow.getTask(1);
      expect(task.evidenceHash).to.equal(EVIDENCE_HASH);
      expect(task.status).to.equal(2); // Submitted

      await expect(tx).to.emit(escrow, "EvidenceSubmitted").withArgs(1, worker.address, EVIDENCE_HASH);
    });

    it("should reject non-worker", async function () {
      await expect(
        escrow.connect(agent).submitEvidence(1, EVIDENCE_HASH)
      ).to.be.revertedWith("not worker");
    });
  });

  describe("completeVerification (pass)", function () {
    beforeEach(async function () {
      await escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), AMOUNT, "photo", "Lagos");
      await escrow.connect(agent).assignWorker(1, worker.address);
      await escrow.connect(worker).submitEvidence(1, EVIDENCE_HASH);
    });

    it("should release 85% to worker and 15% to treasury", async function () {
      const workerBefore = await token.balanceOf(worker.address);
      const treasuryBefore = await token.balanceOf(treasury.address);

      await escrow.connect(verifier).completeVerification(1, true);

      const task = await escrow.getTask(1);
      expect(task.status).to.equal(4); // Completed

      const expectedFee = (AMOUNT * 1500n) / 10000n; // 15%
      const expectedPayout = AMOUNT - expectedFee; // 85%

      expect(await token.balanceOf(worker.address)).to.equal(workerBefore + expectedPayout);
      expect(await token.balanceOf(treasury.address)).to.equal(treasuryBefore + expectedFee);
      expect(await token.balanceOf(await escrow.getAddress())).to.equal(0);
    });

    it("should reject non-verifier", async function () {
      await expect(
        escrow.connect(agent).completeVerification(1, true)
      ).to.be.revertedWith("not verifier");
    });
  });

  describe("completeVerification (fail)", function () {
    beforeEach(async function () {
      await escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), AMOUNT, "photo", "Lagos");
      await escrow.connect(agent).assignWorker(1, worker.address);
      await escrow.connect(worker).submitEvidence(1, EVIDENCE_HASH);
    });

    it("should set status to Verified but not release funds on fail", async function () {
      await escrow.connect(verifier).completeVerification(1, false);

      const task = await escrow.getTask(1);
      expect(task.status).to.equal(3); // Verified (not Completed)

      // Funds still in contract
      expect(await token.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);
    });
  });

  describe("cancelTask", function () {
    beforeEach(async function () {
      await escrow.connect(agent).createTask(TASK_HASH, await token.getAddress(), AMOUNT, "photo", "Lagos");
    });

    it("should refund agent on cancel", async function () {
      const before = await token.balanceOf(agent.address);

      const tx = await escrow.connect(agent).cancelTask(1);

      const task = await escrow.getTask(1);
      expect(task.status).to.equal(5); // Cancelled

      expect(await token.balanceOf(agent.address)).to.equal(before + AMOUNT);
      expect(await token.balanceOf(await escrow.getAddress())).to.equal(0);

      await expect(tx).to.emit(escrow, "TaskCancelled").withArgs(1, AMOUNT);
    });

    it("should reject cancel after assignment", async function () {
      await escrow.connect(agent).assignWorker(1, worker.address);

      await expect(
        escrow.connect(agent).cancelTask(1)
      ).to.be.revertedWith("can only cancel funded tasks");
    });

    it("should reject non-agent cancel", async function () {
      await expect(
        escrow.connect(worker).cancelTask(1)
      ).to.be.revertedWith("not agent");
    });
  });

  describe("admin functions", function () {
    it("should set fee bps", async function () {
      await escrow.connect(admin).setFeeBps(2000); // 20%
      expect(await escrow.feeBps()).to.equal(2000);
    });

    it("should reject fee above max", async function () {
      await expect(
        escrow.connect(admin).setFeeBps(3001)
      ).to.be.revertedWith("fee exceeds max");
    });

    it("should reject non-admin", async function () {
      await expect(
        escrow.connect(agent).setFeeBps(1000)
      ).to.be.revertedWith("not admin");
    });
  });
});
