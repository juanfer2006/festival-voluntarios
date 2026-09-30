import { Router } from 'express';
import { obtenerHoras } from '../usecases/turnos.usecase.js';

const router = Router();

router.get('/voluntario/:voluntarioId/horas', async (req, res) => {
  const voluntarioId = Number(req.params.voluntarioId);
  const diaId = Number(req.query.dia_id);

  if (!voluntarioId || voluntarioId <= 0) {
    return res.status(400).json({ error: 'voluntarioId debe ser un entero positivo' });
  }
  if (!req.query.dia_id) {
    return res.status(400).json({ error: 'dia_id es obligatorio' });
  }
  if (!diaId || diaId <= 0) {
    return res.status(400).json({ error: 'dia_id debe ser un entero positivo' });
  }

  try {
    const data = await obtenerHoras(voluntarioId, diaId);
    res.json({ data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
});

export default router;