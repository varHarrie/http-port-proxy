import * as http from 'http'
import * as httpProxy from 'http-proxy'

export type IProxyCondition = {host?: string | RegExp, url?: string | RegExp}

export interface IProxyTarget {
  condition?: IProxyCondition
  scheme?: string,
  host?: string
  port?: number
}

function matchString (source: string, target: string | RegExp) {
  return typeof target === 'string'
    ? target === source
    : target.test(source)
}

function matchCondition (req: http.IncomingMessage, condition?: IProxyCondition) {
  if (!condition) {
    return true
  }

  const headers = req.headers
  const host = Array.isArray(headers.host) ? '' : headers.host as string
  const url = req.url || ''

  if (condition.host && !matchString(host, condition.host)) {
    return false
  }

  if (condition.url && !matchString(url, condition.url)) {
    return false
  }

  return true
}

export type ProxyResCallback = (
  proxyRes: http.IncomingMessage,
  req: http.IncomingMessage,
  res: http.ServerResponse
) => void

export type ErrorCallback = (
  err: Error,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  target?: any
) => void

const onProxyRes: ProxyResCallback = function (proxyRes, req, res) {
  console.log(`${res.statusCode} -----> ${req.headers.host}${req.url}`)
}

const onError: ErrorCallback = function (error, req, res) {
  console.log(`ERR -----> ${req.headers.host}${req.url}`)
  res.writeHead(500, {'Content-Type': 'text/plain'})
  res.end('Something went wrong. Error: ' + error.message)
}

export type ProxyOptions = {
  targets: IProxyTarget[]
  port?: number
  onProxyRes?: ProxyResCallback
  onError?: ErrorCallback
}

export default function start (options: ProxyOptions) {
  return new Promise((resolve, reject) => {

    const proxy = httpProxy.createProxyServer()
    proxy.on('proxyRes', options.onProxyRes || onProxyRes)
    proxy.on('error', options.onError || onError)

    const server = http.createServer((req, res) => {
      if (Array.isArray(options.targets)) {
        for (let target of options.targets) {
          const {condition, scheme = 'http', host = 'localhost', port = 80} = target
          if (matchCondition(req, condition)) {
            proxy.web(req, res, {target: `${scheme}://${host}:${port}`})
            break
          }
        }
      }
    })

    server.listen(options.port || 80, (error: any) => {
      if (error) {
        reject(error)
      } else {
        resolve(server)
      }
    })
  })
}
