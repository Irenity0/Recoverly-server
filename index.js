require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173', 'https://recoverly-e17ce.web.app/', 'https://recoverly-e17ce.firebaseapp.com/'],
    credentials: true
}));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oo5u4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const postCollection = client.db('Recoverly').collection("posts");
    const userCollection = client.db('Recoverly').collection("users");
    const recoveryCollection = client.db('Recoverly').collection("recoveries");

    // recoveries api
    app.post('/recoveries', async (req, res) => {
      const newRecovery = req.body;
      console.log('Adding new post', newRecovery)

      const result = await recoveryCollection.insertOne(newRecovery);
      res.send(result);
    });

    app.get('/recoveries', async (req, res) => {
      const cursor = recoveryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });


    // posts api
    app.post('/posts', async (req, res) => {
        const newPost = req.body;
        console.log('Adding new post', newPost)
  
        const result = await postCollection.insertOne(newPost);
        res.send(result);
      });
  
      app.get('/posts', async (req, res) => {
        const cursor = postCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });

      app.get('/posts/:id', async (req, res) => {
        const id = req.params.id;
      
        // Validate if `id` is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid post ID' });
        }
      
        const query = { _id: new ObjectId(id) };
        try {
          const result = await postCollection.findOne(query);
          if (!result) {
            return res.status(404).send({ error: 'Post not found' });
          }
          res.send(result);
        } catch (error) {
          console.error("Error retrieving post:", error);
          res.status(500).send({ error: "Internal Server Error" });
        }
      });

      app.delete('/posts/:id', async (req, res) => {
        const id = req.params.id; 
        const query = { _id: new ObjectId(id) };
        const result = await postCollection.deleteOne(query);
        res.send(result);
      });

    //  user apis
    app.post('/users', async (req, res) => {
        const newUser = req.body;
        console.log('creating new user', newUser);
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      });
  
      app.get('/users', async (req, res) => {
        const cursor = userCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });

      app.get('/users/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        res.send(user);
      });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Lost n Found')
});
app.listen(port, () => {
    console.log(`Losing stuff at ${port}`);
})