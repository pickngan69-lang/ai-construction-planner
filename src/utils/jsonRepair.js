/**
 * Try to parse a JSON string from an LLM response. If the JSON is truncated,
 * attempt a best-effort repair by trimming dangling fragments, closing an
 * unterminated string, and balancing brackets in the correct nesting order.
 */

// Close an unterminated string + any open brackets/braces in the right order.
// Tracks string context so braces/quotes inside string values are ignored.
function closeInOrder(s) {
  const stack = []
  let inStr = false
  let esc = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{' || ch === '[') stack.push(ch)
    else if (ch === '}' || ch === ']') stack.pop()
  }
  let out = s
  if (inStr) out += '"' // close a string cut mid-value
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === '{' ? '}' : ']'
  }
  return out
}

export function repairJSON(text) {
  if (typeof text !== 'string') {
    throw new Error('repairJSON: input must be a string')
  }

  // Strip code fences if present
  const cleaned = text.replace(/```json|```/g, '').trim()

  // Quick path
  try {
    return JSON.parse(cleaned)
  } catch {
    // fall through to repair
  }

  let fixed = cleaned

  // Drop dangling fragments that didn't finish
  fixed = fixed.replace(/,\s*"[^"]*$/, '') //                  , "incompleteKey
  fixed = fixed.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '') //  , "key": partialValue
  fixed = fixed.replace(/:\s*$/, ': null') //                  "key":  (no value yet)
  fixed = fixed.replace(/,\s*$/, '') //                        trailing comma

  // Close unterminated string + balance brackets in proper nesting order
  fixed = closeInOrder(fixed)

  return JSON.parse(fixed)
}
