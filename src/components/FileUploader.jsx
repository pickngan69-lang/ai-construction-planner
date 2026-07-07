import { useCallback, useRef, useState } from 'react'
import { IMAGE_TAGS } from '../utils/constants'
import { cn } from '../utils/cn'
import {
  detectFileKind,
  readFileAsBase64,
  parseSpreadsheet,
  parseDocx,
  countPdfPages,
} from '../utils/fileParsing'

const ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  '.pdf',
  '.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx',
  '.xls',
  '.csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
].join(',')

const KIND_META = {
  pdf: { icon: '📄', label: 'PDF' },
  doc: { icon: '📝', label: 'Word' },
  sheet: { icon: '📊', label: 'ตาราง' },
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Short "content preview" badge — confirms the file was read successfully.
function metaBadge(f) {
  if (f.kind === 'pdf') {
    return f.meta?.pages > 0 ? `${f.meta.pages} หน้า` : '✓ อ่านสำเร็จ'
  }
  if (f.kind === 'sheet') {
    return `${f.meta?.sheets?.length || 0} ชีต · ${f.meta?.totalRows || 0} แถว`
  }
  if (f.kind === 'doc') {
    return f.meta?.chars
      ? `~${f.meta.chars.toLocaleString()} ตัวอักษร`
      : '✓ อ่านสำเร็จ'
  }
  return ''
}

// Bottom detail line: sheet names / text snippet / file size.
function metaDetail(f) {
  if (f.kind === 'sheet') return (f.meta?.sheets || []).map((s) => s.name).join(', ')
  if (f.kind === 'doc') return f.meta?.preview || ''
  return formatSize(f.size)
}

// Multi-file uploader — accepts images (JPG/PNG/WEBP), PDF, Word (DOCX),
// Excel, and CSV. Each file is preprocessed into the shape aiService needs:
//   image → { kind:'image', base64, mediaType, preview, tag }
//   pdf   → { kind:'pdf',   base64, mediaType:'application/pdf', meta:{pages} }
//   doc   → { kind:'doc',   textContent, meta:{chars,preview} }  (via mammoth)
//   sheet → { kind:'sheet', textContent, meta:{sheets,totalRows} }  (via xlsx)
function FileUploader({ files, setFiles, maxFiles = 7 }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const remaining = maxFiles - files.length

  const addFiles = useCallback(
    async (fileList) => {
      setError(null)
      const incoming = Array.from(fileList || [])
      if (incoming.length === 0) return

      const allowed = incoming.slice(0, remaining)
      if (incoming.length > remaining) {
        setError(`อัปโหลดได้สูงสุด ${maxFiles} ไฟล์`)
      }

      setBusy(true)
      const processed = []
      for (const file of allowed) {
        const kind = detectFileKind(file)
        const base = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          kind,
        }
        try {
          if (kind === 'image') {
            processed.push({
              ...base,
              preview: URL.createObjectURL(file),
              base64: await readFileAsBase64(file),
              mediaType: file.type,
              tag: IMAGE_TAGS[0],
            })
          } else if (kind === 'pdf') {
            processed.push({
              ...base,
              mediaType: 'application/pdf',
              base64: await readFileAsBase64(file),
              meta: { pages: await countPdfPages(file) },
            })
          } else if (kind === 'doc') {
            const { text, meta } = await parseDocx(file)
            processed.push({ ...base, textContent: text, meta })
          } else if (kind === 'sheet') {
            const { text, meta } = await parseSpreadsheet(file)
            processed.push({ ...base, textContent: text, meta })
          } else {
            setError('รองรับเฉพาะไฟล์ รูปภาพ, PDF, Word, Excel และ CSV')
          }
        } catch {
          setError(`อ่านไฟล์ "${file.name}" ไม่สำเร็จ`)
        }
      }
      if (processed.length) setFiles((prev) => [...prev, ...processed])
      setBusy(false)
    },
    [remaining, setFiles, maxFiles],
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const handleSelect = (e) => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      // Only uploaded images use object URLs; catalog reference images use a
      // plain remote URL that must not be revoked.
      if (target?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const updateTag = (id, tag) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, tag } : f)))
  }

  const canAddMore = remaining > 0

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (canAddMore) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={canAddMore ? handleDrop : (e) => e.preventDefault()}
        onClick={() => canAddMore && inputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed p-10 text-center transition-colors',
          canAddMore ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-line bg-surface/40 hover:border-ink-muted',
        )}
      >
        <p className="text-3xl mb-2">📎</p>
        <p className="text-ink font-medium">
          {canAddMore
            ? 'ลากวางไฟล์ที่นี่ หรือ คลิกเพื่อเลือก'
            : 'ครบจำนวนสูงสุดแล้ว'}
        </p>
        <p className="text-xs text-ink-muted mt-1">
          รองรับ 🖼️ รูปภาพ · 📄 PDF · 📝 Word · 📊 Excel/CSV — สูงสุด {maxFiles}{' '}
          ไฟล์ (เหลือ {remaining})
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={handleSelect}
        />
      </div>

      {busy && <p className="text-sm text-ink-muted">⏳ กำลังประมวลผลไฟล์...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {files.length > 0 && (
        <div>
          <p className="text-sm text-ink-soft mb-2">
            ไฟล์ที่อัปโหลด ({files.length}/{maxFiles}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {files.map((f) =>
              f.kind === 'image' ? (
                <div
                  key={f.id}
                  className="rounded-lg border border-line bg-surface overflow-hidden"
                >
                  <div className="relative aspect-square bg-canvas">
                    <img
                      src={f.preview}
                      alt={f.tag || f.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      aria-label="ลบไฟล์"
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-canvas/80 text-ink hover:bg-danger hover:text-canvas transition-colors flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                  <select
                    value={f.tag}
                    onChange={(e) => updateTag(f.id, e.target.value)}
                    className="w-full bg-elevated text-ink text-xs px-2 py-1.5 border-t border-line focus:outline-none focus:bg-canvas"
                  >
                    {IMAGE_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div
                  key={f.id}
                  className="rounded-lg border border-line bg-surface overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-square bg-canvas flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                    <span className="text-4xl">
                      {KIND_META[f.kind]?.icon || '📎'}
                    </span>
                    <span className="text-[11px] font-medium text-ink-soft">
                      {KIND_META[f.kind]?.label || 'ไฟล์'}
                    </span>
                    <span className="text-[10px] text-accent bg-accent/10 rounded-full px-2 py-0.5">
                      {metaBadge(f)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      aria-label="ลบไฟล์"
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-canvas/80 text-ink hover:bg-danger hover:text-canvas transition-colors flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                  <div className="px-2 py-1.5 border-t border-line">
                    <p className="text-xs text-ink truncate" title={f.name}>
                      {f.name}
                    </p>
                    <p
                      className="text-[10px] text-ink-muted truncate"
                      title={metaDetail(f)}
                    >
                      {metaDetail(f) || formatSize(f.size)}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader
