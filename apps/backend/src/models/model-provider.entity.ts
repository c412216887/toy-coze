import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('t_model_provider')
export class ModelProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'provider_code', length: 64, unique: true })
  providerCode: string

  @Column({ name: 'provider_name', length: 128 })
  providerName: string

  @Column({ name: 'api_base_url', length: 512, nullable: true })
  apiBaseUrl: string | null

  @Column({ name: 'api_key', type: 'text', nullable: true, select: false })
  apiKey: string | null

  @Column({ length: 32, default: 'openai_compatible' })
  protocol: string

  @Column({ name: 'is_active', default: false })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
