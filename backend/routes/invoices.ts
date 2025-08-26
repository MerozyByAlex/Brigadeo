import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';
import { requireOrgAccess } from '../middleware/requireOrgAccess';

const router = Router();

router.get(
  '/:id',
  requireOrgAccess('invoice'),
  async (req, res, next) => {
    try {
      const { data, error } = await supabase
        .from('invoice')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) return next(error);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;