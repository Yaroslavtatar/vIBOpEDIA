/**
 * Build & Environment Verification Test Suite for Vibopedia
 * 
 * Verifies:
 * 1. TypeScript compilation and syntax integrity (tsc --noEmit)
 * 2. Vite production build & asset bundle generation (dist/index.html & assets)
 * 3. SQLite Database schema & initial admin credentials verification
 * 4. Docker configuration files integrity (Dockerfile, docker-compose.yml, .dockerignore)
 * 5. API routes and settings integrity
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

function runTest(name: string, fn: () => void | Promise<void>) {
  const start = Date.now();
  try {
    fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, durationMs });
    console.log(`  \x1b[32m✔\x1b[0m ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, durationMs, details: err.message || String(err) });
    console.error(`  \x1b[31m✖\x1b[0m ${name} (${durationMs}ms)`);
    console.error(`    \x1b[33mError: ${err.message || err}\x1b[0m`);
  }
}

async function main() {
  console.log('\n\x1b[1m\x1b[34m=======================================================');
  console.log('🧪 Вайбопедия: Тестирование и верификация сборки');
  console.log('=======================================================\x1b[0m\n');

  // Test 1: TypeScript compilation check
  runTest('1. Проверка типов TypeScript (tsc --noEmit)', () => {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
  });

  // Test 2: Vite production build
  runTest('2. Проверка сборки фронтенда (vite build)', () => {
    execSync('npx vite build', { stdio: 'pipe' });

    const distPath = path.resolve('./dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('Директория ./dist не создана после сборки vite build');
    }

    const htmlFile = path.join(distPath, 'index.html');
    if (!fs.existsSync(htmlFile)) {
      throw new Error('Файл ./dist/index.html отсутствует');
    }

    const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
    if (!htmlContent.includes('<div id="root">') && !htmlContent.includes('id="root"')) {
      throw new Error('Файл index.html не содержит контейнер #root');
    }

    const assetsDir = path.join(distPath, 'assets');
    if (!fs.existsSync(assetsDir)) {
      throw new Error('Директория ./dist/assets отсутствует');
    }

    const assets = fs.readdirSync(assetsDir);
    const hasJs = assets.some((f) => f.endsWith('.js'));
    const hasCss = assets.some((f) => f.endsWith('.css'));

    if (!hasJs || !hasCss) {
      throw new Error(`Отсутствуют скомпилированные бандлы в ./dist/assets (JS: ${hasJs}, CSS: ${hasCss})`);
    }
  });

  // Test 3: SQLite Database schema & admin account
  runTest('3. Проверка схемы базы данных SQLite и аккаунта администратора', () => {
    const testDbPath = path.resolve('./data/vibopedia.db');

    if (!fs.existsSync(testDbPath)) {
      throw new Error(`Файл базы данных ${testDbPath} не найден`);
    }

    const db = new Database(testDbPath, { readonly: true });

    // Verify required tables
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((row: any) => row.name);

    const requiredTables = ['users', 'categories', 'articles', 'revisions', 'comments', 'settings'];
    for (const table of requiredTables) {
      if (!tables.includes(table)) {
        throw new Error(`Таблица '${table}' отсутствует в схеме базы данных SQLite`);
      }
    }

    // Verify Admin user exists
    const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get() as any;
    if (!admin) {
      throw new Error("Учётная запись администратора 'admin' не найдена");
    }
    if (admin.role !== 'admin') {
      throw new Error(`Роль учётной записи 'admin' должна быть 'admin', получено '${admin.role}'`);
    }

    // Verify Site Settings
    const settingsRow = db.prepare("SELECT * FROM settings WHERE key = 'main_settings'").get() as any;
    if (!settingsRow) {
      throw new Error("Запись настроек сайта 'main_settings' в таблице settings не найдена");
    }
    const parsedSettings = JSON.parse(settingsRow.value_json);
    if (!parsedSettings.githubUrl || !parsedSettings.telegramUrl) {
      throw new Error("Настройки сайта должны содержать 'githubUrl' и 'telegramUrl'");
    }

    db.close();
  });

  // Test 4: Dockerfile and container configuration
  runTest('4. Проверка корректности конфигурации Docker и Docker Compose', () => {
    const dockerfilePath = path.resolve('./Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      throw new Error('Dockerfile отсутствует');
    }

    const dockerfile = fs.readFileSync(dockerfilePath, 'utf-8');
    if (!dockerfile.includes('AS builder') && !dockerfile.includes('AS runner')) {
      throw new Error('Dockerfile должен использовать multi-stage сборку');
    }
    if (!dockerfile.includes('EXPOSE 3000')) {
      throw new Error('В Dockerfile отсутствует инструкция EXPOSE 3000');
    }
    if (!dockerfile.includes('/app/data')) {
      throw new Error('В Dockerfile отсутствует том или каталог для постоянного хранения /app/data');
    }

    const composePath = path.resolve('./docker-compose.yml');
    if (!fs.existsSync(composePath)) {
      throw new Error('docker-compose.yml отсутствует');
    }

    const dockerignorePath = path.resolve('./.dockerignore');
    if (!fs.existsSync(dockerignorePath)) {
      throw new Error('.dockerignore отсутствует');
    }

    const dockerignore = fs.readFileSync(dockerignorePath, 'utf-8');
    if (!dockerignore.includes('node_modules')) {
      throw new Error('.dockerignore должен исключать node_modules');
    }
  });

  // Test 5: Package.json and runtime scripts
  runTest('5. Проверка соответствия скриптов package.json стандартам', () => {
    const pkgPath = path.resolve('./package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    const requiredScripts = ['dev', 'build', 'start', 'test', 'test:build'];
    for (const s of requiredScripts) {
      if (!pkg.scripts[s]) {
        throw new Error(`В package.json отсутствует обязательный скрипт: '${s}'`);
      }
    }

    if (!pkg.dependencies['better-sqlite3']) {
      throw new Error('В dependencies отсутствует better-sqlite3');
    }
    if (!pkg.dependencies['express']) {
      throw new Error('В dependencies отсутствует express');
    }
    if (!pkg.dependencies['tsx']) {
      throw new Error('В dependencies отсутствует tsx (требуется для npm start в контейнере)');
    }
  });

  // Summary
  console.log('\n\x1b[1m-------------------------------------------------------');
  const failed = results.filter((r) => !r.passed);
  if (failed.length === 0) {
    console.log(`\x1b[32m🎉 ВСЕ ТЕСТЫ СБОРКИ ПРОЙДЕНЫ УСПЕШНО (${results.length}/${results.length})\x1b[0m`);
    console.log('Приложение готово к сборке Docker-образа и деплою в Coolify / VPS.');
    console.log('-------------------------------------------------------\x1b[0m\n');
    process.exit(0);
  } else {
    console.log(`\x1b[31m❌ ОБНАРУЖЕНЫ ОШИБКИ СБОРКИ: ${failed.length} из ${results.length} тестов провалено\x1b[0m`);
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.details}`));
    console.log('-------------------------------------------------------\x1b[0m\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Критический сбой теста сборки:', err);
  process.exit(1);
});
