import ky from 'ky'
import { ClientType, convertNodes } from '../converters/format-converter'
import { parseSubscriptionContent } from '../parsers/node-parser'

function buildFetchHeaders(url: string) {
  const origin = new URL(url).origin

  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Referer: origin,
    Origin: origin,
  }
}

export class SubscriptionService {
  /**
   * 获取订阅内容
   */
  private async fetchSubscriptionContent(url: string): Promise<string> {
    return ky
      .get(url, {
        headers: buildFetchHeaders(url),
        timeout: 10000,
      })
      .text()
  }

  /**
   * 转换订阅
   */
  async convertSubscription(
    url: string,
    type: ClientType,
  ): Promise<{
    success: boolean
    data: ReturnType<typeof convertNodes>
    nodeCount: number
  }> {
    try {
      // 获取订阅内容
      const content = await this.fetchSubscriptionContent(url)

      // 解析节点
      const nodes = parseSubscriptionContent(content)

      if (nodes.length === 0) {
        throw new Error('未找到有效的节点')
      }

      // 转换格式
      const result = convertNodes(nodes, type)

      return {
        success: true,
        data: result,
        nodeCount: nodes.length,
      }
    } catch (error) {
      console.error('转换订阅失败:', error)
      throw new Error(error instanceof Error ? error.message : '获取订阅内容失败，请检查订阅地址是否正确')
    }
  }
}
