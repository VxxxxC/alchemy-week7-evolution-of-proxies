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

    const proxyAsLogic1 = await hre.ethers.getContractAt(
      "Logic1",
      await proxy.getAddress()
    );

    const proxyAsLogic2 = await hre.ethers.getContractAt(
      "Logic2",
      await proxy.getAddress()
    );

    return { proxy, logic1, logic2, proxyAsLogic1, proxyAsLogic2 };
  }

  async function lookupUint(contractAdd, slot) {
    return parseInt(await hre.ethers.provider.getStorage(contractAdd, slot));
  }

  /*************************** Testing case start below ************************************/

  it("should work with logic1", async function () {
    const { proxy, logic1, proxyAsLogic1 } = await loadFixture(deployFixture);
    await proxy.changeImplementation(logic1.getAddress());

    //NOTE: THERE'S TWO DIFFERENT METHOD TO GET THE [0x0] SLOT VALUE
    // // METHOD 1 (lookup by getStorage , can get the value even not a public getter variable):
    // console.log(
    //   "logic 1 [0x0] slot value ( without public getter) :",
    //   await lookupUint(logic1.getAddress(), "0x0")
    // );
    // //NOTE:
    // //METHOD 2 (contract variable must have with public getter):
    // const res1 = await logic1.x();
    // console.log("logic 1 [0x0] slot value (using public getter) : ", res1);

    //WARN: [getStorage] FUNCTION FROM ETHERS.JS CAN GET VALUE , EVEN NOT A "public" VARIABLE IN THE CONTRACT.
    console.log(
      "getting logic 1 [0x1] slot value ( using 'getStorage' function ) : ",
      await lookupUint(logic1.getAddress(), "0x1")
    );

    try {
      console.log(
        "getting logci 1 [0x1] slot value ( use default getter method ) : ",
        await logic1.y()
      ); //BUG: IT WILL SHOWN ERROR [logic1.y is no a function], AS THE VARIABLE NOT STATE AS "public" IN SOLIDITY CONTRACT.
    } catch (e) {
      console.error(e);
    }

    expect(await lookupUint(logic1.getAddress(), "0x0")).to.be.equal(255);
    await proxyAsLogic1.changeX(100);
    expect(await lookupUint(logic1.getAddress(), "0x0")).to.be.equal(100);
  });

  it("should work with upgrade", async function () {
    const { proxy, logic1, logic2, proxyAsLogic1, proxyAsLogic2 } =
      await loadFixture(deployFixture);

    console.log("Before upgrade :");
    await proxy.changeImplementation(logic1.getAddress());
    expect(await lookupUint(logic1.getAddress(), "0x0")).to.be.equal(255);
    await proxyAsLogic1.changeX(100); // NOTE: here we change logic1 contract "x" value
    expect(await lookupUint(logic1.getAddress(), "0x0")).to.be.equal(100); // changed logic1 "x" value = 100

    console.log("After upgrade :");
    await proxy.changeImplementation(logic2.getAddress()); // implement the logic2 contract
    expect(await lookupUint(logic2.getAddress(), "0x0")).to.be.equal(255);
    await proxyAsLogic2.multiplyX(25); // NOTE: here we change the logic2 contract "x" value
    expect(await lookupUint(logic1.getAddress(), "0x0")).to.be.equal(100); // logic1 "x" still the same value = 100
    expect(await lookupUint(logic2.getAddress(), "0x0")).to.be.equal(6375); // logic2 "x" value changed to 255 * 25 = 6375
  });
});
