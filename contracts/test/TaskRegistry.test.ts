import { expect } from "chai";
import { ethers } from "hardhat";
import { TaskRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TaskRegistry", function () {
  let registry: TaskRegistry;
  let admin: HardhatEthersSigner;
  let escrow: HardhatEthersSigner; // simulates authorized publisher
  let stranger: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, escrow, stranger] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("TaskRegistry");
    registry = await Registry.deploy();

    await registry.connect(admin).authorizePublisher(escrow.address);
  });

  describe("publishTask", function () {
    it("should publish a task", async function () {
      const tx = await registry.connect(escrow).publishTask(
        1, escrow.address, "photography", "Lagos, Nigeria", ethers.parseUnits("100", 6)
      );

      expect(await registry.totalTasks()).to.equal(1);

      await expect(tx).to.emit(registry, "TaskPublished")
        .withArgs(1, "photography", "Lagos, Nigeria", ethers.parseUnits("100", 6));
    });

    it("should reject unauthorized publisher", async function () {
      await expect(
        registry.connect(stranger).publishTask(1, stranger.address, "test", "test", 100)
      ).to.be.revertedWith("not authorized");
    });
  });

  describe("closeTask", function () {
    beforeEach(async function () {
      await registry.connect(escrow).publishTask(1, escrow.address, "photo", "Lagos", 100);
    });

    it("should close an open task", async function () {
      const tx = await registry.connect(escrow).closeTask(1);

      await expect(tx).to.emit(registry, "TaskClosed").withArgs(1);

      // No open tasks remaining
      const open = await registry.getOpenTasks(0, 10);
      expect(open.length).to.equal(0);
    });

    it("should reject unauthorized close", async function () {
      await expect(
        registry.connect(stranger).closeTask(1)
      ).to.be.revertedWith("not authorized");
    });
  });

  describe("getOpenTasks", function () {
    beforeEach(async function () {
      await registry.connect(escrow).publishTask(1, escrow.address, "photo", "Lagos", 100);
      await registry.connect(escrow).publishTask(2, escrow.address, "verify", "Nairobi", 200);
      await registry.connect(escrow).publishTask(3, escrow.address, "survey", "Accra", 300);
    });

    it("should return all open tasks", async function () {
      const tasks = await registry.getOpenTasks(0, 10);
      expect(tasks.length).to.equal(3);
      expect(tasks[0].category).to.equal("photo");
      expect(tasks[2].category).to.equal("survey");
    });

    it("should paginate with offset and limit", async function () {
      const page = await registry.getOpenTasks(1, 1);
      expect(page.length).to.equal(1);
      expect(page[0].category).to.equal("verify");
    });

    it("should skip closed tasks", async function () {
      await registry.connect(escrow).closeTask(2);

      const tasks = await registry.getOpenTasks(0, 10);
      expect(tasks.length).to.equal(2);
      expect(tasks[0].category).to.equal("photo");
      expect(tasks[1].category).to.equal("survey");
    });

    it("should return empty for offset beyond count", async function () {
      const tasks = await registry.getOpenTasks(10, 5);
      expect(tasks.length).to.equal(0);
    });
  });

  describe("admin functions", function () {
    it("should authorize and revoke publishers", async function () {
      await registry.connect(admin).authorizePublisher(stranger.address);
      await registry.connect(stranger).publishTask(99, stranger.address, "x", "y", 1);
      expect(await registry.totalTasks()).to.equal(1);

      await registry.connect(admin).revokePublisher(stranger.address);
      await expect(
        registry.connect(stranger).publishTask(100, stranger.address, "a", "b", 2)
      ).to.be.revertedWith("not authorized");
    });

    it("should reject non-admin", async function () {
      await expect(
        registry.connect(stranger).authorizePublisher(stranger.address)
      ).to.be.revertedWith("not admin");
    });
  });
});
