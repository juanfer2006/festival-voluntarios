import type { Request, Response } from 'express';
import { ErrorAplicacion } from '../../application/error-aplicacion.js';
import type { CasosDeUsoTurnos } from '../../application/turnos.usecase.js';

function manejarError(error: unknown, res: Response): void {
  if (error instanceof ErrorAplicacion) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
}

export function crearControladorTurnos(casosDeUso: CasosDeUsoTurnos) {
  return {
    listar: async (req: Request, res: Response) => {
      const page = req.query.page === undefined ? 1 : Number(req.query.page);
      const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
      const filtros = {
        voluntario_id:
          req.query.voluntario_id === undefined ? undefined : Number(req.query.voluntario_id),
        dia_id: req.query.dia_id === undefined ? undefined : Number(req.query.dia_id),
        zona_id: req.query.zona_id === undefined ? undefined : Number(req.query.zona_id),
      };

      try {
        res.json(await casosDeUso.listarTurnos(page, limit, filtros));
      } catch (error) {
        manejarError(error, res);
      }
    },

    obtener: async (req: Request, res: Response) => {
      try {
        res.json({ data: await casosDeUso.obtenerTurno(Number(req.params.id)) });
      } catch (error) {
        manejarError(error, res);
      }
    },

    crear: async (req: Request, res: Response) => {
      try {
        res.status(201).json({ data: await casosDeUso.crearTurno(req.body) });
      } catch (error) {
        manejarError(error, res);
      }
    },

    actualizar: async (req: Request, res: Response) => {
      try {
        res.json({
          data: await casosDeUso.actualizarTurno(Number(req.params.id), req.body),
        });
      } catch (error) {
        manejarError(error, res);
      }
    },

    eliminar: async (req: Request, res: Response) => {
      try {
        await casosDeUso.eliminarTurno(Number(req.params.id));
        res.status(200).json({ message: 'Turno eliminado' });
      } catch (error) {
        manejarError(error, res);
      }
    },

    horas: async (req: Request, res: Response) => {
      if (req.query.dia_id === undefined) {
        res.status(400).json({ error: 'dia_id es obligatorio' });
        return;
      }

      try {
        const data = await casosDeUso.obtenerHoras(
          Number(req.params.voluntarioId),
          Number(req.query.dia_id),
        );
        res.json({ data });
      } catch (error) {
        manejarError(error, res);
      }
    },
  };
}
