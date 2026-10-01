import { ErrorAplicacion } from './error-aplicacion.js';
import {
  ROLES_TURNO,
  type CambiosTurno,
  type FiltrosTurnos,
  type NuevoTurno,
  type RolTurno,
  type Turno,
} from '../domain/turno.js';
import type { TurnosRepository } from '../domain/turnos-repository.js';

const CAMPOS_EDITABLES = [
  'zona_id',
  'dia_id',
  'hora_inicio',
  'hora_fin',
  'rol',
] as const;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esRolTurno(rol: string): rol is RolTurno {
  return ROLES_TURNO.some((rolPermitido) => rolPermitido === rol);
}

function minutos(hora: string): number {
  const [horas, mins] = hora.split(':').map(Number);
  return horas * 60 + mins;
}

function validarHora(hora: unknown, campo: string): asserts hora is string {
  if (typeof hora !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw new ErrorAplicacion(400, `${campo} debe tener formato HH:MM`);
  }
}

function validarHorario(inicio: string, fin: string): void {
  if (minutos(fin) <= minutos(inicio)) {
    throw new ErrorAplicacion(400, 'hora_fin debe ser posterior a hora_inicio');
  }
}

function validarEnteroPositivo(valor: unknown, campo: string): asserts valor is number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    throw new ErrorAplicacion(400, `${campo} debe ser un entero positivo`);
  }
}

function validarDatosNuevoTurno(datos: unknown): NuevoTurno {
  if (!esObjeto(datos)) {
    throw new ErrorAplicacion(400, 'El cuerpo debe ser un objeto JSON');
  }

  const { voluntario_id, zona_id, dia_id, hora_inicio, hora_fin, rol } = datos;
  validarEnteroPositivo(voluntario_id, 'voluntario_id');
  validarEnteroPositivo(zona_id, 'zona_id');
  validarEnteroPositivo(dia_id, 'dia_id');
  validarHora(hora_inicio, 'hora_inicio');
  validarHora(hora_fin, 'hora_fin');
  validarHorario(hora_inicio, hora_fin);

  if (typeof rol !== 'string' || !esRolTurno(rol)) {
    throw new ErrorAplicacion(400, 'El rol no es válido');
  }

  return { voluntario_id, zona_id, dia_id, hora_inicio, hora_fin, rol };
}

function validarCambios(cambios: unknown): Record<string, unknown> {
  if (!esObjeto(cambios)) {
    throw new ErrorAplicacion(400, 'El cuerpo debe ser un objeto JSON');
  }

  const camposEnviados = Object.keys(cambios);
  if (
    camposEnviados.length === 0 ||
    camposEnviados.some((campo) => !CAMPOS_EDITABLES.includes(campo as (typeof CAMPOS_EDITABLES)[number]))
  ) {
    throw new ErrorAplicacion(400, 'Envía campos editables válidos');
  }

  return cambios;
}

function validarHorarioContraTurnos(
  nuevosInicio: string,
  nuevosFin: string,
  turnos: Turno[],
): void {
  const inicio = minutos(nuevosInicio);
  const fin = minutos(nuevosFin);

  const seCruza = turnos.some(
    (turno) => inicio < minutos(turno.hora_fin) && fin > minutos(turno.hora_inicio),
  );
  if (seCruza) {
    throw new ErrorAplicacion(409, 'El turno se cruza con otro turno del voluntario');
  }

  const minutosExistentes = turnos.reduce(
    (total, turno) => total + minutos(turno.hora_fin) - minutos(turno.hora_inicio),
    0,
  );
  if (minutosExistentes + fin - inicio > 8 * 60) {
    throw new ErrorAplicacion(409, 'El voluntario no puede trabajar más de 8 horas al día');
  }
}

