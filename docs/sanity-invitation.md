# Outil d’invitation Sanity (sans terminal)

Cet outil facilite l’ajout d’un collaborateur et le déploiement du Studio Sanity sans utiliser de ligne de commande.

## 1. Préparer l’environnement
1. Dupliquer `.env.admin.example` en `.env.admin` (racine du projet).
2. Fournir les valeurs :
   - `SANITY_PROJECT_ID` / `SANITY_DATASET` : laissés par défaut (`jyku6tox` / `production`).
   - `SANITY_ADMIN_TOKEN` : jeton API Sanity avec le scope **Manage project members**. Le créer depuis https://www.sanity.io/manage (onglet **API** → **Add API token** → sélectionner `project.memberships.manage`).
   - `SANITY_INVITE_ROLE` (optionnel) : rôle assigné par défaut (`editor` recommandé).
3. Installer/mettre à jour les dépendances :
   ```bash
   npm install
   ```

> ⚠️ Ne jamais envoyer `.env.admin` dans un dépôt ou un service tiers.

## 2. Lancer l’outil graphique
- **macOS** : double-cliquer sur `start-admin.command`.
- **Windows** : double-cliquer sur `start-admin.bat`.

Une fenêtre Terminal s’ouvre (logs uniquement) et le navigateur affiche l’interface sur http://localhost:4545/ (modifiable via `ADMIN_TOOL_PORT`).

## 3. Inviter un collaborateur
1. Vérifier la bannière – elle confirme le projet et signale si le jeton est détecté.
2. Renseigner l’adresse email, choisir le rôle (`editor`, `developer`, `administrator`).
3. Cliquer sur **Envoyer l’invitation**.
4. L’invité reçoit un email Sanity pour accepter l’accès.

L’outil appelle l’API `https://api.sanity.io/v2021-06-07/projects/{projectId}/collaborators/invite` en arrière-plan.

## 4. Déployer le Studio Sanity en un clic
- Bouton « Déployer le studio » : lance `npm run deploy` dans `studio/`.
- Suivre les logs dans la fenêtre Terminal ouverte.
- Lors du premier déploiement, choisir un sous-domaine (ex. `cineb-studio.sanity.build`). Cette URL devient l’accès en ligne au Studio.

## 5. Accès au Studio
- **Local** : `cd studio && npm run dev` → http://localhost:3333.
- **En ligne** : URL choisie lors du déploiement (ex. https://cineb-studio.sanity.build) → connexion avec un compte Sanity invité.

## 6. Gestion des accès (alternative CLI)
En cas de besoin avancé :
```bash
sanity users invite <email> --role editor --project jyku6tox
sanity users remove <email> --project jyku6tox
```

## 7. Bonnes pratiques
- Conserver le jeton API dans un gestionnaire sécurisé (1Password, Bitwarden…).
- Limiter les rôles : `editor` pour le propriétaire, `administrator` uniquement pour l’équipe technique.
- Relancer un déploiement après chaque modification de schémas (`npm run admin:ui` → bouton « Déployer »).
- Révoquer l’accès d’un collaborateur inactif (`sanity users remove …`).
