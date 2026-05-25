const fs = require('fs');
const path = require('path');

const entitiesDir = path.join(__dirname, 'src');

const entitiesToUpdate = [
  'farms/entities/farm.entity.ts',
  'plots/entities/plot.entity.ts',
  'harvests/entities/harvest.entity.ts',
  'expenses/entities/expense.entity.ts',
  'revenues/entities/revenue.entity.ts',
  'machines/entities/machine.entity.ts',
  'machines/entities/maintenance.entity.ts',
  'partners/entities/partner.entity.ts',
  'agrochemicals/entities/agrochemical.entity.ts',
  'stock/entities/stock-item.entity.ts',
  'stock/entities/stock-transaction.entity.ts',
  'ai/entities/diagnosis.entity.ts',
  'notifications/entities/notification.entity.ts',
  'security-logs/entities/security-log.entity.ts',
];

for (const relPath of entitiesToUpdate) {
  const fullPath = path.join(entitiesDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${fullPath}, not found`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Skip if already has Tenant
  if (content.includes('Tenant') || content.includes('tenant_id')) {
    console.log(`Skipping ${fullPath}, already has tenant_id`);
    continue;
  }

  // Add import
  const tenantLevels = relPath.split('/').length - 1;
  const relativePrefix = '../'.repeat(tenantLevels);
  const importStatement = `import { Tenant } from '${relativePrefix}tenants/entities/tenant.entity';\n`;
  
  // Find last import
  const lines = content.split('\n');
  let lastImportIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  lines.splice(lastImportIndex + 1, 0, importStatement);
  content = lines.join('\n');
  
  // Add columns before @CreateDateColumn if exists, or before the last brace
  const relationCode = `\n  @Column({ nullable: true })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;\n`;

  // Make sure JoinColumn is imported from typeorm
  if (content.includes('from \'typeorm\'') && !content.includes('JoinColumn')) {
    content = content.replace('from \'typeorm\'', ', JoinColumn from \'typeorm\'');
  } else if (content.includes('from "typeorm"') && !content.includes('JoinColumn')) {
    content = content.replace('from "typeorm"', ', JoinColumn from "typeorm"');
  }
  if (!content.includes('ManyToOne')) {
    content = content.replace(', JoinColumn', ', ManyToOne, JoinColumn');
  }

  let injectIndex = content.lastIndexOf('@CreateDateColumn');
  if (injectIndex === -1) {
    injectIndex = content.lastIndexOf('}');
  }
  
  content = content.slice(0, injectIndex) + relationCode + content.slice(injectIndex);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${fullPath}`);
}
