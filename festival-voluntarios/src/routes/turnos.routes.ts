import { Router } from 'express';
import {
  obtenerHoras,
  listarTurnos,
} from '../usecases/turnos.usecase.js';

const router = Router();
router.get('/', async (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  const filtros = {
    voluntario_id:
      req.query.voluntario_id === undefined
        ? undefined
        : Number(req.query.voluntario_id),
    dia_id:
      req.query.dia_id === undefined
        ? undefined
        : Number(req.query.dia_id),
    zona_id:
      req.query.zona_id === undefined
        ? undefined
        : Number(req.query.zona_id),
  };

  try {
    const resultado = await listarTurnos(page, limit, filtros);
    res.json(resultado);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Error del servidor',
    });
  }
});
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