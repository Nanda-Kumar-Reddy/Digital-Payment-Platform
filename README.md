Setup Instructions:

1. Clone Repository

git clone https://github.com/<your-username>/digital-payment-platform.git
cd digital-payment-platform

2. Install Dependencies

Make sure you have Node.js (>=16) and npm (>=8) installed.
npm install

3. Configure Environment Variables

Create a .env file in the project root with the following variables:

PORT=8000
JWT_SECRET=your_jwt_secret_key
DB_FILE=./database.sqlite

PORT : Port where the backend will run (default: 8000).
JWT_SECRET : Secret key for signing JWT tokens.
DB_FILE : SQLite database file location.

4. Setup Database

Run the migration script to initialize tables:
npm run migrate

(Optional) Load seed data for testing:
npm run seed

5. Start the Server

For development:
npm run dev

For production:
npm start

The API will now be available at:

http://localhost:8000/api

6. API Testing

Import the provided Postman collection (postman_collection.json) into Postman.

Use sample requests to test endpoints like /auth/register, /wallet/credit, /upi/pay, etc.
