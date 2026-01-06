import { ProxyNode } from '../parsers/node-parser'

// 支持的客户端类型
export type ClientType = 'clash' | 'surge'

// Clash节点配置接口
interface ClashProxy {
  name: string
  type: string
  server: string
  port: number
  uuid?: string
  alterId?: number
  cipher?: string
  network?: string
  'ws-opts'?: {
    path: string
    headers: Record<string, string>
  }
  tls?: boolean
  servername?: string
  'skip-cert-verify'?: boolean
  password?: string
  sni?: string
}

// 转换为Clash格式
export function convertToClash(nodes: ProxyNode[]): ClashProxy[] {
  return nodes.map((node) => {
    const proxy: ClashProxy = {
      name: node.name,
      type: node.type,
      server: node.server,
      port: node.port,
    }

    if (node.type === 'vmess') {
      proxy.uuid = node.uuid
      proxy.alterId = node.alterId
      proxy.cipher = node.cipher
      if (node.network === 'ws') {
        proxy.network = 'ws'
        proxy['ws-opts'] = {
          path: node.wsPath || '/',
          headers: node.wsHeaders || {},
        }
      }
      if (node.tls) {
        proxy.tls = true
        proxy.servername = node.sni
        proxy['skip-cert-verify'] = node.skipCertVerify || false
      }
    } else if (node.type === 'vless') {
      proxy.uuid = node.uuid
      if (node.network === 'ws') {
        proxy.network = 'ws'
        proxy['ws-opts'] = {
          path: node.wsPath || '/',
          headers: node.wsHeaders || {},
        }
      }
      if (node.tls) {
        proxy.tls = true
        proxy.servername = node.sni
        proxy['skip-cert-verify'] = node.skipCertVerify || false
      }
    } else if (node.type === 'trojan') {
      proxy.password = node.password
      if (node.sni) {
        proxy.sni = node.sni
        proxy['skip-cert-verify'] = node.skipCertVerify || false
      }
    } else if (node.type === 'ss') {
      proxy.cipher = node.cipher
      proxy.password = node.password
    }

    return proxy
  })
}

// 转换为Surge格式
export function convertToSurge(nodes: ProxyNode[]): string {
  const lines: string[] = []

  for (const node of nodes) {
    let line = `${node.name} = ${node.type}`

    if (node.type === 'vmess') {
      line += `, ${node.server}, ${node.port}, username=${node.uuid}`
      if (node.cipher) line += `, cipher=${node.cipher}`
      if (node.network === 'ws') {
        line += `, ws=true`
        if (node.wsPath) line += `, ws-path=${node.wsPath}`
        if (node.wsHeaders?.Host) line += `, ws-headers=Host:${node.wsHeaders.Host}`
      }
      if (node.tls) {
        line += `, tls=true`
        if (node.sni) line += `, sni=${node.sni}`
        if (node.skipCertVerify) line += `, skip-cert-verify=true`
      }
    } else if (node.type === 'vless') {
      line += `, ${node.server}, ${node.port}, username=${node.uuid}`
      if (node.network === 'ws') {
        line += `, ws=true`
        if (node.wsPath) line += `, ws-path=${node.wsPath}`
        if (node.wsHeaders?.Host) line += `, ws-headers=Host:${node.wsHeaders.Host}`
      }
      if (node.tls) {
        line += `, tls=true`
        if (node.sni) line += `, sni=${node.sni}`
        if (node.skipCertVerify) line += `, skip-cert-verify=true`
      }
    } else if (node.type === 'trojan') {
      line += `, ${node.server}, ${node.port}, password=${node.password}`
      if (node.sni) line += `, sni=${node.sni}`
      if (node.skipCertVerify) line += `, skip-cert-verify=true`
    } else if (node.type === 'ss') {
      line += `, ${node.server}, ${node.port}, encrypt-method=${node.cipher}, password=${node.password}`
    }

    lines.push(line)
  }

  return lines.join('\n')
}

// 根据客户端类型转换节点
export function convertNodes(nodes: ProxyNode[], type: ClientType): ClashProxy[] | string {
  switch (type) {
    case 'clash':
      return convertToClash(nodes)
    case 'surge':
      return convertToSurge(nodes)
    default:
      throw new Error(`不支持的客户端类型: ${type}`)
  }
}
