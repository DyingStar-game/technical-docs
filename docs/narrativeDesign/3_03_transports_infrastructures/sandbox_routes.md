# Les routes sur Sandbox

## Présentation

Ce document est une synthèse sur les routes sur la planète Tarsis IV (Sandbox).
Même s'il a pour objectif d'aider à la réalisation du MVP, il pourra contenir des informations connexes.



## Liens de référence

https://discord.com/channels/1399325839665004554/1526334405570728046



## Fonctions du réseau routier de Sandbox

L'intérêt d'Arès à développer un réseau routier sur Sandbox est de disposer d'une infrastructure permettant :

* D'extraire, transporter, transformer puis exporter de Dédurium depuis les gisements les plus riches et rentables jusqu'à l'espace ;
* D'extraire, transporter puis transformer les ressources locales permettant de réduire les coûts de l'exploitation du Dédurium ;
* De distribuer les produits de première nécessité importé aux différents lieux d'extraction et de transformation 
* De distribuer les produits manufacturés localement aux différents lieux d'extraction et de transformation 
* De faciliter le contrôle administratif et social sur les différentes localités.



De fait, le réseau routier mise en place par Arès sur Sandbox est très centralisé. Les points d'intérêt sont avant tout rattachés à un village-minier, chaque village-minier est rattaché à un village-usine, chaque village-usine est rattaché à une ville-ferroviaire (dans les bassins) ou à une ville-aérospatioportuaire (sur les haut-plateaux).



Par déduction, les groupes marginaux ne sont pas reliés au réseau routier d'Arès, bien que ponctuellement ils puissent disposer de leurs propres réseaux. Ce thème n'a pas encore été défriché, mais compte-tenu du matériel nécessaire pour réaliser des routes simples et rapides, il est peu probable que l'on dote ces groupes d'autres choses que des pistes.



## Hypothèses et dimensionnement du réseau routier de Sandbox

Pour chaque ville (ferroviaire ou aérospatioportuaire), il y a une dizaine de villages-usines. Et pour chaque village usine, il y a une dizaine de villages-miniers.



En l'absence de travail sur les machines qui seront disponibles pour le minage, et dans le cadre du MVP, il est pris pour hypothèse principale que le réseau routier s'inscrit entre des villages fraîchement construits où on y exploite les gisements avant tout à la main en attendant une machinerie plus lourde. Nota : en général, l'exploitation des premiers gisements et filons sont largement rentables à la main.



