const API_KEY = 'AIzaSyAAgzduiR-UoVmuAGViFVrjJuxbktKF_ac';
const PROJECT_ID = 'roadside-assistance-app-aa0e8';

// Base URLs
const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const STORAGE_URL = `https://storage.googleapis.com/storage/v1/b/${PROJECT_ID}.appspot.com`;

// Auth функции
export const signIn = async (email: string, password: string) => {
  const response = await fetch(
    `${AUTH_URL}/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );
  
  const data = await response.json();
  if (!response.ok) throw data.error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const response = await fetch(
    `${AUTH_URL}/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );
  
  const data = await response.json();
  if (!response.ok) throw data.error;
  return data;
};

// Firestore функции
export const createDocument = async (collection: string, data: any, token: string) => {
  const response = await fetch(
    `${FIRESTORE_URL}/${collection}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fields: objectToFirestoreFields(data)
      }),
    }
  );
  
  const result = await response.json();
  if (!response.ok) throw result.error;
  return result;
};

export const getDocument = async (collection: string, docId: string, token: string) => {
  const response = await fetch(
    `${FIRESTORE_URL}/${collection}/${docId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  if (!response.ok) throw data.error;
  return firestoreFieldsToObject(data.fields);
};

// Помощни функции за конвертиране
const objectToFirestoreFields = (obj: any) => {
  const fields: any = {};
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    }
  }
  return fields;
};

const firestoreFieldsToObject = (fields: any) => {
  const obj: any = {};
  for (const key in fields) {
    const field = fields[key];
    if (field.stringValue !== undefined) obj[key] = field.stringValue;
    else if (field.integerValue !== undefined) obj[key] = parseInt(field.integerValue);
    else if (field.booleanValue !== undefined) obj[key] = field.booleanValue;
    else if (field.timestampValue !== undefined) obj[key] = new Date(field.timestampValue);
  }
  return obj;
};

// Storage функции (за качване на снимки)
export const uploadFile = async (uri: string, fileName: string, token: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  const uploadResponse = await fetch(
    `${STORAGE_URL}/o?uploadType=media&name=${fileName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': blob.type,
      },
      body: blob,
    }
  );
  
  const data = await uploadResponse.json();
  if (!uploadResponse.ok) throw data.error;
  return data;
};