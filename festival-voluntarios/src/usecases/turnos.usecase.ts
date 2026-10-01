import {
  getTurnosByVoluntarioYDia,
  existeVoluntario,
  existeDia,
  existeZona,
  listarTurnosRepo,
  obtenerTurnoPorIdRepo,
  crearTurnoRepo,
} from '../repositories/turnos.repository.js';

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

export async function listarTurnos(
  page: number = 1,
  limit: number = 10,
  filtros: {
    voluntario_id?: number;
    dia_id?: number;
    zona_id?: number;
  } = {}
) {
  if (!Number.isInteger(page) || page < 1) {
    throw { status: 400, message: 'page debe ser un entero positivo' };
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw { status: 400, message: 'limit debe ser un entero entre 1 y 50' };
  }

  const filtroInvalido = Object.values(filtros).some(
    (valor) => valor !== undefined && (!Number.isInteger(valor) || valor < 1)
  );

  if (filtroInvalido) {
    throw { status: 400, message: 'Los filtros deben ser enteros positivos' };
  }

  const { data, total } = await listarTurnosRepo(page, limit, filtros);

  return {
    pagination: {
      total,
      currentPage: page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
}
export async function obtenerTurno(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw { status: 400, message: 'El id debe ser un entero positivo' };
  }

  const turno = await obtenerTurnoPorIdRepo(id);

  if (!turno) {
    throw { status: 404, message: `No existe un turno activo con id ${id}` };
  }

  return turno;
}
export async function crearTurno(datos: unknown) {
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    throw { status: 400, message: 'El cuerpo debe ser un objeto JSON' };
  }

  const body = datos as Record<string, unknown>;
  const voluntario_id = body.voluntario_id;
  const zona_id = body.zona_id;
  const dia_id = body.dia_id;
  const hora_inicio = body.hora_inicio;
  const hora_fin = body.hora_fin;
  const rol = body.rol;

  if (
    typeof voluntario_id !== 'number' || !Number.isInteger(voluntario_id) || voluntario_id <= 0 ||
    typeof zona_id !== 'number' || !Number.isInteger(zona_id) || zona_id <= 0 ||
    typeof dia_id !== 'number' || !Number.isInteger(dia_id) || dia_id <= 0 ||
    typeof hora_inicio !== 'string' ||
    typeof hora_fin !== 'string' ||
    typeof rol !== 'string'
  ) {
    throw { status: 400, message: 'Faltan campos o tienen tipos inválidos' };
  }

  const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!formatoHora.test(hora_inicio) || !formatoHora.test(hora_fin)) {
    throw { status: 400, message: 'Las horas deben tener formato HH:MM' };
  }

  const minutos = (hora: string) => {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  };

  const inicio = minutos(hora_inicio);
  const fin = minutos(hora_fin);

  if (fin <= inicio) {
    throw { status: 400, message: 'hora_fin debe ser posterior a hora_inicio' };
  }

  const rolesPermitidos = [
    'LOGISTICA',
    'PUNTO_INFO',
    'ASEO',
    'PRIMEROS_AUXILIOS',
  ];

  if (!rolesPermitidos.includes(rol)) {
    throw { status: 400, message: 'El rol no es válido' };
  }

  if (!(await existeVoluntario(voluntario_id))) {
    throw { status: 404, message: `No existe el voluntario ${voluntario_id}` };
  }
  if (!(await existeZona(zona_id))) {
    throw { status: 404, message: `No existe la zona ${zona_id}` };
  }
  if (!(await existeDia(dia_id))) {
    throw { status: 404, message: `No existe el día ${dia_id}` };
  }

  const turnos = await getTurnosByVoluntarioYDia(voluntario_id, dia_id);

  const seCruza = turnos.some((turno) => {
    const inicioExistente = minutos(turno.hora_inicio);
    const finExistente = minutos(turno.hora_fin);
    return inicio < finExistente && fin > inicioExistente;
  });

  if (seCruza) {
    throw { status: 409, message: 'El turno se cruza con otro turno del voluntario' };
  }

  const minutosExistentes = turnos.reduce(
    (total, turno) => total + minutos(turno.hora_fin) - minutos(turno.hora_inicio),
    0
  );

  if (minutosExistentes + (fin - inicio) > 8 * 60) {
    throw { status: 409, message: 'El voluntario no puede trabajar más de 8 horas al día' };
    }
  return crearTurnoRepo({
    voluntario_id,
    zona_id,
    dia_id,
    hora_inicio,
    hora_fin,
    rol,
  });
}
export async function actualizarTurno(id: number, cambios: unknown) {
  if (!Number.isInteger(id) || id <= 0) {
    throw { status: 400, message: 'El id debe ser un entero positivo' };
  }

  if (
    typeof cambios !== 'object' ||
    cambios === null ||
    Array.isArray(cambios)
  ) {
    throw { status: 400, message: 'El cuerpo debe ser un objeto JSON' };
  }

  const body = cambios as Record<string, unknown>;
  const camposPermitidos = [
    'zona_id',
    'dia_id',
    'hora_inicio',
    'hora_fin',
    'rol',
  ];
  const enviados = Object.keys(body);

  if (
    enviados.length === 0 ||
    enviados.some((campo) => !camposPermitidos.includes(campo))
  ) {
    throw { status: 400, message: 'Envía campos editables válidos' };
  }

  const actual = await obtenerTurno(id);

  const zona_id = body.zona_id ?? actual.zona_id;
  const dia_id = body.dia_id ?? actual.dia_id;
  const hora_inicio = body.hora_inicio ?? actual.hora_inicio;
  const hora_fin = body.hora_fin ?? actual.hora_fin;
  const rol = body.rol ?? actual.rol;

  if (
    typeof zona_id !== 'number' || !Number.isInteger(zona_id) || zona_id <= 0 ||
    typeof dia_id !== 'number' || !Number.isInteger(dia_id) || dia_id <= 0 ||
    typeof hora_inicio !== 'string' ||
    typeof hora_fin !== 'string' ||
    typeof rol !== 'string'
  ) {
    throw { status: 400, message: 'Los campos enviados tienen tipos inválidos' };
  }

  const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!formatoHora.test(hora_inicio) || !formatoHora.test(hora_fin)) {
    throw { status: 400, message: 'Las horas deben tener formato HH:MM' };
  }

  const minutos = (hora: string) => {
    const [horas, mins] = hora.split(':').map(Number);
    return horas * 60 + mins;
  };

  const inicio = minutos(hora_inicio);
  const fin = minutos(hora_fin);

  if (fin <= inicio) {
    throw { status: 400, message: 'hora_fin debe ser posterior a hora_inicio' };
  }

  const rolesPermitidos = [
    'LOGISTICA',
    'PUNTO_INFO',
    'ASEO',
    'PRIMEROS_AUXILIOS',
  ];

  if (!rolesPermitidos.includes(rol)) {
    throw { status: 400, message: 'El rol no es válido' };
  }

  if (!(await existeZona(zona_id))) {
    throw { status: 404, message: `No existe la zona ${zona_id}` };
  }
  if (!(await existeDia(dia_id))) {
    throw { status: 404, message: `No existe el día ${dia_id}` };
  }

  const turnos = await getTurnosByVoluntarioYDia(
    actual.voluntario_id,
    dia_id
  );
  const otrosTurnos = turnos.filter((turno) => turno.id !== id);

  const seCruza = otrosTurnos.some((turno) => {
    const inicioExistente = minutos(turno.hora_inicio);
    const finExistente = minutos(turno.hora_fin);
    return inicio < finExistente && fin > inicioExistente;
  });

  if (seCruza) {
    throw { status: 409, message: 'El turno se cruza con otro turno del voluntario' };
  }

  const minutosExistentes = otrosTurnos.reduce(
    (total, turno) => total + minutos(turno.hora_fin) - minutos(turno.hora_inicio),
    0
  );

  if (minutosExistentes + (fin - inicio) > 8 * 60) {
    throw { status: 409, message: 'El voluntario no puede trabajar más de 8 horas al día' };
  }
}
//cambio cambio2