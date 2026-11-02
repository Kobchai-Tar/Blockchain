// SPDX-License-Identifier: MIT

// Function visibility
// internal = can only in side a class
// public = anyone can call
// external = anyone except the contract itself

pragma solidity >=0.8.0 < 0.9.0; // ใช้ตั้งแต่เวอร์ชัน 0.8.0 แต่ห้ามใช้หลังจาก 0.9.0 ขึ้นไป ของ Solidity

contract HelloSolidity {
    uint public val1;
    uint private val2;

    // constructor(uint _val1, uint _val2) {
    //     val1 = _val1;
    //     val2 = _val2;
    // }

    function setVal1(uint _val1) public { // setter ตั่งค่าตัวแปร val1
        val1 = _val1;
    }

    function setVal2(uint _val2) private { // setter ตั่งค่าตัวแปร val2
        val2 = _val2;
    }

    function getVal2() public view returns(uint) { // getter ดึงค่าตัวแปร val2
        return val2;
    }

    // pure function
    function add(uint _val1, uint _val2) public pure returns(uint) {
        return _val1 + _val2;
    }
}