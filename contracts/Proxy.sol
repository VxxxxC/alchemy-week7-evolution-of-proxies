// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Proxy {
    address implementation;

    function changeImplementation(address _implementation) external {
        implementation = _implementation;
    }

    function changeX(uint _x) external {
        Logic1(implementation).changeX(_x);
    }
}

contract Logic1 {
    uint public x = 255;

    function changeX(uint _x) external {
        x = _x;
    }
}

contract Logic2 {
    uint public x = 255;

    function changeX(uint _x) external {
        x = x * _x;
    }
}
