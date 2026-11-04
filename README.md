# Likelemba — Application Web (React + Sepolia)

Interface responsive de tontine décentralisée développée avec React, Vite et ethers.js.

## Démarrage sur Windows / VS Code

Prérequis : Node.js et npm installés.

1. Extraire l'archive ZIP.
2. Ouvrir le dossier `likelemba-app` dans VS Code.
3. Ouvrir le terminal PowerShell et lancer :

```powershell
npm.cmd install
npm.cmd run dev
```

4. Ouvrir l'adresse locale affichée (souvent `http://localhost:5173`).
5. Installer l'extension MetaMask, sélectionner **Ethereum Sepolia** et cliquer sur **Connecter MetaMask**.

Pour arrêter : `Ctrl + C` dans le terminal.

## Contrats préconfigurés

| Contrat | Adresse Sepolia |
|---|---|
| MockUSD | `0xB668C95fDa0fDa874dBE82f814F5E4a534fB50` |
| Likelemba | `0x4610Fa7518636236b3d7A420EaA98D5b3cC45F20` |
| CaisseLikelemba | `0x374652A2D439948D41bcA89948722184DECe94B2` |

Ces adresses proviennent des déploiements communiqués lors du projet. Vérifiez-les sur https://sepolia.etherscan.io/ avant tout usage. Pour les modifier, copiez `.env.example` en `.env`, puis ajustez les valeurs `VITE_...`.

## Fonctionnalités

- Tableau de bord moderne, responsive PC/tablette/mobile.
- Connexion à MetaMask et contrôle du réseau Sepolia.
- Lecture réelle de la présence des trois contrats sur Sepolia.
- Lecture du solde de MockUSD et des données publiques quand les signatures sont compatibles.
- Pages Membres, Cotisations, Tours, Historique, Contrats et Réseau.
- Liens directs vers Etherscan pour consulter les transactions publiques.
- Aucun faux solde, aucune fausse transaction, aucun versement simulé présenté comme réel.

## Important : fonctionnalités blockchain à finaliser

**Les opérations d'écriture (ajouter un membre, cotiser, payer un bénéficiaire) sont volontairement désactivées.** Elles exigent les ABI exactes et la logique réelle des trois contrats Solidity, qui n'ont pas été fournis dans cette demande. Les signatures de lecture dans `src/chain.js` sont des hypothèses raisonnables et peuvent nécessiter une adaptation ; les valeurs inconnues s'affichent « — ».

Pour activer les paiements de façon fiable : fournir les fichiers `Likelemba.sol`, `CaisseLikelemba.sol`, `MockUSD.sol` ou les ABI JSON issues de Remix. Vérifier également les décimales du jeton, les permissions, les paramètres des fonctions, les montants et les événements. Tester avant tout usage public.

## Déploiement Vercel

1. Pousser le projet dans un dépôt GitHub (ne jamais commiter `.env` ou des clés privées).
2. Dans Vercel : **Add New Project** → importer le dépôt.
3. Framework : **Vite** ; build command : `npm run build` ; output directory : `dist`.
4. Définir si nécessaire les variables d'environnement `VITE_...` dans Vercel.
5. Déployer et vérifier MetaMask sur Sepolia.

**Aucune clé privée ni phrase de récupération ne doit être placée dans le code ou dans Vercel.**

## Limites

Cette archive est un frontend fonctionnel pour la navigation, la connexion MetaMask et les lectures compatibles. Elle n'est **pas** encore une DApp complète de cotisation/rotation en production. Sepolia est un réseau de test sans valeur monétaire réelle.
