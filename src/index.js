import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import userschema from './schemas/user.schema.js';
import cors from "cors";
import dayjs from "dayjs"
import msgschema from "./schemas/msg.schema.js"


dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
try {
  await mongoClient.connect();
  db = mongoClient.db("APIbatepapouol");
}
catch (err) {
  console.log(err);
}

const app = express();
app.use(express.json());
app.use(cors());

setInterval(async () => {
  const participantes = await db.collection("usuarios").find().toArray();
  participantes.forEach(async (dados) => {
    if (Date.now() - dados.lastStatus > 10000) {
      await db.collection("messages").insertOne({ from: dados.name, to: "Todos", text: "sai da sala...", type: "status", time: dayjs().format("HH:mm:ss") })
      await db.collection("usuarios").deleteOne({ _id: (dados._id) })
    };
  }
  );
}, 15000)

app.get('/messages', async (req, res) => {
  const quantidade = req.params.limit * -1;
  const user = req.headers.user;
  try {
    if (!user) {
      return res.sendStatus(422);
    };
    const mensagens = await db.collection('messages').find().toArray();
    const mensagensfiltradas = mensagens.filter((mensagem) => mensagem.type == "status" || mensagem.type == "message" || mensagem.from == user || mensagem.to == user)
    res.send(mensagensfiltradas.slice(quantidade));
  } catch (err) {
    res.sendStatus(500);
  }
});
app.post('/messages', async (req, res) => {
  const validabody = msgschema.validate(req.body);
  if (validabody.error) {
    return res.sendStatus(422);
  }
  const { to, text, type } = req.body;
  const user = req.headers.user;
  const msg = {
    from: user,
    to,
    text,
    type,
    time: dayjs().format("HH:mm:ss")
  }
  try {
    const validauser = await db.collection("usuarios").findOne({ name: user });
    if (!validauser) {
      return res.sendStatus(422);
    }
    await db.collection("messages").insertOne(msg);
    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(500);
  }
});

app.post('/participants', async (req, res) => {
  try {
    const valida = userschema.validate(req.body);
    if (valida.error) {
      return res.send("Seu nome precisa ter pelo menos 1 caracter").status(422);
    }
    const existe = await db.collection("usuarios").findOne({ name: req.body.name })
    if (existe) {
      return res.status(409).send("Usuario já cadastrado");
    }
    const user = { name: req.body.name, lastStatus: Date.now() }
    const message = { from: req.body.name, to: "Todos", text: "entra na sala...", type: "status", time: dayjs().format("HH:mm:ss") }
    await db.collection("usuarios").insertOne(user);
    await db.collection("messages").insertOne(message)
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
  }
});
app.post('/status', async (req, res) => {
  const user = req.headers.user;
  try {
    const validauser = await db.collection("usuarios").findOne({ name: user });
    if (!validauser) {
      return res.sendStatus(404);
      
    }
    await db.collection("usuarios").updateOne({ name: user }, { $set: { name: user, lastStatus: Date.now() } })
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500)
  }
});
app.get('/participants', async (req, res) => {
  try {
    const users = await db.collection('usuarios').find().toArray();
    res.send(users)
  } catch (err) {
    res.sendStatus(500);
  }
});

app.put('/messages/:id', async (req, res) => {
  const { id } = req.params;
  const validabody = msgschema.validate(req.body);
  if (validabody.error) {
    return res.sendStatus(422);
  }
  const {text} = req.body;
  const user = req.headers.user;
  try {
    const message = await db.collection("messages").findOne({ _id: new ObjectId(id) })
    const validauser = await db.collection("usuarios").findOne({ name: user });
    if (!validauser) {
      return res.sendStatus(404);
    }
    if (!message) {
      return res.sendStatus(404);
    }
    if (message.from != user) {
      return res.sendStatus(401);
    }
    await db.collection("messages").updateOne({ _id: (id) }, { $set: { text: text } })
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(error)
  }
});

app.delete('/messages/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.headers.user
  try {
    const message = await db.collection("messages").findOne({ _id: new ObjectId(id) })
    const validauser = await db.collection("usuarios").findOne({ name: user });
    if (!validauser) {
      return res.sendStatus(404);
    }
    if (!message) {
      return res.sendStatus(404);
    }
    if (message.from != user) {
      return res.sendStatus(401);
    }
    await db.collection("messages").deleteOne({ _id: new ObjectId(id) })
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(error)
  }
});


app.listen(5000, () => {
  console.log("Rodando em http://localhost:5000");
});
