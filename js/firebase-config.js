/**
 * CONFIGURACIÓN FIREBASE (proyecto web)
 *
 * 1. https://console.firebase.google.com → Crear proyecto (o usar uno existente).
 * 2. Añadir app Web (icono </>) y copiar el objeto firebaseConfig aquí.
 * 3. Build → Firestore Database → Crear base en modo de prueba → luego sustituye
 *    las reglas por las de firestore.rules de este repo y publica.
 * 4. Build → Authentication → Iniciar sesión → Correo/contraseña → Activar.
 * 5. Crea un usuario (Authentication → Users → Añadir) para el dueño del local.
 * 6. Sube estos archivos a GitHub; la web pública lee el menú sin login.
 *
 * La clave apiKey es pública por diseño; la seguridad va en Firestore Rules.
 */
window.__FIREBASE_CONFIG__ = {
  apiKey: 'AIzaSyDsaK5qotvoHmYLbQmTBD7M4_hkOFOD6B0',
  authDomain: 'el-patio-gustavo.firebaseapp.com',
  projectId: 'el-patio-gustavo',
  storageBucket: 'el-patio-gustavo.firebasestorage.app',
  messagingSenderId: '1097275947371',
  appId: '1:1097275947371:web:c29d0028f0459ab41c342e',
  measurementId: 'G-KPMTFR9V0K'
};

/** Colección y documento donde vive la carta (no cambies si usas admin.html incluido) */
window.__FIREBASE_MENU_PATH__ = { collection: 'site', docId: 'menu' };
