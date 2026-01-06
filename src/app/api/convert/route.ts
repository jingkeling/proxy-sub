import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionService } from '../../../lib/services/subscription-service'
import { ClientType } from '../../../lib/converters/format-converter'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const type = searchParams.get('type') as ClientType

  if (!url) {
    return NextResponse.json({ error: '缺少订阅地址参数' }, { status: 400 })
  }

  if (!type || !['clash', 'surge'].includes(type)) {
    return NextResponse.json({ error: '不支持的客户端类型' }, { status: 400 })
  }

  try {
    const subscriptionService = new SubscriptionService()
    const result = await subscriptionService.convertSubscription(url, type)

    let contentType: string

    if (type === 'clash') {
      contentType = 'application/json'
    } else {
      contentType = 'text/plain'
    }

    return new NextResponse(typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('转换失败:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '转换失败' }, { status: 500 })
  }
}
