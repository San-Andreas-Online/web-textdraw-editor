const FONT_NAME_MAP = {
  'TEXT_DRAW_FONT_0': 0, 'TEXT_DRAW_FONT_1': 1,
  'TEXT_DRAW_FONT_2': 2, 'TEXT_DRAW_FONT_3': 3,
  'TEXT_DRAW_FONT_SPRITE_DRAW': 4, 'TEXT_DRAW_FONT_MODEL_PREVIEW': 5,
}

const ALIGN_NAME_MAP = {
  'TEXT_DRAW_ALIGN_LEFT': 0, 'TEXT_DRAW_ALIGN_CENTER': 1,
  'TEXT_DRAW_ALIGN_CENTRE': 1, 'TEXT_DRAW_ALIGN_RIGHT': 2,
}

const KNOWN_SPRITE_LIBS = [
  'ld_beat', 'ld_card', 'ld_cell', 'ld_cntr', 'ld_dead', 'ld_driv',
  'ld_frst', 'ld_game', 'ld_gdge', 'ld_gun', 'ld_gunl', 'ld_hmnu',
  'ld_hud', 'ld_icon', 'ld_lock', 'ld_madn', 'ld_map', 'ld_news',
  'ld_none', 'ld_otb', 'ld_plan', 'ld_poke', 'ld_pool', 'ld_race',
  'ld_rast', 'ld_rdio', 'ld_rxlt', 'ld_safe', 'ld_shrp', 'ld_sign',
  'ld_slot', 'ld_spac', 'ld_spas', 'ld_tatt', 'ld_txd',
  'hud', 'radar', 'sampcac', 'samp', 'timecyc',
]

const SX = 640 / 592
const INV_SX = 592 / 640

function parseColor(raw) {
  const n = parseInt(raw)
  if (!isNaN(n)) return n >>> 0
  return 0xFFFFFFFF
}

function parseFont(raw) {
  const t = raw.trim()
  if (t in FONT_NAME_MAP) return FONT_NAME_MAP[t]
  return parseInt(t) || 0
}

function parseAlign(raw) {
  const t = raw.trim()
  if (t in ALIGN_NAME_MAP) return ALIGN_NAME_MAP[t]
  const n = parseInt(t)
  return isNaN(n) ? 0 : n - 1
}

function parseBool(raw) {
  const t = raw.trim().toLowerCase()
  return t === '1' || t === 'true'
}

function extractArgs(line) {
  const m = line.match(/\(([^)]*)\)/)
  if (!m) return []
  return m[1].split(',').map(s => s.trim())
}

function extractLastArgs(line, count) {
  const args = extractArgs(line)
  return args.slice(args.length - count)
}

function isSpriteName(text) {
  if (!text.includes(':')) return false
  const [lib] = text.split(':')
  return KNOWN_SPRITE_LIBS.includes(lib.toLowerCase())
}

function detectType(el) {
  if (el.font === 4 || isSpriteName(el.text)) return 'sprite'
  if (el.useBox && el.text === '_') return 'box'
  return 'label'
}

export function importPawn(code) {
  const lines = code.split('\n').map(l => l.trim()).filter(Boolean)
  const elements = []
  let current = null

  for (const line of lines) {
    const isPlayer = /CreatePlayerTextDraw/i.test(line)
    const isGlobal = !isPlayer && /TextDrawCreate/i.test(line)

    if (isPlayer || isGlobal) {
      if (current) {
        current.type = detectType(current)
        elements.push(current)
      }

      const args = extractArgs(line)
      const coordsAndText = args.slice(args.length - 3)

      const rawX = parseFloat(coordsAndText[0])
      const x = rawX * INV_SX
      const y = parseFloat(coordsAndText[1]) + 3
      const rawText = coordsAndText[2].replace(/^"|"$/g, '')

      current = {
        id: Math.random().toString(36).slice(2, 9),
        isPlayer,
        name: `td${elements.length + 1}`,
        type: 'label',
        visible: true,
        locked: false,
        layer: elements.length,
        x, y,
        _rawX: rawX,
        w: 100, h: 20,
        text: rawText,
        color: 0xFFFFFFFF,
        boxColor: 0x000000AA,
        bgColor: 0x00000080,
        font: 0,
        align: 0,
        letterX: 0.2,
        letterY: 0.9,
        outline: 0,
        shadow: 0,
        useBox: false,
        proportional: false,
        selectable: false,
        _rawTextSizeX: 0,
        _rawTextSizeY: 0,
      }
      continue
    }

    if (!current) continue

    if (/(?:TextDraw|PlayerTextDraw)Font/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.font = parseFont(raw)
    } else if (/(?:TextDraw|PlayerTextDraw)LetterSize/i.test(line)) {
      const [lx, ly] = extractLastArgs(line, 2)
      current.letterX = parseFloat(lx)
      current.letterY = parseFloat(ly)
    } else if (/(?:TextDraw|PlayerTextDraw)TextSize/i.test(line)) {
      const [tx, ty] = extractLastArgs(line, 2)
      current._rawTextSizeX = parseFloat(tx)
      current._rawTextSizeY = parseFloat(ty)
    } else if (/(?:TextDraw|PlayerTextDraw)Alignment/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.align = parseAlign(raw)
    } else if (/(?:TextDraw|PlayerTextDraw)Colou?r\b/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.color = parseColor(raw)
    } else if (/(?:TextDraw|PlayerTextDraw)UseBox/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.useBox = parseBool(raw)
    } else if (/(?:TextDraw|PlayerTextDraw)BoxColou?r/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.boxColor = parseColor(raw)
    } else if (/(?:TextDraw|PlayerTextDraw)SetOutline/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.outline = parseInt(raw) || 0
    } else if (/(?:TextDraw|PlayerTextDraw)SetShadow/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.shadow = parseInt(raw) || 0
    } else if (/(?:TextDraw|PlayerTextDraw)SetProportional/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.proportional = parseBool(raw)
    } else if (/(?:TextDraw|PlayerTextDraw)SetSelectable/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.selectable = parseBool(raw)
    } else if (/(?:TextDraw|PlayerTextDraw)SetString/i.test(line)) {
      const m = line.match(/,\s*"(.*)"\s*\)/)
      if (m) current.text = m[1]
    } else if (/(?:TextDraw|PlayerTextDraw)BackgroundColou?r/i.test(line)) {
      const [raw] = extractLastArgs(line, 1)
      current.bgColor = parseColor(raw)
    }
  }

  if (current) {
    current.type = detectType(current)
    elements.push(current)
  }

  for (const el of elements) {
    const tx = el._rawTextSizeX
    const ty = el._rawTextSizeY
    const rawX = el._rawX
    delete el._rawTextSizeX
    delete el._rawTextSizeY
    delete el._rawX

    if (el.type === 'sprite') {
      el.text = el.text.toLowerCase()
      el.w = tx * INV_SX
      el.h = ty
      el.textSizeX = 0
      el.textSizeY = 0
    } else if (el.useBox && tx > 0) {
      el.h = Math.round(el.letterY / 0.1154)
      el.w = (tx - rawX + 5) * INV_SX
      el.textSizeX = 0
      el.textSizeY = 0
    } else {
      el.textSizeX = 0
      el.textSizeY = 0
      if (el.type === 'label' || el.type === 'button') el.h = 25
    }
  }

  return elements
}