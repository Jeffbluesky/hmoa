/**
 * 快速切换 Prisma provider（mysql / sqlite）
 * 用法：node scripts/use-db.js mysql
 */
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!['mysql', 'sqlite'].includes(target)) {
  console.error('Usage: node scripts/use-db.js [mysql|sqlite]');
  process.exit(1);
}

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf-8');
content = content.replace(/provider\s*=\s*"(mysql|sqlite)"/, `provider = "${target}"`);
fs.writeFileSync(schemaPath, content);
console.log(`✅ Switched Prisma provider to "${target}" in prisma/schema.prisma`);
console.log(`   Next step: pnpm db:generate`);
