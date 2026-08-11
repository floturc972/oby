# MB-WP Pay V2 — démo cloud

Application web centralisée pour les commandes à la piste. Elle ne contient volontairement ni paiement réel ni connexion à Conqueror.

Le parcours client reprend les principes observés sur le menu West Paradise : univers, sous-catégories, fiches avec photo/description/prix, produits mis en avant et panier persistant. Le back-office permet de construire ce menu sans modifier le code : créer les univers et sous-catégories, puis gérer chaque fiche produit (SKU, description client, URL photo, vedette, prix HT/TTC, TVA, coût, marge, stock et activation).

## Pilotage des ventes et catalogue avancé

Le tableau de bord filtre les ventes Stripe effectivement payées par jour, semaine, mois ou intervalle personnalisé. Il affiche le chiffre d'affaires TTC, le panier moyen, le nombre d'articles et le classement des meilleures ventes par quantité et chiffre d'affaires.

Dans **Back-office → Produits**, un produit peut contenir plusieurs produits composants. La vente retire une unité du stock de chaque composant et le ticket détaille la composition. Cette première version gère une unité de chaque composant sélectionné. Un produit peut aussi définir des **produits à suggérer** : dès que le panier client contient ce produit, jusqu'à trois suggestions apparaissent dans le panier et peuvent être ajoutées en un clic.

Le prix de référence saisi dans le back-office est désormais le **prix TTC**, arrondi à deux décimales. Le prix HT est calculé automatiquement à partir du TTC et du taux de TVA. Les produits peuvent aussi recevoir des groupes d'options et de suppléments : `Groupe | Choix; Choix +2.00`. Le choix sélectionné et son éventuel supplément TTC sont conservés dans la commande, envoyés à Stripe et imprimés sur le ticket. Le Despérito est préconfiguré avec Desperados Original, Red ou Mojito.

Le back-office possède également une rubrique **Jeux d'options**. Un jeu est défini une seule fois puis rattaché à plusieurs cocktails ou produits depuis une sélection multiple. Modifier le jeu actualise tous les produits concernés. Les jeux initiaux sont « Choix Desperados » et « Choix du sirop ». La gestion des catégories permet maintenant l'ajout, la modification, l'affectation groupée de produits et la suppression avec catégorie de remplacement lorsque celle-ci contient encore des produits.

Les jeux d'options se construisent visuellement : question affichée au client, choix obligatoire ou facultatif, puis une ligne par réponse avec son éventuel supplément TTC. Aucun caractère séparateur n'est nécessaire. Les écrans Produits et Catégories disposent d'une recherche avec suggestions. Chaque produit peut être supprimé depuis la liste, tout en conservant les lignes des anciennes commandes.

Le parcours client utilise un bouton flottant **Voir mon panier**. Le catalogue occupe toute la largeur et le panier s'ouvre dans un panneau adapté au téléphone et à la tablette. Les produits suggérés sont affichés dans ce panneau avant le prénom, la note et le bouton de paiement.

Le menu contient les sous-catégories Cocktails, Cocktails sans alcool, Soft, Smoothie, Vins et Champagnes, Glaces et Tapas.

## Catalogue Madiana Bowling

Les 31 produits visibles dans la page Obypay transmise sont intégrés avec leurs prix TTC, descriptions disponibles et images. Les 26 photos distinctes et le visuel générique sont stockés localement dans `images/products` ; l'application ne dépend donc plus des URL d'images Obypay ou S3. Ils sont classés dans cinq sous-catégories : Les Henny's, Les Citronnés, Les Renversés, Les Iconiques et Lavish. L'import s'exécute automatiquement au démarrage et reconnaît les produits par SKU ou nom afin d'éviter les doublons. Les nouveaux produits démarrent avec un stock de démonstration de 100. La TVA est initialisée à 8,5 % et reste modifiable par produit dans le back-office.

Lors de la création ou de la modification d'un produit, le back-office permet de sélectionner un fichier JPG, PNG ou WebP de 5 Mo maximum. Le serveur le copie dans `images/products/uploads` et inscrit automatiquement son URL interne dans la fiche produit. Les fichiers ne dépendent donc d'aucun hébergeur d'images externe.

## Démarrage local

Installer Node.js 18+, puis exécuter :

```bash
npm start
```

Ouvrir `http://localhost:3000`.

