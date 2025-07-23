import express from "express";
import { check, validationResult, body } from 'express-validator';
import personajeService from '../services/heroService.js';
import fightRepository from '../repositories/fightRepository.js';
import { Heroe, Villano } from '../models/Personaje.js';

const router = express.Router();

/**
 * @swagger
 * /api/fights:
 *   get:
 *     summary: Obtener todas las peleas (1 vs 1 y equipos) paginadas
 *     tags: [Peleas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de peleas por página
 *     responses:
 *       200:
 *         description: Lista paginada de todas las peleas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 fights:
 *                   type: array
 *                   items:
 *                     type: object
 */
// GET todas las peleas (paginado)
router.get('/fights', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const creador = req.user && req.user.name;
  const fights = await fightRepository.getFights(creador);
  const total = fights.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const fightsPage = fights.slice(start, end);
  res.json({ total, totalPages, page, fights: fightsPage });
});

/**
 * @swagger
 * /api/fights:
 *   post:
 *     summary: Realizar un turno en una pelea 1 vs 1
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fightId:
 *                 type: integer
 *                 description: ID de la pelea (solo para continuar pelea, no requerido para iniciar)
 *               id1:
 *                 type: integer
 *                 description: ID del primer personaje (requerido solo para iniciar pelea)
 *               id2:
 *                 type: integer
 *                 description: ID del segundo personaje (requerido solo para iniciar pelea)
 *               atacanteId:
 *                 type: integer
 *                 description: ID del personaje que ataca
 *               defensorId:
 *                 type: integer
 *                 description: ID del personaje que recibe el ataque
 *               tipoAtaque:
 *                 type: string
 *                 enum: [basico, especial, critico, ultimate]
 *                 description: Tipo de ataque a realizar
 *             required:
 *               - atacanteId
 *               - defensorId
 *               - tipoAtaque
 *             example:
 *               id1: 1
 *               id2: 2
 *               atacanteId: 1
 *               defensorId: 2
 *               tipoAtaque: "basico"
 *     responses:
 *       200:
 *         description: Estado actualizado de la pelea
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fightId:
 *                   type: integer
 *                 personaje1:
 *                   type: object
 *                 personaje2:
 *                   type: object
 *                 historia:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST pelea 1 vs 1 por turnos
router.post('/fights', async (req, res) => {
  const { fightId, id1, id2, atacanteId, defensorId, tipoAtaque } = req.body;
  let pelea, sim1, sim2, historia, creador;
  if (fightId) {
    // Continuar pelea existente
    pelea = await fightRepository.getFightById(fightId);
    if (!pelea) return res.status(400).json({ error: 'fightId no encontrado' });
    creador = pelea.creador;
    // Restaurar estado
    sim1 = Object.assign({}, pelea.personaje1);
    sim2 = Object.assign({}, pelea.personaje2);
    historia = pelea.historia || [];
  } else {
    // Nueva pelea
    if (!id1 || !id2) return res.status(400).json({ error: 'id1 e id2 son obligatorios' });
    let personajes = await personajeService.getAllPersonajes();
    let personaje1 = personajes.find(p => p.id === parseInt(id1));
    let personaje2 = personajes.find(p => p.id === parseInt(id2));
    if (!personaje1 || !personaje2) return res.status(400).json({ error: 'Ambos personajes deben existir' });
    if (personaje1.tipo === personaje2.tipo) return res.status(400).json({ error: 'Solo se permiten peleas entre un superhéroe y un villano' });
    sim1 = { ...personaje1, vida: 100 + (personaje1.nivel - 1) * 5 };
    sim2 = { ...personaje2, vida: 100 + (personaje2.nivel - 1) * 5 };
    historia = [];
    creador = req.user && req.user.name;
  }
  // Procesar turno
  let atacante = sim1.id === atacanteId ? sim1 : sim2;
  let defensor = sim1.id === defensorId ? sim1 : sim2;
  let ataque = 0, desc = '', esUltimate = false;
  switch (tipoAtaque) {
    case 'basico':
      ataque = 5 + (atacante.nivel - 1) * 1;
      desc = `Ataque básico (${ataque} daño)`;
      break;
    case 'especial':
      ataque = 30 + (atacante.nivel - 1) * 10;
      desc = `Ataque especial (${ataque} daño)`;
      break;
    case 'critico':
      let base = 5 + (atacante.nivel - 1) * 1;
      ataque = Math.round(base * 1.5);
      desc = `Ataque crítico (${ataque} daño)`;
      break;
    case 'ultimate':
      if (atacante.ultimateDisponible) {
        ataque = 80 + (atacante.nivel - 1) * 10;
        desc = `¡Ultimate! (${ataque} daño, ignora escudo)`;
        esUltimate = true;
        atacante.ultimateDisponible = false;
        atacante.dañoUltimate = 0;
      } else {
        return res.status(400).json({ error: 'Ultimate no disponible' });
      }
      break;
    default:
      return res.status(400).json({ error: 'tipoAtaque inválido' });
  }
  let vidaAntes = defensor.vida;
  if (!esUltimate && defensor.escudo > 0) {
    const reduccion = ataque * (defensor.escudo / 100);
    ataque = ataque - reduccion;
  }
  defensor.vida -= ataque;
  if (defensor.vida < 0) defensor.vida = 0;
  atacante.dañoUltimate = (atacante.dañoUltimate || 0) + ataque;
  if (atacante.dañoUltimate >= (atacante.umbralUltimate || 150)) {
    atacante.ultimateDisponible = true;
  }
  historia.push(`${atacante.nombre} ataca a ${defensor.nombre}: ${desc} (vida: ${vidaAntes.toFixed(2)} → ${defensor.vida.toFixed(2)})`);
  // Guardar/actualizar pelea
  let nuevoEstado = {
    personaje1: sim1,
    personaje2: sim2,
    historia,
    creador
  };
  let nuevoFightId = fightId;
  if (!fightId) {
    const fights = await fightRepository.getFights();
    nuevoFightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
    await fightRepository.addFight({ fightId: nuevoFightId, ...nuevoEstado });
  } else {
    await fightRepository.updateFight(fightId, nuevoEstado);
  }
  if (sim1 && sim2) {
    // 1 vs 1
    res.json({
      fightId: nuevoFightId,
      personajes: [
        { id: sim1.id, nombre: sim1.nombre, vida: sim1.vida, ultimateDisponible: !!sim1.ultimateDisponible },
        { id: sim2.id, nombre: sim2.nombre, vida: sim2.vida, ultimateDisponible: !!sim2.ultimateDisponible }
      ],
      turno: {
        atacante: atacante.nombre,
        defensor: defensor.nombre,
        tipoAtaque,
        dañoInfligido: Number((vidaAntes - defensor.vida).toFixed(2)),
        reduccion: esUltimate ? 0 : Number(((vidaAntes - defensor.vida) - ataque).toFixed(2)),
        vidaAntes: Number(vidaAntes.toFixed(2)),
        vidaDespues: Number(defensor.vida.toFixed(2)),
        descripcion: desc
      }
    });
  } else {
    // Equipos
    res.json({
      fightId: nuevoFightId,
      equipoHeroes: heroes.map(h => ({ id: h.id, nombre: h.nombre, vida: simulados[h.id].vida, ultimateDisponible: !!simulados[h.id].ultimateDisponible })),
      equipoVillanos: villanos.map(v => ({ id: v.id, nombre: v.nombre, vida: simulados[v.id].vida, ultimateDisponible: !!simulados[v.id].ultimateDisponible })),
      turno: {
        atacante: atacante.nombre,
        defensor: defensor.nombre,
        tipoAtaque,
        dañoInfligido: Number((vidaAntes - defensor.vida).toFixed(2)),
        reduccion: esUltimate ? 0 : Number(((vidaAntes - defensor.vida) - ataque).toFixed(2)),
        vidaAntes: Number(vidaAntes.toFixed(2)),
        vidaDespues: Number(defensor.vida.toFixed(2)),
        descripcion: desc
      }
    });
  }
});

/**
 * @swagger
 * /api/fights/teams:
 *   post:
 *     summary: Realizar un turno en una pelea de equipos
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fightId:
 *                 type: integer
 *                 description: ID de la pelea (solo para continuar pelea, no requerido para iniciar)
 *               equipoHeroes:
 *                 type: string
 *                 description: Nombre del equipo de superhéroes (requerido solo para iniciar pelea)
 *               equipoVillanos:
 *                 type: string
 *                 description: Nombre del equipo de villanos (requerido solo para iniciar pelea)
 *               atacanteId:
 *                 type: integer
 *                 description: ID del personaje que ataca
 *               defensorId:
 *                 type: integer
 *                 description: ID del personaje que recibe el ataque
 *               tipoAtaque:
 *                 type: string
 *                 enum: [basico, especial, critico, ultimate]
 *                 description: Tipo de ataque a realizar
 *             required:
 *               - atacanteId
 *               - defensorId
 *               - tipoAtaque
 *             example:
 *               equipoHeroes: "LIGADELJUSTICIA"
 *               equipoVillanos: "LEGIONDELMAL"
 *               atacanteId: 4
 *               defensorId: 7
 *               tipoAtaque: "basico"
 *     responses:
 *       200:
 *         description: Estado actualizado de la pelea de equipos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fightId:
 *                   type: integer
 *                 heroes:
 *                   type: array
 *                 villanos:
 *                   type: array
 *                 simulados:
 *                   type: object
 *                 rondas:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/fights/teams', async (req, res) => {
  const { fightId, equipoHeroes, equipoVillanos, atacanteId, defensorId, tipoAtaque } = req.body;
  let pelea, heroes, villanos, simulados, rondas, creador;
  if (fightId) {
    pelea = await fightRepository.getFightById(fightId);
    if (!pelea) return res.status(400).json({ error: 'fightId no encontrado' });
    heroes = pelea.heroes;
    villanos = pelea.villanos;
    simulados = pelea.simulados;
    rondas = pelea.rondas || [];
    creador = pelea.creador;
  } else {
    if (!equipoHeroes || !equipoVillanos) return res.status(400).json({ error: 'equipoHeroes y equipoVillanos son obligatorios' });
    const personajes = await personajeService.getAllPersonajes();
    heroes = personajes.filter(p => p.equipo === equipoHeroes && p.tipo === 'superheroe').slice(0, 3);
    villanos = personajes.filter(p => p.equipo === equipoVillanos && p.tipo === 'villano').slice(0, 3);
    if (heroes.length !== 3 || villanos.length !== 3) return res.status(400).json({ error: 'Ambos equipos deben tener exactamente 3 miembros del tipo correcto' });
    simulados = {};
    for (let p of [...heroes, ...villanos]) {
      let sim = { ...p, vida: 100 + (p.nivel - 1) * 5 };
      simulados[p.id] = sim;
    }
    rondas = [];
    creador = req.user && req.user.name;
  }
  // Procesar turno
  let atacante = simulados[atacanteId];
  let defensor = simulados[defensorId];
  if (!atacante || !defensor) return res.status(400).json({ error: 'atacanteId o defensorId inválido' });
  let ataque = 0, desc = '', esUltimate = false;
  switch (tipoAtaque) {
    case 'basico':
      ataque = 5 + (atacante.nivel - 1) * 1;
      desc = `Ataque básico (${ataque} daño)`;
      break;
    case 'especial':
      ataque = 30 + (atacante.nivel - 1) * 10;
      desc = `Ataque especial (${ataque} daño)`;
      break;
    case 'critico':
      let base = 5 + (atacante.nivel - 1) * 1;
      ataque = Math.round(base * 1.5);
      desc = `Ataque crítico (${ataque} daño)`;
      break;
    case 'ultimate':
      if (atacante.ultimateDisponible) {
        ataque = 80 + (atacante.nivel - 1) * 10;
        desc = `¡Ultimate! (${ataque} daño, ignora escudo)`;
        esUltimate = true;
        atacante.ultimateDisponible = false;
        atacante.dañoUltimate = 0;
      } else {
        return res.status(400).json({ error: 'Ultimate no disponible' });
      }
      break;
    default:
      return res.status(400).json({ error: 'tipoAtaque inválido' });
  }
  let vidaAntes = defensor.vida;
  if (!esUltimate && defensor.escudo > 0) {
    const reduccion = ataque * (defensor.escudo / 100);
    ataque = ataque - reduccion;
  }
  defensor.vida -= ataque;
  if (defensor.vida < 0) defensor.vida = 0;
  atacante.dañoUltimate = (atacante.dañoUltimate || 0) + ataque;
  if (atacante.dañoUltimate >= (atacante.umbralUltimate || 150)) {
    atacante.ultimateDisponible = true;
  }
  let ronda = { atacante: atacante.nombre, defensor: defensor.nombre, desc, vidaAntes, vidaDespues: defensor.vida };
  rondas.push(ronda);
  // Guardar/actualizar pelea
  let nuevoEstado = {
    heroes,
    villanos,
    simulados,
    rondas,
    creador
  };
  let nuevoFightId = fightId;
  if (!fightId) {
    const fights = await fightRepository.getFights();
    nuevoFightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
    await fightRepository.addFight({ fightId: nuevoFightId, ...nuevoEstado });
  } else {
    await fightRepository.updateFight(fightId, nuevoEstado);
  }
  // Unificar la respuesta para ambos casos (1vs1 y equipos)
  const esPeleaEquipos = Array.isArray(heroes) && Array.isArray(villanos);
  if (esPeleaEquipos) {
    res.json({
      fightId: nuevoFightId,
      equipoHeroes: heroes.map(h => ({ id: h.id, nombre: h.nombre, vida: simulados[h.id].vida, ultimateDisponible: !!simulados[h.id].ultimateDisponible })),
      equipoVillanos: villanos.map(v => ({ id: v.id, nombre: v.nombre, vida: simulados[v.id].vida, ultimateDisponible: !!simulados[v.id].ultimateDisponible })),
      turno: {
        atacante: atacante.nombre,
        defensor: defensor.nombre,
        tipoAtaque,
        dañoInfligido: Number((vidaAntes - defensor.vida).toFixed(2)),
        reduccion: esUltimate ? 0 : Number(((vidaAntes - defensor.vida) - ataque).toFixed(2)),
        vidaAntes: Number(vidaAntes.toFixed(2)),
        vidaDespues: Number(defensor.vida.toFixed(2)),
        descripcion: desc
      }
    });
  } else {
    res.json({
      fightId: nuevoFightId,
      personajes: [
        { id: sim1.id, nombre: sim1.nombre, vida: sim1.vida, ultimateDisponible: !!sim1.ultimateDisponible },
        { id: sim2.id, nombre: sim2.nombre, vida: sim2.vida, ultimateDisponible: !!sim2.ultimateDisponible }
      ],
      turno: {
        atacante: atacante.nombre,
        defensor: defensor.nombre,
        tipoAtaque,
        dañoInfligido: Number((vidaAntes - defensor.vida).toFixed(2)),
        reduccion: esUltimate ? 0 : Number(((vidaAntes - defensor.vida) - ataque).toFixed(2)),
        vidaAntes: Number(vidaAntes.toFixed(2)),
        vidaDespues: Number(defensor.vida.toFixed(2)),
        descripcion: desc
      }
    });
  }
});

/**
 * @swagger
 * /api/fights/teams/continue:
 *   post:
 *     summary: Realizar un turno en la continuación de una pelea de equipos
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fightId:
 *                 type: integer
 *                 description: ID de la pelea a continuar (obligatorio)
 *               atacanteId:
 *                 type: integer
 *                 description: ID del personaje que ataca
 *               defensorId:
 *                 type: integer
 *                 description: ID del personaje que recibe el ataque
 *               tipoAtaque:
 *                 type: string
 *                 enum: [basico, especial, critico, ultimate]
 *                 description: Tipo de ataque a realizar
 *             required:
 *               - fightId
 *               - atacanteId
 *               - defensorId
 *               - tipoAtaque
 *             example:
 *               fightId: 5
 *               atacanteId: 7
 *               defensorId: 4
 *               tipoAtaque: "especial"
 *     responses:
 *       200:
 *         description: Estado actualizado de la pelea de equipos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fightId:
 *                   type: integer
 *                 heroes:
 *                   type: array
 *                 villanos:
 *                   type: array
 *                 simulados:
 *                   type: object
 *                 rondas:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/fights/teams/continue', async (req, res) => {
  // Reutiliza la lógica de /fights/teams
  req.url = '/fights/teams';
  router.handle(req, res);
});

// ...existing code...

// Función para calcular el tipo de ataque
function calcularAtaque() {
  const prob = Math.random();
  if (prob < 0.15) return -45; // 15% crítico
  if (prob < 0.5) return -30; // 35% especial
  return -5; // 50% normal
}

function descripcionAtaque(valor) {
  if (valor === -45) return 'ataque crítico (-45 vida)';
  if (valor === -30) return 'ataque especial (-30 vida)';
  return 'ataque normal (-5 vida)';
}

/**
 * @swagger
// ...existing code...

/**
 * @swagger
 * /api/fights/{fightId}:
 *   delete:
 *     summary: Eliminar una pelea
 *     tags: [Peleas]
 *     parameters:
 *       - in: path
 *         name: fightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la pelea a eliminar
 *     responses:
 *       200:
 *         description: Pelea eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Pelea no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE para eliminar una pelea
router.delete('/fights/:fightId', async (req, res) => {
  const fightId = parseInt(req.params.fightId, 10);
  const fight = await fightRepository.getFightById(fightId);
  if (!fight) {
    return res.status(404).json({ error: 'Pelea no encontrada' });
  }
  await fightRepository.deleteFight(fightId);
  res.json({ message: 'Pelea eliminada exitosamente' });
});

export default router; 