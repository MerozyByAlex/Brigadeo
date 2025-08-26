import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export function requireOrgAccess(table: string, idField = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Vérifier la présence de l'utilisateur
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 2. Charger l'organisation de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single();

      if (profileError) return next(profileError);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 3. Extraire l'identifiant de la ressource cible
      const targetId = req.params.id ?? req.body[idField];
      if (!targetId) {
        return res.status(400).json({ error: 'Missing resource id' });
      }

      // 4. Vérifier que la ressource existe et récupérer son organization_id
      const { data: record, error: recordError } = await supabase
        .from(table)
        .select('organization_id')
        .eq(idField, targetId)
        .single();

      // Ressource non trouvée
      if (recordError && recordError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Not Found' });
      }
      if (recordError) return next(recordError);
      if (!record) {
        return res.status(404).json({ error: 'Not Found' });
      }

      // 5. Comparer les organisations
      if (record.organization_id !== profile.organization_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // 6. Accès autorisé
      next();
    } catch (err) {
      next(err);
    }
  };
}