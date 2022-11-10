import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
try{
  await mongoClient.connect();
    db = mongoClient.db("");
  }
   catch (err) {
  console.log(err);
}

const app = express();
app.use(express.json());

app.get('/route', async (req, res) => {
  try{
    const x = await db.collection('x').find().toArray();
    res.send(x)
  } catch (err) {
    res.sendStatus(500);
  }  
});
app.post('/route', async (req, res) => {
  const x = req.body;
  try{
    await db.collection('x').insertOne(x);
    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(500)
  }
});


app.listen(5000, () => {
  console.log("Rodando em http://localhost:5000");
});
