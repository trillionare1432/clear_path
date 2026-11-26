export type EvidenceIndicatorCategory =
  | 'prevalence'
  | 'disorder'
  | 'treatment_demand'
  | 'enforcement_seizure'
  | 'harm_overdose';

export interface SubstanceIntelligenceMetric {
  id: string;
  indicator: string;
  category: EvidenceIndicatorCategory;
  geography: string;
  scope: 'India' | 'Kerala' | 'Global Comparison' | 'Sub-Population';
  substanceCategory:
    | 'All Substances'
    | 'Alcohol'
    | 'Cannabis'
    | 'Opioids'
    | 'Inhalants & Volatile Solvents'
    | 'Synthetic Stimulants / ATS'
    | 'Sedatives & Prescription';
  populationOrAgeGroup: string;
  urbanRuralNote: string;
  value: string;
  collectionYear: string;
  publicationYear: string;
  source: string;
  methodology: string;
  limitations: string;
}

export interface CommunityRiskProtectiveDimension {
  id: string;
  dimension: string;
  factorType: 'protective' | 'vulnerability_association';
  summary: string;
  populationLevelMechanism: string;
  preventionTarget: string;
  ethicalNote: string;
  sourceRef: string;
}

export interface KeralaDistrictReferenceProfile {
  district: string;
  vimukthiHubUnit: string;
  publicClinicalUnits: string[];
  reportedEnforcementOrDemandContext: string;
  populationSurveyGapNotice: string;
  recommendedPreventionFocus: string;
  svgCoords: { x: number; y: number };
}

export interface PreventionEvaluationCriterion {
  id: string;
  label: string;
  question: string;
  maxScore: number;
}

export const EVIDENCE_CATEGORY_META: Record<
  EvidenceIndicatorCategory,
  { label: string; definition: string; interpretationWarning: string }
> = {
  prevalence: {
    label: 'Population Prevalence (Use)',
    definition:
      'Estimated proportion of a surveyed population reporting current or past-year substance use in probability household or school surveys.',
    interpretationWarning:
      'Use prevalence includes occasional or experimental consumption; it does NOT equal substance use disorder or addiction.',
  },
  disorder: {
    label: 'Harmful Use & Disorder (SUD)',
    definition:
      'Estimated proportion meeting ICD/DSM criteria for harmful use or dependence requiring clinical assessment.',
    interpretationWarning:
      'Only a subset of users develop dependence; clinical care capacity must match SUD prevalence, not headline use rates.',
  },
  treatment_demand: {
    label: 'Treatment Demand & Service Capacity',
    definition:
      'Registered outpatient/inpatient admissions, IRCA/ODIC beds, Vimukthi clinics, and help-seeking enquiries.',
    interpretationWarning:
      'Higher clinic registration often reflects stronger awareness and service availability—not necessarily higher underlying use.',
  },
  enforcement_seizure: {
    label: 'Enforcement, Arrests & Seizures (NDPS / Excise)',
    definition:
      'Law-enforcement detections, Narcotic Drugs and Psychotropic Substances (NDPS) Act filings, and quantity seized.',
    interpretationWarning:
      'Seizures and arrests measure policing intensity and trafficking routes, NOT community prevalence or treatment need.',
  },
  harm_overdose: {
    label: 'Acute Harm & Mortality Indicators',
    definition:
      'Recorded accidental poisoning/overdose events, emergency presentations, and substance-attributable harm indicators.',
    interpretationWarning:
      'Under-reporting is common due to stigma and cause-of-death coding gaps; interpret alongside emergency preparedness needs.',
  },
};

