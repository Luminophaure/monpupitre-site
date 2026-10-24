/* =====================================================================
   CATALOGUE : MATIÈRES, NIVEAUX, CHAPITRES
   C'est le seul fichier à modifier pour faire grandir le site.
   L'accueil, les pages de matière, le fil d'Ariane et les liens
   « précédent / suivant » se construisent tout seuls à partir d'ici.

   AJOUTER UN CHAPITRE
     1. crée la page dans le dossier de sa matière et de son niveau,
        par exemple : svt/seconde/cellule.html (copie modele/chapitre-vierge.html)
     2. ci-dessous, ajoute  fichier: "svt/seconde/cellule.html"  sur la ligne du chapitre
        (un chapitre sans "fichier" s'affiche « à venir »)
     3. dans la page : <body data-matiere="svt" data-chapitre="cellule">

   AJOUTER UNE MATIÈRE
     copie un bloc { id: ..., nom: ..., niveaux: [...] } et change-le.
     "couleur" : maths, svt, pc, snt, lettres, histoire, langues, ses, philo, neutre
     "ouverte: false" affiche la matière en « bientôt » sur l'accueil.
   ===================================================================== */
window.SITE = {
  nom: "Monpupitre",
  accroche: "Le site qui ne fait pas tes devoirs à ta place.",
  sousTitre: "Cours, méthodes, exercices corrigés, laboratoires et jeux, de la quatrième à la terminale.",
  auteur: "Vincent Grimal",   // affiché en bas de page, à côté du copyright
  /* La mention de licence du pied de page. Le fichier LICENSE, à la racine, fait foi :
     le contenu pédagogique est en CC BY-NC-SA 4.0, le code reste tous droits réservés.
     Changer l'une sans l'autre donnerait deux versions contradictoires. */
  annee: 2026,
  licence: { nom: "CC BY-NC-SA 4.0",
             url: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr" },
};

/* L'ORDRE DES NIVEAUX dans la colonne de gauche.
   La colonne range les chapitres par niveau, puis par matière : il faut donc un ordre
   des niveaux valable pour toutes les matières. Un niveau absent de cette liste se range
   à la fin, dans l'ordre où il apparaît dans le catalogue — rien ne casse si on oublie
   de l'ajouter, mais il se retrouve au mauvais endroit. */
window.NIVEAUX = ["quatrieme", "seconde", "premiere", "premiere-st2s", "terminale", "terminale-comp"];

window.MATIERES = [
  { id: "maths", nom: "Mathématiques", couleur: "maths", ouverte: true,
    accroche: "Fonctions, calcul, géométrie, probabilités : comprendre et s'entraîner pas à pas.",
    niveaux: [
      { id: "quatrieme", nom: "Quatrième", chapitres: [
        { id: "relatifs-4",    titre: "Nombres relatifs : les quatre opérations" },
        { id: "fractions-4",   titre: "Fractions" },
        { id: "puissances-4",  titre: "Puissances" },
        { id: "calcul-litteral-4", titre: "Calcul littéral", fichier: "maths/quatrieme/calcul-litteral.html" },
        { id: "equations-4",   titre: "Équations" },
        { id: "proportionnalite-4", titre: "Proportionnalité" },
        { id: "pythagore",     titre: "Théorème de Pythagore" },
        { id: "transformations-4", titre: "Transformations et triangles semblables" },
        { id: "solides-4",     titre: "Pyramides et cônes" },
        { id: "stats-4",       titre: "Statistiques et probabilités" },
      ]},
      { id: "seconde", nom: "Seconde", chapitres: [
        { id: "nombres",       titre: "Nombres et intervalles" },
        { id: "calcul",        titre: "Calcul littéral" },
        { id: "equations",     titre: "Équations et inéquations" },
        { id: "fonctions",     titre: "Notion de fonction", fichier: "maths/seconde/fonctions.html" },
        { id: "references",    titre: "Fonctions de référence" },
        { id: "variations",    titre: "Variations et extremums" },
        { id: "signe",         titre: "Signe d'une fonction" },
        { id: "vecteurs",      titre: "Vecteurs : translation, somme et produit", fichier: "maths/seconde/vecteurs.html" },
        { id: "vecteurs-coord", titre: "Vecteurs : coordonnées et colinéarité" },
        { id: "reperage",      titre: "Repérage dans le plan" },
        { id: "droites",       titre: "Droites et systèmes" },
        { id: "evolutions",    titre: "Proportions et évolutions" },
        { id: "statistiques",  titre: "Statistiques" },
        { id: "probabilites",  titre: "Probabilités et échantillonnage" },
      ]},
      { id: "premiere", nom: "Première spécialité", chapitres: [
        { id: "second-degre",  titre: "Second degré" },
        { id: "suites",        titre: "Suites numériques" },
        { id: "derivation",    titre: "Dérivation" },
        { id: "variations-1",  titre: "Variations et courbes" },
        { id: "exponentielle", titre: "Fonction exponentielle" },
        { id: "trigo",         titre: "Trigonométrie" },
        { id: "produit-scal",  titre: "Produit scalaire" },
        { id: "geo-reperee",   titre: "Géométrie repérée" },
        { id: "proba-cond",    titre: "Probabilités conditionnelles" },
        { id: "var-alea",      titre: "Variables aléatoires" },
      ]},
      { id: "terminale", nom: "Terminale spécialité", chapitres: [
        { id: "denombrement",  titre: "Combinatoire et dénombrement" },
        { id: "suites-t",      titre: "Suites et récurrence" },
        { id: "limites",       titre: "Limites de fonctions" },
        { id: "continuite",    titre: "Continuité et convexité" },
        { id: "logarithme",    titre: "Logarithme népérien" },
        { id: "sin-cos",       titre: "Fonctions sinus et cosinus" },
        { id: "primitives",    titre: "Primitives et équations différentielles" },
        { id: "integrales",    titre: "Calcul intégral" },
        { id: "espace-vecteurs", titre: "Vecteurs, droites et plans de l'espace", fichier: "maths/terminale/vecteurs-droites-plans.html" },
        { id: "espace-ortho",  titre: "Orthogonalité et distances dans l'espace" },
        { id: "binomiale",     titre: "Loi binomiale" },
        { id: "grands-nombres",titre: "Sommes de variables et loi des grands nombres" },
      ]},
      { id: "terminale-comp", nom: "Terminale maths complémentaires", chapitres: [
        { id: "suites-comp",   titre: "Suites et modélisation" },
        { id: "limites-comp",  titre: "Limites de suites et de fonctions", fichier: "maths/terminale-comp/limites.html" },
        { id: "derivation-c",  titre: "Dérivation et convexité" },
        { id: "exp-ln",        titre: "Exponentielle et logarithme" },
        { id: "primitives-c",  titre: "Primitives et équations différentielles" },
        { id: "integrale-c",   titre: "Calcul intégral" },
        { id: "densite",       titre: "Lois à densité" },
        { id: "stat-2var",     titre: "Statistiques à deux variables" },
      ]},
    ]},

  { id: "svt", nom: "SVT", nomLong: "Sciences de la vie et de la Terre", couleur: "svt", ouverte: true,
    accroche: "Documents à annoter, microscope virtuel et TP simulés.",
    niveaux: [
      { id: "seconde", nom: "Seconde", chapitres: [
        { id: "cellule",       titre: "La cellule, unité du vivant" },
        { id: "metabolisme",   titre: "Le métabolisme des cellules" },
        { id: "adn",           titre: "L'ADN, support de l'information génétique" },
        { id: "biodiversite",  titre: "Biodiversité et évolution" },
        { id: "geosciences",   titre: "Géosciences et dynamique des paysages" },
        { id: "agrosystemes",  titre: "Agrosystèmes et développement durable" },
        { id: "procreation",   titre: "Procréation et sexualité humaine" },
        { id: "microorganismes", titre: "Microorganismes et santé" },
      ]},
      { id: "premiere", nom: "Première spécialité", chapitres: [
        { id: "genetique-1",   titre: "Transmission et expression du patrimoine génétique" },
        { id: "terre-interne", titre: "La dynamique interne de la Terre" },
        { id: "ecosystemes",   titre: "Écosystèmes et services environnementaux" },
        { id: "sante-1",       titre: "Variation génétique et santé" },
        { id: "immunite",      titre: "Le système immunitaire" },
      ]},
      { id: "terminale", nom: "Terminale spécialité", chapitres: [
        { id: "genetique-evo", titre: "Génétique et évolution" },
        { id: "passe-geol",    titre: "À la recherche du passé géologique" },
        { id: "plante-dom",    titre: "De la plante sauvage à la plante domestiquée" },
        { id: "climats",       titre: "Les climats de la Terre" },
        { id: "mouvement",     titre: "Comportement, mouvement et système nerveux" },
        { id: "stress",        titre: "Produire le mouvement et réagir au stress" },
      ]},
    ]},

  { id: "physique-chimie", nom: "Physique-chimie", couleur: "pc", ouverte: true,
    accroche: "Mini-laboratoires interactifs pour mesurer, observer et modéliser.",
    niveaux: [
      { id: "seconde", nom: "Seconde", chapitres: [
        { id: "corps-purs",    titre: "Corps purs et mélanges" },
        { id: "matiere-micro", titre: "La matière à l'échelle microscopique" },
        { id: "transformations", titre: "Transformations physiques, chimiques et nucléaires" },
        { id: "mouvement-2",   titre: "Décrire un mouvement" },
        { id: "interactions",  titre: "Modéliser une action sur un système" },
        { id: "son",           titre: "Émission et perception d'un son" },
        { id: "lumiere",       titre: "Vision et image" },
        { id: "circuits",      titre: "Signaux et capteurs" },
      ]},
      { id: "premiere", nom: "Première spécialité", chapitres: [
        { id: "suivi-systeme", titre: "Suivi de l'évolution d'un système chimique" },
        { id: "structure",     titre: "De la structure à la propriété" },
        { id: "energie-chim",  titre: "Propriétés physico-chimiques et énergie" },
        { id: "mouvement-1",   titre: "Mouvement et interactions" },
        { id: "energie",       titre: "Conversions et transferts d'énergie" },
        { id: "ondes-1",       titre: "Ondes et signaux" },
      ]},
      { id: "premiere-st2s", nom: "Première ST2S", chapitres: [
        { id: "solutions-ph",      titre: "Solutions, concentrations et pH", fichier: "physique-chimie/premiere-st2s/solutions-ph.html" },
        { id: "oxydoreduction",    titre: "Désinfectants et antiseptiques : l'oxydoréduction" },
        { id: "electricite-habitat", titre: "L'électricité dans l'habitat", fichier: "physique-chimie/premiere-st2s/electricite-habitat.html" },
        { id: "infrarouges",       titre: "Infrarouges et détection", fichier: "physique-chimie/premiere-st2s/infrarouges.html" },
        { id: "securite-routiere", titre: "Sécurité routière : énergie cinétique et distance d'arrêt" },
        { id: "sons-audition",     titre: "Les ondes sonores et l'audition" },
        { id: "lentilles-images",  titre: "Lumière, lentilles et images" },
        { id: "defauts-vision",    titre: "Les défauts de la vision et leur correction" },
        { id: "fluides-pression",  titre: "Fluides et pression sanguine" },
        { id: "molecules-organiques", titre: "Décrire les molécules organiques" },
        { id: "molecules-vivant",  titre: "Les molécules du vivant et l'eau" },
        { id: "energie-alimentation", titre: "Besoins énergétiques et alimentation" },
        { id: "glucides",          titre: "Les glucides dans l'organisme" },
        { id: "eau-sols",          titre: "Eau potable, sols et engrais" },
      ]},
      { id: "terminale", nom: "Terminale spécialité", chapitres: [
        { id: "acide-base",    titre: "Transformations acide-base et dosages" },
        { id: "cinetique",     titre: "Cinétique et sens d'évolution" },
        { id: "synthese",      titre: "Synthèse organique" },
        { id: "newton",        titre: "Mouvement et deuxième loi de Newton" },
        { id: "thermo",        titre: "Thermodynamique et transferts thermiques" },
        { id: "diffraction-interferences", titre: "Diffraction et interférences", fichier: "physique-chimie/terminale/diffraction-interferences.html" },
        { id: "son-doppler",   titre: "Intensité sonore et effet Doppler" },
        { id: "photons",       titre: "Lunette astronomique et effet photoélectrique" },
        { id: "electrique",    titre: "Dynamique d'un système électrique" },
      ]},
    ]},

  { id: "snt", nom: "SNT", nomLong: "Sciences numériques et technologie", couleur: "snt", ouverte: true,
    accroche: "Python dans le navigateur, web, données, réseaux : comprendre le numérique en le manipulant.",
    niveaux: [
      { id: "seconde", nom: "Seconde", chapitres: [
        { id: "python",        titre: "Programmer en Python" },
        { id: "internet",      titre: "Internet" },
        { id: "web",           titre: "Le Web" },
        { id: "reseaux-sociaux", titre: "Les réseaux sociaux" },
        { id: "donnees",       titre: "Les données structurées" },
        { id: "localisation",  titre: "Localisation, cartographie et mobilité" },
        { id: "objets",        titre: "Informatique embarquée et objets connectés" },
        { id: "photo",         titre: "La photographie numérique" },
      ]},
    ]},

  /* --- Matières prévues : elles apparaissent en « bientôt » sur l'accueil --- */
  { id: "enseignement-scientifique", nom: "Enseignement scientifique", couleur: "neutre", ouverte: false, niveaux: [] },
  { id: "nsi",       nom: "NSI",       nomLong: "Numérique et sciences informatiques", couleur: "snt", ouverte: false, niveaux: [] },
  { id: "francais",  nom: "Français",  couleur: "lettres",  ouverte: false, niveaux: [] },
  { id: "histoire-geo", nom: "Histoire-géographie", couleur: "histoire", ouverte: false, niveaux: [] },
  { id: "langues",   nom: "Langues vivantes", couleur: "langues", ouverte: false, niveaux: [] },
  { id: "ses",       nom: "SES",       nomLong: "Sciences économiques et sociales", couleur: "ses", ouverte: false, niveaux: [] },
  { id: "philosophie", nom: "Philosophie", couleur: "philo", ouverte: false, niveaux: [] },
];
