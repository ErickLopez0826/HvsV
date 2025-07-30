import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import userRepository from '../repositories/userRepository.js';

const router = express.Router();
const JWT_SECRET = 'supersecretkey123';

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión y obtener un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: 1234
 *     responses:
 *       200:
 *         description: Token JWT generado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password, name } = req.body;
  const userName = username || name; // Aceptar tanto username como name
  
  // Verificar credenciales hardcodeadas para admin
  if (userName === 'admin' && password === '1234') {
    const token = jwt.sign({ name: userName }, JWT_SECRET, { expiresIn: '2h' });
    const userData = {
      name: userName,
      username: userName,
      email: 'admin@example.com'
    };
    return res.json({ 
      token,
      user: userData,
      message: 'Inicio de sesión exitoso'
    });
  }
  
  // Buscar usuario en MongoDB
  try {
    const users = await userRepository.getUsers();
    const user = users.find(u => u.name === userName);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign({ name: user.name }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ 
      token,
      user: {
        name: user.name,
        username: user.name, // Usar name como username
        email: `${user.name}@example.com` // Email por defecto
      },
      message: 'Inicio de sesión exitoso'
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 