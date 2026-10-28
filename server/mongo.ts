
import dns from 'dns';
import { MongoClient, Db } from 'mongodb';
import { DatabaseSchema } from './db.js';

// Configure public DNS servers to prevent Windows querySrv ECONNREFUSED issues
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isConnected = false;

export async function initMongo(): Promise<boolean> {
  const uri = process.env.MONGO_URI;
  if (!uri) return false;

  try {
    console.log('[LifeFlow DB] Connecting to MongoDB Atlas cluster...');
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db('lifeflow_blood_bank');
    isConnected = true;
    console.log('✓ [LifeFlow DB] MongoDB Atlas connected successfully (database: lifeflow_blood_bank)');
    return true;
  } catch (err: any) {
    console.warn(`! [LifeFlow DB] MongoDB Atlas connection note: ${err.message}`);
    if (process.env.USE_JSON_FALLBACK === 'true') {
      console.log('ℹ [LifeFlow DB] USE_JSON_FALLBACK is enabled. Seamlessly operating on local data storage (data/lifeflow_db.json).');
    }
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export async function syncToMongo(data: DatabaseSchema): Promise<void> {
  if (!isConnected || !mongoDb) return;
  try {
    const invCol = mongoDb.collection('inventory');
    const donorCol = mongoDb.collection('donors');
    const reqCol = mongoDb.collection('requests');
    const txCol = mongoDb.collection('transactions');

    if (data.inventory.length > 0) {
      const ops = data.inventory.map(({ _id, ...item }: any) => ({
        updateOne: {
          filter: { bloodGroup: item.bloodGroup },
          update: { $set: item },
          upsert: true,
        },
      }));
      await invCol.bulkWrite(ops);
    }
    if (data.donors.length > 0) {
      const ops = data.donors.map(({ _id, ...item }: any) => ({
        updateOne: {
          filter: { id: item.id },
          update: { $set: item },
          upsert: true,
        },
      }));
      await donorCol.bulkWrite(ops);
    }
    if (data.requests.length > 0) {
      const ops = data.requests.map(({ _id, ...item }: any) => ({
        updateOne: {
          filter: { id: item.id },
          update: { $set: item },
          upsert: true,
        },
      }));
      await reqCol.bulkWrite(ops);
    }
    if (data.transactions.length > 0) {
      const ops = data.transactions.map(({ _id, ...item }: any) => ({
        updateOne: {
          filter: { id: item.id },
          update: { $set: item },
          upsert: true,
        },
      }));
      await txCol.bulkWrite(ops);
    }
  } catch (err: any) {
    console.error('Failed to sync data with MongoDB Atlas:', err.message);
  }
}
