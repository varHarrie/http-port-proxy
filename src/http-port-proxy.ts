import * as http from 'http'
import * as httpProxy from 'http-proxy'

export type IProxyCondition = {host?: string | RegExp, url?: string | RegExp}

export interface IProxyTarget {
  condition?: IProxyCondition
  scheme?: string,
  host?: string,
  port?: number,
  ws?: boolean
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

function matchTarget (
  req: http.IncomingMessage,
  targets: IProxyTarget[],
  ws: boolean,
  callback: (target: IProxyTarget) => boolean
) {
  if (Array.isArray(targets)) {
    for (let target of targets) {
      if (matchCondition(req, target.condition) && (!ws || target.ws)) {
        if (callback(target)) {
          break
        }
      }
    }
  }
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
      matchTarget(req, options.targets, false, ({scheme = 'http', host = 'localhost', port = 80}) => {
        proxy.web(req, res, {target: `${scheme}://${host}:${port}`})
        return true
      })
    })

    server.on('upgrade', (req, socket, head) => {
      matchTarget(req, options.targets, true, ({host = 'localhost', port = 80}) => {
        proxy.ws(req, socket, head, {target: `ws://${host}:${port}`})
        return true
      })
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
