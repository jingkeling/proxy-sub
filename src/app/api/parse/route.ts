import { Base64 } from 'js-base64'
import ky from 'ky'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: '缺少订阅地址参数' }, { status: 400 })
  }

  try {
    const origin = new URL(url).origin
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      Referer: origin,
      Origin: origin,
    }

    // 获取原始订阅内容
    const rawContent = await ky
      .get(url, {
        headers,
        timeout: 10000,
      })
      .text()

    // 解析节点信息
    const { parseSubscriptionContent } = await import('../../../lib/parsers/node-parser')
    const nodes = parseSubscriptionContent(rawContent)

    // 解码Base64内容
    let decodedContent = rawContent
    if (!rawContent.includes('://') && rawContent.length > 100) {
      try {
        decodedContent = Base64.decode(rawContent)
      } catch {
        decodedContent = rawContent
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rawContent: rawContent,
        decodedContent: decodedContent,
        nodes: nodes,
        nodeCount: nodes.length,
      },
    })
  } catch (error) {
    console.error('解析失败:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '解析失败' }, { status: 500 })
  }
}
