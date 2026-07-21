import { useEffect, useState } from 'react'
import { transcribeVideo, translateText } from './api'
import './App.css'

const SOURCE_LANGUAGES = [
  { code: 'es', flores: 'spa_Latn', label: 'Español' },
  { code: 'en', flores: 'eng_Latn', label: 'Inglés' },
]

function App() {
  const [file, setFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [sourceLang, setSourceLang] = useState(SOURCE_LANGUAGES[0])
  const [status, setStatus] = useState('idle') // idle | transcribing | translating | done | error
  const [progress, setProgress] = useState('')
  const [subtitles, setSubtitles] = useState([])
  const [error, setError] = useState('')

  const isBusy = status === 'transcribing' || status === 'translating'

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

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
      const transcription = await transcribeVideo(file, sourceLang.code)

      setStatus('translating')
      const segments = transcription.segments
      const translated = []
      for (let i = 0; i < segments.length; i++) {
        setProgress(`Traduciendo al Kichwa… (${i + 1}/${segments.length})`)
        const segment = segments[i]
        const result = await translateText(segment.text, sourceLang.flores)
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
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 8 6 6" />
                <path d="m4 14 6-6 2-3" />
                <path d="M2 5h12" />
                <path d="M7 2h1" />
                <path d="m22 22-5-10-5 10" />
                <path d="M14 18h6" />
              </svg>
            </span>
            Longo-app
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

      <input
        id="video-input"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={isBusy}
        hidden
      />

      {!file ? (
        <div className="upload-card">
          <div className="lang-picker" role="radiogroup" aria-label="Idioma del video">
            <span className="lang-picker-label">Idioma del video</span>
            <div className="lang-picker-options">
              {SOURCE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  role="radio"
                  aria-checked={sourceLang.code === lang.code}
                  className={`lang-option${sourceLang.code === lang.code ? ' active' : ''}`}
                  onClick={() => setSourceLang(lang)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <label
            htmlFor="video-input"
            className={`dropzone${isDragging ? ' dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
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
            <span className="dropzone-title">Haz clic o arrastra para subir tu video</span>
            <span className="dropzone-hint">MP4, WAM, MOV, AVI, MKV</span>
            <span className="dropzone-cta">Subir archivo</span>
          </label>
        </div>
      ) : (
        <div className="workspace">
          <div className="video-panel">
            <div className="lang-picker" role="radiogroup" aria-label="Idioma del video">
              <span className="lang-picker-label">Idioma del video</span>
              <div className="lang-picker-options">
                {SOURCE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    role="radio"
                    aria-checked={sourceLang.code === lang.code}
                    className={`lang-option${sourceLang.code === lang.code ? ' active' : ''}`}
                    onClick={() => setSourceLang(lang)}
                    disabled={isBusy}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="video-frame">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              {videoUrl && <video src={videoUrl} controls />}
            </div>

            <div className="file-row">
              <span className="file-name" title={file.name}>{file.name}</span>
              <label htmlFor="video-input" className="change-file-link">
                Cambiar video
              </label>
            </div>

            <button
              type="button"
              className="translate-btn"
              onClick={handleTranslate}
              disabled={isBusy}
            >
              {isBusy ? 'Procesando…' : 'Traducir'}
            </button>

            {isBusy && progress && (
              <p className="progress-msg" role="status">
                <span className="spinner" aria-hidden="true" />
                {progress}
              </p>
            )}

            {error && <p className="error-msg">{error}</p>}
          </div>

          <section className="subtitles-panel">
            <div className="results-head">
              <h2>Subtítulos</h2>
              {subtitles.length > 0 && (
                <span className="source-lang">Idioma de origen: {sourceLang.label}</span>
              )}
            </div>

            {subtitles.length === 0 ? (
              <p className="empty-hint">
                {isBusy
                  ? 'Traduciendo… los subtítulos irán apareciendo aquí.'
                  : 'Presiona "Traducir" para ver aquí los subtítulos en Kichwa.'}
              </p>
            ) : (
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
            )}
          </section>
        </div>
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