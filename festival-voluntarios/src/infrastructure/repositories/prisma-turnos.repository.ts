import type { TurnosRepository } from '../../domain/turnos-repository.js';
import type { CambiosTurno, FiltrosTurnos, NuevoTurno } from '../../domain/turno.js';
import { prisma } from '../database/prisma.js';

export class PrismaTurnosRepository implements TurnosRepository {
  async listar(page: number, limit: number, filtros: FiltrosTurnos) {
    const where = {
      state: { not: 'REMOVED' },
      ...(filtros.voluntario_id === undefined
        ? {}
        : { voluntario_id: filtros.voluntario_id }),
      ...(filtros.dia_id === undefined ? {} : { dia_id: filtros.dia_id }),
      ...(filtros.zona_id === undefined ? {} : { zona_id: filtros.zona_id }),
    };

    const [data, total] = await Promise.all([
      prisma.turnos.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.turnos.count({ where }),
    ]);
    return { data, total };
  }

  obtenerActivo(id: number) {
    return prisma.turnos.findFirst({
      where: { id, state: { not: 'REMOVED' } },
    });
  }

  listarActivosPorVoluntarioYDia(voluntarioId: number, diaId: number) {
    return prisma.turnos.findMany({
      where: {
        voluntario_id: voluntarioId,
        dia_id: diaId,
        state: { not: 'REMOVED' },
      },
    });
  }

  async existeVoluntario(id: number) {
    return (await prisma.voluntarios.findUnique({ where: { id } })) !== null;
  }

  async existeZona(id: number) {
    return (await prisma.zonas.findUnique({ where: { id } })) !== null;
  }

  async existeDia(id: number) {
    return (await prisma.dias.findUnique({ where: { id } })) !== null;
  }

  crear(datos: NuevoTurno) {
    return prisma.turnos.create({ data: datos });
  }

  actualizar(id: number, cambios: CambiosTurno) {
    return prisma.turnos.update({ where: { id }, data: cambios });
  }

  eliminarLogicamente(id: number) {
    return prisma.turnos.update({
      where: { id },
      data: { state: 'REMOVED' },
    });
  }
}
