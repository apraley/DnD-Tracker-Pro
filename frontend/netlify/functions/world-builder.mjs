/**
 * Netlify serverless function — World Builder API
 *
 * Handles:
 *   action: 'generateWorldLore'   → rich world lore paragraph
 *   action: 'generateCityLore'    → city-specific lore
 *   action: 'saveWorld'           → echoes back a generated worldId (no DB hooked up yet)
 *
 * If ANTHROPIC_API_KEY is set in Netlify env vars, responses are AI-generated via Claude.
 * Otherwise falls back to deterministic template strings — always returns something useful.
 */

// ─── Template generators (deterministic, no AI needed) ───────────────────────

function worldLoreTemplate(params) {
  const { world } = params;
  const name = world?.name ?? 'this world';
  const age = world?.age ?? 2500;
  const magic = world?.magicLevel ?? 5;
  const civ = world?.civilizationAbundance ?? 5;
  const climate = world?.climate ?? 'Temperate';
  const waterPct = world?.terrainStats?.waterPercent ?? 40;
  const cityCount = world?.cities?.length ?? 0;

  const magicDesc = magic >= 8
    ? 'arcane energy crackles visibly in the air; spellcasters walk openly and ley lines glow at dusk'
    : magic >= 5
    ? 'magic is real and wondrous, though true practitioners are few and sought after'
    : 'magic is little more than rumour — whispered about in taverns, rarely witnessed';

  const civDesc = civ >= 8
    ? 'a dense web of roads, trade-houses, and city-states'
    : civ >= 5
    ? 'scattered townships and regional powers vying for dominance'
    : 'isolated homesteads and frontier outposts clinging to survival';

  return `${name} is a world ${age.toLocaleString()} years old, born from cataclysm and shaped by slow millennia. Its ${waterPct}% ocean spans treacherous currents and fog-wreathed archipelagos; the ${100 - waterPct}% of dry land hosts ${civDesc}. Across ${cityCount} known settlements, the world hums with a magic level of ${magic}/10 — ${magicDesc}. The ${climate.toLowerCase()} climate has marked every culture here, from the architecture of its oldest cities to the superstitions of its newest frontier folk. Scholars debate whether the world is still young or entering a long twilight — but the roads are busy, the dungeons are deep, and the next age has not yet been named.`;
}

function cityLoreTemplate(params) {
  const { cityName, civilization, magicLevel, age } = params;
  const civDesc = civilization >= 7 ? 'a sprawling metropolis' : civilization >= 4 ? 'a mid-sized settlement' : 'a small but proud town';
  const magicFlavour = magicLevel >= 7 ? 'Arcane lanterns line its main boulevard' : magicLevel >= 4 ? 'A mage tower watches from the hill' : 'Magic is viewed with quiet suspicion here';
  const ageDesc = age >= 3000 ? 'ancient' : age >= 1000 ? 'storied' : 'young';
  return `${cityName} is ${civDesc} with an ${ageDesc} history stretching back through wars, plagues, and golden ages. ${magicFlavour}. Its markets draw traders from across the region, while its underbelly — alleys, smuggler docks, and guild rivalries — tells a far older story. Travellers are welcomed, for now.`;
}

// ─── Claude AI call (optional) ───────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.content?.[0]?.text ?? null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { action, params = {} } = body;

  try {
    if (action === 'generateWorldLore') {
      // Try Claude first; fall back to template
      let lore = await callClaude(
        'You are a world-building assistant for tabletop RPGs. Write evocative, flavourful lore in 3–4 sentences.',
        `Generate lore for a D&D world called "${params.world?.name ?? 'Unknown'}". Age: ${params.world?.age ?? 2500} years. Magic level: ${params.world?.magicLevel ?? 5}/10. Climate: ${params.world?.climate ?? 'Temperate'}. Water coverage: ${params.world?.terrainStats?.waterPercent ?? 40}%. Cities: ${params.world?.cities?.length ?? 0}.`,
      );
      if (!lore) lore = worldLoreTemplate(params);
      return { statusCode: 200, headers, body: JSON.stringify({ lore }) };
    }

    if (action === 'generateCityLore') {
      let lore = await callClaude(
        'You are a world-building assistant for tabletop RPGs. Write vivid, flavourful city lore in 2–3 sentences.',
        `Generate lore for a city called "${params.cityName}". Civilization level: ${params.civilization}/10. Magic level: ${params.magicLevel}/10. World age: ${params.age} years.`,
      );
      if (!lore) lore = cityLoreTemplate(params);
      return { statusCode: 200, headers, body: JSON.stringify({ lore }) };
    }

    if (action === 'saveWorld') {
      // Stub — return a generated ID (wire up a real DB here when ready)
      const worldId = `world_${Date.now().toString(36)}`;
      return { statusCode: 200, headers, body: JSON.stringify({ worldId, saved: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
  } catch (err) {
    console.error('world-builder function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', detail: String(err) }),
    };
  }
};
