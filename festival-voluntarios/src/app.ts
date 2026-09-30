import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import turnosRoutes from './routes/turnos.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/turnos', turnosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});