export function crearCasosDeUsoTurnos(repository: TurnosRepository) {
  async function obtenerTurno(id: number): Promise<Turno> {
    validarEnteroPositivo(id, 'El id');
    const turno = await repository.obtenerActivo(id);
    if (!turno) {
      throw new ErrorAplicacion(404, `No existe un turno activo con id ${id}`);
    }
    return turno;
  }

  async function validarReferencias(datos: Pick<NuevoTurno, 'voluntario_id' | 'zona_id' | 'dia_id'>) {
    if (!(await repository.existeVoluntario(datos.voluntario_id))) {
      throw new ErrorAplicacion(404, `No existe el voluntario ${datos.voluntario_id}`);
    }
    if (!(await repository.existeZona(datos.zona_id))) {
      throw new ErrorAplicacion(404, `No existe la zona ${datos.zona_id}`);
    }
    if (!(await repository.existeDia(datos.dia_id))) {
      throw new ErrorAplicacion(404, `No existe el día ${datos.dia_id}`);
    }
  }

  return {
    async listarTurnos(
      page = 1,
      limit = 10,
      filtros: FiltrosTurnos = {},
    ) {
      validarEnteroPositivo(page, 'page');
      validarEnteroPositivo(limit, 'limit');
      if (limit > 50) {
        throw new ErrorAplicacion(400, 'limit debe ser un entero entre 1 y 50');
      }

      for (const [campo, valor] of Object.entries(filtros)) {
        if (valor !== undefined) validarEnteroPositivo(valor, campo);
      }

      const { data, total } = await repository.listar(page, limit, filtros);
      return {
        pagination: {
          total,
          currentPage: page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        data,
      };
    },

    obtenerTurno,

    async obtenerHoras(voluntarioId: number, diaId: number) {
      validarEnteroPositivo(voluntarioId, 'voluntarioId');
      validarEnteroPositivo(diaId, 'dia_id');

      if (!(await repository.existeVoluntario(voluntarioId))) {
        throw new ErrorAplicacion(404, `El voluntario con id ${voluntarioId} no existe`);
      }
      if (!(await repository.existeDia(diaId))) {
        throw new ErrorAplicacion(404, `El día con id ${diaId} no existe`);
      }

      const turnos = await repository.listarActivosPorVoluntarioYDia(voluntarioId, diaId);
      const totalMinutos = turnos.reduce(
        (total, turno) => total + minutos(turno.hora_fin) - minutos(turno.hora_inicio),
        0,
      );

      return {
        voluntario_id: voluntarioId,
        dia_id: diaId,
        horas: Number((totalMinutos / 60).toFixed(2)),
      };
    },

    async crearTurno(datos: unknown) {
      const turno = validarDatosNuevoTurno(datos);
      await validarReferencias(turno);

      const turnosExistentes = await repository.listarActivosPorVoluntarioYDia(
        turno.voluntario_id,
        turno.dia_id,
      );
      validarHorarioContraTurnos(turno.hora_inicio, turno.hora_fin, turnosExistentes);

      return repository.crear(turno);
    },

    async actualizarTurno(id: number, cambios: unknown) {
      validarEnteroPositivo(id, 'El id');
      const body = validarCambios(cambios);
      const actual = await obtenerTurno(id);

      const combinado = {
        voluntario_id: actual.voluntario_id,
        zona_id: Object.hasOwn(body, 'zona_id') ? body.zona_id : actual.zona_id,
        dia_id: Object.hasOwn(body, 'dia_id') ? body.dia_id : actual.dia_id,
        hora_inicio: Object.hasOwn(body, 'hora_inicio') ? body.hora_inicio : actual.hora_inicio,
        hora_fin: Object.hasOwn(body, 'hora_fin') ? body.hora_fin : actual.hora_fin,
        rol: Object.hasOwn(body, 'rol') ? body.rol : actual.rol,
      };

      validarEnteroPositivo(combinado.zona_id, 'zona_id');
      validarEnteroPositivo(combinado.dia_id, 'dia_id');
      validarHora(combinado.hora_inicio, 'hora_inicio');
      validarHora(combinado.hora_fin, 'hora_fin');
      validarHorario(combinado.hora_inicio, combinado.hora_fin);
      if (
        typeof combinado.rol !== 'string' ||
        !esRolTurno(combinado.rol)
      ) {
        throw new ErrorAplicacion(400, 'El rol no es válido');
      }

      await validarReferencias({
        voluntario_id: combinado.voluntario_id,
        zona_id: combinado.zona_id,
        dia_id: combinado.dia_id,
      });

      const turnosExistentes = await repository.listarActivosPorVoluntarioYDia(
        actual.voluntario_id,
        combinado.dia_id,
      );
      const otrosTurnos = turnosExistentes.filter((turno) => turno.id !== id);
      validarHorarioContraTurnos(combinado.hora_inicio, combinado.hora_fin, otrosTurnos);

      const cambiosValidados: CambiosTurno = {
        zona_id: combinado.zona_id,
        dia_id: combinado.dia_id,
        hora_inicio: combinado.hora_inicio,
        hora_fin: combinado.hora_fin,
        rol: combinado.rol,
      };
      return repository.actualizar(id, cambiosValidados);
    },

    async eliminarTurno(id: number) {
      validarEnteroPositivo(id, 'El id');
      await obtenerTurno(id);
      return repository.eliminarLogicamente(id);
    },
  };
}

export type CasosDeUsoTurnos = ReturnType<typeof crearCasosDeUsoTurnos>;
