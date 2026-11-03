// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

contract SimpleMath {
    function add(uint x , uint y) public pure returns (uint) {
        return x + y;
    }
    function subtract(uint x , uint y) public pure returns (int) {
        return int(x) - int(y);
    }

    function multiply(uint x , uint y) public pure returns (uint) {
        return x * y;
    }

    function divide(uint x , uint y) public pure returns (uint) {
        return x / y;
    }
}
