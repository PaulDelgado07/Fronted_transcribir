import { useState } from 'react'
import { transcribeVideo, translateText } from './api'
import './App.css'

const LANG_LABEL = {
  eng_Latn: 'Inglés',
  spa_Latn: 'Español',
}

function App() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState('idle') // idle | transcribing | translating | done | error
  const [progress, setProgress] = useState('')
  const [sourceLang, setSourceLang] = useState('')
  const [subtitles, setSubtitles] = useState([])
  const [error, setError] = useState('')

  const isBusy = status === 'transcribing' || status === 'translating'

  function selectFile(nextFile) {
    if (!nextFile) return
    setFile(nextFile)
    setStatus('idle')
    setSubtitles([])
    setError('')
  }

  function handleFileChange(event) {
    selectFile(event.target.files[0] ?? null)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (isBusy) return
    selectFile(event.dataTransfer.files[0] ?? null)
  }

  async function handleTranslate() {
    if (!file) return
    setError('')
    setSubtitles([])

    try {
      setStatus('transcribing')
      setProgress('Transcribiendo video…')
      const transcription = await transcribeVideo(file)
      setSourceLang(transcription.nllb_src_lang)

      setStatus('translating')
      const segments = transcription.segments
      const translated = []
      for (let i = 0; i < segments.length; i++) {
        setProgress(`Traduciendo al Kichwa… (${i + 1}/${segments.length})`)
        const segment = segments[i]
        const result = await translateText(segment.text, transcription.nllb_src_lang)
        translated.push({
          start: segment.start,
          end: segment.end,
          original: segment.text,
          kichwa: result.translated_text,
        })
        setSubtitles([...translated])
      }

      setStatus('done')
      setProgress('')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <a href="/" className="brand">
            <span className="brand-mark" aria-hidden="true"></span>
            Kichwa
          </a>
          <nav className="site-nav" aria-label="Principal">
            <a href="https://kichwa-api-675484317999.us-central1.run.app/docs" target="_blank" rel="noreferrer">
              Probrar docs
            </a>
          </nav>
        </div>
      </header>

      <main id="translator">
        <div className="breadcrumb">
          <span>Kichwa</span>
          <span className="breadcrumb-sep">/</span>
          <strong>Traducir video</strong>
        </div>

        <div className="hero">
          <h1>Traductor de subtítulos al Kichwa</h1>
          <p className="hero-sub">
            Sube un video en español o inglés y obtén sus subtítulos en Kichwa.
          </p>
        </div>

      <div className="upload-card">
        <label
          htmlFor="video-input"
          className={`dropzone${isDragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            if (!isBusy) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <span className="dropzone-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          </span>

          {file ? (
            <>
              <span className="dropzone-filename">{file.name}</span>
              <span className="dropzone-hint">Haz clic para cambiar el archivo</span>
            </>
          ) : (
            <>
              <span className="dropzone-title">Haz clic o arrastra para subir tu video</span>
              <span className="dropzone-hint">MP4, MOV, MKV, WEBM</span>
            </>
          )}

          <span className="dropzone-cta">Subir archivo</span>

          <input
            id="video-input"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isBusy}
          />
        </label>

        <button
          type="button"
          className="translate-btn"
          onClick={handleTranslate}
          disabled={!file || isBusy}
        >
          {isBusy ? 'Procesando…' : 'Traducir'}
        </button>

        {isBusy && progress && (
          <p className="progress-msg" role="status">
            <span className="spinner" aria-hidden="true" />
            {progress}
          </p>
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}

      {subtitles.length > 0 && (
        <section className="results">
          <div className="results-head">
            <h2>Subtítulos</h2>
            {sourceLang && (
              <span className="source-lang">
                Idioma detectado: {LANG_LABEL[sourceLang] ?? sourceLang}
              </span>
            )}
          </div>

          <ul className="subtitle-list">
            {subtitles.map((subtitle, index) => (
              <li key={index} className="subtitle-item">
                <span className="timestamp">
                  {formatTime(subtitle.start)} – {formatTime(subtitle.end)}
                </span>
                <p className="original">{subtitle.original}</p>
                <p className="kichwa">{subtitle.kichwa}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      </main>

      <footer className="site-footer">
        <p>Traductor de subtítulos al Kichwa · impulsado por Whisper y NLLB</p>
      </footer>
    </>
  )
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default App