export const SUBSTANCE_INTELLIGENCE_METRICS: SubstanceIntelligenceMetric[] = [
  {
    id: 'ind-mosje-alcohol-2019',
    indicator: 'Current Alcohol Use (National Household Estimate, Ages 10–75)',
    category: 'prevalence',
    geography: 'India (National Survey)',
    scope: 'India',
    substanceCategory: 'Alcohol',
    populationOrAgeGroup: 'General Population (10–75 years)',
    urbanRuralNote: 'Reported nationwide; higher prevalence among adult men (27.3%) than women (1.6%).',
    value: '14.6% (~16 crore individuals)',
    collectionYear: '2017–2018',
    publicationYear: '2019',
    source: 'Ministry of Social Justice & Empowerment (MoSJE) & NDDTC, AIIMS — Magnitude of Substance Use in India',
    methodology: 'Nationally representative household sample (200,111 households; 473,569 individuals) + Respondent Driven Sampling.',
    limitations: 'Cross-sectional 2017–18 baseline; no post-pandemic national MoSJE household round released publicly yet.',
  },
  {
    id: 'ind-mosje-alcohol-dep-2019',
    indicator: 'Alcohol Dependence / Harmful Use Requiring Help (India)',
    category: 'disorder',
    geography: 'India (National Survey)',
    scope: 'India',
    substanceCategory: 'Alcohol',
    populationOrAgeGroup: 'General Population (10–75 years)',
    urbanRuralNote: 'Roughly 1 in 5 current alcohol users show dependence patterns (~2.9 crore requiring clinical help).',
    value: '2.7% dependent · 2.5% harmful use',
    collectionYear: '2017–2018',
    publicationYear: '2019',
    source: 'MoSJE & NDDTC, AIIMS (2019)',
    methodology: 'Structured ICD-10 aligned clinical criteria applied inside national household survey.',
    limitations: 'Household surveys may under-capture unhoused, hostel, or institutional populations.',
  },
  {
    id: 'ker-nfhs5-alcohol-2021',
    indicator: 'Kerala Men (15–49) Reporting Alcohol Consumption vs. India',
    category: 'prevalence',
    geography: 'Kerala State vs. India',
    scope: 'Kerala',
    substanceCategory: 'Alcohol',
    populationOrAgeGroup: 'Adults Ages 15–49 (Men & Women Sub-samples)',
    urbanRuralNote: 'Kerala men 19.9% (urban 19.6%, rural 20.1%) vs India men 18.8%; Kerala women 0.2%.',
    value: '19.9% Men · 0.2% Women (Kerala)',
    collectionYear: '2019–2021',
    publicationYear: '2021–2022',
    source: 'National Family Health Survey (NFHS-5), IIPS & MoHFW',
    methodology: 'State-representative Demographic and Health Survey (DHS) probability sample.',
    limitations: 'Covers ages 15–49 only and relies on face-to-face self-report (potential social-desirability under-reporting).',
  },
  {
    id: 'ind-mosje-cannabis-2019',
    indicator: 'Past-Year Cannabis Use (Bhang, Ganja, Charas)',
    category: 'prevalence',
    geography: 'India (National Survey)',
    scope: 'India',
    substanceCategory: 'Cannabis',
    populationOrAgeGroup: 'General Population (10–75 years)',
    urbanRuralNote: 'Includes ~2.0% bhang and ~1.2% ganja/charas; ~0.66% harmful or dependent.',
    value: '2.8% (~3.1 crore individuals)',
    collectionYear: '2017–2018',
    publicationYear: '2019',
    source: 'MoSJE & NDDTC, AIIMS (2019)',
    methodology: 'National household survey across 36 states/UTs.',
    limitations: 'Does not disaggregate synthetic cannabinoids emerging in college corridors after 2019.',
  },
  {
    id: 'ind-mosje-opioids-2019',
    indicator: 'Past-Year Opioid Use (Heroin, Pharmaceutical Opioids, Opium)',
    category: 'prevalence',
    geography: 'India (National Survey)',
    scope: 'India',
    substanceCategory: 'Opioids',
    populationOrAgeGroup: 'General Population (10–75 years)',
    urbanRuralNote: 'Heroin (~1.14%) and pharmaceutical opioids (~0.96%) surpassed traditional opium (~0.52%).',
    value: '2.06% (~2.26 crore individuals; ~77 lakh requiring help)',
    collectionYear: '2017–2018',
    publicationYear: '2019',
    source: 'MoSJE & NDDTC, AIIMS (2019)',
    methodology: 'Household survey paired with Respondent Driven Sampling for hidden populations.',
    limitations: 'Kerala prevalence was below high-burden northern/northeastern states, yet localized clusters require early screening.',
  },
  {
    id: 'ind-mosje-inhalants-youth',
    indicator: 'Inhalant Use Concentration Among Adolescents (10–17) vs Adults',
    category: 'prevalence',
    geography: 'India (Youth Sub-Sample)',
    scope: 'Sub-Population',
    substanceCategory: 'Inhalants & Volatile Solvents',
    populationOrAgeGroup: 'Adolescents Ages 10–17 vs Adults 18–75',
    urbanRuralNote: 'Inhalants are the ONLY category more common in adolescents (1.17%) than adults (0.58%), elevated in street-connected urban youth.',
    value: '1.17% Adolescents · 0.58% Adults (~4.6 lakh children needing help)',
    collectionYear: '2017–2018',
    publicationYear: '2019',
    source: 'MoSJE & NDDTC, AIIMS — Children & Adolescents Sub-Analysis (2019)',
    methodology: 'Age-stratified national survey + vulnerable child cohort assessment.',
    limitations: 'School-based vs out-of-school vulnerability differs sharply; school-only assemblies miss out-of-school youth.',
  },
  {
    id: 'ind-mosje-sedatives-2019',
    indicator: 'Non-Medical Sedative / Hypnotic Use (Ages 10–75)',
    category: 'prevalence',
    geography: 'India (National Survey)',
    scope: 'India',
    substanceCategory: 'Sedatives & Prescription',
    populationOrAgeGroup: 'General Population (10–75 years)',
    urbanRuralNote: 'Occurs across both urban pharmacy access corridors and rural settings; ~11.8 lakh dependent.',
    value: '1.08% (~1.18 crore individuals)',
    collectionYear: '2017–2018',
    publicationYear: '2019',
    source: 'MoSJE & NDDTC, AIIMS (2019)',
    methodology: 'National household prevalence survey.',
    limitations: 'Self-report often blurs prescribed vs non-medical benzodiazepine misuse.',
  },
  {
    id: 'ker-vimukthi-capacity-2024',
    indicator: 'Kerala Vimukthi De-Addiction Centres & Counselling Network',
    category: 'treatment_demand',
    geography: 'Kerala (All 14 Districts)',
    scope: 'Kerala',
    substanceCategory: 'All Substances',
    populationOrAgeGroup: 'All Ages (Separate Adolescent & Adult Pathways)',
    urbanRuralNote: '14 district hospital Vimukthi de-addiction centres + 3 regional counselling hubs + IMHANS Kozhikode.',
    value: '14 District Centres · 24/7 Helpline 14405 · Tele-MANAS 14416',
    collectionYear: '2022–2025',
    publicationYear: '2025',
    source: 'Kerala Excise Department (Vimukthi Mission) & Directorate of Health Services',
    methodology: 'Published state administrative facility directory and service architecture.',
    limitations: 'Outpatient bed utilization and waiting times vary by district; private IRCA/clinic reporting is fragmented.',
  },
  {
    id: 'ind-treatment-gap-nmhs',
    indicator: 'National Treatment Gap for Substance Use Disorders',
    category: 'treatment_demand',
    geography: 'India (Multi-State NMHS)',
    scope: 'India',
    substanceCategory: 'All Substances',
    populationOrAgeGroup: 'Adults 18+ years',
    urbanRuralNote: 'Treatment gap exceeded 75–85% for alcohol and drug disorders across rural & urban centres due to stigma and navigation barriers.',
    value: '~75%–86% Treatment Gap (only ~1 in 4–5 receive formal care)',
    collectionYear: '2015–2016 (MoSJE corroborated 2019)',
    publicationYear: '2016 / 2019',
    source: 'NIMHANS National Mental Health Survey (NMHS) & MoSJE 2019',
    methodology: 'Multi-stage stratified clinical interview survey across 12 states including Kerala.',
    limitations: 'NMHS Round 2 updates are pending full statewise release; telemedicine (Tele-MANAS) launched post-2022.',
  },
  {
    id: 'ker-ndps-enforcement-2023',
    indicator: 'Kerala NDPS Act Case Registrations & Synthetic Drug Seizures',
    category: 'enforcement_seizure',
    geography: 'Kerala State (NCRB / State Police)',
    scope: 'Kerala',
    substanceCategory: 'Synthetic Stimulants / ATS',
    populationOrAgeGroup: 'Enforcement Filings (Not a Population Sample)',
    urbanRuralNote: 'Higher NDPS case counts appear along urban transit hubs (Ernakulam, Thiruvananthapuram, Kozhikode) & border highways.',
    value: 'High per-capita NDPS detection rate (synthetic MDMA/meth & ganja seizures)',
    collectionYear: '2021–2023',
    publicationYear: '2023–2024',
    source: 'National Crime Records Bureau (NCRB Crime in India) & Kerala Excise Operations',
    methodology: 'Police & Excise FIR counts and seizure tallies.',
    limitations: 'CRITICAL BOUNDARY: Higher NDPS registrations reflect proactive policing and highway checking—NOT higher addiction prevalence than other states.',
  },
  {
    id: 'global-unodc-who-2024',
    indicator: 'Global Past-Year Drug Use vs. Drug Use Disorders (Reference Benchmark)',
    category: 'harm_overdose',
    geography: 'Global (UNODC / WHO Benchmark)',
    scope: 'Global Comparison',
    substanceCategory: 'All Substances',
    populationOrAgeGroup: 'Ages 15–64',
    urbanRuralNote: 'Worldwide ~5.6% past-year use (~292M people), while ~64M experience drug use disorders (~1 in 11 receive treatment).',
    value: '5.6% use · ~1.2% disorder · <9% disorder treatment coverage',
    collectionYear: '2022–2023',
    publicationYear: '2024',
    source: 'UNODC World Drug Report 2024 & WHO Global Status Report on Alcohol and Health (2024)',
    methodology: 'Synthesized member-state surveillance, wastewater, treatment registries, and WHO mortality modelling.',
    limitations: 'Cross-country surveillance quality differs; India & South Asia still rely heavily on periodic surveys rather than real-time wastewater monitoring.',
  },
];

