# MB-WP Pay V2 — démo cloud

Application web centralisée pour les commandes à la piste. Elle ne contient volontairement ni paiement réel ni connexion à Conqueror.

Le parcours client reprend les principes observés sur le menu West Paradise : univers, sous-catégories, fiches avec photo/description/prix, produits mis en avant et panier persistant. Le back-office permet de construire ce menu sans modifier le code : créer les univers et sous-catégories, puis gérer chaque fiche produit (SKU, description client, URL photo, vedette, prix HT/TTC, TVA, coût, marge, stock et activation).

## Démarrage local

Installer Node.js 18+, puis exécuter :

```bash
npm start
```

Ouvrir `http://localhost:3000`.

Pour tester depuis un autre téléphone/tablette du même Wi‑Fi, utilisez l'adresse IP du PC serveur : `http://IP_DU_PC:3000`. Autorisez Node.js sur le réseau privé dans le pare-feu Windows si celui-ci le demande.

## Comptes de démonstration

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | admin@mbwp.demo | Demo2026! |
| Manager | manager@mbwp.demo | Demo2026! |
| Bar / Cuisine | bar@mbwp.demo | Demo2026! |

## Déploiement Render

1. Créer un dépôt Git avec ce dossier.
2. Dans Render, choisir **New → Blueprint** et sélectionner le dépôt, ou créer un Web Service Docker à partir du `Dockerfile`.
3. Attendre la construction ; Render fournit alors l'URL HTTPS publique.

La persistance de cette démo est stockée dans `data.json`. Pour une production, remplacer ce fichier par PostgreSQL (base managée) et les sessions mémoire par un stockage partagé.

## Paiement CB Monetico CIC

Le module client actif est Monetico CIC. Renseignez dans `.env` : `CIC_TPE`, `CIC_SOCIETE`, `CIC_KEY`, `CIC_MODE=test` et `PUBLIC_BASE_URL=https://pay.westparadise.fr`. Déclarez auprès de Monetico l'URL de notification : `https://pay.westparadise.fr/api/payments/cic/notify`. Passez à `CIC_MODE=production` uniquement après l'homologation de votre TPE.

## Option Stripe

Le module crée une session Stripe Checkout : aucune donnée de carte ne transite par MB-WP Pay. Une commande reste en attente et n'est visible par le bar qu'après le webhook Stripe signé `checkout.session.completed`.

Définissez ces variables secrètes dans un fichier local `.env` (copiez `.env.example` puis renommez la copie) : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `PUBLIC_BASE_URL`. Ajoutez `STRIPE_PAYMENT_METHOD_CONFIGURATION` si vous avez un identifiant de configuration Stripe (souvent `pmc_…`) : il détermine les moyens de paiement disponibles dans Checkout. Ne communiquez jamais les secrets dans une conversation, un fichier versionné ou le navigateur.

### Test local Stripe

1. Dans Stripe, utilisez vos clés **test**.
2. Lancez le serveur avec `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `PUBLIC_BASE_URL=http://localhost:3000`.
3. Lancez le Stripe CLI : `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`, puis copiez le secret `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET`.
4. Utilisez une carte de test Stripe. Stripe Checkout gère l'authentification bancaire nécessaire.

Pour la production, déployez l'application sous HTTPS et créez un endpoint Stripe vers `https://votre-domaine.fr/api/payments/stripe/webhook`. [Documentation Stripe Checkout](https://docs.stripe.com/payments/checkout-sessions).

## Imprimante ticket réseau

Le cloud ne peut pas atteindre une imprimante du réseau local. Installez donc `print-agent.js` sur un PC Windows allumé ou un Raspberry Pi connecté au même réseau que l'imprimante. Il récupère les commandes **payées/validées** via HTTPS et les imprime sur une imprimante thermique compatible ESC/POS en TCP RAW (généralement le port 9100). Aucune ouverture de port entrant vers le réseau local n'est requise.

### Utilisation locale

1. Dans le premier terminal, définissez le jeton puis lancez MB‑WP Pay :

```powershell
$env:PRINT_AGENT_TOKEN='votre-jeton-long-et-secret'
npm start
```

2. Dans un deuxième terminal du même PC, reprenez exactement le même jeton, l'URL locale et l'adresse IP fixe de l'imprimante (`192.168.1.6`), puis lancez :

```powershell
$env:MBWP_API_URL='http://localhost:3000'
$env:PRINT_AGENT_TOKEN='votre-jeton-long-et-secret'
$env:PRINTER_HOST='192.168.1.6' # à confirmer : imprimante ESC/POS sur port 9100
$env:PRINTER_PORT='9100'
npm run print-agent
```

L'agent vérifie les nouveaux tickets toutes les trois secondes et les marque imprimés après l'envoi. Pour une installation stable, le faire exécuter comme service Windows ou service systemd. Le modèle de ticket est dans `print-agent.js` et peut être adapté à la largeur 58 ou 80 mm.

### Point Stripe en local

Stripe CLI relaie le webhook vers `localhost`, ce qui permet le test complet en local. L'application et l'impression restent donc sur votre réseau local ; seul Stripe Checkout est accessible au client pendant le paiement.

## Parcours de vérification

1. Ouvrir le mode **Client**, ajouter des produits et envoyer une commande à une piste.
2. Se connecter avec le compte Bar, ouvrir **Bar / Cuisine** et passer la commande de *Nouvelle* à *Servie*.
3. Se connecter en administrateur pour contrôler le tableau de bord, les stocks, le journal, les produits, les catégories, les pistes/QR, les utilisateurs et les paramètres.
