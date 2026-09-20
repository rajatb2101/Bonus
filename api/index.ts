import express from 'express';
import cors from 'cors';
import { apiRouter } from '../src/server/api';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', apiRouter);

export default app;
