// Lightweight EN/FR translation layer.
// Usage: add data-i18n="key" to any element's text, or data-i18n-placeholder="key" for inputs.
const TRANSLATIONS = {
  en: {
    nav_about: "About",
    nav_report: "Report a visit",
    nav_anonymous: "Anonymous · no login",
    disclaimer: "Heads up: wait times here are reported by patients, not collected from hospitals or health authorities.",
    disclaimer_link: "Learn more",
    hero_eyebrow: "Canada-wide, updated by patients",
    hero_title: "Know before you go.",
    hero_lede: "Real ER and walk-in wait times, reported anonymously by people who were just there — so you're not guessing in the parking lot.",
    search_placeholder: "Search a hospital or clinic name…",
    section_near_you: "Near you",
    section_why: "Why waits vary so much",
    stat1_label: "emergency department visits across Canada in 2024–25 — about 44,000 people every day.",
    stat2_label: "patients waited more than 14 hours for care in Canadian EDs, per the latest national data.",
    stat3_label: "of ED visits result in a hospital admission — those patients often wait far longer than others.",
    stats_source: "Source: Canadian Institute for Health Information (CIHI), National Ambulatory Care Reporting System, 2024–25",
    chart_title: "Current average waits near you",
    chart_sub: "Based on HonestER's own patient-reported data for nearby facilities.",
    triage_title: "How Canadian ERs decide who's seen next",
    triage_step1: "You're assessed at check-in using CTAS, a 5-level urgency scale used across Canada.",
    triage_step2: "The most urgent cases are seen first — not the first to arrive.",
    triage_step3: "That's why your wait can shift as more urgent cases arrive after you.",
    weekly_counter_pre: "Reports submitted this week:",
    footer_note: "HonestER is community-reported and anonymous. Wait times are not sourced from hospitals, clinics, or health authorities.",
    browse_by_province: "Browse by province",
    avg_wait: "avg wait",
    no_data_yet: "No data yet",
    reports_based_on: "reports in the last 48h",
    form_title: "Report your visit",
    form_sub: "Takes about 5 minutes. No personal info collected.",
    label_facility: "Hospital or clinic",
    label_checkin: "Check-in time",
    label_seen: "Seen by doctor",
    label_age: "Age bracket",
    label_reason: "Reason for visit",
    label_rating: "Overall rating",
    label_staff: "Doctors or nurses you saw (optional)",
    add_staff: "Add a doctor or nurse",
    submit: "Submit report",
    privacy_note: "No names, emails, or IP addresses are stored with your report.",
    confirmation_title: "Thanks for the report",
    confirmation_sub: "Your submission helps the next person know what to expect.",
    back_to_map: "Back to map",
  },
  fr: {
    nav_about: "À propos",
    nav_report: "Signaler une visite",
    nav_anonymous: "Anonyme · sans connexion",
    disclaimer: "Attention : les temps d'attente proviennent des patients, et non des hôpitaux ou des autorités de santé.",
    disclaimer_link: "En savoir plus",
    hero_eyebrow: "Partout au Canada, mis à jour par les patients",
    hero_title: "Sachez avant d'y aller.",
    hero_lede: "De vrais temps d'attente aux urgences et cliniques sans rendez-vous, signalés anonymement par des patients — pour ne plus deviner dans le stationnement.",
    search_placeholder: "Rechercher un hôpital ou une clinique…",
    section_near_you: "Près de vous",
    section_why: "Pourquoi les temps d'attente varient autant",
    stat1_label: "visites aux urgences partout au Canada en 2024–2025 — environ 44 000 personnes chaque jour.",
    stat2_label: "des patients ont attendu plus de 14 heures dans les urgences canadiennes, selon les dernières données nationales.",
    stat3_label: "des visites aux urgences mènent à une hospitalisation — ces patients attendent souvent beaucoup plus longtemps.",
    stats_source: "Source : Institut canadien d'information sur la santé (ICIS), Système national d'information sur les soins ambulatoires, 2024–2025",
    chart_title: "Temps d'attente moyens actuels près de vous",
    chart_sub: "Basé sur les données rapportées par les patients de HonestER pour les établissements à proximité.",
    triage_title: "Comment les urgences canadiennes décident qui est vu en premier",
    triage_step1: "Vous êtes évalué à l'arrivée selon le CTAS, une échelle d'urgence à 5 niveaux utilisée partout au Canada.",
    triage_step2: "Les cas les plus urgents sont vus en premier — pas les premiers arrivés.",
    triage_step3: "C'est pourquoi votre attente peut changer si des cas plus urgents arrivent après vous.",
    weekly_counter_pre: "Signalements soumis cette semaine :",
    footer_note: "HonestER est communautaire et anonyme. Les temps d'attente ne proviennent pas des hôpitaux, cliniques ou autorités de santé.",
    browse_by_province: "Parcourir par province",
    avg_wait: "attente moy.",
    no_data_yet: "Aucune donnée",
    reports_based_on: "signalements dans les dernières 48h",
    form_title: "Signalez votre visite",
    form_sub: "Environ 5 minutes. Aucune information personnelle n'est recueillie.",
    label_facility: "Hôpital ou clinique",
    label_checkin: "Heure d'arrivée",
    label_seen: "Vu par un médecin",
    label_age: "Tranche d'âge",
    label_reason: "Motif de la visite",
    label_rating: "Évaluation générale",
    label_staff: "Médecins ou infirmières vus (optionnel)",
    add_staff: "Ajouter un médecin ou une infirmière",
    submit: "Envoyer le signalement",
    privacy_note: "Aucun nom, courriel ou adresse IP n'est conservé avec votre signalement.",
    confirmation_title: "Merci pour votre signalement",
    confirmation_sub: "Votre contribution aide la prochaine personne à savoir à quoi s'attendre.",
    back_to_map: "Retour à la carte",
  },
};

function getLang() {
  return localStorage.getItem("honester_lang") || "en";
}

function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });
  document.documentElement.lang = lang;
  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.textContent = lang === "en" ? "FR" : "EN";
}

function toggleLang() {
  const next = getLang() === "en" ? "fr" : "en";
  localStorage.setItem("honester_lang", next);
  applyTranslations(next);
}

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("nav.main-nav");
  if (nav) {
    const btn = document.createElement("button");
    btn.id = "lang-toggle";
    btn.className = "lang-toggle-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Switch language / Changer de langue");
    btn.addEventListener("click", toggleLang);
    nav.prepend(btn);
  }
  applyTranslations(getLang());
});
