require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
require('dotenv').config();


const app = express()
const port = 5000

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://bikehub-36d8b.web.app'
    ],
    credentials: true
}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Server Running...........')
})

app.listen(port, () => {
    console.log(`BikeHub server listening on port ${port}`)
})


const { MongoClient, ServerApiVersion } = require('mongodb');
// console.log(process.env.DB_USER);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lyuai16.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Collection
        const userCollection = client.db("BikeHubDB").collection("users");
        const categoryCollection = client.db("BikeHubDB").collection("categories");
        const productCollection = client.db("BikeHubDB").collection("products");
        const orderCollection = client.db("BikeHubDB").collection("orders");
        // User API Start
        // Add User API
        app.post("/user", async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "User already exists", insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // All user get
        app.get('/users', async (req, res) => {
            const data = await userCollection.find().sort({ _id: -1 }).toArray();
            res.send(data);
        })

        // Single user get
        app.get("/users/:id", async (req, res) => {
            const userEmail = req.params.id;
            try {
                const user = await userCollection.findOne({ email: userEmail });
                if (!user) {
                    return res.status(404).json({ error: "user not found" });
                }
                res.json(user);
            } catch (error) {
                console.error("Error fetching user:", error);
                res.status(500).json({ error: "Server error" });
            }
        });

        // Edit User
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            try {
                const filter = { email: email }; // Filter by email instead of _id
                const options = { upsert: true };
                const { displayName, phone, address, photoURL } = req.body;

                const userData = {
                    displayName,
                    phone,
                    address,
                    photoURL
                };

                const updateData = {
                    $set: userData
                };

                const result = await userCollection.updateOne(filter, updateData, options);
                res.send(result);

            } catch (error) {
                console.error("Error updating user:", error);
                res.status(500).send({ error: 'Failed to update user' });
            }
        });


        // Toggle User Role
        app.patch('/users/:id', async (req, res) => {
            const userId = req.params.id;
            const { role } = req.body;

            if (!role || !["user", "admin"].includes(role)) {
                return res.status(400).json({ error: "Invalid role specified" });
            }

            try {
                const result = await userCollection.updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: { role } }
                );

                if (result.modifiedCount === 1) {
                    res.json({ message: `User role updated to ${role}` });
                } else {
                    res.status(404).json({ error: "User not found or role already set" });
                }
            } catch (error) {
                console.error("Error updating role:", error);
                res.status(500).json({ error: "Failed to update user role" });
            }
        });

        app.patch('/users/email/:id', async (req, res) => {
            const userEmail = req.params.id;
            const { displayName, phone, address } = req.body;
            const updateData = {
                displayName,
                phone,
                address
            }
            try {
                const result = await userCollection.updateOne(
                    { email: userEmail },
                    { $set: updateData }
                );

                if (result.modifiedCount === 1) {
                    res.json({ message: `User data updated` });
                } else {
                    res.status(404).json({ error: "User not found" });
                }
            } catch (error) {
                console.error("Error updating role:", error);
                res.status(500).json({ error: "Failed to update user" });
            }
        });
        // User API End
        // Categories API Start
        // Add Category
        app.post("/category", async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.send(result);
        });
        // Retrive Categories
        app.get('/categories', async (req, res) => {
            const data = await categoryCollection.find().sort({ _id: -1 }).toArray();
            res.send(data);
        })

        // Retrive Categories for HomePage
        app.get('/categories/home', async (req, res) => {
            const data = await categoryCollection.find().sort({ _id: -1 }).limit(6).toArray();
            res.send(data);
        })

        // Single Category Get
        app.get("/category/:id", async (req, res) => {
            const categoryId = req.params.id;
            console.log(categoryId);
            try {
                const category = await categoryCollection.findOne({ _id: new ObjectId(categoryId) });
                if (!category) {
                    return res.status(404).json({ error: "category not found" });
                }
                res.json(category);
            } catch (error) {
                console.error("Error fetching podcast:", error);
                res.status(500).json({ error: "Server error" });
            }
        });

        // Edit Category
        app.put('/category/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const filter = { _id: new ObjectId(id) };
                const options = { upsert: true };
                const { categoryName, slug, description, imageUrl } = req.body;

                const categoryData = {
                    categoryName,
                    slug,
                    description,
                    imageUrl
                };

                const updateData = {
                    $set: categoryData
                };

                const result = await categoryCollection.updateOne(filter, updateData, options);
                res.send(result);

            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to update category' });
            }
        })

        // Delete Categories
        app.delete('/category/:id', async (req, res) => {
            const category_id = new ObjectId(req.params.id);
            console.log(category_id);
            const query = { _id: category_id };
            const result = await categoryCollection.deleteOne(query);
            res.send(result);
        });
        // Categories API End
        // Product API Start
        // Add Product
        app.post("/product", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        // All Product Get
        app.get('/products', async (req, res) => {
            const data = await productCollection.find().sort({ _id: -1 }).toArray();
            res.send(data);
        })

        // Single Product Get
        app.get("/product/:id", async (req, res) => {
            const productId = req.params.id;
            try {
                const product = await productCollection.findOne({ _id: new ObjectId(productId) });
                if (!product) {
                    return res.status(404).json({ error: "product not found" });
                }
                res.json(product);
            } catch (error) {
                console.error("Error fetching product:", error);
                res.status(500).json({ error: "Server error" });
            }
        });

        // Categorywise product get
        app.get('/products/category', async (req, res) => {
            const categoryName = req.query.categoryName;
            console.log(categoryName);
            if (!categoryName) {
                return res.status(400).json({ message: "Category name is required as a query parameter." });
            }

            try {
                // Filter products based on categoryName
                const products = await productCollection.find({ category: categoryName }).toArray();
                res.status(200).json(products);
            } catch (error) {
                res.status(500).json({ message: "Error fetching products", error: error.message });
            }
        });

        // Edit Product
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const filter = { _id: new ObjectId(id) };
                const options = { upsert: true };
                const { productName, price, category, description, imageUrl, brand, engineCapacity, modelYear, rating } = req.body;
                // console.log(product);
                const productData = {
                    productName,
                    price,
                    category,
                    description,
                    imageUrl,
                    brand,
                    engineCapacity,
                    modelYear,
                    rating
                };

                const updateData = {
                    $set: productData
                };

                const result = await productCollection.updateOne(filter, updateData, options);
                res.send(result);

            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to update category' });
            }
        })

        // Delete Categories
        app.delete('/products/:id', async (req, res) => {
            const product_id = new ObjectId(req.params.id);
            const query = { _id: product_id };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });

        // Product API End

        // Order API Start

        // Order Added by Customer
        app.post("/order", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // Get All Order
        // All Order Get
        app.get('/order', async (req, res) => {
            const { email } = req.query;
            console.log('Received email:', email); // Debugging line

            try {
                let data;

                if (email) {
                    // Fetch orders based on customerEmail
                    data = await orderCollection.find({ "purchaseData.customerEmail": email }).sort({ _id: -1 }).toArray();
                    console.log('Data fetched for email:', data); // Log fetched data
                } else {
                    // Fetch all orders if no email is provided
                    data = await orderCollection.find().sort({ _id: -1 }).toArray();
                }

                res.send(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
                res.status(500).send({ message: 'Error fetching orders' });
            }
        });
        // Order API End
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);
