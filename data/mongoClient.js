import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://Asta:Baqueta2@asta.oemnzjb.mongodb.net/';
const dbName = process.env.MONGODB_DBNAME || 'test';
console.log('MONGODB_URI usado:', uri);
console.log('MONGODB_DBNAME usado:', dbName);
const client = new MongoClient(uri);

let db;
export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(dbName); // Usa el nombre de la base de datos de la variable de entorno
  }
  return db;
} 