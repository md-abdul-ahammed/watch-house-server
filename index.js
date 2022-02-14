const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wire
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wtvgs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("watch_store");
        const productCollection = database.collection("products");
        const orderCollection = database.collection("orders");
        const usersCollection = database.collection("users");
        const feedbackCollection = database.collection('feedback')


        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
        app.get('/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await usersCollection.findOne(query);
            let isAdmin = false;
            if (result?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })
        //add order
        app.post('/order', async (req, res) => {
            const result = await orderCollection.insertOne(req.body)
            res.send(result);
        });
        //my order 
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await orderCollection.find(query).toArray()
            res.json(result);
        })
        //get all order
        app.get('/order', async (req, res) => {
            const cursor = orderCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
        // add user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result);
        })
        //add user who login with google 
        app.put('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.send(result);
        })
        //make admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(query, updateDoc);
            res.send(result);
        })
        //add review from client
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await feedbackCollection.insertOne(reviews)
            res.send(result)
        })
        //get reviews for homepage show
        app.get('/reviews', async (req, res) => {
            const cursor = feedbackCollection.find({});
            const feedback = await cursor.toArray();
            res.send(feedback)
        })
        //Delete ordered Product 
        app.put("/deleteOrder", async (req, res) => {
            const id = req.body.id;
            const email = req.body.email;
            const productId = req.body.productId;
            const result = await orderCollection.updateOne({ _id: ObjectId(productId), email: email }, { $pull: { "cart.cartItems": { _id: id } } })
            res.send(result)
        })
        //update statues
        app.put("/updateStatus/:id", async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id) };
            const updateDoc = { $set: { status: status } };
            const result = await orderCollection.updateOne(query, updateDoc);
            res.send(result)
        })
        //add a new product
        app.post("/products", async (req, res) => {
            const product = req.body;
            console.log(product)
            const result = await productCollection.insertOne(product)
            res.json(result)
        })
        //manage product 
        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;
            const result = await productCollection.deleteOne({ _id: ObjectId(id) })
            res.send(result)
        })


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})
console.log(uri)
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})