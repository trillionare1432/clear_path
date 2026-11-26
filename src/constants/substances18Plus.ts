export interface SubstanceScienceProfile {
  id: string;
  name: string;
  commonAliases: string;
  substanceClass: string;
  activeMechanism: string;
  brainEffects: string;
  shortTermEffects: string[];
  longTermEffects: string[];
  overdoseWarningSigns: string[];
  wikipediaUrl: string;
  evidenceSource: string;
}

export const VERIFIED_SUBSTANCES_18_PLUS: SubstanceScienceProfile[] = [
  {
    id: 'alcohol-ethanol',
    name: 'Alcohol (Ethanol)',
    commonAliases: 'Beer, Wine, Spirits, Liquor',
    substanceClass: 'Central Nervous System (CNS) Depressant',
    activeMechanism:
      'Ethanol enhances inhibitory GABA-A receptor signaling while blocking excitatory NMDA glutamate receptors across cortical and subcortical brain regions.',
    brainEffects:
      'Slows prefrontal cortex executive decision-making, impairs cerebellar coordination, and suppresses hippocampal memory consolidation (causing blackouts at high blood alcohol levels). Repeated heavy exposure triggers tolerance via GABA down-regulation and glutamate hyperactivity during withdrawal.',
    shortTermEffects: [
      'Lowered inhibitions, slowed reaction speed, and slurred speech',
      'Impaired depth perception, balance, and working memory',
      'Disrupted REM and slow-wave sleep architecture despite rapid sedation',
    ],
    longTermEffects: [
      'Hepatic steatosis (fatty liver), alcoholic hepatitis, and cirrhosis risk',
      'Elevated risk of hypertension, cardiomyopathy, and gastrointestinal inflammation',
      'Thiamine deficiency (Wernicke–Korsakoff syndrome) and persistent baseline anxiety',
    ],
    overdoseWarningSigns: [
      'Slow, irregular breathing (< 8 breaths per minute) or long pauses between breaths',
      'Unresponsiveness, inability to wake up, or cold clammy skin',
      'Vomiting while semi-conscious or seizures (Call 112 / 14405 immediately)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Alcohol_(drug)',
    evidenceSource: 'World Health Organization (WHO) & NIAAA Neuroscience Reference',
  },
  {
    id: 'nicotine-vapes',
    name: 'Nicotine (Cigarettes & Vapes)',
    commonAliases: 'E-cigarettes, Pods, Gutkha, Chewing Tobacco',
    substanceClass: 'Cholinergic Stimulant',
    activeMechanism:
      'Nicotine binds directly to nicotinic acetylcholine receptors (nAChRs) in the brain within 10 seconds of inhalation, triggering rapid dopamine release in the nucleus accumbens.',
    brainEffects:
      'Creates rapid receptor desensitization followed by up-regulation, producing intense hourly craving loops when blood nicotine drops. In brains under age 25, repeated nicotine alters prefrontal circuits governing attention span and impulse regulation.',
    shortTermEffects: [
      'Acute spike in heart rate and blood vessel constriction',
      'Brief alertness followed quickly by irritability or restlessness as levels fall',
      'Airway irritation; e-cigarette aerosols also carry heavy metals and ultrafine particulates',
    ],
    longTermEffects: [
      'Accelerated atherosclerosis, coronary heart disease, and chronic bronchitis/COPD',
      'Elevated baseline stress sensitivity due to nicotine withdrawal cycles',
      'Oral, pharyngeal, and pulmonary malignancy risk (higher with combustible and smokeless tobacco)',
    ],
    overdoseWarningSigns: [
      'Severe dizziness, nausea, vomiting, and cold sweats (acute nicotine toxicity)',
      'Rapid irregular heartbeat or extreme confusion (especially in concentrated liquid ingestion)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Nicotine',
    evidenceSource: 'ICMR White Paper on ENDS & WHO Tobacco Neurobiology Report',
  },
  {
    id: 'cannabis-thc',
    name: 'Cannabis (High-Potency THC)',
    commonAliases: 'Marijuana, Ganja, Hashish, THC Vapes, Edibles',
    substanceClass: 'Cannabinoid (Partial CB1/CB2 Agonist)',
    activeMechanism:
      'Delta-9-THC mimics the endogenous neurotransmitter anandamide and activates CB1 receptors densely packed in the hippocampus, amygdala, and prefrontal cortex.',
    brainEffects:
      'Disrupts synaptic timing in working memory encoding and alters sensory gating. High-potency concentrates (>15–70% THC) carry markedly higher risk of acute panic, depersonalization, and cannabis-induced psychotic episodes in vulnerable adolescents.',
    shortTermEffects: [
      'Altered time perception, slowed reaction time, and impaired short-term recall',
      'Elevated resting heart rate, dry mouth, and conjunctival redness',
      'Potential acute anxiety, paranoia, or nausea—especially with concentrated edibles',
    ],
    longTermEffects: [
      'Reduced sustained motivation and measurable verbal memory decline with heavy youth use',
      'Cannabinoid Hyperemesis Syndrome (cyclic severe nausea/vomiting) in chronic daily users',
      'Increased statistical risk of triggering latent mood or psychotic disorders',
    ],
    overdoseWarningSigns: [
      'Severe panic, hallucinations, disorientation, or uncontrollable cyclical vomiting',
      'Tachycardia with chest pain or severe dehydration (seek medical care)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cannabis_(drug)',
    evidenceSource: 'NIDA Adolescent Brain Cognitive Development (ABCD) & WHO Cannabis Review',
  },
  {
    id: 'methamphetamine',
    name: 'Methamphetamine',
    commonAliases: 'Crystal Meth, Ice, MD (street misnomer in parts of India)',
    substanceClass: 'Potent Sympathomimetic Amphetamine Stimulant',
    activeMechanism:
      'Reverses vesicular monoamine transporters (VMAT2) and dopamine transporters (DAT), forcing massive non-physiological dumps of dopamine, norepinephrine, and serotonin into synapses.',
    brainEffects:
      'Causes supraphysiological dopamine surges far exceeding natural rewards, accompanied by oxidative stress and neurotoxicity to dopaminergic and serotonergic axon terminals.',
    shortTermEffects: [
      'Hyper-wakefulness for 12–24+ hours, suppressed appetite, and hyperthermia',
      'Teeth grinding (bruxism), dilated pupils, and severe heart rate elevation',
      'Agitation, compulsive repetitive behaviors, or acute persecutory paranoia',
    ],
    longTermEffects: [
      'Severe anhedonia (inability to feel everyday pleasure) during prolonged recovery',
      'Methamphetamine-induced psychosis (auditory/visual hallucinations, delusions)',
      'Cardiovascular damage, severe dental erosion, and malnutrition',
    ],
    overdoseWarningSigns: [
      'Dangerous hyperthermia (>40°C / extreme overheating), chest pain, or seizure',
      'Extreme agitation, stroke symptoms, or unresponsiveness (Call 112 immediately)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Methamphetamine',
    evidenceSource: 'National Institute on Drug Abuse (NIDA) & UNODC World Drug Report',
  },
  {
    id: 'mdma-ecstasy',
    name: 'MDMA (Ecstasy / Molly)',
    commonAliases: 'Ecstasy, Molly, Party Pills',
    substanceClass: 'Entactogen / Stimulant Phenethylamine',
    activeMechanism:
      'Triggers massive acute release of serotonin (5-HT), alongside dopamine and norepinephrine, by reversing monoamine reuptake transporters.',
    brainEffects:
      'Depletes vesicular serotonin stores intensely over 3–6 hours, frequently followed by multi-day mid-week mood drops, cognitive fog, and sleep disruption as serotonin synthesis recovers.',
    shortTermEffects: [
      'Elevated body temperature, jaw clenching, dehydration, or hyponatremia from over-drinking water',
      'Elevated blood pressure, tachycardia, and impaired thermoregulation in warm spaces',
    ],
    longTermEffects: [
      'Serotonergic axon vulnerability and persistent post-use depressive crashes',
      'High risk of adulteration in unregulated pills (often mixed with synthetic cathinones or fentanyl)',
    ],
    overdoseWarningSigns: [
      'Rapidly climbing body temperature, muscle rigidity, confusion, or fainting',
      'Seizures or irregular heart rhythm (emergency cooling & 112 required)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/MDMA',
    evidenceSource: 'EMCDDA & NIDA Pharmacology Monograph',
  },
  {
    id: 'cocaine',
    name: 'Cocaine',
    commonAliases: 'Coke, Crack, Snow, Blow',
    substanceClass: 'Monoamine Reuptake Inhibitor & Local Anesthetic',
    activeMechanism:
      'Blocks dopamine, norepinephrine, and serotonin reuptake transporters (DAT, NET, SERT), causing rapid synaptic buildup in reward and sympathetic vascular pathways.',
    brainEffects:
      'Produces short, sharp peaks (15–45 minutes) followed by steep crashes, driving intense compulsive redosing loops and heightened limbic stress reactivity.',
    shortTermEffects: [
      'Vasoconstriction (narrowed coronary & cerebral arteries) and sharp blood pressure spikes',
      'Restlessness, irritability, dilated pupils, and impaired impulse judgement',
    ],
    longTermEffects: [
      'Myocardial infarction (heart attack) and ischemic stroke risk even in young adults',
      'Nasal septum perforation (insufflation) or severe pulmonary injury (smoked base)',
      'Chronic paranoia, insomnia, and severe mood crashes',
    ],
    overdoseWarningSigns: [
      'Crushing chest pain, extreme hypertension, delirium, or sudden collapse',
      'Seizures or cardiac arrhythmia (Call 112 immediately)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cocaine',
    evidenceSource: 'WHO Substance Use Monographs & AHA Cardiovascular Advisory',
  },
  {
    id: 'heroin-opioids',
    name: 'Heroin & Illicit Opioids',
    commonAliases: 'Brown Sugar, Smack, Fentanyl-Adulterated Powders',
    substanceClass: 'Mu-Opioid Receptor Agonist',
    activeMechanism:
      'Crosses the blood-brain barrier rapidly and binds mu-opioid receptors in the ventral tegmental area, locus coeruleus, and brainstem respiratory centers.',
    brainEffects:
      'Suppresses brainstem carbon-dioxide chemoreceptors (causing lethal breathing slowdown) while flooding reward pathways and suppressing natural endorphin production.',
    shortTermEffects: [
      'Pinpoint pupils, heavy sedation ("nodding off"), slowed speech, and analgesia',
      'Slowed gastrointestinal motility, nausea, and suppressed cough reflex',
    ],
    longTermEffects: [
      'Rapid severe physical dependence with painful flu-like autonomic withdrawal',
      'Collapsed veins, endocarditis, HIV/Hepatitis B & C risk from non-sterile injection',
    ],
    overdoseWarningSigns: [
      'Pinpoint pupils, blue/gray lips or fingernails, gurgling/snoring sounds, or unresponsiveness',
      'Breathing stops or slows below 6 breaths/min (Administer Naloxone if available & call 112)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Heroin',
    evidenceSource: 'WHO Opioid Overdose Guidelines & NIMHANS Clinical Reference',
  },
  {
    id: 'morphine-rx-opioids',
    name: 'Morphine & Prescription Opioids',
    commonAliases: 'Morphine, Oxycodone, Tramadol, Codeine Cough Syrups',
    substanceClass: 'Opioid Analgesic',
    activeMechanism:
      'Activates mu-opioid G-protein coupled receptors in spinal dorsal horn and brain pain-modulation networks to block nociceptive transmission.',
    brainEffects:
      'Therapeutic for severe acute/palliative pain under medical supervision, yet non-medical escalation quickly induces tolerance and suppresses brainstem respiratory drive.',
    shortTermEffects: [
      'Drowsiness, slowed reflexes, constipation, and respiratory depression',
      'Hazardous synergistic sedation if mixed with alcohol or benzodiazepines',
    ],
    longTermEffects: [
      'Opioid-induced hyperalgesia (paradoxical increased pain sensitivity)',
      'Hormonal suppression, tolerance escalation, and severe physical withdrawal upon abrupt stop',
    ],
    overdoseWarningSigns: [
      'Extreme sedation, inability to speak or wake up, and dangerously shallow breathing',
      'Blue-tinged extremities or choking noises (Call 112 immediately)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Morphine',
    evidenceSource: 'WHO Essential Medicines & ASAM Pain Management Guidelines',
  },
  {
    id: 'lsd-hallucinogens',
    name: 'LSD & Classic Hallucinogens',
    commonAliases: 'Acid, Stamps, Blotters, Psilocybin',
    substanceClass: 'Serotonergic Psychedelic (5-HT2A Agonist)',
    activeMechanism:
      'Acts primarily as a partial agonist at cortical 5-HT2A serotonin receptors, disrupting default mode network (DMN) connectivity and thalamic sensory filtering.',
    brainEffects:
      'Causes widespread cross-talk between normally segregated sensory and emotional brain regions for 6–12 hours. Unpredictable psychological distress ("bad trips") can escalate sharply into panic or unsafe physical behavior.',
    shortTermEffects: [
      'Visual/auditory perceptual distortion, altered sense of time, and dilated pupils',
      'Rapid mood swings, intense fear, paranoia, or dissociation in unsafe environments',
    ],
    longTermEffects: [
      'Hallucinogen Persisting Perception Disorder (HPPD — recurring visual disturbances)',
      'Potential precipitation of prolonged psychosis or anxiety disorders in predisposed individuals',
    ],
    overdoseWarningSigns: [
      'Severe disorientation, self-harm risk, extreme hyperthermia (especially with NBOMe counterfeits sold as LSD)',
      'Seizures or severe agitation requiring medical sedation (Call 112)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/LSD',
    evidenceSource: 'NIDA Hallucinogen Research & Psychiatry Neuroimaging Literature',
  },
  {
    id: 'benzodiazepines',
    name: 'Benzodiazepines (Non-Medical Use)',
    commonAliases: 'Alprazolam, Diazepam, Nitrazepam, Sleeping Pills',
    substanceClass: 'GABA-A Positive Allosteric Modulator',
    activeMechanism:
      'Increases the frequency of chloride channel opening at GABA-A receptors, broadly dampening neuronal firing across the central nervous system.',
    brainEffects:
      'Rapidly suppresses amygdala anxiety signaling but causes severe anterograde amnesia (memory gaps). Chronic misuse makes unassisted sleep and calm nearly impossible without tapered medical detox.',
    shortTermEffects: [
      'Slurred speech, motor incoordination, impaired memory formation, and confusion',
      'Lethal respiratory suppression when combined with alcohol or opioids',
    ],
    longTermEffects: [
      'Cognitive blunting, falls, and rebound insomnia/anxiety worse than original baseline',
      'Dangerous physiological withdrawal—abrupt cessation can trigger life-threatening seizures',
    ],
    overdoseWarningSigns: [
      'Unresponsiveness, extreme respiratory slowing (especially with co-ingested alcohol/opioids)',
      'Withdrawal seizure risk if stopped abruptly after daily high-dose use (Seek hospital detox)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Benzodiazepine',
    evidenceSource: 'WHO Mental Health Gap & Maudsley Prescribing Guidelines',
  },
  {
    id: 'ketamine',
    name: 'Ketamine',
    commonAliases: 'Special K, K, KitKat',
    substanceClass: 'Dissociative Anesthetic (NMDA Antagonist)',
    activeMechanism:
      'Non-competitively blocks NMDA glutamate receptors, disconnecting thalamocortical sensory input from conscious awareness.',
    brainEffects:
      'Produces dose-dependent perceptual detachment ("K-hole" immobility at high doses) and impairs pain awareness, increasing risk of accidental trauma or drowning.',
    shortTermEffects: [
      'Dissociation, impaired motor coordination, blurred vision, and elevated blood pressure',
      'Nausea, confusion, and loss of awareness of physical hazards',
    ],
    longTermEffects: [
      'Ketamine-induced ulcerative cystitis (severe irreversible bladder pain and scarring)',
      'Working memory deficits and cholestatic biliary abdominal cramps ("K-cramps")',
    ],
    overdoseWarningSigns: [
      'Complete unresponsiveness, choking on vomit while dissociated, or dangerous heart/BP spike',
      'Severe airway compromise when combined with alcohol or depressants',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ketamine',
    evidenceSource: 'WHO Expert Committee on Drug Dependence & British Urology Reviews',
  },
  {
    id: 'inhalants-solvents',
    name: 'Volatile Inhalants & Solvents',
    commonAliases: 'Glue, Correction Fluid, Paint Thinner, Petrol Fumes',
    substanceClass: 'CNS Depressant & Lipid-Soluble Solvent',
    activeMechanism:
      'Lipophilic hydrocarbon vapors dissolve rapidly across alveolar membranes into myelin-rich brain tissue, disrupting neuronal membrane ion channels and causing hypoxia.',
    brainEffects:
      'Causes acute cerebral oxygen deprivation and direct toxic demyelination of white matter pathways responsible for balance, memory, and cognition.',
    shortTermEffects: [
      'Dizziness, slurred speech, hypoxia, chemical burns around mouth/nose, and disorientation',
      'Sudden Sniffing Death Syndrome: fatal cardiac arrhythmia even on a first-time inhalation',
    ],
    longTermEffects: [
      'Permanent white-matter brain injury, cerebellar ataxia (tremors/balance loss), and hearing loss',
      'Bone marrow suppression, renal tubular damage, and liver toxicity',
    ],
    overdoseWarningSigns: [
      'Sudden cardiac arrest, collapse, seizures, or cyanosis (blue lips from asphyxiation)',
      'Move immediately to fresh air and call 112',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Inhalant',
    evidenceSource: 'NIMHANS Adolescent Solvent Monograph & AAP Clinical Guidelines',
  },
  {
    id: 'synthetic-cannabinoids',
    name: 'Synthetic Cannabinoids (K2 / Spice)',
    commonAliases: 'Spice, K2, Synthetic Weed, Herbal Incense',
    substanceClass: 'Full CB1 Receptor Agonist (Synthetic Indoles)',
    activeMechanism:
      'Unlike plant THC (a partial agonist), laboratory synthetic cannabinoids bind CB1 receptors with 10× to 100× higher full-agonist affinity, overloading inhibitory feedback.',
    brainEffects:
      'Triggers erratic, violent surges in autonomic and limbic signaling, causing far more severe psychosis, seizures, and cardiovascular emergencies than natural cannabis.',
    shortTermEffects: [
      'Extreme agitation, auditory hallucinations, tachycardia, and uncontrollable vomiting',
      'Sudden loss of consciousness or violent confusion',
    ],
    longTermEffects: [
      'Acute kidney injury, ischemic stroke, and prolonged psychiatric hospitalization',
      'Severe withdrawal marked by rapid heart rate, tremors, and agitation',
    ],
    overdoseWarningSigns: [
      'Seizures, dangerously fast heart rate (>160 bpm), psychosis, or unresponsiveness',
      'Call 112 immediately; inform clinicians if synthetic blends are suspected',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Synthetic_cannabinoids',
    evidenceSource: 'EMCDDA New Psychoactive Substances (NPS) & CDC Toxicology Alerts',
  },
  {
    id: 'prescription-stimulants',
    name: 'Prescription Stimulants (Non-Medical Use)',
    commonAliases: 'Methylphenidate, Amphetamine Salts ("Study Pills")',
    substanceClass: 'Catecholamine Stimulant',
    activeMechanism:
      'Inhibits dopamine and norepinephrine reuptake (and increases synaptic release), elevating prefrontal arousal and sympathetic nervous tone.',
    brainEffects:
      'While medically prescribed for diagnosed ADHD at calibrated doses, non-medical high-dose use for late-night studying impairs sleep architecture, disrupts hippocampal memory consolidation, and spikes anxiety.',
    shortTermEffects: [
      'Tachycardia, elevated blood pressure, tremors, insomnia, and appetite loss',
      'Paradoxical scattered focus or panic attacks under sleep deprivation',
    ],
    longTermEffects: [
      'Chronic insomnia, cardiovascular strain, and mood crashes during non-use days',
      'Escalating psychological reliance for academic deadlines',
    ],
    overdoseWarningSigns: [
      'Chest pain, severe hyperthermia, erratic heartbeat, or acute paranoia/hallucinations',
      'Seek urgent medical assessment via 112',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Stimulant',
    evidenceSource: 'NIDA Prescription Stimulants & Sleep Neuroscience Reviews',
  },
  {
    id: 'mephedrone-cathinones',
    name: 'Mephedrone & Synthetic Cathinones',
    commonAliases: 'Meow Meow, M-Cat, Bath Salts, Synthetic Stimulants',
    substanceClass: 'Synthetic Cathinone Monoamine Releaser',
    activeMechanism:
      'Rapidly increases synaptic dopamine, serotonin, and norepinephrine while inhibiting monoamine transporters—producing intense but brief stimulant surges.',
    brainEffects:
      'Because effects fade quickly (45–90 minutes), users experience intense redosing urges within a single night, rapidly escalating neurochemical depletion and psychiatric destabilization.',
    shortTermEffects: [
      'Severe heart racing, jaw clenching, profuse sweating, and vasoconstriction (blue/cold fingers)',
      'Intense anxiety, agitation, and insomnia',
    ],
    longTermEffects: [
      'Severe craving compulsions, depressive crashes, and stimulant psychosis',
      'Vascular injury and severe weight loss',
    ],
    overdoseWarningSigns: [
      'Extreme fever, violent agitation/delirium, chest tightness, or seizures (Call 112)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Mephedrone',
    evidenceSource: 'UNODC Synthetic Cathinones Global Assessment',
  },
  {
    id: 'barbiturates',
    name: 'Barbiturates (Sedative-Hypnotics)',
    commonAliases: 'Phenobarbital, Secobarbital ("Downers")',
    substanceClass: 'GABA-A Channel-Prolonging CNS Depressant',
    activeMechanism:
      'Directly increases the duration of chloride channel opening at GABA-A receptors—and at high doses mimics GABA directly, carrying a very narrow margin between intoxication and fatal coma.',
    brainEffects:
      'Deeply depresses cortical arousal and medullary respiratory drive simultaneously. Unlike benzodiazepines, barbiturates have a notoriously narrow therapeutic safety index.',
    shortTermEffects: [
      'Profound drowsiness, slurred speech, impaired judgment, and shallow breathing',
      'Rapidly fatal coma if combined with alcohol or opioids',
    ],
    longTermEffects: [
      'Severe physiological dependence where unsupervised withdrawal causes life-threatening delirium and seizures',
    ],
    overdoseWarningSigns: [
      'Pinpoint or dilated unreactive pupils, hypothermia, feeble pulse, and respiratory arrest (Call 112)',
    ],
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Barbiturate',
    evidenceSource: 'WHO Clinical Pharmacology & Emergency Toxicology Reference',
  },
];
