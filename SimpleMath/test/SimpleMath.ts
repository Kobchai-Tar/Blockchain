import { expect , assert} from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("SimpleMath", function () {
  it("should add two numbers correctly", async function () { // test case 
    const simpleMath = await ethers.deployContract("SimpleMath");
    assert.equal(await simpleMath.add(2n, 3n), 5n, "Addition result is incorrect"); // actual test implementation
  });
  
  it("should subtract two numbers correctly", async function () { // test case 
    const simpleMath = await ethers.deployContract("SimpleMath");
    assert.equal(await simpleMath.subtract(5n, 3n), 2n, "Subtraction result is incorrect");
    assert.equal(await simpleMath.subtract(3n, 5n), -2n, "Negative subtraction result is incorrect");
  });
  it("should multiply two numbers correctly", async function () { // test case 
    const simpleMath = await ethers.deployContract("SimpleMath");
    assert.equal(await simpleMath.multiply(4n, 5n), 20n, "Multiplication result is incorrect");
  });
  it("should divide two numbers correctly", async function () { // test case 
    const simpleMath = await ethers.deployContract("SimpleMath");
    assert.equal(await simpleMath.divide(10n, 2n), 5n, "Division result is incorrect");
  });
});
