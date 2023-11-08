const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 2500;

// middlwares

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const varifyRestaurantUser = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "Not Authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_RESTAURANT, (err, decoded) => {
    console.log(decoded);
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mongodbexploring.ykpstem.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const foodCollection = client.db("RestaurantDB").collection("foods");
    const orderCollection = client
      .db("RestaurantDB")
      .collection("Ordered foods");

    // get all foods
    app.get("/foods", async (req, res) => {
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get single food
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.get('/myfoods', async(req, res) => {
      console.log(req.query?.email);
      let query = {};
      if(req.query.emai){
        query = {email: req.query.email}
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result)
      
    })

    // get orders
    app.get("/myorders", varifyRestaurantUser, async (req, res) => {
      if (req.query?.email !== req.user?.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      console.log(req?.user);
      console.log(req.query?.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.cookies.email };
      }
      const result = await orderCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    app.post("/addfood", async (req, res) => {
      const food = req.body;
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

    // add to cart
    app.post("/order", async (req, res) => {
      const food = req.body;
      console.log(food);
      const result = await orderCollection.insertOne(food);
      res.send(result);
    });

    // jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("login", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_RESTAURANT, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // app.patch("/orders/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const updatedInfo = req.body;
    //   // console.log(updatedInfo);
    //   const upDatedDoc = {
    //     $set: {
    //       status: updatedInfo.status,
    //     },
    //   };
    //   const result = await orderCollection.updateOne(filter, upDatedDoc);
    //   res.send(result);
    // });

    app.delete("/myorders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/logout", async (req, res) => {
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Restaurant management server is running");
});

app.listen(port, () => {
  console.log(`Restaurant management is runnning on: ${port}`);
});
