const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Importar rutas
const authRoutes = require('./routes/auth');
const documentsRoutes = require('./routes/documents');
const authMiddleware = require('./middleware/auth');

// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const admin = require('./config/firebase');


// Ruta de prueba para Firestore
app.post('/api/test-firestore', async (req, res) => {
  try {
    await admin.firestore().collection('test').add({ hello: 'world', time: Date.now() });
    res.json({ success: true });
    console.log('Firestore test document added successfully');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de CORS para permitir múltiples orígenes
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://bd2p2-25f81.firebaseapp.com',
      'https://2025-01-ic-4302-khaki.vercel.app',
      'https://bd2p2-25f81.web.app',
      'https://2025-01-ic-4302-bb2i8huoo-technowaffles25s-projects.vercel.app',
      'https://2025-01-ic-4302-khaki.vercel.app/auth/firebase-login',  // Tu dominio en Firebase Hosting (si lo usas)
      'http://localhost:5173', // Vite por defecto
      'http://localhost:3000' // Si usas React scripts
    ];
    
    // Permitir solicitudes sin origen (como aplicaciones móviles o Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Permitir cookies y encabezados de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

// Conectar a MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Rutas
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', authMiddleware, documentsRoutes);

// Servidor para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Exportar para Vercel
module.exports = app;