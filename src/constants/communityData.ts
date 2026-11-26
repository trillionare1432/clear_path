import { CommunityResource } from '../types';

export interface VerifiedPartner {
  id: string;
  name: string;
  nameMl: string;
  type: 'government' | 'district_hospital' | 'ngo' | 'counselling_center';
  district: string;
  phone: string;
  tollFree?: string;
  address: string;
  services: string[];
  timing: string;
  verified: boolean;
}

export const VERIFIED_COMMUNITY_PARTNERS: VerifiedPartner[] = [
  {
    id: 'vimukthi-state',
    name: 'Vimukthi Mission (State Anti-Narcotics Mission)',
    nameMl: 'വിമുക്തി മിഷൻ (കേരള സർക്കാർ)',
    type: 'government',
    district: 'Statewide',
    phone: '0471-2302300',
    tollFree: '14405',
    address: 'Excise Headquarters, Thiruvananthapuram, Kerala',
    services: [
      'Statewide awareness campaigns',
      'School & college Vimukthi clubs',
      'Free de-addiction counselling',
      'Emergency helpline (24x7)',
    ],
    timing: '24 Hours (Toll Free 14405)',
    verified: true,
  },
  {
    id: 'kerala-police-112',
    name: 'Kerala Police Emergency Service & Cyber / Drug Control',
    nameMl: 'കേരള പോലീസ് അടിയന്തര സേവനം',
    type: 'government',
    district: 'Statewide',
    phone: '112',
    tollFree: '112',
    address: 'State Police Command Center, Thiruvananthapuram',
    services: [
      'Emergency intervention',
      'YODHAV anti-drug WhatsApp tip line (9995966666)',
      'Community crime prevention support',
    ],
    timing: '24/7 Rapid Response',
    verified: true,
  },
  {
    id: 'gmc-trivandrum',
    name: 'Government Medical College De-Addiction Center',
    nameMl: 'ഗവ. മെഡിക്കൽ കോളേജ് ഡി-അഡിക്ഷൻ സെന്റർ, തിരുവനന്തപുരം',
    type: 'district_hospital',
    district: 'Thiruvananthapuram',
    phone: '0471-2528300',
    address: 'Department of Psychiatry, Medical College PO, Thiruvananthapuram',
    services: ['Clinical detoxification', 'Inpatient psychiatric care', 'Psychological rehabilitation', 'Family counselling'],
    timing: 'OPD: 8:00 AM - 1:00 PM (Mon-Sat)',
    verified: true,
  },
  {
    id: 'gmc-ernakulam',
    name: 'General Hospital & Vimukthi Center Ernakulam',
    nameMl: 'ജനറൽ ഹോസ്പിറ്റൽ & വിമുക്തി കേന്ദ്രം, എറണാകുളം',
    type: 'district_hospital',
    district: 'Ernakulam',
    phone: '0484-2361251',
    address: 'Hospital Road, Marine Drive, Kochi, Ernakulam',
    services: ['Dedicated Vimukthi ward', 'Medically supervised detox', 'Youth counselling', 'Outpatient follow-up'],
    timing: 'Mon-Sat 9:00 AM - 4:00 PM',
    verified: true,
  },
  {
    id: 'imhans-kozhikode',
    name: 'IMHANS (Institute of Mental Health and Neurosciences)',
    nameMl: 'ഇംഹാൻസ് (മാനസികാരോഗ്യ ഇൻസ്റ്റിറ്റ്യൂട്ട്), കോഴിക്കോട്',
    type: 'government',
    district: 'Kozhikode',
    phone: '0495-2359125',
    address: 'Medical College Campus, Kozhikode, Kerala 673008',
    services: ['Child & adolescent psychiatry', 'Substance abuse rehabilitation', 'Community outreach training', 'Research & mental health training'],
    timing: '8:30 AM - 4:30 PM (Mon-Sat)',
    verified: true,
  },
  {
    id: 'thrissur-mch',
    name: 'Thrissur Government Medical College Psychiatric Wing',
    nameMl: 'തൃശ്ശൂർ ഗവ. മെഡിക്കൽ കോളേജ് സൈക്യാട്രി വിഭാഗം',
    type: 'district_hospital',
    district: 'Thrissur',
    phone: '0487-2200310',
    address: 'Mulamkunnathukavu, Thrissur, Kerala',
    services: ['De-addiction inpatient facility', 'Social work support', 'Dual diagnosis treatment', 'Community workshops'],
    timing: 'OPD: 8:30 AM - 1:30 PM',
    verified: true,
  },
  {
    id: 'kannur-district-hospital',
    name: 'District Hospital De-Addiction Unit, Kannur',
    nameMl: 'ജില്ലാ ആശുപത്രി ഡി-അഡിക്ഷൻ യൂണിറ്റ്, കണ്ണൂർ',
    type: 'district_hospital',
    district: 'Kannur',
    phone: '0497-2731245',
    address: 'South Bazar, Kannur, Kerala',
    services: ['Excise Department linked clinic', 'Withdrawal management', 'Counselling and family therapy'],
    timing: '9:00 AM - 2:00 PM (Mon-Sat)',
    verified: true,
  },
  {
    id: 'santhisadan-kottayam',
    name: 'Santhi Sadan Rehabilitation Society',
    nameMl: 'ശാന്തി സദൻ പുനരധിവാസ സമിതി, കോട്ടയം',
    type: 'ngo',
    district: 'Kottayam',
    phone: '0481-2567890',
    address: 'Baker Junction, Kottayam, Kerala',
    services: ['Community awareness seminars', 'Relapse prevention groups', 'Peer support mentoring', 'Caregiver circles'],
    timing: '9:00 AM - 5:00 PM',
    verified: true,
  },
];

