pragma solidity ^0.4.2;


interface IErc20 {

  function transfer(address _to, uint _tokens) external returns(bool success);

  function totalSupply() external view returns(uint);

  function balanceOf(address _tokenOwner) external view returns(uint balance);

  //  function allowance(address _tokenOwner, address _spender) external view returns (uint remaining);
  //  function approve(address _spender, uint _tokens) external returns (bool success);
  //  function transferFrom(address _from, address _to, uint _tokens) external returns (bool success);
  //  event Approval(address indexed _tokenOwner, address _indexed spender, uint tokens);

  event Transfer(address indexed _from, address indexed _to, uint tokens);

}
