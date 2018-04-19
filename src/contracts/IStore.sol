pragma solidity ^0.4.0;
//pragma experimental "v0.5.0";
pragma experimental "ABIEncoderV2";

import "safeMath.sol";
import "Types.sol";


interface StoreInterface {

  using SafeMath for uint;

  function add(
    bytes32 _hash,
    address _addr,
    uint _birthday,
    uint _amount) external returns (bool success);

  function validate(address _addr) external returns (bool success);

  function addAsset(address _addr, Types.Asset _asset) external returns (bool success);

  function modifyAsset(address _addr, uint _index, uint _newValue) external returns (bool success);

  function removeAsset(address _addr, uint _index) external returns (bool success);

  function getByIndex(uint index) external view returns (Types.Human human);

  function get(address _addr) external view returns (Types.Human human);

  function count() external view returns (uint);

}
