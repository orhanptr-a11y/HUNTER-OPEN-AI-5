const fs = require("fs");
const path = require("path");

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function send(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function loadConfig() {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "config.json"), "utf8")
  );
}

function extractText(data) {
  if (typeof data.output_text === "string") return data.output_text;

  const parts = [];
  for (const item of data.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        parts.push(part.text);
      }
    }
  }
  return parts.join("\n");
}

function apiError(data) {
  return data?.error?.message ||
    data?.message ||
    JSON.stringify(data || {}).slice(0, 3000);
}

function cleanJsonText(text) {
  let s = String(text || "").trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s;
}

async function request(url, options) {
  const r = await fetch(url, options);
  const raw = await r.text();
  let data;
  try { data = JSON.parse(raw); }
  catch { data = { message: raw }; }
  return { r, data };
}

function buildPrompt(cfg) {
  const today = new Date().toISOString().slice(0, 10);

  const themes = (cfg.themes || [])
    .map(x => `- ${x}`)
    .join("\n");

  const radar = (cfg.seed || [])
    .map(x => `- ${x[0]} | ${x[1]} | ${x[2]} | ${x[3]}/100`)
    .join("\n");

  return `
You are the 2030 HUNTER research engine.
TODAY: ${today}

IMPORTANT: RESPOND IN TURKISH.
Ticker symbols, company names, official product names, filing titles and URLs may remain in their original form. All analysis and explanations must be Turkish.

PRIMARY MISSION
Find NEW publicly traded U.S.-listed companies that are worth manually researching because they may have a credible 5X-10X path over roughly five years.

We do NOT need you to make the final investment decision.
We need you to:
1) find the right company,
2) explain why it is interesting,
3) build a fact-based investment thesis,
4) show why 5X/10X could be mathematically plausible,
5) clearly separate verified facts from company guidance and Hunter inference,
6) give clickable source URLs so the user can verify the thesis manually.

CURRENT RADAR — DO NOT RETURN THESE AS NEW
${radar}

THEMES
${themes}

RESEARCH STANDARD — CRITICAL
Use web search extensively.

SOURCE PRIORITY:
Tier 1 — primary / official:
- SEC / EDGAR filings: 10-K, 10-Q, 8-K, S-1, proxy filings
- Company investor-relations pages
- Official earnings releases and investor presentations
- Official customer announcements
- NASA, DoD, DOE, government agencies and official procurement records
- Official exchange/regulatory announcements

Tier 2 — highly reputable independent:
- Reuters
- Bloomberg
- Financial Times
- Wall Street Journal
- CNBC
- AP
- Established specialist industry publications

Tier 3 — discovery only:
- aggregators, blogs, forums, Reddit, social media

Never use Tier 3 as the sole evidence for a material claim.

ACCURACY RULES
- Do NOT invent facts, numbers, contracts, customers, products, revenue, backlog, guidance, market caps or dates.
- If a material fact cannot be verified, do not state it as fact.
- If reliable sources disagree, explicitly mark the item as "ÇELİŞKİLİ" and explain the disagreement.
- Prefer the latest available filing / official source for current financial data.
- For important claims, seek at least one primary source; for major thesis claims, seek a second independent source when reasonably available.
- A company statement is not the same thing as an independently verified fact. Label company guidance separately.
- "Hunter inference" is analysis, not fact. Label it.
- It is better to return fewer companies than a company with a weakly supported thesis.
- Do not force a candidate just to fill the list.
- Every returned company must have enough evidence to make manual research worthwhile.

WINNER DNA
Also assess whether the candidate resembles characteristics often seen in major historical 5X-10X winners, without claiming that similarity guarantees returns.

Assess:
- revenue acceleration
- gross-margin potential / expansion
- operating leverage
- bottleneck ownership
- vertical integration where economically useful
- technology/IP/moat
- customer validation
- TAM and runway
- market-cap asymmetry
- capital efficiency
- dilution risk
- management execution
- product expansion / platform potential

10X MATHEMATICS
Estimate:
- current market cap or enterprise value when reliably available
- plausible future revenue
- plausible future margin
- plausible future valuation multiple
- dilution / share-count effect
- what must happen for 5X and 10X

Do NOT claim a probability as statistically certain. Use labels:
"Zayıf", "Mümkün", "İnandırıcı", "Güçlü" for 10X feasibility.

HUNTER SCORE / 100
Structural theme 15
TAM / runway 10
Bottleneck / scarcity 10
Future moat 15
Technology / product 10
Customer / commercial validation 10
Growth 5
Capital efficiency 5
Management / execution 10
Valuation / asymmetry 10

THRESHOLDS
80-84 RADAR
85-89 STRONG
90-93 TOP TIER
94+ CURRENT #1 LEVEL

Do not inflate scores.

OUTPUT CONTRACT
Return ONLY valid JSON. No markdown. No code fence. No prose outside JSON.

JSON shape:
{
  "scan_summary": {
    "new_candidates": number,
    "radar_plus": number,
    "top_tier_plus": number,
    "research_note_tr": "Kısa Türkçe özet."
  },
  "candidates": [
    {
      "ticker": "LUNR",
      "company": "Intuitive Machines",
      "theme": "Lunar Economy",
      "score": 85,
      "status": "STRONG",
      "confidence": "YÜKSEK",
      "why_found_tr": "Bu şirketi neden radarımıza aldığımızı Türkçe ve somut şekilde anlat.",
      "company_what_it_does_tr": "Şirket ne yapıyor?",
      "business_model_tr": "Nasıl para kazanıyor?",
      "why_5x_10x_tr": "5X-10X'in hangi mekanizmalarla mümkün olabileceğini anlat.",
      "future_story_tr": "Ürün, pazar, kontrat, kapasite, finansal ölçeklenme veya sektör beklentisi açısından gelecek hikayesini anlat.",
      "market_or_company_expectations_tr": "Şirketin resmi beklentileri veya piyasa beklentileri varsa bunları açıkça kaynak türüyle ayırarak anlat.",
      "our_investment_motivation_tr": "Bizim neden daha fazla araştırmak isteyeceğimiz.",
      "risks_tr": ["Risk 1", "Risk 2", "Risk 3"],
      "what_breaks_thesis_tr": "Yatırım tezini bozabilecek en önemli gelişme.",
      "winner_dna_score": 78,
      "winner_dna": {
        "revenue_acceleration": 8,
        "margin_potential": 7,
        "operating_leverage": 7,
        "bottleneck_ownership": 9,
        "vertical_integration": 7,
        "moat": 8,
        "customer_validation": 9,
        "tam_runway": 9,
        "market_cap_asymmetry": 9,
        "capital_efficiency": 5,
        "dilution": 5,
        "management_execution": 7
      },
      "tenx": {
        "feasibility": "İNANDIRICI",
        "current_market_cap": "$...",
        "future_market_cap_10x": "$...",
        "key_assumptions_tr": ["Varsayım 1", "Varsayım 2"],
        "math_note_tr": "Kısa Türkçe matematiksel açıklama."
      },
      "financial_snapshot": {
        "revenue": {"value": "...", "period": "..."},
        "revenue_growth": {"value": "...", "period": "..."},
        "cash": {"value": "...", "period": "..."},
        "free_cash_flow": {"value": "...", "period": "..."},
        "backlog": {"value": "...", "period": "..."}
      },
      "claims": [
        {
          "claim_tr": "Önemli doğrulanabilir iddia.",
          "verification": "DOĞRULANDI",
          "source_type": "SEC",
          "source_title": "10-Q",
          "source_date": "YYYY-MM-DD",
          "url": "https://..."
        }
      ],
      "sources": [
        {
          "title": "Kaynak başlığı",
          "publisher": "SEC / NASA / Company IR / Reuters",
          "type": "PRIMARY",
          "date": "YYYY-MM-DD",
          "url": "https://..."
        }
      ]
    }
  ]
}

SOURCE RULES FOR JSON
- Every candidate must have at least 3 sources if available: preferably 2 PRIMARY + 1 reputable independent.
- Every material claim in claims[] must have a real URL.
- Do not invent URLs. Only include URLs actually found during web research.
- If a source URL is unavailable, omit that claim rather than inventing a link.
- sources[] should include the most important references used to build the thesis.
- Keep URLs as normal absolute https URLs.
- Financial figures must include their period.
- Use null or "Bulunamadı" when a field cannot be reliably verified; never guess.

CANDIDATE RULES
- Return ONLY NEW companies with score >= 80.
- Do not return current radar companies as new.
- A company with a weak evidence base must be excluded even if the story is exciting.
- Company name and ticker are mandatory.
- The final user should be able to click the company sources and manually investigate.
`;
}

