import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  role: UserRole;
  currentTab: string;
}

interface ExplainerInfo {
  titleEn: string;
  titleMl: string;
  summaryEn: string;
  summaryMl: string;
  nextActionEn: string;
  nextActionMl: string;
}

const TAB_EXPLAINERS: Record<string, ExplainerInfo> = {
  // ROLE 01: PERSONAL CARE
  'personal:dashboard': {
    titleEn: 'Your Daily Home Base',
    titleMl: 'നിങ്ങളുടെ പ്രധാന പേജ്',
    summaryEn: 'See your daily mood check-in, AI reflection box, PDF report button, and quick calming tools in one quiet place.',
    summaryMl: 'ദിവസേനയുള്ള മനസ്സിൻ്റെ നില, AI വിശകലനം, PDF റിപ്പോർട്ട്, ശാന്തമാകാനുള്ള ടൂളുകൾ എന്നിവ ഒരിടത്ത് കാണാം.',
    nextActionEn: 'Write a quick note below or tap Analyze with AI to get one small step for today.',
    nextActionMl: 'താഴെ ചെറിയൊരു കുറിപ്പ് എഴുതി AI നിർദ്ദേശം നേടാം.',
  },
  'personal:navigator': {
    titleEn: 'Care Finder & Check-In',
    titleMl: 'ശരിയായ സഹായം കണ്ടെത്താം',
    summaryEn: 'Answer a few short questions to find the exact calm tool, trusted person, or verified Kerala care center for right now.',
    summaryMl: 'ലളിതമായ ചോദ്യങ്ങളിലൂടെ നിങ്ങൾക്ക് ഇപ്പോൾ ഏറ്റവും അനുയോജ്യമായ സഹായം കണ്ടെത്താം.',
    nextActionEn: 'Tap the option that matches how today feels—no diagnosis, just helpful steps.',
    nextActionMl: 'നിങ്ങളുടെ ഇപ്പോഴത്തെ അവസ്ഥയ്ക്ക് ചേരുന്ന ഉത്തരം തിരഞ്ഞെടുക്കുക.',
  },
  'personal:report': {
    titleEn: 'My Private Summary & Report',
    titleMl: 'എൻ്റെ സ്വകാര്യ റിപ്പോർട്ട്',
    summaryEn: 'Review your timeline, strengths, and logs, and export a clean PDF report only if and when you want one.',
    summaryMl: 'നിങ്ങളുടെ പുരോഗതി കണ്ട് സ്വന്തം ആവശ്യത്തിനോ ഡോക്ടറെ കാണിക്കാനോ PDF റിപ്പോർട്ട് ഉണ്ടാക്കാം.',
    nextActionEn: 'Choose what sections to include and download your PDF copy.',
    nextActionMl: 'വേണ്ട വിഭാഗങ്ങൾ തിരഞ്ഞെടുത്ത് PDF ഡൗൺലോഡ് ചെയ്യുക.',
  },
  'personal:professional': {
    titleEn: 'Therapist & Privacy Switches',
    titleMl: 'തെറാപ്പിസ്റ്റ് & സ്വകാര്യത',
    summaryEn: 'Pick an approved therapist or enter an invite code, turn on only the privacy switches you feel comfortable sharing, and chat safely.',
    summaryMl: 'നിങ്ങൾ തിരഞ്ഞെടുക്കുന്ന തെറാപ്പിസ്റ്റുമായി മാത്രം വേണ്ട വിവരങ്ങൾ പങ്കുവെക്കാനും സംസാരിക്കാനും ഇവിടെ സാധിക്കും.',
    nextActionEn: 'Open Step 1 to connect with a therapist or toggle your privacy switches.',
    nextActionMl: 'ഒരു തെറാപ്പിസ്റ്റിനെ തിരഞ്ഞെടുക്കുകയോ സ്വകാര്യത ക്രമീകരിക്കുകയോ ചെയ്യുക.',
  },
  'personal:therapist': {
    titleEn: 'Therapist & Privacy Switches',
    titleMl: 'തെറാപ്പിസ്റ്റ് & സ്വകാര്യത',
    summaryEn: 'Pick an approved therapist, control exact privacy switches, and chat securely.',
    summaryMl: 'നിങ്ങൾ തിരഞ്ഞെടുക്കുന്ന തെറാപ്പിസ്റ്റുമായി സുരക്ഷിതമായി സംസാരിക്കാം.',
    nextActionEn: 'Pick a verified therapist or enter your code.',
    nextActionMl: 'ഒരു തെറാപ്പിസ്റ്റിനെ തിരഞ്ഞെടുക്കുക.',
  },
  'personal:dailylog': {
    titleEn: 'Daily Journal & Mood Notes',
    titleMl: 'സ്വകാര്യ ദിവസക്കുറിപ്പ്',
    summaryEn: 'Write short or full-paragraph notes about your mood, urges, triggers, and small wins. Saved privately in your vault.',
    summaryMl: 'ഇന്നത്തെ മനസ്സിൻ്റെ നിലയും ചിന്തകളും ചെറുതായോ വിശദമായോ എഴുതി സൂക്ഷിക്കാം.',
    nextActionEn: 'Pick how you feel right now and write freely—even a full paragraph.',
    nextActionMl: 'ഇന്നത്തെ അവസ്ഥ തിരഞ്ഞെടുത്ത് മനസ്സിലുള്ളത് എഴുതുക.',
  },
  'personal:games': {
    titleEn: '2-Minute Focus Games',
    titleMl: 'ശ്രദ്ധ കൂട്ടുന്ന ഗെയിമുകൾ',
    summaryEn: 'Quick brain games that help cool down sudden cravings and steady your attention in 2 minutes.',
    summaryMl: 'പെട്ടെന്നുള്ള തോന്നലുകൾ മാറ്റി മനസ്സിന് ശ്രദ്ധ തിരിച്ചുപിടിക്കാൻ സഹായിക്കുന്ന 2 മിനിറ്റ് ഗെയിമുകൾ.',
    nextActionEn: 'Try Urge Wave Rider or Go/No-Go Shield when a craving hits.',
    nextActionMl: '2 മിനിറ്റ് ഗെയിം കളിച്ചു നോക്കൂ.',
  },
  'personal:tools': {
    titleEn: 'Calm & Grounding Tools',
    titleMl: 'ശാന്തമാകാനുള്ള ടൂളുകൾ',
    summaryEn: 'Step-by-step breathing, urge-surfing, and thought-reset exercises for tough moments.',
    summaryMl: 'സമ്മർദ്ദവും ആകുലതയും കുറയ്ക്കാൻ ഉടനടി ചെയ്യാവുന്ന ശ്വാസവ്യായാമങ്ങളും മറ്റു വഴികളും.',
    nextActionEn: 'Start the 4-7-8 Breathing Timer for 60 seconds.',
    nextActionMl: '4-7-8 ശ്വസന വ്യായാമം തുടങ്ങുക.',
  },
  'personal:rebuild': {
    titleEn: 'Daily Goals & Routine',
    titleMl: 'ലക്ഷ്യങ്ങളും ദിനചര്യയും',
    summaryEn: 'Build small, doable goals across sleep, study, work, and health without feeling overwhelmed.',
    summaryMl: 'ഉറക്കം, പഠനം, ജോലി, ആരോഗ്യം എന്നിവയ്ക്കായി ചെറിയ ലക്ഷ്യങ്ങൾ ക്രമീകരിക്കാം.',
    nextActionEn: 'Add one tiny goal for this week and check off a step.',
    nextActionMl: 'ഈ ആഴ്ചത്തേക്ക് ചെറിയൊരു ലക്ഷ്യം ചേർക്കുക.',
  },
  'personal:journey': {
    titleEn: 'Your Step-by-Step Map',
    titleMl: 'വീണ്ടെടുക്കൽ യാത്രാരേഖ',
    summaryEn: 'See how your steady small steps add up week by week.',
    summaryMl: 'ഓരോ ആഴ്ചയും നിങ്ങൾ കൈവരിക്കുന്ന മാറ്റങ്ങൾ ഇവിടെ കാണാം.',
    nextActionEn: 'Check your current stage and celebrate completed milestones.',
    nextActionMl: 'നിങ്ങളുടെ ഇപ്പോഴത്തെ ഘട്ടം പരിശോധിക്കുക.',
  },
  'personal:ecosystem': {
    titleEn: 'Quests, Triggers & Milestones',
    titleMl: 'ചലഞ്ചുകളും നാഴികക്കല്ലുകളും',
    summaryEn: 'Track daily healthy habit streaks, spot stress triggers early, and keep your achievement timeline.',
    summaryMl: 'നല്ല ശീലങ്ങളുടെ തുടർച്ചയും നേട്ടങ്ങളും ഇവിടെ രേഖപ്പെടുത്താം.',
    nextActionEn: 'Check off one healthy habit day today.',
    nextActionMl: 'ഇന്നത്തെ നല്ല ശീലം അടയാളപ്പെടുത്തുക.',
  },
  'personal:progress': {
    titleEn: 'Your Progress & Badges',
    titleMl: 'പുരോഗതിയും നേട്ടങ്ങളും',
    summaryEn: 'Track your steady days, completed goals, and quiet personal wins.',
    summaryMl: 'നിങ്ങളുടെ തുടർച്ചയായ നേട്ടങ്ങളും പൂർത്തിയാക്കിയ ലക്ഷ്യങ്ങളും കാണാം.',
    nextActionEn: 'Review your recent streak and active goals.',
    nextActionMl: 'നിങ്ങളുടെ ഇപ്പോഴത്തെ പുരോഗതി കാണുക.',
  },
  'personal:support': {
    titleEn: 'Free Local Help & Map',
    titleMl: 'സൗജന്യ സഹായ കേന്ദ്രങ്ങൾ',
    summaryEn: 'Find verified Kerala Vimukthi centers, medical college clinics, and 24/7 helplines (14405 / 112) near you.',
    summaryMl: 'കേരളത്തിലെ വിമുക്തി കേന്ദ്രങ്ങളും 24/7 ഹെൽപ്പ്‌ലൈൻ നമ്പറുകളും മാപ്പിൽ കണ്ടെത്താം.',
    nextActionEn: 'Filter by your Kerala district or tap Call 14405 anytime.',
    nextActionMl: 'നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുത്ത് അടുത്തുള്ള കേന്ദ്രങ്ങൾ കാണുക.',
  },
  'personal:calendar': {
    titleEn: 'Routine Calendar',
    titleMl: 'ദിനചര്യ കലണ്ടർ',
    summaryEn: 'Plan sleep, walks, study blocks, and support check-ins so every day has a calm structure.',
    summaryMl: 'ഉറക്കം, നടത്തം, വിശ്രമം എന്നിവ ദിവസവും കൃത്യമായി ക്രമീകരിക്കുക.',
    nextActionEn: 'Add one healthy evening routine block.',
    nextActionMl: 'ഇന്നത്തേക്ക് ഒരു നല്ല പ്രവൃത്തി കലണ്ടറിൽ ചേർക്കുക.',
  },
  'personal:guide': {
    titleEn: 'AI Chat & History',
    titleMl: 'AI ചാറ്റ് സഹായി',
    summaryEn: 'Ask brief questions anytime in plain English or Malayalam. Past chats stay saved until you clear them.',
    summaryMl: 'സംശയങ്ങൾ ലളിതമായി AI-യോട് ചോദിക്കാം; പഴയ ചാറ്റുകൾ ഇവിടെ സൂക്ഷിക്കും.',
    nextActionEn: 'Type a question or tap any saved conversation.',
    nextActionMl: 'ചോദ്യം ടൈപ്പ് ചെയ്യുകയോ പഴയ ചാറ്റ് തുറക്കുകയോ ചെയ്യുക.',
  },
  'personal:settings': {
    titleEn: 'Privacy Vault & Backup',
    titleMl: 'സ്വകാര്യത & ബാക്കപ്പ്',
    summaryEn: 'Download a backup of your private data, manage consent choices, or reset your browser vault.',
    summaryMl: 'നിങ്ങളുടെ വിവരങ്ങളുടെ ബാക്കപ്പ് എടുക്കാനും സ്വകാര്യത നിയന്ത്രിക്കാനും സാധിക്കും.',
    nextActionEn: 'Save a JSON backup copy if switching devices.',
    nextActionMl: 'ആവശ്യമെങ്കിൽ വിവരങ്ങളുടെ ബാക്കപ്പ് ഡൗൺലോഡ് ചെയ്യുക.',
  },

  // ROLE 02: SUPPORTER
  'supporter:dashboard': {
    titleEn: 'Supporter Home Base',
    titleMl: 'സഹായി പ്രധാന പേജ്',
    summaryEn: 'Manage your care plans, write long reflections, get AI insights, and download your supporter report in one calm view.',
    summaryMl: 'കെയർ പ്ലാനുകൾ, കുറിപ്പുകൾ, AI നിർദ്ദേശങ്ങൾ, PDF റിപ്പോർട്ട് എന്നിവ ഇവിടെ കാണാം.',
    nextActionEn: 'Write what happened this week or generate your supporter PDF report.',
    nextActionMl: 'ഈ ആഴ്ചയിലെ അനുഭവം കുറിക്കുകയോ പ്ലാൻ തുടങ്ങുകയോ ചെയ്യുക.',
  },
  'supporter:understand': {
    titleEn: 'Simple Signs & Guides',
    titleMl: 'ലളിതമായ വഴികാട്ടി',
    summaryEn: 'Learn early signs, why habits get stuck, and how families help effectively without arguments or blame.',
    summaryMl: 'കുറ്റപ്പെടുത്താതെ സ്നേഹത്തോടെയും അറിവോടെയും കൂടെ നിൽക്കാനുള്ള ലളിതമായ അറിവുകൾ.',
    nextActionEn: 'Read one short 3-minute family guide.',
    nextActionMl: 'ചെറിയൊരു വഴികാട്ടി വായിച്ചു തുടങ്ങുക.',
  },
  'supporter:talk': {
    titleEn: 'Calm Talk Builder',
    titleMl: 'ശാന്തമായ സംസാര സഹായി',
    summaryEn: 'Build gentle, non-judgmental opening lines before a hard conversation with a friend, child, or partner.',
    summaryMl: 'വഴക്കില്ലാതെ കരുതലോടെ സംസാരിക്കാൻ സഹായിക്കുന്ന വാചകങ്ങൾ തയ്യാറാക്കാം.',
    nextActionEn: 'Pick your relationship and save two calm opening lines.',
    nextActionMl: 'അനുയോജ്യമായ വാചകങ്ങൾ തിരഞ്ഞെടുത്ത് സൂക്ഷിക്കുക.',
  },
  'supporter:plan': {
    titleEn: 'Support Action Plan',
    titleMl: 'സഹായ പദ്ധതി',
    summaryEn: 'Keep clear weekly support tasks, healthy boundaries, and practical next steps organized.',
    summaryMl: 'ഓരോ ആഴ്ചയും ചെയ്യേണ്ട കാര്യങ്ങളും അതിരുകളും കൃത്യമായി പ്ലാൻ ചെയ്യാം.',
    nextActionEn: 'Create a 3-step weekly support checklist.',
    nextActionMl: 'ചെറിയൊരു ആഴ്ച പദ്ധതി ചേർക്കുക.',
  },
  'supporter:support': {
    titleEn: 'Helplines & Kerala Centers',
    titleMl: 'സഹായ കേന്ദ്രങ്ങളും നമ്പറുകളും',
    summaryEn: 'Find verified Vimukthi centers, family counseling lines (14405), and medical units near you.',
    summaryMl: 'അംഗീകൃത വിമുക്തി കേന്ദ്രങ്ങളും കുടുംബ കൗൺസിലിംഗ് നമ്പറുകളും കണ്ടെത്താം.',
    nextActionEn: 'Search by district or call 14405 for confidential family advice.',
    nextActionMl: 'ജില്ല തിരഞ്ഞെടുത്ത് അടുത്തുള്ള കേന്ദ്രം കണ്ടെത്തുക.',
  },
  'supporter:wellbeing': {
    titleEn: 'Your Own Wellbeing Check',
    titleMl: 'നിങ്ങളുടെ മനസ്സമാധാനം',
    summaryEn: 'Helping someone you love is heavy. Take 2 minutes here to reset your own stress and avoid burnout.',
    summaryMl: 'മറ്റൊരാളെ സഹായിക്കുമ്പോൾ നിങ്ങളുടെ മനസ്സമാധാനവും പ്രധാനമാണ്. ഇവിടെ 2 മിനിറ്റ് വിശ്രമിക്കാം.',
    nextActionEn: 'Check your supporter stress meter and do one self-care step.',
    nextActionMl: 'നിങ്ങൾക്കായി ഒരു ചെറിയ വിശ്രമ സമയം തിരഞ്ഞെടുക്കുക.',
  },
  'supporter:calendar': {
    titleEn: 'Shared Support Schedule',
    titleMl: 'സഹായ കലണ്ടർ',
    summaryEn: 'Track clinic visits, calm family check-ins, and personal rest blocks.',
    summaryMl: 'കുടുംബ സംഭാഷണങ്ങളും ഡോക്ടർ അപ്പോയിന്റ്‌മെൻ്റുകളും ഇവിടെ ക്രമീകരിക്കാം.',
    nextActionEn: 'Add a calm check-in time for this week.',
    nextActionMl: 'അടുത്ത ചെക്ക്-ഇൻ സമയം കലണ്ടറിൽ ചേർക്കുക.',
  },
  'supporter:journal': {
    titleEn: 'Supporter Reflection Journal',
    titleMl: 'സഹായിയുടെ കുറിപ്പുകൾ',
    summaryEn: 'Write full paragraphs about observations, emotions, and small improvements privately.',
    summaryMl: 'നിങ്ങൾ ശ്രദ്ധിച്ച മാറ്റങ്ങളും ചിന്തകളും വിശദമായി എഴുതി സൂക്ഷിക്കാം.',
    nextActionEn: 'Log one observation from today in your own words.',
    nextActionMl: 'ഇന്നത്തെ നിരീക്ഷണം സ്വകാര്യമായി കുറിക്കുക.',
  },
  'supporter:progress': {
    titleEn: 'Supporter Readiness & Wins',
    titleMl: 'പുരോഗതിയും തയ്യാറെടുപ്പും',
    summaryEn: 'See guides you completed, conversations prepared, and steady support habits.',
    summaryMl: 'നിങ്ങൾ പൂർത്തിയാക്കിയ പാഠങ്ങളും തയ്യാറാക്കിയ സംസാര പ്ലാനുകളും കാണാം.',
    nextActionEn: 'Review your supporter milestones.',
    nextActionMl: 'നിങ്ങളുടെ ഇപ്പോഴത്തെ പുരോഗതി പരിശോധിക്കുക.',
  },

  // ROLE 03: LEARNER
  'learner:dashboard': {
    titleEn: 'Learning Home Base',
    titleMl: 'പഠന പ്രധാന പേജ്',
    summaryEn: 'Pick up your next short lesson, review flashcards, ask AI about anything confusing, and generate a Learning PDF Report.',
    summaryMl: 'പാഠങ്ങൾ, ഫ്ലാഷ്കാർഡുകൾ, AI വിശകലനം, PDF റിപ്പോർട്ട് എന്നിവ എല്ലാം ഒരിടത്ത്.',
    nextActionEn: 'Continue your next 5-minute topic or run AI Learning Insights.',
    nextActionMl: 'അടുത്ത ചെറിയ പാഠം തുടങ്ങുക.',
  },
  'learner:pathways': {
    titleEn: 'Step-by-Step Topics & Habit Lab',
    titleMl: 'ലളിതമായ പാഠങ്ങളും ശീലങ്ങളും',
    summaryEn: 'Easy-to-read lessons on brain science, peer pressure, habit swapping, and flashcards—with A/A+ font comfort and Ask AI inside every section.',
    summaryMl: 'തലച്ചോറിൻ്റെ പ്രവർത്തനം, കൂട്ടുകാരുടെ സമ്മർദ്ദം, നല്ല ശീലങ്ങൾ എന്നിവ വളരെ ലളിതമായി പഠിക്കാം.',
    nextActionEn: 'Open any topic card and tap Ask AI on any paragraph.',
    nextActionMl: 'ഒരു വിഷയം തിരഞ്ഞെടുത്ത് വായിച്ചു തുടങ്ങുക.',
  },
  'learner:interactive': {
    titleEn: 'Short Lessons & Quick Quizzes',
    titleMl: 'ചെറിയ പാഠങ്ങളും ക്വിസുകളും',
    summaryEn: 'Interactive real-life peer situations and fast 2-question checks so concepts stick without cramming.',
    summaryMl: 'യഥാർത്ഥ ജീവിത സാഹചര്യങ്ങളിലൂടെ ലളിതമായി കാര്യങ്ങൾ മനസ്സിലാക്കാം.',
    nextActionEn: 'Pick one scenario or quiz to practice calm refusal.',
    nextActionMl: 'ഒരു സാഹചര്യം തിരഞ്ഞെടുത്ത് പരിശീലിക്കുക.',
  },
  'learner:library': {
    titleEn: 'All Lessons & Fact Sheets',
    titleMl: 'എല്ലാ പാഠങ്ങളും വസ്തുതകളും',
    summaryEn: 'Search every plain-language lesson and filter by topic or saved bookmarks, with Ask AI built right into the filter bar.',
    summaryMl: 'എല്ലാ പാഠങ്ങളും തിരയാനും ആവശ്യമുള്ളവ സേവ് ചെയ്യാനും ഇവിടെ സാധിക്കും.',
    nextActionEn: 'Search any topic or click Read Lesson for comfortable reading.',
    nextActionMl: 'ആവശ്യമുള്ള വിഷയം തിരയുക.',
  },
  'learner:research': {
    titleEn: 'Honest Substance Facts',
    titleMl: 'ശരിയായ വിവരങ്ങൾ',
    summaryEn: 'Clear, evidence-based facts about substances and everyday risks—no scare tactics or confusing jargon.',
    summaryMl: 'ലഹരി വസ്തുക്കളെക്കുറിച്ചുള്ള ശാസ്ത്രീയവും സത്യസന്ധവുമായ വിവരങ്ങൾ.',
    nextActionEn: 'Select any substance entry to read plain health facts.',
    nextActionMl: 'വിവരങ്ങൾ അറിയാൻ ഒരു വിഭാഗം തിരഞ്ഞെടുക്കുക.',
  },
  'learner:planner': {
    titleEn: 'My Study Planner',
    titleMl: 'പഠന പ്ലാനർ',
    summaryEn: 'Pick your topics and create a simple 7-day or 14-day reading plan that fits school or college.',
    summaryMl: 'നിങ്ങളുടെ പഠന സമയത്തിന് അനുസരിച്ച് 7 ദിവസത്തെ പ്ലാൻ തയ്യാറാക്കാം.',
    nextActionEn: 'Select 2 topics you are curious about to build your plan.',
    nextActionMl: 'താൽപ്പര്യമുള്ള വിഷയങ്ങൾ തിരഞ്ഞെടുക്കുക.',
  },
  'learner:certificate': {
    titleEn: 'Completion Certificate',
    titleMl: 'പഠന സർട്ടിഫിക്കറ്റ്',
    summaryEn: 'Download and print your verified ClearPath Prevention Mastery Certificate once you complete the core topics.',
    summaryMl: 'പാഠങ്ങൾ പൂർത്തിയാക്കി നിങ്ങളുടെ സർട്ടിഫിക്കറ്റ് ഡൗൺലോഡ് ചെയ്യാം.',
    nextActionEn: 'Check how many lessons remain to unlock your certificate.',
    nextActionMl: 'സർട്ടിഫിക്കറ്റ് നേടാൻ ബാക്കിയുള്ള പാഠങ്ങൾ കാണുക.',
  },
  'learner:journal': {
    titleEn: 'Study Notes & Questions',
    titleMl: 'പഠന കുറിപ്പുകൾ',
    summaryEn: 'Write down things you learned or open questions to revisit later.',
    summaryMl: 'പഠിച്ച പ്രധാന കാര്യങ്ങളും സംശയങ്ങളും ഇവിടെ കുറിച്ചു വെക്കാം.',
    nextActionEn: 'Save one takeaway from today’s reading.',
    nextActionMl: 'ഇന്ന് പഠിച്ച ഒരു കാര്യം കുറിക്കുക.',
  },
  'learner:calendar': {
    titleEn: 'Study Rhythm Calendar',
    titleMl: 'പഠന കലണ്ടർ',
    summaryEn: 'Track study days and block 10 minutes for reading or flashcards.',
    summaryMl: 'പഠന ദിവസങ്ങൾ അടയാളപ്പെടുത്തി നല്ലൊരു ശീലം വളർത്താം.',
    nextActionEn: 'Mark today’s short study session.',
    nextActionMl: 'ഇന്നത്തെ പഠന സമയം അടയാളപ്പെടുത്തുക.',
  },
  'learner:missions': {
    titleEn: 'Action Quests & Challenges',
    titleMl: 'പ്രവർത്തന ചലഞ്ചുകൾ',
    summaryEn: 'Complete practical campus and personal habit challenges step by step.',
    summaryMl: 'ലളിതമായ ചലഞ്ചുകൾ പൂർത്തിയാക്കി പുതിയ കാര്യങ്ങൾ പഠിക്കാം.',
    nextActionEn: 'Pick one active mission step to complete.',
    nextActionMl: 'ഒരു ചലഞ്ച് തിരഞ്ഞെടുത്ത് തുടങ്ങുക.',
  },
  'learner:analytics': {
    titleEn: 'My Learning Snapshot',
    titleMl: 'പഠന പുരോഗതി',
    summaryEn: 'See topics completed, quiz accuracy, and reading streaks in a simple chart.',
    summaryMl: 'പൂർത്തിയാക്കിയ പാഠങ്ങളും ക്വിസ് മാർക്കുകളും ലളിതമായി കാണാം.',
    nextActionEn: 'Spot any remaining topic to finish next.',
    nextActionMl: 'ബാക്കിയുള്ള വിഷയങ്ങൾ പരിശോധിക്കുക.',
  },
  'learner:support': {
    titleEn: 'Trusted Help & Helplines',
    titleMl: 'സഹായ കേന്ദ്രങ്ങളും നമ്പറുകളും',
    summaryEn: 'Safe youth-friendly resources, trusted adult tips, and 24/7 free helplines (1098 / 14405 / 112).',
    summaryMl: 'വിദ്യാർത്ഥികൾക്കുള്ള സൗജന്യ സഹായ നമ്പറുകളും (1098 / 14405) കേന്ദ്രങ്ങളും.',
    nextActionEn: 'Save 14405 or browse district support hubs.',
    nextActionMl: 'സൗജന്യ സഹായ നമ്പറുകൾ കാണുക.',
  },

  // ROLE 04: COMMUNITY BUILDER
  'community:dashboard': {
    titleEn: 'Community Action Hub',
    titleMl: 'കമ്മ്യൂണിറ്റി പ്രധാന പേജ്',
    summaryEn: 'Track local programmes, write full district observations, get AI prevention ideas, and export your Community PDF Report.',
    summaryMl: 'പദ്ധതികൾ, ജില്ലാ നിരീക്ഷണങ്ങൾ, AI നിർദ്ദേശങ്ങൾ, PDF റിപ്പോർട്ട് എന്നിവ ഇവിടെ നിയന്ത്രിക്കാം.',
    nextActionEn: 'Log a district update or open AI Insights below.',
    nextActionMl: 'ജില്ലാ വിവരങ്ങൾ കുറിക്കുകയോ AI സഹായം തേടുകയോ ചെയ്യുക.',
  },
  'community:intelligence': {
    titleEn: 'Kerala District Insights',
    titleMl: 'ജില്ലാ തല വിവരങ്ങൾ',
    summaryEn: 'Explore privacy-safe district trends, awareness gaps, and what approaches actually help youth—zero stigma or blaming.',
    summaryMl: 'വ്യക്തികളുടെ വിവരങ്ങൾ വെളിപ്പെടുത്താതെ തന്നെ ജില്ലകളിലെ ആവശ്യങ്ങൾ മനസ്സിലാക്കാം.',
    nextActionEn: 'Select your district to view local support needs.',
    nextActionMl: 'നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുത്ത് വിവരങ്ങൾ കാണുക.',
  },
  'community:generator': {
    titleEn: 'AI Programme Planner',
    titleMl: 'AI പരിപാടി പ്ലാനർ',
    summaryEn: 'Create a complete school, college, or ward prevention session plan in plain steps with safeguards included.',
    summaryMl: 'സ്കൂളുകൾക്കും കോളേജുകൾക്കും അനുയോജ്യമായ ബോധവൽക്കരണ പരിപാടികൾ AI സഹായത്തോടെ പ്ലാൻ ചെയ്യാം.',
    nextActionEn: 'Choose target group and district, then generate a practical plan.',
    nextActionMl: 'ജില്ലയും പങ്കെടുക്കുന്നവരെയും തിരഞ്ഞെടുത്ത് പ്ലാൻ തയ്യാറാക്കുക.',
  },
  'community:strategy_lab': {
    titleEn: 'AI Idea Checker',
    titleMl: 'ആശയ പരിശോധന ലാബ്',
    summaryEn: 'Test a campaign or event idea against real prevention evidence before spending time and budget.',
    summaryMl: 'നിങ്ങളുടെ പരിപാടി ആശയം എത്രത്തോളം ഫലപ്രദമാണെന്ന് AI ഉപയോഗിച്ച് പരിശോധിക്കാം.',
    nextActionEn: 'Write your workshop idea and run an evidence check.',
    nextActionMl: 'നിങ്ങളുടെ ആശയം എഴുതി പരിശോധിച്ച് നോക്കൂ.',
  },
  'community:gaps': {
    titleEn: 'Unmet District Needs',
    titleMl: 'സഹായം കുറവുള്ള ഇടങ്ങൾ',
    summaryEn: 'Spot neighborhoods, schools, or groups lacking free care info so teams focus where help is missing most.',
    summaryMl: 'ബോധവൽക്കരണവും സഹായവും കുറവുള്ള മേഖലകൾ കണ്ടെത്താം.',
    nextActionEn: 'Log a local gap or pick a priority ward.',
    nextActionMl: 'പ്രാധാന്യം നൽകേണ്ട പ്രദേശങ്ങൾ കാണുക.',
  },
  'community:map': {
    titleEn: 'Kerala Support Map',
    titleMl: 'കേരള സഹായ മാപ്പ്',
    summaryEn: 'View all 14 districts and verify local Vimukthi and youth club coverage.',
    summaryMl: '14 ജില്ലകളിലെയും സഹായ കേന്ദ്രങ്ങളും പ്രവർത്തനങ്ങളും മാപ്പിൽ കാണാം.',
    nextActionEn: 'Tap any Kerala district to see active services.',
    nextActionMl: 'ഒരു ജില്ല തിരഞ്ഞെടുത്ത് വിവരങ്ങൾ കാണുക.',
  },
  'community:exchange': {
    titleEn: 'Shared School & NGO Ideas',
    titleMl: 'മാതൃകാ പദ്ധതികൾ',
    summaryEn: 'Adapt ready-to-run workshop blueprints shared by other Kerala schools, colleges, and community teams.',
    summaryMl: 'മറ്റു സ്കൂളുകളും കൂട്ടായ്മകളും വിജയിപ്പിച്ച പരിപാടികൾ മാതൃകയാക്കാം.',
    nextActionEn: 'Copy a proven blueprint into your own programme list.',
    nextActionMl: 'അനുയോജ്യമായ ഒരു മാതൃക തിരഞ്ഞെടുക്കുക.',
  },
  'community:programmes': {
    titleEn: 'Active Programmes',
    titleMl: 'നടപ്പിലാക്കുന്ന പദ്ധതികൾ',
    summaryEn: 'Manage your ongoing awareness drives, budgets, attendance, and safety plans.',
    summaryMl: 'നടക്കുന്ന പരിപാടികളുടെ വിവരങ്ങളും പുരോഗതിയും രേഖപ്പെടുത്താം.',
    nextActionEn: 'Update progress or publish a new local programme.',
    nextActionMl: 'പരിപാടികളുടെ വിവരങ്ങൾ പുതുക്കുക.',
  },
  'community:events': {
    titleEn: 'Workshops & Sessions',
    titleMl: 'ക്യാമ്പുകളും സെഷനുകളും',
    summaryEn: 'Schedule school talks, parent meetings, and youth sports events with dates and attendance counts.',
    summaryMl: 'സ്കൂൾ-കോളേജ് പരിപാടികളുടെ തീയതിയും സമയവും ക്രമീകരിക്കാം.',
    nextActionEn: 'Add your next upcoming workshop.',
    nextActionMl: 'അടുത്ത പരിപാടി ചേർക്കുക.',
  },
  'community:team_tasks': {
    titleEn: 'Team Volunteers & Tasks',
    titleMl: 'വളണ്ടിയർ ചുമതലകൾ',
    summaryEn: 'Assign prep tasks to coordinators and track completion before event day.',
    summaryMl: 'ടീം അംഗങ്ങൾക്ക് ചുമതലകൾ നൽകാനും പുരോഗതി അറിയാനും സാധിക്കും.',
    nextActionEn: 'Add a task or check off completed prep.',
    nextActionMl: 'ഒരു പുതിയ ചുമതല ചേർക്കുക.',
  },
  'community:campaigns': {
    titleEn: 'Outreach Campaigns',
    titleMl: 'ബോധവൽക്കരണ ക്യാമ്പയിനുകൾ',
    summaryEn: 'Organize poster drives, parent circles, and sports alternatives across campuses.',
    summaryMl: 'സ്പോർട്സ് ക്ലബ്ബുകളും പോസ്റ്റർ പ്രചാരണങ്ങളും ഏകോപിപ്പിക്കാം.',
    nextActionEn: 'Track active outreach campaign progress.',
    nextActionMl: 'ക്യാമ്പയിൻ വിവരങ്ങൾ പരിശോധിക്കുക.',
  },
  'community:analytics': {
    titleEn: 'Programme Outcomes',
    titleMl: 'പ്രവർത്തന ഫലങ്ങൾ',
    summaryEn: 'See honest pre/post learning gains and attendance trends without guessing numbers.',
    summaryMl: 'പരിപാടികളുടെ യഥാർത്ഥ ഫലങ്ങളും പങ്കാളിത്തവും വിലയിരുത്താം.',
    nextActionEn: 'Review completed session outcomes.',
    nextActionMl: 'പൂർത്തിയായ പരിപാടികളുടെ ഫലം കാണുക.',
  },
  'community:feedback': {
    titleEn: 'Anonymous Participant Feedback',
    titleMl: 'പങ്കെടുത്തവരുടെ അഭിപ്രായങ്ങൾ',
    summaryEn: 'Collect honest anonymous feedback from students and parents to improve future workshops.',
    summaryMl: 'വിദ്യാർത്ഥികളിൽ നിന്നും രക്ഷിതാക്കളിൽ നിന്നും പേര് വെളിപ്പെടുത്താതെ അഭിപ്രായങ്ങൾ ശേഖരിക്കാം.',
    nextActionEn: 'Record feedback from your latest session.',
    nextActionMl: 'അഭിപ്രായങ്ങൾ രേഖപ്പെടുത്തുക.',
  },
  'community:partners': {
    titleEn: 'Trusted Partners & Contacts',
    titleMl: 'പങ്കാളിത്ത സ്ഥാപനങ്ങൾ',
    summaryEn: 'Keep verified school principals, Vimukthi officers, and clinic contacts ready.',
    summaryMl: 'സ്കൂളുകൾ, വിമുക്തി ഓഫീസർമാർ എന്നിവരുമായുള്ള വിവരങ്ങൾ സൂക്ഷിക്കാം.',
    nextActionEn: 'Verify or add a local partner contact.',
    nextActionMl: 'പങ്കാളികളുടെ വിവരങ്ങൾ പരിശോധിക്കുക.',
  },
  'community:resources': {
    titleEn: 'Ready Toolkits & Guides',
    titleMl: 'പഠന സാമഗ്രികൾ',
    summaryEn: 'Download teacher handouts, activity sheets, and parent guides in English and Malayalam.',
    summaryMl: 'അധ്യാപകർക്കും രക്ഷിതാക്കൾക്കുമുള്ള സഹായക കൈപ്പുസ്തകങ്ങൾ.',
    nextActionEn: 'Bookmark a handout for your next session.',
    nextActionMl: 'ആവശ്യമായ കൈപ്പുസ്തകം തിരഞ്ഞെടുക്കുക.',
  },
  'community:reports': {
    titleEn: 'Community Impact Reports',
    titleMl: 'കമ്മ്യൂണിറ്റി റിപ്പോർട്ടുകൾ',
    summaryEn: 'Export clean reports of programmes, events, and outcomes for schools, PTA, or panchayat reviews.',
    summaryMl: 'സ്കൂളുകൾക്കോ പഞ്ചായത്തുകൾക്കോ സമർപ്പിക്കാനുള്ള റിപ്പോർട്ടുകൾ തയ്യാറാക്കാം.',
    nextActionEn: 'Generate and print a clean summary report.',
    nextActionMl: 'റിപ്പോർട്ട് തയ്യാറാക്കി ഡൗൺലോഡ് ചെയ്യുക.',
  },
};

