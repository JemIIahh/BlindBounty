import { expect } from "chai";
import { ethers } from "hardhat";
import { BlindReputation } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BlindReputation", function () {
  let reputation: BlindReputation;
  let admin: HardhatEthersSigner;
  let escrow: HardhatEthersSigner; // simulates authorized rater (escrow contract)
  let worker: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, escrow, worker, stranger] = await ethers.getSigners();

    const Rep = await ethers.getContractFactory("BlindReputation");
    reputation = await Rep.deploy();

    // Authorize escrow as rater
    await reputation.connect(admin).authorizeRater(escrow.address);
  });

  describe("rate", function () {
    it("should record a rating", async function () {
      const tx = await reputation.connect(escrow).rate(worker.address, 5);

      const [tasksCompleted, avgScore, disputes] = await reputation.getReputation(worker.address);
      expect(tasksCompleted).to.equal(1);
      expect(avgScore).to.equal(500); // 5.00 scaled by 100
      expect(disputes).to.equal(0);

      await expect(tx).to.emit(reputation, "Rated").withArgs(worker.address, escrow.address, 5);
    });

    it("should compute average over multiple ratings", async function () {
      await reputation.connect(escrow).rate(worker.address, 5);
      await reputation.connect(escrow).rate(worker.address, 3);

      const [tasksCompleted, avgScore] = await reputation.getReputation(worker.address);
      expect(tasksCompleted).to.equal(2);
      expect(avgScore).to.equal(400); // (5+3)/2 = 4.00 → 400
    });

    it("should reject score below 1", async function () {
      await expect(
        reputation.connect(escrow).rate(worker.address, 0)
      ).to.be.revertedWith("score must be 1-5");
    });

    it("should reject score above 5", async function () {
      await expect(
        reputation.connect(escrow).rate(worker.address, 6)
      ).to.be.revertedWith("score must be 1-5");
    });

    it("should reject unauthorized rater", async function () {
      await expect(
        reputation.connect(stranger).rate(worker.address, 4)
      ).to.be.revertedWith("not authorized rater");
    });

    it("should reject zero address worker", async function () {
      await expect(
        reputation.connect(escrow).rate(ethers.ZeroAddress, 3)
      ).to.be.revertedWith("invalid worker");
    });
  });

  describe("recordDispute", function () {
    it("should increment disputes", async function () {
      const tx = await reputation.connect(escrow).recordDispute(worker.address);

      const [, , disputes] = await reputation.getReputation(worker.address);
      expect(disputes).to.equal(1);

      await expect(tx).to.emit(reputation, "DisputeRecorded").withArgs(worker.address);
    });

    it("should reject unauthorized", async function () {
      await expect(
        reputation.connect(stranger).recordDispute(worker.address)
      ).to.be.revertedWith("not authorized rater");
    });
  });

  describe("getReputation", function () {
    it("should return zeros for unknown worker", async function () {
      const [tasksCompleted, avgScore, disputes] = await reputation.getReputation(stranger.address);
      expect(tasksCompleted).to.equal(0);
      expect(avgScore).to.equal(0);
      expect(disputes).to.equal(0);
    });
  });

  describe("admin functions", function () {
    it("should authorize and revoke raters", async function () {
      await reputation.connect(admin).authorizeRater(stranger.address);
      // stranger can now rate
      await reputation.connect(stranger).rate(worker.address, 4);

      await reputation.connect(admin).revokeRater(stranger.address);
      // stranger can no longer rate
      await expect(
        reputation.connect(stranger).rate(worker.address, 3)
      ).to.be.revertedWith("not authorized rater");
    });

    it("should reject non-admin authorize", async function () {
      await expect(
        reputation.connect(stranger).authorizeRater(stranger.address)
      ).to.be.revertedWith("not admin");
    });

    it("should reject non-admin revoke", async function () {
      await expect(
        reputation.connect(stranger).revokeRater(escrow.address)
      ).to.be.revertedWith("not admin");
    });
  });
});
