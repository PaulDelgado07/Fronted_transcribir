const API_URL = import.meta.env.VITE_API_URL

// Cloud Run rechaza cualquier request mayor a 32 MB antes de llegar a la
// API (sin cabeceras CORS, por lo que el navegador solo reporta un fallo
// de red genérico). Dejamos margen para el overhead del multipart.
export const MAX_UPLOAD_BYTES = 31 * 1024 * 1024

async function unwrap(response) {
  let body
  try {
    body = await response.json()
  } catch {
    throw new Error(
      response.status === 413
        ? 'El video es demasiado grande para el servidor (máximo ~31 MB). Prueba con un video más corto o comprímelo.'
        : `El servidor respondió con un error (${response.status}).`,
    )
  }
  if (!response.ok || body.status !== 'success') {
    throw new Error(body.msg || 'Error en la petición')
  }
  return body.data
}

export async function transcribeVideo(file) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `El video pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB y el servidor solo acepta hasta 31 MB. Prueba con un video más corto o comprímelo.`,
    )
  }

  const form = new FormData()
  form.append('video', file)

  let response
  try {
    response = await fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      body: form,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }
  return unwrap(response)
}

export async function translateText(text, srcLang) {
  const response = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, src_lang: srcLang }),
  })
  return unwrap(response)
}
