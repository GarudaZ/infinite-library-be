const express = require("express");
const mongoose = require("mongoose");
const { User, Book, Shelf } = require("./models");
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

app.get("/api/users/:id", async (req, res) => {
	const { id } = req.params;
	try {
		const user = await User.findById(id);
		res.status(200).json({ user: user });
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users" });
	}
});

app.get("/api/users/:id/shelves", async (req, res) => {
	const { id } = req.params;
	try {
		const user = await User.findById(id);
		res.status(200).json({ user: user });
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users" });
	}
});

app.post("/api/users", async (req, res) => {
	const newUser = new User({ ...req.body });
	const insertedUser = await newUser.save();
	return res.status(201).json({ added_user: insertedUser });
});

app.get("/api/books", async (req, res) => {
	try {
		const books = await Book.find();
		res.status(200).json({ books: books });
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users" });
	}
});

app.post("/api/books", async (req, res) => {
	const newBook = new Book({ ...req.body });
	const insertedBook = await newBook.save();
	return res.status(201).json({ added_book: insertedBook });
});

app.post("/api/:id/shelves", async (req, res) => {
	const newShelf = new Shelf({ ...req.body });
	const insertedShelf = await newShelf.save();
	return res.status(201).json({ added_shelf: insertedShelf });
});

app.patch("/api/shelves/:shelfId", async (req, res) => {
	const { shelfId } = req.params;
	const { book_id } = req.body;

	const shelf = await Shelf.findById(shelfId);
	if (!shelf) {
		return res.status(404).send({ error: "Shelf not found" });
	}

	shelf.books.push({ book_id, added_at: new Date() });
	await shelf.save();
	res.status(200).send({ updated_shelf: shelf });
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
