import { IsString, IsOptional, IsObject } from 'class-validator'

export class CreateWorkflowDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsObject()
  graphData?: Record<string, unknown>
}

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsObject()
  graphData?: Record<string, unknown>

  @IsOptional()
  @IsString()
  status?: string
}

export class RunWorkflowDto {
  @IsOptional()
  @IsObject()
  inputs?: Record<string, unknown>
}
