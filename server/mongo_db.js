const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const MONGO_URI = "mongodb://localhost:27017/";
const DB_NAME = "ChatGPT_Evaluation";

async function loadTSV(collectionName) {
  const filePath = path.join(__dirname, 'data', `${collectionName}.csv`);
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(collectionName);

  await col.deleteMany({}); // clear old data

  const data = fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const parts = line.split(/\t/); // split by tab
      return {
        question: parts[0] || "",
        options: parts.slice(1, 4),       
        correct_answer: parts[5] || "",   
        chatgpt_response: "",             // leave blank, will fill later
        domain: collectionName
      };
    });

  await col.insertMany(data);
  console.log(`✅ Inserted ${data.length} documents into ${collectionName}`);
  await client.close();
}

async function run() {
  await loadTSV("History");
  await loadTSV("Social_Science");
  await loadTSV("Computer_Security");
}

run();