export const VERIFIED_EDUCATIONAL_RESOURCES: CommunityResource[] = [
  {
    id: 'res-school-module',
    title: 'Evidence-Based School Prevention: 45-Minute Classroom Workshop',
    titleMl: 'സ്കൂൾ പ്രിവൻഷൻ പാഠ്യപദ്ധതി: 45 മിനിറ്റ് ക്ലാസ്റൂം വർക്ക്ഷോപ്പ്',
    category: 'School Awareness',
    targetAudience: 'High School & Higher Secondary Students (Ages 13-18)',
    language: 'both',
    format: 'workshop_outline',
    suggestedDuration: '45-60 minutes',
    summary:
      'A structured, stigma-free classroom session focusing on neurobiology of adolescent decision-making, refusal assertiveness skills, and safe trusted-adult communication.',
    keyPoints: [
      'Interactive icebreaker: "Busting Common Myths"',
      'The developing brain: Prefrontal cortex vulnerability & emotional impulsivity',
      'Realistic refusal techniques (Delay, Redirect, Exit, Assert)',
      'Confidential help pathways in school & local community',
    ],
    downloadOrPrintContent: `CLEARPATH AI COMMUNITY PREVENTION CURRICULUM
MODULE: 45-Minute School & College Prevention Workshop

SESSION BLUEPRINT:
1. Introduction & Psychological Safety (8 mins)
   - Establish ground rules: Non-judgmental environment, confidentiality, no personal confessions requested.
   - Activity: Anonymous myth-busting cards.

2. Science of the Developing Brain (12 mins)
   - Visual comparison: Brain remodeling between ages 12 and 24.
   - Why nicotine, synthetic substances, and alcohol impact neuroplasticity during formative growth.

3. Social Dynamics & Assertive Refusal (15 mins)
   - Practising "Natural Exits" without escalating peer conflict:
     * "I have sports training / family commitment in the morning, count me out."
     * "Not for me, but let's grab food."
     * Clear, calm, direct refusal: "No thanks."

4. Action Plan & Support Resources (10 mins)
   - Where to go if a friend is in distress: School counsellors, Kerala Vimukthi 14405, ClearPath AI platform.
   - Question & Answer wrap-up.`,
  },
  {
    id: 'res-teacher-training',
    title: 'Educator & Teacher Training Guide: Early Identification Without Stigma',
    titleMl: 'അധ്യാപക പരിശീലന സഹായി: കുറ്റപ്പെടുത്തലില്ലാത്ത നേരത്തെയുള്ള തിരിച്ചറിയൽ',
    category: 'Teacher Training',
    targetAudience: 'School Teachers, Headmasters, College Faculty & Counsellors',
    language: 'both',
    format: 'teacher_guide',
    suggestedDuration: '90 minutes',
    summary:
      'Equips educators to spot subtle academic, behavioural, and emotional warning signs of distress without punitive confrontation or public labelling.',
    keyPoints: [
      'Distinguishing normal adolescent stress from substance distress',
      'Trauma-informed listening strategies for teachers',
      'Navigating parent conferences with empathy rather than blame',
      'Legal & procedural protocols in school systems (Kerala Excise & POCSO boundaries)',
    ],
    downloadOrPrintContent: `CLEARPATH AI EDUCATOR COMPASS: EARLY IDENTIFICATION
FOR TEACHERS, MENTORS, AND SCHOOL COUNSELLORS

CORE PRINCIPLES:
1. Avoid Punitive Labelling
   - Confronting a student in front of peers almost always leads to withdrawal, denial, or dropout.
   - Frame conversations around welfare, academic sudden changes, and emotional health.

2. Behavioral Indicators to Notice (Clusters, Not Isolated Incidents):
   - Sudden precipitous drop in attendance or grades without obvious cause.
   - Marked changes in hygiene, energy levels, or pupil dilation.
   - Drastic shift in peer groups combined with social isolation from previous friends.
   - Frequent unverified health complaints or sudden defensive reactions.

3. The 3-Step Teacher Check-in:
   - Observation: "I noticed you seemed unusually tired and missed three classes this week."
   - Concern: "I value having you in class and wanted to check how things are at home and in your life."
   - Partnership: "You do not have to handle heavy things alone. Let us see how our counsellor or support team can help."`,
  },
  {
    id: 'res-parent-dialogue',
    title: 'Family & Parent Dialogue Circle: Guide for Community Organisers',
    titleMl: 'രക്ഷിതാക്കൾക്കുള്ള ബോധവൽക്കരണ സെഷൻ ഗൈഡ്',
    category: 'Family Awareness',
    targetAudience: 'Parents, Guardians, PTA Members, Residential Associations',
    language: 'both',
    format: 'workshop_outline',
    suggestedDuration: '60 minutes',
    summary:
      'Facilitation guide for PTA meetings and residential associations to help parents build open family communication that protects youth.',
    keyPoints: [
      'Overcoming the silence of stigma in family discussions',
      'Setting healthy, consistent boundaries with warmth and respect',
      'Digital literacy: Online delivery channels and synthetic risks',
      'Creating a judgment-free emergency protocol at home',
    ],
    downloadOrPrintContent: `CLEARPATH AI COMMUNITY PARENT DIALOGUE WORKSHOP

AGENDA:
1. Opening: Understanding Modern Pressures Faced by Youth (15 mins)
   - Academic competition, digital isolation, synthetic availability.
2. Shifting from Interrogation to Connection (20 mins)
   - Why anger or lecturing drives secrecy.
   - Practical scripts for evening dinner check-ins.
3. Safe Family Policies (15 mins)
   - "Unconditional Ride Home" agreement: If a teen finds themselves in an unsafe situation, they can call for help without immediate punishment.
4. Professional Referral Pathways (10 mins)
   - Sharing local district de-addiction hospitals and verified helpline numbers.`,
  },
  {
    id: 'res-peer-leadership',
    title: 'Youth Peer Ambassador: Leadership & Support Handbook',
    titleMl: 'യൂത്ത് പിയർ അംബാസഡർ: നേതൃത്വവും പിന്തുണയും',
    category: 'Peer Education',
    targetAudience: 'Student Volunteers, Youth Clubs, NSS, NCC, SPC Cadets',
    language: 'both',
    format: 'student_activity',
    suggestedDuration: '2 hours or weekend camp',
    summary:
      'Trains young leaders to be empathetic, trustworthy listeners and safe bridges to professional adult support for their classmates.',
    keyPoints: [
      'The role of a Peer Ambassador: Bridge, not therapist',
      'Active listening and non-judgmental empathy',
      'Recognising immediate emergencies (overdose, acute intoxication, self-harm)',
      'Protecting personal emotional boundaries while helping others',
    ],
    downloadOrPrintContent: `YOUTH PEER AMBASSADOR HANDBOOK
CLEARPATH AI COMMUNITY EMPOWERMENT

YOUR ROLE:
You are not expected to be a doctor, counsellor, or police officer. You are a caring friend who knows how to listen and where to find safe help.

THE "BRIDGE" MODEL:
B - Be attentive (Listen without interrupting or lecturing)
R - Respect feelings (Validate emotional pain)
I - Inform safely (Share ClearPath AI or Vimukthi resources)
D - Do not promise secrecy for life-threatening situations
G - Guide to trusted adults (Counsellor, teacher, parent)
E - Ensure your own well-being (Debrief with the coordinator)`,
  },
  {
    id: 'res-policy-template',
    title: 'Institutional Substance Prevention & Student Support Policy Template',
    titleMl: 'വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾക്കുള്ള മാതൃകാ പ്രിവൻഷൻ നയം',
    category: 'Policy & Administration',
    targetAudience: 'Principals, Deans, Management Boards, School Committees',
    language: 'en',
    format: 'policy_template',
    suggestedDuration: 'Administrative review',
    summary:
      'A formal policy draft that balances campus safety with restorative justice, ensuring students receive clinical and counselling support rather than immediate abandonment.',
    keyPoints: [
      'Clear definition of campus drug-free zone guidelines',
      'Support-first disciplinary protocols prioritizing assessment over expulsion',
      'Establishment of an internal student wellness and support committee',
      'Mandatory periodic teacher & staff awareness refresher schedule',
    ],
    downloadOrPrintContent: `MODEL INSTITUTIONAL POLICY FOR SUBSTANCE PREVENTION & REHABILITATION SUPPORT

1. PURPOSE & VISION
This institution is committed to maintaining a safe, healthy, drug-free academic environment while recognizing substance use disorders as health concerns that require compassionate, evidence-based care.

2. EARLY SUPPORT & RESTORATIVE PROTOCOL
- In situations where a student is found using or under the influence of substances on campus, the immediate priority shall be physical safety and medical assessment.
- Expulsion shall be regarded as a last resort of extreme gravity. The institution shall facilitate an assessment by a licensed clinical psychologist or medical officer.
- A confidential Rehabilitation Continuity Plan shall be developed with the student and family.`,
  },
];

