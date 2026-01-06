import { Base64 } from 'js-base64'

// 节点接口
export interface ProxyNode {
  name: string
  type: string
  server: string
  port: number
  cipher?: string
  password?: string
  uuid?: string
  alterId?: number
  network?: string
  wsPath?: string
  wsHeaders?: Record<string, string>
  tls?: boolean
  sni?: string
  skipCertVerify?: boolean
  protocol?: string
  obfs?: string
  obfsParam?: string
  protocolParam?: string
}

// 解析VMess链接
export function parseVMessLink(link: string): ProxyNode | null {
  try {
    if (!link.startsWith('vmess://')) return null

    const base64Data = link.substring(8)
    const decodedData = Base64.decode(base64Data)
    const config = JSON.parse(decodedData)

    return {
      name: config.ps || 'VMess节点',
      type: 'vmess',
      server: config.add,
      port: parseInt(config.port),
      uuid: config.id,
      alterId: config.aid || 0,
      cipher: config.scy || 'auto',
      network: config.net || 'tcp',
      wsPath: config.path,
      wsHeaders: config.host ? { Host: config.host } : undefined,
      tls: config.tls === 'tls',
      sni: config.sni,
      skipCertVerify: config.verify_cert === false,
    }
  } catch (error) {
    console.error('解析VMess链接失败:', error)
    return null
  }
}

// 解析VLess链接
export function parseVLessLink(link: string): ProxyNode | null {
  try {
    if (!link.startsWith('vless://')) return null

    const url = new URL(link)
    const params = new URLSearchParams(url.search)

    return {
      name: decodeURIComponent(url.hash.substring(1)) || 'VLess节点',
      type: 'vless',
      server: url.hostname,
      port: parseInt(url.port),
      uuid: url.username,
      network: params.get('type') || 'tcp',
      wsPath: params.get('path') || undefined,
      wsHeaders: params.get('host') ? { Host: params.get('host')! } : undefined,
      tls: params.get('security') === 'tls',
      sni: params.get('sni') || undefined,
      skipCertVerify: params.get('allowInsecure') === '1',
    }
  } catch (error) {
    console.error('解析VLess链接失败:', error)
    return null
  }
}

// 解析Trojan链接
export function parseTrojanLink(link: string): ProxyNode | null {
  try {
    if (!link.startsWith('trojan://')) return null

    const url = new URL(link)
    const params = new URLSearchParams(url.search)

    return {
      name: decodeURIComponent(url.hash.substring(1)) || 'Trojan节点',
      type: 'trojan',
      server: url.hostname,
      port: parseInt(url.port),
      password: url.password,
      sni: params.get('sni') || undefined,
      skipCertVerify: params.get('allowInsecure') === '1',
    }
  } catch (error) {
    console.error('解析Trojan链接失败:', error)
    return null
  }
}

// 解析SS链接
export function parseSSLink(link: string): ProxyNode | null {
  try {
    if (!link.startsWith('ss://')) return null

    const url = new URL(link)
    const decodedInfo = Base64.decode(url.username)
    const [method, password] = decodedInfo.split(':')

    return {
      name: decodeURIComponent(url.hash.substring(1)) || 'SS节点',
      type: 'ss',
      server: url.hostname,
      port: parseInt(url.port),
      cipher: method,
      password: password,
    }
  } catch (error) {
    console.error('解析SS链接失败:', error)
    return null
  }
}

// 解析订阅内容
export function parseSubscriptionContent(content: string): ProxyNode[] {
  const nodes: ProxyNode[] = []

  // 首先尝试解码Base64内容
  let decodedContent = content
  try {
    // 检查是否是Base64编码的内容
    if (!content.includes('://') && content.length > 100) {
      decodedContent = Base64.decode(content)
    }
  } catch {
    // 如果解码失败，使用原始内容
    decodedContent = content
  }

  const lines = decodedContent.split('\n').filter((line) => line.trim())

  for (const line of lines) {
    let node: ProxyNode | null = null

    if (line.startsWith('vmess://')) {
      node = parseVMessLink(line)
    } else if (line.startsWith('vless://')) {
      node = parseVLessLink(line)
    } else if (line.startsWith('trojan://')) {
      node = parseTrojanLink(line)
    } else if (line.startsWith('ss://')) {
      node = parseSSLink(line)
    }

    if (node) {
      nodes.push(node)
    }
  }

  return nodes
}
