import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { assert, expect } from "chai";
import hre from "hardhat";

describe("Proxy", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployFixture() {
    const Proxy = await hre.ethers.getContractFactory("Proxy");
    const proxy = await Proxy.deploy();
    const proxy_deployed = await proxy.waitForDeployment();
    console.log("proxy deployed to:", proxy_deployed.target);

    const Logic1 = await hre.ethers.getContractFactory("Logic1");
    const logic1 = await Logic1.deploy();
    const logic1_deployed = await logic1.waitForDeployment();
    console.log("logic 1 deployed to:", logic1_deployed.target);

    const Logic2 = await hre.ethers.getContractFactory("Logic2");
    const logic2 = await Logic2.deploy();
    const logic2_deployed = await logic2.waitForDeployment();
    console.log("logic 2 deployed to:", logic2_deployed.target);

    return { proxy, logic1, logic2 };
  }

  it("should work with logic1", async function () {
    const { proxy, logic1 } = await loadFixture(deployFixture);
    await proxy.changeImplementation(logic1.getAddress());
    const res1 = await logic1.x();
    expect(res1).to.be.equal(255);
    await proxy.changeX(100);
    const res2 = await logic1.x();
    expect(res2).to.be.equal(100);
  });

  describe("should work with upgrade", async function () {
    const { proxy, logic1, logic2 } = await loadFixture(deployFixture);

    it("before the upgrade", async function () {
      await proxy.changeImplementation(logic1.getAddress());
      const res1 = await logic1.x();
      expect(res1).to.be.equal(255);
      await proxy.changeX(100);
      const res2 = await logic1.x();
      expect(res2).to.be.equal(100);
    });

    it("after the upgrade", async function () {
      await proxy.changeImplementation(logic2.getAddress());
      const res1 = await logic2.x();
      expect(res1).to.be.equal(255);
      await proxy.changeX(100);
      const res2 = await logic1.x();
      expect(res2).to.be.equal(100);
      const res3 = await logic2.x();
      expect(res3).to.be.equal(100);
    });
  });
});
