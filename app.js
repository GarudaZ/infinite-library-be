const express = require("express");
const mongoose = require("mongoose");
const { User } = require("./models");
require("dotenv").config();
const app = express();
app.use(express.json());
const endpoints = require("./endpoints.json");

app.get("/api", async (req, res) => {
	return res.json(endpoints);
});

app.get("/api/users", async (req, res) => {
	try {
		const users = await User.find();
		res.status(200).json({ users: users });
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users" });
	}
});

app.post("/api/users", async (req, res) => {
	const newUser = new User({ ...req.body });
	const insertedUser = await newUser.save();
	return res.status(201).json(insertedUser);
});

module.exports = app;

const start = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_CONNECTION);
		app.listen(3000, () => console.log("Server started on port 3000"));
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

if (require.main === module) {
	start();
}
