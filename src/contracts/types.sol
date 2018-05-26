pragma solidity ^0.4.2;


library Types {

  struct Asset {
    uint date;
    uint amount;
  }

  struct Human {
    Asset[] assets;
    bytes32 hash;
    address addr;
    uint birthday;
    uint createdAt;
    bool validate;
  }

}
