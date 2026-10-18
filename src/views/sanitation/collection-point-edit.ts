/** GIS 演示编辑的基本信息，保留点位编号等其它接口字段。 */
export interface CollectionPointDraft {
  id: number
  pointName: string
  townshipId: number | undefined
  villageId: number | undefined
  containerCount: number
  address: string
  responsiblePerson?: string | null
  contactPhone?: string | null
  serviceRadius: number
  status: number | undefined
  longitude: number
  latitude: number
}
export interface CollectionPointArea {
  townshipId: number
  townshipName: string
  villageId: number
  villageName: string
}
export function validateCollectionPointDraft(draft: CollectionPointDraft): string | undefined {
  if (!draft.pointName.trim()) return '请输入点位名称'
  if (!Number.isSafeInteger(draft.townshipId) || draft.townshipId! <= 0) return '请选择所属乡镇'
  if (!Number.isSafeInteger(draft.villageId) || draft.villageId! <= 0) return '请选择所属村庄'
  if (!Number.isSafeInteger(draft.containerCount) || draft.containerCount < 0) return '容量数量必须为非负整数'
  if (!Number.isFinite(draft.serviceRadius) || draft.serviceRadius <= 0) return '服务半径必须大于 0 米'
  if (draft.status !== 0 && draft.status !== 1) return '请选择有效状态'
  if (!Number.isFinite(draft.longitude) || draft.longitude < -180 || draft.longitude > 180) return '经度必须在 -180～180 之间'
  if (!Number.isFinite(draft.latitude) || draft.latitude < -90 || draft.latitude > 90) return '纬度必须在 -90～90 之间'
}

/** 兼容旧版采集服务仅在 rawPayload 中保留状态，未知状态不推断为停用。 */
export function getCollectionPointStatus(point: { status?: unknown, rawPayload?: string | null }): 0 | 1 | undefined {
  let value = point.status
  if (value == null && point.rawPayload) {
    try { value = JSON.parse(point.rawPayload)?.status } catch { /* 无有效原始状态时显示未知。 */ }
  }
  if (value === 1 || value === '1') return 1
  if (value === 0 || value === '0') return 0
  return undefined
}
