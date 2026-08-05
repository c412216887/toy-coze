import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.dataSource.query<User[]>(
      `SELECT id, username, email, hashed_password AS "hashedPassword",
              is_active AS "isActive", is_superuser AS "isSuperuser",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM t_user
       WHERE username = $1
       LIMIT 1`,
      [username],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.dataSource.query<User[]>(
      `SELECT id, username, email,
              is_active AS "isActive", is_superuser AS "isSuperuser",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM t_user
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.dataSource.query<User[]>(
      `SELECT id, username, email, hashed_password AS "hashedPassword",
              is_active AS "isActive", is_superuser AS "isSuperuser",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM t_user
       WHERE email = $1
       LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const rows = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*) AS count FROM t_user WHERE username = $1`,
      [username],
    );
    return parseInt(rows[0].count, 10) > 0;
  }

  async insert(params: {
    username: string;
    email: string;
    hashedPassword: string;
  }): Promise<User> {
    const rows = await this.dataSource.query<User[]>(
      `INSERT INTO t_user (username, email, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email,
                 is_active AS "isActive", is_superuser AS "isSuperuser",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [params.username, params.email, params.hashedPassword],
    );
    return rows[0];
  }
}
