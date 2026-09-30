import { getTurnosByVoluntarioYDia, existeVoluntario, existeDia } from '../repositories/turnos.repository.js';

export async function obtenerHoras(voluntarioId: number, diaId: number) {
  if (!await existeVoluntario(voluntarioId)) {
    throw { status: 404, message: `El voluntario con id ${voluntarioId} no existe` };
  }
  if (!await existeDia(diaId)) {
    throw { status: 404, message: `El día con id ${diaId} no existe` };
  }

  const turnos = await getTurnosByVoluntarioYDia(voluntarioId, diaId);

  let totalHoras = 0;
  for (const t of turnos) {
    const [h1, m1] = t.hora_inicio.split(':').map(Number);
    const [h2, m2] = t.hora_fin.split(':').map(Number);
    totalHoras += ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
  }

  return { voluntario_id: voluntarioId, dia_id: diaId, horas: Number(totalHoras.toFixed(2)) };
}