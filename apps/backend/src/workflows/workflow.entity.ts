import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('t_workflow')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'graph_data', type: 'jsonb', default: {} })
  graphData!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @OneToMany(() => WorkflowRun, (run) => run.workflow)
  runs!: WorkflowRun[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('t_workflow_run')
export class WorkflowRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workflow_id', type: 'varchar' })
  workflowId!: string;

  @ManyToOne(() => Workflow, (wf) => wf.runs)
  @JoinColumn({ name: 'workflow_id' })
  workflow!: Workflow;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: string;

  @Column({
    name: 'temporal_run_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  temporalRunId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  inputs!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  outputs!: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'elapsed_ms', type: 'int', nullable: true })
  elapsedMs!: number | null;

  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens!: number;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
