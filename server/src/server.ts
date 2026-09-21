import dotenv from 'dotenv'
dotenv.config({path: '/server/.env'})

import connectDB from './config/db.config.js';
import app from "./app.js"

connectDB();
const PORT = process.env.PORT || 8000;

app.listen(PORT , () => {
  console.log(`Server is Running at ${PORT}`)
})