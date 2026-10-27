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
  sousTitre: "Cours, méthodes, exercices corrigés, laboratoires et jeux, de la sixième à la terminale.",
  auteur: "Vincent Grimal",   // affiché en bas de page, à côté du copyright
  /* La mention de licence du pied de page. Le fichier LICENSE, à la racine, fait foi :
     le contenu pédagogique est en CC BY-NC-SA 4.0, le code reste tous droits réservés.
     Changer l'une sans l'autre donnerait deux versions contradictoires. */
  annee: 2026,
  licence: { nom: "CC BY-NC-SA 4.0",
             url: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr" },
};

/* LES CLASSES ET LEURS FILIÈRES, pour la colonne de gauche.
   La colonne range par classe (Quatrième, Seconde, Première, Terminale), puis par filière
   (Générale, ST2S…), puis par matière. Chaque filière dit quels « niveaux » du catalogue
   elle réunit, et sous quel nom les distinguer quand une même matière en a plusieurs
   dans la filière (en Terminale générale, les maths de spécialité et les maths
   complémentaires). Une classe sans filière nommée (collège, Seconde) montre ses matières
   directement. Un niveau du catalogue absent d'ici se range à la fin, comme une classe à
   lui seul : rien ne casse si on l'oublie, mais il se retrouve au mauvais endroit. */
window.CLASSES = [
  { id: "sixieme", cycle: "college", nom: "Sixième", filieres: [
    { id: "sixieme", nom: "", niveaux: { sixieme: "" } } ] },
  { id: "cinquieme", cycle: "college", nom: "Cinquième", filieres: [
    { id: "cinquieme", nom: "", niveaux: { cinquieme: "" } } ] },
  { id: "quatrieme", cycle: "college", nom: "Quatrième", filieres: [
    { id: "quatrieme", nom: "", niveaux: { quatrieme: "" } } ] },
  { id: "troisieme", cycle: "college", nom: "Troisième", filieres: [
    { id: "troisieme", nom: "", niveaux: { troisieme: "" } } ] },
  { id: "seconde", cycle: "lycee", nom: "Seconde", filieres: [
    { id: "seconde", nom: "", niveaux: { seconde: "" } } ] },
  { id: "premiere", cycle: "lycee", nom: "Première", filieres: [
    { id: "premiere-generale", nom: "Générale", niveaux: { premiere: "Spécialité" } },
    { id: "premiere-st2s", nom: "ST2S", niveaux: { "premiere-techno": "Tronc commun", "premiere-st2s": "Spécialité" } },
    { id: "premiere-sti2d", nom: "STI2D", niveaux: { "premiere-techno": "Tronc commun", "premiere-sti2d": "Spécialité physique-chimie et maths" } },
    { id: "premiere-stl", nom: "STL", niveaux: { "premiere-techno": "Tronc commun", "premiere-stl": "Spécialité physique-chimie et maths" } } ] },
  { id: "terminale", cycle: "lycee", nom: "Terminale", filieres: [
    { id: "terminale-generale", nom: "Générale", niveaux: { terminale: "Spécialité", "terminale-comp": "Maths complémentaires" } },
    { id: "terminale-st2s", nom: "ST2S", niveaux: { "terminale-techno": "Tronc commun", "terminale-st2s": "Spécialité CBPH (partie chimie)" } },
    { id: "terminale-sti2d", nom: "STI2D", niveaux: { "terminale-techno": "Tronc commun", "terminale-sti2d": "Spécialité physique-chimie et maths" } },
    { id: "terminale-stl", nom: "STL", niveaux: { "terminale-techno": "Tronc commun", "terminale-stl": "Spécialité physique-chimie et maths", "terminale-stl-spcl": "Spécialité SPCL" } } ] }
];
/* les deux cycles qui regroupent les classes dans la colonne (une classe sans cycle se
   range après eux, à part) */
