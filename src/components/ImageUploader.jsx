import { useCallback, useRef, useState } from 'react'
import { IMAGE_TAGS } from '../utils/constants'
import { cn } from '../utils/cn'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('FileReader did not return a string'))
        return
      }
      const comma = result.indexOf(',')
      const base64 = comma >= 0 ? result.slice(comma + 1) : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error || new Error('FileReader error'))
    reader.readAsDataURL(file)
  })
}

// เพิ่ม maxFiles = 7 เป็นค่าเริ่มต้นครับ
function ImageUploader({ images, setImages, maxFiles = 7 }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  // เปลี่ยนมาใช้ค่าจาก maxFiles แทน MAX_IMAGES
  const remaining = maxFiles - images.length

  const addFiles = useCallback(
    async (fileList) => {
      setError(null)
      const files = Array.from(fileList || []).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (files.length === 0) return

      const allowed = files.slice(0, remaining)
      if (files.length > remaining) {
        // แจ้งเตือนตามจำนวนสูงสุดจริง
        setError(`อัปโหลดได้สูงสุด ${maxFiles} รูป`)
      }

      const processed = await Promise.all(
        allowed.map(async (file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: URL.createObjectURL(file),
          base64: await fileToBase64(file),
          mediaType: file.type,
          tag: IMAGE_TAGS[0],
        })),
      )

      setImages((prev) => [...prev, ...processed])
    },
    [remaining, setImages, maxFiles], // เพิ่ม maxFiles ใน dependency
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

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id)
      // Only uploaded files use object URLs; catalog reference images use a
      // plain remote URL that must not be revoked.
      if (target?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const updateTag = (id, tag) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, tag } : img)),
    )
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
        <p className="text-3xl mb-2">📐</p>
        <p className="text-ink font-medium">
          {canAddMore ? 'ลากวางรูปที่นี่ หรือ คลิกเพื่อเลือก' : 'ครบจำนวนสูงสุดแล้ว'}
        </p>
        <p className="text-xs text-ink-muted mt-1">
          {/* อัปเดตตัวเลขตรงนี้ให้เป็นไปตามค่าที่ส่งมา */}
          รองรับ PNG, JPG, WEBP (สูงสุด {maxFiles} รูป — เหลือ {remaining})
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={handleSelect}
        />
      </div>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      {images.length > 0 && (
        <div>
          <p className="text-sm text-ink-soft mb-2">
            {/* อัปเดตตัวเลขส่วนสรุปด้านล่างด้วยครับ */}
            รูปที่อัปโหลด ({images.length}/{maxFiles}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="rounded-lg border border-line bg-surface overflow-hidden"
              >
                <div className="relative aspect-square bg-canvas">
                  <img
                    src={img.preview}
                    alt={img.tag}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    aria-label="ลบรูป"
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-canvas/80 text-ink hover:bg-danger hover:text-canvas transition-colors flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
                <select
                  value={img.tag}
                  onChange={(e) => updateTag(img.id, e.target.value)}
                  className="w-full bg-elevated text-ink text-xs px-2 py-1.5 border-t border-line focus:outline-none focus:bg-canvas"
                >
                  {IMAGE_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploader