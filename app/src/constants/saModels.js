/**
 * saModels.js
 *
 * SA_SKINS — hardcoded (ped IDs are not on the IDE_List; static since SA shipped).
 * SA_OBJECTS — live array, starts empty and is populated in the background.
 *              Await `saModelsReady` before reading it.
 */

// ─── Hardcoded skins ──────────────────────────────────────────────────────────

export const SA_SKINS = [
  { id: 0,   name: 'CJ',                model: 'cj' },
  { id: 1,   name: 'The Truth',         model: 'truth' },
  { id: 2,   name: 'Maccer',            model: 'maccer' },
  { id: 3,   name: 'Andre',             model: 'andre' },
  { id: 4,   name: 'Big Bear (Thin)',   model: 'bbthin' },
  { id: 5,   name: 'Big Bear (Big)',    model: 'bb' },
  { id: 6,   name: 'Emmet',             model: 'emmet' },
  { id: 7,   name: 'Taxi/Train Driver', model: 'male01' },
  { id: 8,   name: 'Janitor',           model: 'janitor' },
  { id: 9,   name: 'Normal Ped (F)',    model: 'bfori' },
  { id: 10,  name: 'Old Woman',         model: 'bfost' },
  { id: 11,  name: 'Casino Croupier',   model: 'vbfycrp' },
  { id: 12,  name: 'Rich Woman',        model: 'bfyri' },
  { id: 13,  name: 'Street Girl',       model: 'bfyst' },
  { id: 14,  name: 'Normal Ped (M)',    model: 'bmori' },
  { id: 15,  name: 'Mr. Whittaker',     model: 'bmost' },
  { id: 16,  name: 'Airport Worker',    model: 'bmyap' },
  { id: 17,  name: 'Businessman',       model: 'bmybu' },
  { id: 18,  name: 'Beach Visitor (M)', model: 'bmybe' },
  { id: 19,  name: 'DJ',               model: 'bmydj' },
  { id: 20,  name: 'Rich Guy',         model: 'bmyri' },
  { id: 21,  name: 'Normal Ped',       model: 'bmycr' },
  { id: 22,  name: 'Normal Ped',       model: 'bmyst' },
  { id: 23,  name: 'BMXer',            model: 'wmybmx' },
  { id: 24,  name: 'Madd Dogg Guard',  model: 'wbdyg1' },
  { id: 25,  name: 'Madd Dogg Guard',  model: 'wbdyg2' },
  { id: 26,  name: 'Backpacker',       model: 'wmybp' },
  { id: 27,  name: 'Construction Wkr', model: 'wmycon' },
  { id: 28,  name: 'Drug Dealer',      model: 'bmydrug' },
  { id: 29,  name: 'Drug Dealer',      model: 'wmydrug' },
  { id: 30,  name: 'Drug Dealer',      model: 'hmydrug' },
  { id: 42,  name: 'Jethro',           model: 'jethro' },
  { id: 50,  name: 'Mechanic',         model: 'wmymech' },
  { id: 61,  name: 'Pilot',            model: 'wmyplt' },
  { id: 65,  name: 'Kendl Johnson',    model: 'kendl' },
  { id: 80,  name: 'Boxer',            model: 'vbmybox' },
  { id: 81,  name: 'Boxer',            model: 'vwmybox' },
  { id: 82,  name: 'Black Elvis',      model: 'vhmyelv' },
  { id: 83,  name: 'White Elvis',      model: 'vbmyelv' },
  { id: 84,  name: 'Blue Elvis',       model: 'vimyelv' },
  { id: 86,  name: 'Ryder (Masked)',   model: 'ryder3' },
  { id: 102, name: 'Balla',            model: 'ballas1' },
  { id: 103, name: 'Balla',            model: 'ballas2' },
  { id: 104, name: 'Balla',            model: 'ballas3' },
  { id: 105, name: 'Grove St Fam',     model: 'fam1' },
  { id: 106, name: 'Grove St Fam',     model: 'fam2' },
  { id: 107, name: 'Grove St Fam',     model: 'fam3' },
  { id: 108, name: 'LS Vagos',         model: 'lsv1' },
  { id: 109, name: 'LS Vagos',         model: 'lsv2' },
  { id: 110, name: 'LS Vagos',         model: 'lsv3' },
  { id: 111, name: 'Russian Mafia',    model: 'maffa' },
  { id: 112, name: 'Russian Mafia',    model: 'maffb' },
  { id: 113, name: 'Mafia Boss',       model: 'mafboss' },
  { id: 114, name: 'Varios Aztecas',   model: 'vla1' },
  { id: 115, name: 'Varios Aztecas',   model: 'vla2' },
  { id: 116, name: 'Varios Aztecas',   model: 'vla3' },
  { id: 117, name: 'Triad',            model: 'triada' },
  { id: 118, name: 'Triad',            model: 'triadb' },
  { id: 119, name: 'Sindacco',         model: 'sindaco' },
  { id: 120, name: 'Triad Boss',       model: 'triboss' },
  { id: 121, name: 'Da Nang Boy',      model: 'dnb1' },
  { id: 122, name: 'Da Nang Boy',      model: 'dnb2' },
  { id: 123, name: 'Da Nang Boy',      model: 'dnb3' },
  { id: 124, name: 'The Mafia',        model: 'vmaff1' },
  { id: 125, name: 'The Mafia',        model: 'vmaff2' },
  { id: 126, name: 'The Mafia',        model: 'vmaff3' },
  { id: 127, name: 'The Mafia',        model: 'vmaff4' },
  { id: 147, name: 'Businessman',      model: 'wmybu' },
  { id: 149, name: 'Big Smoke Armor',  model: 'smokev' },
  { id: 163, name: 'Black Bouncer',    model: 'bmyboun' },
  { id: 164, name: 'White Bouncer',    model: 'wmyboun' },
  { id: 247, name: 'Biker',            model: 'bikera' },
  { id: 248, name: 'Biker',            model: 'bikerb' },
  { id: 265, name: 'Tenpenny',         model: 'tenpen' },
  { id: 266, name: 'Pulaski',          model: 'pulaski' },
  { id: 267, name: 'Hernandez',        model: 'hern' },
  { id: 268, name: 'Dwayne',           model: 'dwayne' },
  { id: 269, name: 'Big Smoke',        model: 'smoke' },
  { id: 270, name: 'Sweet',            model: 'sweet' },
  { id: 271, name: 'Ryder',            model: 'ryder' },
  { id: 272, name: 'Mafia Boss',       model: 'forelli' },
  { id: 273, name: 'T-Bone Mendez',    model: 'tbone' },
  { id: 280, name: 'LSPD Officer',     model: 'lapd1' },
  { id: 281, name: 'SFPD Officer',     model: 'sfpd1' },
  { id: 282, name: 'LVPD Officer',     model: 'lvpd1' },
  { id: 283, name: 'County Sheriff',   model: 'csher' },
  { id: 285, name: 'S.W.A.T.',        model: 'swat' },
  { id: 286, name: 'Federal Agent',    model: 'fbi' },
  { id: 287, name: 'Army',             model: 'army' },
  { id: 289, name: 'Zero',             model: 'zero' },
  { id: 290, name: 'Ken Rosenberg',    model: 'rose' },
  { id: 291, name: 'Kent Paul',        model: 'paul' },
  { id: 292, name: 'Cesar',            model: 'cesar' },
  { id: 293, name: 'OG Loc',           model: 'ogloc' },
  { id: 294, name: 'Woozie',           model: 'wuzimu' },
  { id: 295, name: 'Toreno',           model: 'torino' },
  { id: 296, name: 'Jizzy B.',         model: 'jizzy' },
  { id: 297, name: 'Madd Dogg',        model: 'maddogg' },
  { id: 298, name: 'Catalina',         model: 'cat' },
  { id: 299, name: 'Claude Speed',     model: 'claude' },
]

