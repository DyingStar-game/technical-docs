# Extraction

## Boucle de gameplay

### Vue d'ensemble

Minage FPS

L’objectif sur le minage FPS est la fracture d’un rocher à l’aide d’un outil en tapant sur des lignes de fracture pour casser un morceau de rocher dans le but de récupérer des fragments du minerai.

Le rocher sera composé de plusieurs mesh pour gérer les veines de minerai et les lignes de fracture

Le joueur va utiliser un outil pour créer un trou dans la roche, si cela touche une mesh faille cela supprime le mesh, cela peut se propager si une autre faille touche la faille qui a été touché par l’outil.
Le joueur continue d’utiliser l’outil pour créer des morceaux avec le mesh minerai.

A partir d’un certain volume, un petit morceau de roche ne peut plus être fracturé.

### Actions principales

Processus simplifié de la boucle du gameplay minage:
- Récolte
- Broyeur/Raffinerie
- Fonderie

### Economie du jeu

Les joueurs gagneront de l'argent en vendant les morceaux de rochers ou en accomplissant des missions.


## Systèmes de retour d'information


### Retour d'information visuel

Retour visuel sur le rocher (poussière, débris, ...).


### Retour d'information audio

Retour audio sur le rocher.

Retour audio de l'outil de minage.


# Extraction - MVP

## Rocher de minage

La première version du rocher aura des failles qui seront des tranches sur le rocher. 
Quand un joueur touche une faille cela va faire disparaître la faille et donc couper le rocher en 2, il n’y a pas de propagation entre les failles.
Les failles auront une couleur particulière pour être bien visibles au joueur pour les tests.
Selon quelle faille on tape dessus en premier on obtient des découpes différentes tout en ayant un seul modèle de rocher.

Il y aura un seul pattern de faille qui sera appliqué de façon aléatoire sur les rochers pour donner des découpes différentes.


## Outil

### Perforateur

Il n'y aura qu'un seul outil de minage.

Le perforateur n'aura pas besoin d'êtres très détaillé sur son modèle 3D.

Ce modèle 3D sera inspiré du "MARTEAU PERFORATEUR Parkside PAH 1300 B1"


### Utilisation de l’outil perforateur

Le joueur appuie sur une touche (ex: 1/&) pour faire apparaître/ranger le perforateur dans les mains du joueur (outil qui flotte devant le joueur et suit le joueur car l’animation du personnage n’est pas encore développé).

Pour fracturer un rocher, le joueur doit rester appuyé sur clique droit pour passer en mode visée (apparition d’une croix de visée sur l’écran du joueur), le mode visée ralentie le déplacement et la sensibilité de la souris du joueur.

Le joueur reste ensuite appuyé sur clique gauche pour faire l’animation de fracture.

A la fin de l’animation, la faille visée disparaît pour couper le rocher.

Si le joueur fait l’animation sur une partie du rocher qui n’est pas une faille, l’animation commence et s’arrête brusquement pour faire revenir rapidement le perforateur à sa position initiale et il ne se passe rien sur le rocher.

L’animation fait avancer le perforateur dans le rocher puis reculer le perforateur dans sa position initiale, l’animation devrait durer environ 5 secondes.

### Animations

le burin sur le perforateur devra faire un mouvement d'avant arrière au moment ou le joueur fait l'animation de fracture (clique gauche).


### Audio

à définir


## Dépôt de minerais

C'est une machine qui permet de récupérer les morceaux de rocher apportés par les joueurs.
Le morceau de rocher disparaît quand il arrive à l'intérieur de la machine.
Le joueur est récompensé à chaque morceau.

La machine est composée d'un écran, d'un tapis roulant et d'une zone de stockage interne pour faire disparaître le rocher hors de la vue du joueur.
L'écran permet d'activer le tapis roulant.
Petit gyrophare sur la machine.


### Animations

Le morceau de rocher se déplace en même temps que le tapis roulant.

Lumière type gyrophare qui s'active pendant l'animation du morceau de rocher qui rentre dans le dépôt.

### Audio

à définir
