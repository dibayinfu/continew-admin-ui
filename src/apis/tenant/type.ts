/** 租户 */
export interface TenantResp {
  id: string
  name: string
  code: string
  domain: string
  expireTime: string
  isolationLevel: number
  description: number
  status: string
  packageId: string
  datasourceId: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  createUserString: string
  updateUserString: string
  packageName: string
  datasourceName: string
}
export interface TenantQuery {
  description?: string
  packageId?: string
  status?: string
  sort: Array<string>
}
export interface TenantPageQuery extends TenantQuery, PageQuery {}

/** 租户套餐 */
export interface TenantPackageResp {
  id: string
  name: string
  sort: number
  menuCheckStrictly: string
  description: string
  status: string
  menuIds: []
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  createUserString: string
  updateUserString: string
}
export interface TenantPackageQuery {
  description?: string
  status?: string
  sort: Array<string>
}
export interface TenantPackagePageQuery extends TenantPackageQuery, PageQuery {}

/** 租户数据源 */
export interface TenantDatasourceResp {
  id: string
  name: string
  databaseType: string
  host: string
  port: string
  username: string
  description: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  createUserString: string
  updateUserString: string
}
export interface TenantDatasourceQuery {
  description?: string
  sort: Array<string>
}
export interface TenantDatasourcePageQuery extends TenantDatasourceQuery, PageQuery {}
