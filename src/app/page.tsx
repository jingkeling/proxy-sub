'use client'

import { useState, useEffect, useCallback } from 'react'

type ClientType = 'clash' | 'surge'

interface ParsedNode {
  name: string
  type: string
  server: string
  port: number
  cipher?: string
}

interface ParseResult {
  rawContent: string
  decodedContent: string
  nodes: ParsedNode[]
  nodeCount: number
}

interface ConvertedResults {
  clash?: string
  surge?: string
}

export default function Home() {
  const [subscriptionUrl, setSubscriptionUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [convertedResults, setConvertedResults] = useState<ConvertedResults>({})
  const [activeTab, setActiveTab] = useState<ClientType>('clash')
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<string | null>(null)

  // 异步转换函数
  const convertToFormat = useCallback(async (url: string, type: ClientType) => {
    try {
      const response = await fetch(`/api/convert?url=${encodeURIComponent(url)}&type=${type}`)
      if (!response.ok) {
        throw new Error('转换失败')
      }
      const data = await response.text()
      setConvertedResults((prev) => ({ ...prev, [type]: data }))
    } catch {
      // 静默处理转换错误，不影响用户体验
      console.error(`转换 ${type} 格式失败`)
    }
  }, [])

  // 自动解析和转换
  useEffect(() => {
    const autoParse = async () => {
      if (!subscriptionUrl.trim() || !subscriptionUrl.startsWith('http')) {
        setParseResult(null)
        setConvertedResults({})
        return
      }

      setIsLoading(true)
      setError('')
      setParseResult(null)
      setConvertedResults({})

      try {
        // 解析订阅
        const response = await fetch(`/api/parse?url=${encodeURIComponent(subscriptionUrl)}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '解析失败')
        }

        const data = await response.json()
        setParseResult(data.data)

        // 异步转换两种格式
        convertToFormat(subscriptionUrl, 'clash')
        convertToFormat(subscriptionUrl, 'surge')
      } catch (err) {
        setError(err instanceof Error ? err.message : '解析失败')
      } finally {
        setIsLoading(false)
      }
    }

    // 防抖处理
    const timer = setTimeout(autoParse, 800)
    return () => clearTimeout(timer)
  }, [subscriptionUrl, convertToFormat])

  const handleCopy = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = (content: string, type: ClientType) => {
    const blob = new Blob([content], {
      type: type === 'clash' ? 'application/yaml' : 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `config.${type === 'clash' ? 'yaml' : 'conf'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getApiUrl = (type: ClientType) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/api/convert?url=${encodeURIComponent(subscriptionUrl)}&type=${type}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部输入区域 */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="url"
                  value={subscriptionUrl}
                  onChange={(e) => setSubscriptionUrl(e.target.value)}
                  placeholder="粘贴订阅地址..."
                  className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 ring-1 ring-gray-200 transition-all ring-inset focus:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:ring-gray-600 dark:focus:bg-gray-600"
                />
                {isLoading && (
                  <div className="absolute top-1/2 right-4 -translate-y-1/2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
                {!isLoading && parseResult && (
                  <div className="absolute top-1/2 right-4 -translate-y-1/2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!subscriptionUrl && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-blue-100 p-6 dark:bg-blue-900/30">
              <svg className="h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">粘贴订阅地址开始</h2>
            <p className="max-w-md text-gray-500 dark:text-gray-400">
              将机场提供的订阅链接粘贴到上方输入框，系统会自动解析并转换为 Clash 和 Surge 格式
            </p>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && !parseResult && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-500 dark:text-gray-400">正在解析订阅内容...</p>
          </div>
        )}

        {/* 结果区域 */}
        {parseResult && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 左侧：解析信息 */}
            <div className="space-y-4">
              {/* 节点统计 */}
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">解析结果</h3>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {parseResult.nodeCount} 个节点
                  </span>
                </div>
              </div>

              {/* 节点列表 */}
              <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">节点列表</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {parseResult.nodes.map((node, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 border-b border-gray-100 px-5 py-3 last:border-0 dark:border-gray-700/50">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {node.type.toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{node.name}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {node.server}:{node.port}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 原始内容（可折叠） */}
              <details className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                <summary className="cursor-pointer px-5 py-3 font-medium text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700/50">
                  查看原始内容
                </summary>
                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Base64 编码</p>
                    <pre className="max-h-24 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {parseResult.rawContent}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">解码后内容</p>
                    <pre className="max-h-32 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {parseResult.decodedContent}
                    </pre>
                  </div>
                </div>
              </details>
            </div>

            {/* 右侧：转换结果 */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              {/* 标签页 */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('clash')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'clash'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}>
                  Clash
                  {convertedResults.clash && (
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('surge')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'surge'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}>
                  Surge
                  {convertedResults.surge && (
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  )}
                </button>
              </div>

              {/* 内容区域 */}
              <div className="p-4">
                {convertedResults[activeTab] ? (
                  <>
                    {/* 操作按钮 */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCopy(convertedResults[activeTab]!, activeTab)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        {copied === activeTab ? (
                          <>
                            <svg
                              className="h-4 w-4 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            已复制
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            复制配置
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(convertedResults[activeTab]!, activeTab)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        下载文件
                      </button>
                      <button
                        onClick={() => handleCopy(getApiUrl(activeTab), `api-${activeTab}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                        {copied === `api-${activeTab}` ? (
                          <>
                            <svg
                              className="h-4 w-4 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            已复制
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            复制订阅链接
                          </>
                        )}
                      </button>
                    </div>

                    {/* 配置预览 */}
                    <pre className="max-h-[400px] overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {convertedResults[activeTab]}
                    </pre>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      正在转换为 {activeTab.toUpperCase()} 格式...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
