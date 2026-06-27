// Modulo auxiliar para conectarse con Paymets App
export async function getPaymentsData() {
  const url = process.env.EXTERNAL_API_PAYMENTS;
  
  if (!url) throw new Error('URL de Payments App no configurada');

  const response = await fetch(`${url}/analytics`, {
        method: 'GET',
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_SECRET_KEY}`
        },
    }
  );

  if (!response.ok) {
    throw new Error(`Error en Payments App: ${response.statusText}`);
  }

  return response.json();
}
