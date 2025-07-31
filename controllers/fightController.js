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
// GET todas las peleas (paginado) - Movido a app.js para acceso público
// router.get('/fights', async (req, res) => {
//   const page = parseInt(req.query.page, 10) || 1;
//   const limit = parseInt(req.query.limit, 10) || 10;
//   const creador = req.user && req.user.name;
//   const fights = await fightRepository.getFights(creador);
//   const total = fights.length;
//   const totalPages = Math.ceil(total / limit);
//   const start = (page - 1) * limit;
//   const end = start + limit;
//   const fightsPage = fights.slice(start, end);
//   res.json({ total, totalPages, page, fights: fightsPage });
// });

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
  console.log('Recibida petición POST /fights:', req.body);
  
  const { fightId, id1, id2, atacanteId, defensorId, tipoAtaque } = req.body;
  let pelea, sim1, sim2, historia, creador;
  
  if (fightId) {
    // Continuar pelea existente
    console.log('Continuando pelea existente con ID:', fightId);
    pelea = await fightRepository.getFightById(fightId);
    if (!pelea) return res.status(400).json({ error: 'fightId no encontrado' });
    creador = pelea.creador;
    // Restaurar estado con propiedades de ultimate
    sim1 = Object.assign({}, pelea.personaje1, {
      ultimateDisponible: pelea.personaje1.ultimateDisponible || false,
      dañoUltimate: pelea.personaje1.dañoUltimate || 0,
      umbralUltimate: pelea.personaje1.umbralUltimate || 50
    });
    sim2 = Object.assign({}, pelea.personaje2, {
      ultimateDisponible: pelea.personaje2.ultimateDisponible || false,
      dañoUltimate: pelea.personaje2.dañoUltimate || 0,
      umbralUltimate: pelea.personaje2.umbralUltimate || 50
    });
    historia = pelea.historia || [];
  } else {
    // Nueva pelea
    console.log('Iniciando nueva pelea con personajes:', id1, id2);
    if (!id1 || !id2) return res.status(400).json({ error: 'id1 e id2 son obligatorios' });
    let personajes = await personajeService.getAllPersonajes();
    let personaje1 = personajes.find(p => p.id === parseInt(id1));
    let personaje2 = personajes.find(p => p.id === parseInt(id2));
    if (!personaje1 || !personaje2) return res.status(400).json({ error: 'Ambos personajes deben existir' });
    if (personaje1.tipo === personaje2.tipo) return res.status(400).json({ error: 'Solo se permiten peleas entre un superhéroe y un villano' });
    
    // Inicializar personajes con propiedades de combate
    sim1 = { 
      ...personaje1, 
      vida: 100 + (personaje1.nivel - 1) * 5,
      ultimateDisponible: false,
      dañoUltimate: 0,
      umbralUltimate: 50
    };
    sim2 = { 
      ...personaje2, 
      vida: 100 + (personaje2.nivel - 1) * 5,
      ultimateDisponible: false,
      dañoUltimate: 0,
      umbralUltimate: 50
    };
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
  
  // Actualizar daño ultimate del atacante
  atacante.dañoUltimate = (atacante.dañoUltimate || 0) + ataque;
  
  // Verificar si ultimate está disponible
  if (atacante.dañoUltimate >= (atacante.umbralUltimate || 50)) {
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
    console.log('Peleas existentes en la base de datos:', fights.length);
    nuevoFightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
    console.log('Guardando nueva pelea con ID:', nuevoFightId);
    console.log('Datos a guardar:', { fightId: nuevoFightId, ...nuevoEstado });
    try {
      await fightRepository.addFight({ fightId: nuevoFightId, ...nuevoEstado });
      console.log('✅ Pelea guardada exitosamente en la base de datos');
    } catch (error) {
      console.error('❌ Error al guardar pelea:', error);
      return res.status(500).json({ error: 'Error al guardar la pelea en la base de datos' });
    }
  } else {
    console.log('Actualizando pelea existente con ID:', fightId);
    try {
      await fightRepository.updateFight(fightId, nuevoEstado);
      console.log('✅ Pelea actualizada exitosamente en la base de datos');
    } catch (error) {
      console.error('❌ Error al actualizar pelea:', error);
      return res.status(500).json({ error: 'Error al actualizar la pelea en la base de datos' });
    }
  }
  
  if (sim1 && sim2) {
    // 1 vs 1
    const response = {
      fightId: nuevoFightId,
      personajes: [
        { 
          id: sim1.id, 
          nombre: sim1.nombre, 
          vida: sim1.vida, 
          ultimateDisponible: !!sim1.ultimateDisponible,
          dañoUltimate: sim1.dañoUltimate || 0,
          umbralUltimate: sim1.umbralUltimate || 50
        },
        { 
          id: sim2.id, 
          nombre: sim2.nombre, 
          vida: sim2.vida, 
          ultimateDisponible: !!sim2.ultimateDisponible,
          dañoUltimate: sim2.dañoUltimate || 0,
          umbralUltimate: sim2.umbralUltimate || 50
        }
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
    };
    
    res.json(response);
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
  console.log('Recibida petición POST /fights/teams:', req.body);
  
  const { fightId, equipoHeroes, equipoVillanos, atacanteId, defensorId, tipoAtaque } = req.body;
  let pelea, heroes, villanos, simulados, rondas, creador;
  
  if (fightId) {
    console.log('Continuando pelea de equipos existente con ID:', fightId);
    pelea = await fightRepository.getFightById(fightId);
    if (!pelea) return res.status(400).json({ error: 'fightId no encontrado' });
    heroes = pelea.heroes;
    villanos = pelea.villanos;
    simulados = pelea.simulados;
    rondas = pelea.rondas || [];
    creador = pelea.creador;
  } else {
    console.log('Iniciando nueva pelea de equipos:', equipoHeroes, 'vs', equipoVillanos);
    if (!equipoHeroes || !equipoVillanos) return res.status(400).json({ error: 'equipoHeroes y equipoVillanos son obligatorios' });
    
    // Intentar buscar equipos en la base de datos primero
    const personajes = await personajeService.getAllPersonajes();
    heroes = personajes.filter(p => p.equipo === equipoHeroes && p.tipo === 'superheroe').slice(0, 3);
    villanos = personajes.filter(p => p.equipo === equipoVillanos && p.tipo === 'villano').slice(0, 3);
    
    // Si no se encuentran equipos en la base de datos, usar equipos aleatorios
    if (heroes.length === 0) {
      heroes = personajes.filter(p => p.tipo === 'superheroe').slice(0, 3);
    }
    if (villanos.length === 0) {
      villanos = personajes.filter(p => p.tipo === 'villano').slice(0, 3);
    }
    
    if (heroes.length !== 3 || villanos.length !== 3) {
      return res.status(400).json({ error: 'No se pudieron formar equipos válidos. Se requieren 3 superhéroes y 3 villanos.' });
    }
    
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
    console.log('Guardando nueva pelea de equipos con ID:', nuevoFightId);
    await fightRepository.addFight({ fightId: nuevoFightId, ...nuevoEstado });
  } else {
    console.log('Actualizando pelea de equipos existente con ID:', fightId);
    await fightRepository.updateFight(fightId, nuevoEstado);
  }
  
  console.log('Pelea de equipos guardada/actualizada exitosamente');
  
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

/**
 * @swagger
 * /api/fights/teams/complete:
 *   post:
 *     summary: Guardar una pelea de equipos completada
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               heroes:
 *                 type: array
 *                 description: Array de héroes participantes
 *               villanos:
 *                 type: array
 *                 description: Array de villanos participantes
 *               simulados:
 *                 type: object
 *                 description: Estado final de todos los personajes
 *               resultado:
 *                 type: string
 *                 enum: [victory, defeat]
 *                 description: Resultado de la pelea
 *               fecha:
 *                 type: string
 *                 description: Fecha de la pelea
 *               tipo:
 *                 type: string
 *                 description: Tipo de pelea
 *             required:
 *               - heroes
 *               - villanos
 *               - simulados
 *               - resultado
 *               - fecha
 *               - tipo
 *     responses:
 *       200:
 *         description: Pelea guardada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fightId:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST para guardar pelea de equipos completada
router.post('/fights/teams/complete', async (req, res) => {
  try {
    console.log('Recibida petición POST /fights/teams/complete:', req.body);
    
    const { heroes, villanos, simulados, resultado, fecha, tipo, creador } = req.body;
    
    if (!heroes || !villanos || !simulados || !resultado || !fecha || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    // Obtener el siguiente ID de pelea
    const fights = await fightRepository.getFights();
    const nuevoFightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
    
    // Preparar datos de la pelea
    const fightData = {
      fightId: nuevoFightId,
      heroes,
      villanos,
      simulados,
      resultado,
      fecha,
      tipo,
      creador: creador || (req.user && req.user.name) || 'Usuario',
      rondas: [] // Se puede expandir para incluir el historial de rondas
    };
    
    console.log('Guardando pelea completada con ID:', nuevoFightId);
    console.log('Datos a guardar:', JSON.stringify(fightData, null, 2));
    await fightRepository.addFight(fightData);
    
    console.log('Pelea completada guardada exitosamente');
    res.json({
      fightId: nuevoFightId,
      message: 'Pelea guardada exitosamente en el historial'
    });
    
  } catch (error) {
    console.error('Error guardando pelea completada:', error);
    res.status(500).json({ error: 'Error al guardar la pelea' });
  }
});

/**
 * @swagger
 * /api/fights:
 *   delete:
 *     summary: Eliminar todas las peleas del historial
 *     tags: [Peleas]
 *     responses:
 *       200:
 *         description: Todas las peleas eliminadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       500:
 *         description: Error al eliminar las peleas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE para eliminar todas las peleas
router.delete('/fights', async (req, res) => {
  try {
    const deletedCount = await fightRepository.deleteAllFights();
    res.json({ 
      message: 'Todas las peleas han sido eliminadas del historial',
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('Error al eliminar todas las peleas:', error);
    res.status(500).json({ error: 'Error al eliminar las peleas' });
  }
});

export default router; 