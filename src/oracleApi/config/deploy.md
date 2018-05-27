Add secret:
``` bash
now secrets add humanist-coin-sendgrip-api-key "XXXXX"
now secrets add humanist-coin-mailchimp-api-key "XXXXX"
```

Deploy:
``` bash
now
```

List Deployement:
``` bash
now ls humanist-coin
```

Update dns:
``` bash
now alias humanist-coin-fqxwxddgqs.now.sh api.humanist.network
```
