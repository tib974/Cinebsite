# Déploiement sur InfinityFree

Ce projet est conçu pour être déployé sur [InfinityFree](https://www.infinityfree.net/). Le fournisseur demande que tous les fichiers destinés au web soient placés dans le dossier `htdocs/` de l'hébergement.

## Exclusions de déploiement
Le workflow GitHub (`.github/workflows/deploy.yml`) exclut automatiquement certains dossiers et fichiers lors de l'envoi FTP :

- `data/`
- `assets/uploads/`
- autres fichiers sensibles (`config.php`, `.env`, etc.)

Ces exclusions évitent de publier des données locales ou des fichiers de configuration.

## Limite de `mail()`
Sur les comptes gratuits InfinityFree, l'utilisation de la fonction PHP `mail()` est limitée (environ 50 e-mails par heure). Pour un envoi massif, utilisez un service SMTP externe.

## Checklist après déploiement
- [ ] Changer le mot de passe admin
