const { MongoClient } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

// Bypass local ISP/Router DNS blocking of MongoDB SRV records
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.log("Could not override DNS servers.");
}

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("Missing MONGODB_URI in .env!");
    process.exit(1);
}

const client = new MongoClient(uri);
let db;

async function connectDB() {
    await client.connect();
    db = client.db('garage_bot');
    console.log("✅ Connected to MongoDB cloud database!");
    
    // Seed database if empty
    const count = await db.collection('vehicles').countDocuments();
    if (count === 0) {
        const seedData = [
            { brand: 'Toyota', model: 'Landcruiser V8', year: 2021, price: 'Ksh 12,500,000', status: 'Available' },
            { brand: 'Mercedes', model: 'G-Wagon G63', year: 2023, price: 'Ksh 24,000,000', status: 'Available' },
            { brand: 'BMW', model: 'X5 M Competition', year: 2022, price: 'Ksh 15,000,000', status: 'Sold' },
            { brand: 'Audi', model: 'RSQ8', year: 2023, price: 'Ksh 18,500,000', status: 'Available' },
            { brand: 'Porsche', model: 'Cayenne Turbo GT', year: 2024, price: 'Ksh 28,000,000', status: 'Available' },
            { brand: 'Range Rover', model: 'Autobiography', year: 2023, price: 'Ksh 22,000,000', status: 'Available' }
        ];
        await db.collection('vehicles').insertMany(seedData);
        console.log("✅ Seeded MongoDB with sample vehicles!");
    }

    // Initialize settings if empty
    const settingsCount = await db.collection('settings').countDocuments();
    if (settingsCount === 0) {
        await db.collection('settings').insertOne({ key: 'group_responses', value: 'off' });
    }
}

async function getSetting(key) {
    const setting = await db.collection('settings').findOne({ key });
    return setting ? setting.value : null;
}

async function setSetting(key, value) {
    await db.collection('settings').updateOne(
        { key },
        { $set: { value } },
        { upsert: true }
    );
}

async function getAvailableCars() {
    return await db.collection('vehicles').find({ status: 'Available' }).toArray();
}

async function searchCars(query) {
    const regex = new RegExp(query, 'i');
    return await db.collection('vehicles').find({
        $or: [
            { brand: { $regex: regex } },
            { model: { $regex: regex } }
        ]
    }).toArray();
}

function getMongoClient() {
    return client;
}

module.exports = { connectDB, getSetting, setSetting, getAvailableCars, searchCars, getMongoClient };
