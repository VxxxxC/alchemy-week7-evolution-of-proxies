// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Proxy {
    address implementation;
    uint x = 0;

    function changeImplementation(address _implementation) external {
        implementation = _implementation;
    }

    fallback() external {
        console.logBytes(msg.data);
        (bool s, ) = implementation.call(msg.data);
        require(s);
    }
}

contract Logic1 {
    uint x = 255;
    uint y = 100;

    function changeX(uint _x) external {
        x = _x;
    }
}

contract Logic2 {
    uint x = 255;

    function multiplyX(uint _x) external {
        x = x * _x;
    }
}
