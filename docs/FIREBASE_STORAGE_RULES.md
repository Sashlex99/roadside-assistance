# Firebase Storage Rules за админ панел

## 🚨 Проблемът
CORS грешка при качване на снимки:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## 🔧 Решение: Обновете Firebase Storage Rules

### Стъпки:

1. **Отворете**: https://console.firebase.google.com
2. **Изберете проекта**: `roadside-assistance-app-aa0e8`
3. **Навигирайте**: Storage → Rules (НЕ Firestore Rules!)
4. **Заменете правилата** с:

### 🟢 За Development/Demo (препоръчано):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow read/write for all files (development mode)
      allow read, write: if true;
    }
  }
}
```

### 🟡 По-рестриктивни правила (опционално):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow admin panel to read/write test images
    match /test_images/{fileName} {
      allow read, write: if true;
    }
    
    // Allow reading all images
    match /{fileName} {
      allow read: if true;
      allow write: if fileName.matches('.*\\.(jpg|jpeg|png|gif)$');
    }
    
    // Document uploads
    match /roadside_cert_{userId} {
      allow read, write: if true;
    }
    match /iaala_license_{userId} {
      allow read, write: if true;
    }
    match /driver_photo_{userId} {
      allow read, write: if true;
    }
  }
}
```

5. **Натиснете "Publish"**

## ✅ Резултат:
- 🔥 Тест за снимки ще работи
- 📸 Администратор панелът ще може да качва/показва снимки
- 🎯 Документите на шофьорите ще се визуализират правилно

## ⚠️ Важно:
- Това са **development правила** - за production използвайте по-строги
- Storage Rules са **различни** от Firestore Rules
- Променят се в **Storage секцията**, не в Firestore 