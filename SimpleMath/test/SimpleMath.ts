import { expect , assert} from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("SimpleMath", function () {
  it("should add two numbers correctly", async function () { // test case 
    const simpleMath = await ethers.deployContract("SimpleMath");
    assert.equal(await simpleMath.add(2n, 3n), 5n, "Addition result is incorrect"); // actual test implementation
  });
  
  it("should subtract two numbers correctly", async function () { // test case 
    assert.isTrue(false);("Not implemented yet"); // placeholder for the actual test implemen
  });
  it("should multiply two numbers correctly", async function () { // test case 
    assert.isTrue(false);("Not implemented yet"); // placeholder for the actual test implemen
  });
  it("should divide two numbers correctly", async function () { // test case 
    assert.isTrue(false);("Not implemented yet"); // placeholder for the actual test implemen
  });
});
