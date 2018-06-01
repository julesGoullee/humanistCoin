pragma solidity ^0.4.2;
pragma experimental "v0.5.0";
pragma experimental "ABIEncoderV2";

import "externals/safeMath.sol";
import "externals/IErc20.sol";
import "externals/oraclizeAPI_0.5.sol";
import "externals/stringUtils.sol";
import "Types.sol";
import "IStore.sol";


contract Humanist is IErc20, usingOraclize {

  using SafeMath for uint;
  using strings for *;

  struct OraclizeQueries {
    address addr;
    bool pending;
  }

  string public symbol;
  string public name;
  string internal apiUrl;
  uint public esperance;
  uint8 public decimals;
  uint public minAmountAdd;
  uint public supply;
  uint internal blockTime;
  bool internal verify;
  StoreInterface internal store;

  mapping(bytes32=> OraclizeQueries) internal oraclizeValidIds;
  event ValidateHuman(address indexed addr, bool success);
  event Transfer(address indexed from, address indexed to, uint tokens);

  // ------------------------------------------------------------------------
  // Constructor
  // ------------------------------------------------------------------------
  constructor (
    uint _esperance,
    bool _verify,
    address _store,
    string _apiUrl,
    address _oraclize) public {

    if (_oraclize != parseAddr("0x0000000000000000000000000000000000000000")) {

      OAR = OraclizeAddrResolverI(_oraclize);

    }

    verify = _verify;
    apiUrl = _apiUrl;
    decimals = 18;
    minAmountAdd = 100000000000000000; // 0.1 ether
    blockTime = 5;
    esperance = _esperance;
    supply = 1 * 10**uint(decimals);
    symbol = "HMT";
    name = "Humanist";
    store = StoreInterface(_store);

  }

  // ------------------------------------------------------------------------
  // Don't accept ETH
  // ------------------------------------------------------------------------
  function () external payable {
    revert();
  }

  function __callback(bytes32 _id, string _result) public {

    require(msg.sender == oraclize_cbAddress());
    require(oraclizeValidIds[_id].pending == true);
    address addr = oraclizeValidIds[_id].addr;
    delete oraclizeValidIds[_id];

    strings.slice memory result = _result.toSlice();
    strings.slice memory delimiter = ":".toSlice();
    strings.slice memory status;
    strings.slice memory hash;
    result.split(delimiter, status);
    result.split(delimiter, hash);

    Types.Human memory human = store.get(addr);

    require(keccak256(abi.encodePacked(hash.toString())) == human.hash);

    bool isValid = status.equals("CONFIRMED".toSlice());

    if (isValid) {

      store.validate(human.addr);

    }

    emit ValidateHuman(human.addr, isValid);  // solhint-disable-line

  }

  // ------------------------------------------------------------------------
  // Transfer the balance from token owner's account to `to` account
  // - Owner's account must have sufficient balance to transfer
  // - Can't transfer to unknown human
  // ------------------------------------------------------------------------
  function transfer(address _to, uint _tokens) public returns (bool success) {

    Types.Human memory humanFrom = store.get(msg.sender);
    Types.Human memory humanTo = store.get(_to);

    require(humanFrom.validate);
    require(humanTo.createdAt != 0);

    Types.Asset[] memory assets = humanFrom.assets;
    uint arrLength = assets.length;
    uint totalValue = 0;

    for (uint i=0; i < arrLength; i++) {

      uint assetValue = assetCurrentValue(assets[i]);

      if (totalValue.add(assetValue) >= _tokens) {

        return makeTransfer(_tokens, assets, i, totalValue, _to);

      } else {

        totalValue = totalValue.add(assetValue);

      }

    }

    revert();

  }

  // ------------------------------------------------------------------------
  // Add new account
  // ------------------------------------------------------------------------
  function add(
    uint _birthday,
    string _email,
    string _id,
    address _addr) public payable returns (bool success) {

    Types.Human memory human = store.get(_addr);
    bytes32 hash = keccak256(abi.encodePacked(_email));

    require(!humanExist(hash) && human.createdAt == 0);

    uint amount = getSupply(_birthday);

    store.add(hash, _addr, _birthday, amount);

    if (verify) {

      require(oraclize_getPrice("URL") < msg.value && minAmountAdd <= msg.value);

      string memory url = makeUrl(_id);
      bytes32 queryId = oraclize_query("URL", url);
      oraclizeValidIds[queryId] = OraclizeQueries(_addr, true);

    } else {

      store.validate(_addr);
      emit ValidateHuman(_addr, true);  // solhint-disable-line

    }

    return true;

  }

  // ------------------------------------------------------------------------
  // Get the token balance for account `tokenOwner`
  // ------------------------------------------------------------------------
  function balanceOf(address _tokenOwner) public view returns (uint balance) {

    Types.Human memory human = store.get(_tokenOwner);
    uint assetsCount = human.assets.length;

    if (human.createdAt == 0) {

      return supply;

    }

    balance = 0;

    for (uint i=0; i < assetsCount; i++) {

      balance = balance.add(assetCurrentValue(human.assets[i]));

    }

  }

  // ------------------------------------------------------------------------
  // Total supply
  // ------------------------------------------------------------------------
  function totalSupply() public view returns (uint value) {

    value = 0;

    uint count = store.count();
    for (uint i=0; i < count; i++) {

      Types.Asset[] memory assets = store.getByIndex(i).assets;

      uint assetLength = assets.length;

      for (uint j=0; j < assetLength; j++) {

        value = value.add(assetCurrentValue(assets[j]));

      }

    }

  }

  function me() public view returns (
    uint birthday,
    bytes32 hash,
    uint createdAt,
    bool validate) {

    Types.Human memory human = store.get(msg.sender);

    require(human.createdAt != 0);

    return (
      human.birthday,
      human.hash,
      human.createdAt,
      human.validate
    );

  }

  function makeUrl(string _id) internal view returns (string url) {

    return strConcat("json(", apiUrl, "/status/", _id, ").contractValue"); // strConcat import from oraclize

  }

  function humanExist(bytes32 _hash) public view returns (bool success) {

    uint count = store.count();

    for (uint i=0; i < count; i++) {

      if (store.getByIndex(i).hash == _hash) {

        return true;

      }

    }

    return false;

  }

  function humanExist(address _addr) public view returns (bool success){

    Types.Human memory human = store.get(_addr);

    return human.createdAt != 0;

  }

  function getSupply(uint _birthday) internal view returns (uint amount) {

    uint old = block.timestamp.sub(_birthday);
    uint esperanceTime = blockTime.mul(esperance);

    if (old > esperanceTime) {

      return 0;

    }

    uint timeRemind = esperanceTime.sub(old);

    return supply.mul(timeRemind).div(esperanceTime);

  }

  function getLifeTime(uint _date) internal view returns (uint old) {

    return block.number.sub(_date);

  }

  function getLifeRemind(uint _date) internal view returns (uint timeRemind) {

    uint old = getLifeTime(_date);
    return esperance.sub(old);

  }

  function assetCurrentValue(Types.Asset _asset) internal view returns (uint value) {

    uint old = getLifeTime(_asset.date);
    uint burnedAmount = _asset.amount.mul(old).div(esperance);

    return _asset.amount.sub(burnedAmount);

  }

  function findCurrentQuantity(uint _date, uint _value) internal view returns (uint valueAsset) {

    uint timeRemind = getLifeRemind(_date);
    return _value.mul(esperance).div(timeRemind);

  }

  function makeTransfer(
    uint _tokens,
    Types.Asset[] _assets,
    uint _i,
    uint _totalValue,
    address _to) internal returns (bool success) {

    uint part = findCurrentQuantity(_assets[_i].date, _tokens.sub(_totalValue));

    Types.Asset memory lastAsset = Types.Asset(_assets[_i].date, part);
    store.addAsset(_to, lastAsset);

    for (uint j=0; j < _i; j++) {

      if (assetCurrentValue(_assets[j]) > 0) { // no longer useful, current value null

        store.addAsset(_to, _assets[j]);

      }

      store.removeAsset(msg.sender, j);

    }

    if (part == store.get(msg.sender).assets[_i].amount) {

      store.removeAsset(msg.sender, _i); // no longer useful, value null

    } else {

      store.modifyAsset(msg.sender, _i, _assets[_i].amount.sub(part));

    }

    emit Transfer(msg.sender, _to, _tokens); // solhint-disable-line

    return true;

  }

}
