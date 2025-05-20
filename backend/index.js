require("dotenv").config();
const express = require("express");
const https = require('https');
const path = require("path");
const mariadb = require("mariadb");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const errorHandler = require('./middleware/errors');
const ChatServer = require('./chat/chat');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const cors = require("cors");
const session = require('express-session');
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(session({
  secret: 'tu_clave_secreta_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
}));

app.use((req, res, next) => {
  res.locals.success = req.session.flash;
  delete req.session.flash;
  next();
});

app.use(cors({
  origin: ["http://nekokoneko.org"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
app.set('trust proxy', true);
app.disable('x-powered-by');


const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/nekokoneko.org/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/nekokoneko.org/fullchain.pem')
};

app.use((req, res, next) => {
  let user = null;
  const token = req.cookies.token;
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Error al verificar el token:", err);
      user = null;
      if (err.name === 'TokenExpiredError') {
        console.warn("Token expirado, redirigiendo o pidiendo nuevo login");
        res.clearCookie('token');
      }
    }
  }
  res.locals.user = user;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "static", "views"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const pool = mariadb.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PSWD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  connectTimeout: 3000,
  acquireTimeout: 3000,
});

const MONGODB_URI = process.env.MONGODB_URI;

app.use("/backend/",       require("./routes/auth")(pool));
app.use("/backend/users",  require("./routes/users")(pool));
app.use("/backend/teams",  require("./routes/teams")(pool));
app.use("/backend/games",  require("./routes/games")(pool));
app.use("/backend/tournaments",  require("./routes/tournaments")(pool));

app.use("/backend/api/auth",       require("./routes/api/auth")(pool));
app.use("/backend/api/users",      require("./routes/api/users")(pool));
app.use("/backend/api/files",      require("./routes/api/files")(pool));
app.use('/backend/api/games',      require('./routes/api/games')(pool));
app.use("/backend/api/tournaments",  require("./routes/api/tournaments")(pool));
app.use('/backend/api/statistics', require('./routes/api/statistics')(pool));

const { router: geocodeRouter } = require('./routes/api/geocode');
app.use('/backend/api/geocode', geocodeRouter);


app.get("/backend", (req, res) => {
  res.render("home", { user: res.locals.user });
});

app.use(errorHandler);

async function startServer() {
  let websocket;
  try {
    websocket = new ChatServer({ host: '127.0.0.1', port: 9135 });
    console.log("🟢 Websocket server started on ws://localhost:9135");
  } catch (err) {
    console.error("❌ Error starting WebSocket:", err);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a MongoDB");
  } catch (err) {
    console.error("❌ Error conectando a MongoDB:", err);
    process.exit(1);
  }

  let conn;
  try {
    conn = await pool.getConnection();
    console.log("✅ Conectado a MariaDB");

    app.use("/backend/api/teams", require("./routes/api/teams")(pool, websocket));
    app.use("/backend/api/chats", require("./routes/api/chats")(pool, websocket));
    app.use("/backend/api/profile", require("./routes/api/profile")(pool, websocket));
    app.use('/backend/api/notifications', require('./routes/api/notifications')(pool, websocket));
    

    const PORT = process.env.PORT;
    // app.listen(PORT, () => {
    //   console.log(`🌐 Servidor escuchando en http://localhost:${PORT}`);
    // });
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Backend listening on https://nekokoneko.org/backend`);
    });

  } catch (err) {
    console.error("❌ Error conectando a MariaDB:", err);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
}

startServer();