export const COMMUNITY_RISK_PROTECTIVE_FACTORS: CommunityRiskProtectiveDimension[] = [
  {
    id: 'rf-protective-school',
    dimension: 'School Connectedness, Mentorship & Structured After-School Activity',
    factorType: 'protective',
    summary: 'Students who feel heard by at least one trusted teacher/mentor and belong to active sports, arts, or NSS clubs delay initiation significantly.',
    populationLevelMechanism: 'Reduces unstructured evening isolation and buffers academic anxiety.',
    preventionTarget: 'Establish non-punitive Vimukthi student clubs + evening sports/creative hours.',
    ethicalNote: 'Target system environments (club access, teacher training), never label individual students "at-risk".',
    sourceRef: 'UNODC International Standards on Drug Use Prevention (2nd ed.)',
  },
  {
    id: 'rf-protective-family',
    dimension: 'Non-Shaming Family Communication & Emotional Safety',
    factorType: 'protective',
    summary: 'Warm parent-youth dialogue without harsh shaming lowers concealment and accelerates voluntary help-seeking.',
    populationLevelMechanism: 'Fear of punishment is a primary barrier keeping young people from disclosing early experimentation.',
    preventionTarget: 'Run parent listening circles and bilingual family orientation evenings.',
    ethicalNote: 'Equip parents with calm scripts rather than punitive surveillance checklists.',
    sourceRef: 'WHO / UNODC Family-Focused Prevention Evidence Synthesis',
  },
  {
    id: 'rf-vuln-exam-hostel',
    dimension: 'Academic Stress, Exam Transitions & Unsupervised Hostel Settings',
    factorType: 'vulnerability_association',
    summary: 'Periods after Class 10/12 board exams and first-year residential college transitions show elevated vulnerability to peer initiation.',
    populationLevelMechanism: 'Sleep disruption, homesickness, and normalization in older-senior social circles raise exposure.',
    preventionTarget: 'Time campus transition orientations and first-year hostel peer mentorship in Weeks 1–4 of term.',
    ethicalNote: 'Describes transition-period vulnerability at population level; never predicts individual student use.',
    sourceRef: 'NIMHANS / Indian Campus Mental Health & Prevention Reviews',
  },
  {
    id: 'rf-vuln-treatment-delay',
    dimension: 'Low Local Awareness of Free, Confidential Care Pathways',
    factorType: 'vulnerability_association',
    summary: 'Families frequently delay reaching clinics by 1–3 years because they fear police involvement or costly private rehab.',
    populationLevelMechanism: 'Misconception that clinical help equals criminal exposure keeps early concerns hidden until crisis.',
    preventionTarget: 'Display clear privacy & cost-free pathway cards (Vimukthi 14405, Tele-MANAS 14416, DISHA 1056) in colleges, libraries, and workplaces.',
    ethicalNote: 'Emphasize voluntary, confidential healthcare rather than fear messaging.',
    sourceRef: 'MoSJE 2019 & NMHS Treatment Gap Findings',
  },
  {
    id: 'rf-vuln-urban-supply',
    dimension: 'Urban Transit Availability vs. Rural Service Distance',
    factorType: 'vulnerability_association',
    summary: 'Urban transit corridors face synthetic/capsule availability pressures, while rural & tribal panchayats face transport barriers to clinical specialists.',
    populationLevelMechanism: 'Prevention needs differ: urban sites require refusal & nightlife/hostel alternatives; rural sites need mobile counselling & tele-health awareness.',
    preventionTarget: 'Differentiate urban campus peer networks vs. rural PHC/ASHA referral bridges.',
    ethicalNote: 'Avoid branding any district "dangerous"; match resource design to structural geography.',
    sourceRef: 'NFHS-5 Urban/Rural Stratification & Kerala DHS Facility Distribution',
  },
];