La boucle gameplay de minage à pied avait été estimée à 30 minutes. En posant comme hypothèses complémentaires 4 sites de minage par village, et 40 véhicules pour 60 mineurs en activité en même temps (ie. 180 mineurs pour une population de \~250 habitants), on aurait un trafic de 20 allers/retours par heure et par piste (soit un passage toutes les 3 minutes). Ça me semble être beaucoup pour une piste (perso, je l'aurai dimensionnée à 10 A/R par heure), donc il y aurait sûrement des ornières et des nids de poules.



Toutes les 30 minutes, un mineur produit donc environ 750 kg de roche à traiter. Disons qu'un concasseur de village-minier permet de réduire cette masse à 500kg. Ça fait 1t par heure par mineur, donc 60 t par heure par village-minier de minerai brut en caisses à exporter vers un village-usine. À la journée (25h), ça représente 1500t par jour.



Pour la route simple, les 1500t de minerai par jour, ça représenterait 100 A/R de camions-porteurs (de 15t de charge utile) répartis sur les 15h de travail de jour des routiers, soit 7A/R par heure. Donc la route simple sera largement sous exploitée (perso, je l'aurai dimensionnée à 20A/R par heure). Aussi, chaque village-minier aura besoin de ravitaillement qui proviendra du village-usine auquel il sera rattaché, mais les porteurs auront largement la capacité de transport sur le retour.



Pour les routes rapides, le cas défavorable, ça serait de transformer et d'exporter toute la matière première reçue, soit 15kt par jour.
En admettant que les transports ralliant la ville ferroviaire n'aient pas de remorques, et qu'on prenne comme étalon la charge utile max d'un conteneur de classe "6m" (soit 30 t), il faudrait 500 A/R, soit 33A/R par heure sur 15h de journée (ce qui correspondrait bien à la capacité d'une voie rapide, mais qui se diluerait sur les multiples voies de la route rapide).



### Arborescence du réseau routier de Sandbox

Les modèles suivants ne sont pas des dispositions réelles, seulement des propositions théoriques pour pousser la réflexion et avoir matière à discuter.


![Arborescence routiere 1](/img/narrative/sandbox_routes/Interco1.png)
![Arborescence routiere 2](/img/narrative/sandbox_routes/Interco2.png)
![Arborescence routiere 3](/img/narrative/sandbox_routes/Interco3.png)
![Arborescence routiere 4](/img/narrative/sandbox_routes/Interco4.png)

L'arborescence finale à implémenter sera un mélange de ces version, adapté à la topologie, aux ressources exploitées et à l'ancienneté des localités.



Le modèle de répartition 1 semble être le minimum (on pourrait même avoir des point d'intérêts qui seraient liés uniquement à d'autre point d'intérêts).

Le modèle de répartition 2 semble la plus cohérent car elle laisse beaucoup d'intérêt à faire du hors-piste.
Le modèle de répartition 4 possède des connexions rouges inutiles et semble être surdimensionné par rapport aux hypothèses de transport.



## Les différentes routes

### Les pistes sommaires

C'est la plus répandue des routes sur Sandbox, car même une route rapide commence toujours par une première piste. On les retrouvent essentiellement entre les points d'intérêt et les villages miniers.



Une piste sommaire, c'est un chemin duquel on a réduit les aspérités du terrain en bouchant les trous avec du gravier, et en écartant les plus gros rochers. Dans une version un peu plus travaillée, on a pu damer la poussière, niveler avec du stérile certain passage, voire disposer des plaques de désensablement pour franchir les passages les plus meubles. Les pistes privilégient le contournement des obstacles naturels plutôt que l'aménagement du terrain.



Le véhicule privilégié pour les pistes sommaires serait un petit tout-terrain, d'une masse inférieure à 5t, d'une largeur de l'ordre de 2m et d'une longueur max de l'ordre de 6m, suivi éventuellement d'une remorque simple essieu de 2,5t pour 4m de longueur.



La vitesse de circulation moyenne serait de 25 à 35km/h, avec des sections permettant d'aller jusqu'à 50km/h sans risque, et d'autres nécessitant de ralentir à 10km/h pour franchir un obstacle sans danger.



Les pistes restent des routes dangereuses à grandes vitesses. La poussière levée usera les véhicules, de même que les fortes vibrations dues à une surface à peine préparée. La moindre sortie de route peut amener à la casse. Seuls les plus gros obstacles sont signalés pour les contourner, et les plus forts dénivelés disposent d'une signalisation renforcée pour guider les véhicules.



Une piste sommaire sur-utilisée est très lisible dans le paysage. Les trous et les crevasses réapparaissent alors que le gravier qui les comblaient a été éjecté par le passage des véhicules. Des ornières se creusent et les dalles de pierre se brisent. A l'inverse, une piste sous-utilisée tant à s'effacer, surtout dans les bassins où la poussière de corindon s'échappant des tempêtes d'altitude finit toujours par tomber au sol.



Il n'y aura pas d'autres panneaux sur les pistes, sauf un panneau de direction aux extrémités. Cependant, les locaux pourront faire des cairns, graver des pierres, etc... ou se servir de curiosités naturelles pour servir de repères intra-diégétique.



La largeur de la piste sera souvent à peine assez grande pour un seul véhicule léger. Il peut y avoir quelques zones d'arrêt un peu plus larges d'aménager pour permettre le croisement de deux véhicules si le terrain ne se prête pas du tout au hors-piste.



Pour l'aménagement de la piste, un système de bornes (en rouge) pourrait être ajouté qui indique la direction de la zone de croisement (en violet)
https://cdn.discordapp.com/attachments/1526334405570728046/1527250222772785263/Piste.png?ex=6a5e975c\&is=6a5d45dc\&hm=dcc0f9d367be8f1f2a429851e9f0821d77d4a1d60a72f9daf6e302d0370df575\&
piste_sommaire.png
![Piste sommaire](/img/narrative/sandbox_routes/piste_sommaire.png)



### Les routes simples

Elle se trouvent essentiellement entre les villages-miniers et les village-usines.



Une route simple, c'est à minima une route qui permet à deux véhicules poids-lourds de se croiser sur un ballast de graviers stabilisés. Mais la plupart des routes simples ont une surface qui a été fondue et gaufrée, les poussières de corindons et le stérile de mines étant utilisés localement pour disposer d'un revêtement proche d'une épaisse plaque d'aluminium épousant le ballast. Les routes simples coupent parfois à travers les obstacles, via des tranchées ou sur de larges ballasts, cependant, elles évitent les plus gros obstacles naturels qui nécessiterait des ouvrages conséquents (tunnels, ponts).



Une route simple serait adaptée à des camions-porteurs plus imposants, de l'ordre de 20 t pour 10m de long et 2,5m de large, suivi éventuellement d'une remorque de 8m de long en double essieu de 10 t.



La vitesse de circulation moyenne serait de 70 à 80km/h, avec des sections permettant d'aller jusqu'à 100km/h sans risque, et d'autres nécessitant de ralentir à 50km/h pour franchir des sections plus tortueuses, ou déformées.



Les routes simples permettent une circulation plus rapide et moins dangereuses. Les sorties de routes sont toujours aussi problématique, voire plus car il n'est pas forcément évident de revenir sur une route surélevée par un ballast, mais il y a de la signalisation claire pour prévenir des dangers sur la route.



Un route sur-utilisée verrait son revêtement s'endommager, peut-être même se fendre à certain endroit pour finir par former des nids-de-poules. Aussi, le début et la fin de revêtement (au niveau du village-minier par exemple) formerait un ralentisseur naturel en se déformant et en créant certainement une cuvette. Par contre, une route sous-utilisée ne changerait pas beaucoup, sauf avec la poussière qui se déposerait et peut-être formerait des bancs de sable à certains endroits particulièrement à l'abri du vent.



La signalisation est plus importante surtout au début et aux croisements de la route pour savoir dans quelle direction on va. Des bornes kilométriques signalerait la distance à la prochaine localité.
https://cdn.discordapp.com/attachments/1526334405570728046/1527251359173443717/RouteSimple.png?ex=6a5e986a\&is=6a5d46ea\&hm=e51fb760ac807032466fd4bb080eafed84a0926d268032a9cb271e5fc32b23a2\&
![Route simple](/img/narrative/sandbox_routes/route_simple.png)


### Les routes rapides

Elle se trouvent entre les village-usines et les villes (ferroviaire ou aérospatioportuaire).



La route rapide serait très large, très bien entretenue, et dispose de nombreux aménagements de sécurité, à commencer par des séparateurs de trafic et des échangeurs. Il y aurait plusieurs voies, potentiellement avec des voies réservées pour certains types de véhicules. La route rapide pourrait être dotée de nombreux ouvrages d'art (tunnels et ponts) pour suivre un itinéraire maximisant la vitesse.



La surface de la route serait sûrement aplanie et préparée pour permettre une circulation à grande vitesse qui limite les risques d'écart de conduite et d'accident. Si on pourrait retrouver certaines routes rapides directement réalisé en béton souffré, la plupart utilise ce béton comme support pour contenir un épais ballast supportant une surface similaire au routes simples.



Les routes rapides seraient le royaume des gros poids lourds d'une cinquantaine de tonnes. Que ce soit de très gros porteurs ou des ensembles tracteurs+remorques, ils font plus de 15m, disposent de doubles voire de triples essieux et pourraient même permettre de tirer plusieurs remorques à la suite.



Sur les routes rapides, la principale limite de vitesse serait due au véhicule choisi. La vitesse de croisière irait de 100km/h pour les poids-lourds les plus importants à 180km/h pour les véhicules rapides.



Une route rapide étant conçu pour une utilisation très intensive, elle ne pourrait virtuellement pas être sur-utilisée. Cependant, les jonctions avec les échangeurs et les ouvrages d'art pourrait plus facilement s'endommager. Aussi, le gaufrage de la surface pourrait avec le temps s'écraser puis s'effacer. Comme la route simple, seule la poussière serait un marquage d'une sous-utilisation d'une route rapide.



Des séparateurs de trafic (en rouge) sont mis de part et d'autre, et régulièrement des panneaux recto-verso sont placés entre les voies.
![Route rapide](/img/narrative/sandbox_routes/route_rapide.png)


### Technologie de surfaçage des routes

La matière première nécessaire pour le surfaçage des routes peut être trouvée directement sur trajet de la route, broyée, filtrée par une première machine puis transférer dans celle de surfaçage, ou elle peut être récupérée depuis les stériles issus des activités de minage et de concassage des minerais.



#### Surfaçage par fusion et gaufrage

On chauffe le revêtement jusqu'à ce qu'il atteigne son point de fusion de façon homogène, on applique le liquide sur la surface à une épaisseur constante et on utilise un rouleau et/ou des tampons, pour imprimer les formes que l'on désire sur la surface en train de refroidir.

Cette technologie est à privilégier dans le cadre d'un revêtement métallique.

![Surfaçage par fusion et gaufrage 1](/img/narrative/sandbox_routes/surfacage_fusion_gaufrage_1.png)
![Surfaçage par fusion et gaufrage 2](/img/narrative/sandbox_routes/surfacage_fusion_gaufrage_2.png)




#### Surfaçage par frittage

On chauffe le revêtement en dessous de son point de fusion et on le comprime pour lier ses particules. Cette technologie ne permet pas un texturage aussi fin que le gaufrage.

Cette technologie est à privilégier dans le cadre d'un revêtement céramique.

![Surfaçage par frittage 1](/img/narrative/sandbox_routes/surfacage_frittage_1.png)
![Surfaçage par frittage 2](/img/narrative/sandbox_routes/surfacage_frittage_2.png)

https://cdn.discordapp.com/attachments/1526334405570728046/1529948059482460411/7748d476-a276-4f9a-a9bf-618f5a9ed5ca.png?ex=6a6a622a\&is=6a6910aa\&hm=a56f13bf3887d0d3880d81835739004eff28e395a72e72b73048fefc3a3e64f7\&
https://cdn.discordapp.com/attachments/1526334405570728046/1529948060015268090/bb511748-371e-4c30-8ed6-b5755e3221b4.png?ex=6a6a622a\&is=6a6910aa\&hm=18d38fe8f566f151fb118b5ceeb7f50078561d0e180a5fb6ae06613fa2b81e16\&



#### Surfaçage par damage

Une pilonneuse provoque des chocs pour tasser profondément le ballast.

Une plaque vibrante secouent le gravier pour le forcer à occuper les espaces vides.

Un rouleau compresseur écrase et lisse le sol en surface.



#### Surfaçage par comblement

Etalement du gravier avec une niveleuse.

Utilisation d'un rouleau vibrant pour stabiliser et lisser la surface.

Ou de façon plus rustique et plus localisé, on déverse et/ou on pelte du gravier dans les trous.



## Les aménagements connexes

Selon la qualité du sol et sa constitution, des aménagements seront nécessaires (par exemple déposer une couche de gravier pour créer une surface praticable si l'endroit est trop sablonneux ce qui risque de provoquer des enlisements).


Aussi, des rampes pourraient être ajouter pour permettre de gagner une route simple sur ballast.



Un ensemble de balisage pourraient aussi être mis en place pour mieux signaler les voies (par exemple avec des délinéateurs équipés de rétro-réflecteurs, potentiellement qui s'encrassent).



On devrait aussi ajouter des câbles électriques le long des routes simples et routes rapides, sûrement semi-enterrées sous un petit talus de pierres et de gravats, pour permettre d'avoir un réseau électrique à l'échelle d'une ville et de ses villages.



La question des pipelines n'a pas été encore étudiée (aucun besoin n'a été identifié à date). Aussi, un transport par camion des fluides ne semblent pas présenter de problème, les routes simples et rapides étant globalement sous-utilisées.



Dans le cadre de pistes sommaires dans des environnements à visibilité très limitées, on pourrait aussi disposer régulièrement des poteaux d'1 à 2m de haut, avec un rétro-réflecteur, voire un projecteur sur batterie, voire même une balise de radio-goniométrie. Ces équipements permettraient à un véhicule de suivre une piste sans posséder d'équipements de navigation dédiée (à part peut-être de le récepteur de goniométrie si ce n'est pas supporté par le digitab du joueur).


La présence sur les voies rapides de barrières brise-vent pourraient être présent pour protéger les véhicules contre les bourrasques.


## Le marquage au sol

Compte-tenu de la technologie retenue pour créer la surface des routes, on retient les possibilités suivantes (potentiellement cumulative) :

* Inclusion d'un matériau différent (pierre par exemple) pour créer un contraste visuel ;
* Changer la texture du gaufrage (la route étant texturée pour l'adhérence, un marquage pourrait être créé par un polissage ou un changement de texture) ;
* Surimpression du marquage ;
* Coloration par dopage ionique du corindon.



La visibilité/lisibilité de ces marquages pose question (en particulier avec les poussières et la faible luminosité dans les bassins), aussi bien en jeu que d'un point de vue narratif, et nécessiterait des essais pour valider ou invalider ces technologies



Aussi, il n'y a pas de consensus sur l'usage du marquage au sol. C'est à voir en fonction du besoin.



## Les panneaux

### Conception des panneaux

Malgré une technologie très évoluées, même par rapport aux standards d'aujourd'hui, les panneaux sont d'une rusticité et d'une simplicité de déploiement telles qu'ils accompagnent les pionniers partout où ils vont. En particulier, les bassins étant sous les tempêtes de poussière de corindon, aucun positionnement par satellites n'est envisable, et le déploiement de balise radio à chaque point d'intérêt ou l'équipement de centrales inertielles sur l'ensemble de la flotte de véhicule est bien plus coûteux qu'un rustique ensemble de panneaux.



Les panneaux doivent répondre à plusieurs exigences environnementales :

* Rester lisible malgré l'encrassement et l'usure créée par les poussières de corindon ;
* Résister aux vents des tempêtes qui parfois s'étendent au-delà des altitudes habituelles.



Ces contraintes nous obligent à retenir essentiellement trois technologies complémentaires :

* Utilisation d'un système de lames ajourées pour l'accumulation de poussière.
* Utilisation d'un système rotatif à ressort pour limiter l'usure de la partie signalétique.
* Coloration par dopage ionique du métal constituant le panneau.



#### Les panneaux à lames

Les lames empêchent que les fortes rafales arrachent les panneaux. Elles permettent aussi d'évacuer la poussière.
![Panneau a lame 1](/img/narrative/sandbox_routes/panneau_a_lame_1.png)
![Panneau a lame 2](/img/narrative/sandbox_routes/panneau_a_lame_2.png)
![Panneau a lame 3](/img/narrative/sandbox_routes/panneau_a_lame_3.png)
![Panneau a lame 4](/img/narrative/sandbox_routes/panneau_a_lame_4.png)


Cependant, cette technologie est peu adapté aux symboles complexes et aux écritures. On la retrouvera donc pour des panneaux où la forme et la couleur suffisent à définir de quel panneau il s'agit.



#### Les panneaux à ressort rotatif

Le système rotatif agit comme une girouette et permet de présenter uniquement la tranche du panneau en cas de vent, et donc de limiter l'usure de ce dernier.

Un système de ressort permet au panneau de tenir sa position tant que le vent est faible (et donc d'être lisible depuis la route). Il ne s'oriente donc dans le sens du vent qu'en cas de grand vent.

En utilisant ce phénomène de girouette, on peut mettre en place un bouclier sacrificiel qui s'usera à la place du panneau et sera plus simple à changer.

![Panneau a ressort rotatif 1](/img/narrative/sandbox_routes/panneau_a_ressort_rotatif_1.png)
![Panneau a ressort rotatif 1](/img/narrative/sandbox_routes/panneau_a_ressort_rotatif_2.png)


Cette technologie est un peu plus complexe, et nécessite un peu d'entretien. Aussi, par grand vent, le panneau devient illisible depuis la route.

Mais elle permet de supporter les symboles complexes et les écritures. On la retrouvera donc plutôt pour les panneaux de direction, en particulier dans les zones fortement venteuses.



#### La coloration par dopage ionique

Cette technologie permet de colorer les panneaux dans la masse. Alors qu'une peinture disparaîtra plus ou moins rapidement avec l'usure créée par les vents chargés de poussières de corindons, une coloration dans la masse permet de conserver une couleur dominante dans le temps tout en protégeant le métal de l'oxydation.



Cependant, cette technologie ne permet pas une coloration précise (ce n'est pas juste un traitement de surface).



### Signalétique des panneaux

Dans le cadre d'un jeu qui sera joué au XXIème siècle, il est difficile, sinon impossible, de redéfinir complètement la symbolique. On devra s'inspirer d'un style tel que celui décrit dans la convention de Vienne par exemple. Aussi on devrait se limiter aux panneaux essentiels pour limiter les parallèles avec notre monde d'aujourd'hui. Par contre, on n'est pas obligé de limiter notre inspiration aux signalisations routières. On peut aussi s'inspirer de la signalisation maritime, fluviale, ferroviaire ou aéroportuaire.



Sur Sandbox, les panneaux doivent être rustique (on aura d'autres lieux plus technologiques pour réaliser des panneaux high-tech).


La signalisation doit être régulière et adaptée à la vitesse.
La signalisation pourrait être dynamique à certains endroits avec des affichages électro-mécaniques par exemple.


Certain panneaux pourrait être juste des formes :

* un stop avec un octogone ;
* une annonce de virage avec un triangle pointant dans le sens du virage ;
* un triangle vers le haut pour un avertissement de danger générique.

(Nota : cette idée n'est pas consensuelle.)



#### Panneaux attention/danger

Pour les panneaux de danger sur la route, je suis très ambivalent. D'un côté ça fait gagner du temps à tout le monde de ne retenir que s'il y a un panneau danger. D'un autre, un joueur qui connaît bien la route bénéficiera davantage de son expérience s'il n'y a pas de tels panneaux.



Un panneau Attention serait un triangle vers le haut, teinté dans la masse en jaune, avec éventuellement un symbole noir.



Pour les routes simples et les routes rapides :

* Les panneaux Attention doivent être disposés de façon à les voir pendant 5s en roulant à 100km/h (ie. \~140m) ;
* Les panneaux Attention doivent être à une distance comprise entre 100m et 150m du danger ;
* Si la visibilité avant le panneau n'est pas acquise dans l'intervalle de \[100;150]m, on le mettra plus loin, à un endroit où il sera lisible en associant un panonceau donnant la distance au danger ;
* S'il y a N dangers de même nature qui s'enchaînent, on peut mettre un panonceau "x N" plutôt que de remettre un panneau à chaque danger.



#### Panneaux direction

Un panneau de direction doit être teinté dans la masse en blanc, avec des écritures noires. Eventuellement, un symbole peut être ajouter avant le nom de la localité indiqué pour définir sa nature (ces symboles ne sont pas définis à date).



Pour les routes simples et les routes rapides, les panneaux de direction doivent être disposés de façon à être visible pendant 5s en roulant à 100km/h (ie. \~140m). 

Les panneaux de direction dans les localités doivent être placés au début de route quittant les localités.



Les panneaux de direction doivent respecter ces contraintes :

* Si la route est une boucle, un panneau de direction doit indiquer les 3 prochaines localités dans le sens de déplacement du véhicule,
* Si la route finit en impasse, un panneau de direction doit indiquer toutes les localités dans le sens de déplacement du véhicule,
* Un panneau de direction ne doit afficher que les localités directement desservi par la route (ie. on n'affiche pas les villages miniers sur la route rapide desservant un village usine),
* Un panneau de direction met la localité la plus proche en haut et la plus lointaine en bas.



#### Panneaux STOP

Le panneau STOP est assez universel pour que sa présence soit justifiée, ne serait-ce que pour signifier qu'on arrive sur une voie plus fréquentée et donc plus prioritaire.



Un panneau STOP serait un octogone, teinté dans la masse en rouge, avec éventuellement un STOP écrit en blanc.



On le retrouve essentiellement le long de routes simples, au croisement avec des pistes. On le retrouve aussi dans les localités le long des rues principales au croisement avec les rues secondaires.


#### Autres panneaux

La faible densité du réseau routier et l'absence de complexité dans l'objectif MVP n'incite pas à développer davantage de panneaux, pour un code de la route qui sera de toutes façons largement ignoré par les joueurs.



Cependant, on peut retrouver des panneaux d'obligation ou d'interdiction spécifiques liées aux filiales. Par exemple, pour les stationnements interdits ou réservés (exemple : les places de livraison de l'épicerie du village, ou les parkings réservés aux cadres d'Arès Science, les sorties d'usines, les sorties de garage, etc... ). On pourrait aussi avoir des voies de circulation réservées, particulièrement entre un entrepôt déporté et une usine, mais on peut matérialiser pleins de rapport de force avec ça.



## Rédacteurs

Bitogno, Ddurieux, Jarran Shovak, Mapper

