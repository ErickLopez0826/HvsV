import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Personajes',
      version: '1.0.0',
      description: 'API REST para gestionar personajes (superhéroes y villanos) y peleas entre ellos. Solo se permiten peleas entre un superhéroe y un villano.',
      contact: {
        name: 'Desarrollador',
        email: 'tu-email@ejemplo.com'
      }
    },
    servers: [
      {
        url: 'https://hvsv.onrender.com',
        description: 'Servidor en Render (producción)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
        Personaje: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID único del personaje' },
            nombre: { type: 'string', description: 'Nombre del personaje' },
            ciudad: { type: 'string', description: 'Ciudad de origen' },
            tipo: { type: 'string', enum: ['superheroe', 'villano'], description: 'Tipo de personaje' },
            equipo: { type: 'string', description: 'Equipo al que pertenece' },
            nivel: { type: 'integer', description: 'Nivel del personaje', default: 1 },
            experiencia: { type: 'integer', description: 'Experiencia actual', default: 0 },
            escudo: { type: 'integer', description: 'Escudo del personaje', default: 0 },
            vida: { type: 'integer', description: 'Vida actual del personaje', default: 100 },
            dañoUltimate: { type: 'integer', description: 'Daño acumulado para ultimate', default: 0 },
            umbralUltimate: { type: 'integer', description: 'Umbral para activar ultimate', default: 150 },
            ultimateDisponible: { type: 'boolean', description: 'Si el ultimate está disponible', default: false },
            fuerza: { type: 'integer', description: 'Fuerza del personaje', default: 50 }
          },
          required: ['nombre', 'tipo']
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Mensaje de error' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autenticación' },
      { name: 'Personajes', description: 'Gestión de personajes' },
      { name: 'Peleas', description: 'Gestión de peleas' },
      { name: 'Equipos', description: 'Gestión de equipos' }
    ]
  },
  apis: ['./controllers/*.js']
};

export default options; 