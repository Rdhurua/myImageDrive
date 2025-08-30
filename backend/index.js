import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import {connectDB} from './config/db.js';
import cors from 'cors';
import authRoute from './routes/authRoute.js'
import folderRoute from './routes/folderRoute.js'
import imageRoute from './routes/imageRoute.js'

dotenv.config();

const app=express();
const PORT=process.env.PORT||4000;




app.use(express.json());
app.use(cookieParser())
app.use(morgan("dev"));
app.use(cors({
    origin:process.env.CLIENT_ORIGIN,
    Credential:true,
}));


app.use("/api/auth",authRoute);
app.use("/api/folders",folderRoute);
app.use("/api/images",imageRoute);



connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});