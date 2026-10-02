# Level Design

## Univers

- Rotation des astres (jour / nuit)
- Le temps s’écoule comment dans la vrai vie
- Astres éloigné de plusieurs millions de km (limitation des ressources par planete, transport, piraterie, exploration, biomes différents…), taille de ⅓ de la taille réelle
- Influence de la gravité sur les gameplays/mouvement (déplacement lent ou rapide, comportement des véhicules…)

## Astres

Contient des zones de récolte et des villes, taille de ⅓ de la taille réelle.

## Villes

Hub sociaux, zone industriel, zone commercial, zone résidentiel, donneur de mission

## Stations

Equivalent de la ville mais dans l’espace, gravité artificielle à l’intérieur (y compris dans les hangars)

## Vaisseaux

Gravité artificielle à l’intérieur (gravité de 1)

## Joueurs

Vaulting (le joueur peut franchir de petits obstacles via une action joueur)

## Design des planètes

Plusieurs biomes par planète


## Containers

Les **containers** (props de stockage) se placent dans une scène comme n'importe quel prop. Pour qu'un
container **verrouille** les objets qu'on pose dedans (le contenu se fige et ne peut plus être bousculé),
il lui faut le script `StorageContainer` sur sa racine et une **`Area3D` intérieure** couvrant le volume
de rangement. Détails de mise en place : [Network Game → Containers (Setting one up)](../../networkGame/containers.md#setting-one-up).

Côté game design (rôle, variantes, boucle transport) : [Game Design → Containers](../../gameDesign/containers.md).
