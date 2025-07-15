import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

const BASE_URL = '/tenant/common'

/** @desc 查询租户套餐列表 */
export function listTenantPackageDict(query?: { description: string, status: number }) {
  return http.get<LabelValueState[]>(`${BASE_URL}/dict/package`, query)
}
