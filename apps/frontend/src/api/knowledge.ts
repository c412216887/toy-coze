import request from './request'

export interface KnowledgeBase {
  id: string
  kb_code: string
  name: string
  description: string | null
  embedding_model: string
  chunk_size: number
  chunk_overlap: number
  doc_count: number
  created_at: string
}

export interface KnowledgeDocument {
  id: string
  kb_code: string
  filename: string
  file_type: string
  file_size: number
  chunk_count: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  error_message: string | null
  created_at: string
}

export interface CreateKnowledgeBasePayload {
  kb_code: string
  name: string
  description?: string
  embedding_model?: string
  chunk_size?: number
  chunk_overlap?: number
}

export const knowledgeApi = {
  async createBase(payload: CreateKnowledgeBasePayload): Promise<KnowledgeBase> {
    const res = await request.post<KnowledgeBase>('/api/v1/knowledge/bases', payload)
    return res.data
  },

  async getBase(kbCode: string): Promise<KnowledgeBase> {
    const res = await request.get<KnowledgeBase>(`/api/v1/knowledge/bases/${kbCode}`)
    return res.data
  },

  async listDocuments(kbCode: string): Promise<KnowledgeDocument[]> {
    const res = await request.get<KnowledgeDocument[]>(
      `/api/v1/knowledge/bases/${kbCode}/documents`,
    )
    return res.data
  },

  async uploadDocument(kbCode: string, file: File): Promise<KnowledgeDocument> {
    const form = new FormData()
    form.append('file', file)
    const res = await request.post<KnowledgeDocument>(
      `/api/v1/knowledge/bases/${kbCode}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
    )
    return res.data
  },

  async deleteDocument(docId: string): Promise<void> {
    await request.delete(`/api/v1/knowledge/documents/${docId}`)
  },
}

