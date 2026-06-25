// Modulo auxiliar para conectarse con Feedback App
export async function getFeedbackData() {
  const url = process.env.EXTERNAL_API_FEEDBACK;
  
  if (!url) throw new Error('URL de Feedback App no configurada');

  const response = await fetch(`${url}/analytics`, {
        method: 'GET',
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_SECRET_KEY}`
        },
    }
  );

  if (!response.ok) {
    throw new Error(`Error en Feedback App: ${response.statusText}`);
  }

  return response.json();
}