export const FeatureExplainerBar: React.FC<Props> = ({ role, currentTab }) => {
  const { language } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const explainer =
    TAB_EXPLAINERS[`${role}:${currentTab}`] ||
    TAB_EXPLAINERS[currentTab] || {
      titleEn: 'Quick Workspace Guide',
      titleMl: 'ലളിതമായ സഹായം',
      summaryEn: 'Everything on this screen is organized into simple steps—start at your own pace.',
      summaryMl: 'ലളിതവും ഫലപ്രദവുമായ മാർഗ്ഗങ്ങൾ നൽകുന്നതിനാണ് ഈ പേജ് രൂപകൽപ്പന ചെയ്തിരിക്കുന്നത്.',
      nextActionEn: 'Pick one small action below or tap Ask AI anytime.',
      nextActionMl: 'താഴെയുള്ള ഒരു ചെറിയ ചുവട് തിരഞ്ഞെടുക്കുക.',
    };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 mb-5">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
            <span className="font-bold text-slate-900 shrink-0">
              {language === 'ml' ? explainer.titleMl : explainer.titleEn}
            </span>
            <span className="text-slate-400 hidden sm:inline">·</span>
            <span className="text-slate-600 truncate hidden sm:inline">
              {language === 'ml' ? explainer.summaryMl : explainer.summaryEn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold shrink-0 ml-3 whitespace-nowrap">
          <span>
            {isExpanded
              ? language === 'ml'
                ? 'കുറയ്ക്കുക'
                : 'Hide'
              : language === 'ml'
                ? 'എന്താണ് ഈ പേജ്?'
                : 'What is this?'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50 text-sm space-y-2.5 animate-in fade-in duration-150">
          <p className="text-slate-700 leading-relaxed">
            {language === 'ml' ? explainer.summaryMl : explainer.summaryEn}
          </p>
          <div className="flex items-start gap-2 text-emerald-900 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-950 mr-1">
                {language === 'ml' ? 'ഇപ്പോൾ ചെയ്യാവുന്നത്:' : 'Easy first step:'}
              </span>
              <span>{language === 'ml' ? explainer.nextActionMl : explainer.nextActionEn}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
