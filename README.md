# QMS Portal - Plateforme de suivi des événements Qualité

Une application Single Page (SPA) développée en HTML/CSS/JavaScript Vanilla connectée à Supabase.

## Prérequis
1. Créer un compte sur [Supabase](https://supabase.com).
2. Créer un nouveau projet.
3. Exécuter le script SQL fourni pour configurer la base de données.
4. Récupérer l'URL du projet et la clé publique "anon" dans `Project Settings > API`.
5. Coller ces valeurs au début du fichier `app.js`.
6. Dans Supabase, aller dans `Authentication > Providers` et s'assurer que l'authentification par email est activée. Créer un utilisateur depuis l'interface Supabase pour tester.

## Déploiement : De Local à GitHub vers Netlify

Suivez ces étapes pour publier l'application en ligne :

### Étape 1 : Initialiser le projet en local avec Git
Assurez-vous d'avoir Git installé sur votre PC. Ouvrez un terminal dans le dossier `quality-events-app`.
```bash
git init
git add .
git commit -m "Initialisation du projet Qualité"