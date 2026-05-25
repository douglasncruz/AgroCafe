import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email }, relations: ['tenant'] });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    const saved = await this.usersRepository.save(user);
    this.eventEmitter.emit('user.created', saved);
    return saved;
  }

  async findAll() {
    return this.usersRepository.find({
      select: ['id', 'name', 'email', 'created_at', 'is_active', 'phone', 'role_name', 'last_login', 'permissions'],
      order: { created_at: 'DESC' }
    });
  }

  async updatePassword(id: string, password_hash: string) {
    await this.usersRepository.update(id, { password_hash });
    return { success: true, message: 'Senha atualizada com sucesso' };
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<User>) {
    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }

  async updateLastLogin(id: string) {
    await this.usersRepository.update(id, { last_login: new Date() });
  }

  async remove(id: string) {
    await this.usersRepository.delete(id);
    return { success: true };
  }
}
