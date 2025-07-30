import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'
import heroController from './controllers/heroController.js'
import userController from './controllers/userController.js'
import fightController from './controllers/fightController.js'
import authController from './controllers/authController.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import userRepository from './repositories/userRepository.js'
import teamController from './controllers/teamController.js'
import cors from 'cors'
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express()
app.use(cors({
  origin: [
    'https://hvsv.onrender.com',
    'https://hsv.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}))
const JWT_SECRET = 'supersecretkey123' // En producción, usa variable de entorno

app.use(express.json())

// Endpoint de login (ahora en authController)
app.use('/api', authController)

// Endpoint de registro de usuario (antes del middleware de autenticación)
app.use('/api', userController)

// Middleware de autenticación JWT (solo para rutas protegidas)
function authenticateJWT(req, res, next) {
  // Verificar token para rutas protegidas
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' })
      }
      req.user = user
      next()
    })
  } else {
    res.status(401).json({ error: 'Token no proporcionado' })
  }
}

// Endpoint público para obtener personajes (sin autenticación)
app.get('/api/personajes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const personajeService = (await import('./services/heroService.js')).default;
    const personajes = await personajeService.getAllPersonajes();
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = personajes.slice(start, end);
    res.json({
      total: personajes.length,
      page,
      limit,
      data: paginated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoints protegidos (requieren autenticación)
app.use('/api', authenticateJWT, fightController)
app.use('/api', authenticateJWT, heroController)
app.use('/api/equipos', authenticateJWT, teamController)

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API de Personajes - Documentación'
}))

// Servir archivos estáticos desde la carpeta public
app.use(express.static('public'))

// Ruta específica para el dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile('html/index.html', { root: 'public' })
})

// Ruta específica para el login
app.get('/login', (req, res) => {
  res.sendFile('html/index.html', { root: 'public' })
})

// Ruta específica para peleas de equipos
app.get('/fight-teams', (req, res) => {
  res.sendFile('html/fight_teams.html', { root: 'public' })
})

// Ruta específica para el index.html
app.get('/index.html', (req, res) => {
  res.sendFile('html/index.html', { root: 'public' })
})





// Ruta específica para el menú
app.get('/menu', (req, res) => {
  res.sendFile('html/menu.html', { root: 'public' })
})

// Ruta específica para el menú (alternativa)
app.get('/menu.html', (req, res) => {
  res.sendFile('html/menu.html', { root: 'public' })
})

// Ruta específica para crear equipo
app.get('/create-team.html', (req, res) => {
  res.sendFile('html/create_team.html', { root: 'public' })
})

// Ruta específica para pelea 1 vs 1
app.get('/fight-1vs1.html', (req, res) => {
  res.sendFile('html/fight_1vs1.html', { root: 'public' })
})

// Ruta específica para pelea 1 vs 1 (alternativa)
app.get('/fight-1vs1', (req, res) => {
  res.sendFile('html/fight_1vs1.html', { root: 'public' })
})

// Ruta de bienvenida
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
app.get('/', (req, res) => {
  res.json({
    message: '🎮 API de Héroes vs Villanos funcionando correctamente',
    documentation: `${BASE_URL}/api-docs/`,
    frontend: {
      login: `${BASE_URL}/html/index.html`,
      dashboard: `${BASE_URL}/html/index.html#dashboard`
    },
    endpoints: {
      users: `${BASE_URL}/api/users`,
      personajes: `${BASE_URL}/api/personajes`,
      personajesByTipo: `${BASE_URL}/api/personajes/tipo/{tipo}`,
      personajesByCiudad: `${BASE_URL}/api/personajes/ciudad/{ciudad}`,
      fights: `${BASE_URL}/api/fights`,
      login: `${BASE_URL}/api/login`
    }
  })
})

// Middleware para rutas /api no encontradas que devuelva JSON
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  next();
});

const PORT = process.env.PORT || 3001
app.listen(PORT, _ => {
  console.log("\n" + "=".repeat(70));
  console.log("🎮 HÉROES VS VILLANOS - SERVIDOR INICIADO");
  console.log("=".repeat(70));
  
  console.log(`\n📋 Información del Servidor:`);
  console.log(`   🏷️  Nombre: Héroes vs Villanos - API & Frontend`);
  console.log(`   📦 Versión: 1.0.0`);
  console.log(`   🌐 Puerto: ${PORT}`);
  console.log(`   🔗 URL Base: http://localhost:${PORT}`);
  
  console.log(`\n🎮 INTERFAZ WEB - DIRECCIONES DIRECTAS:`);
  console.log(`   🔐 Inicio de sesión: http://localhost:${PORT}/login`);
  console.log(`   📝 Crear cuenta: http://localhost:${PORT}/html/index.html`);
  console.log(`   🎯 Dashboard del juego: http://localhost:${PORT}/dashboard`);
  console.log(`   🎮 Menú principal: http://localhost:${PORT}/menu`);
  console.log(`   🏠 Página principal: http://localhost:${PORT}/html/index.html`);
  
  console.log(`\n📚 DOCUMENTACIÓN:`);
  console.log(`   📖 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`   🔗 API Base: http://localhost:${PORT}/api`);
  
  console.log(`\n⚡ ENDPOINTS API DISPONIBLES:`);
  console.log(`   🔑 Login: POST http://localhost:${PORT}/api/login`);
  console.log(`   👤 Registro: POST http://localhost:${PORT}/api/users`);
  console.log(`   👥 Usuarios: GET http://localhost:${PORT}/api/users`);
  console.log(`   ⚔️ Personajes: GET http://localhost:${PORT}/api/personajes`);
  console.log(`   🥊 Peleas: GET http://localhost:${PORT}/api/fights`);
  console.log(`   👥 Equipos: GET http://localhost:${PORT}/api/equipos`);
  
  console.log(`\n✨ CARACTERÍSTICAS:`);
  console.log(`   ✅ CORS habilitado para desarrollo local`);
  console.log(`   ✅ Archivos estáticos servidos desde /public`);
  console.log(`   ✅ Autenticación con JWT`);
  console.log(`   ✅ Documentación automática con Swagger`);
  console.log(`   ✅ Interfaz web responsive`);
  console.log(`   ✅ Animaciones y efectos visuales`);
  
  console.log("\n" + "=".repeat(70));
  console.log("🚀 ¡Servidor listo para usar!");
  console.log("=".repeat(70));
  console.log("\n💡 TIP: Abre tu navegador y ve a:");
  console.log(`   🌐 http://localhost:${PORT}/login - Para iniciar sesión`);
  console.log(`   🎯 http://localhost:${PORT}/dashboard - Para ir al dashboard`);
  console.log("\n" + "=".repeat(70) + "\n");
})