module.exports = async (req, res) => {
  try {
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return send(res, 500, {
        error: "OPENAI_API_KEY is missing in the Vercel deployment."
      });
    }

    if (req.method === "POST") {
      const cfg = loadConfig();

      const payload = {
        model: "gpt-5.6",
        reasoning: { effort: "high" },
        input: buildPrompt(cfg),
        background: true,
        tools: [{ type: "web_search" }],
        tool_choice: "required"
      };

      const { r, data } = await request(OPENAI_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        return send(res, 502, {
          error: `OpenAI START ${r.status}: ${apiError(data)}`
        });
      }

      return send(res, 200, {
        id: data.id,
        status: data.status || "queued"
      });
    }

    if (req.method === "GET") {
      const id = req.query?.id;

      if (!id) {
        return send(res, 400, { error: "Missing research id." });
      }

      const { r, data } = await request(
        `${OPENAI_API_URL}/${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${key}` }
        }
      );

      if (!r.ok) {
        return send(res, 502, {
          error: `OpenAI STATUS ${r.status}: ${apiError(data)}`
        });
      }

      if (data.status === "completed") {
        const raw = extractText(data);

        let parsed;
        try {
          parsed = JSON.parse(cleanJsonText(raw));
        } catch (e) {
          return send(res, 502, {
            status: "failed",
            error: "OpenAI tamamlandı fakat beklenen JSON formatı alınamadı.",
            raw_preview: raw.slice(0, 2500)
          });
        }

        return send(res, 200, {
          status: "completed",
          result: parsed
        });
      }

      if (["failed", "cancelled", "incomplete"].includes(data.status)) {
        return send(res, 200, {
          status: "failed",
          error: apiError(data)
        });
      }

      return send(res, 200, {
        status: data.status || "in_progress"
      });
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed." });

  } catch (err) {
    return send(res, 500, {
      error: err?.stack || err?.message || String(err)
    });
  }
};