export const SA_SKIN_MAP = Object.fromEntries(SA_SKINS.map(s => [s.id, s.name]))

// ─── Dynamic object/model loader ─────────────────────────────────────────────

function parseWikitext(wikitext) {
  const results = []
  for (const line of wikitext.split('\n')) {
    const match = line.match(
      /^\|\s*'{0,3}\*{0,2}(\d+)\*{0,2}'{0,3}\s*\|\|\s*([^|]+?)\s*\|\|\s*([^|]+?)\s*\|?\s*$/
    )
    if (match) {
      const id = parseInt(match[1], 10)
      const model = match[2].trim().toLowerCase()
      const txd = match[3].trim().toLowerCase()
      if (!isNaN(id) && model) results.push({ id, model, txd })
    }
  }
  return results
}

/**
 * Live array — starts empty, populated in-place once the fetch completes.
 * @type {{ id: number, model: string, txd: string }[]}
 */
export const SA_OBJECTS = []

/**
 * Resolves once SA_OBJECTS is fully populated.
 * Await this in onMounted before reading SA_OBJECTS.
 * @type {Promise<void>}
 */
export const saModelsReady = (async () => {
  try {
    // Proxied through Vite (dev) or your server (prod) to avoid CORS.
    // Add this to vite.config.js → server.proxy:
    //   '/wiki-proxy': {
    //     target: 'https://wiki.multitheftauto.com',
    //     changeOrigin: true,
    //     rewrite: path => path.replace(/^\/wiki-proxy/, ''),
    //   }
    const res = await fetch(
      '/wiki-proxy/api.php?action=parse&page=IDE_List&prop=wikitext&format=json'
    )
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
    const json = await res.json()
    const wikitext = json?.parse?.wikitext?.['*']
    if (!wikitext) throw new Error('Unexpected API response shape')
    const seen = new Set()
    const deduped = parseWikitext(wikitext).filter(o => {
      if (seen.has(o.id)) return false
      seen.add(o.id)
      return true
    })
    SA_OBJECTS.push(...deduped)
  } catch (err) {
    console.error('[saModels] Failed to load IDE list:', err)
  }
})()

/** id → model name lookup. Call after saModelsReady. */
export const SA_OBJECT_MAP = () =>
  Object.fromEntries(SA_OBJECTS.map(o => [o.id, o.model]))