# Donnée du personnage

## Caméra

:::tip
Vue première personne - First personne
FOV modulable entre 50 - 150 (par défaut 100)
:::

Grâce à une caméra à la 1ère personne, l’objectif est d'immerger le joueur dans l’univers présenté en lui faisant découvrir le monde à travers les yeux de son avatar.

L’association de sa perception rend les enjeux plus personnels et contribue à instaurer un lien immédiat, quasi-intuitif. En supprimant la distance induite par une caméra externe, ce point de vue renforce l’identification au personnage et sa présence physique dans l’environnement.

La caméra à la 1ère personne permet aussi de transmettre plus facilement les sensations immédiates : la hauteur d’un rebord, l’étroitesse d’un couloir ou d’une pièce, l’immensité d’un paysage, etc. 


## Contrôle

### Commande clavier/souris

- *Souris* : Vue personnage (caméra).
- *Clique gauche souris* : Intéraction principale.
- *Clique droit souris* : Intéraction secondaire.
- *Molette souris haut* : Augmentation de la vitesse de mache.
- *Molette souris bas* : Diminution de la vitesse de marche.
- *ZQSD* : Mouvement personnage Haut, Gauche, Bas, Droite.
- *Espace* : Sauter / Enjamber / Escalader
- *Majuscule* : Sprinter
- *C* : Accroupi
- *C maintenue* / W : Allonger


Les contrôles du personnage sont réduits sans limiter le joueur, permettant une prise en main facile. Eviter la multiplication des commandes rend le jeu plus rapide à prendre en main.

:::warning[Raccourcis]
Certaines actions diégétiques pourront ne pas être assignées mais le joueur peut y assigner un raccourci (clavier/souris/manette/hotas) 
:::

## Caractéristique

Les joueurs incarnent un personnage humanoïde de taille moyenne (⋍ 1m70) obligé de fuir sa planète d’origine.

Réfugiés malgré eux, ils doivent se faire une place sur leur nouvelle planète d'accueil : **Sandbox**, une planète spécialisée dans l’exploitation minière et la prospection dirigée par la mégacorporation tentaculaire Arès Corporation. 


### Variables du personnage

Le personnage a des variables de **faim**, de **soif**, d'**emport**, d'**Endurance** , de **fatigue** et de **vitalitée**.

Chacune de ces variables sera sous forme de pourcentage non visible par le joueur. Celui-ci sera informé avec des sons, des animations ou par l'altération de la caméra.

Les variables ne doivent pas gâcher l'expérience mais doivent de la rendre plausible dans l'univers comme un humain standard de cet univers.


#### Faim & Soif

:::tip[Intéret]
Le but est de renforcer l'immersion, le personnage est un humain il a des besoins qui doivent être comblés.
:::

Un joueur qui prend soin de son personnage aura des bonus et une mauvaise gestion entraîne des malus, voire le coma ce qui ramène le joueur au fait que le personnage est un humain. 

Le temps entre les besoins doit être raisonnable (temp en jeu: boire:4h manger:8h).

Il a besoin de boire et manger à intervalle régulier.

Si le joueur ne subvient pas aux besoins du personnage il tombe dans le coma et s'il consomme trop, il aura des malus et tombera malade. Cet équilibre sera visible dans le pad de façon diégétique et non sous forme de barre de faim/soif. Des signes audio et visuels sont envoyés aux joueurs par le personnage. 
Gain par repas ⋍15%

*Exemple des effets*

| Pourcentage | état |
| ---- | ---- |
| 0%   | Coma |
| 10%  | Gros gargouillement de ventre régulier |
| 40%  | Petit gargouillement de ventre régulier |
| 60%  | Petit gargouillement de ventre  |
| 80%  | Perte des bonus  |
| 100% | Le personnage est complètement rassasié bonus d'endurance  |
| 110% | Limite avant les malus et pas de bonus  |
| 130% | Perte d'emport, de soif, d'énergie et fatigue |


- *Retour d'information* : Gargouillement / respiration sèche
- *Bonus* : Regain d'énergies / Agmentation barre d'endurance
- *Malus* : Comma / Diminution barre d'endurance / malade

### Endurance

:::tip[Intérêt]
Le personnage est humain, il possède les limites physiques qui l'empèchent de sprinter avec de lourdes charges indéfiniment, la barre d'énergie doit limiter le personnage et le rendre plus humain. 
:::


Le personnage se fatigue quand il réalise des actions c'est représenté par l'endurance.

