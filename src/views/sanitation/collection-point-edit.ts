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
  status: number
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
  if (![0, 1].includes(draft.status)) return '请选择有效状态'
  if (!Number.isFinite(draft.longitude) || draft.longitude < -180 || draft.longitude > 180) return '经度必须在 -180～180 之间'
  if (!Number.isFinite(draft.latitude) || draft.latitude < -90 || draft.latitude > 90) return '纬度必须在 -90～90 之间'
}
