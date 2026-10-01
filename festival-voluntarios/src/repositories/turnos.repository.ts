import { prisma } from '../prisma.js';

export async function getTurnosByVoluntarioYDia(voluntarioId: number, diaId: number) {
  return prisma.turnos.findMany({
    where: { voluntario_id: voluntarioId, dia_id: diaId, state: { not: 'REMOVED' } }
  });
}

export async function existeVoluntario(voluntarioId: number) {
  const vol = await prisma.voluntarios.findUnique({ where: { id: voluntarioId } });
  return vol !== null;
}

export async function existeDia(diaId: number) {
  const dia = await prisma.dias.findUnique({ where: { id: diaId } });
  return dia !== null;
}

export async function listarTurnosRepo(
  page: number,
  limit: number,
  filtros: {
    voluntario_id?: number;
    dia_id?: number;
    zona_id?: number;
  }
) {
  const where = {
    state: { not: 'REMOVED' },
    voluntario_id: filtros.voluntario_id,
    dia_id: filtros.dia_id,
    zona_id: filtros.zona_id,
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
export async function obtenerTurnoPorIdRepo(id: number) {
  return prisma.turnos.findFirst({
    where: {
      id,
      state: { not: 'REMOVED' },
    },
  });
}
export async function crearTurnoRepo(datos: {
  voluntario_id: number;
  zona_id: number;
  dia_id: number;
  hora_inicio: string;
  hora_fin: string;
  rol: string;
}) {
  return prisma.turnos.create({
    data: {
      voluntario_id: datos.voluntario_id,
      zona_id: datos.zona_id,
      dia_id: datos.dia_id,
      hora_inicio: datos.hora_inicio,
      hora_fin: datos.hora_fin,
      rol: datos.rol,
    },
  });
}
export async function existeZona(zonaId: number) {
  const zona = await prisma.zonas.findUnique({ where: { id: zonaId } });
  return zona !== null;
}