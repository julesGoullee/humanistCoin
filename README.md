# Humanity coin

This is new kind of token: temporal coin.

Every human should have decent life, primary necessity, at this time in the world we have necessary knowledge and resources, technology to ensure minimum vital for everyone. 
The critical problem is money. This coin create new opportunity by offers to everyone same luck, same amount of 'life'.
We only have one life, we just pass in this world for long ~80years. To reflect this power everyone receive when he born 1 humanistCoin, this amount decrease every second to goal at 0 based on your esperance life.


### applications:
1. kyc -> tokens valuable
2. game grid movement consume tokens (time boxed game)
 
 
## 1

### backend:
#### kyc proxy server:
- logger

### dapp front end:

#### wallet ui:
- transfer
- balance

#### creation ui:
- payable donation
- upload ID
- debug ui

### contract:
- migration
- event create
- add verify function:
  - oracle call api
  - oraclize singleton
  - validate account
launch only one once node & oraclize

### Flow:
- create hash (name, last name, birthday, nationality, born place)
- create account
- send doc api and response
- call verify function contains oracle to validate account  
- Oraclize receive hash state from backend 