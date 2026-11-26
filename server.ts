import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createClearPathApiRouter, type RealtimeEmitOptions } from './server/apiRoutes.ts';
import { loadDb } from './server/store.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function withGeminiTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// Initialize official Gemini SDK server-side
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Deterministic safe fallback for homepage intent routing
function buildFallbackNavigation(query: string, lang: 'en' | 'ml') {
  const q = query.toLowerCase();
  if (
    q.includes('friend') ||
    q.includes('son') ||
    q.includes('daughter') ||
    q.includes('family') ||
    q.includes('brother') ||
    q.includes('sister') ||
    q.includes('parent') ||
    q.includes('help someone') ||
    q.includes('talk')
  ) {
    return {
      reply:
        lang === 'ml'
          ? 'പ്രിയപ്പെട്ടവരെ ശാന്തമായും പിന്തുണയോടും കൂടി സഹായിക്കാൻ സപ്പോർട്ടർ മോഡ് ഉപയോഗിക്കാം. സമ്മർദ്ദമില്ലാതെ സംസാരിക്കാനുള്ള മാർഗ്ഗങ്ങൾ ഇവിടെ ലഭ്യമാണ്.'
          : 'Supporter Mode gives you practical, calm conversation scripts and verified referral matching so you can support someone constructively without burnout.',
      suggestedRole: 'supporter',
      suggestedTab: 'talk',
      suggestedActionLabel: lang === 'ml' ? 'സപ്പോർട്ടർ സഹായം തുറക്കുക' : 'Open Supporter Talk & Match',
      secondaryTip:
        lang === 'ml'
          ? 'അടിയന്തര സഹായത്തിന് കേരള വിമുക്തി 14405 വിളിക്കാം.'
          : 'For 24/7 professional guidance in Kerala, Vimukthi helpline 14405 is free and confidential.',
      needsEmergencyHelp: q.includes('overdose') || q.includes('emergency') || q.includes('urgent'),
      source: 'fallback',
    };
  }

  if (
    q.includes('school') ||
    q.includes('college') ||
    q.includes('campus') ||
    q.includes('community') ||
    q.includes('campaign') ||
    q.includes('club') ||
    q.includes('ngo') ||
    q.includes('teacher')
  ) {
    return {
      reply:
        lang === 'ml'
          ? 'സ്കൂൾ/കോളേജ് കാമ്പെയ്‌നുകളും ബോധവൽക്കരണ പദ്ധതികളും സംഘടിപ്പിക്കാൻ കമ്മ്യൂണിറ്റി ബിൽഡർ വിഭാഗം സഹായിക്കും.'
          : 'Community Builder includes an Action Generator for school/college campaigns, district prevention mapping, and exportable coordination toolkits.',
      suggestedRole: 'community',
      suggestedTab: 'campaigns',
      suggestedActionLabel: lang === 'ml' ? 'കമ്മ്യൂണിറ്റി ആക്ഷൻ തുറക്കുക' : 'Open Community Action Engine',
      secondaryTip:
        lang === 'ml'
          ? 'നിങ്ങളുടെ പദ്ധതികൾ മറ്റ് സ്ഥാപനങ്ങൾക്കായി പങ്കിടാനും സാധിക്കും.'
          : 'You can generate ready-to-use campus event checklists without exposing any individual data.',
      needsEmergencyHelp: false,
      source: 'fallback',
    };
  }

  if (
    q.includes('learn') ||
    q.includes('science') ||
    q.includes('brain') ||
    q.includes('certificate') ||
    q.includes('student') ||
    q.includes('quiz') ||
    q.includes('peer pressure')
  ) {
    return {
      reply:
        lang === 'ml'
          ? 'ലഹരിവസ്തുക്കളുടെ ശാസ്ത്രീയ വശങ്ങളും പ്രതിരോധ നൈപുണ്യവും പഠിച്ച് സർട്ടിഫിക്കറ്റ് നേടാൻ ലേണർ വർക്ക്‌സ്‌പേസ് ഉപയോഗിക്കൂ.'
          : 'The Learner Workspace offers interactive peer-pressure decision simulations, brain science modules, and a verifiable ClearPath AI certificate.',
      suggestedRole: 'learner',
      suggestedTab: 'interactive',
      suggestedActionLabel: lang === 'ml' ? 'ലേണർ സിമുലേറ്റർ തുറക്കുക' : 'Open Prevention Lab & Simulator',
      secondaryTip:
        lang === 'ml'
          ? 'നിങ്ങളുടെ സമയക്രമം അനുസരിച്ച് 7 അല്ലെങ്കിൽ 14 ദിവസത്തെ പ്ലാൻ തിരഞ്ഞെടുക്കാം.'
          : 'You can build a custom 7-day or 14-day schedule at your own pace.',
      needsEmergencyHelp: false,
      source: 'fallback',
    };
  }

  if (q.includes('hospital') || q.includes('clinic') || q.includes('center') || q.includes('map') || q.includes('doctor')) {
    return {
      reply:
        lang === 'ml'
          ? 'കേരളത്തിലെ അംഗീകൃത വിമുക്തി കേന്ദ്രങ്ങളും സർക്കാർ ആശുപത്രികളും ഗൂഗിൾ മാപ്പിൽ ഉടൻ കണ്ടെത്താം.'
          : 'Open the verified Support & Maps directory to filter Kerala government de-addiction centers by district and get direct directions or 14405 triage.',
      suggestedRole: 'personal',
      suggestedTab: 'support',
      suggestedActionLabel: lang === 'ml' ? 'ആശുപത്രി മാപ്പ് തുറക്കുക' : 'Find Verified Centers on Map',
      secondaryTip:
        lang === 'ml' ? 'എല്ലാ വിവരങ്ങളും പൂർണ്ണമായും രഹസ്യമായി സൂക്ഷിക്കുന്നു.' : 'No location history leaves your browser.',
      needsEmergencyHelp: false,
      source: 'fallback',
    };
  }

  return {
    reply:
      lang === 'ml'
        ? 'നിങ്ങളുടെ വ്യക്തിപരമായ ദിനചര്യയും മനഃശാന്തിയും വീണ്ടെടുക്കാൻ പേഴ്സണൽ ജേർണി ഇവിടെയുണ്ട്. ചെറിയൊരു ദൈനംദിന ചെക്ക്-ഇൻ വഴി തുടങ്ങാം.'
        : 'Personal Journey is your private workspace to steady your daily rhythm, practice craving/focus training games, and track genuine routines at your own pace.',
    suggestedRole: 'personal',
    suggestedTab: 'dashboard',
    suggestedActionLabel: lang === 'ml' ? 'പേഴ്സണൽ ജേർണി തുറക്കുക' : 'Enter Personal Journey',
    secondaryTip:
      lang === 'ml'
        ? 'അടിയന്തര സഹായത്തിന് 14405 അല്ലെങ്കിൽ 112 വിളിക്കുക.'
        : 'Everything you log stays encrypted in your private browser vault.',
    needsEmergencyHelp: q.includes('overdose') || q.includes('suicide') || q.includes('crisis'),
    source: 'fallback',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const wsClientsByUserId = new Map<string, Set<WebSocket>>();
  const broadcastToSockets = (options: RealtimeEmitOptions) => {
    const serialized = JSON.stringify({
      event: options.event,
      timestamp: new Date().toISOString(),
      ...(options.payload || {}),
    });
    if (options.broadcastAll) {
      for (const sockets of wsClientsByUserId.values()) {
        for (const ws of sockets) {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(serialized);
            } catch {
              // ignore stale socket
            }
          }
        }
      }
      return;
    }
    const targets = new Set((options.targetUserIds || []).filter(Boolean));
    for (const userId of targets) {
      const sockets = wsClientsByUserId.get(userId);
      if (!sockets) continue;
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(serialized);
          } catch {
            // ignore stale socket
          }
        }
      }
    }
  };

  app.use('/api', createClearPathApiRouter(getGeminiClient, broadcastToSockets));

  // 1. Homepage ClearPath AI Navigator & Role Router
  app.post('/api/ai/navigate', async (req, res) => {
    const query = String(req.body?.query || '').trim();
    const language = req.body?.language === 'ml' ? 'ml' : 'en';
    if (!query) {
      return res.status(400).json({ error: 'Please describe what you are looking for.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(buildFallbackNavigation(query, language));
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `User question/situation: "${query}"\nPreferred language: ${language === 'ml' ? 'Malayalam' : 'English'}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are ClearPath AI Support Guide for Kerala, India. Use simple, everyday plain language—short clear sentences with zero complicated medical or technical words. Be warm, calm, and never judge or diagnose addiction. Route to the single best workspace role: personal (tabs: dashboard, dailylog, journey, rebuild, games, tools, navigator, support), supporter (tabs: dashboard, talk, match, plan, understand, support), learner (tabs: dashboard, interactive, pathways, planner, missions, certificate), community (tabs: dashboard, campaigns, map, impact, gaps, exchange). Set needsEmergencyHelp=true only if user mentions urgent medical danger, overdose, or self-harm.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'Calm, practical 2-sentence guidance in preferred language.' },
              suggestedRole: {
                type: Type.STRING,
                description: 'One of: personal, supporter, learner, community',
              },
              suggestedTab: { type: Type.STRING, description: 'Valid tab key inside suggestedRole.' },
              suggestedActionLabel: { type: Type.STRING, description: 'Short 2-4 word button label.' },
              secondaryTip: { type: Type.STRING, description: 'One short practical tip or helpline note.' },
              needsEmergencyHelp: { type: Type.BOOLEAN },
            },
            required: ['reply', 'suggestedRole', 'suggestedTab', 'suggestedActionLabel', 'secondaryTip', 'needsEmergencyHelp'],
          },
        },
      }));

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini navigate error:', err);
      return res.json(buildFallbackNavigation(query, language));
    }
  });

  // 2. Role 01 Personal Journey AI Reflection & Weekly Review
  app.post('/api/ai/reflect', async (req, res) => {
    const mode = req.body?.mode === 'weekly' ? 'weekly' : 'checkin';
    const language = req.body?.language === 'ml' ? 'ml' : 'en';
    const mood = String(req.body?.mood || 'steady');
    const note = String(req.body?.note || '');
    const triggerCategory = String(req.body?.triggerCategory || '');
    const recentSummary = String(req.body?.recentSummary || '');

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reflection:
          mode === 'weekly'
            ? language === 'ml'
              ? 'കഴിഞ്ഞ ആഴ്ചയിലെ നിങ്ങളുടെ പരിശ്രമങ്ങൾ ശ്രദ്ധേയമാണ്. സ്ഥിരതയുള്ള ചെറിയ ദിനചര്യകൾ മനസ്സിന് കരുത്ത് നൽകും.'
              : 'Your steady pattern of showing up builds neural resilience. Focus on one predictable morning anchor tomorrow.'
            : language === 'ml'
              ? `ഇപ്പോൾ നിങ്ങൾക്ക് "${mood}" അനുഭവപ്പെടുന്നത് സ്വാഭാവികമാണ്. 90 സെക്കൻഡ് ശാന്തമായി ശ്വസിക്കുകയും Cognitive Lab-ലെ Urge Wave ഗെയിം ശ്രമിക്കുകയും ചെയ്യാം.`
              : `Acknowledging feeling ${mood} takes clarity. Pause for a 60-second sensory reset or run one short round in Cognitive Lab to redirect attention.`,
        microStep:
          language === 'ml'
            ? 'ഒരു ഗ്ലാസ് വെള്ളം കുടിച്ച് അടുത്ത 15 മിനിറ്റിലേക്ക് ചെറിയൊരു ലക്ഷ്യം തിരഞ്ഞെടുക്കുക.'
            : 'Drink a glass of water and choose one quiet 15-minute physical or creative anchor right now.',
        source: 'fallback',
      });
    }

    try {
      const prompt =
        mode === 'weekly'
          ? `Generate an encouraging, non-clinical weekly progress reflection based strictly on this real user history: ${recentSummary}. Language: ${language === 'ml' ? 'Malayalam' : 'English'}. Never invent metrics.`
          : `User logged check-in mood="${mood}", note="${note}", trigger="${triggerCategory}". Respond calmly in ${language === 'ml' ? 'Malayalam' : 'English'}. Never diagnose.`;

      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a warm, calm support guide in ClearPath AI. Use simple, everyday plain words—avoid complicated clinical jargon. Never prescribe medicine, diagnose anyone, or blame the user. Give 2-3 clear sentences of encouragement and one easy next step they can try today.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reflection: { type: Type.STRING },
              microStep: { type: Type.STRING },
            },
            required: ['reflection', 'microStep'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini reflect error:', err);
      return res.json({
        reflection: 'Staying observant of your triggers and mood strengthens self-regulation day by day.',
        microStep: 'Try 2 minutes of Urge Wave Rider in Cognitive Lab or reach out to a trusted person.',
        source: 'fallback',
      });
    }
  });

  // 3. Role 02 Supporter AI Compassionate Communication Coach
  app.post('/api/ai/supporter', async (req, res) => {
    const relationship = String(req.body?.relationship || 'family member');
    const situation = String(req.body?.situation || '').trim();
    const language = req.body?.language === 'ml' ? 'ml' : 'en';

    const ai = getGeminiClient();
    if (!ai || !situation) {
      return res.json({
        openingLine:
          language === 'ml'
            ? '"നിന്നെ കുറ്റപ്പെടുത്താനല്ല, നിന്നോടൊപ്പം നിൽക്കാനും നിന്റെ വിഷമങ്ങൾ കേൾക്കാനും ഞാൻ ആഗ്രഹിക്കുന്നു."'
            : '"I care about you and want to understand what you are carrying lately—no lectures, just listening whenever you are ready."',
        avoidSaying:
          language === 'ml'
            ? 'ഭീഷണിപ്പെടുത്തുകയോ മറ്റുള്ളവരുമായി താരതമ്യം ചെയ്യുകയോ ചെയ്യരുത്.'
            : 'Avoid ultimatums, interrogation, or bringing up past mistakes during the first check-in.',
        nextAction:
          language === 'ml'
            ? 'ശാന്തമായ ഒരു സമയത്ത് സംസാരിക്കാൻ ശ്രമിക്കുക; ആവശ്യമെങ്കിൽ 14405-ൽ വിദഗ്ധ ഉപദേശം തേടുക.'
            : 'Choose a calm, private moment without distractions, and keep Vimukthi 14405 saved if professional guidance helps.',
        source: 'fallback',
      });
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Supporter role: ${relationship}. Concern: "${situation}". Language: ${language === 'ml' ? 'Malayalam' : 'English'}.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are ClearPath AI Family & Supporter Guide. Help parents, friends, or teachers talk gently and calmly without fights, blame, or lectures. Use plain, everyday English or Malayalam that anyone can understand right away.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              openingLine: { type: Type.STRING },
              avoidSaying: { type: Type.STRING },
              nextAction: { type: Type.STRING },
            },
            required: ['openingLine', 'avoidSaying', 'nextAction'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini supporter error:', err);
      return res.json({
        openingLine: '"I noticed things feel heavy lately, and I am here in your corner whenever you feel like talking."',
        avoidSaying: 'Avoid accusations or trying to fix everything in a single conversation.',
        nextAction: 'Listen first, validate stress, and offer to explore verified counselors together.',
        source: 'fallback',
      });
    }
  });

  // 4. Role 03 Learner Interactive Prevention Scenario Explainer & Activity Generator
  app.post('/api/ai/learn', async (req, res) => {
    const scenario = String(req.body?.scenario || '');
    const choice = String(req.body?.choice || '');
    const topic = String(req.body?.topic || 'peer pressure & brain resilience');
    const language = req.body?.language === 'ml' ? 'ml' : 'en';

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        consequenceExplanation:
          language === 'ml'
            ? 'നിങ്ങൾ എടുക്കുന്ന തീരുമാനങ്ങൾ തലച്ചോറിലെ ഡോപമിൻ ബാലൻസിനെയും ദീർഘകാല ശ്രദ്ധയെയും സ്വാധീനിക്കുന്നു. സമ്മർദ്ദ സാഹചര്യങ്ങളിൽ ഉറച്ച "No" പറയുന്നത് ആത്മവിശ്വാസം വർദ്ധിപ്പിക്കുന്നു.'
            : 'Pausing before reacting protects prefrontal judgment and breaks the impulsive social reward cycle. Practicing calm refusal scripts builds automatic confidence under peer pressure.',
        actionChallenge:
          language === 'ml'
            ? 'നിങ്ങളുടെ അടുത്ത ക്വിസ് പൂർത്തിയാക്കി ഒരു സുഹൃത്തുമായി ഈ അറിവ് പങ്കുവെക്കാം.'
            : 'Rehearse one 5-second exit line you can use anytime someone offers an unsafe substance.',
        source: 'fallback',
      });
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Prevention topic: ${topic}. Scenario: ${scenario}. Learner choice: ${choice}. Language: ${language === 'ml' ? 'Malayalam' : 'English'}.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a ClearPath AI Prevention Teacher. Explain clearly in simple, everyday words how choices affect stress, habits, and confidence—no preaching and no heavy jargon. Suggest one practical real-life tip.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              consequenceExplanation: { type: Type.STRING },
              actionChallenge: { type: Type.STRING },
            },
            required: ['consequenceExplanation', 'actionChallenge'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini learn error:', err);
      return res.json({
        consequenceExplanation:
          'Every high-pressure social choice trains either impulsive compliance or independent boundary control.',
        actionChallenge: 'Try another branch in the simulator to compare short-term vs 30-day outcomes.',
        source: 'fallback',
      });
    }
  });

  // 5. Role 04 Community Action, Timed Speech & Campaign Generator
  app.post('/api/ai/community', async (req, res) => {
    const topic = String(req.body?.topic || 'Youth Brain Science & Peer Pressure Refusal').trim();
    const durationMinutes = Number(req.body?.durationMinutes || 15);
    const focusArea = String(req.body?.focusArea || 'brain_science');
    const tone = String(req.body?.tone || 'inspiring');
    const institutionType = String(req.body?.institutionType || 'school');
    const district = String(req.body?.district || 'Ernakulam');
    const audience = String(req.body?.audience || 'Students & Young Adults');
    const resources = String(req.body?.resources || 'Hall / Classroom, Volunteer team');
    const variationSeed = String(req.body?.variationSeed || Date.now());
    const language = req.body?.language === 'ml' ? 'ml' : 'en';

    const focusLabelMap: Record<string, string> = {
      brain_science: 'Dopamine, Stress & Brain Resilience',
      peer_refusal: 'Confidence & Peer-Pressure Refusal Moves',
      stress_coping: 'Exam Stress & Healthy Coping Alternatives',
      family_listening: 'Parent–Youth Listening Without Stigma',
      custom: topic,
    };
    const focusLabel = focusLabelMap[focusArea] || topic;

    const buildFallbackCommunity = () => {
      const m1End = Math.max(1, Math.round(durationMinutes * 0.2));
      const m2End = Math.max(m1End + 1, Math.round(durationMinutes * 0.7));
      return {
        title: `${topic} (${durationMinutes}-Min ${institutionType.replace('_', ' ')} Session)`,
        objective: `Deliver a clear, ${tone}, zero-shame ${durationMinutes}-minute session on "${topic}" focusing on ${focusLabel} for ${audience} in ${district}.`,
        speechOutline: [
          {
            sectionTitle: 'Opening Hook & Relatable Question',
            timeMarker: `0:00 – ${m1End}:00`,
            talkingPoints: `Open with a quick show-of-hands question on stress or social pressure rather than lecturing. Establish psychological safety immediately.`,
            scriptExcerpt:
              language === 'ml'
                ? `"എല്ലാവർക്കും നമസ്കാരം. ഇന്ന് '${topic}' എന്ന വിഷയത്തെക്കുറിച്ച് നമ്മൾ ഭയപ്പെടുത്തിക്കൊണ്ടല്ല, ശാസ്ത്രീയമായും ലളിതമായും സംസാരിക്കാൻ പോവുകയാണ്. സമ്മർദ്ദം വരുമ്പോൾ നമ്മുടെ തലച്ചോറ് എങ്ങനെയാണ് പ്രവർത്തിക്കുന്നത്?"`
                : `"Good morning everyone. Today in our ${durationMinutes} minutes together on '${topic}', we are skipping fear-lectures and looking directly at how the human brain handles pressure, belonging, and smart choices."`,
          },
          {
            sectionTitle: `Core Focus: ${focusLabel}`,
            timeMarker: `${m1End}:00 – ${m2End}:00`,
            talkingPoints: `Break down the science clearly: why quick chemical shortcuts lower natural baseline drive, and how 10–15 minute urge waves or calm refusal lines protect independence.`,
            scriptExcerpt:
              language === 'ml'
                ? `"ഏതൊരു ശീലവും തുടങ്ങുന്നത് സമ്മർദ്ദത്തിൽ നിന്നോ കൂട്ടുകാരുടെ നിർബന്ധത്തിൽ നിന്നോ ആണ്. എന്നാൽ 'വേണ്ട' എന്ന് ഉറപ്പോടെയും സൗമ്യതയോടെയും പറയാൻ പഠിക്കുന്നത് നമ്മുടെ ആത്മവിശ്വാസം വർദ്ധിപ്പിക്കും."`
                : `"Think of cravings or social dares like a 15-minute ocean wave. When you understand ${focusLabel}, you realize you don't need to fight every thought—you only need one practical 10-second exit move and one real stress outlet."`,
          },
          {
            sectionTitle: 'Actionable Takeaway & Helpline Commitment',
            timeMarker: `${m2End}:00 – ${durationMinutes}:00`,
            talkingPoints: `Give one concrete daily action and display Kerala Vimukthi (14405) openly as confidential care—not punishment.`,
            scriptExcerpt:
              language === 'ml'
                ? `"നിങ്ങൾക്കോ നിങ്ങളുടെ പ്രിയപ്പെട്ടവർക്കോ എപ്പോൾ സഹായം വേണമെങ്കിലും 14405 (വിമുക്തി) എന്ന സൗജന്യ നമ്പറിൽ പൂർണ്ണ രഹസ്യ സ്വഭാവത്തോടെ വിളിക്കാം. നന്ദി."`
                : `"Before we close today: save 14405 (Kerala Vimukthi 24/7 confidential helpline) in your phone—not out of fear, but because real community strength means knowing where safe help lives. Thank you."`,
          },
        ],
        steps: [
          `Confirm the ${durationMinutes}-minute time slot and cue interactive audience questions around "${topic}".`,
          `Pair the timed speech above with a 3-minute live Peer-Pressure Refusal or Myth-vs-Fact prompt.`,
          `Display Vimukthi 14405 & DISHA 1056 slides and gather anonymous topic feedback for ${district} follow-up.`,
        ],
        volunteerRoles: [
          'Lead Speaker / Facilitator',
          'Timekeeper & Q&A Coordinator',
          'Helpline & Feedback Card Volunteer',
        ],
        source: 'fallback',
      };
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(buildFallbackCommunity());
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate a fresh, deliver-ready community prevention speech and execution kit.
Topic: "${topic}"
Exact Duration: ${durationMinutes} minutes
Primary Focus: ${focusLabel}
Delivery Tone: ${tone}
Institution Type: ${institutionType}
District: ${district}
Audience: ${audience}
Available Resources: ${resources}
Language: ${language === 'ml' ? 'Malayalam' : 'English'}
Freshness Variation Seed: ${variationSeed} (make examples, opening hook, and phrasing distinct and directly tailored to "${topic}" and "${durationMinutes} minutes")`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are ClearPath AI Speech & Community Action Architect. Write clear, respectful, engaging speeches and practical campaign plans for Kerala schools, colleges, NGOs, and civic forums. Avoid lecturing or clichés. Break the speech into timed sections matching the requested durationMinutes, including ready-to-speak scriptExcerpt lines, concise talkingPoints, practical steps, and volunteerRoles. Always reference confidential helpline 14405 constructively in closing.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              objective: { type: Type.STRING },
              speechOutline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sectionTitle: { type: Type.STRING },
                    timeMarker: { type: Type.STRING },
                    talkingPoints: { type: Type.STRING },
                    scriptExcerpt: { type: Type.STRING },
                  },
                  required: ['sectionTitle', 'timeMarker', 'talkingPoints', 'scriptExcerpt'],
                },
              },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              volunteerRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['title', 'objective', 'speechOutline', 'steps', 'volunteerRoles'],
          },
        },
      }), 8000);
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini community error:', err);
      return res.json(buildFallbackCommunity());
    }
  });

  // 5b. 18+ Verified Objective Substance Science Lookup
  app.post('/api/ai/substance-info', async (req, res) => {
    const query = String(req.body?.query || '').trim();
    const language = req.body?.language === 'ml' ? 'ml' : 'en';
    const verifiedAdult = Boolean(req.body?.verifiedAdult);

    if (!verifiedAdult) {
      return res.status(403).json({ error: '18+ age verification is required for substance pharmacology lookup.' });
    }
    if (!query) {
      return res.status(400).json({ error: 'Please provide a substance name.' });
    }

    const ai = getGeminiClient();
    const encodedWiki = encodeURIComponent(query.replace(/\s+/g, '_'));
    const fallbackResult = {
      name: query,
      substanceClass: 'Psychoactive Compound (Educational Reference)',
      activeMechanism:
        'Psychoactive substances cross the blood-brain barrier and alter synaptic neurotransmitter signaling (such as dopamine, GABA, serotonin, or glutamate), shifting nervous system excitation or inhibition.',
      brainEffects:
        'Repeated exposure drives homeostatic receptor adaptation (tolerance), altered prefrontal executive control, and heightened stress reactivity during withdrawal.',
      shortTermEffects: [
        'Acute shifts in heart rate, blood pressure, perception, or motor coordination',
        'Impaired judgment and disrupted sleep architecture',
      ],
      longTermEffects: [
        'Progressive tolerance and potential physical or psychological dependence',
        'Cardiovascular, hepatic, respiratory, or neurocognitive strain depending on compound class',
      ],
      overdoseWarningSigns: [
        'Difficulty breathing, extreme confusion, seizures, chest pain, or unresponsiveness',
        'Call emergency 112 or Kerala Vimukthi 14405 immediately if toxic distress occurs',
      ],
      wikipediaUrl: `https://en.wikipedia.org/wiki/Special:Search?search=${encodedWiki}`,
      evidenceSource: 'WHO & NIDA Pharmacology Educational Standards',
      source: 'fallback',
    };

    if (!ai) {
      return res.json(fallbackResult);
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Provide a strictly objective, peer-reviewed pharmacological and neurobiological summary for an adult (18+) educational query.
Substance queried: "${query}"
Language: ${language === 'ml' ? 'Malayalam' : 'English'}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a clinical pharmacology encyclopedia for 18+ adult learners, medical students, and educators. Provide strictly factual, non-contradictory, zero-moralizing medical science: classification, receptor/neurotransmitter mechanism, brain impact, short-term effects, long-term health effects, emergency overdose signs, and a direct English Wikipedia URL if well-known (or Wikipedia search URL). Never provide synthesis, sourcing, or consumption instructions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              substanceClass: { type: Type.STRING },
              activeMechanism: { type: Type.STRING },
              brainEffects: { type: Type.STRING },
              shortTermEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
              longTermEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
              overdoseWarningSigns: { type: Type.ARRAY, items: { type: Type.STRING } },
              wikipediaUrl: { type: Type.STRING },
              evidenceSource: { type: Type.STRING },
            },
            required: [
              'name',
              'substanceClass',
              'activeMechanism',
              'brainEffects',
              'shortTermEffects',
              'longTermEffects',
              'overdoseWarningSigns',
              'wikipediaUrl',
              'evidenceSource',
            ],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini substance-info error:', err);
      return res.json(fallbackResult);
    }
  });

  // 6. Deep-Dive Scientific Assessment inside Early Support Navigator
  app.post('/api/ai/deep-assess', async (req, res) => {
    const language = req.body?.language === 'ml' ? 'ml' : 'en';
    const answers = req.body?.answers || {};

    // Evidence-inspired non-diagnostic composite calculation
    const freqScore = Number(answers.frequency ?? 1); // 0..4
    const cravingScore = Number(answers.cravingIntensity ?? 1); // 0..4
    const sleepScore = Number(answers.sleepImpact ?? 1); // 0..4
    const controlScore = Number(answers.controlDifficulty ?? 1); // 0..4
    const escapeScore = Number(answers.stressEscape ?? 1); // 0..4
    const socialScore = Number(answers.socialTriggers ?? 1); // 0..4
    const durationScore = Number(answers.durationMonths ?? 1); // 0..4
    const readinessScore = Number(answers.readinessScore ?? 3); // 1..4

    const rawReliance = Math.round(
      ((freqScore + cravingScore + sleepScore + controlScore + escapeScore + socialScore + durationScore) / 28) * 100
    );
    const relianceScore = Math.max(8, Math.min(96, rawReliance));

    // Neuroplasticity-grounded recovery possibility increases with readiness & lower chronic severity
    const baseReversibility = 96 - Math.round(relianceScore * 0.22) + readinessScore * 2;
    const recoveryPossibilityPct = Math.max(74, Math.min(98, baseReversibility));

    const patternLevel =
      relianceScore >= 72
        ? 'Elevated Clinical Priority'
        : relianceScore >= 48
        ? 'Structured Habit Loop'
        : relianceScore >= 24
        ? 'Emerging Stress-Cue Pattern'
        : 'Early Preventive Awareness';

    const buildFallbackSolutions = () => {
      const solutions: { label: string; tabKey: string; targetRole: string; reason: string }[] = [];
      if (cravingScore >= 2 || controlScore >= 2) {
        solutions.push({
          label: language === 'ml' ? 'Urge Wave & Go/No-Go ഗെയിമുകൾ' : 'Urge Wave Rider & Impulse Shield',
          tabKey: 'games',
          targetRole: 'personal',
          reason:
            language === 'ml'
              ? 'പെട്ടെന്നുള്ള പ്രലോഭനങ്ങളെ 90 സെക്കൻഡിനുള്ളിൽ മറികടക്കാൻ തലച്ചോറിനെ പരിശീലിപ്പിക്കുന്നു.'
              : 'Retrains prefrontal impulse braking and rides out acute 90-second craving waves.',
        });
      }
      if (escapeScore >= 2 || sleepScore >= 2) {
        solutions.push({
          label: language === 'ml' ? 'ദൈനംദിന ട്രിഗർ ജേർണൽ' : 'AI Daily Check-In & Trigger Log',
          tabKey: 'dailylog',
          targetRole: 'personal',
          reason:
            language === 'ml'
              ? 'ഉറക്കക്കുറവും സമ്മർദ്ദവും എങ്ങനെ പ്രലോഭനമായി മാറുന്നു എന്ന് കണ്ടെത്താം.'
              : 'Maps evening stress and sleep deficit patterns before they trigger automatic habits.',
        });
      }
      solutions.push({
        label: language === 'ml' ? 'ആശ്വാസ വ്യായാമങ്ങൾ' : 'Guided Coping & Grounding Tools',
        tabKey: 'tools',
        targetRole: 'personal',
        reason:
          language === 'ml'
            ? 'ശ്വസന വ്യായാമങ്ങളിലൂടെ നാഡീവ്യൂഹത്തെ ശാന്തമാക്കുന്നു.'
            : 'Stabilizes autonomic restlessness within 3 minutes using somatic resets.',
      });
      if (socialScore >= 2) {
        solutions.push({
          label: language === 'ml' ? 'പിയർ-പ്രഷർ സിമുലേറ്റർ' : 'Peer-Pressure Decision Simulator',
          tabKey: 'interactive',
          targetRole: 'learner',
          reason:
            language === 'ml'
              ? 'സുഹൃത്തുക്കളുടെ സമ്മർദ്ദത്തെ ആത്മവിശ്വാസത്തോടെ നിരസിക്കാൻ പരിശീലിക്കാം.'
              : 'Rehearse confident social exit scripts before encountering group triggers.',
        });
      }
      if (relianceScore >= 60) {
        solutions.push({
          label: language === 'ml' ? 'അംഗീകൃത ചികിത്സാ കേന്ദ്രങ്ങൾ' : 'Verified Kerala Clinics & 14405',
          tabKey: 'support',
          targetRole: 'personal',
          reason:
            language === 'ml'
              ? 'സൗജന്യവും സ്വകാര്യവുമായ സർക്കാർ കൗൺസിലിംഗ് സഹായം ലഭ്യമാണ്.'
              : 'Connect directly with confidential Vimukthi de-addiction units in your district.',
        });
      }
      return solutions.slice(0, 4);
    };

    const deterministicPayload = {
      patternLevel,
      relianceScore,
      recoveryPossibilityPct,
      neurobiologySummary:
        language === 'ml'
          ? `നിലവിലെ സൂചിക (${relianceScore}/100) കാണിക്കുന്നത് ഇത് ${patternLevel} ഘട്ടത്തിലാണെന്നാണ്. 14 മുതൽ 90 ദിവസത്തെ സ്ഥിരമായ ദിനചര്യയിലൂടെ തലച്ചോറിലെ ഡോപമിൻ സന്തുലിതാവസ്ഥ സ്വാഭാവികമായി വീണ്ടെടുക്കാൻ ${recoveryPossibilityPct}% സാധ്യതയുണ്ട്.`
          : `Your answers indicate a ${patternLevel} index (${relianceScore}/100). Because adult and youth dopamine pathways adapt rapidly through neuroplasticity, consistent daily structure gives you a ${recoveryPossibilityPct}% realistic outlook for regaining steady control.`,
      timelineEstimate:
        relianceScore >= 65
          ? 'Weeks 1–2: Physical & sleep stabilization with clinical support · Weeks 3–8: Dopamine baseline rebound'
          : 'Days 1–14: Craving wave reduction · Weeks 3–6: Stronger automatic prefrontal control',
      inAppSolutions: buildFallbackSolutions(),
      communityRecommendation:
        readinessScore >= 3
          ? language === 'ml'
            ? 'നിങ്ങൾ തയ്യാറാകുമ്പോൾ പേഴ്സണൽ ആക്ഷൻ ക്വസ്റ്റുകൾ വഴി ചെറിയ പോസിറ്റീവ് മാറ്റങ്ങളിൽ പങ്കാളിയാകാം (പൂർണ്ണമായും ഓപ്ഷണൽ).'
            : 'Optional: Pair personal progress with anonymous Personal Action Quests or campus prevention modules once steady.'
          : language === 'ml'
          ? 'ഇപ്പോൾ സ്വകാര്യമായ പേഴ്സണൽ ജേർണി ടൂളുകളിൽ മാത്രം ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.'
          : 'Focus quietly on private daily grounding inside Personal Journey first — zero obligation to join group spaces.',
      source: 'fallback',
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(deterministicPayload);
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze this confidential behavioral pattern self-assessment in ${language === 'ml' ? 'Malayalam' : 'English'}:
Calculated reliance score: ${relianceScore}/100 (${patternLevel}).
Estimated neuroplastic recovery possibility: ${recoveryPossibilityPct}%.
Dimension breakdown (0=minimal, 4=high): frequency=${freqScore}, cravings=${cravingScore}, sleepDisruption=${sleepScore}, difficultyStopping=${controlScore}, stressEscape=${escapeScore}, peerEnvironment=${socialScore}, duration=${durationScore}, readinessToRebuild=${readinessScore}/4.
Prescribe 3 to 4 concrete in-app ClearPath AI tools using ONLY valid pairs:
- ("personal", "games") Cognitive Lab 8 brain games
- ("personal", "tools") Guided Coping & Grounding
- ("personal", "dailylog") AI Check-in & Trigger Journal
- ("personal", "rebuild") Habit Challenges & Rebuild Goals
- ("personal", "support") Kerala Care Map & 14405
- ("learner", "interactive") Prevention Decision Simulator
- ("supporter", "talk") Calm Conversation Prep`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are ClearPath AI Guide. Explain clearly in simple, friendly everyday words where the person stands—no medical diagnosis, no stigma, no hard jargon. Focus on practical next steps, realistic progress timelines, and helpful tools inside ClearPath or verified Kerala helplines.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              neurobiologySummary: { type: Type.STRING },
              timelineEstimate: { type: Type.STRING },
              communityRecommendation: { type: Type.STRING },
              inAppSolutions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    tabKey: { type: Type.STRING },
                    targetRole: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['label', 'tabKey', 'targetRole', 'reason'],
                },
              },
            },
            required: ['neurobiologySummary', 'timelineEstimate', 'communityRecommendation', 'inAppSolutions'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({
        ...deterministicPayload,
        ...parsed,
        patternLevel,
        relianceScore,
        recoveryPossibilityPct,
        source: 'gemini',
      });
    } catch (err) {
      console.error('Gemini deep-assess error:', err);
      return res.json(deterministicPayload);
    }
  });

  // 7. ClearPath AI Personal Intelligence Companion (Cross-Role Adaptive Coach)
  app.post('/api/ai/companion', async (req, res) => {
    const role = String(req.body?.role || 'personal');
    const question = String(req.body?.question || '').trim();
    const language = req.body?.language === 'ml' ? 'ml' : 'en';
    const ctx = req.body?.contextSummary || {};
    const person =
      req.body?.personalization && typeof req.body.personalization === 'object' ? req.body.personalization : {};
    const personName = String(person.name || '').trim();
    const topGoal = String(person.topGoal || '').trim();

    const buildFallbackCompanion = () => {
      const hiName = personName ? `${personName}, ` : '';
      if (role === 'supporter') {
        return {
          greeting: language === 'ml' ? 'സപ്പോർട്ടർ സഹായി' : personName ? `Care Guide for ${personName}` : 'Supporter Care Companion',
          dailyInsight:
            language === 'ml'
              ? `${hiName}നിങ്ങൾ ${ctx.plansCount || 0} സഹായ പദ്ധതികളും ${ctx.reflectionsCount || 0} കുറിപ്പുകളും തയ്യാറാക്കി. ശാന്തമായ സംഭാഷണങ്ങളാണ് ഏറ്റവും നല്ലത്.`
              : `${hiName}you have ${ctx.plansCount || 0} saved care plans and ${ctx.reflectionsCount || 0} private notes. Calm listening works much better than pressure.`,
          missionSuggestion: 'Open Talk Coach to pick one gentle opening line before your next talk.',
          reply: question
            ? 'Start with one kind "I noticed..." line instead of lecturing. Keep Vimukthi 14405 nearby for free help.'
            : 'Ask me how to start a calm talk, notice early signs, or find free local help.',
          contextualActions: [
            { label: 'AI Talk Coach', role: 'supporter', tab: 'talk' },
            { label: 'Kerala Care Map', role: 'supporter', tab: 'support' },
          ],
          source: 'fallback',
        };
      }
      if (role === 'learner') {
        return {
          greeting: language === 'ml' ? 'ലേണിംഗ് സഹായി' : personName ? `Study Guide for ${personName}` : 'Brain Science & Prevention Coach',
          dailyInsight:
            language === 'ml'
              ? `${hiName}ഇതുവരെ ${ctx.lessonsDone || 0} പാഠങ്ങളും ${ctx.quizzesCount || 0} ക്വിസുകളും പൂർത്തിയാക്കി.`
              : `${hiName}you finished ${ctx.lessonsDone || 0} short lessons and ${ctx.quizzesCount || 0} quizzes. Small daily reading builds lasting confidence.`,
          missionSuggestion: 'Try one quick peer-pressure choice in Scenarios or ask AI about any topic.',
          reply: question
            ? 'Drugs trigger fast fake dopamine spikes that dull normal joy for a while. Real sports, sleep, and friends restore healthy drive.'
            : 'Ask any brain science question, test a peer-pressure reply, or browse topics.',
          contextualActions: [
            { label: 'Decision Simulator', role: 'learner', tab: 'interactive' },
            { label: 'Explore Topics', role: 'learner', tab: 'pathways' },
          ],
          source: 'fallback',
        };
      }
      if (role === 'community') {
        return {
          greeting: language === 'ml' ? 'കമ്മ്യൂണിറ്റി സഹായി' : personName ? `Action Guide for ${personName}` : 'Community Action Companion',
          dailyInsight:
            language === 'ml'
              ? `${hiName}${ctx.programmesCount || 0} പദ്ധതികളും ${ctx.eventsCount || 0} ഇവന്റുകളും സജീവമാണ്. ചെറിയ ഗ്രൂപ്പ് സെഷനുകളാണ് ഫലപ്രദം.`
              : `${hiName}your plan tracks ${ctx.programmesCount || 0} programmes and ${ctx.eventsCount || 0} sessions. Small interactive workshops beat scary lectures.`,
          missionSuggestion: 'Check District Gaps or generate a short campus workshop outline.',
          reply: question
            ? 'Pair a 15-minute group activity with anonymous question cards so students feel safe asking real doubts.'
            : 'Ask how to plan a school drive, involve families kindly, or reach uncovered districts.',
          contextualActions: [
            { label: 'AI Action Generator', role: 'community', tab: 'generator' },
            { label: 'Gap Detector', role: 'community', tab: 'gaps' },
          ],
          source: 'fallback',
        };
      }
      return {
        greeting: language === 'ml' ? 'പേഴ്സണൽ സഹായി' : personName ? `Personal Guide for ${personName}` : 'Personal Intelligence Companion',
        dailyInsight:
          language === 'ml'
            ? `${hiName}നിങ്ങൾ ${ctx.checkIns || 0} ചെക്ക്-ഇന്നുകളും ${ctx.gamesPlayed || 0} ഗെയിം സെഷനുകളും ചെയ്തു. ചെറിയ സ്ഥിരതയാണ് ഏറ്റവും വലിയ വിജയം.`
            : `${hiName}based on your private vault (${ctx.checkIns || 0} check-ins, ${ctx.gamesPlayed || 0} focus games)${topGoal ? ` and goal "${topGoal}"` : ''}, short calm breaks help most.`,
        missionSuggestion:
          Number(ctx.checkIns || 0) === 0
            ? 'Take a 60-second Care Check in Early Support Navigator.'
            : 'Play one 2-minute focus reset or log a quiet check-in.',
        reply: question
          ? 'Cravings usually rise and fade in 15 to 20 minutes. Drink cold water, step outside, or try Urge Wave Rider.'
          : 'Ask me privately about cravings, sleep recovery, or how any tool works.',
        contextualActions: [
          { label: 'Deep-Dive Navigator', role: 'personal', tab: 'navigator' },
          { label: 'Cognitive Lab (8 Games)', role: 'personal', tab: 'games' },
        ],
        source: 'fallback',
      };
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(buildFallbackCompanion());
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Active Role: ${role}
Preferred Language: ${language === 'ml' ? 'Malayalam' : 'English'}
Personalization Details: ${JSON.stringify(person)}
Real Local Workspace Context (do NOT invent extra stats): ${JSON.stringify(ctx)}
User Prompt: "${question || 'Give a brief personalized daily insight and next mission suggestion based strictly on my real activity above.'}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are the single shared ClearPath AI Assistant across all roles (personal, supporter, learner, community). Always write in clear, simple everyday words that take zero effort to read (max 2 short sentences per field). Personalize naturally with user name/goal if given, adapt strictly to real counts, and never diagnose. Valid contextualActions role/tab pairs: ("personal","navigator"), ("personal","games"), ("personal","tools"), ("personal","dailylog"), ("personal","ecosystem"), ("supporter","talk"), ("supporter","plan"), ("supporter","support"), ("learner","interactive"), ("learner","pathways"), ("learner","certificate"), ("community","generator"), ("community","gaps"), ("community","exchange").',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              greeting: { type: Type.STRING },
              dailyInsight: { type: Type.STRING },
              missionSuggestion: { type: Type.STRING },
              reply: { type: Type.STRING },
              contextualActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    role: { type: Type.STRING },
                    tab: { type: Type.STRING },
                  },
                  required: ['label', 'role', 'tab'],
                },
              },
            },
            required: ['greeting', 'dailyInsight', 'missionSuggestion', 'reply', 'contextualActions'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini companion error:', err);
      return res.json(buildFallbackCompanion());
    }
  });

  // 8. Role-Aware All-Kerala Care Map AI Guided Center Matcher (Role 01 & Role 02)
  app.post('/api/ai/care-match', async (req, res) => {
    const role = req.body?.role === 'supporter' ? 'supporter' : 'personal';
    const district = String(req.body?.district || 'All Districts').trim();
    const situation = String(req.body?.situation || '').trim();
    const urgency = String(req.body?.urgency || 'soon').trim();
    const careSetting = String(req.body?.careSetting || 'any').trim();
    const preferredLanguage = req.body?.preferredLanguage === 'ml' ? 'ml' : 'en';
    const language = req.body?.language === 'ml' ? 'ml' : 'en';

    const deriveFallbackMatch = () => {
      const isUrgent = urgency === 'urgent' || situation.includes('withdrawal') || situation.includes('emergency');
      const isDetox = careSetting === 'inpatient_detox' || situation.includes('withdrawal') || situation.includes('relapse');
      const isFamilyFirst = role === 'supporter' && (careSetting === 'family_guidance' || situation.includes('refusal') || situation.includes('orientation'));

      let recommendedNeedFocus: 'urgent_helpline' | 'medical_detox' | 'counselling' | 'family_guidance' | 'rehab_aftercare' = 'counselling';
      if (isUrgent || careSetting === 'helpline') {
        recommendedNeedFocus = 'urgent_helpline';
      } else if (isDetox) {
        recommendedNeedFocus = 'medical_detox';
      } else if (isFamilyFirst) {
        recommendedNeedFocus = 'family_guidance';
      } else if (situation.includes('aftercare')) {
        recommendedNeedFocus = 'rehab_aftercare';
      }

      const preferGovt = careSetting !== 'private_optional';
      const districtText = district === 'All Districts' ? 'your nearest Kerala district' : district;

      if (role === 'supporter') {
        return {
          claritySummary:
            language === 'ml'
              ? `${districtText} മേഖലയിൽ നിങ്ങളുടെ കുടുംബ സാഹചര്യത്തിന് ഏറ്റവും അനുയോജ്യമായ പ്രൊഫഷണൽ കെയർ തിരഞ്ഞെടുത്തിരിക്കുന്നു. തർക്കങ്ങളില്ലാതെ പ്രൊഫഷണൽ സഹായം തേടാം.`
              : `Based on your supporter answers in ${districtText}, this care level fits best right now—giving you professional backup before asking your loved one to agree to everything at once.`,
          whyThisFits:
            language === 'ml'
              ? 'പ്രിയപ്പെട്ടവരുമായി സമ്മർദ്ദമില്ലാതെ സംസാരിക്കാനും വിദഗ്ധ ഡോക്ടർമാരുടെയോ കൗൺസിലർമാരുടെയോ ഉപദേശം നേടാനും ഇത് സഹായിക്കും.'
              : `Matched for a ${situation.replace(/_/g, ' ') || 'family support'} situation (${urgency === 'urgent' ? 'immediate priority' : 'steady planning'}) with confidential family counseling.`,
          whatItProvides:
            recommendedNeedFocus === 'medical_detox'
              ? [
                  'Safe medical assessment & supervised withdrawal management',
                  'Family orientation so relatives know what to expect',
                  'Free or Govt.-subsidized outpatient & inpatient Vimukthi support',
                ]
              : recommendedNeedFocus === 'urgent_helpline'
              ? [
                  '24/7 confidential telephonic triage (Vimukthi 14405)',
                  'Immediate advice for family members when someone refuses help',
                  'Direct linkage to nearest district government de-addiction unit',
                ]
              : [
                  'Confidential family guidance without stigma or legal risk',
                  'Motivational counselling sessions to build readiness safely',
                  'Scheduled outpatient follow-up options in Malayalam & English',
                ],
          recommendedNeedFocus,
          preferGovt,
          nextBestStep:
            isUrgent
              ? 'Call Kerala Vimukthi 14405 now for immediate 24/7 triage, and save an appointment date below.'
              : 'Pick one recommended center below, save the OPD visit date to your Supporter Calendar, and note 2 questions to ask.',
          needsEmergencyHelp: isUrgent,
          source: 'fallback',
        };
      }

      return {
        claritySummary:
          language === 'ml'
            ? `${districtText} ജില്ലയിൽ നിങ്ങളുടെ ആവശ്യത്തിന് അനുയോജ്യമായ സ്വകാര്യ കെയർ കേന്ദ്രം കണ്ടെത്തിയിട്ടുണ്ട്. ഭയപ്പെടാതെ സുരക്ഷിതമായി ബന്ധപ്പെടാം.`
            : `Based on your answers for ${districtText}, this verified support level matches what you need right now—confidential, non-judgmental, and structured around your comfort.`,
        whyThisFits:
          language === 'ml'
            ? 'നിങ്ങളുടെ ഇപ്പോഴത്തെ അവസ്ഥയും സമയവും അനുസരിച്ച് സ്വകാര്യ കൗൺസിലിംഗും മെഡിക്കൽ സഹായവും ഇവിടെ ലഭിക്കും.'
            : `Selected for "${situation.replace(/_/g, ' ') || 'personal clarity'}" (${urgency === 'urgent' ? 'fast access' : 'calm step-by-step support'}).`,
        whatItProvides:
          recommendedNeedFocus === 'medical_detox'
            ? [
                'Safe physician-supervised medical evaluation & craving stabilization',
                'Private outpatient or short-stay Vimukthi de-addiction support',
                'Zero-judgment confidentiality & essential free/subsidized medicines',
              ]
            : recommendedNeedFocus === 'urgent_helpline'
            ? [
                '24/7 confidential voice triage in Malayalam & English (14405)',
                'Step-by-step guidance for sudden urges or difficult nights',
                'Direct referral to your nearest district Vimukthi clinic',
              ]
            : [
                'Confidential 1-on-1 behavioural counseling & CBT relapse tools',
                'Practical sleep, stress & craving management check-ins',
                'Flexible OPD hours without disrupting family or study privacy',
              ],
        recommendedNeedFocus,
        preferGovt,
        nextBestStep:
          isUrgent
            ? 'Call 14405 right now or visit the highlighted district center emergency OPD today.'
            : 'Click "Locate on Map" or "Care Relay" on the recommended center below to prepare a private call sheet.',
        needsEmergencyHelp: isUrgent,
        source: 'fallback',
      };
    };

    const fallback = deriveFallbackMatch();
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(fallback);
    }

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Match verified Kerala de-addiction and counseling services cleanly without overwhelming the user.
Active Role: ${role === 'supporter' ? 'Role 02 Supporter (family/parent/partner/friend helping someone)' : 'Role 01 Personal (individual seeking help for themselves)'}
Kerala District Selected: ${district}
Current Situation / Need: ${situation}
Urgency: ${urgency}
Care Setting Preference: ${careSetting}
Preferred Language at Center: ${preferredLanguage === 'ml' ? 'Malayalam' : 'English'}
Response Language: ${language === 'ml' ? 'Malayalam' : 'English'}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are ClearPath AI Support Finder for Kerala, India. Use calm, simple everyday words—no clinical jargon or blame. Set recommendedNeedFocus to EXACTLY one of: urgent_helpline, medical_detox, counselling, family_guidance, rehab_aftercare. Keep claritySummary and whyThisFits to 1-2 plain sentences, provide 3 short everyday bullet strings in whatItProvides, and 1 easy nextBestStep mentioning Kerala Vimukthi 14405 or local clinics.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              claritySummary: { type: Type.STRING },
              whyThisFits: { type: Type.STRING },
              whatItProvides: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedNeedFocus: { type: Type.STRING },
              preferGovt: { type: Type.BOOLEAN },
              nextBestStep: { type: Type.STRING },
              needsEmergencyHelp: { type: Type.BOOLEAN },
            },
            required: [
              'claritySummary',
              'whyThisFits',
              'whatItProvides',
              'recommendedNeedFocus',
              'preferGovt',
              'nextBestStep',
              'needsEmergencyHelp',
            ],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...fallback, ...parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini care-match error:', err);
      return res.json(fallback);
    }
  });

  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (reqUrl.pathname !== '/ws') {
        socket.destroy();
        return;
      }
      const token = String(reqUrl.searchParams.get('token') || '').trim();
      const db = loadDb();
      const session = db.sessions.find(s => s.token === token);
      if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      const user = db.users.find(u => u.id === session.userId);
      if (!user || user.verificationStatus === 'suspended') {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, ws => {
        let userSockets = wsClientsByUserId.get(user.id);
        if (!userSockets) {
          userSockets = new Set();
          wsClientsByUserId.set(user.id, userSockets);
        }
        userSockets.add(ws);
        ws.send(
          JSON.stringify({
            event: 'ws:connected',
            userId: user.id,
            role: user.role,
            timestamp: new Date().toISOString(),
          })
        );

        ws.on('message', raw => {
          try {
            const data = JSON.parse(String(raw || '{}'));
            if (data?.type === 'ping') {
              ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
              return;
            }
            if (data?.type === 'chat:typing' && typeof data.targetUserId === 'string') {
              const latestDb = loadDb();
              const hasActiveConn = latestDb.connections.some(
                c =>
                  c.status === 'accepted' &&
                  ((c.clientId === user.id && c.therapistId === data.targetUserId) ||
                    (c.therapistId === user.id && c.clientId === data.targetUserId))
              );
              if (hasActiveConn) {
                broadcastToSockets({
                  event: 'chat:typing',
                  payload: {
                    fromUserId: user.id,
                    connectionId: data.connectionId,
                    isTyping: Boolean(data.isTyping),
                  },
                  targetUserIds: [data.targetUserId],
                });
              }
            }
          } catch {
            // ignore malformed frames
          }
        });

        ws.on('close', () => {
          const set = wsClientsByUserId.get(user.id);
          if (set) {
            set.delete(ws);
            if (set.size === 0) wsClientsByUserId.delete(user.id);
          }
        });
      });
    } catch {
      socket.destroy();
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ClearPath AI server listening on http://localhost:${PORT} (HTTP + WebSocket /ws)`);
  });
}

startServer().catch(err => {
  console.error('Failed to start ClearPath AI server:', err);
  process.exit(1);
});
