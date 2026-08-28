---
title: Files structure
sidebar_position: 2
---

# Folders and files organisation

All files will be set in the [main / game repository](https://github.com/DyingStar-game/DyingStar).


## Organisation for game

Inside we have 3D blender exported models (gltf files), textures...

```
- assets/
  - _universe/
    - environment/
      - space/
        - stations/
          - station_orbital_elevator_base.glb
          - station_orbital_elevator_base.tresmaterial
        - asteroids/
      - terrain/
        - rocks/
        - cliffs/
    - structures/
      - megastructures/
        - megastr_orbital_elevator_cable.glb
        - megastr_orbital_elevator_anchor.glb
      - industrial/
        - mines/
          - mine_entrance_large.glb
          - mine_shaft_segment.glb
        - refinery/
      - urban/
        - cities/
          - city_block_dense_a.glb
        - villages/
          - village_house_rural_sm.glb
      - buildings/
        - houses/
          - house_colonial_2f.glb
    - props/
      - furniture/
        - furn_table_wood_lg.glb
        - furn_chair_office.glb
      - tools/
      - containers/
    - vehicles/
      - spaceship/
        - ship_freighter_class_a.glb
      - ground/
    - characters/
      - humanoids/
      - creatures/
    - _shared/
      - materials/
      - shaders/
  - planets
    - tarsis_4
      - structures/
        - buildings/
          - houses/
            - house_sandstone_dome.glb
      - environment/
        - vegetation/
          - veg_tree_01.glb
      - props/
        - containers/
          - prop_water_cistern_aridis.glb
      - _shared/
        - materials/
- scenes
  - _universe/
    - environment/
      - space/
        - stations/
          - station_orbital_elevator_base.tscn
        - asteroids/
      - terrain/
        - rocks/
        - cliffs/
    - structures/
      - megastructures/
        - megastr_orbital_elevator.tscn
      - industrial/
        - mines/
          - mine.tscn
        - refinery/
      - urban/
        - cities/
          - city_block_dense_a.tscn
        - villages/
          - village_house_rural_sm.tscn
      - buildings/
        - houses/
          - house_colonial_2f.tscn
    - props/
      - furniture/
        - furn_table.tscn
        - furn_chair.tscn
      - tools/
      - containers/
    - vehicles/
      - spaceship/
        - ship_freighter_class_a.tscn
      - ground/
    - characters/
      - humanoids/
      - creatures/
  - planet
    - biome_xxx
    - planet_data.gd
  - systems
    - tarsis
      - tarsis_4.tscn
      - tarsis_4
        - structures/
          - buildings/
            - houses/
              - house_sandstone_dome.tscn
        - environment/
          - vegetation/
            - veg_tree_01.tscn
        - props/
          - containers/
            - prop_water_cistern_aridis.tscn
- server
- test
```


## Organisation for Blender files

```
- assets_blender/
  - _wip/ (for models not yet ready to export)
  - _universe/
    - environment/
      - space/
        - stations/
          - station_orbital_elevator_base.blend
          - tex_station_orbital_elevator_base_albedo.png
          - tex_station_orbital_elevator_base_normal.png
        - asteroids/
      - terrain/
        - rocks/
        - cliffs/
    - structures/
      - megastructures/
        - megastr_orbital_elevator_cable.blend
        - megastr_orbital_elevator_anchor.blend
      - industrial/
        - mines/
          - mine_entrance_large.blend
          - mine_shaft_segment.blend
        - refinery/
      - urban/
        - cities/
          - city_block_dense_a.blend
        - villages/
          - village_house_rural_sm.blend
      - buildings/
        - houses/
          - house_colonial_2f.blend
    - props/
      - furniture/
        - furn_table_wood_lg.blend
        - furn_chair_office.blend
      - tools/
      - containers/
    - vehicles/
      - spaceship/
        - ship_freighter_class_a.blend
      - ground/
    - characters/
      - humanoids/
      - creatures/
    - _shared/
      - materials/
      - hdri/
  - planets/
    - tarsis_4/
      - structures/
        - buildings/
          - houses/
            - house_sandstone_dome.blend
      - environment/
        - vegetation/
          - veg_tree_01.blend
        - props/
          - containers/
            - prop_water_cistern_aridis.blend
        - _shared/
          - materials/
```

The inside of `_shared/materials/` follows its own layout, one folder per
material holding a manifest, its maps and a preview. It is described on the
[Materials](./materials.md) page.

## Naming convention

The pattern is: [category_prefix]_[descriptor]_[variant/size].[ext]

| Part | Rule | Examples |
| ---- | ---- | -------- |
| Category prefix | Short noun identifying the type | ship_, mine_, furn_, megastr_, city_, village_, house_, char_ |
| Descriptor | snake_case, most specific noun first | freighter_class_a, entrance_large, table_wood_lg |
| Variant/size | Optional suffix: sm/md/lg, a/b/c, v2, damaged | _sm, _a, _damaged |
| Extension | .blend in source, .glb + optional .tscn/.tres in Godot | — |




