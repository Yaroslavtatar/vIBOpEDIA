# Руководство по развертыванию Вайбопедии на Coolify и Docker

Полное руководство по сборке, тестированию и развертыванию **Вайбопедии** на сервере с помощью **Coolify** или чистого **Docker / Docker Compose**.

---

## 🧪 1. Тестирование сборки перед деплоем

В проект встроена система автоматического тестирования сборки:

```bash
# Запуск тестов сборки локально
npm test
# или
npm run test:build
```

**Что проверяют тесты сборки (`scripts/test-build.ts`):**
1. **TypeScript (`tsc --noEmit`)**: Строгая проверка типов бэкенда и фронтенда без синтаксических ошибок.
2. **Vite Production Bundle**: Корректность сборки в `dist/`, наличие `index.html`, бандлов JS и стилей CSS.
3. **SQLite & Схема**: Инициализация таблиц (`users`, `categories`, `articles`, `revisions`, `comments`, `settings`), наличие единственного администратора `admin`, проверка хэша пароля и структуры настроек сайта.
4. **Конфигурация Docker**: Валидация директив `Dockerfile`, `docker-compose.yml`, `.dockerignore`, открытого порта `3000` и тома данных `/app/data`.
5. **Скрипты `package.json`**: Проверка обязательных скриптов запуска и production-зависимостей (`tsx`, `better-sqlite3`, `express`).

---

## 🐳 2. Развертывание в Coolify (Рекомендуемый способ)

### Шаги:
1. Откройте панель **Coolify** и перейдите в ваш проект (**Project** → **Environment**).
2. Нажмите **+ New Resource** → **Public/Private Git Repository**.
3. Вставьте ссылку на репозиторий с Вайбопедией.
4. **Build Pack**:
   - Выберите **Dockerfile** (или **Docker Compose**).
5. **Ports Exposes**:
   - Укажите порт **`3000`**.
6. **Persistent Storage (Том данных для SQLite)**:
   - Добавьте том: `vibopedia_data:/app/data` (или абсолютный путь на хосте, например `/var/data/vibopedia:/app/data`).
   - Это гарантирует сохранность базы данных SQLite (`vibopedia.db`), статей и учетных записей между перезапусками и обновлениями контейнеров.
7. **Healthcheck (Проверка работоспособности)**:
   - Путь: `/api/settings`
   - Порт: `3000`
8. Нажмите **Deploy**.

---

## 📦 3. Развертывание через Docker Compose на любом сервере / VPS

### Запуск продакшн-контейнера:
```bash
docker compose up -d --build
```

Приложение будет доступно по адресу `http://localhost:3000`.

### Запуск тестов сборки внутри изолированного Docker-контейнера:
```bash
docker compose --profile test run --rm vibopedia-test
```
или прямой сборкой тестового таймаута:
```bash
docker build --target test -t vibopedia:test .
```

---

## 🛠️ 4. Локальная установка через install.sh

Для установки на сервере без Docker:
```bash
chmod +x install.sh
./install.sh
```
Скрипт автоматически установит зависимости, запустит тесты верификации и подготовит базу данных SQLite в `./data/vibopedia.db`.

---

## ⚙️ Переменные окружения

| Переменная | По умолчанию | Описание |
| :--- | :--- | :--- |
| `PORT` | `3000` | Порт HTTP сервера |
| `NODE_ENV` | `production` | Окружение Node.js (`production`, `development`) |
| `DATABASE_PATH` | `/app/data/vibopedia.db` | Путь к файлу базы данных SQLite |
| `GEMINI_API_KEY` | *(Опционально)* | API ключ Gemini для ИИ-помощника в редакторе |
