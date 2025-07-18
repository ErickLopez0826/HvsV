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

// Middleware de autenticación JWT (debe ir antes de las rutas protegidas)
function authenticateJWT(req, res, next) {
  if (
    req.path === '/' ||
    req.path === '/api/login' ||
    req.path === '/api/users' ||
    req.path.startsWith('/api-docs')
  ) {
    return next();
  }
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
app.use(authenticateJWT)

// Endpoints protegidos
app.use('/api', fightController)
app.use('/api', heroController)
app.use('/api/equipos', teamController)

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API de Personajes - Documentación'
}))

// Ruta de bienvenida
const BASE_URL = process.env.BASE_URL || 'https://hvsv.onrender.com';
app.get('/', (req, res) => {
  res.json({
    message: 'API de Personajes funcionando correctamente',
    documentation: `${BASE_URL}/api-docs/`,
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

const PORT = 3000
app.listen(PORT, _ => {
    console.log(`Servidor corriendo en el puerto ${PORT}`)
    console.log(`📚 Documentación Swagger: http://localhost:${PORT}/api-docs`)
})