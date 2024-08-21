# Summary

This express app provides a web api for accessing the Infinite Library mongodb database. It includes all of the endpoints found in the 'endpoints.json' file.

Hosted with Vercel @: <https://infinite-library.vercel.app/api>

## Testing

Testing using Jest.
Testing makes use of a different environment variable so that the production database isn't effected as the database is dropped during testing. Ensure 'MONGODB_TEST_CONNECTION' has the corresponding uri set.

```bash

npm test
```

## Local Server

Start the local server using:

```bash
node app.js
```

There is a script set up using nodemon to automatically refresh the server during development:

```bash
npm run dev
```

## Hosting

Be sure to set the .env variables when hosting the backend. See the .env-example for the format.

Once the backend is hosted with Vercel, you can update using 'vercel --prod'.

To test the vercel build during development use 'vercel dev'.

## Env

### Generating JWT_Secret

You can generate your JWT secret using the features of node. Open a new terminal and use the command below:

```bash
require('crypto').randomBytes(32).toString('hex')
```

Copy the result into your .env file under JWT_SECRET.
