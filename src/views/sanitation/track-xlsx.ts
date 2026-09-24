import { unzipSync } from 'fflate'

export interface TrackPoint { time: string, latitude: number, longitude: number, timestamp: number }

function xml(bytes: Uint8Array): Document {
  const document = new DOMParser().parseFromString(new TextDecoder().decode(bytes), 'application/xml')
  if (document.getElementsByTagName('parsererror').length) throw new Error('Excel 文件结构无效')
  return document
}

function nodes(parent: Document | Element, tag: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS('*', tag))
}

function cellText(cell: Element, strings: string[]): string {
  const value = nodes(cell, 'v')[0]?.textContent || ''
  if (cell.getAttribute('t') === 's') return strings[Number(value)] || ''
  if (cell.getAttribute('t') === 'inlineStr') return nodes(cell, 't').map((node) => node.textContent || '').join('')
  return value
}

function column(reference: string): number {
  return [...(reference.match(/^[A-Z]+/i)?.[0].toUpperCase() || '')].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1
}

function dateText(value: string, date1904: boolean): string {
  if (/^\d+(\.\d+)?$/.test(value)) {
    const serial = Number(value)
    if (!Number.isFinite(serial) || serial < 0) throw new Error('时间无效')
    const date = new Date(Date.UTC(date1904 ? 1904 : 1899, date1904 ? 0 : 11, date1904 ? 1 : 30) + Math.round(serial * 86400000))
    return date.toISOString().slice(0, 19).replace('T', ' ')
  }
  const normalized = value.trim().replace('T', ' ').replace(/\//g, '-')
  if (!/^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{2}(:\d{2})?$/.test(normalized)) throw new Error('时间格式无效')
  const parsed = new Date(normalized.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) throw new Error('时间无效')
  return normalized.length === 16 ? `${normalized}:00` : normalized
}

export async function readTrackXlsx(file: File): Promise<TrackPoint[]> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('请选择 .xlsx 文件')
  if (file.size > 10 * 1024 * 1024) throw new Error('文件不能超过 10 MB')
  let archive: Record<string, Uint8Array>
  try {
    archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
  } catch {
    throw new Error('Excel 文件损坏或不是有效的 .xlsx 文件')
  }
  const workbookBytes = archive['xl/workbook.xml']
  const sheetBytes = archive['xl/worksheets/sheet1.xml']
  if (!workbookBytes || !sheetBytes) throw new Error('Excel 缺少第一个工作表')
  const workbook = xml(workbookBytes)
  const date1904 = nodes(workbook, 'workbookPr')[0]?.getAttribute('date1904') === '1'
  const strings = archive['xl/sharedStrings.xml']
    ? nodes(xml(archive['xl/sharedStrings.xml']), 'si').map((item) => nodes(item, 't').map((text) => text.textContent || '').join(''))
    : []
  const rows = nodes(xml(sheetBytes), 'sheetData')[0]
  if (!rows) throw new Error('Excel 缺少数据表')
  const sheetRows = nodes(rows, 'row')
  const header = sheetRows[0]
  if (!header) throw new Error('Excel 缺少表头')
  const headings = new Map<string, number>()
  for (const cell of nodes(header, 'c')) headings.set(cellText(cell, strings).trim().toLowerCase(), column(cell.getAttribute('r') || ''))
  const timeColumn = headings.get('time') ?? headings.get('时间')
  const latColumn = headings.get('latitude') ?? headings.get('纬度')
  const lngColumn = headings.get('longitude') ?? headings.get('经度')
  if (timeColumn === undefined || latColumn === undefined || lngColumn === undefined) throw new Error('表头需要 time、latitude、longitude（或时间、纬度、经度）')
  const points: TrackPoint[] = []
  for (const row of sheetRows.slice(1)) {
    const cells = new Map(nodes(row, 'c').map((cell) => [column(cell.getAttribute('r') || ''), cellText(cell, strings)]))
    if (!cells.get(timeColumn)?.trim()) continue
    const line = row.getAttribute('r') || '?'
    try {
      const time = dateText(cells.get(timeColumn)!, date1904)
      const latitude = Number(cells.get(latColumn))
      const longitude = Number(cells.get(lngColumn))
      if (!cells.get(latColumn)?.trim() || !cells.get(lngColumn)?.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('经纬度无效')
      points.push({ time, latitude, longitude, timestamp: new Date(time.replace(' ', 'T')).getTime() })
    } catch { throw new Error(`第 ${line} 行的时间或经纬度无效`) }
    if (points.length > 100000) throw new Error('最多导入 100000 个轨迹点')
  }
  if (!points.length) throw new Error('表格中没有有效轨迹点')
  points.sort((a, b) => a.timestamp - b.timestamp)
  return points
}
