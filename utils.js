const superagent = require("superagent");

exports.ISBNConverter = async (ISBN) => {
	try {
		const res = await superagent.get(
			`https://openlibrary.org/isbn/${ISBN}.json`
		);
		return res;
	} catch (err) {
		console.error(err);
	}
};
//https://covers.openlibrary.org/b/id/{cover_id}-{size}.jpg
