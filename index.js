require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173', 'https://recoverly-e17ce.web.app/', 'https://recoverly-e17ce.firebaseapp.com/'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  // console.log(`token inside verifyToken`, token)
  if(!token) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err) {
      return res.status(401).send({ message: 'Unauthorized Access' });
    }
    req.user = decoded;


    next();
  })
}


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

    // auth related apis
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '5h'});

      res.cookie('token', token, {
        httpOnly: true,
        secure: false
      })
      .send({success: true})
    })

    app.post('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: false
        })
        .send({success: true})
    })

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
        const { title, location } = req.query;
      
        // Construct the query object dynamically
        const query = {};
        if (title) {
          query.title = { $regex: title, $options: "i" }; 
        }
        if (location) {
          query.location = { $regex: location, $options: "i" };
        }
      
        try {
          const cursor = postCollection.find(query);
          const result = await cursor.toArray();
          res.send(result);
        } catch (error) {
          console.error("Error fetching posts:", error);
          res.status(500).send({ error: "Internal Server Error" });
        }

      });
      

      app.get('/posts/:id', verifyToken, async (req, res) => {
        const id = req.params.id;

        // console.log('idk man',req.cookies?.token)
      
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

      app.put('/posts/:id', async (req, res) => {
        const id = req.params.id;
        const updatedPost = req.body;
      
        // Validate if `id` is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid post ID' });
        }
      
        try {
          const query = { _id: new ObjectId(id) };
          const update = {
            $set: updatedPost, 
          };
      
          const result = await postCollection.updateOne(query, update);
      
          if (result.modifiedCount > 0) {
            res.send({ success: true, message: 'Post updated successfully' });
          } else if (result.matchedCount > 0) {
            res.send({ success: false, message: 'No changes made to the post' });
          } else {
            res.status(404).send({ success: false, message: 'Post not found' });
          }
        } catch (error) {
          console.error("Error updating post:", error);
          res.status(500).send({ error: "Internal Server Error" });
        }
      });      

      app.patch('/posts/:id', async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
      
        try {
          const result = await postCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status } }
          );
      
          if (result.modifiedCount === 1) {
            res.send({ success: true, message: "Post status updated successfully" });
          } else {
            res.status(404).send({ success: false, message: "Post not found" });
          }
        } catch (error) {
          console.error("Error updating post status:", error);
          res.status(500).send({ success: false, error: "Internal Server Error" });
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