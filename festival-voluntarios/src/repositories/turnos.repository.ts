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