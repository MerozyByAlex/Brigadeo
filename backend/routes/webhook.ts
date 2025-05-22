import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    // Pour l'instant, on renvoie juste une confirmation
    res.json({ message: "webhook reçu" });
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;