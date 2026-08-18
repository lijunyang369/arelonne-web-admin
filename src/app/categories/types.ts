/** 分类表单数据(新建/编辑共用) */
export interface CategoryFormData {
  /** 名称 */
  name: string;
  /** slug:仅新建可提交,编辑态只读展示(创建后锁定) */
  slug: string;
  /** 上级分类 id,空串表示根分类 */
  parent_id: string;
  /** 排序(表单内为字符串,提交时转数字) */
  sort: string;
  status: 'active' | 'inactive';
}