window.CYCLES = [ { id: "college", nom: "Collège" }, { id: "lycee", nom: "Lycée" } ];
/* l'ordre des niveaux, déduit des classes (gardé pour ce qui le lit encore) */
window.NIVEAUX = [...new Set(window.CLASSES.flatMap(c => c.filieres.flatMap(f => Object.keys(f.niveaux))))];

window.MATIERES = [
  { id: "maths", nom: "Mathématiques", couleur: "maths", ouverte: true,
    accroche: "Fonctions, calcul, géométrie, probabilités : comprendre et s'entraîner pas à pas.",
    niveaux: [
      /* programme du cycle 3 de 2025, en 6e depuis la rentrée 2025 */
      { id: "sixieme", nom: "Sixième", chapitres: [
        { id: "decimaux-6", titre: "Nombres entiers et décimaux" },
        { id: "calcul-decimaux-6", titre: "Calculer avec les décimaux" },
        { id: "division-6", titre: "Division euclidienne et divisibilité" },
        { id: "angles-6", titre: "Angles et bissectrice" },
        { id: "fractions-6", titre: "Fractions" },
        { id: "symetrie-6", titre: "Symétrie axiale et médiatrice" },
        { id: "problemes-6", titre: "Problèmes : schémas en barres et motifs" },
        { id: "cercle-triangles-6", titre: "Cercle et triangles" },
        { id: "proportionnalite-6", titre: "Proportionnalité et pourcentages" },
        { id: "mesures-6", titre: "Périmètres, aires et durées" },
        { id: "solides-6", titre: "Solides et volumes" },
        { id: "donnees-6", titre: "Données et probabilités" },
      ]},
      /* nouveau programme du cycle 4 (BO n° 10 du 5 mars 2026), en 5e depuis la rentrée 2026 */
      { id: "cinquieme", nom: "Cinquième", chapitres: [
        { id: "relatifs-5", titre: "Nombres relatifs" },
        { id: "calculs-5", titre: "Priorités, multiples et diviseurs" },
        { id: "angles-5", titre: "Angles et parallélisme" },
        { id: "fractions-5", titre: "Fractions" },
        { id: "triangles-5", titre: "Triangles" },
        { id: "calcul-litteral-5", titre: "Calcul littéral et premières équations" },
        { id: "parallelogrammes-5", titre: "Symétrie centrale et parallélogrammes" },
        { id: "proportionnalite-5", titre: "Proportionnalité et pourcentages" },
        { id: "puissances-5", titre: "Carrés et cubes" },
        { id: "fonctions-5", titre: "Premières fonctions : tableaux et graphiques" },
        { id: "espace-5", titre: "Prismes, cylindres et volumes" },
        { id: "stats-probas-5", titre: "Statistiques et probabilités" },
      ]},
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
      /* programme de cycle 4 de 2015 et repères annuels de 2019, en 3e jusqu'en 2028 */
      { id: "troisieme", nom: "Troisième", chapitres: [
        { id: "arithmetique-3", titre: "Nombres premiers et arithmétique" },
        { id: "puissances-3", titre: "Puissances et racines carrées" },
        { id: "calcul-litteral-3", titre: "Calcul littéral : développer et factoriser" },
        { id: "thales-3", titre: "Théorème de Thalès" },
        { id: "equations-3", titre: "Équations et équations produits" },
        { id: "fonctions-3", titre: "Notion de fonction" },
        { id: "statistiques-3", titre: "Statistiques : médiane et étendue" },
        { id: "fonctions-affines-3", titre: "Fonctions linéaires et affines" },
        { id: "trigo-3", titre: "Trigonométrie" },
        { id: "homotheties-3", titre: "Homothéties et transformations" },
        { id: "probabilites-3", titre: "Probabilités" },
        { id: "espace-3", titre: "Sphère, boule et sections de solides" },
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
        { id: "suites",        titre: "Suites numériques", fichier: "maths/premiere/suites.html" },
        { id: "derivation",    titre: "Dérivation" },
        { id: "variations-1",  titre: "Variations et courbes" },
        { id: "exponentielle", titre: "Fonction exponentielle" },
        { id: "trigo",         titre: "Trigonométrie" },
        { id: "produit-scal",  titre: "Produit scalaire" },
        { id: "geo-reperee",   titre: "Géométrie repérée" },
        { id: "proba-cond",    titre: "Probabilités conditionnelles" },
        { id: "var-alea",      titre: "Variables aléatoires" },
      ]},
      /* tronc commun des séries technologiques (ST2S, STI2D, STL…), nouveau programme, BO n° 14 du 2 avril 2026 */
      { id: "premiere-techno", nom: "Première technologique", chapitres: [
        { id: "logique-1t", titre: "Ensembles, intervalles et logique" },
        { id: "suites-1t", titre: "Suites arithmétiques et géométriques" },
        { id: "fonctions-1t", titre: "Fonctions : représentations et taux de variation" },
        { id: "second-degre-1t", titre: "Fonctions polynômes du second degré" },
        { id: "degre3-1t", titre: "Fonctions polynômes de degré 3" },
        { id: "derivation-1t", titre: "Nombre dérivé et tangente" },
        { id: "variations-1t", titre: "Fonction dérivée et variations" },
        { id: "stat-2var-1t", titre: "Statistiques à deux variables" },
        { id: "proba-cond-1t", titre: "Probabilités conditionnelles et indépendance" },
        { id: "epreuves-1t", titre: "Épreuves répétées et arbres" },
        { id: "var-alea-1t", titre: "Variables aléatoires et loi de Bernoulli" },
        { id: "python-1t", titre: "Python : listes et données" },
      ]},
      /* partie maths de la spécialité « physique-chimie et mathématiques », BO spécial n° 1 du 22 janvier 2019 */
      { id: "premiere-sti2d", nom: "Première STI2D", chapitres: [
        { id: "trigo-1pcm-sti2d", titre: "Cercle trigonométrique et radians" },
        { id: "sinus-1pcm-sti2d", titre: "Fonctions sinus et cosinus, signaux sinusoïdaux" },
        { id: "produit-scal-1pcm-sti2d", titre: "Produit scalaire" },
        { id: "complexes-1pcm-sti2d", titre: "Nombres complexes : forme algébrique" },
        { id: "complexes-trigo-1pcm-sti2d", titre: "Module, argument et forme trigonométrique" },
        { id: "derivees-1pcm-sti2d", titre: "Dérivées : règles de calcul" },
        { id: "primitives-1pcm-sti2d", titre: "Primitives et méthode d'Euler" },
      ]},
      /* partie maths de la spécialité « physique-chimie et mathématiques » (sans les nombres complexes), BO spécial n° 1 du 22 janvier 2019 */
      { id: "premiere-stl", nom: "Première STL", chapitres: [
        { id: "trigo-1pcm-stl", titre: "Cercle trigonométrique et radians" },
        { id: "sinus-1pcm-stl", titre: "Fonctions sinus et cosinus, signaux sinusoïdaux" },
        { id: "produit-scal-1pcm-stl", titre: "Produit scalaire" },
        { id: "derivees-1pcm-stl", titre: "Dérivées : règles de calcul" },
        { id: "primitives-1pcm-stl", titre: "Primitives et méthode d'Euler" },
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
      /* tronc commun des séries technologiques, programme de 2019 (BO spécial n° 8 du 25 juillet 2019), valable jusqu'en 2027 */
      { id: "terminale-techno", nom: "Terminale technologique", chapitres: [
        { id: "evolutions-tt", titre: "Évolutions, indices et taux moyens" },
        { id: "suites-tt", titre: "Suites : terme général et sommes" },
        { id: "expo-tt", titre: "Fonctions exponentielles de base a" },
        { id: "log-tt", titre: "Fonction logarithme décimal" },
        { id: "inverse-tt", titre: "Fonction inverse" },
        { id: "stat-2var-tt", titre: "Statistiques à deux variables et ajustement" },
        { id: "proba-cond-tt", titre: "Probabilités conditionnelles et indépendance" },
        { id: "var-alea-tt", titre: "Variables aléatoires discrètes" },
        { id: "binomiale-tt", titre: "Loi binomiale" },
        { id: "python-tt", titre: "Algorithmique : listes et simulations" },
      ]},
      /* partie maths de la spécialité « physique-chimie et mathématiques », BO spécial n° 8 du 25 juillet 2019 */
      { id: "terminale-sti2d", nom: "Terminale STI2D", chapitres: [
        { id: "exp-tpcm-sti2d", titre: "Fonction exponentielle" },
        { id: "ln-tpcm-sti2d", titre: "Fonction logarithme népérien" },
        { id: "composition-tpcm-sti2d", titre: "Composition de fonctions et primitives" },
        { id: "integration-tpcm-sti2d", titre: "Intégration et valeur moyenne" },
        { id: "eqdiff-tpcm-sti2d", titre: "Équations différentielles" },
        { id: "complexes-tpcm-sti2d", titre: "Forme exponentielle et signaux sinusoïdaux" },
      ]},
      /* partie maths de la spécialité « physique-chimie et mathématiques » (sans les nombres complexes) */
      { id: "terminale-stl", nom: "Terminale STL", chapitres: [
        { id: "exp-tpcm-stl", titre: "Fonction exponentielle" },
        { id: "ln-tpcm-stl", titre: "Fonction logarithme népérien" },
        { id: "composition-tpcm-stl", titre: "Composition de fonctions et primitives" },
        { id: "integration-tpcm-stl", titre: "Intégration et valeur moyenne" },
        { id: "eqdiff-tpcm-stl", titre: "Équations différentielles" },
      ]},
    ]},

  { id: "svt", nom: "SVT", nomLong: "Sciences de la vie et de la Terre", couleur: "svt", ouverte: true,
    accroche: "Documents à annoter, microscope virtuel et TP simulés.",
    niveaux: [
      /* partie « vivant, Terre, santé » de Sciences et technologie (cycle 3, programme 2023) */
      { id: "sixieme", nom: "Sixième", chapitres: [
        { id: "cellules-6", titre: "Le vivant est fait de cellules" },
        { id: "classification-6", titre: "Classer les êtres vivants" },
        { id: "biodiversite-6", titre: "Biodiversité d'hier et d'aujourd'hui" },
        { id: "ecosystemes-6", titre: "Les écosystèmes au fil des saisons" },
        { id: "chaines-alimentaires-6", titre: "Végétaux, chaînes alimentaires et décomposeurs" },
        { id: "pollinisation-6", titre: "De la fleur au fruit : la pollinisation" },
        { id: "alimentation-6", titre: "Alimentation : besoins et conservation des aliments" },
        { id: "puberte-6", titre: "Puberté et reproduction humaine" },
        { id: "terre-climat-6", titre: "Une planète habitable, un climat qui change" },
      ]},
      /* cycle 4, programme 2020 ; pas de répartition officielle par année */
      { id: "cinquieme", nom: "Cinquième", chapitres: [
        { id: "meteo-climat-5", titre: "Météo et climat" },
        { id: "ressources-5", titre: "Les ressources naturelles et leur exploitation" },
        { id: "respiration-5", titre: "Respirer dans tous les milieux" },
        { id: "vegetaux-5", titre: "Ce dont une plante a besoin" },
        { id: "circulation-5", titre: "Nourrir et oxygéner les cellules" },
        { id: "reproduction-5", titre: "Se reproduire et peupler les milieux" },
        { id: "effort-5", titre: "Le corps pendant l'effort" },
        { id: "alimentation-5", titre: "S'alimenter : besoins et microbiote" },
      ]},
      { id: "quatrieme", nom: "Quatrième", chapitres: [
        { id: "seismes-4", titre: "Les séismes" },
        { id: "volcans-4", titre: "Les volcans" },
        { id: "tectonique-4", titre: "La tectonique des plaques" },
        { id: "risques-4", titre: "Risques naturels et prévention" },
        { id: "photosynthese-4", titre: "La photosynthèse et les sèves" },
        { id: "reproduction-sexuee-4", titre: "Reproduction sexuée et chromosomes" },
        { id: "puberte-4", titre: "Puberté, reproduction et sexualité humaines" },
        { id: "systeme-nerveux-4", titre: "Le système nerveux et les drogues" },
        { id: "digestion-4", titre: "La digestion" },
      ]},
      { id: "troisieme", nom: "Troisième", chapitres: [
        { id: "histoire-terre-3", titre: "L'histoire de la Terre et les ères géologiques" },
        { id: "climat-3", titre: "Changement climatique et activités humaines" },
        { id: "genetique-3", titre: "ADN, gènes et allèles" },
        { id: "heredite-3", titre: "Hérédité : la transmission des chromosomes" },
        { id: "parente-3", titre: "Parentés entre les êtres vivants" },
        { id: "evolution-3", titre: "L'évolution des espèces" },
        { id: "microbes-3", titre: "Le monde microbien et l'hygiène" },
        { id: "immunite-3", titre: "Se défendre contre les microbes : l'immunité" },
      ]},
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
      /* partie « matière, mouvement, énergie, information » de Sciences et technologie (cycle 3, programme 2023) */
      { id: "sixieme", nom: "Sixième", chapitres: [
        { id: "materiaux-6", titre: "Décrire et trier les matériaux" },
        { id: "etats-6", titre: "Les changements d'état" },
        { id: "masse-volume-6", titre: "Masse et volume" },
        { id: "melanges-6", titre: "Mélanges et transformations chimiques" },
        { id: "mouvement-6", titre: "Mouvement et vitesse" },
        { id: "jour-saisons-6", titre: "Jour, nuit et saisons" },
        { id: "energie-6", titre: "Les formes d'énergie et leurs ressources" },
        { id: "circuits-6", titre: "Circuits électriques et sécurité" },
        { id: "signaux-6", titre: "Des signaux pour transmettre une information" },
      ]},
      /* cycle 4, programme 2020, réparti comme l'outil de planification de l'inspection (2020) */
      { id: "cinquieme", nom: "Cinquième", chapitres: [
        { id: "melanges-5", titre: "Mélanges, corps purs et solubilité" },
        { id: "etats-5", titre: "Les états de la matière et ses changements d'état" },
        { id: "transfo-chimique-5", titre: "Premières transformations chimiques" },
        { id: "systeme-solaire-5", titre: "Le système solaire" },
        { id: "mouvement-5", titre: "Décrire un mouvement : trajectoire et vitesse" },
        { id: "actions-5", titre: "Actions de contact et à distance" },
        { id: "energie-5", titre: "Transferts et conversions d'énergie" },
        { id: "circuits-5", titre: "Circuits en série et en dérivation" },
        { id: "lumiere-5", titre: "La lumière : sources et propagation" },
      ]},
      { id: "quatrieme", nom: "Quatrième", chapitres: [
        { id: "masse-volumique-4", titre: "La masse volumique" },
        { id: "air-4", titre: "L'air qui nous entoure" },
        { id: "atomes-molecules-4", titre: "Atomes, molécules et tableau périodique" },
        { id: "combustions-4", titre: "Combustions et équations de réaction" },
        { id: "vitesse-4", titre: "Vitesse et relativité du mouvement" },
        { id: "poids-4", titre: "Le poids, une action de la Terre" },
        { id: "lois-electricite-4", titre: "Les lois de l'électricité" },
        { id: "energie-puissance-4", titre: "Énergie, puissance et durée" },
        { id: "propagation-4", titre: "Vitesse de la lumière et du son" },
      ]},
      { id: "troisieme", nom: "Troisième", chapitres: [
        { id: "atomes-ions-3", titre: "Atomes et ions" },
        { id: "ph-3", titre: "Acides, bases et pH" },
        { id: "univers-3", titre: "Galaxies et évolution de l'Univers" },
        { id: "forces-3", titre: "Modéliser une action par une force" },
        { id: "gravitation-3", titre: "La gravitation universelle" },
        { id: "energie-cinetique-3", titre: "Énergie cinétique et sécurité routière" },
        { id: "loi-ohm-3", titre: "La loi d'Ohm" },
        { id: "puissance-electrique-3", titre: "Puissance et énergie électriques" },
        { id: "frequences-3", titre: "Sons inaudibles et rayonnements invisibles" },
      ]},
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
      /* partie physique-chimie de la spécialité « physique-chimie et mathématiques », BO spécial n° 1 du 22 janvier 2019 */
      { id: "premiere-sti2d", nom: "Première STI2D", chapitres: [
        { id: "mesure-1pcm-sti2d", titre: "Mesure et incertitudes" },
        { id: "energie-enjeux-1pcm-sti2d", titre: "L'énergie et ses enjeux : puissance et rendement" },
        { id: "energie-elec-1pcm-sti2d", titre: "Énergie électrique : circuits et puissance" },
        { id: "energie-interne-1pcm-sti2d", titre: "Énergie interne et transferts thermiques" },
        { id: "energie-meca-1pcm-sti2d", titre: "Énergie mécanique : travail et énergie cinétique" },
        { id: "lumiere-1pcm-sti2d", titre: "Énergie lumineuse et photovoltaïque" },
        { id: "materiaux-1pcm-sti2d", titre: "Matériaux et organisation de la matière" },
        { id: "combustions-1pcm-sti2d", titre: "Énergie chimique : les combustions" },
        { id: "oxydo-1pcm-sti2d", titre: "Oxydoréduction, corrosion et piles" },
        { id: "ondes-1pcm-sti2d", titre: "Notion d'onde" },
        { id: "sons-1pcm-sti2d", titre: "Ondes sonores" },
        { id: "em-1pcm-sti2d", titre: "Ondes électromagnétiques" },
      ]},
      /* idem, programme propre à la série STL */
      { id: "premiere-stl", nom: "Première STL", chapitres: [
        { id: "mesure-1pcm-stl", titre: "Mesure et incertitudes" },
        { id: "lewis-1pcm-stl", titre: "Structure des molécules : Lewis, géométrie, polarité" },
        { id: "organique-1pcm-stl", titre: "Molécules organiques et isomérie" },
        { id: "solutions-1pcm-stl", titre: "Solvants, solutés et concentrations" },
        { id: "acide-base-1pcm-stl", titre: "Réactions acide-base et pH" },
        { id: "cinetique-1pcm-stl", titre: "Cinétique chimique" },
        { id: "mouvement-1pcm-stl", titre: "Décrire un mouvement" },
        { id: "newton-1pcm-stl", titre: "Forces et lois de Newton" },
        { id: "energie-1pcm-stl", titre: "Travail, énergie cinétique et puissance" },
        { id: "ondes-meca-1pcm-stl", titre: "Ondes mécaniques, sons et ultrasons" },
        { id: "em-1pcm-stl", titre: "Ondes électromagnétiques et photons" },
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
      /* partie chimie de la spécialité « chimie, biologie et physiopathologie humaines », BO spécial n° 8 du 25 juillet 2019 */
      { id: "terminale-st2s", nom: "Terminale ST2S (chimie)", chapitres: [
        { id: "securite-routiere-cbph", titre: "Sécurité routière : airbag et alcootest" },
        { id: "aliments-cbph", titre: "Sécurité des aliments : oxydation et conservation" },
        { id: "environnement-cbph", titre: "Polluants de l'air et de l'eau" },
        { id: "imagerie-cbph", titre: "Imagerie médicale et radioactivité" },
        { id: "analyse-cbph", titre: "Analyser les milieux : dosages et spectrophotométrie" },
        { id: "biomolecules-cbph", titre: "Acides aminés, protéines et chiralité" },
        { id: "lipides-cbph", titre: "Lipides, vitamines et additifs" },
        { id: "medicament-cbph", titre: "De la molécule au médicament" },
        { id: "cosmetiques-cbph", titre: "Cosmétiques et chimie verte" },
      ]},
      /* partie physique-chimie de la spécialité « physique-chimie et mathématiques », BO spécial n° 8 du 25 juillet 2019 */
      { id: "terminale-sti2d", nom: "Terminale STI2D", chapitres: [
        { id: "rendement-tpcm-sti2d", titre: "Puissance, rendement et réversibilité" },
        { id: "sinusoidal-tpcm-sti2d", titre: "Régime sinusoïdal et puissances électriques" },
        { id: "reseau-tpcm-sti2d", titre: "Transport de l'électricité et sécurité" },
        { id: "thermique-tpcm-sti2d", titre: "Flux thermique et changements d'état" },
        { id: "dynamique-tpcm-sti2d", titre: "Dynamique : forces, frottements et rotation" },
        { id: "fluides-tpcm-sti2d", titre: "Statique des fluides et pression" },
        { id: "photon-tpcm-sti2d", titre: "Photons, photovoltaïque et photothermique" },
        { id: "nucleaire-tpcm-sti2d", titre: "Radioactivité, fission et fusion" },
        { id: "piles-tpcm-sti2d", titre: "Combustions, piles et accumulateurs" },
        { id: "acide-base-tpcm-sti2d", titre: "Acides, bases et pH" },
        { id: "spectres-tpcm-sti2d", titre: "Spectres, sons et niveau sonore" },
        { id: "transmission-tpcm-sti2d", titre: "Transmettre l'information par ondes" },
      ]},
      /* idem, programme propre à la série STL */
      { id: "terminale-stl", nom: "Terminale STL", chapitres: [
        { id: "stereo-tpcm-stl", titre: "Stéréochimie : chiralité et isomérie Z/E" },
        { id: "acide-base-tpcm-stl", titre: "Réactions acide-base en solution" },
        { id: "oxydo-tpcm-stl", titre: "Oxydoréduction" },
        { id: "cinetique-tpcm-stl", titre: "Cinétique chimique" },
        { id: "radioactivite-tpcm-stl", titre: "Radioactivité" },
        { id: "acceleration-tpcm-stl", titre: "Mouvements et accélération" },
        { id: "champ-tpcm-stl", titre: "Force et champ électrostatiques" },
        { id: "newton-tpcm-stl", titre: "Lois de Newton et chute avec frottement" },
        { id: "energie-meca-tpcm-stl", titre: "Chaînes énergétiques et énergie mécanique" },
        { id: "energie-chim-tpcm-stl", titre: "Énergie chimique et énergie électrique" },
        { id: "energie-ondes-tpcm-stl", titre: "Énergie et ondes" },
      ]},
      /* spécialité « sciences physiques et chimiques en laboratoire », BO spécial n° 8 du 25 juillet 2019 */
      { id: "terminale-stl-spcl", nom: "Terminale STL · SPCL", chapitres: [
        { id: "solubilite-spcl", titre: "Solubilité et précipitation" },
        { id: "acide-base-spcl", titre: "Acides, bases et titrages" },
        { id: "conductimetrie-spcl", titre: "Conductimétrie et titrages" },
        { id: "redox-spcl", titre: "Potentiels d'électrode et relation de Nernst" },
        { id: "synthese-spcl", titre: "Synthèses : rendement, électrolyse, chimie verte" },
        { id: "analyse-spcl", titre: "Purifier et analyser : UV, IR, RMN" },
        { id: "mecanismes-spcl", titre: "Mécanismes réactionnels et stéréochimie" },
        { id: "oscillateurs-spcl", titre: "Oscillateurs, résonance et ondes" },
        { id: "mesurer-spcl", titre: "Des ondes pour mesurer" },
        { id: "observer-spcl", titre: "Des ondes pour observer" },
        { id: "transmettre-spcl", titre: "Transmettre, stocker et afficher" },
        { id: "systemes-spcl", titre: "Systèmes et procédés" },
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
