import { PartnersService } from './partners.service';

/**
 * Testes unitários para o cálculo de acerto financeiro entre sócios.
 * Valida que as proporções de despesas pagas por sócio e o cálculo
 * correto do saldo a receber/pagar estejam funcionando.
 */
describe('PartnersService - calculateSettlement', () => {
  let service: PartnersService;
  let mockPartnerRepo: any;
  let mockExpenseRepo: any;
  let mockRevenueRepo: any;

  beforeEach(() => {
    mockPartnerRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    mockExpenseRepo = {
      find: jest.fn(),
    };
    mockRevenueRepo = {
      find: jest.fn(),
    };

    service = new PartnersService(
      mockPartnerRepo,
      mockExpenseRepo,
      mockRevenueRepo,
    );
  });

  it('deve calcular acerto correto com 2 sócios iguais (50/50)', async () => {
    mockPartnerRepo.find.mockResolvedValue([
      { name: 'João', share_percentage: 50, id: '1' },
      { name: 'Pedro', share_percentage: 50, id: '2' },
    ]);

    mockExpenseRepo.find.mockResolvedValue([
      { amount: 10000, payer_name: 'João', partner: null },
      { amount: 6000, payer_name: 'Pedro', partner: null },
    ]);

    mockRevenueRepo.find.mockResolvedValue([
      { total_value: 20000, receiver_name: 'João', partner: null },
    ]);

    const result = await service.calculateSettlement('farm-1');

    expect(result.totalExpenses).toBe(16000);
    expect(result.totalRevenues).toBe(20000);
    expect(result.netProfit).toBe(4000); // 20000 - 16000

    const joao = result.settlement.find((s: any) => s.name === 'João');
    const pedro = result.settlement.find((s: any) => s.name === 'Pedro');

    // João: fairShare = 4000 * 50% = 2000, netCash = 20000 - 10000 = 10000, balance = 2000 - 10000 = -8000 (ele deve pagar)
    expect(joao.fairShareProfit).toBe(2000);
    expect(joao.netCashPosition).toBe(10000);
    expect(joao.balance).toBe(-8000);

    // Pedro: fairShare = 4000 * 50% = 2000, netCash = 0 - 6000 = -6000, balance = 2000 - (-6000) = 8000 (ele deve receber)
    expect(pedro.fairShareProfit).toBe(2000);
    expect(pedro.netCashPosition).toBe(-6000);
    expect(pedro.balance).toBe(8000);
  });

  it('deve calcular acerto correto com sócios em proporções diferentes (60/40)', async () => {
    mockPartnerRepo.find.mockResolvedValue([
      { name: 'Maria', share_percentage: 60, id: '3' },
      { name: 'Carlos', share_percentage: 40, id: '4' },
    ]);

    mockExpenseRepo.find.mockResolvedValue([
      { amount: 5000, payer_name: 'Maria', partner: null },
      { amount: 5000, payer_name: 'Carlos', partner: null },
    ]);

    mockRevenueRepo.find.mockResolvedValue([
      { total_value: 30000, receiver_name: 'Maria', partner: null },
    ]);

    const result = await service.calculateSettlement('farm-2');

    expect(result.netProfit).toBe(20000); // 30000 - 10000

    const maria = result.settlement.find((s: any) => s.name === 'Maria');
    const carlos = result.settlement.find((s: any) => s.name === 'Carlos');

    // Maria: fairShare = 20000 * 60% = 12000, netCash = 30000 - 5000 = 25000, balance = 12000 - 25000 = -13000
    expect(maria.fairShareProfit).toBe(12000);
    expect(maria.balance).toBe(-13000);

    // Carlos: fairShare = 20000 * 40% = 8000, netCash = 0 - 5000 = -5000, balance = 8000 - (-5000) = 13000
    expect(carlos.fairShareProfit).toBe(8000);
    expect(carlos.balance).toBe(13000);
  });

  it('deve retornar acerto zerado quando não há despesas nem receitas', async () => {
    mockPartnerRepo.find.mockResolvedValue([
      { name: 'Lucas', share_percentage: 100, id: '5' },
    ]);

    mockExpenseRepo.find.mockResolvedValue([]);
    mockRevenueRepo.find.mockResolvedValue([]);

    const result = await service.calculateSettlement('farm-3');

    expect(result.totalExpenses).toBe(0);
    expect(result.totalRevenues).toBe(0);
    expect(result.netProfit).toBe(0);

    const lucas = result.settlement.find((s: any) => s.name === 'Lucas');
    expect(lucas.fairShareProfit).toBe(0);
    expect(lucas.balance).toBe(0);
  });

  it('deve tratar corretamente um cenário de prejuízo', async () => {
    mockPartnerRepo.find.mockResolvedValue([
      { name: 'Ana', share_percentage: 50, id: '6' },
      { name: 'Beto', share_percentage: 50, id: '7' },
    ]);

    mockExpenseRepo.find.mockResolvedValue([
      { amount: 50000, payer_name: 'Ana', partner: null },
    ]);

    mockRevenueRepo.find.mockResolvedValue([
      { total_value: 20000, receiver_name: 'Beto', partner: null },
    ]);

    const result = await service.calculateSettlement('farm-4');

    expect(result.netProfit).toBe(-30000); // Prejuízo

    const ana = result.settlement.find((s: any) => s.name === 'Ana');
    const beto = result.settlement.find((s: any) => s.name === 'Beto');

    // Ana: fairShare = -30000 * 50% = -15000, netCash = 0 - 50000 = -50000, balance = -15000 - (-50000) = 35000
    expect(ana.fairShareProfit).toBe(-15000);
    expect(ana.balance).toBe(35000);

    // Beto: fairShare = -30000 * 50% = -15000, netCash = 20000 - 0 = 20000, balance = -15000 - 20000 = -35000
    expect(beto.fairShareProfit).toBe(-15000);
    expect(beto.balance).toBe(-35000);
  });

  it('a soma dos balances dos sócios deve ser zero (conservação financeira)', async () => {
    mockPartnerRepo.find.mockResolvedValue([
      { name: 'Sócio A', share_percentage: 33.33, id: '8' },
      { name: 'Sócio B', share_percentage: 33.33, id: '9' },
      { name: 'Sócio C', share_percentage: 33.34, id: '10' },
    ]);

    mockExpenseRepo.find.mockResolvedValue([
      { amount: 15000, payer_name: 'Sócio A', partner: null },
      { amount: 10000, payer_name: 'Sócio B', partner: null },
      { amount: 5000, payer_name: 'Sócio C', partner: null },
    ]);

    mockRevenueRepo.find.mockResolvedValue([
      { total_value: 40000, receiver_name: 'Sócio A', partner: null },
      { total_value: 10000, receiver_name: 'Sócio C', partner: null },
    ]);

    const result = await service.calculateSettlement('farm-5');

    const totalBalance = result.settlement.reduce(
      (sum: number, s: any) => sum + s.balance,
      0
    );

    // A soma de todos os saldos deve ser zero (o que um paga, o outro recebe)
    expect(Math.abs(totalBalance)).toBeLessThan(0.01);
  });
});
