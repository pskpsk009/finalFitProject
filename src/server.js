const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const SECRET_KEY = 'your_secret_key'; // Replace with a secure key

const corsOptions = {
  origin: 'http://localhost:3000', // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions)); // Apply the CORS middleware with the specified options
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src *; connect-src *;");
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Explicitly allow requests from the frontend
  next();
});

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Login endpoint to generate JWT token
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Generate JWT token with 1-hour expiration
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
});

// Middleware to validate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error("Access token is missing.");
    return res.status(401).json({ success: false, message: 'Access token is missing.' });
  }

  console.log("Received token:", token); // Debugging log

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("Token validation failed:", err.message);
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    console.log("Token validated successfully. User:", user); // Debugging log
    req.user = user;
    next();
  });
};

// Protect routes with the authenticateToken middleware
app.get('/user/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  console.log("Fetching user profile for username:", username);
  console.log("Authenticated user from token:", req.user);

  if (req.user.username !== username) {
    console.error("Username mismatch. Token username:", req.user.username, "Requested username:", username);
    return res.status(403).json({ success: false, message: 'Forbidden: Username mismatch.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.error("User not found in database:", username);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      data: {
        username: user.username,
        weight: user.weight,
        height: user.height,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
});

app.put('/user/:username', async (req, res) => {
  const { username } = req.params;
  const { weight, height } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        weight: parseFloat(weight), // Ensure weight is a Float
        height: parseFloat(height), // Ensure height is a Float
      },
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update user data.' });
  }
});

// Update the /logs/:username route to return structured data
app.get('/logs/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  console.log("Fetching logs for username:", username);
  console.log("Authenticated user from token:", req.user.username);

  if (req.user.username !== username) {
    return res.status(403).json({ success: false, message: 'Forbidden: Username mismatch.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const logs = await prisma.log.findMany({ where: { userId: user.id } });

    // Parse the value field to return structured data
    const structuredLogs = logs.map((log) => {
      const parsedLog = { ...log };
      if (log.type === "exercise") {
        const match = log.value.match(/Exercise: (.*), Duration: (\d+) mins, Calories Burnt: (\d+\.?\d*)/);
        if (match) {
          parsedLog.exercise = match[1];
          parsedLog.exerciseDuration = match[2];
          parsedLog.caloriesBurnt = match[3];
        }
      } else if (log.type === "meal") {
        const match = log.value.match(/Meal: (.*), Calories Intake: (\d+\.?\d*)/);
        if (match) {
          parsedLog.meal = match[1];
          parsedLog.caloriesIntake = match[2];
        }
      }
      return parsedLog;
    });

    res.json({ success: true, data: structuredLogs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs.' });
  }
});

// Add debugging logs to the GET /logs/:username/count endpoint
app.get('/logs/:username/count', authenticateToken, async (req, res) => {
  const { username } = req.params;
  console.log("Fetching log count for username:", username);
  console.log("Authenticated user from token:", req.user.username);

  if (req.user.username !== username) {
    return res.status(403).json({ success: false, message: 'Forbidden: Username mismatch.' });
  }

  try {
    const count = await prisma.log.count({ where: { user: { username } } });
    res.json({ success: true, count });
  } catch (error) {
    console.error("Error fetching log count:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch log count.' });
  }
});

// Update the POST /logs/:username endpoint to include the `value` field
app.post('/logs/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const logData = req.body;
  console.log("Received log data:", logData);
  console.log("Username from token:", req.user.username);
  console.log("Username from params:", username);

  if (req.user.username !== username) {
    return res.status(403).json({ success: false, message: 'Forbidden: Username mismatch.' });
  }

  try {
    // Fetch the user to get the userId
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Set the `value` field based on the log type
    let value = "";
    if (logData.type === "exercise") {
      value = `Exercise: ${logData.exercise}, Duration: ${logData.exerciseDuration} mins, Calories Burnt: ${logData.caloriesBurnt}`;
    } else if (logData.type === "meal") {
      value = `Meal: ${logData.meal}, Calories Intake: ${logData.caloriesIntake}`;
    }

    const newLog = await prisma.log.create({
      data: {
        userId: user.id, // Include the userId
        type: logData.type,
        value: value, // Set the value field
        timestamp: logData.timestamp,
      },
    });
    res.json({ success: true, data: newLog });
  } catch (error) {
    console.error("Error saving log to the database:", error);
    res.status(500).json({ success: false, message: 'Failed to save log.' });
  }
});

// Add /validate-token route to validate JWT tokens
app.get('/validate-token', authenticateToken, (req, res) => {
  try {
    // If the token is valid, the authenticateToken middleware will pass control here
    res.status(200).json({ success: true, message: 'Token is valid.' });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({ success: false, message: 'Failed to validate token.' });
  }
});

// Catch-all route for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Update Content Security Policy to allow all connections during development
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src *; connect-src *;");
  next();
});

const PORT = 5004;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});