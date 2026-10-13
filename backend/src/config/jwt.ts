// Si JWT_SECRET no está seteado, el server NO debe arrancar — la alternativa (caer a un
// valor de respaldo hardcodeado en el código, committeado al repo) significa que cualquiera
// que lea el repo puede firmar un token de Admin válido. Mejor un crash ruidoso en el deploy
// que una degradación de seguridad silenciosa.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está configurado. El server no puede arrancar sin él — revisá las variables de entorno.');
}

export const JWT_SECRET = process.env.JWT_SECRET;
