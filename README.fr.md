# n8n-nodes-oryksa

[![English](https://img.shields.io/badge/English-30363d?style=for-the-badge)](README.md) [![Português](https://img.shields.io/badge/Portugu%C3%AAs-30363d?style=for-the-badge)](README.pt.md) [![Español](https://img.shields.io/badge/Espa%C3%B1ol-30363d?style=for-the-badge)](README.es.md) [![Français](https://img.shields.io/badge/Fran%C3%A7ais-0891b2?style=for-the-badge)](README.fr.md)

Ceci est un node communautaire n8n. Il vous permet d'utiliser [ORYKSA](https://oryksa.com) dans vos workflows n8n.

ORYKSA est un assistant IA pour votre entreprise. Avec ce node, un workflow peut utiliser ORYKSA comme modèle d'IA, interroger votre propre assistant ORYKSA (qui connaît votre entreprise), le laisser agir pour vous avec votre approbation, créer des images, transformer l'audio en texte et le texte en voix, et démarrer quand quelque chose se passe dans ORYKSA.

Tout est payé avec les interactions de votre forfait ORYKSA. Il n'y a pas de crédit séparé ni d'autre clé de fournisseur d'IA à gérer.

[Installation](#installation) · [Identifiants](#identifiants) · [Opérations](#opérations) · [Exemples](#exemples) · [Relevé d'utilisation](#relevé-dutilisation) · [Compatibilité](#compatibilité) · [Ressources](#ressources) · [Auteur](#auteur)

## Installation

Suivez le [guide d'installation](https://docs.n8n.io/integrations/community-nodes/installation/) de la documentation des community nodes n8n et installez `n8n-nodes-oryksa`.

### Installation manuelle depuis un fichier de paquet

Tant que le paquet n'est pas sur npm, vous pouvez installer le fichier `.tgz` à la main. Dans le dossier où n8n conserve les community nodes (`~/.n8n/nodes`, créez-le s'il n'existe pas), exécutez :

```bash
npm install --omit=dev --legacy-peer-deps --ignore-scripts --package-lock=false ./n8n-nodes-oryksa-0.1.2.tgz
```

Redémarrez ensuite n8n. Les options comptent : sans elles, npm essaie d'installer et de compiler les paquets propres à n8n, que n8n possède déjà.

n8n ne charge les community nodes non vérifiés que si `N8N_UNVERIFIED_PACKAGES_ENABLED` vaut `true`. C'est la valeur par défaut aujourd'hui ; n8n a annoncé qu'elle passera à `false`, définissez-la donc vous-même si les nodes n'apparaissent pas.

## Identifiants

1. Connectez-vous à [developer.oryksa.com](https://developer.oryksa.com) et ouvrez **API keys**.
2. Créez une clé. Elle commence par `oryk_live_`.
3. Dans n8n, créez un identifiant **ORYKSA API** et collez la clé.

n8n teste la clé quand vous l'enregistrez.

## Opérations

### Node ORYKSA

| Resource | Operation | Ce qu'il fait | Coût |
| --- | --- | --- | --- |
| Model | Message a Model | Envoie un prompt à ORYKSA comme modèle d'IA général, à la place d'un autre fournisseur d'IA. Prend en charge un prompt système, une sortie JSON, la température et une limite de tokens. | 1 interaction par réponse |
| Assistant | Ask | Interroge votre propre assistant ORYKSA. Il répond avec les connaissances et les données de votre entreprise. Il n'agit jamais. | 1 interaction par réponse |
| Assistant | Do | Demande à votre assistant de faire quelque chose. Ce qui reste dans votre compte (un contact, une tâche, une note) est fait tout de suite. Tout ce qui est envoyé à une autre personne, et toute modification des paramètres, attend une approbation. | 1 interaction par réponse, plus le coût de l'action |
| Assistant | Approve | Exécute ce qu'un **Do** précédent a laissé en attente. L'ID d'approbation se trouve dans la sortie de **Do**. | Le coût de l'action approuvée |
| Image | Create | Crée une image à partir d'une description, à la taille exacte que vous choisissez, et renvoie son adresse et le fichier. | 10 interactions |
| Audio | Transcribe | Transforme un enregistrement en texte, avec le début et la fin de chaque mot. | 1 interaction par minute commencée |
| Audio | Generate Speech | Lit un texte à voix haute avec la voix de votre compte ORYKSA et renvoie un mp3. | 1 interaction par tranche de 500 caractères commencée |
| Customer Agent | Send Message | Envoie un message à l'agent ORYKSA qui répond à vos clients et renvoie sa réponse. | 1 interaction par réponse |
| Knowledge | Get Status, Add FAQ, Learn Website | Lit et enrichit ce que votre agent sait. | Voir la référence de l'API |
| Conversation | Get, Get Many | Lit les conversations de vos clients avec votre agent. | Voir la référence de l'API |

**Do** n'approuve jamais de lui-même. Un workflow doit appeler **Approve** avec l'ID d'approbation, généralement après qu'une personne a dit oui (par exemple avec un node Wait et un formulaire). Une approbation est valable 60 minutes.

### Node ORYKSA Trigger

Démarre le workflow quand quelque chose se passe dans votre compte ORYKSA : un message a reçu une réponse, une réservation a été créée, les connaissances ont été mises à jour, la limite d'interactions a été atteinte.

Le node enregistre un webhook dans ORYKSA quand le workflow est activé et le supprime quand le workflow est désactivé. Chaque événement est signé, et le node vérifie la signature avant de démarrer le workflow.

## Exemples

### 1. Utiliser ORYKSA comme modèle d'un workflow

1. Ajoutez un node **ORYKSA**. Resource **Model**, operation **Message a Model**.
2. Écrivez les instructions dans **System Prompt** et le texte dans **Message**, par exemple `{{ $json.text }}`.
3. La réponse arrive dans `choices[0].message.content`.

### 2. Répondre à un e-mail client avec votre approbation

1. Un trigger vous donne l'e-mail (par exemple **Gmail Trigger**).
2. Node **ORYKSA**, resource **Assistant**, operation **Do**. Message : `Reply to this email.` Input : le texte de l'e-mail.
3. La sortie contient `status: needs_approval`, le texte qui sera envoyé et `approval.id`.
4. Un node **Wait** avec un formulaire vous montre le texte et demande oui ou non.
5. Si oui : node **ORYKSA**, resource **Assistant**, operation **Approve**, avec `{{ $json.approval.id }}`. L'e-mail est envoyé.

### 3. Sous-titres pour une vidéo

1. Récupérez l'audio de la vidéo sous forme de fichier binaire.
2. Node **ORYKSA**, resource **Audio**, operation **Transcribe**. Laissez **Word Times** activé.
3. La sortie contient `text` et `words`, chaque mot avec `start` et `end` en secondes. Construisez les sous-titres à partir de ceux-ci.

## Relevé d'utilisation

Le node indique à ORYKSA de quel workflow vient chaque requête (le nom et l'ID du workflow, et l'ID de l'exécution). Votre relevé d'utilisation ORYKSA affiche alors les interactions sous **n8n**, avec le nom du workflow, et les additionne par workflow. Ce n'est qu'une étiquette : elle ne donne aucune permission et ne change aucun prix.

## Compatibilité

Construit et vérifié avec les outils de nodes n8n (`@n8n/node-cli`). Nécessite une version de n8n qui prend en charge les community nodes avec `n8nNodesApiVersion` 1. Aucune dépendance externe.

## Ressources

- [Documentation des community nodes n8n](https://docs.n8n.io/integrations/#community-nodes)
- [Référence de l'API ORYKSA](https://developer.oryksa.com)
- [ORYKSA](https://oryksa.com)

## Auteur

Weslley Harakawa ([@weslleyharakawa](https://github.com/weslleyharakawa))

## Licence

[MIT](LICENSE.md)
