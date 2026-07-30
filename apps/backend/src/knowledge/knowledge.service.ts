import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import FormData from 'form-data'

@Injectable()
export class KnowledgeService {
  private readonly baseUrl: string

  constructor(config: ConfigService) {
    this.baseUrl = config.get('app.knowledgeServiceUrl') ?? 'http://localhost:8001'
  }

  async search(kbCode: string, query: string, topK = 5, scoreThreshold = 0.3) {
    const { data } = await axios.post(`${this.baseUrl}/api/v1/search`, {
      kb_code: kbCode,
      query,
      top_k: topK,
      score_threshold: scoreThreshold,
    })
    return data.results as Array<{ chunk_id: string; content: string; score: number }>
  }

  async uploadDocument(kbCode: string, filename: string, buffer: Buffer, mimeType: string) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: mimeType })
    const { data } = await axios.post(
      `${this.baseUrl}/api/v1/knowledge/bases/${kbCode}/documents`,
      form,
      { headers: form.getHeaders(), timeout: 120_000 },
    )
    return data
  }

  async health(): Promise<boolean> {
    try {
      const { status } = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 })
      return status === 200
    } catch {
      return false
    }
  }
}