Pour tester depuis un autre téléphone/tablette du même Wi‑Fi, utilisez l'adresse IP du PC serveur : `http://IP_DU_PC:3000`. Autorisez Node.js sur le réseau privé dans le pare-feu Windows si celui-ci le demande.

Les liens contenant une piste, par exemple `/?lane=1&token=...`, activent le mode tablette : la piste est verrouillée et la connexion équipe, le Bar/Cuisine et le back-office ne sont pas affichés. Le back-office reste accessible uniquement depuis l'URL générale sans paramètre `lane`.

Dans **Back-office → Pistes / QR**, vous pouvez créer autant d'emplacements que nécessaire (pistes, tables ou tablettes), copier leur lien client, les renommer, régénérer leur jeton, les désactiver ou les supprimer définitivement. Les nouveaux liens utilisent le format `/?location=ID&token=JETON` et verrouillent également le sélecteur d'emplacement en mode client.

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

## Paiement CB Stripe (module actif)

Le parcours client utilise Stripe Checkout. Aucune donnée de carte ne transite par MB-WP Pay. Une commande reste en attente et n'apparaît au bar qu'après réception du webhook Stripe signé `checkout.session.completed`.

## Configuration Stripe

Le module crée une session Stripe Checkout : aucune donnée de carte ne transite par MB-WP Pay. Une commande reste en attente et n'est visible par le bar qu'après le webhook Stripe signé `checkout.session.completed`.

Définissez ces variables secrètes dans un fichier local `.env` (copiez `.env.example` puis renommez la copie) : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `PUBLIC_BASE_URL`. Ajoutez `STRIPE_PAYMENT_METHOD_CONFIGURATION` si vous avez un identifiant de configuration Stripe (souvent `pmc_…`) : il détermine les moyens de paiement disponibles dans Checkout. Ne communiquez jamais les secrets dans une conversation, un fichier versionné ou le navigateur.

### Test local Stripe

1. Dans Stripe, utilisez vos clés **test**.
2. Lancez le serveur avec `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `PUBLIC_BASE_URL=http://localhost:3000`.
3. Lancez le Stripe CLI : `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`, puis copiez le secret `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET`.
4. Utilisez une carte de test Stripe. Stripe Checkout gère l'authentification bancaire nécessaire.

Après un paiement réussi, Stripe renvoie maintenant son identifiant de session à MB-WP Pay. Le serveur vérifie directement auprès de Stripe que la session est réellement payée, valide la commande, déclenche l'impression puis ramène automatiquement le client au menu après trois secondes. Cette vérification sécurisée permet également le parcours local lorsque le webhook ne peut pas joindre `localhost`; le webhook reste indispensable pour couvrir les paiements confirmés sans retour du navigateur.

Le panier est conservé dans le navigateur pendant la redirection Stripe. Une annulation de paiement ramène au menu avec le panier intact ; seul un paiement confirmé l'efface. Après 60 secondes sans activité, le client voit un avertissement avec un délai supplémentaire de 15 secondes pour conserver son panier avant l'effacement automatique.

Dans la gestion des catégories, chaque ligne possède directement les boutons **Modifier** et **Supprimer**. La suppression demande une catégorie de remplacement lorsque des produits doivent être déplacés et reste bloquée tant que la catégorie contient des sous-catégories.

Pour la production, déployez l'application sous HTTPS et créez un endpoint Stripe vers `https://votre-domaine.fr/api/payments/stripe/webhook`. [Documentation Stripe Checkout](https://docs.stripe.com/payments/checkout-sessions).

## Imprimante ticket réseau

Le cloud ne peut pas atteindre une imprimante du réseau local. Installez donc `print-agent.js` sur un PC Windows allumé ou un Raspberry Pi connecté au même réseau que l'imprimante. Il récupère uniquement les commandes dont le paiement Stripe est confirmé, puis les imprime sur une imprimante thermique compatible ESC/POS en TCP RAW (généralement le port 9100). Aucune ouverture de port entrant vers le réseau local n'est requise.

Lorsque MB-WP Pay fonctionne directement sur le réseau local, l'administrateur peut aussi configurer l'imprimante dans **Back-office → Paramètres** : adresse IP, port TCP, activation de l'impression automatique et bouton de ticket test. Par défaut, l'adresse proposée est `192.168.1.6` et le port `9100`. Après activation, les commandes sont imprimées uniquement après confirmation du paiement Stripe ou CIC. Cette impression directe remplace l'agent séparé pour une installation entièrement locale.

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
