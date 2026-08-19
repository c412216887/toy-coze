import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator'

export class CreateKnowledgeBaseDto {
  @IsString()
  kb_code!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  embedding_model?: string

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(2000)
  chunk_size?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  chunk_overlap?: number
}

export class SearchKnowledgeDto {
  @IsString()
  query!: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  top_k?: number

  @IsOptional()
  @Min(0)
  @Max(1)
  score_threshold?: number
}
