# Firebase Admin SDK Backend Setup Guide

## 🎯 Цел
Решаване на CORS проблемите при качване на снимки чрез създаване на Express backend сървър който използва Firebase Admin SDK.

## 🏗️ Архитектура

```
Admin Panel (React)  →  Express Backend  →  Firebase Storage
     ↓                        ↓                     ↓
localhost:3000        localhost:3001         Google Cloud
```

## 📋 Стъпки за setup

### 1. Инсталиране на backend dependencies

```bash
cd admin-panel
npm run setup-backend
```

### 2. Firebase Service Account настройка

1. **Отвори Firebase Console**
   - Отиди на https://console.firebase.google.com
   - Избери проекта `roadside-assistance-app-aa0e8`

2. **Генерирай Service Account Key**
   - Project Settings → Service Accounts
   - Натисни "Generate New Private Key"
   - Сваляй JSON файла

3. **Създай .env файл**
   ```bash
   cd admin-panel/server
   cp .env.example .env
   ```

4. **Попълни .env файла**
   ```env
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@roadside-assistance-app-aa0e8.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   PORT=3001
   ```

### 3. Стартиране

#### Автоматично (препоръчително)
```bash
cd admin-panel
npm start
```
Това стартира и frontend (3000) и backend (3001) заедно.

#### Ръчно стартиране
```bash
# Terminal 1 - Backend
cd admin-panel/server
npm run dev

# Terminal 2 - Frontend  
cd admin-panel
npm run client
```

## 🚀 Endpoints

### Health Check
```
GET http://localhost:3001/api/health
```
Проверява дали сървърът работи.

### Firebase Test
```
GET http://localhost:3001/api/test-firebase
```
Тества връзката с Firebase Firestore.

### Upload Image
```
POST http://localhost:3001/api/upload
Content-Type: multipart/form-data

Body: FormData with 'file' field
```
Качва снимка във Firebase Storage.

### Save to Firestore (Fallback)
```
POST http://localhost:3001/api/save-image
Content-Type: application/json

{
  "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "fileName": "test.jpg",
  "contentType": "image/jpeg"
}
```

## 🔧 Тестване

1. **Отвори Admin Panel**: http://localhost:3000
2. **Натисни "ТЕСТ СНИМКА"**
3. **Тествай връзките** - трябва да видиш:
   - ✅ Backend: Connected
   - ✅ Firebase: Connected
4. **Качи тест снимка** - трябва да работи без CORS грешки

## 🛠️ Troubleshooting

### Backend не се стартира
```bash
cd admin-panel/server
npm install
npm run dev
```

### Firebase connection failed
- Провери .env файла
- Убеди се че Service Account JSON е валиден
- Провери Firebase project ID

### CORS грешки все още се появяват
- Убеди се че backend работи на port 3001
- Провери в Network tab че заявките отиват към localhost:3001

### Image upload failed
- Провери Firebase Storage Rules:
  ```javascript
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read, write: if true;
      }
    }
  }
  ```

## 📁 Файлова структура

```
admin-panel/
├── src/                    # React frontend
├── server/                 # Express backend  
│   ├── src/
│   │   └── index.ts       # Main server file
│   ├── .env               # Environment variables
│   ├── .env.example       # Example env file
│   └── package.json       # Backend dependencies
└── package.json           # Frontend + scripts
```

## 🔍 Debug режим

За подробни логове стартирай backend с:
```bash
cd admin-panel/server
DEBUG=* npm run dev
```

## 🚨 Сигурност

⚠️ **ВАЖНО**: Никога не комитвай .env файла! Той съдържа чувствителни данни.

`.env` файлът е автоматично в `.gitignore` за защита.

## 📊 Performance

Backend използва:
- **Multer** memory storage за бързо обработване
- **Firebase Admin SDK** за директен достъп без client restrictions  
- **Automatic public file URLs** за снимките
- **Fallback към Firestore** ако Storage не работи

## 🔄 Upgrade план

В бъдеще можем да добавим:
- Authentication middleware
- Rate limiting
- Image compression
- Multiple file upload
- Progress tracking
- Webhook notifications 