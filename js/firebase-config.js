/**
 * @license
 * Fruit Valley Patagonia - Firebase Configuration & Modular Driver
 * Arquitectura preparada para Firebase Authentication, Cloud Firestore y Firebase Storage.
 */

// ============================================================================
// CONFIGURACIÓN DE FIREBASE (Introduce tus credenciales aquí)
// Obtén estos valores en: Firebase Console > Configuración del proyecto > General > Tus apps > SDK de configuración
// ============================================================================
export const firebaseConfig = {
  apiKey: "AIzaSyA4X_PurStFzUSMmn1diJuLgj0K77i_Gfs",
  authDomain: "fruit-valley-patagonia.firebaseapp.com",
  projectId: "fruit-valley-patagonia",
  storageBucket: "fruit-valley-patagonia.firebasestorage.app",
  messagingSenderId: "511656598450",
  appId: "1:511656598450:web:d4deb8e3f3810636a362ab",
  measurementId: "G-8GBEXM2JTC"
};

/**
 * Estado de Firebase en el cliente
 */
export const FirebaseService = {
  isConfigured() {
    return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_FIREBASE_API_KEY");
  },

  /**
   * Conector preparado para Firestore cuando el usuario importe los scripts del SDK
   */
  async getFirestore() {
    if (window.firebase && window.firebase.firestore) {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      return window.firebase.firestore();
    }
    console.info("Firebase SDK no cargado en este momento. La plataforma utiliza el driver LocalStorage / Google Apps Script.");
    return null;
  },

  /**
   * Conector preparado para Firebase Auth
   */
  async getAuth() {
    if (window.firebase && window.firebase.auth) {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      return window.firebase.auth();
    }
    return null;
  }
};
