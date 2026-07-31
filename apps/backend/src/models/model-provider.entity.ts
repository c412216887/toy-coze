import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('t_model_provider')
export class ModelProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'provider_code', type: 'varchar', length: 64, unique: true })
  providerCode: string

  @Column({ name: 'provider_name', type: 'varchar', length: 128 })
  providerName: string

  @Column({ name: 'api_base_url', type: 'varchar', length: 512, nullable: true })
  apiBaseUrl: string | null

  @Column({ name: 'api_key', type: 'text', nullable: true, select: false })
  apiKey: string | null

  @Column({ type: 'varchar', length: 32, default: 'openai_compatible' })
  protocol: string

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
