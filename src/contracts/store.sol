pragma solidity ^0.4.2;
pragma experimental "v0.5.0";
pragma experimental "ABIEncoderV2";

import "safeMath.sol";
import "Types.sol";
import "Ownable.sol";


contract Store is Ownable {

  using SafeMath for uint;

  mapping(address => Types.Human) public humans;
  mapping(uint => address) public humansIndex;
  uint public humanCount;
  address public consumer;

  /* solhint-disable */
  // ------------------------------------------------------------------------
  // Constructor
  // ------------------------------------------------------------------------
  constructor () public {

    humanCount = 0;

  }
  /* solhint-enable */

  modifier onlyConsumer () {

    require(msg.sender == consumer);
    _;

  }

  function add(
    bytes32 _hash,
    address _addr,
    uint _birthday,
    uint _amount) onlyConsumer public returns (bool success){

    require(humans[_addr].createdAt == 0);
    Types.Asset memory asset = Types.Asset(block.number, _amount);

    humans[_addr].birthday = _birthday;
    humans[_addr].hash = _hash;
    humans[_addr].addr = _addr;
    humans[_addr].createdAt = block.timestamp;
    humans[_addr].assets.push(asset);
    humans[_addr].validate = false;

    humansIndex[humanCount] = _addr;
    humanCount = humanCount.add(1);

    return true;

  }

  function get(address _addr) public view returns (Types.Human human) {

//    require(humans[_addr].createdAt != 0);

    return humans[_addr];

  }

  function count() public view returns (uint) {

    return humanCount;

  }

  function validate(address _addr) onlyConsumer public returns (bool success) {

    require(humans[_addr].createdAt != 0);

    humans[_addr].validate = true;

    return true;

  }

  function getByIndex(uint index) public view returns (Types.Human human) {

    require(humans[humansIndex[index]].createdAt != 0);

    return humans[humansIndex[index]];

  }

  function addAsset(address _addr, Types.Asset asset) onlyConsumer public returns (bool success) {

    require(humans[_addr].createdAt != 0);
    humans[_addr].assets.push(asset);
    return true;

  }

  function modifyAsset(address _addr, uint _index, uint _newValue) onlyConsumer public returns (bool success) {

    require(humans[_addr].createdAt != 0);
    humans[_addr].assets[_index].amount = _newValue;
    return true;

  }

  function removeAsset(address _addr, uint _index) onlyConsumer public returns (bool success) {

    require(humans[_addr].createdAt != 0);
    delete humans[_addr].assets[_index];

    return true;

  }

  function setConsumer(address _consumer) onlyOwner public returns (bool success) {

    consumer = _consumer;
    return true;

  }

}
