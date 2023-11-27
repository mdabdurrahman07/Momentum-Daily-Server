const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middlewares

app.use(express.json())
app.use(cors())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.abtiefd.mongodb.net/?retryWrites=true&w=majority`;

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
   
    const MomentumDailyCollections = client.db('momentumDB').collection('allArticles')
    const MomentumDailyUserCollections = client.db('momentumDB').collection('allUsers')
    const MomentumDailyPlansCollections = client.db('momentumDB').collection('plans')

    // all articles related end points
    app.post('/allarticles' , async (req , res ) => {
        const data = req.body
        const result = await MomentumDailyCollections.insertOne(data)
        res.send(result)
    })
    app.get('/allarticles' , async (req , res) => {
      const result = await MomentumDailyCollections.find().toArray()
      res.send(result)
    })
    // app.get('/allarticles' , async (req , res) => {
    //   const limit = parseInt(req.query.limit) || 5;
    //   const offset = parseInt(req.query.offset) || 0
    //   const result = await MomentumDailyCollections.find().skip(offset).limit(limit).toArray()
    //   res.send(result)
    // })
    // user related end points
    app.post('/users' , async (req , res) => {
        const users = req.body
        const query = {email : users.email}
        const isExist = await MomentumDailyUserCollections.findOne(query)
        if(isExist){
            return res.send({message:'User Already Exist' , insertedId : null})
        }
        else{
          const result = await MomentumDailyUserCollections.insertOne(users)
        res.send(result)
        }
    })
    app.get('/users' , async (req , res) => {
      const email = req.query.email
      const result = await MomentumDailyUserCollections.findOne({email : email})
      res.send(result)
    })
    // users update 
    app.put('/users/:id' , async (req , res) => {
      const users = req.body
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const options = { upsert: true };
      const updateDoc = {
        $set: {
            displayName: users.displayName,
            photoURL: users.photoURL
        },
      };
      const result = await MomentumDailyUserCollections.updateOne(filter , updateDoc , options)
      res.send(result)
    })
    

    // plans
    app.get('/plans' , async (req , res )=> {
      const result = await MomentumDailyPlansCollections.find().toArray()
      res.send(result)
    })












    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/' , async (req , res ) => {
    res.send('Momentum Daily server is Running ')
})
app.listen(port , ()=> {
    console.log(`This server is running on ${port}`)
})