[![Build Status](https://travis-ci.org/C2FO/comb-proxy.svg)](https://travis-ci.org/C2FO/comb-proxy)
[![Coverage Status](https://coveralls.io/repos/C2FO/comb-proxy/badge.svg?branch=master&service=github)](https://coveralls.io/github/C2FO/comb-proxy?branch=master)



# comb-proxy

## Overview

`comb-proxy` is plugin for comb to expose ProxyHelpers.

## Installation

```javascript
 npm install comb-proxy
```


## Usage

To initialize comb-proxy simply require it.

```javascript

var comb = require("comb-proxy");

```

## Testing

Testing can be done with the included `Dockerfile` for added insurance
that your local environment is not supplying anything extra that might
allow tests to pass that otherwise woudln't. You can run a docker
build to do all the setup and testing in one like so:


```
docker build -t comb-proxy .
```

## License

MIT [LICENSE](https://github.com/c2fo/comb-proxy/raw/master/LICENSE)