export const KERALA_DISTRICT_INTELLIGENCE_PROFILES: KeralaDistrictReferenceProfile[] = [
  {
    district: 'Thiruvananthapuram',
    vimukthiHubUnit: 'Govt. Medical College De-Addiction Unit & District Excise Vimukthi Hub',
    publicClinicalUnits: ['Govt. Medical College TVM Psychiatry & De-Addiction', 'General Hospital TVM', 'Tele-MANAS State Node'],
    reportedEnforcementOrDemandContext: 'High institutional density + state border transit monitoring.',
    populationSurveyGapNotice: 'No standalone peer-reviewed all-substance district prevalence household survey published post-2019; avoid citing district % rankings.',
    recommendedPreventionFocus: 'Higher secondary + technical college first-year orientation & commuter campus support desks.',
    svgCoords: { x: 205, y: 445 },
  },
  {
    district: 'Kollam',
    vimukthiHubUnit: 'District Hospital Kollam Vimukthi De-Addiction Centre',
    publicClinicalUnits: ['District Hospital Kollam', 'Parippally Govt. Medical College'],
    reportedEnforcementOrDemandContext: 'Coastal & highway corridor outreach + active school Vimukthi club participation.',
    populationSurveyGapNotice: 'District-level household prevalence rate unavailable in open public surveys; track local school/college reach directly.',
    recommendedPreventionFocus: 'Youth vocational/ITI campus engagement & parent awareness circles.',
    svgCoords: { x: 185, y: 405 },
  },
  {
    district: 'Pathanamthitta',
    vimukthiHubUnit: 'General Hospital Pathanamthitta Vimukthi Unit',
    publicClinicalUnits: ['General Hospital Pathanamthitta', 'District Hospital Kozhencherry'],
    reportedEnforcementOrDemandContext: 'High out-migration households; family stress & elder/youth isolation dynamics.',
    populationSurveyGapNotice: 'Public district prevalence statistics are not disaggregated cleanly; prioritize qualitative school/panchayat needs inputs.',
    recommendedPreventionFocus: 'Parent-grandparent family workshops & panchayat youth sports evenings.',
    svgCoords: { x: 215, y: 365 },
  },
  {
    district: 'Alappuzha',
    vimukthiHubUnit: 'Govt. T.D. Medical College Vandanam & General Hospital Alappuzha',
    publicClinicalUnits: ['Govt. TD Medical College Vandanam', 'General Hospital Alappuzha'],
    reportedEnforcementOrDemandContext: 'Tourism & backwater transit routes paired with coastal/artisan workplace health access.',
    populationSurveyGapNotice: 'No open-access district prevalence timeseries; separate local clinical attendance from community prevalence.',
    recommendedPreventionFocus: 'Workplace & fishing-community family support + secondary school peer clubs.',
    svgCoords: { x: 165, y: 350 },
  },
  {
    district: 'Kottayam',
    vimukthiHubUnit: 'Govt. Medical College Kottayam De-Addiction & District Vimukthi Unit',
    publicClinicalUnits: ['Govt. Medical College Kottayam', 'General Hospital Pala'],
    reportedEnforcementOrDemandContext: 'Dense residential college/coaching population and clinical referral network.',
    populationSurveyGapNotice: 'District household survey gap exists; combine anonymous campus feedback with Tele-MANAS awareness.',
    recommendedPreventionFocus: 'Hostel & coaching-centre stress coping workshops during exam cycles.',
    svgCoords: { x: 195, y: 325 },
  },
  {
    district: 'Idukki',
    vimukthiHubUnit: 'District Hospital Painavu / Thodupuzha Vimukthi Unit',
    publicClinicalUnits: ['Idukki Medical College Painavu', 'Taluk Hospitals (Adimali, Nedumkandam)'],
    reportedEnforcementOrDemandContext: 'Highland terrain creates transport distance barriers to specialist psychiatric wards.',
    populationSurveyGapNotice: 'Under-reported rural/plantation access barriers; enforcement counts along border check-posts do not measure local demand.',
    recommendedPreventionFocus: 'Mobile PHC/ASHA outreach, Tele-MANAS 14416 tele-counselling cards & plantation community circles.',
    svgCoords: { x: 240, y: 300 },
  },
  {
    district: 'Ernakulam',
    vimukthiHubUnit: 'General Hospital Ernakulam Vimukthi Centre & Medical College Kalamassery',
    publicClinicalUnits: ['General Hospital Ernakulam', 'Govt. Medical College Kalamassery', 'NIMHANS-linked regional outreach'],
    reportedEnforcementOrDemandContext: 'Metropolitan transit/IT/college hub with higher reported synthetic enforcement detections and active NGO clinics.',
    populationSurveyGapNotice: 'Higher enforcement/clinic numbers reflect urban policing & service visibility, not necessarily higher per-capita prevalence.',
    recommendedPreventionFocus: 'College hostel early-support desks, urban youth alternatives & workplace wellness drives.',
    svgCoords: { x: 165, y: 280 },
  },
  {
    district: 'Thrissur',
    vimukthiHubUnit: 'Govt. Medical College Thrissur & General Hospital Vimukthi Unit',
    publicClinicalUnits: ['Govt. Medical College Thrissur', 'Mental Health Centre Thrissur', 'General Hospital Thrissur'],
    reportedEnforcementOrDemandContext: 'Major cultural/educational corridor with established public psychiatry referral infrastructure.',
    populationSurveyGapNotice: 'State surveys report state-level averages; local assessment depends on school/ward pre-post baselines.',
    recommendedPreventionFocus: 'Higher secondary teacher training & cultural/arts youth engagement.',
    svgCoords: { x: 165, y: 235 },
  },
  {
    district: 'Palakkad',
    vimukthiHubUnit: 'District Hospital Palakkad Vimukthi De-Addiction Centre',
    publicClinicalUnits: ['District Hospital Palakkad', 'Govt. Medical College Palakkad'],
    reportedEnforcementOrDemandContext: 'Inter-state highway corridor + large rural/agricultural blocks needing accessible Malayalam/Tamil outreach.',
    populationSurveyGapNotice: 'Highway NDPS seizures reflect inter-state transit enforcement rather than resident prevalence.',
    recommendedPreventionFocus: 'Bilingual rural panchayat & polytechnic college awareness + PHC screening referral.',
    svgCoords: { x: 215, y: 205 },
  },
  {
    district: 'Malappuram',
    vimukthiHubUnit: 'Govt. Medical College Manjeri & District Hospital Tirur Vimukthi Units',
    publicClinicalUnits: ['Govt. Medical College Manjeri', 'District Hospital Perinthalmanna / Tirur'],
    reportedEnforcementOrDemandContext: 'Large youth demographic share; strong community & educational club potential.',
    populationSurveyGapNotice: 'No open district household survey; prioritize positive youth sports/skills initiatives and non-judgmental helplines.',
    recommendedPreventionFocus: 'Youth sports clubs, school counselling orientation & parent communication clinics.',
    svgCoords: { x: 160, y: 170 },
  },
  {
    district: 'Kozhikode',
    vimukthiHubUnit: 'IMHANS Kozhikode & Govt. Medical College Clinical Addiction Unit',
    publicClinicalUnits: ['IMHANS Kozhikode', 'Govt. Medical College Kozhikode', 'General Hospital Beach'],
    reportedEnforcementOrDemandContext: 'Regional northern Kerala specialty mental health & addiction hub (IMHANS) serving neighbouring districts.',
    populationSurveyGapNotice: 'Hospital caseload includes referrals from neighbouring northern districts; cannot be read as Kozhikode-only incidence.',
    recommendedPreventionFocus: 'Adolescent clinical referral linkages, college peer mentoring & teacher early-identification guides.',
    svgCoords: { x: 135, y: 130 },
  },
  {
    district: 'Wayanad',
    vimukthiHubUnit: 'District Hospital Mananthavady & Sulthan Bathery Vimukthi Units',
    publicClinicalUnits: ['Govt. Medical College Wayanad (Mananthavady)', 'Taluk Hospital Sulthan Bathery'],
    reportedEnforcementOrDemandContext: 'Rural/tribal hamlets face significant distance & cultural barriers to specialist follow-up.',
    populationSurveyGapNotice: 'Remote hamlets often under-represented in clinic registries; prioritize community-led culturally respectful outreach.',
    recommendedPreventionFocus: 'Tribal promoter / ASHA partnerships, local-language visual toolkits & school retention support.',
    svgCoords: { x: 185, y: 115 },
  },
  {
    district: 'Kannur',
    vimukthiHubUnit: 'Govt. Medical College Kannur (Pariyaram) & District Hospital Kannur',
    publicClinicalUnits: ['Govt. Medical College Pariyaram', 'District Hospital Kannur'],
    reportedEnforcementOrDemandContext: 'Active local library & college movement enabling peer-led community mobilization.',
    populationSurveyGapNotice: 'Public district prevalence statistics unavailable; evaluate campaigns via anonymous pre/post clarity & referral reach.',
    recommendedPreventionFocus: 'Library/youth club study-and-sport collectives & vocational campus programmes.',
    svgCoords: { x: 120, y: 75 },
  },
  {
    district: 'Kasaragod',
    vimukthiHubUnit: 'District Hospital Kanhangad & General Hospital Kasaragod Vimukthi Units',
    publicClinicalUnits: ['District Hospital Kanhangad', 'General Hospital Kasaragod'],
    reportedEnforcementOrDemandContext: 'Northern border district with multilingual (Malayalam, Kannada, Tulu) access needs and fewer tertiary psychiatric specialists.',
    populationSurveyGapNotice: 'Limited local tertiary rehabilitation slots require explicit Tele-MANAS 14416 & cross-district referral awareness.',
    recommendedPreventionFocus: 'Multilingual school awareness, tele-counselling navigation & community volunteer training.',
    svgCoords: { x: 95, y: 35 },
  },
];

