import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import userschema from './schemas/user.schema.js';
import cors from "cors";
import dayjs  from "dayjs"

dotenv.config();


const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
try{
  await mongoClient.connect();
    db = mongoClient.db("APIbatepapouol");
  }
   catch (err) {
  console.log(err);
}

const app = express();
app.use(express.json());
app.use(cors());

app.get('/messages', async (req, res) => {
  const quantidade = req.params.limit * -1;
  const user = req.headers.user;
  try{
    const mensagens = await db.collection('messages').find().toArray();
    console.log(mensagens)
    const mensagensfiltradas = mensagens.filter((mensagem) => mensagem.type == "status" || mensagem.to == "Todos" || mensagem.from == user || mensagem.type == "status"  )
    console.log(mensagensfiltradas)

    res.send(mensagensfiltradas.slice(quantidade));
  } catch (err) {
    res.sendStatus(500);
  }  
});
app.post('/participants', async (req, res) => {
    const valida = userschema.validate(req.body);
    if(valida.error){
        res.send("Seu nome precisa ter pelo menos 1 caracter");
        return;
    }
    
    try{
      const existe = await db.collection("usuarios").findOne({name: req.body.name }) 
      console.log(existe);
      if(existe){
        res.status(409).send("Usuario já cadastrado");
        return;
      }
      const user = { name: req.body.name, lastStatus: Date.now()}
      const message = { from: req.body.name, to: "Todos", text: "entra na sala..." , type: "status", time: dayjs().format("HH:mm")}
      await db.collection("usuarios").insertOne(user);
      await db.collection("messages").insertOne(message)
      res.sendStatus(201);
    } catch (err) {
      console.log(err);
    }

 
});
app.get('/participants', async (req, res) => {
  try{
    const users = await db.collection('usuarios').find().toArray();
    res.send(users)
  } catch (err) {
    res.sendStatus(500);
  }  
});


app.listen(5000, () => {
  console.log("Rodando em http://localhost:5000");
});