export const PROGRAMME_CATEGORY_OPTIONS = [
  { id: 'school_awareness', label: 'School Awareness', labelMl: 'സ്കൂൾ ബോധവൽക്കരണം', color: 'teal' },
  { id: 'youth_engagement', label: 'Youth Engagement', labelMl: 'യുവജന പങ്കാളിത്തം', color: 'emerald' },
  { id: 'community_education', label: 'Community Education', labelMl: 'സാമൂഹ്യ വിദ്യാഭ്യാസം', color: 'cyan' },
  { id: 'family_awareness', label: 'Family & Parent Awareness', labelMl: 'കുടുംബ ബോധവൽക്കരണം', color: 'amber' },
  { id: 'teacher_training', label: 'Teacher & Staff Training', labelMl: 'അധ്യാപക പരിശീലനം', color: 'indigo' },
  { id: 'peer_education', label: 'Peer Educator Leadership', labelMl: 'പിയർ എഡ്യൂക്കേഷൻ', color: 'blue' },
  { id: 'recovery_support', label: 'Recovery Community Support', labelMl: 'റിക്കവറി പിന്തുണ', color: 'violet' },
  { id: 'community_partnerships', label: 'Community Partnerships', labelMl: 'സാമൂഹിക പങ്കാളിത്തം', color: 'rose' },
] as const;

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
  'Statewide',
];