export const PREVENTION_EVALUATION_CRITERIA: PreventionEvaluationCriterion[] = [
  {
    id: 'problem_relevance',
    label: 'Relevance to Local Need',
    question: 'Does it address an observed community gap rather than a generic assumption?',
    maxScore: 5,
  },
  {
    id: 'evidence_base',
    label: 'Scientific Evidence Fit',
    question: 'Does it use interactive skills, mentoring, or environmental support instead of fear-scare lectures?',
    maxScore: 5,
  },
  {
    id: 'target_specificity',
    label: 'Target Group Clarity',
    question: 'Is the audience age, setting, and context clearly narrowed?',
    maxScore: 5,
  },
  {
    id: 'feasibility',
    label: 'Operational Feasibility',
    question: 'Can local staff/volunteers sustain it with realistic budget & hours?',
    maxScore: 5,
  },
  {
    id: 'non_stigmatizing',
    label: 'Zero-Stigma & Confidentiality',
    question: 'Does it avoid singling out, shaming, or profiling individual youth?',
    maxScore: 5,
  },
  {
    id: 'safeguarding',
    label: 'Age & Crisis Safeguarding',
    question: 'Are referral paths (14405 / 14416 / 1056 / 112) & minor safeguards built in?',
    maxScore: 5,
  },
  {
    id: 'partner_readiness',
    label: 'Partner & Institutional Buy-In',
    question: 'Are schools, parents, PHCs, or local clinics genuinely involved?',
    maxScore: 5,
  },
  {
    id: 'measurable_indicators',
    label: 'Measurable Outcomes',
    question: 'Does it measure clarity, skills, or help-seeking confidence—not just headcount?',
    maxScore: 5,
  },
  {
    id: 'unintended_harm_check',
    label: 'Unintended Risk Mitigation',
    question: 'Does it guard against curiosity rebound, rumour-spreading, or coercion?',
    maxScore: 5,
  },
];
