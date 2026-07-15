# Missions de transport

Les missions de transport déclinent la boucle du gameplay (voir [Transport — vue d'ensemble](../0_Transport.md)) selon la quantité de fret, sa nature, la distance et la dangerosité.

## Colis

Mission de plus bas niveau : livrer un **colis** (transportable à la main) d'un point à un point de dépôt, en passant par un véhicule.

**Durée estimée** : ~15 min.

### Boucle d'actions

1. Prendre le colis.
2. Se déplacer avec le colis (vers le véhicule).
3. Charger le colis dans le véhicule.
4. Se déplacer avec le véhicule.
5. Récupérer le colis du véhicule.
6. Se déplacer avec le colis (vers le dépôt).
7. Déposer le colis.

:::note Implémentation actuelle (code)
La brique **porter → charger dans la benne → conduire → récupérer → déposer** existe déjà : prise/pose d'un carriable à la touche **E** (le serveur vérifie qu'on voit bien l'objet), chargement dans la benne du camion (poids ajouté, objet gelé qui suit le véhicule), retrait par une nouvelle prise. Voir [Véhicules de transport](../Vehicules/0_Vehicules.md).
:::

## Palettes

Mission de transport de **palettes** (déplacées au transpalette ou en petit véhicule). Le détail de cette mission reste à définir dans le wiki de game design ; elle suit la même boucle que le colis, à une échelle supérieure (chariot/véhicule requis, empilage sur grille).
