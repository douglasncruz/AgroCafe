import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diagnosis } from './entities/diagnosis.entity';
import { requestContext } from '../common/context/request-context';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private isAvailable = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Diagnosis)
    private diagnosisRepository: Repository<Diagnosis>
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isAvailable = true;
    } else {
      this.logger.warn('GEMINI_API_KEY não configurada. Módulo de IA rodará em modo Mock.');
    }
  }

  private getTenantId(): string {
    const tenantId = requestContext.getStore()?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant context missing');
    return tenantId;
  }

  async processChat(message: string, contextData: any = {}): Promise<string> {
    if (!this.isAvailable) {
      // Retorna Mock se não tiver API key
      return "Olá! Sou o assistente de IA Chico Cafezal (Mock Mode). Para interagir com inteligência real, por favor, configure a variável `GEMINI_API_KEY` no `.env`.";
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',
        systemInstruction: `Você é o Chico Cafezal, o assistente virtual super inteligente do ERP Agro Café. 
Sua missão é ajudar o produtor rural a gerenciar sua fazenda, entender relatórios e navegar no sistema.
Contexto atual do usuário: ${JSON.stringify(contextData)}
Responda de forma clara, educada, e use formatação markdown se precisar.` 
      });

      const result = await model.generateContent(message);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      this.logger.error('Erro ao chamar Google Gemini API', error);
      return `Desculpe, encontrei um erro ao processar sua solicitação neste momento. Detalhe do erro: ${error.message}`;
    }
  }

  async getDiagnosisHistory(farmId: string): Promise<Diagnosis[]> {
    if (!farmId) return [];
    return this.diagnosisRepository.find({
      where: { farm: { id: farmId }, tenant_id: this.getTenantId() },
      order: { created_at: 'DESC' }
    });
  }

  async analyzeCropImage(userId: string, farmId: string, imageBase64: string): Promise<Diagnosis> {
    if (!this.isAvailable) {
      throw new BadRequestException('GEMINI_API_KEY não configurada no servidor.');
    }

    if (!imageBase64) {
      throw new BadRequestException('Imagem não fornecida.');
    }

    // Remover header do base64 se existir (ex: data:image/jpeg;base64,...)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `Você é um Agrônomo Especialista e Fitopatologista em plantações de café e outras culturas.
Analise detalhadamente a imagem fornecida. Você deve detectar doenças, fungos, pragas, deficiência nutricional (nitrogênio, potássio, magnésio, etc), falta de micronutrientes, estresse hídrico, ou folhas queimadas.

Retorne SOMENTE um JSON válido com a seguinte estrutura (sem blocos markdown como \`\`\`json, apenas o objeto literal):
{
  "disease": "Nome da possível doença, praga ou deficiência (ou 'Saudável' se não houver problemas claros)",
  "severity": "ALTA", // usar ALTA, MEDIA, BAIXA, NENHUMA
  "confidence": 85, // número de 0 a 100
  "technical_explanation": "Explicação detalhada do que você viu na imagem e por que chegou a esta conclusão. Use termos técnicos apropriados mas de fácil entendimento.",
  "causes": ["Causa 1", "Causa 2"],
  "recommendations": ["Recomendação de correção 1", "Recomendação agronômica 2"]
}`;

      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      
      // Tentar fazer o parse do JSON (limpar possíveis resquícios de markdown)
      let parsedResult;
      try {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleanedText);
      } catch (e) {
        this.logger.error('Falha ao parsear JSON retornado pela IA', responseText);
        throw new Error('A IA não retornou os dados no formato esperado.');
      }

      // Salvar diagnóstico no banco de dados
      const diagnosis = this.diagnosisRepository.create({
        farm: farmId ? { id: farmId } : undefined,
        user: userId ? { id: userId } : undefined,
        image_base64: imageBase64,
        disease_name: parsedResult.disease || 'Não identificado',
        severity: parsedResult.severity || 'INDEFINIDA',
        analysis_result: parsedResult
      });

      return await this.diagnosisRepository.save(diagnosis);

    } catch (error: any) {
      this.logger.error('Erro na análise de imagem IA', error);
      throw new BadRequestException('Erro ao processar imagem pela Inteligência Artificial.');
    }
  }
}
