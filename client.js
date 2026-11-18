// Prompt history — browser half.
// A left-sidebar entry that lists every prompt the user typed across all DSH
// conversations, with fuzzy search, project/session/time labels, and one-click
// copy. The Host half serves the index at `/api/prompt-history`.

window.__ModuleLoader__.load({
  id: 'dsh-prompt-manage',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'prompt-history'
    const PANEL = 'prompt-history'
    const API = '/api/prompt-history'
    const OPTIMIZE_API = '/api/prompt-optimize'

    const DICT = {
      en: {
        navLabel: 'Prompt history',
        title: 'Prompt history',
        subtitle: 'Every prompt you have typed across all workspaces — {total} in total',
        subtitleLoading: 'Reading local session records…',
        subtitleError: 'The local session index is unavailable',
        searchPlaceholder: 'Search prompts, projects, or sessions…',
        searchLabel: 'Search prompt history',
        clearSearch: 'Clear search',
        refresh: 'Refresh',
        refreshing: 'Refreshing',
        countAll: '{total} prompts',
        countFiltered: '{shown} of {total} match',
        copy: 'Copy',
        copied: 'Copied',
        copyFailed: 'Copy failed',
        expand: 'Show full prompt',
        collapse: 'Collapse',
        unknownProject: 'Unknown project',
        unknownSession: 'Untitled session',
        emptyTitle: 'No prompts yet',
        emptyHint: 'Send your first message in any conversation and it will show up here.',
        noMatchTitle: 'No matching prompts',
        noMatchHint: 'Try another keyword, or search a project or session name.',
        errorTitle: 'Could not read prompt history',
        errorHint: 'Session records are temporarily unavailable. Try again.',
        retry: 'Retry',
        loading: 'Loading prompt history',
        footer: 'Reads local DSH session records only. Nothing is uploaded.',
        footerStats: 'Scanned {sessions} sessions · {projects} projects',
        footerFailed: '{failed} sessions could not be read',
        footerTruncated: 'Some older prompts are not shown because of the index limit',
        refreshFailed: 'Refresh failed; showing the previous results.',
        fuzzyMatch: 'Fuzzy match',
        fuzzyHint: 'Matched by a loose character sequence, not a contiguous phrase.',
        truncated: 'Long prompt — display truncated',
        composerEntry: 'Insert a prompt from history',
        composerClose: 'Close prompt history',
        composerSearchPlaceholder: 'Search prompts from every conversation…',
        composerSearchLabel: 'Search prompt history',
        composerApply: 'Apply',
        composerLoading: 'Reading local session records…',
        composerError: 'Prompt history is unavailable right now.',
        composerEmpty: 'No prompts yet. Send a message in any conversation to build history.',
        composerNoMatch: 'No matching prompts.',
        composerInsertFailed: 'Could not insert into the composer. Try again.',
        composerBusy: 'Wait for the current message to finish',
        composerViewAll: 'View all history',
        composerCount: '{total} prompts',
        composerMatches: '{shown} of {total}',
        composerHint: 'Inserted at the caret',
        composerHintCommand: 'Appended after the command',
        composerDismiss: 'Dismiss',
        optimizeEntry: 'Optimize prompt',
        optimizeBusy: 'Optimizing prompt…',
        optimizeEmpty: 'Type or paste a prompt first',
        optimizeEmptyCommand: 'Type or paste the command arguments first',
        optimizeDone: 'Prompt optimized and replaced',
        optimizeUndo: 'Undo',
        optimizeFailed: 'Could not optimize the prompt',
        optimizeErrorNoModel: 'Select a model for this session first.',
        optimizeErrorUnavailable: 'The current model is unavailable.',
        optimizeErrorTooLong: 'The prompt is too long to optimize.',
        optimizeErrorInvalid: 'The model returned no usable prompt. Try again.',
        optimizeErrorTimeout: 'The optimization timed out. Try again.',
        optimizeErrorNetwork: 'Could not reach the optimizer service.',
        optimizeDismiss: 'Dismiss',
      },
      zh: {
        navLabel: '提示词历史',
        title: '提示词历史',
        subtitle: '跨全部工作区，共 {total} 条你输入过的提示词',
        subtitleLoading: '正在读取本机会话记录…',
        subtitleError: '本机会话索引暂时不可用',
        searchPlaceholder: '搜索提示词、项目或会话…',
        searchLabel: '搜索提示词历史',
        clearSearch: '清除搜索',
        refresh: '刷新',
        refreshing: '刷新中',
        countAll: '共 {total} 条',
        countFiltered: '匹配 {shown} / {total} 条',
        copy: '复制',
        copied: '已复制',
        copyFailed: '复制失败',
        expand: '展开全文',
        collapse: '收起',
        unknownProject: '未知项目',
        unknownSession: '未命名会话',
        emptyTitle: '还没有历史提示词',
        emptyHint: '在任意对话中发送第一条消息后，这里会自动出现。',
        noMatchTitle: '没有匹配的提示词',
        noMatchHint: '换个关键词，或搜索项目名和会话名试试。',
        errorTitle: '读取提示词历史失败',
        errorHint: '会话记录暂时不可用，请稍后重试。',
        retry: '重试',
        loading: '正在加载提示词历史',
        footer: '仅索引本机 DSH 会话记录，不会上传任何内容。',
        footerStats: '已扫描 {sessions} 个会话 · {projects} 个项目',
        footerFailed: '{failed} 个会话读取失败',
        footerTruncated: '部分较早的提示词因数量限制未显示',
        refreshFailed: '刷新失败，当前显示上次的结果。',
        fuzzyMatch: '模糊匹配',
        fuzzyHint: '按非连续字符顺序匹配。',
        truncated: '内容过长，已截断',
        composerEntry: '从历史中插入提示词',
        composerClose: '关闭提示词历史',
        composerSearchPlaceholder: '搜索所有对话里的提示词…',
        composerSearchLabel: '搜索历史提示词',
        composerApply: '应用',
        composerLoading: '正在读取本机会话记录…',
        composerError: '提示词历史暂时不可用。',
        composerEmpty: '还没有历史提示词，在任意对话中发送消息后这里就会出现。',
        composerNoMatch: '没有匹配的提示词。',
        composerInsertFailed: '插入输入框失败，请重试。',
        composerBusy: '等待当前消息发送完成',
        composerViewAll: '查看全部历史',
        composerCount: '共 {total} 条',
        composerMatches: '匹配 {shown} / {total}',
        composerHint: '插入到光标处',
        composerHintCommand: '追加到指令后',
        composerDismiss: '知道了',
        optimizeEntry: '优化提示词',
        optimizeBusy: '正在优化提示词…',
        optimizeEmpty: '请先输入或粘贴提示词',
        optimizeEmptyCommand: '请先在指令后输入或粘贴内容',
        optimizeDone: '提示词已优化并替换',
        optimizeUndo: '撤销',
        optimizeFailed: '优化提示词失败',
        optimizeErrorNoModel: '请先为当前会话选择一个模型。',
        optimizeErrorUnavailable: '当前模型暂时不可用。',
        optimizeErrorTooLong: '提示词太长，无法优化。',
        optimizeErrorInvalid: '模型没有返回可用的提示词，请重试。',
        optimizeErrorTimeout: '优化超时，请重试。',
        optimizeErrorNetwork: '无法连接优化服务。',
        optimizeDismiss: '关闭',
      },
    }

    function normalizeLocale(raw) {
      const language = String(raw || 'en').trim().toLowerCase().split(/[-_]/)[0]
      return Object.prototype.hasOwnProperty.call(DICT, language) ? language : 'en'
    }

    function useLocale(ctx) {
      const [snapshot, setSnapshot] = React.useState(() => ctx.locale.getSnapshot())
      React.useEffect(() => {
        setSnapshot(ctx.locale.getSnapshot())
        return ctx.locale.subscribe(() => setSnapshot(ctx.locale.getSnapshot()))
      }, [ctx])
      return normalizeLocale(snapshot && snapshot.active)
    }

    function translate(locale, key) {
      const dict = DICT[locale] || DICT.en
      return dict[key] !== undefined ? dict[key] : DICT.en[key]
    }

    function fill(text, values) {
      let out = text
      for (const [key, value] of Object.entries(values)) out = out.replaceAll(`{${key}}`, String(value))
      return out
    }

    function pad(value) {
      return String(value).padStart(2, '0')
    }

    function formatTime(timestamp, locale) {
      const date = new Date(timestamp)
      if (!Number.isFinite(date.getTime())) return ''
      const now = new Date()
      const sameDay = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate()
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      const isYesterday = date.getFullYear() === yesterday.getFullYear()
        && date.getMonth() === yesterday.getMonth()
        && date.getDate() === yesterday.getDate()
      const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`
      if (sameDay) return locale === 'zh' ? `今天 ${clock}` : `Today ${clock}`
      if (isYesterday) return locale === 'zh' ? `昨天 ${clock}` : `Yesterday ${clock}`
      if (date.getFullYear() === now.getFullYear()) {
        return locale === 'zh'
          ? `${date.getMonth() + 1}月${date.getDate()}日 ${clock}`
          : `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}, ${clock}`
      }
      return locale === 'zh'
        ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${clock}`
        : `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()}, ${clock}`
    }

    function formatFullTime(timestamp, locale) {
      const date = new Date(timestamp)
      if (!Number.isFinite(date.getTime())) return ''
      return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    }

    function normalizeSearch(value) {
      return String(value || '').toLocaleLowerCase().trim()
    }

    /** A contiguous match scores highest; a subsequence match keeps short queries useful for fuzzy lookup. */
    function scoreOne(text, term) {
      if (term === '') return 0
      const direct = text.indexOf(term)
      if (direct >= 0) {
        let score = 1000 - Math.min(direct, 300)
        if (direct === 0) score += 300
        if (direct === 0 || /[\s\-_/.,;:()[\]{}]/.test(text.charAt(direct - 1))) score += 120
        return score + Math.min(term.length, 40) * 4
      }
      let queryIndex = 0
      let lastMatch = -1
      let gapCount = 0
      let run = 0
      let bestRun = 0
      for (let index = 0; index < text.length && queryIndex < term.length; index += 1) {
        if (text.charAt(index) === term.charAt(queryIndex)) {
          if (lastMatch >= 0) gapCount += index - lastMatch - 1
          lastMatch = index
          run += 1
          bestRun = Math.max(bestRun, run)
          queryIndex += 1
        } else if (lastMatch >= 0) {
          run = 0
        }
      }
      if (queryIndex < term.length) return -1
      return Math.max(0, 380 - gapCount * 3) + bestRun * 8
    }

    function searchEntries(entries, query) {
      const terms = normalizeSearch(query).split(/\s+/).filter(Boolean)
      if (terms.length === 0) return entries
      const scored = []
      for (const entry of entries) {
        const text = normalizeSearch(entry.text)
        const meta = normalizeSearch(`${entry.project || ''} ${entry.sessionTitle || ''}`)
        let total = 0
        let matched = true
        for (const term of terms) {
          const textScore = scoreOne(text, term)
          const metaScore = scoreOne(meta, term)
          if (textScore < 0 && metaScore < 0) {
            matched = false
            break
          }
          total += Math.max(0, textScore) + Math.max(0, metaScore) * 0.35
        }
        if (matched) scored.push({ entry, score: total })
      }
      scored.sort((left, right) => right.score - left.score || right.entry.time - left.entry.time)
      return scored.map((row) => row.entry)
    }

    function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    /** Build a readable preview that includes the first literal search hit when it is far into a long prompt. */
    function buildPreview(text, query) {
      const terms = query.trim().split(/\s+/).filter(Boolean)
      if (terms.length === 0) return text.slice(0, 600)
      const lower = text.toLocaleLowerCase()
      let first = -1
      for (const term of terms) {
        const index = lower.indexOf(term.toLocaleLowerCase())
        if (index >= 0 && (first < 0 || index < first)) first = index
      }
      if (first > 320) {
        const start = Math.max(0, first - 120)
        return `…${text.slice(start, start + 600)}`
      }
      return text.slice(0, 600)
    }

    function hasLiteralMatch(text, query) {
      const lower = text.toLocaleLowerCase()
      return query.trim().split(/\s+/).filter(Boolean).some((term) => lower.includes(term.toLocaleLowerCase()))
    }

    function highlightText(text, query) {
      const terms = query.trim().split(/\s+/).filter(Boolean)
      if (terms.length === 0) return text
      const unique = [...new Set(terms)].sort((left, right) => right.length - left.length)
      let regex
      try {
        regex = new RegExp(`(${unique.map(escapeRegExp).join('|')})`, 'gi')
      } catch {
        return text
      }
      const pieces = String(text).split(regex)
      return pieces.map((piece, index) => {
        if (index % 2 === 1) return h('mark', { key: index, className: 'ph-mark' }, piece)
        return piece
      })
    }

    function writeClipboard(text) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text)
      }
      return Promise.reject(new Error('Clipboard is unavailable.'))
    }

    function fallbackCopy(text) {
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.top = '-1000px'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand && document.execCommand('copy')
        area.remove()
        return ok ? Promise.resolve() : Promise.reject(new Error('Copy failed.'))
      } catch (error) {
        return Promise.reject(error)
      }
    }

    function copyText(text) {
      return writeClipboard(text).catch(() => fallbackCopy(text))
    }

    function usePromptIndex() {
      const [state, setState] = React.useState({ status: 'loading', entries: [], meta: null, error: null, refreshError: null, refreshing: false })
      const alive = React.useRef(true)
      const loadedAt = React.useRef(0)
      const controller = React.useRef(null)

      const load = React.useCallback(async (force) => {
        if (controller.current) controller.current.abort()
        const current = new AbortController()
        controller.current = current
        setState((previous) => ({
          ...previous,
          status: previous.entries.length > 0 ? previous.status : 'loading',
          refreshing: true,
          error: null,
          refreshError: null,
        }))
        try {
          const response = await fetch(`${API}${force ? '?refresh=1' : ''}`, {
            cache: 'no-store',
            headers: { accept: 'application/json' },
            signal: current.signal,
          })
          const body = await response.json()
          if (!response.ok || !body || body.ok === false) {
            throw new Error((body && body.error) || `HTTP ${response.status}`)
          }
          if (!alive.current) return
          loadedAt.current = Date.now()
          setState({
            status: 'ready',
            entries: Array.isArray(body.entries) ? body.entries : [],
            meta: body,
            error: null,
            refreshError: null,
            refreshing: false,
          })
        } catch (error) {
          if (!alive.current || (error && error.name === 'AbortError')) return
          setState((previous) => {
            const message = error instanceof Error ? error.message : String(error)
            return {
              ...previous,
              status: previous.entries.length > 0 ? 'ready' : 'error',
              refreshing: false,
              error: previous.entries.length > 0 ? previous.error : message,
              refreshError: previous.entries.length > 0 ? message : null,
            }
          })
        }
      }, [])

      React.useEffect(() => {
        alive.current = true
        void load(false)
        const onVisible = () => {
          if (document.visibilityState === 'visible' && Date.now() - loadedAt.current > 5000) void load(false)
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
          alive.current = false
          document.removeEventListener('visibilitychange', onVisible)
          if (controller.current) controller.current.abort()
        }
      }, [load])

      return { ...state, reload: load }
    }

    function IconBase(props) {
      return h('svg', {
        viewBox: props.viewBox || '0 0 16 16',
        width: props.size || 16,
        height: props.size || 16,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: props.strokeWidth || 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        className: props.className,
      }, props.children)
    }

    function SearchIcon(props) {
      return h(IconBase, props,
        h('circle', { cx: 7, cy: 7, r: 4.4 }),
        h('path', { d: 'M10.4 10.4 14 14' }))
    }

    function CloseIcon(props) {
      return h(IconBase, props,
        h('path', { d: 'M4 4l8 8M12 4l-8 8' }))
    }

    function RefreshIcon(props) {
      return h(IconBase, props,
        h('path', { d: 'M13.2 6.4A5.5 5.5 0 1 0 13.4 9' }),
        h('path', { d: 'M13.4 3.2v3.4H10' }))
    }

    function CopyIcon(props) {
      return h(IconBase, props,
        h('rect', { x: 5.4, y: 5.4, width: 7.2, height: 8.2, rx: 1.5 }),
        h('path', { d: 'M3.4 10.6V3.8c0-.8.6-1.4 1.4-1.4h6' }))
    }

    function CheckIcon(props) {
      return h(IconBase, props,
        h('path', { d: 'M3 8.2 6.4 11.6 13 4.6' }))
    }

    function FolderIcon(props) {
      return h(IconBase, props,
        h('path', { d: 'M2.2 4.4c0-.7.5-1.2 1.2-1.2h3l1.4 1.6h5.8c.7 0 1.2.5 1.2 1.2v6.4c0 .7-.5 1.2-1.2 1.2H3.4c-.7 0-1.2-.5-1.2-1.2V4.4Z' }))
    }

    /**
     * Clock-with-rewind arrow, the conventional history glyph. Drawn on a
     * 24-unit grid (adapted from Lucide's ISC-licensed "history" icon) so the
     * circle and hands stay crisp at the 16 px composer size.
     */
    function HistoryGlyph(props) {
      const size = props && props.size ? props.size : 18
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        'aria-hidden': true,
        style: { display: 'block', flex: 'none' },
      },
        h('path', {
          d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M3 3v5h5',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M12 7v5l4 2',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }))
    }

    /**
     * Magic wand with two sparkles — the familiar "enhance / rewrite with AI"
     * metaphor. Paths adapted from Lucide's ISC-licensed "wand-sparkles" icon.
     */
    function SparkleGlyph(props) {
      const size = props && props.size ? props.size : 18
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        'aria-hidden': true,
        style: { display: 'block', flex: 'none' },
      },
        h('path', {
          d: 'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', { d: 'm14 7 3 3', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M5 6v4', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M19 14v4', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M10 2v2', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M7 8H3', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M21 16h-4', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M11 3H9', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }))
    }

    function EmptyIllustration() {
      return h('svg', { viewBox: '0 0 120 90', width: 120, height: 90, fill: 'none', 'aria-hidden': true, className: 'ph-illustration' },
        h('rect', { x: 12, y: 14, width: 72, height: 48, rx: 12, stroke: 'currentColor', strokeWidth: 2.2, opacity: 0.55 }),
        h('path', { d: 'M27 24h42M27 33h30M27 42h20', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', opacity: 0.7 }),
        h('circle', { cx: 82, cy: 56, r: 17, fill: 'var(--dsw-alias-bg-layer-1)', stroke: 'currentColor', strokeWidth: 2.2 }),
        h('circle', { cx: 80, cy: 54, r: 7, stroke: 'currentColor', strokeWidth: 2.2 }),
        h('path', { d: 'm85.5 59.5 6.5 6.5', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' }),
        h('path', { d: 'M78 40 84 34l6 6', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.6 }))
    }

    function Spinner(props) {
      return h('svg', {
        viewBox: '0 0 16 16', width: props.size || 14, height: props.size || 14,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round',
        'aria-hidden': true, className: 'ph-spin',
      }, h('path', { d: 'M8 2.2a5.8 5.8 0 1 1-5.8 5.8', opacity: 0.9 }))
    }

    function PromptRow(props) {
      const { entry, query, locale, t } = props
      const [expanded, setExpanded] = React.useState(false)
      const [copyState, setCopyState] = React.useState('idle')
      const timer = React.useRef(null)
      React.useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current)
      }, [])

      const preview = expanded ? entry.text : buildPreview(entry.text, query)
      const long = entry.text.length > 260 || entry.text.split('\n').length > 3 || preview !== entry.text
      const fuzzyOnly = query.trim() !== '' && !hasLiteralMatch(`${entry.text} ${entry.project || ''} ${entry.sessionTitle || ''}`, query)

      const onCopy = async () => {
        try {
          await copyText(entry.text)
          setCopyState('copied')
        } catch {
          setCopyState('error')
        }
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopyState('idle'), 1600)
      }

      return h('article', { className: 'ph-row', role: 'listitem' },
        h('p', { className: `ph-prompt${long && !expanded ? ' ph-clamped' : ''}` }, highlightText(preview, query)),
        long ? h('button', {
          type: 'button', className: 'ph-expand',
          onClick: () => setExpanded((value) => !value),
          'aria-expanded': expanded,
        }, expanded ? t('collapse') : t('expand')) : null,
        h('div', { className: 'ph-meta' },
          h('span', { className: 'ph-project', title: entry.projectPath || entry.project },
            h(FolderIcon, { size: 12 }),
            h('span', { className: 'ph-ellipsis' }, entry.project || t('unknownProject'))),
          h('span', { className: 'ph-sep', 'aria-hidden': true }, '·'),
          h('span', { className: 'ph-session', title: entry.sessionTitle || entry.sessionId },
            h('span', { className: 'ph-ellipsis' }, entry.sessionTitle || t('unknownSession'))),
          entry.truncated ? h('span', { className: 'ph-truncated', title: t('truncated') }, '…') : null,
          fuzzyOnly ? h('span', { className: 'ph-fuzzy', title: t('fuzzyHint') }, t('fuzzyMatch')) : null,
          h('span', { className: 'ph-time', title: formatFullTime(entry.time, locale) }, formatTime(entry.time, locale)),
          h('button', {
            type: 'button',
            className: `ph-copy${copyState === 'copied' ? ' is-copied' : ''}${copyState === 'error' ? ' is-error' : ''}`,
            onClick: onCopy,
            'aria-label': `${copyState === 'copied' ? t('copied') : copyState === 'error' ? t('copyFailed') : t('copy')}: ${entry.project || ''} · ${entry.sessionTitle || ''} · ${entry.text.slice(0, 24).replace(/\s+/g, ' ')}`,
          },
            copyState === 'copied' ? h(CheckIcon, { size: 12 }) : h(CopyIcon, { size: 12 }),
            h('span', null, copyState === 'copied' ? t('copied') : copyState === 'error' ? t('copyFailed') : t('copy'))),
          h('span', { className: 'ph-sr', role: 'status', 'aria-live': 'polite' }, copyState === 'copied' ? t('copied') : copyState === 'error' ? t('copyFailed') : '')))
    }

    function SkeletonList(props) {
      return h('div', { className: 'ph-list', 'aria-busy': 'true', 'aria-label': props.label },
        Array.from({ length: 6 }, (_, index) => h('div', { className: 'ph-skel-row', key: index },
          h('div', { className: 'ph-skel-line', style: { width: `${92 - index * 7}%` } }),
          h('div', { className: 'ph-skel-line', style: { width: `${58 + index * 3}%` } }),
          h('div', { className: 'ph-skel-meta' }))))
    }

    function EmptyState(props) {
      return h('div', { className: 'ph-empty', role: 'status' },
        h(EmptyIllustration),
        h('h2', null, props.title),
        h('p', null, props.hint),
        props.action ? props.action : null)
    }

    function Panel(props) {
      const { ctx } = props
      const locale = useLocale(ctx)
      const t = React.useCallback((key) => translate(locale, key), [locale])
      const { entries, status, refreshError, meta, refreshing, reload } = usePromptIndex()
      const [query, setQuery] = React.useState('')
      const inputRef = React.useRef(null)
      const headingRef = React.useRef(null)
      const results = React.useMemo(() => searchEntries(entries, query), [entries, query])
      React.useEffect(() => {
        if (headingRef.current) headingRef.current.focus()
      }, [])

      const subtitle = status === 'loading'
        ? t('subtitleLoading')
        : status === 'error'
          ? t('subtitleError')
          : fill(t('subtitle'), { total: meta && Number.isFinite(meta.total) ? meta.total : entries.length })

      const body = status === 'loading'
        ? h(SkeletonList, { label: t('loading') })
        : status === 'error'
          ? h(EmptyState, {
            title: t('errorTitle'),
            hint: t('errorHint'),
            action: h('button', { type: 'button', className: 'ph-btn ph-btn-primary', onClick: () => reload(true) }, t('retry')),
          })
          : results.length === 0
            ? query.trim() !== ''
              ? h(EmptyState, { title: t('noMatchTitle'), hint: t('noMatchHint') })
              : h(EmptyState, { title: t('emptyTitle'), hint: t('emptyHint') })
            : h('div', { className: 'ph-list', role: 'list' },
              results.map((entry) => h(PromptRow, { key: entry.id, entry, query, locale, t })))

      return h('section', { className: 'ph-root', 'data-testid': 'prompt-history-page', 'aria-label': t('title') },
        h('div', { className: 'ph-scroll' },
          h('div', { className: 'ph-content' },
            h('header', { className: 'ph-heading' },
              h('div', { className: 'ph-heading-copy' },
                h('h1', { ref: headingRef, tabIndex: -1, className: 'ph-title' }, t('title')),
                h('p', { className: 'ph-subtitle' }, subtitle)),
              h('div', { className: 'ph-actions' },
                h('button', {
                  type: 'button', className: 'ph-btn', onClick: () => reload(true), disabled: refreshing,
                  'aria-label': refreshing ? t('refreshing') : t('refresh'),
                },
                  refreshing ? h(Spinner, { size: 13 }) : h(RefreshIcon, { size: 14 }),
                  h('span', null, refreshing ? t('refreshing') : t('refresh'))))),
            h('div', { className: `ph-search${status !== 'ready' ? ' is-disabled' : ''}`, role: 'search' },
              h('span', { className: 'ph-search-icon' }, h(SearchIcon, { size: 15 })),
              h('input', {
                ref: inputRef,
                type: 'search',
                value: query,
                onChange: (event) => setQuery(event.target.value),
                placeholder: t('searchPlaceholder'),
                'aria-label': t('searchLabel'),
                spellCheck: false,
                autoComplete: 'off',
                disabled: status !== 'ready',
              }),
              query !== '' ? h('button', {
                type: 'button', className: 'ph-clear', 'aria-label': t('clearSearch'),
                onClick: () => { setQuery(''); if (inputRef.current) inputRef.current.focus() },
              }, h(CloseIcon, { size: 11 })) : null,
              h('span', { className: 'ph-count', 'aria-live': 'polite' }, status === 'ready'
                ? query.trim() !== ''
                  ? fill(t('countFiltered'), { shown: results.length, total: entries.length })
                  : fill(t('countAll'), { total: entries.length })
                : '')),
            refreshError
              ? h('div', { className: 'ph-notice', role: 'status' },
                h('span', null, t('refreshFailed')),
                h('button', { type: 'button', className: 'ph-notice-btn', onClick: () => reload(true) }, t('retry')))
              : null,
            body,
            status === 'ready' && meta
              ? h('p', { className: 'ph-foot' },
                t('footer'),
                meta.sessionsScanned !== undefined
                  ? ` · ${fill(t('footerStats'), { sessions: meta.sessionsScanned, projects: meta.projectCount || 0 })}`
                  : '',
                meta.failedSessions > 0
                  ? ` · ${fill(t('footerFailed'), { failed: meta.failedSessions })}`
                  : '',
                meta.truncated
                  ? ` · ${t('footerTruncated')}`
                  : '')
              : null)))
    }

    // ---------------------------------------------------------------------
    // Composer entry: an icon chip immediately before the model selector plus
    // a searchable palette that floats above the composer card. The chip
    // lives in `conversation.input.right`; the palette lives in the composer's
    // own `conversation.input.overlay` anchor so it inherits the card's width,
    // stacking context, and above-the-composer placement instead of portaling.
    // ---------------------------------------------------------------------

    const PALETTE_MAX_HEIGHT = 420
    /** Keep the palette fully inside the viewport; short windows shrink it instead of clipping the search row. */
    const PALETTE_VIEWPORT_GAP = 12
    /** Below this height the footer yields its space to the result list. */
    const PALETTE_COMPACT_HEIGHT = 160
    const PALETTE_RESULT_LIMIT = 60
    const PALETTE_CACHE_TTL_MS = 30_000
    const PALETTE_SKELETON_ROWS = 3
    const ENTRY_ATTR = 'data-prompt-history-entry'

    /** Shared between the chip and the palette: who has the palette open, and the caret captured at open time. */
    function createComposerSeat() {
      const listeners = new Set()
      let snapshot = { open: false, sessionId: null, span: null, trigger: null }
      const publish = (next) => {
        snapshot = next
        for (const listener of [...listeners]) listener()
      }
      return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        setTrigger(node) {
          if (snapshot.trigger === node) return
          publish({ ...snapshot, trigger: node })
        },
        toggle(sessionId, span) {
          if (snapshot.open && snapshot.sessionId === sessionId) publish({ ...snapshot, open: false, sessionId, span: null })
          else publish({ ...snapshot, open: true, sessionId, span })
        },
        close() {
          if (!snapshot.open) return
          publish({ ...snapshot, open: false, span: null })
        },
        focusTrigger() {
          const node = snapshot.trigger
          if (node && typeof node.focus === 'function') node.focus({ preventScroll: true })
        },
        dispose() {
          listeners.clear()
          snapshot = { open: false, sessionId: null, span: null, trigger: null }
        },
      }
    }

    /**
     * Resolve the mounted session's input facade. The facade owns the Lexical
     * editor and is the only surface that can restore a caret reliably.
     */
    function resolveComposerFacade(ctx, sessionId) {
      if (!ctx) return null
      try {
        const sessions = ctx.get('sessions')
        if (!sessions || typeof sessions.scope !== 'function') return null
        const scoped = sessions.scope(sessionId)
        if (!scoped || typeof scoped.get !== 'function') return null
        const conversation = scoped.get('conversation')
        const input = conversation && conversation.input
        if (!input || typeof input.for !== 'function') return null
        return input.for(scoped) || null
      } catch {
        return null
      }
    }

    /**
     * Return the keyboard to the composer after the palette takes it. The
     * session-scoped facade restores Lexical's stored selection, which a bare
     * DOM focus on the contenteditable would drop.
     */
    function focusComposer(ctx, sessionId) {
      const facade = resolveComposerFacade(ctx, sessionId)
      if (!facade || typeof facade.focus !== 'function') return false
      try {
        facade.focus()
        return true
      } catch {
        return false
      }
    }

    /**
     * Move the caret to the very end of the draft after a programmatic replace.
     * Lexical can leave a freshly populated contenteditable at offset zero when
     * the editor was not focused while the draft changed; an explicit DOM range
     * after focus settles that case, and Lexical's selectionchange listener
     * folds it back into its own selection.
     */
    function placeCaretAtEnd(ctx, sessionId) {
      const facade = resolveComposerFacade(ctx, sessionId)
      if (!facade || typeof document === 'undefined') return false
      const editor = facade.editor
      if (!editor || typeof editor.getRootElement !== 'function') return false
      const apply = () => {
        try {
          const root = editor.getRootElement()
          if (!root) return
          root.focus({ preventScroll: true })
          const selection = window.getSelection()
          if (!selection) return
          const range = document.createRange()
          range.selectNodeContents(root)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        } catch {
          /* leave the editor's own selection untouched */
        }
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply)
      else setTimeout(apply, 0)
      return true
    }

    /**
     * Read the input state from the live facade. React selectors can trail the
     * editor by one keystroke while an overlay has focus; range arithmetic for
     * a programmatic edit must see the exact current draft, revision, and claim.
     */
    function readLiveInputSnapshot(ctx, sessionId) {
      try {
        const facade = resolveComposerFacade(ctx, sessionId)
        const state = facade && facade.state
        if (state && typeof state.getSnapshot === 'function') {
          const snapshot = state.getSnapshot()
          if (snapshot && typeof snapshot === 'object') return snapshot
        }
      } catch {
        /* fall back to the React snapshot */
      }
      return null
    }

    /**
     * Detect-projection length of the published draft. Chips count as one
     * character there while the clipboard projection carries their full text,
     * so command tokens and reference chips have to be folded back.
     */
    function detectDraftLength(draft, occurrences, command) {
      let length = typeof draft === 'string' ? draft.length : 0
      // CommandChipNode's clipboard projection is the token without its
      // argument separator; the chip itself occupies one detect character.
      if (command && typeof command.spelling === 'string') {
        length -= Math.max(0, command.spelling.length - 1)
      } else if (command && typeof command.token === 'string') {
        length -= Math.max(0, command.token.length - 1)
      }
      if (Array.isArray(occurrences)) {
        for (const occurrence of occurrences) {
          const size = Number(occurrence && occurrence.length)
          if (Number.isFinite(size) && size > 1) length -= size - 1
        }
      }
      return Math.max(0, length)
    }


    /** Snapshot the model selection shown by the composer, for the optimizer fallback route. */
    function readComposerModelSelection(ctx, sessionId) {
      if (!ctx || !sessionId) return null
      try {
        const sessions = ctx.get('sessions')
        if (!sessions || typeof sessions.binding !== 'function') return null
        const binding = sessions.binding(sessionId)
        const session = binding && binding.session
        const projections = session && session.projections
        if (!projections || typeof projections.faceOf !== 'function') return null
        const state = projections.faceOf('modelSelection').getSnapshot()
        const selection = state && (state.next || state.lastUsed)
        if (!selection || typeof selection.provider !== 'string' || selection.provider === '') return null
        if (typeof selection.model !== 'string' || selection.model === '') return null
        return {
          provider: selection.provider,
          model: selection.model,
          ...(typeof selection.reasoningEffort === 'string' && selection.reasoningEffort !== ''
            ? { reasoningEffort: selection.reasoningEffort }
            : {}),
        }
      } catch {
        return null
      }
    }


    /** Phases where the composer is submitting/sending and no edit is safe. */
    function isFrozenPhase(phase) {
      return phase === 'adjudicating' || phase === 'submitting' || phase === 'sending'
    }

    /**
     * Split the draft around its leading slash-command chip. The chip's
     * clipboard projection is its token; everything after the token and its
     * argument separator is the command's argument text.
     */
    function splitCommandDraft(draft, claim) {
      if (!claim || typeof claim.token !== 'string' || claim.token === '') return null
      const text = typeof draft === 'string' ? draft : ''
      const token = claim.token
      const spelling = token.trimEnd()
      if (spelling === '' || !text.startsWith(spelling)) return null
      const separator = token.slice(spelling.length)
      let rest = text.slice(spelling.length)
      if (separator !== '' && rest.startsWith(separator)) rest = rest.slice(separator.length)
      return { token, spelling, separator, args: rest }
    }

    /** Build the semantic draft that keeps a leading command chip. */
    function commandDraftText(command, args) {
      return `${command.spelling}${command.separator}${args}`
    }

    /** Replace the draft while preserving a leading command chip when present. */
    function replaceDraftPreservingCommand(inputActions, command, text) {
      if (command) {
        try {
          // SessionInput.setDraft accepts the semantic DraftSnapshot shape at
          // runtime; InputActions types it as string, so keep a fallback for
          // hosts that reject the richer form.
          inputActions.setDraft({ text, references: [], command: { token: command.token } })
          return true
        } catch {
          /* fall back to plain text below */
        }
      }
      inputActions.setDraft(text)
      return true
    }

    /**
     * The palette shares the page's route with a short-lived stale-while-revalidate
     * cache: reopening is instant, and a failed refresh keeps the previous rows.
     */
    const paletteIndex = { at: 0, entries: null, error: null, promise: null }

    function loadPaletteIndex(force) {
      const fresh = paletteIndex.entries !== null && Date.now() - paletteIndex.at < PALETTE_CACHE_TTL_MS
      if (!force && fresh) return Promise.resolve(paletteIndex)
      if (paletteIndex.promise !== null) return paletteIndex.promise
      paletteIndex.promise = fetch(`${API}${force ? '?refresh=1' : ''}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
        .then(async (response) => {
          const body = await response.json()
          if (!response.ok || !body || body.ok === false) {
            throw new Error((body && body.error) || `HTTP ${response.status}`)
          }
          paletteIndex.at = Date.now()
          paletteIndex.entries = Array.isArray(body.entries) ? body.entries : []
          paletteIndex.error = null
          return paletteIndex
        })
        .catch((error) => {
          paletteIndex.at = Date.now()
          paletteIndex.error = error instanceof Error ? error.message : String(error)
          return paletteIndex
        })
        .finally(() => { paletteIndex.promise = null })
      return paletteIndex.promise
    }

    /** Compact chip that opens the palette; it sits directly before the model selector. */
    function ComposerEntry(props) {
      const { ctx, seat, sessionId, inputActions, focusComposer: focus } = props
      const locale = useLocale(ctx)
      const t = React.useCallback((key) => translate(locale, key), [locale])
      const snapshot = React.useSyncExternalStore(seat.subscribe, seat.getSnapshot)
      const open = snapshot.open && snapshot.sessionId === sessionId
      const buttonRef = React.useRef(null)
      const timer = React.useRef(null)
      const [tip, setTip] = React.useState(false)

      React.useEffect(() => {
        seat.setTrigger(buttonRef.current)
        return () => { seat.setTrigger(null) }
      }, [seat])

      React.useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current)
      }, [])

      const hideTip = () => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = null
        setTip(false)
      }

      const showTip = () => {
        if (open) return
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setTip(true), 420)
      }

      const toggle = () => {
        hideTip()
        if (open) {
          seat.close()
          if (!focus(sessionId)) seat.focusTrigger()
          return
        }
        let span = null
        try {
          if (inputActions && typeof inputActions.captureInsertion === 'function') span = inputActions.captureInsertion()
        } catch {
          span = null
        }
        seat.toggle(sessionId, span)
      }

      return h(React.Fragment, null,
        h('span', { className: 'phc-seat' },
          h('button', {
            ref: buttonRef,
            type: 'button',
            className: 'phc-trigger',
            [ENTRY_ATTR]: '',
            'aria-label': t('composerEntry'),
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            onMouseDown: (event) => { event.preventDefault() },
            onMouseEnter: showTip,
            onMouseLeave: hideTip,
            onFocus: showTip,
            onBlur: hideTip,
            onClick: toggle,
          }, h(HistoryGlyph, { size: 16 }))),
        tip === false
          ? null
          : h('span', { className: 'phc-tip', role: 'tooltip' }, t(open ? 'composerClose' : 'composerEntry')))
    }

    /** Map a host error code onto one localized sentence the composer can display. */
    function optimizeErrorText(error, t) {
      const code = error && error.code
      if (code === 'NO_MODEL') return t('optimizeErrorNoModel')
      if (code === 'NO_ADAPTER' || code === 'LLM_UNAVAILABLE') return t('optimizeErrorUnavailable')
      if (code === 'INPUT_TOO_LONG') return t('optimizeErrorTooLong')
      if (code === 'INVALID_OUTPUT') return t('optimizeErrorInvalid')
      if (code === 'TIMEOUT') return t('optimizeErrorTimeout')
      if (error && error.name === 'TypeError') return t('optimizeErrorNetwork')
      const message = error && error.message ? String(error.message) : ''
      return message === '' ? t('optimizeFailed') : `${t('optimizeFailed')}: ${message}`
    }

    /**
     * Wand chip immediately before the prompt-history chip: one click sends
     * the current draft through the host's prompt optimizer and replaces the
     * draft with the returned text. It never changes the draft while the
     * composer is sending, and the request can be repeated at any time.
     */
    function ComposerOptimize(props) {
      const { ctx, sessionId, inputActions, useInput } = props
      const locale = useLocale(ctx)
      const t = React.useCallback((key) => translate(locale, key), [locale])
      const draft = useInput((state) => state.draft)
      const draftRev = useInput((state) => state.draftRev)
      const occurrences = useInput((state) => state.occurrences)
      const phase = useInput((state) => state.phase)
      const claim = useInput((state) => state.claim)
      const command = splitCommandDraft(draft, claim)
      const [status, setStatus] = React.useState('idle')
      const [notice, setNotice] = React.useState(null)
      const [tip, setTip] = React.useState(false)
      const alive = React.useRef(true)
      const request = React.useRef(null)
      const tipTimer = React.useRef(null)
      const noticeTimer = React.useRef(null)

      React.useEffect(() => () => {
        alive.current = false
        if (request.current) request.current.abort()
        if (tipTimer.current) clearTimeout(tipTimer.current)
        if (noticeTimer.current) clearTimeout(noticeTimer.current)
      }, [])

      // Editing after a successful replacement retires the check mark and its
      // toast, so the next click is once again an ordinary optimize action.
      React.useEffect(() => {
        if (status !== 'success' || notice === null || notice.kind !== 'success') return
        if (draft === notice.optimized) return
        setStatus('idle')
        setNotice(null)
      }, [draft, status, notice])

      const showTip = () => {
        if (notice !== null || status === 'running') return
        if (tipTimer.current) clearTimeout(tipTimer.current)
        tipTimer.current = setTimeout(() => setTip(true), 420)
      }
      const hideTip = () => {
        if (tipTimer.current) clearTimeout(tipTimer.current)
        tipTimer.current = null
        setTip(false)
      }
      const clearNoticeTimer = () => {
        if (noticeTimer.current) clearTimeout(noticeTimer.current)
        noticeTimer.current = null
      }
      const showNotice = (next) => {
        setNotice(next)
        clearNoticeTimer()
        noticeTimer.current = setTimeout(() => {
          if (alive.current) {
            setNotice(null)
            setStatus('idle')
          }
        }, next.kind === 'error' ? 10_000 : 8_000)
      }
      const dismissNotice = () => {
        clearNoticeTimer()
        setNotice(null)
        if (status !== 'running') setStatus('idle')
      }
      const undo = () => {
        if (!notice || notice.kind !== 'success') return
        if (draft !== notice.optimized) return
        try {
          if (notice.command) replaceDraftPreservingCommand(inputActions, notice.command, notice.previous)
          else inputActions.setDraft(notice.previous)
        } catch {
          /* the editor rejected the restore; keeping the optimized text is safe */
        }
        dismissNotice()
        focusComposer(ctx, sessionId)
      }

      const busy = isFrozenPhase(phase) || status === 'running'
      const sourceText = command !== null ? command.args : (typeof draft === 'string' ? draft : '')
      const hasText = sourceText.trim() !== ''
      const tooltip = status === 'running'
        ? t('optimizeBusy')
        : !hasText
          ? command !== null ? t('optimizeEmptyCommand') : t('optimizeEmpty')
          : t('optimizeEntry')

      const run = async () => {
        if (busy) return
        // Read the editor's live draft at click time; the rendered selector can
        // trail a fast keystroke by one character.
        const live = readLiveInputSnapshot(ctx, sessionId)
        const liveDraft = live && typeof live.draft === 'string' ? live.draft : draft
        const liveDraftRev = live && typeof live.draftRev === 'number' ? live.draftRev : draftRev
        const liveOccurrences = live && Array.isArray(live.occurrences) ? live.occurrences : occurrences
        const liveCommand = splitCommandDraft(liveDraft, live ? live.claim : claim)
        const text = liveCommand !== null ? liveCommand.args : (typeof liveDraft === 'string' ? liveDraft : '')
        if (text.trim() === '') {
          showNotice({ kind: 'error', text: liveCommand !== null ? t('optimizeEmptyCommand') : t('optimizeEmpty') })
          return
        }
        if (text.length > 60_000) {
          showNotice({ kind: 'error', text: t('optimizeErrorTooLong') })
          return
        }
        if (request.current) request.current.abort()
        const controller = new AbortController()
        request.current = controller
        setStatus('running')
        setNotice(null)
        hideTip()
        try {
          const selection = readComposerModelSelection(ctx, sessionId)
          const response = await fetch(OPTIMIZE_API, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ sessionId, text, ...(selection || {}) }),
            signal: controller.signal,
          })
          let body = null
          try {
            body = await response.json()
          } catch {
            body = null
          }
          if (!response.ok || !body || body.ok === false) {
            const error = new Error((body && body.error) || `HTTP ${response.status}`)
            error.code = body && body.code
            throw error
          }
          if (!alive.current) return
          if (typeof body.optimized !== 'string' || body.optimized.trim() === '') {
            const error = new Error('The optimizer returned no prompt text.')
            error.code = 'INVALID_OUTPUT'
            throw error
          }
          if (liveCommand !== null) {
            const nextDraft = commandDraftText(liveCommand, body.optimized)
            // Replace only the command's argument span so its chip survives
            // untouched and the caret settles after the rewritten text. A
            // semantic setDraft would rebuild the chip asynchronously and
            // leave the caret at the start of the arguments.
            let replaced = false
            try {
              if (typeof inputActions.insertText === 'function') {
                const end = detectDraftLength(liveDraft, liveOccurrences, liveCommand)
                const start = 1 + liveCommand.separator.length
                replaced = inputActions.insertText(body.optimized, { start, end, draftRev: liveDraftRev })
              }
            } catch {
              replaced = false
            }
            if (!replaced) replaceDraftPreservingCommand(inputActions, liveCommand, nextDraft)
            focusComposer(ctx, sessionId)
            placeCaretAtEnd(ctx, sessionId)
            setStatus('success')
            showNotice({ kind: 'success', text: t('optimizeDone'), previous: liveDraft, optimized: nextDraft, command: liveCommand })
          } else {
            inputActions.setDraft(body.optimized)
            focusComposer(ctx, sessionId)
            placeCaretAtEnd(ctx, sessionId)
            setStatus('success')
            showNotice({ kind: 'success', text: t('optimizeDone'), previous: text, optimized: body.optimized, command: null })
          }
        } catch (error) {
          if (!alive.current || (error && error.name === 'AbortError')) return
          setStatus('error')
          showNotice({ kind: 'error', text: optimizeErrorText(error, t) })
        } finally {
          if (request.current === controller) request.current = null
        }
      }

      return h('span', {
        className: 'phc-seat pho-seat',
        onMouseEnter: showTip,
        onMouseLeave: hideTip,
      },
        h('button', {
          type: 'button',
          className: 'phc-trigger pho-trigger',
          'data-prompt-optimize-entry': '',
          'aria-label': t('optimizeEntry'),
          'aria-busy': status === 'running',
          disabled: busy,
          onMouseDown: (event) => { event.preventDefault() },
          onFocus: showTip,
          onBlur: hideTip,
          onClick: run,
        }, status === 'running'
          ? h(Spinner, { size: 15 })
          : status === 'success'
            ? h(CheckIcon, { size: 16, strokeWidth: 2 })
            : h(SparkleGlyph, { size: 16 })),
        tip && notice === null
          ? h('span', { className: 'phc-tip', role: 'tooltip' }, tooltip)
          : null,
        notice === null
          ? null
          : h('div', {
            className: `pho-toast${notice.kind === 'error' ? ' is-error' : ''}`,
            role: notice.kind === 'error' ? 'alert' : 'status',
          },
            h('span', { className: 'pho-toast-text' }, notice.text),
            notice.kind === 'success'
              ? h('button', { type: 'button', className: 'pho-toast-action', onClick: undo }, t('optimizeUndo'))
              : null,
            h('button', {
              type: 'button',
              className: 'pho-toast-close',
              'aria-label': t('optimizeDismiss'),
              onClick: dismissNotice,
            }, '×')))
    }

    /** Searchable palette rendered in the composer's overlay anchor, opening upward. */
    function ComposerPalette(props) {
      const { ctx, seat, sessionId, inputActions, useInput, focusComposer: focus, openHistoryPanel } = props
      const locale = useLocale(ctx)
      const t = React.useCallback((key, values) => fill(translate(locale, key), values || {}), [locale])
      const snapshot = React.useSyncExternalStore(seat.subscribe, seat.getSnapshot)
      const open = snapshot.open && snapshot.sessionId === sessionId
      const phase = useInput((state) => state.phase)
      const draft = useInput((state) => state.draft)
      const draftRev = useInput((state) => state.draftRev)
      const occurrences = useInput((state) => state.occurrences)
      const claim = useInput((state) => state.claim)
      const busy = isFrozenPhase(phase)
      const command = splitCommandDraft(draft, claim)
      const [query, setQuery] = React.useState('')
      const [data, setData] = React.useState({ status: 'idle', entries: null, error: null })
      const [active, setActive] = React.useState(0)
      const [applyError, setApplyError] = React.useState(null)
      const [maxHeight, setMaxHeight] = React.useState(PALETTE_MAX_HEIGHT)
      const cardRef = React.useRef(null)
      const searchRef = React.useRef(null)
      const listRef = React.useRef(null)

      React.useEffect(() => {
        if (!open) return
        setQuery('')
        setActive(0)
        setApplyError(null)
      }, [open, sessionId])

      React.useEffect(() => {
        if (!open) return undefined
        let alive = true
        const sync = (status) => {
          if (!alive) return
          setData({ status, entries: paletteIndex.entries, error: paletteIndex.error })
        }
        sync(paletteIndex.entries === null ? 'loading' : 'ready')
        loadPaletteIndex(false)
          .then((cache) => { sync(cache.entries === null ? 'error' : 'ready') })
          .catch(() => {})
        return () => { alive = false }
      }, [open, sessionId])

      React.useLayoutEffect(() => {
        if (!open) return undefined
        const measure = () => {
          const node = cardRef.current
          // The slot layer between the card and the host anchor is a
          // display:contents wrapper with a 0x0 rect, so walk to the host's
          // explicit overlay anchor instead of trusting parentElement. Older
          // hosts without that attribute still resolve through the first
          // positioned ancestor.
          let anchor = node && typeof node.closest === 'function'
            ? node.closest('[data-composer-overlay]')
            : null
          if (!anchor && node) {
            let candidate = node.parentElement
            while (candidate && candidate !== document.body) {
              if (getComputedStyle(candidate).position !== 'static') {
                anchor = candidate
                break
              }
              candidate = candidate.parentElement
            }
            if (!anchor) anchor = node.parentElement
          }
          if (!anchor) return
          // The overlay anchor has zero height at the composer's top edge; all
          // room above it belongs to the palette. Never force a minimum taller
          // than that room: an over-tall card would push its search row above
          // the viewport on a short window.
          const anchorTop = anchor.getBoundingClientRect().top
          const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight
          // Leave the shell's top header untouched: its translucent row paints
          // above the composer layer and would cover the palette's search row.
          const shellHeader = document.querySelector('header')
          const headerBottom = shellHeader ? shellHeader.getBoundingClientRect().bottom : 0
          const topInset = Math.max(PALETTE_VIEWPORT_GAP, Math.floor(headerBottom) + 8)
          const room = Math.floor(anchorTop - topInset)
          const viewportRoom = Math.floor(viewportHeight - topInset - PALETTE_VIEWPORT_GAP)
          setMaxHeight(Math.max(0, Math.min(PALETTE_MAX_HEIGHT, room, viewportRoom)))
        }
        measure()
        window.addEventListener('resize', measure)
        const visualViewport = window.visualViewport
        if (visualViewport) visualViewport.addEventListener('resize', measure)
        return () => {
          window.removeEventListener('resize', measure)
          if (visualViewport) visualViewport.removeEventListener('resize', measure)
        }
      }, [open])

      React.useEffect(() => {
        if (!open) return undefined
        const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
        if (coarse) return undefined
        const node = searchRef.current
        if (node) node.focus({ preventScroll: true })
        return undefined
      }, [open, sessionId])

      React.useEffect(() => {
        if (!open) return undefined
        const onPointerDown = (event) => {
          const target = event.target
          const card = cardRef.current
          if (card !== null && target instanceof Node && card.contains(target)) return
          if (target instanceof Element && target.closest(`[${ENTRY_ATTR}]`) !== null) return
          seat.close()
        }
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          seat.close()
          if (!focus(sessionId)) seat.focusTrigger()
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown, true)
        }
      }, [open, seat, sessionId, focus])

      const entries = Array.isArray(data.entries) ? data.entries : []
      const results = React.useMemo(
        () => searchEntries(entries, query).slice(0, PALETTE_RESULT_LIMIT),
        [entries, query],
      )

      React.useEffect(() => {
        setActive((value) => (value >= results.length ? 0 : value))
      }, [results])

      React.useEffect(() => {
        if (!open) return
        const row = listRef.current ? listRef.current.querySelector('[data-active="true"]') : null
        if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' })
      }, [open, active, results])

      const refresh = () => {
        setData((previous) => ({
          ...previous,
          status: previous.entries === null ? 'loading' : previous.status,
          error: null,
        }))
        loadPaletteIndex(true)
          .then((cache) => {
            setData({
              status: cache.entries === null ? 'error' : 'ready',
              entries: cache.entries,
              error: cache.error,
            })
          })
          .catch(() => {})
      }

      const applyEntry = (entry) => {
        if (!entry || busy || !inputActions) return
        // Read the editor's own current draft: a selector can trail keyboard
        // input by one keystroke, and a stale range would split the prompt.
        const live = readLiveInputSnapshot(ctx, sessionId)
        const liveDraft = live && typeof live.draft === 'string' ? live.draft : draft
        const liveDraftRev = live && typeof live.draftRev === 'number' ? live.draftRev : draftRev
        const liveOccurrences = live && Array.isArray(live.occurrences) ? live.occurrences : occurrences
        const liveCommand = splitCommandDraft(liveDraft, live ? live.claim : claim)
        const blankDraft = (liveDraft === undefined || liveDraft === '') && (liveOccurrences === undefined || liveOccurrences.length === 0)
        // A leading slash-command chip stays in place; its existing argument
        // text is kept and the prompt is appended after it. Insert into the
        // live editor instead of rebuilding the semantic draft so the command
        // chip is not re-created (which would move the caret to its start).
        if (liveCommand !== null) {
          let extra = entry.text
          if (liveCommand.args !== '' && !/\s$/.test(liveCommand.args)) extra = ` ${extra}`
          else if (liveCommand.args === '' && liveCommand.separator === '') extra = ` ${extra}`
          let applied = false
          try {
            if (typeof inputActions.insertText === 'function') {
              const end = detectDraftLength(liveDraft, liveOccurrences, liveCommand)
              applied = inputActions.insertText(extra, { start: end, end, draftRev: liveDraftRev })
            }
            if (!applied) {
              replaceDraftPreservingCommand(inputActions, liveCommand, commandDraftText(liveCommand, liveCommand.args + extra))
              applied = true
            }
          } catch {
            applied = false
          }
          if (!applied) {
            setApplyError(t('composerInsertFailed'))
            return
          }
          seat.close()
          if (!focus(sessionId)) seat.focusTrigger()
          placeCaretAtEnd(ctx, sessionId)
          return
        }
        let text = entry.text
        if (!blankDraft) {
          // Pasting at the caret must not glue two prompts together: pad the
          // insertion when the neighbouring characters are not whitespace.
          // Reference chips shift the projection, so the check stays off then.
          const span = snapshot.span
          const clean = typeof liveDraft === 'string' && (liveOccurrences === undefined || liveOccurrences.length === 0)
          if (clean && span && typeof span.start === 'number') {
            const before = liveDraft.slice(0, span.start)
            const after = liveDraft.slice(span.start)
            if (before !== '' && !/\s$/.test(before)) text = ` ${text}`
            if (after !== '' && !/^\s/.test(after)) text = `${text} `
          }
        }
        let applied = false
        try {
          if (blankDraft && typeof inputActions.setDraft === 'function') {
            inputActions.setDraft(text)
            applied = true
          } else if (typeof inputActions.insertText === 'function') {
            const captured = snapshot.span
            if (captured !== null && captured !== undefined) applied = inputActions.insertText(text, captured)
            if (!applied) applied = inputActions.insertText(text, inputActions.captureInsertion())
          }
        } catch {
          applied = false
        }
        if (!applied) {
          setApplyError(t('composerInsertFailed'))
          return
        }
        seat.close()
        if (!focus(sessionId)) seat.focusTrigger()
        if (blankDraft) placeCaretAtEnd(ctx, sessionId)
      }

      const onKeyDown = (event) => {
        // Roving keys belong to the search field; the card's buttons keep theirs.
        if (searchRef.current === null || event.target !== searchRef.current) return
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          if (results.length === 0) return
          const step = event.key === 'ArrowDown' ? 1 : -1
          setActive((value) => (value + step + results.length) % results.length)
          return
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault()
            seat.close()
            if (!focus(sessionId)) seat.focusTrigger()
            return
          }
          const entry = results[active]
          if (!entry) return
          event.preventDefault()
          applyEntry(entry)
        }
      }

      if (!open) return null

      const total = entries.length
      const count = results.length
      const activeId = count > 0 ? `phc-row-${active}` : undefined

      const renderRow = (entry, index) => {
        // A two-line preview: paragraph breaks become spaces so the clamp shows
        // the opening words instead of an empty line plus an ellipsis.
        const preview = buildPreview(entry.text, query).replace(/\s+/g, ' ')
        return h('div', {
          key: entry.id,
          id: `phc-row-${index}`,
          className: `phc-row${index === active ? ' is-active' : ''}`,
          role: 'option',
          'aria-selected': index === active,
          'data-active': index === active ? 'true' : 'false',
          onMouseEnter: () => setActive(index),
          onClick: () => applyEntry(entry),
        },
          h('div', { className: 'phc-row-main' },
            h('p', { className: 'phc-row-prompt' }, highlightText(preview, query)),
            h('div', { className: 'phc-row-meta' },
              h(FolderIcon, { size: 11 }),
              h('span', { className: 'phc-row-project' }, entry.project || t('unknownProject')),
              h('span', { className: 'phc-sep', 'aria-hidden': true }, '·'),
              h('span', { className: 'phc-row-session' }, entry.sessionTitle || t('unknownSession')),
              h('span', { className: 'phc-row-time' }, formatTime(entry.time, locale)))),
          h('button', {
            type: 'button',
            className: 'phc-apply',
            disabled: busy,
            'aria-label': `${t('composerApply')}: ${String(entry.text).slice(0, 40).replace(/\s+/g, ' ')}`,
            onMouseDown: (event) => { event.preventDefault() },
            onClick: (event) => { event.stopPropagation(); applyEntry(entry) },
          }, t('composerApply')))
      }

      const body = results.length > 0
        ? h('div', {
          ref: listRef,
          id: 'phc-palette-list',
          className: 'phc-list',
          role: 'listbox',
          'aria-label': t('composerEntry'),
        }, results.map(renderRow))
        : data.status === 'loading' || data.status === 'idle'
          ? h('div', { className: 'phc-status', role: 'status', 'aria-label': t('composerLoading') },
            Array.from({ length: PALETTE_SKELETON_ROWS }, (_, index) => h('div', { key: index, className: 'phc-skel-row' },
              h('div', { className: 'phc-skel-line', style: { width: `${86 - index * 9}%` } }),
              h('div', { className: 'phc-skel-meta' }))))
          : h('div', { className: 'phc-status', role: 'status' },
            data.status === 'error'
              ? t('composerError')
              : query.trim() === ''
                ? t('composerEmpty')
                : t('composerNoMatch'))

      return h('div', {
        ref: cardRef,
        className: 'phc-card',
        role: 'dialog',
        'aria-label': t('composerEntry'),
        'data-menu-material': '',
        style: { maxHeight: `${maxHeight}px` },
        onKeyDown,
      },
      h('div', { className: 'phc-search' },
        h('span', { className: 'phc-search-icon' }, h(SearchIcon, { size: 14 })),
        h('input', {
          ref: searchRef,
          type: 'search',
          role: 'combobox',
          value: query,
          onChange: (event) => setQuery(event.target.value),
          placeholder: t('composerSearchPlaceholder'),
          'aria-label': t('composerSearchLabel'),
          'aria-autocomplete': 'list',
          'aria-expanded': true,
          'aria-controls': 'phc-palette-list',
          'aria-activedescendant': activeId,
          autoComplete: 'off',
          spellCheck: false,
        }),
        query !== ''
          ? h('button', {
            type: 'button',
            className: 'phc-search-clear',
            'aria-label': t('clearSearch'),
            onMouseDown: (event) => { event.preventDefault() },
            onClick: () => {
              setQuery('')
              if (searchRef.current) searchRef.current.focus()
            },
          }, h(CloseIcon, { size: 10 }))
          : null,
        data.status === 'ready'
          ? h('span', { className: 'phc-search-count' },
            query.trim() === ''
              ? t('composerCount', { total })
              : t('composerMatches', { shown: count, total }))
          : null),
      data.error !== null
        ? h('div', { className: 'phc-error', role: 'status' },
          h('span', { className: 'phc-error-text' }, t('composerError')),
          h('button', { type: 'button', className: 'phc-retry', onClick: refresh }, t('retry')))
        : null,
      applyError !== null
        ? h('div', { className: 'phc-error', role: 'alert' },
          h('span', { className: 'phc-error-text' }, applyError),
          h('button', { type: 'button', className: 'phc-retry', onClick: () => setApplyError(null) }, t('composerDismiss')))
        : null,
      body,
      maxHeight > PALETTE_COMPACT_HEIGHT
        ? h('div', { className: 'phc-foot' },
          h('span', { className: 'phc-foot-hint' }, busy ? t('composerBusy') : command !== null ? t('composerHintCommand') : t('composerHint')),
          h('button', {
            type: 'button',
            className: 'phc-view-all',
            onMouseDown: (event) => { event.preventDefault() },
            onClick: () => {
              seat.close()
              openHistoryPanel()
            },
          }, t('composerViewAll')))
        : null)
    }

    function installStyles() {
      if (typeof document === 'undefined' || !document.head) return undefined
      const id = 'dsh-prompt-manage-styles'
      if (document.getElementById(id)) return undefined
      const style = document.createElement('style')
      style.id = id
      style.textContent = `
.ph-root {
  display: flex; flex-direction: column; width: 100%; height: 100%;
  min-width: 0; min-height: 0; overflow: hidden;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-size: 14px; line-height: 1.6;
}
.ph-scroll { flex: 1; min-height: 0; overflow: auto; scrollbar-gutter: stable; }
.ph-content { max-width: 960px; margin: 0 auto; padding: 0 clamp(24px, 4vw, 48px) 48px; }
@media (max-width: 767px) { .ph-content { padding-inline: 20px; } }
.ph-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding-top: 28px; margin-bottom: 20px; }
[data-platform='darwin'] .ph-heading { padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px)); }
.ph-heading-copy { min-width: 0; }
.ph-title { margin: 0; font-size: 20px; line-height: 28px; font-weight: 500; letter-spacing: -0.01em; }
.ph-title:focus { outline: none; }
.ph-subtitle { margin: 6px 0 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-tertiary); }
.ph-actions { display: flex; flex: none; align-items: center; gap: 8px; }
.ph-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 12px; box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 16px;
  background: transparent; color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; line-height: 20px; white-space: nowrap;
  cursor: pointer; transition: background-color .15s, border-color .15s, color .15s;
}
@media (hover: hover) { .ph-btn:hover { background: var(--dsw-alias-interactive-bg-hover); } }
.ph-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.ph-btn[disabled] { opacity: .55; cursor: default; }
.ph-btn-primary { border-color: transparent; background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary-foreground); }
.ph-search {
  display: flex; align-items: center; gap: 8px; height: 40px; box-sizing: border-box;
  margin-bottom: 18px; padding: 0 10px 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-tertiary);
  transition: border-color .15s;
}
@media (hover: hover) { .ph-search:hover { border-color: var(--dsw-alias-border-l2); } }
.ph-search:focus-within { border-color: var(--dsw-alias-state-business-primary); }
.ph-search.is-disabled { opacity: .6; }
.ph-search.is-disabled input { cursor: default; }
.ph-search-icon { display: flex; flex: none; }
.ph-search input {
  flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0;
  border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 14px;
}
.ph-search input::-webkit-search-cancel-button { display: none; }
.ph-search input::placeholder { color: var(--dsw-alias-label-caption); }
.ph-clear {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 24px; height: 24px; padding: 0; border: 0; border-radius: 12px;
  background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer;
}
.ph-clear:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.ph-clear:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.ph-count { flex: none; padding-left: 8px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-caption); white-space: nowrap; }
.ph-list {
  overflow: hidden; border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 16px;
  background: var(--dsw-alias-bg-layer-1);
}
.ph-row { position: relative; padding: 16px 18px 13px; border-top: 0.5px solid var(--dsw-alias-border-l1); }
.ph-row:first-child { border-top: 0; }
@media (hover: hover) { .ph-row:hover { background: var(--dsw-alias-interactive-bg-hover); } }
.ph-prompt {
  margin: 0; padding-right: 8px; white-space: pre-wrap; overflow-wrap: anywhere;
  font-size: 14px; line-height: 24px; color: var(--dsw-alias-label-primary);
}
.ph-prompt.ph-clamped { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.ph-mark { border-radius: 3px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent); color: inherit; }
.ph-expand {
  margin: 4px 0 0; padding: 0; border: 0; background: transparent;
  color: var(--dsw-alias-brand-primary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer;
}
.ph-expand:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; border-radius: 3px; }
.ph-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px;
  margin-top: 10px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary);
}
.ph-project, .ph-session { display: inline-flex; align-items: center; gap: 4px; min-width: 0; max-width: 260px; }
.ph-project { color: var(--dsw-alias-label-secondary); }
.ph-session { max-width: 320px; }
.ph-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ph-sep { color: var(--dsw-alias-label-caption); }
.ph-truncated { color: var(--dsw-alias-label-caption); }
.ph-fuzzy { padding: 0 6px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 18px; }
.ph-time { margin-left: auto; color: var(--dsw-alias-label-caption); white-space: nowrap; }
.ph-copy {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  height: 26px; min-width: 56px; padding: 0 9px; box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 13px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 12px; line-height: 18px; cursor: pointer;
  transition: background-color .15s, border-color .15s, color .15s;
}
.ph-copy:hover { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
.ph-copy:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.ph-copy.is-copied { border-color: var(--dsw-alias-state-success-primary); color: var(--dsw-alias-state-success-primary); }
.ph-copy.is-error { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.ph-notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding: 9px 12px; border: 0.5px solid var(--dsw-alias-state-warn-primary); border-radius: 10px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.ph-notice-btn { flex: none; height: 26px; padding: 0 10px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 13px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer; }
.ph-notice-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.ph-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.ph-foot { margin: 16px 0 0; text-align: center; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-caption); }
.ph-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 64px 24px; color: var(--dsw-alias-label-tertiary); }
.ph-illustration { color: var(--dsw-alias-border-l2); margin-bottom: 16px; }
.ph-empty h2 { margin: 0 0 6px; font-size: 16px; line-height: 24px; font-weight: 500; color: var(--dsw-alias-label-primary); }
.ph-empty p { margin: 0 0 16px; max-width: 460px; font-size: 13px; line-height: 20px; overflow-wrap: anywhere; }
.ph-skel-row { padding: 16px 18px; border-top: 0.5px solid var(--dsw-alias-border-l1); }
.ph-skel-row:first-child { border-top: 0; }
.ph-skel-line { height: 14px; margin-bottom: 9px; border-radius: 6px; background: var(--dsw-alias-bg-layer-2); animation: ph-pulse 1.4s ease-in-out infinite; }
.ph-skel-meta { width: 46%; height: 10px; margin-top: 14px; border-radius: 5px; background: var(--dsw-alias-bg-layer-2); animation: ph-pulse 1.4s ease-in-out infinite; }
@keyframes ph-pulse { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
.ph-spin { animation: ph-rotate .9s linear infinite; }
@keyframes ph-rotate { to { transform: rotate(360deg); } }
@media (max-width: 620px) {
  .ph-heading { align-items: flex-start; flex-direction: column; }
  .ph-time { margin-left: 0; }
  .ph-project, .ph-session { max-width: 100%; }
}

/* ---- composer entry chip ------------------------------------------------ */
.phc-seat { position: relative; display: inline-flex; align-items: center; flex: none; }
.phc-trigger {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 28px; height: 28px; padding: 0; box-sizing: border-box;
  border: 0; border-radius: var(--dsw-radius-sm);
  background: transparent; color: var(--dsw-alias-label-secondary);
  cursor: pointer; transition: background-color .15s ease, color .15s ease;
}
@media (hover: hover) {
  .phc-trigger:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
}
.phc-trigger[aria-expanded='true'] { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.phc-trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
}
.phc-tip {
  position: absolute; left: 50%; bottom: calc(100% + 6px); z-index: 5;
  padding: 3px 7px; border-radius: 6px;
  background: var(--dsw-alias-tooltip-bg); color: var(--dsw-alias-tooltip-label);
  font-size: 11px; line-height: 16px; white-space: nowrap;
  pointer-events: none; transform: translateX(-50%);
}

/* ---- composer prompt optimizer chip ------------------------------------ */
.pho-trigger[disabled] { opacity: .45; cursor: default; }
@media (hover: hover) {
  .pho-trigger[disabled]:hover { background: transparent; color: var(--dsw-alias-label-secondary); }
}
.pho-toast {
  position: absolute; right: 0; bottom: calc(100% + 6px); z-index: 8;
  display: flex; align-items: center; gap: 6px;
  width: 260px; max-width: calc(100vw - 32px); padding: 6px 8px; box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 8px;
  background: var(--dsw-alias-bg-overlay, var(--dsw-specific-menu, var(--dsw-alias-bg-layer-1)));
  color: var(--dsw-alias-label-primary);
  box-shadow: var(--dsw-elevation-prominent);
  font-size: 11px; line-height: 16px; white-space: pre-wrap;
}
.pho-toast.is-error { border-color: var(--dsw-alias-state-error-primary); }
.pho-toast-text { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.pho-toast-action {
  flex: none; padding: 0; border: 0; background: transparent;
  color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11px; line-height: 16px;
  cursor: pointer;
}
.pho-toast-action:hover { text-decoration: underline; }
.pho-toast-close {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 16px; height: 16px; padding: 0; border: 0; border-radius: 50%;
  background: transparent; color: var(--dsw-alias-label-tertiary);
  font: inherit; font-size: 13px; line-height: 16px; cursor: pointer;
}
.pho-toast-close:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }

/* ---- composer palette (rendered in the composer's overlay anchor) -------- */
.phc-card {
  position: absolute; left: 0; right: 0; bottom: calc(100% + 4px);
  box-sizing: border-box; z-index: 100;
  display: flex; flex-direction: column;
  min-width: min(260px, 100%); max-width: 100%;
  max-height: calc(100dvh - 24px);
  padding: 4px;
  border: 0; border-radius: var(--dsw-radius-lg);
  background: var(--dsw-specific-menu, var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1)));
  -webkit-backdrop-filter: var(--dsw-menu-backdrop-filter, none);
  backdrop-filter: var(--dsw-menu-backdrop-filter, none);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-prominent);
  color: var(--dsw-alias-label-primary);
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
  outline: none;
  overflow: hidden;
  font-size: 13px; line-height: 20px;
}
.phc-search {
  display: flex; align-items: center; gap: 6px; flex: none;
  margin: 2px 2px 3px; padding: 5px 7px;
  border-radius: var(--dsw-radius-md);
}
.phc-search-icon { display: inline-flex; flex: none; color: var(--dsw-alias-label-caption); }
.phc-search input {
  flex: 1; min-width: 0; height: 20px; margin: 0; padding: 0;
  border: 0; outline: 0; background: transparent;
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; line-height: 20px;
}
.phc-search input::-webkit-search-cancel-button { display: none; }
.phc-search input::placeholder { color: var(--dsw-alias-label-caption); }
@media (pointer: coarse) { .phc-search input { font-size: 16px; } }
.phc-search-clear {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%;
  background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer;
}
.phc-search-clear:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.phc-search-clear:focus-visible { outline: none; background: var(--dsw-alias-interactive-bg-hover); }
.phc-search-count { flex: none; padding-left: 2px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-caption); white-space: nowrap; }
.phc-list {
  display: flex; flex-direction: column; gap: 1px;
  min-height: 0; padding: 1px 0 2px;
  overflow-x: hidden; overflow-y: auto;
}
.phc-row {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 7px 7px 6px; border-radius: var(--dsw-radius-md);
  cursor: pointer;
}
.phc-row.is-active { background: var(--dsw-alias-interactive-bg-hover); }
.phc-row-main { flex: 1; min-width: 0; }
.phc-row-prompt {
  margin: 0; overflow-wrap: anywhere; white-space: pre-wrap;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 13px; line-height: 19px; color: var(--dsw-alias-label-primary);
}
.phc-mark { border-radius: 3px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent); color: inherit; }
.phc-row-meta {
  display: flex; align-items: center; gap: 4px; min-width: 0;
  margin-top: 3px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
}
.phc-row-project, .phc-row-session {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.phc-row-project { flex: 0 1 auto; max-width: 30%; color: var(--dsw-alias-label-secondary); }
.phc-row-session { flex: 0 1 auto; max-width: 42%; }
.phc-row-time { flex: none; margin-left: auto; padding-left: 8px; color: var(--dsw-alias-label-caption); white-space: nowrap; }
.phc-apply {
  flex: none; height: 24px; min-width: 44px; padding: 0 9px; box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 12px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 12px; line-height: 18px; white-space: nowrap;
  cursor: pointer; transition: background-color .15s ease, border-color .15s ease, color .15s ease;
}
.phc-apply:hover:not(:disabled) {
  border-color: var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.phc-apply:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
}
.phc-apply:disabled { opacity: .5; cursor: default; }
.phc-status { padding: 12px 10px; text-align: center; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.phc-skel-row { padding: 7px; }
.phc-skel-line, .phc-skel-meta { border-radius: 5px; background: var(--dsw-alias-bg-layer-2); animation: ph-pulse 1.4s ease-in-out infinite; }
.phc-skel-line { height: 12px; margin-bottom: 7px; }
.phc-skel-meta { width: 38%; height: 9px; }
.phc-error {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin: 2px; padding: 6px 8px;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-interactive-bg-hover-danger);
  color: var(--dsw-alias-state-error-primary);
  font-size: 11px; line-height: 16px;
}
.phc-error-text { flex: 1; min-width: 0; }
.phc-retry {
  flex: none; height: 20px; padding: 0 7px; border: 0.5px solid currentColor; border-radius: 10px;
  background: transparent; color: inherit; font: inherit; font-size: 11px; line-height: 16px; cursor: pointer;
}
.phc-retry:hover { background: var(--dsw-alias-interactive-bg-hover); }
.phc-retry:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); }
.phc-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; flex: none;
  margin-top: 2px; padding: 5px 7px 3px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-caption);
}
.phc-foot-hint { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.phc-view-all {
  flex: none; padding: 0; border: 0; background: transparent;
  color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11px; line-height: 16px;
  cursor: pointer;
}
.phc-view-all:hover { text-decoration: underline; }
.phc-view-all:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); border-radius: 4px; }
`
      document.head.appendChild(style)
      return () => style.remove()
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => installStyles(), 'prompt-history: styles')
        ctx.effect(() => ctx.locale.register(NS, DICT), 'prompt-history: dictionaries')
        const label = () => translate(normalizeLocale(ctx.locale.getSnapshot().active), 'navLabel')
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL, order: 8, label,
        }, (props) => h(HistoryGlyph, { size: (props && props.size) || 18 })))
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: PANEL,
        }, (props) => h(Panel, { ...props, ctx })))

        // Composer entry + palette: one shared seat so the chip in the tool row
        // and the palette in the overlay anchor agree on who is open.
        const seat = createComposerSeat()
        ctx.effect(() => () => seat.dispose(), 'prompt-history: composer seat')
        const composerFace = {
          seat,
          focusComposer: (sessionId) => focusComposer(ctx, sessionId),
          openHistoryPanel: () => {
            try {
              const layout = ctx.get('layout')
              if (layout && typeof layout.selectPanel === 'function') layout.selectPanel(PANEL)
            } catch {
              /* the sidebar entry still reaches the page */
            }
          },
        }
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right', id: `${PANEL}-optimize`, order: 39,
          label: () => translate(normalizeLocale(ctx.locale.getSnapshot().active), 'optimizeEntry'),
        }, (props) => h(ComposerOptimize, { ...props, ctx })))
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right', id: PANEL, order: 40, label,
          inject: () => composerFace,
        }, (props) => h(ComposerEntry, { ...props, ctx })))
        ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
          name: 'conversation.input.overlay', id: `${PANEL}-palette`, order: 40,
          inject: () => composerFace,
        }, (props) => h(ComposerPalette, { ...props, ctx })))
      },
    }
  },
})
