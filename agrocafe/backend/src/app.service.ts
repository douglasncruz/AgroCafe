import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager
  ) {}

  getHello(): string {
    return 'AgroCerradoCafé API is running!';
  }

  async onModuleInit() {
    console.log('🚀 Inicializando sistema e verificando usuários padrão...');
    try {
      const defaultUsers = [
        { name: 'Administrador Agro', email: 'admin@agrocerradocafe.com.br', password: 'admin' },
        { name: 'José Cruz', email: 'jose.cruz@agrocerradocafe.com.br', password: 'Mjd2725' },
        { name: 'Zipora Cruz', email: 'zipora.cruz@agrocerradocafe.com.br', password: 'Agro@2026' },
        { name: 'Douglas Cruz', email: 'douglas.cruz@agrocerradocafe.com.br', password: 'Druida@011322' }
      ];

      // Remover usuário com grafia incorreta se existir
      await this.entityManager.delete(User, { email: 'duglas.cruz@agrocerradocafe.com.br' });

      for (const u of defaultUsers) {
        let existingUser = await this.entityManager.findOne(User, { where: { email: u.email } });
        if (!existingUser) {
          existingUser = this.entityManager.create(User, {
            name: u.name,
            email: u.email,
            password_hash: await bcrypt.hash(u.password, 10),
          });
          await this.entityManager.save(existingUser);
          console.log(`✅ Usuário criado: ${u.email}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro na inicialização automática de usuários:', error.message);
    }
  }
}
