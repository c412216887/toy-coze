import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('t_user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 64, unique: true })
  username: string

  @Column({ length: 255, unique: true })
  email: string

  @Column({ name: 'hashed_password', length: 255, select: false })
  hashedPassword: string

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'is_superuser', default: false })
  isSuperuser: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
