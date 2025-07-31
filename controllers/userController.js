import express from "express";
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';

const router = express.Router();
const JWT_SECRET = 'supersecretkey123';

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Registrar un nuevo usuario y obtener un token JWT
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: usuario1
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Usuario registrado y token JWT generado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Datos inválidos o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST registrar usuario
router.post(
  '/users',
  [
    check('name').not().isEmpty().withMessage('El nombre es requerido'),
    check('password').not().isEmpty().withMessage('La contraseña es requerida')
  ],
  async (req, res) => {
    try {
      console.log('📝 Recibida petición de registro:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Errores de validación:', errors.array());
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: errors.array() 
        });
      }
      
      const { name, password } = req.body;
      console.log('👤 Intentando registrar usuario:', name);
      
      // Verificar si el usuario ya existe
      const users = await userRepository.getUsers();
      const existingUser = users.find(u => u.name === name);
      
      if (existingUser) {
        console.log('❌ Usuario ya existe:', name);
        return res.status(400).json({ 
          error: 'El usuario ya existe',
          message: 'Por favor, elige otro nombre de usuario'
        });
      }
      
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('🔐 Contraseña encriptada correctamente');
      
      // Asignar un id incremental
      const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
      const newUser = { id: newId, name, password: hashedPassword };
      
      // Guardar usuario
      await userRepository.addUser(newUser);
      console.log('✅ Usuario registrado correctamente:', name);
      
      // Generar token
      const token = jwt.sign({ name }, JWT_SECRET, { expiresIn: '2h' });
      console.log('🎫 Token generado correctamente');
      
      res.json({ 
        token,
        message: 'Usuario registrado exitosamente',
        user: { id: newId, name }
      });
      
    } catch (error) {
      console.error('💥 Error en registro de usuario:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo registrar el usuario. Intenta nuevamente.',
        details: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// GET todos los usuarios
router.get('/users', async (req, res) => {
  const users = await userRepository.getUsers();
  res.json(users);
});

export default router; 