const request = require("supertest");
const app = require("../app");
const endpoints = require("../endpoints.json");
const mongoose = require("mongoose");

require("dotenv").config();

beforeEach(async () => {
	await mongoose.connect(process.env.MONGODB_CONNECTION);
});

afterAll((done) => {
	mongoose.connection.close();
	done();
});

describe("GET /api", () => {
	it("returns the correct json file containing the endpoint details", async () => {
		const response = await request(app).get("/api").expect(200);
		expect(response.body).toEqual(endpoints);
	});
});

describe("GET /api/users", () => {
	it("returns an array of users", async () => {
		const response = await request(app).get("/api/users").expect(200);
		expect(response.body).toHaveProperty("users");
		console.log(response.body);
		expect(response.body.users).toBeInstanceOf(Array);
	});
});
