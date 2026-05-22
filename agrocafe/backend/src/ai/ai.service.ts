import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private isAvailable = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isAvailable = true;
    } else {
      this.logger.warn('GEMINI_API_KEY não configurada. Módulo de IA rodará em modo Mock.');
    }
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
}
