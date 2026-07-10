// ERP market-price API — served by the Node backend (no separate Flask/Postgres
// needed). Response shapes match the Flask app so the frontend erpService works
// unchanged: rows are { id, material_name, current_price, last_updated }.
import express from 'express'
import {
  createMaterial,
  deleteMaterial,
  listMaterials,
  updateMaterial,
} from './store.js'
import { getReferencePrices, TPSO_PROVINCES } from './referenceService.js'

const router = express.Router()

function parsePrice(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'erp-node' })
})

// ---- Reference prices (ราคากลางอ้างอิง จากกระทรวงพาณิชย์ / TPSO) ----
router.get('/reference/provinces', (req, res) => {
  res.json(TPSO_PROVINCES)
})

router.get('/reference/prices', async (req, res) => {
  const now = new Date()
  const type = Number(req.query.type) || 10
  const year = Number(req.query.year) || now.getFullYear() + 543 // พ.ศ.
  const month = Number(req.query.month) || now.getMonth() + 1
  try {
    res.json(await getReferencePrices({ year, month, type }))
  } catch (err) {
    res.status(502).json({ error: err?.message || 'TPSO fetch failed' })
  }
})

router.get('/materials', async (req, res) => {
  try {
    res.json(await listMaterials())
  } catch (err) {
    res.status(500).json({ error: err?.message || 'list failed' })
  }
})

router.post('/materials', async (req, res) => {
  const data = req.body || {}
  const name = String(data.material_name || '').trim()
  if (!name) {
    return res.status(400).json({ error: 'material_name is required' })
  }
  const price = parsePrice(data.current_price ?? 0)
  if (price === null) {
    return res.status(400).json({ error: 'current_price must be a number' })
  }
  try {
    const row = await createMaterial({ material_name: name, current_price: price })
    res.status(201).json(row)
  } catch (err) {
    res.status(500).json({ error: err?.message || 'create failed' })
  }
})

async function handleUpdate(req, res) {
  const data = req.body || {}
  const patch = {}
  if ('material_name' in data) {
    const name = String(data.material_name || '').trim()
    if (!name) {
      return res.status(400).json({ error: 'material_name cannot be empty' })
    }
    patch.material_name = name
  }
  if ('current_price' in data) {
    const price = parsePrice(data.current_price)
    if (price === null) {
      return res.status(400).json({ error: 'current_price must be a number' })
    }
    patch.current_price = price
  }
  try {
    const row = await updateMaterial(req.params.id, patch)
    if (!row) return res.status(404).json({ error: 'not found' })
    res.json(row)
  } catch (err) {
    res.status(500).json({ error: err?.message || 'update failed' })
  }
}

router.put('/materials/:id', handleUpdate)
router.patch('/materials/:id', handleUpdate)

router.delete('/materials/:id', async (req, res) => {
  try {
    const ok = await deleteMaterial(req.params.id)
    if (!ok) return res.status(404).json({ error: 'not found' })
    res.json({ deleted: Number(req.params.id) || req.params.id })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'delete failed' })
  }
})

export default router
