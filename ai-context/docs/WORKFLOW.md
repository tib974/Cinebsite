# Workflow de Mise à Jour du Contexte IA

Ce document formalise le processus obligatoire à suivre après chaque tâche significative accomplie par l'IA.

## Processus en 3 Étapes

1.  **Accomplir la Tâche Principale**
    - Implémenter une fonctionnalité, corriger un bug, effectuer une refactorisation, etc.

2.  **Identifier les Changements et Découvertes**
    - Quels fichiers ont été créés, modifiés, supprimés ?
    - De nouvelles dépendances ont-elles été ajoutées ?
    - La structure de la base de données a-t-elle changé ?
    - De nouveaux endpoints API ont-ils été créés ?
    - Une décision d'architecture importante a-t-elle été prise ?

3.  **Mettre à Jour la Documentation `ai-context`**
    - Mettre à jour le journal des tâches (`project/tasks.md`).
    - Mettre à jour les schémas (`project/database.md`), la stack technique (`project/tech_stack.md`), etc., si nécessaire.
    - Créer de nouveaux documents si un nouveau domaine est exploré.

**Cette procédure est obligatoire et doit être la dernière action avant de signaler la fin d'une tâche et de demander la suivante.**