C'est une barre non visible qui se vide quand le joueur sprinte, grimpe, enjambe ou porte des charges trop lourdes. Pour quelle remonte, le joueur doit attendre que le personnage reprenne son souffle.

Le joueur a un retour sonore avec la respiration. Si le joueur pousse son personnage trop loin, celui-ci s'arrêtera et perdra de l'**énergie**.


- *Retour d'information* : Essouflement
- *Bonus* : /
- *Malus* : Perte de l'énergie


### Fatigue

:::tip[Intérêt]
L'énergie simule les limites physiques d'un humain sur du long terme. Il est important de simuler la fatigue et l'épuisement du personnage pour que le joueurs en prennent soin.
:::

L'idée est que le joueur évite les déconnexions sauvages et ne cout sans cesse dans tous les sens.

Le jeu a des temps de pause pour observer marcher et découvrir l'univers. L'endurance permet de poser le jeu pour pemettre au joueur de profiter pleinement de l'exprerience proposée.


Le personnage possède une barre d'énergie non visible qui représente la fatigue générale du personnage. Celle-si est impactée négativement par le port de charge, les actions qui consomment de l'endurance et le lieu de repos du personnage (déconnection). Pour augmenter cette barre, le joueur doit se déconnecter dans des lieux appropriés et diminuer les actions consommatrices d'endurance.


- *Retour d'information* : alerte sur le pad / gameplay médical
- *Bonus* : Agmentation barre d'endurance / Agmentation barre d'emport
- *Malus* : Diminution barre d'endurance / Diminution barre d'emport


### Emport

:::tip[Intérêt]
Le but est de limier le joueur dans le poids et le volume transporté. Le joueur doit faire des choix dans ce qu'il récolte, emporte et transporte.
:::


La barre d'emport est relative au transport. Tout ce que porte le personnage rentre dans cette barre. Elle n'est pas visible mais est simulée par un ralentissement et une diminution de l'endurance. Elle possède plusieurs paliers d'encombrement:

- *Faible* : Pas de malus
- *Moyen* : Certaines actions consomment de l'endurance
- *Lourd* : Baisse de l'endurance lente
- *Surcharger* : Baisse rapide de l'endurance et impact conséquant sur l'énergie


### Vitalitée

:::tip[Intérêt]
La barre de vie doit permettre au joueurs d'encaisser des dommages sans etre dans le coma à chaque blessures.
:::

Quand la vie est trop basse, des malus d'enport d'endurance et de fatiqghue apparaisse.-20%


### impact des variables

| Variable | Plage de valeurs |
| -------- | ---------------- |
| Faim | 0-100 |
| Soif | 0-100 |
| Emport | 0-100 |
| Endurance | 0-100 |
| Fatigue | 0-100 |
| Vitalitée | 0- 100 |

Faim > soif / emport / endurance / fatigue

Soif - / +110 > faim / endurance / fatigue

Emport > Endurance

Endurance > faim / soif / fatigue

Fatigue > emport / endurance

Vitalité > emport / endurance / fatigue


### bonus malus

Toutes les variables vont de 0 à 100 avec un bonus maximal de 10 % et malus maximal de 20 %. 

*Faim/Soif* : ces valeurs augmentent ou diminue le maximum de la variable (Emport, fatigue,faim/soif) qu'il affecte ou sa consommation (endurance)

  0 / -20%
 10 / -10%
 30 / -5%
 50 / 0%
 65 / +10%
 80 / 0%
100 / -10%

Emport : affecte l’endurance et la fatigue sur sa consommation 
  0 / 0%
 15 / 0%
 30 / +50%
 65 / +100%
 80 / déplacement impossible

Endurance : augmente la consommation faim, soif, fatigue
l'endurance consomme au moment de se recharger elle prend la valeur rechargée plus sons modificateur
  0 / -40%
 10 / -30%
 30 / -20%
 50 / 10%
 65 / 0%
 80 / 0%
100 / 0%

Fatigue : diminue le maximum des variables 
  0 / -20%
 10 / -20%
 30 / -15%
 50 / -10%
 65 / -5%
 80 / 0%
100 / +10%

vie : diminue le maximum des variables
  0 / -20%
 10 / -20%
 30 / -15%
 50 / -10%
 65 / -5%
 80 / 0%
100 / 0%

### Consommation de base

Faim : -1.875 par heure
Soif : -3.75 par heure
Fatigue : 4 par heure

### Consommation due à l'endurance
Pour 1 d'endurance avant malus.

Faim : -0.000,2 
Soif : -0.000,3 
Fatigue : -0.000,1 

## Lexique dev



