export const ROLES_TURNO = [
  'LOGISTICA',
  'PUNTO_INFO',
  'ASEO',
  'PRIMEROS_AUXILIOS',
] as const;

export type RolTurno = (typeof ROLES_TURNO)[number];

export interface Turno {
  id: number;
  voluntario_id: number;
  zona_id: number;
  dia_id: number;
  hora_inicio: string;
  hora_fin: string;
  rol: string;
  state: string;
  created_at: Date;
  updated_at: Date;
}

export type NuevoTurno = Pick<
  Turno,
  'voluntario_id' | 'zona_id' | 'dia_id' | 'hora_inicio' | 'hora_fin' | 'rol'
>;

export type CambiosTurno = Partial<
  Pick<Turno, 'zona_id' | 'dia_id' | 'hora_inicio' | 'hora_fin' | 'rol'>
>;

export interface FiltrosTurnos {
  voluntario_id?: number;
  dia_id?: number;
  zona_id?: number;
}

export interface TurnosPaginados {
  data: Turno[];
  total: number;
}
