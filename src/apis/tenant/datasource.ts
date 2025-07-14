import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/tenant/datasource'

/** @desc 查询租户数据源列表 */
export function listTenantDatasource(query: T.TenantDatasourcePageQuery) {
  return http.get<PageRes<T.TenantDatasourceResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询租户数据源详情 */
export function getTenantDatasource(id: string) {
  return http.get<T.TenantDatasourceResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增租户数据源 */
export function addTenantDatasource(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改租户数据源 */
export function updateTenantDatasource(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除租户数据源 */
export function deleteTenantDatasource(id: string) {
  return http.del(`${BASE_URL}/${id}`)
}

/** @desc 测试租户数据源连接 */
export function testTenantDatasourceConnection(id: string) {
  return http.post(`${BASE_URL}/${id}/test/connection`)
}
