const express = require("express");
const mongoose = require("mongoose");
const { User } = require("./models");
require("dotenv").config();
const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
	return res.json({ message: "Hello, World ✌️" });
});

app.get("/users", async (req, res) => {
	try {
		const users = await User.find();
		console.log("users found");
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users" });
	}
});

app.post("/users", async (req, res) => {
	const newUser = new User({ ...req.body });
	const insertedUser = await newUser.save();
	return res.status(201).json(insertedUser);
});

const start = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_CONNECTION);
		app.listen(3000, () => console.log("Server started on port 3000"));
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

start();