export const SAMPLE_PROGRAMME_TEMPLATES = [
  {
    title: 'Vimukthi Campus Prevention Drive 2026',
    category: 'school_awareness' as const,
    targetAudience: 'High school & college students (Grades 9-12)',
    objective: 'Raise awareness on synthetic substances and train student peer leaders on refusing pressure.',
    budget: 15000,
    expectedOutcomes: 'Reach 450+ students across 3 batches, train 25 peer ambassadors, distribute ClearPath AI guides.',
    requiredResources: 'Classroom projector, print handbooks, certified counsellor guest speaker, feedback survey sheets.',
  },
  {
    title: 'Educator Compass: Identifying Student Distress',
    category: 'teacher_training' as const,
    targetAudience: 'High school teachers, counsellors, and physical education staff',
    objective: 'Train teaching staff to recognize early behavioral warning signs without punitive stigma.',
    budget: 8000,
    expectedOutcomes: 'Train 40 teachers, establish school counselling referral protocol, distribute teacher guides.',
    requiredResources: 'Seminar hall, print educator guides, case study discussion prompts.',
  },
  {
    title: 'Community Parent-Teen Open Dialogue Circle',
    category: 'family_awareness' as const,
    targetAudience: 'Parents, guardians, and PTA representatives',
    objective: 'Foster non-judgmental home environments and empower parents with de-addiction helpline contacts.',
    budget: 5000,
    expectedOutcomes: 'Engage 100+ parents, facilitate 2 interactive Q&A circles, share emergency family contacts.',
    requiredResources: 'Microphone setup, printed Kerala Vimukthi helpline flyers, tea and refreshments.',
  },
];
