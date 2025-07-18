import { connectDB } from '../data/mongoClient.js';

async function getFights(creador) {
    const db = await connectDB();
    const filtro = creador ? { creador } : {};
    return db.collection('fights').find(filtro).toArray();
}

async function getFightById(fightId) {
    const db = await connectDB();
    return db.collection('fights').findOne({ fightId: Number(fightId) });
}

async function addFight(fight) {
    const db = await connectDB();
    await db.collection('fights').insertOne(fight);
}

async function updateFight(fightId, updatedFight) {
    const db = await connectDB();
    await db.collection('fights').updateOne(
        { fightId: Number(fightId) },
        { $set: updatedFight }
    );
}

async function deleteFight(fightId) {
    const db = await connectDB();
    await db.collection('fights').deleteOne({ fightId: Number(fightId) });
}

export default {
    getFights,
    getFightById,
    addFight,
    updateFight,
    deleteFight
}; 