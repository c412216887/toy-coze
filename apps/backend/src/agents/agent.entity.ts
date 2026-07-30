import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('t_agent')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({ length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'system_prompt', type: 'text', nullable: true })
  systemPrompt: string | null

  @Column({ name: 'model_id', length: 128, default: 'gpt-4o' })
  modelId: string

  @Column({ name: 'model_config', type: 'jsonb', default: {} })
  modelConfig: Record<string, unknown>

  @Column({ type: 'jsonb', default: [] })
  tools: unknown[]

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
