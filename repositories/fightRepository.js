import { connectDB } from '../data/mongoClient.js';

async function getFights(creador) {
    const db = await connectDB();
    const filtro = creador ? { creador } : {};
    console.log('🔍 Buscando peleas con filtro:', filtro);
    const fights = await db.collection('fights').find(filtro).toArray();
    console.log('📊 Peleas encontradas:', fights.length);
    return fights;
}

async function getFightById(fightId) {
    const db = await connectDB();
    console.log('🔍 Buscando pelea con ID:', fightId);
    const fight = await db.collection('fights').findOne({ fightId: Number(fightId) });
    console.log('📊 Pelea encontrada:', fight ? 'SÍ' : 'NO');
    return fight;
}

async function addFight(fight) {
    const db = await connectDB();
    console.log('💾 Guardando nueva pelea:', fight.fightId);
    const result = await db.collection('fights').insertOne(fight);
    console.log('✅ Pelea guardada con _id:', result.insertedId);
    return result;
}

async function updateFight(fightId, updatedFight) {
    const db = await connectDB();
    console.log('🔄 Actualizando pelea con ID:', fightId);
    const result = await db.collection('fights').updateOne(
        { fightId: Number(fightId) },
        { $set: updatedFight }
    );
    console.log('✅ Pelea actualizada, modificados:', result.modifiedCount);
    return result;
}

async function deleteFight(fightId) {
    const db = await connectDB();
    console.log('🗑️ Eliminando pelea con ID:', fightId);
    const result = await db.collection('fights').deleteOne({ fightId: Number(fightId) });
    console.log('✅ Pelea eliminada, eliminados:', result.deletedCount);
    return result;
}

async function deleteAllFights() {
    const db = await connectDB();
    console.log('🗑️ Eliminando todas las peleas');
    const result = await db.collection('fights').deleteMany({});
    console.log('✅ Peleas eliminadas, eliminados:', result.deletedCount);
    return result.deletedCount;
}

export default {
    getFights,
    getFightById,
    addFight,
    updateFight,
    deleteFight,
    deleteAllFights
}; 