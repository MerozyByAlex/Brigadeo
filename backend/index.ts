import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // ✅ Import cors
import analyzeInvoiceRouter from './routes/analyzeInvoice';
import webhookRouter from './routes/webhook';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors()); // ✅ Active CORS pour tous les domaines (optionnellement configurable)
app.use(express.json());

app.get('/ping', (_req: Request, res: Response) => {
  res.json({ message: 'pong' });
});

app.use('/analyze-invoice', analyzeInvoiceRouter);
app.use('/webhook', webhookRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
