const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// middlewares

app.use(express.json())
app.use(cors())

// middlewares for JWT
const verifyToken = (req , res, next) => {
  console.log(req.headers.authorized)
  if(!req.headers.authorized){
  return   res.status(401).send({message : "Unauthorized Access"})
  }
  const token = req.headers.authorized.split(' ')[1]
  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decode) => {
    if(err){
      return   res.status(401).send({message : "Unauthorized Access"})
    }
    req.decoded = decode
    next()
  })
}
 


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
    const MomentumDailyPublisherCollections = client.db('momentumDB').collection('publisher')
    // JWT
    app.post('/jwt' , async (req , res)  => {
      const  user = req.body 
      const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {expiresIn : '1h'})
      res.send({ token })
    })
    // verifying admin after verifyToken

 const VerifyAdmin = async (req , res , next) => {
  const email = req.decoded?.email;
  console.log(email)
  const query = {email : email};
  const user = await MomentumDailyUserCollections.findOne(query);
  const isAdmin = user?.role === 'Admin';
  if(!isAdmin){
    return   res.status(403).send({message : "Forbidden Access"})
  }
  next()
}

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
    // dynamic for details
    app.get('/allarticles/:id' , async (req , res) => {
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await MomentumDailyCollections.findOne(query)
      res.send(result)
    })
    // delete 
    app.delete('/allarticles/:id' , verifyToken , VerifyAdmin, async(req , res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await MomentumDailyCollections.deleteOne(query)
      res.send(result)
    })
    // increment of views 
    app.put('/allarticles/:id' , verifyToken , VerifyAdmin, async(req , res) => {
      const {id} = req.params;
      console.log(id)
      const result = await MomentumDailyCollections.updateOne({_id: new ObjectId(id)},
      {$inc: {views: 1}}
      );
      res.send(result)
    })
    // changing Status 
    app.put('/allarticles/updateStatus/:id' , verifyToken , VerifyAdmin, async (req , res)=>{
      
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const result = await MomentumDailyCollections.updateOne(filter , {$set:{approved: 'approved'}})
      res.send(result)
    })
    // make premium 
    app.put('/allarticles/premium/:id' , verifyToken , VerifyAdmin, async (req , res)=>{
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const result = await MomentumDailyCollections.updateOne(filter , {$set:{type: 'Premium'}})
      res.send(result)
    })
    // decline status 
    app.put('/allarticles/declineStatus/:id' , verifyToken , VerifyAdmin, async (req , res ) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id)}
      const {reason} = req.body
      console.log(reason , id)
      const result = await MomentumDailyCollections.updateOne(filter ,{$set:{ approved: 'declined', reason: reason || null}})
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
    app.get('/users' , verifyToken ,VerifyAdmin, async (req , res) => {
      // console.log(req.headers)
      const result = await MomentumDailyUserCollections.find().toArray()
      res.send(result)
    })
    
    app.get('/users/profile' , async (req , res) => {
      const email = req.query.email
      const result = await MomentumDailyUserCollections.findOne({email : email})
      res.send(result)
    })
    app.get('/users/admin/:email',  async (req , res) => {
      console.log('hello')
      const email = req.params.email
      const query = {email : email}
      const result = await MomentumDailyUserCollections.findOne(query)
      let admin = false 
      if(result){
        admin = result.role === "Admin"
      }
      
      res.send({ admin })
      })
    // users PROFILE update 
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
    // ADMIN ROLE PATCH 
    app.patch('/users/admin/:id' , async (req , res) => {
      const id = req.params.id
      const filter = { _id : new ObjectId(id)}
      const updatedAdmin = {
      $set :  {
          role : 'Admin'
        }
      }
      const result = await MomentumDailyUserCollections.updateOne(filter , updatedAdmin)
      res.send(result)
    })
    

    // plans
    app.get('/plans' , async (req , res )=> {
      const result = await MomentumDailyPlansCollections.find().toArray()
      res.send(result)
    })
    // publisher
    app.post('/publisher' , verifyToken , VerifyAdmin, async (req , res) => {
      const publisher = req.body;
      const result = await MomentumDailyPublisherCollections.insertOne(publisher)
      res.send(result)
    })
    app.get('/publisher' , async(req , res )=> {
      const result = await MomentumDailyPublisherCollections.find().toArray()
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