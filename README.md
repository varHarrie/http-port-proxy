# http-port-proxy

HTTP port proxying library.

## Usage

```bash
npm install --save http-port-proxy
```

```typescript
import start from 'http-port-proxy'

const targets = [
  {
    condition: {
      host: "www.sb.com",         // host: string | RegExp
                                  // url:  string | RegExp
    },
    host: "www.baidu.com",        // default to "localhost"
    port: 80                      // default to 80
  }
]

start({
  targets,
  // port: 80                     // default to 80
})
  .then((/* server */) => console.log('Server is listening...'))
```

## CLI

```bash
npm install -g http-port-proxy
```

```bash
http-port-proxy <config-path>
```
