const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { MongoClient } = require('mongodb');

const MONGO_URI = "mongodb://localhost:27017/";
const DB_NAME = "ChatGPT_Evaluation";

async function loadCSV(collectionName) {
  const filePath = path.join(__dirname, 'data', `${collectionName}.csv`);
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(collectionName);

  await col.deleteMany({});

  // Read CSV file correctly (handles quoted commas!)
  const raw = fs.readFileSync(filePath, "utf8");

  const rows = parse(raw, {
    skip_empty_lines: true
  });

  const data = rows.map(parts => {
    return {
      question: parts[0] || "",
      options: [parts[1], parts[2], parts[3], parts[4]],
      correct_answer: parts[5]?.trim() || "",
      chatgpt_response: "",
      domain: collectionName
    };
  });

  const records = data.slice(0,100)
  await col.insertMany(records);
  console.log(`Inserted ${records.length} questions into ${collectionName}`);

  await client.close();
}

async function run() {
  await loadCSV("History");
  await loadCSV("Social_Science");
  await loadCSV("Computer_Security");
}

run();
