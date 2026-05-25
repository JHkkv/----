import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import { CONFIG } from './config';
import { initDb } from './db/schema';
import { resumeRouter } from './routes/resume';
import { jobsRouter } from './routes/jobs';
import { applicationsRouter } from './routes/applications';
import { handleWsConnection } from './routes/ws';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/resume', resumeRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', handleWsConnection);

initDb();

server.listen(CONFIG.PORT, () => {
  console.log(`[auto-resume] Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`[auto-resume] WebSocket ready`);
});
