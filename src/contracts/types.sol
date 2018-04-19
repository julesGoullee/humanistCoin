pragma solidity ^0.4.0;
//pragma experimental "v0.5.0";
//pragma experimental "ABIEncoderV2";


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
