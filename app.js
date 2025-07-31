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

// Endpoint público para obtener peleas (sin autenticación)
app.get('/api/fights', async (req, res) => {
  try {
    console.log('Recibida petición GET /api/fights');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const fightRepository = (await import('./repositories/fightRepository.js')).default;
    const fights = await fightRepository.getFights();
    console.log('Peleas obtenidas de la base de datos:', fights.length);
    console.log('Primera pelea como ejemplo:', fights[0]);
    
    const total = fights.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const fightsPage = fights.slice(start, end);
    
    console.log('Enviando respuesta con peleas:', fightsPage.length);
    res.json({ total, totalPages, page, fights: fightsPage });
  } catch (error) {
    console.error('Error en GET /api/fights:', error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware de autenticación (solo para rutas que lo requieren)
app.use('/api', (req, res, next) => {
  // Rutas que no requieren autenticación
  if (req.path === '/test' || req.path === '/auth-test' || req.path === '/personajes') {
    return next();
  }
  
  // Para /fights, solo permitir GET sin autenticación
  if (req.path === '/fights' && req.method === 'GET') {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

// Endpoint de prueba para verificar el estado de la API
app.get('/api/test', async (req, res) => {
  try {
    console.log('Recibida petición GET /api/test');
    
    // Verificar conexión a MongoDB
    const fightRepository = (await import('./repositories/fightRepository.js')).default;
    const fights = await fightRepository.getFights();
    
    // Verificar personajes
    const personajeService = (await import('./services/heroService.js')).default;
    const personajes = await personajeService.getAllPersonajes();
    
    res.json({
      status: 'OK',
      message: 'API funcionando correctamente',
      data: {
        fightsCount: fights.length,
        personajesCount: personajes.length,
        fights: fights.slice(0, 3), // Primeras 3 peleas como ejemplo
        personajes: personajes.slice(0, 3) // Primeros 3 personajes como ejemplo
      }
    });
  } catch (error) {
    console.error('Error en GET /api/test:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Error en la API',
      error: error.message 
    });
  }
});

// Endpoint de prueba para verificar autenticación
app.get('/api/auth-test', async (req, res) => {
  try {
    console.log('Recibida petición GET /api/auth-test');
    
    // Verificar si hay token en los headers
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'No hay token de autenticación',
        authHeader: authHeader
      });
    }
    
    const token = authHeader.substring(7);
    console.log('Token recibido:', token ? 'SÍ' : 'NO');
    
    res.json({
      status: 'OK',
      message: 'Autenticación válida',
      token: token ? 'Presente' : 'Ausente'
    });
  } catch (error) {
    console.error('Error en GET /api/auth-test:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Error en la verificación de autenticación',
      error: error.message 
    });
  }
});

// Endpoints protegidos (requieren autenticación)
app.use('/api', fightController)
app.use('/api', heroController)
app.use('/api/equipos', teamController)

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

// Ruta específica para historial de batallas
app.get('/history.html', (req, res) => {
  res.sendFile('html/history.html', { root: 'public' })
})

// Ruta específica para login (página principal)
app.get('/login', (req, res) => {
  res.sendFile('html/index.html', { root: 'public' })
})

// Ruta específica para dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile('html/index.html', { root: 'public' })
})

// Ruta de prueba simple
app.get('/test-simple', (req, res) => {
  res.sendFile('test-simple.html', { root: 'public' })
})

// Ruta de bienvenida
const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';
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

const PORT = process.env.PORT || 3003
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