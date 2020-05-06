pragma solidity >=0.4.21 <0.7.0;

import "./GpcToken.sol";

contract GpcTokenSale {
    address admin;
    GpcToken public tokenContract;
    uint256 public tokenPrice;

    constructor(GpcToken _tokenContract, uint256 _tokenPrice) public {        
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }
}