const admin = require('../config/firebase');

const db = admin.firestore();
const usersCollection = db.collection('users');
const searchHistoryCollection = db.collection('searchHistory');

// Guardar usuario en Firestore
const addUserToFirestore = async (uid, userData) => {
  await usersCollection.doc(uid).set(userData);
  return userData;
};

// Obtener perfil de usuario
const getUserProfile = async (uid) => {
  const doc = await usersCollection.doc(uid).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data();
};

// Guardar historial de búsqueda
const saveSearchHistory = async (uid, searchQuery) => {
  await searchHistoryCollection.add({
    uid,
    query: searchQuery,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
};

// Obtener historial de búsqueda del usuario
const getUserSearchHistory = async (uid, limit = 10) => {
  const snapshot = await searchHistoryCollection
    .where('uid', '==', uid)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

module.exports = {
  addUserToFirestore,
  getUserProfile,
  saveSearchHistory,
  getUserSearchHistory
};