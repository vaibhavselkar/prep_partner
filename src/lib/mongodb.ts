import { MongoClient, type Db } from "mongodb";

// Serverless-safe MongoClient: reuse one client across hot invocations (and across
// HMR reloads in dev) so we don't exhaust the connection pool on Vercel.
const uri = process.env.MONGODB_URI;

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  const g = globalThis as unknown as { _mongoClientPromise?: Promise<MongoClient> };
  if (!g._mongoClientPromise) {
    g._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = g._mongoClientPromise;
  return clientPromise;
}

/** Returns the app database (defaults to the DB in the URI, else "prep_partner"). */
export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(); // uses the database named in MONGODB_URI, or the driver default
}

export function isMongoConfigured(): boolean {
  return Boolean(uri);
}
