/**
 * Try to parse a JSON string from an LLM response. If the JSON is truncated,
 * attempt a best-effort repair by trimming dangling fragments and balancing brackets.
 */
export function repairJSON(text) {
  if (typeof text !== 'string') {
    throw new Error('repairJSON: input must be a string')
  }

  // Strip code fences if present
  let cleaned = text.replace(/```json|```/g, '').trim()

  // Quick path
  try {
    return JSON.parse(cleaned)
  } catch {
    // fall through to repair
  }

  let fixed = cleaned

  // Drop trailing comma + dangling key/value pairs that didn't finish
  fixed = fixed.replace(/,\s*"[^"]*$/, '')
  fixed = fixed.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '')
  fixed = fixed.replace(/,\s*$/, '')

  // Balance brackets / braces
  const openBraces = (fixed.match(/\{/g) || []).length
  const closeBraces = (fixed.match(/\}/g) || []).length
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/\]/g) || []).length

  for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']'
  for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}'

  return JSON.parse(fixed)
}
