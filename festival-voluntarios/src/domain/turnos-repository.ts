import type {
  CambiosTurno,
  FiltrosTurnos,
  NuevoTurno,
  Turno,
  TurnosPaginados,
} from './turno.js';

export interface TurnosRepository {
  listar(page: number, limit: number, filtros: FiltrosTurnos): Promise<TurnosPaginados>;
  obtenerActivo(id: number): Promise<Turno | null>;
  listarActivosPorVoluntarioYDia(voluntarioId: number, diaId: number): Promise<Turno[]>;
  existeVoluntario(id: number): Promise<boolean>;
  existeZona(id: number): Promise<boolean>;
  existeDia(id: number): Promise<boolean>;
  crear(datos: NuevoTurno): Promise<Turno>;
  actualizar(id: number, cambios: CambiosTurno): Promise<Turno>;
  eliminarLogicamente(id: number): Promise<Turno>;
}
