// Modulo auxiliar para conectarse con la Drivers App
export async function getDriverData() {
  const url = process.env.EXTERNAL_API_DRIVER;
  
  if (!url) throw new Error('URL de Driver App no configurada');

  const response = await fetch(`${url}/analytics`, {
        method: 'GET',
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_SECRET_KEY}`
        },
    }
  );

  if (!response.ok) {
    throw new Error(`Error en Driver App: ${response.statusText}`);
  }

  return response.json();
}