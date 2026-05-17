import app from './app';
import { initDB } from './config/db';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Inicializa las tablas relacionales avanzadas
  await initDB();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor modular B2B de SUL corriendo en puerto ${PORT}`);
  });
};

startServer();