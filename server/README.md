# Digital Sphere Backend

Node.js + Express + MongoDB backend API for Digital Sphere application.

## Setup Instructions

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/raveendra-7/Digital_Sphere.git
   cd Digital_Sphere
   ```

2. **Switch to backend branch**:
   ```bash
   git checkout add-backend-mongodb
   ```

3. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

4. **Set up MongoDB**:
   - Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Get your connection string (replace username and password)

5. **Create .env file**:
   ```bash
   cp .env.example .env
   ```
   - Update `MONGODB_URI` with your MongoDB connection string
   - Set a secure `JWT_SECRET`

6. **Run the server**:
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Health Check
- `GET /api/health` - Check server status

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT tokens
- **nodemon** - Auto-restart on file changes (dev only)