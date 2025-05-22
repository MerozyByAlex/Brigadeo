import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import analyzeInvoiceRouter from './routes/analyzeInvoice';
import webhookRouter from './routes/webhook';

dotenv.config();

const app = express();
const server = createServer(app);
const startPort = process.env.PORT ? parseInt(process.env.PORT) : 3002;

app.use(cors());
app.use(express.json());

app.get('/ping', (_req: Request, res: Response) => {
  res.json({ message: 'pong' });
});

app.use('/analyze-invoice', analyzeInvoiceRouter);
app.use('/webhook', webhookRouter);

// Fonction pour trouver un port disponible
const findAvailablePort = (startingPort: number): Promise<number> => {
  return new Promise((resolve) => {
    const tryPort = (port: number) => {
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1);
        }
      });

      server.once('listening', () => {
        server.close(() => resolve(port));
      });

      server.listen(port);
    };

    tryPort(startingPort);
  });
};

// Démarrage du serveur avec recherche de port disponible
findAvailablePort(startPort).then((port) => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});