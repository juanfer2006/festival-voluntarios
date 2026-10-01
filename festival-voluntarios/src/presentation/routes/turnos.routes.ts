import { Router } from 'express';
import type { CasosDeUsoTurnos } from '../../application/turnos.usecase.js';
import { crearControladorTurnos } from '../controllers/turnos.controller.js';

export function crearRutasTurnos(casosDeUso: CasosDeUsoTurnos) {
  const router = Router();
  const controlador = crearControladorTurnos(casosDeUso);

  router.get('/voluntario/:voluntarioId/horas', controlador.horas);
  router.get('/', controlador.listar);
  router.get('/:id', controlador.obtener);
  router.post('/', controlador.crear);
  router.patch('/:id', controlador.actualizar);
  router.delete('/:id', controlador.eliminar);

  return router;
}
