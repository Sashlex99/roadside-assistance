# Admin Panel Firestore Rules

## Проблем
Администратор панелът не може да чете данни от Firestore, защото текущите правила изискват автентификация:

```javascript
allow read: if request.auth != null;
```

Но администратор панелът не използва Firebase Authentication.

## Временно решение
За demo/развойна среда можем да добавим правила, които позволяват четене от admin източници.

### Firebase Console -> Firestore -> Rules

Заменете текущите правила с:

```javascript
rules_version = '2';
service cloud.firestore {

  // Determine if the value of the field "key" is the same
  // before and after the request.
  function unchanged(key) {
    return (key in resource.data)
      && (key in request.resource.data)
      && (resource.data[key] == request.resource.data[key]);
  }

  match /databases/{database}/documents {
    // Restaurants:
    //   - ANY USER can read (for admin panel)
    //   - Authenticated user can create/update (for demo purposes only)
    //   - Updates are allowed if no fields are added and name is unchanged
    //   - Deletes are not allowed (default)
    match /restaurants/{restaurantId} {
      allow read: if true; // Allow admin panel to read
      allow create: if request.auth != null;
      allow update: if request.auth != null
                    && (request.resource.data.keys() == resource.data.keys())
                    && unchanged("name");

      // Ratings:
      //   - ANY USER can read (for admin panel)
      //   - Authenticated user can create if userId matches
      //   - Deletes and updates are not allowed (default)
      match /ratings/{ratingId} {
        allow read: if true; // Allow admin panel to read
        allow create: if request.auth != null
                      && request.resource.data.userId == request.auth.uid;
      }
    }
    
    // Users collection - allow admin panel to read/write
    match /users/{userId} {
      allow read, write: if true; // Allow admin panel full access
    }
  }
}
```

## Постоянно решение
За production среда трябва да се добави автентификация в администратор панела:

1. Firebase Authentication за admin панела
2. Custom claims за admin роли 
3. Правила които проверяват admin статуса

## Стъпки за прилагане

1. Отворете [Firebase Console](https://console.firebase.google.com)
2. Изберете проекта "roadside-assistance-app-aa0e8"
3. Firestore Database -> Rules
4. Заменете правилата с горните
5. Натиснете "Publish"

След това администратор панелът ще може да чете/пише данни от Firestore. 