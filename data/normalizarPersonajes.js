import { connectDB } from './mongoClient.js';

async function normalizarPersonajes() {
  const db = await connectDB();
  const personajes = await db.collection('personajes').find({}).toArray();
  
  for (const p of personajes) {
    await db.collection('personajes').updateOne(
      { _id: p._id },
      {
        $set: {
          id: Number(p.id),
          nombre: p.nombre,
          ciudad: p.ciudad,
          tipo: p.tipo === 'overwatch' ? 'superheroe' : p.tipo === 'blackwatch' ? 'villano' : p.tipo,
          equipo: p.equipo ? p.equipo.trim().toUpperCase() : undefined,
          nivel: Number(p.nivel) || 1,
          experiencia: Number(p.experiencia) || 0,
          escudo: Number(p.escudo) || 0,
          vida: 100, // Forzar vida a 100
          dañoUltimate: Number(p.dañoUltimate) || 0,
          umbralUltimate: Number(p.umbralUltimate) || 150,
          ultimateDisponible: Boolean(p.ultimateDisponible) || false,
          fuerza: Number(p.fuerza) || 50
        },
        $unset: {
          velocidad: "",
          inteligencia: "",
          magia: "",
          imagen: "",
          vidaMaxima: "",
          dañoBasico: "",
          dañoEspecial: "",
          cargaUltimate: ""
        }
      }
    );
  }
  console.log('Normalización completada.');
  process.exit(0);
}

normalizarPersonajes(); 