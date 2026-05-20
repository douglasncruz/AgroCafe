import { AuditService } from './audit.service';

/**
 * Testes unitários para as regras de auditoria do AgroCafé.
 * Verifica se os alertas de carência ativa, dosagem excessiva,
 * manutenções caras, estoque negativo e estoque baixo disparam corretamente.
 */
describe('AuditService - runAudit', () => {
  let service: AuditService;
  let mockExpRepo: any;
  let mockRevRepo: any;
  let mockAgroRepo: any;
  let mockMacRepo: any;
  let mockMaintRepo: any;
  let mockStockItemRepo: any;

  beforeEach(() => {
    mockExpRepo = { find: jest.fn().mockResolvedValue([]) };
    mockRevRepo = { find: jest.fn().mockResolvedValue([]) };
    mockAgroRepo = { find: jest.fn().mockResolvedValue([]) };
    mockMacRepo = { find: jest.fn().mockResolvedValue([]) };
    mockMaintRepo = { find: jest.fn().mockResolvedValue([]) };
    mockStockItemRepo = { find: jest.fn().mockResolvedValue([]) };

    service = new AuditService(
      mockExpRepo,
      mockRevRepo,
      mockAgroRepo,
      mockMacRepo,
      mockMaintRepo,
      mockStockItemRepo,
    );
  });

  it('deve retornar conformidade total quando tudo estiver em ordem', async () => {
    const result = await service.runAudit('farm-1');
    
    expect(result.alerts.length).toBe(1);
    expect(result.alerts[0].type).toBe('SUCCESS');
    expect(result.alerts[0].severity).toBe('low');
  });

  it('deve alertar despesas sem comprovante fiscal', async () => {
    mockExpRepo.find.mockResolvedValue([
      { receipt_url: null },
      { receipt_url: '/uploads/nota.pdf' },
      { receipt_url: '' },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find((a: any) => a.type === 'FINANCIAL_WARNING');

    expect(alert).toBeDefined();
    expect(alert.title).toContain('Despesas sem Comprovante');
    expect(alert.message).toContain('2'); // 2 sem comprovante
  });

  it('deve alertar receitas sem nota fiscal', async () => {
    mockRevRepo.find.mockResolvedValue([
      { receipt_url: null },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find((a: any) => a.type === 'FINANCIAL_CRITICAL');

    expect(alert).toBeDefined();
    expect(alert.severity).toBe('critical');
  });

  it('deve alertar defensivos sem receituário agronômico', async () => {
    mockAgroRepo.find.mockResolvedValue([
      {
        agronomist_recipe: null,
        operator_name: 'João',
        recipe_url: '/file.pdf',
        safe_harvest_date: '2020-01-01',
        dose_per_hectare: 2,
      },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find(
      (a: any) => a.type === 'AGRONOMIC_CRITICAL' && a.title.includes('Irregulares')
    );

    expect(alert).toBeDefined();
  });

  it('deve alertar carência ativa quando safe_harvest_date está no futuro', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    mockAgroRepo.find.mockResolvedValue([
      {
        agronomist_recipe: 'REC-123',
        operator_name: 'José',
        recipe_url: '/file.pdf',
        safe_harvest_date: futureDate.toISOString(),
        dose_per_hectare: 2,
      },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find(
      (a: any) => a.type === 'AGRONOMIC_CRITICAL' && a.title.includes('Carência')
    );

    expect(alert).toBeDefined();
    expect(alert.severity).toBe('critical');
    expect(alert.message).toContain('1');
  });

  it('NÃO deve alertar carência quando safe_harvest_date já passou', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    mockAgroRepo.find.mockResolvedValue([
      {
        agronomist_recipe: 'REC-123',
        operator_name: 'José',
        recipe_url: '/file.pdf',
        safe_harvest_date: pastDate.toISOString(),
        dose_per_hectare: 2,
      },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find(
      (a: any) => a.type === 'AGRONOMIC_CRITICAL' && a.title.includes('Carência')
    );

    expect(alert).toBeUndefined();
  });

  it('deve alertar dosagem elevada (> 5.0 L/ha)', async () => {
    mockAgroRepo.find.mockResolvedValue([
      {
        agronomist_recipe: 'REC-456',
        operator_name: 'Maria',
        recipe_url: '/file.pdf',
        safe_harvest_date: '2020-01-01',
        dose_per_hectare: 8.5,
      },
      {
        agronomist_recipe: 'REC-789',
        operator_name: 'Carlos',
        recipe_url: '/file.pdf',
        safe_harvest_date: '2020-01-01',
        dose_per_hectare: 3.0,
      },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find((a: any) => a.type === 'AGRONOMIC_WARNING');

    expect(alert).toBeDefined();
    expect(alert.message).toContain('1'); // Apenas 1 com dose > 5
  });

  it('deve alertar manutenções de alto custo (> R$ 5.000)', async () => {
    mockMacRepo.find.mockResolvedValue([{ id: 'machine-1' }]);
    mockMaintRepo.find.mockResolvedValue([
      { cost: 8000, receipt_url: '/nota.pdf' },
      { cost: 2000, receipt_url: '/nota2.pdf' },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find(
      (a: any) => a.type === 'ASSET_WARNING' && a.title.includes('Alto Custo')
    );

    expect(alert).toBeDefined();
    expect(alert.message).toContain('1'); // 1 acima de 5000
  });

  it('deve alertar estoque negativo', async () => {
    mockStockItemRepo.find.mockResolvedValue([
      { product_name: 'RoundUp', quantity: -5, unit: 'L', min_quantity: 0 },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find((a: any) => a.type === 'STOCK_CRITICAL');

    expect(alert).toBeDefined();
    expect(alert.severity).toBe('critical');
    expect(alert.message).toContain('RoundUp');
  });

  it('deve alertar estoque baixo (abaixo do mínimo)', async () => {
    mockStockItemRepo.find.mockResolvedValue([
      { product_name: 'Priori Xtra', quantity: 3, unit: 'L', min_quantity: 10 },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find((a: any) => a.type === 'STOCK_WARNING');

    expect(alert).toBeDefined();
    expect(alert.severity).toBe('medium');
    expect(alert.message).toContain('Priori Xtra');
  });

  it('NÃO deve alertar estoque baixo quando min_quantity é 0', async () => {
    mockStockItemRepo.find.mockResolvedValue([
      { product_name: 'Glifosato', quantity: 2, unit: 'L', min_quantity: 0 },
    ]);

    const result = await service.runAudit('farm-1');
    const alert = result.alerts.find((a: any) => a.type === 'STOCK_WARNING');

    expect(alert).toBeUndefined();
  });
});
