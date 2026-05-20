import app from './app';
import { initDB } from './config/db';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Inicializa las tablas relacionales avanzadas
  await initDB();

  // 🚀 El '0.0.0.0' es OBLIGATORIO en Render para que no se caiga
  app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`🚀 Servidor modular B2B de SUL corriendo en puerto ${PORT}`);
  });
};

startServer();