export interface Music {
  id: string;
  bvid: string;
  aid?: number;
  cid: number;
  pageIndex: number;
  pageName?: string;
  title: string;
  originalTitle?: string;
  artist?: string;
  coverUrl?: string;
  duration: number;
  audioUrl?: string;
  audioQuality?: number;
  audioExpire?: string;
  status: "active" | "invalid" | "pending";
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  collections?: Collection[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  musicCount?: number;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  musicId: string;
  sortOrder: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface MusicTag {
  id: string;
  musicId: string;
  tagId: string;
}

// API 请求/响应类型
export interface CollectRequest {
  bvids: string[];
  pageIndices?: number[];
  collectionId?: string;
}

export interface CollectResult {
  bvid: string;
  success: boolean;
  music?: Music;
  reason?: string;
}

export interface CollectResponse {
  results: CollectResult[];
  failed: CollectResult[];
}

export interface MusicListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  collectionId?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface MusicListResponse {
  data: Music[];
  total: number;
  page: number;
  pageSize: number;
}
