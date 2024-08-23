const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Book, Shelf } = require("./models");
require("dotenv").config();
const app = express();
app.use(express.json());
const endpoints = require("./endpoints.json");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const createLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
});

app.use(
	cors()
	// 	{
	// 	origin: "http://localhost:4200",
	// }
);

app.get("/api", async (req, res) => {
	return res.json(endpoints);
});

//remove this when no longer needed for development
app.get("/api/users", async (req, res) => {
	try {
		console.log("Fetching users...");
		const users = await User.find();
		console.log("Users fetched successfully");
		res.status(200).json({ users: users });
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users" });
	}
});

app.post("/api/users", createLimiter, async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		const newUser = new User({
			username: req.body.username,
			password: hashedPassword,
		});
		const insertedUser = await newUser.save();
		return res.status(201).json({ added_user: insertedUser });
	} catch (error) {
		res.status(500).json({ error: "An error occurred adding user" });
	}
});

app.post("/api/users/login", async (req, res) => {
	const user = await User.findOne({ username: req.body.username });
	console.log(user.password);
	console.log(req.body.password);

	if (user === null) {
		res.status(400).json({ error: "no user found" });
	}
	try {
		if (await bcrypt.compare(req.body.password, user.password)) {
			console.log("getting token");
			console.log(user);

			const tokenUserDetails = { username: user.username, user_id: user._id };

			const accessToken = jwt.sign(tokenUserDetails, process.env.JWT_SECRET);
			res
				.status(200)
				.json({ success: "Logged in successfully", token: accessToken });
		} else {
			res.status(401).json({ failed: "Password doesn't match" });
		}
	} catch {
		res.status(500).json({ error: "Error logging in" });
	}
});

//middleware
function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (token === null)
		return res.status(401).json({ error: "header undefined" });

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) return res.status(403);
		req.user = user;
		next();
	});
}

app.get("/api/users/:id", authenticateToken, async (req, res) => {
	console.log(req.user);

	const { id } = req.params;
	try {
		const user = await User.findById(id);
		if (user.username === req.user.username) {
			res.status(200).json({ user: user });
		} else {
			return res
				.status(401)
				.json({ error: "not authorised to access this user" });
		}
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users" });
	}
});

app.get("/api/users/:id/shelves", async (req, res) => {
	const { id } = req.params;
	try {
		const user = await User.findById(id).populate({ path: "shelves" });
		res.status(200).json({ shelves: user.shelves });
	} catch (error) {
		res.status(500).json({ error: "An error occurred fetching users shelves" });
	}
});

app.post("/api/users/:id/shelves", async (req, res) => {
	const { id } = req.params;

	try {
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		const newShelf = new Shelf({ ...req.body });
		const insertedShelf = await newShelf.save();

		user.shelves.push(insertedShelf._id);
		await user.save();

		return res.status(201).json({ added_shelf: insertedShelf });
	} catch (error) {
		res.status(500).json({ error: "An  error occurred posting user shelf" });
	}
});

app.get("/api/users/:id/shelves/books", async (req, res) => {
	try {
		const { id } = req.params;

		const user = await User.findById(id).populate({
			path: "shelves",
			populate: {
				path: "books.book_id",
				model: "Book",
			},
		});

		res.status(200).json({ shelvedBooks: user.shelves });
	} catch (error) {
		res
			.status(500)
			.json({ error: "An error occurred fetching users shelves and books" });
	}
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

module.exports = app;

const start = async () => {
	console.log("attempting to connect");
	try {
		await mongoose.connect(process.env.MONGODB_CONNECTION);
		app.listen(3030, () => console.log("Server started on port 3030"));
		console.log("mongo connected");
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

if (process.env.NODE_ENV !== "test") {
	start();
}
