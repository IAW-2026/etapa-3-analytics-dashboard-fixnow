// Modulo auxiliar para conectarse con Rider App
export async function getRiderData() {
  const url = process.env.EXTERNAL_API_RIDER;
  
  if (!url) throw new Error('URL de Rider App no configurada');

  // Dependiendo de la API, podrías necesitar pasar la fecha como query param
  const response = await fetch(`${url}/analytics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ANALYTICS_SECRET_KEY}` // Si requiere auth
    },
  });

  if (!response.ok) {
    throw new Error(`Error en Rider App: ${response.statusText}`);
  }

  return response.json();
}