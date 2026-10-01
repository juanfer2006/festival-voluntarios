import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { crearCasosDeUsoTurnos } from './application/turnos.usecase.js';
import { PrismaTurnosRepository } from './infrastructure/repositories/prisma-turnos.repository.js';
import { prisma } from './infrastructure/database/prisma.js';
import { crearRutasTurnos } from './presentation/routes/turnos.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const turnosRepository = new PrismaTurnosRepository();
const casosDeUsoTurnos = crearCasosDeUsoTurnos(turnosRepository);

app.use(cors());
app.use(express.json());

app.use('/api/turnos', crearRutasTurnos(casosDeUsoTurnos));

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

function cerrarServidor() {
  server.close(async (error) => {
    if (error) {
      console.error('Error al cerrar el servidor HTTP:', error);
      process.exitCode = 1;
    }
    await prisma.$disconnect();
  });
}

process.on('SIGINT', cerrarServidor);
process.on('SIGTERM', cerrarServidor);