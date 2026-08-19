import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import type { CreateKnowledgeBaseDto } from './knowledge.dto'

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
  status: string
  error_message: string | null
  created_at: string
}

@Injectable()
export class KnowledgeService {
  private readonly baseUrl: string

  constructor(config: ConfigService) {
    this.baseUrl = config.get('app.knowledgeServiceUrl') ?? 'http://localhost:8001'
  }

  async createKnowledgeBase(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    try {
      const { data } = await axios.post<KnowledgeBase>(
        `${this.baseUrl}/api/v1/knowledge/bases`,
        dto,
      )
      return data
    } catch (err) {
      this.handleAxiosError(err)
    }
  }

  async getKnowledgeBase(kbCode: string): Promise<KnowledgeBase> {
    try {
      const { data } = await axios.get<KnowledgeBase>(
        `${this.baseUrl}/api/v1/knowledge/bases/${kbCode}`,
      )
      return data
    } catch (err) {
      this.handleAxiosError(err)
    }
  }

  async listDocuments(kbCode: string): Promise<KnowledgeDocument[]> {
    try {
      const { data } = await axios.get<KnowledgeDocument[]>(
        `${this.baseUrl}/api/v1/knowledge/bases/${kbCode}/documents`,
      )
      return data
    } catch (err) {
      this.handleAxiosError(err)
    }
  }

  async uploadDocument(
    kbCode: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<KnowledgeDocument> {
    try {
      const form = new FormData()
      form.append('file', buffer, { filename, contentType: mimeType })
      const { data } = await axios.post<KnowledgeDocument>(
        `${this.baseUrl}/api/v1/knowledge/bases/${kbCode}/documents`,
        form,
        { headers: form.getHeaders(), timeout: 120_000 },
      )
      return data
    } catch (err) {
      this.handleAxiosError(err)
    }
  }

  async deleteDocument(docId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/api/v1/knowledge/documents/${docId}`)
    } catch (err) {
      this.handleAxiosError(err)
    }
  }

  async search(
    kbCode: string,
    query: string,
    topK = 5,
    scoreThreshold = 0.3,
  ): Promise<Array<{ chunk_id: string; content: string; score: number }>> {
    try {
      const { data } = await axios.post(`${this.baseUrl}/api/v1/search`, {
        kb_code: kbCode,
        query,
        top_k: topK,
        score_threshold: scoreThreshold,
      })
      return data.results
    } catch (err) {
      this.handleAxiosError(err)
    }
  }

  async health(): Promise<boolean> {
    try {
      const { status } = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 })
      return status === 200
    } catch {
      return false
    }
  }

  private handleAxiosError(err: unknown): never {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<{ detail: string }>
      const status = axiosError.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      const message =
        axiosError.response?.data?.detail ?? axiosError.message ?? '知识库服务请求失败'
      throw new HttpException(message, status)
    }
    throw new HttpException('知识库服务请求失败', HttpStatus.INTERNAL_SERVER_ERROR)
  }
}
