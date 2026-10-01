// Real skin database with verified official image assets and realistic market prices
// Rarities:
// CS2: 'milspec' (Blue), 'restricted' (Purple), 'classified' (Pink), 'covert' (Red), 'knife' (Gold)
// VAL: 'select' (Blue), 'deluxe' (Purple), 'premium' (Pink), 'exclusive' (Red), 'knife' (Gold)

const CS2_SKINS = {
  // Knives & Gloves (Gold)
  bfk_fade: {
    id: 'cs2_bfk_fade',
    name: '★ Butterfly Knife | Fade',
    weapon: 'Butterfly Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 3200,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw'
  },
  bfk_doppler: {
    id: 'cs2_bfk_doppler',
    name: '★ Butterfly Knife | Doppler Phase 2',
    weapon: 'Butterfly Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 2850,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2qvw-J3s-p5SiihmSIqsi-HlorwOy7DAVRPVssnHaMUuhe9xIHlMuvqtgPf2IoTyC383Sod7CY-sr4DVfZ2qKPU3g-TNuE-545DeqjFvb87vg'
  },
  karambit_fade: {
    id: 'cs2_karambit_fade',
    name: '★ Karambit | Fade',
    weapon: 'Karambit',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 2400,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbssLQJf2PLacDBA5ciJlY20hPbkI7PYhG5u5cRjiOXE_J7wjYSziUlkZzrycIaUewM8YFqCqAPtyLq51JW5u8idm3dmsnRw5CqPyxTh1h5IaLJmgPLXSELeWfI8Z1mQ/360fx360f'
  },
  m9_lore: {
    id: 'cs2_m9_lore',
    name: '★ M9 Bayonet | Lore',
    weapon: 'M9 Bayonet',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 1650,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbssLQJf1f_BYQJF_-OmgZODqOf7P77DqXtZ6ctjlqXEp4n231Xk-kdsZ23ycY-RegZsN13V_1C6xLvu05e7tJTMmndksid252GdwULg64RkRw/360fx360f'
  },
  skeleton_slaughter: {
    id: 'cs2_skeleton_slaughter',
    name: '★ Skeleton Knife | Slaughter',
    weapon: 'Skeleton Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 1100,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbssLQJf3qr3czxb49KzgL-Mh-PnJ6nklnlu-NZlmOzA-LP5gVO8v11kZjzyJNPHd1dtM1HYr1PvxL--0Me778zOnnI363V34C2Inhe1iU5LcKUx0uvbHn4S/360fx360f'
  },

  // Covert (Red)
  dlore: {
    id: 'cs2_dlore',
    name: 'AWP | Dragon Lore',
    weapon: 'AWP',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 4500,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV'
  },
  howl: {
    id: 'cs2_howl',
    name: 'M4A4 | Howl',
    weapon: 'M4A4',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 3800,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB'
  },
  fire_serpent: {
    id: 'cs2_fire_serpent',
    name: 'AK-47 | Fire Serpent',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 950,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvzSCkpu3cnvFPQB2DpUkROFY4Rntw93lP7i241DbiI1BxSuviHlKunk_6-sHU71lpPMTRLyP4Q'
  },
  asiimov: {
    id: 'cs2_asiimov',
    name: 'AWP | Asiimov',
    weapon: 'AWP',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 140,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6V-Kf2cGFidxOp_pewnF3nhxEt0sGnSzN76dH3GOg9xC8FyEORftRe-x9PuYurq71bW3d8UnjK-0H0YSTpMGQ'
  },
  printstream_m4: {
    id: 'cs2_printstream_m4',
    name: 'M4A1-S | Printstream',
    weapon: 'M4A1-S',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 220,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_F7Rienhgk1tjyIpYPwJiPTcAAoCpsiEO5ZsUbpm9C2Zuni4VHW3o5EzSX62HxP7Sg96-hWVqYi_6TJz1aW0nxrkGs'
  },
  printstream_deagle: {
    id: 'cs2_printstream_deagle',
    name: 'Desert Eagle | Printstream',
    weapon: 'Desert Eagle',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 110,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha_nBovp3OGmdeqInyVP1V0XsYlRbEI50a5wNyzZr605AyI3t5MmCSohylAuC89_a9cBoMY9UkV'
  },
  kill_confirmed: {
    id: 'cs2_kill_confirmed',
    name: 'USP-S | Kill Confirmed',
    weapon: 'USP-S',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 160,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_uV_vO1WTCa9kxQ1vjiBpYPwJiPTcFB2Xpp5TO5cskG9lYCxZu_jsVCL3o4Xnij23ClO5ik9tegFA_It8qHJz1aWe-uc160'
  },

  // Classified (Pink)
  case_hardened: {
    id: 'cs2_case_hardened',
    name: 'AK-47 | Case Hardened',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 280,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiNK0P2nZKFpH_yaCW-Ej7sk5bE8Sn-2lEpz4zndzoyvdHuUPwFzWZYiE7EK4Bi4k9TlY-y24FbAy9USGSiZd5Q'
  },
  water_elemental: {
    id: 'cs2_water_elemental',
    name: 'Glock-18 | Water Elemental',
    weapon: 'Glock-18',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 15,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK72fB3aFxP11te99cCW6khUz_TjVyompc3-QOFR2DJQkFOMJtBbqk9LlY-7n5QLZjtkTxCWqhixPv311o7FVIf8eASQ'
  },
  redline_ak: {
    id: 'cs2_redline_ak',
    name: 'AK-47 | Redline',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 22,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzedxuPUnFniykEtzsWWBzoyuIiifaAchDZUjTOZe4RC_w4buM-6z7wzbgokUyzK-0H08hRGDMA'
  },

  // Restricted (Purple)
  slate: {
    id: 'cs2_slate',
    name: 'AK-47 | Slate',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'restricted',
    basePrice: 5,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSMOKcCGKD0ud5vuBlcCW6khUz_W3Sytb4cCqTOFUpWJtzTOUD5hPsw9a0Yrnrs1SK3ooXzy6shilM5311o7FVYrIufmI'
  },
  atheris: {
    id: 'cs2_atheris',
    name: 'AWP | Atheris',
    weapon: 'AWP',
    game: 'cs2',
    rarity: 'restricted',
    basePrice: 7,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2GlQvZ1z3riZpIqui1W1qUtqamH7I4SVcwQ4N1yGqFjrxuzrh5fouZvPy3Bms3U8pSGKM2wW6j4/360fx360f'
  },

  // Mil-Spec (Blue)
  high_beam: {
    id: 'cs2_high_beam',
    name: 'Glock-18 | High Beam',
    weapon: 'Glock-18',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 1.5,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3djFN79eJmo-Cmf71P4Tck3lQ5PR4n-rN_Iv9nBrmr0FtMmnzdoOcdQdvN1vUrwTtx-i718S4v8ufmCRm6XYm4yuImxe30h1LcKUx0k0Z4P9W/360fx360f'
  },
  cortex: {
    id: 'cs2_cortex',
    name: 'USP-S | Cortex',
    weapon: 'USP-S',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 3.5,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8j_OrrcmW5D18p5j-jX7In3j1bl_0dtYmHzd9KTewY_ZguCrFW-le3ugp7utZrPwXZivih2-z-DyG2qO_6J/360fx360f'
  }
};

const VAL_SKINS = {
  // Knives & Ultra Melee (Gold) - ONLY FAN FAVORITES!
  kuronami_yaiba: {
    id: 'val_kuronami_yaiba',
    name: 'Kuronami no Yaiba',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3500,
    image: 'https://media.valorant-api.com/weaponskins/e37229ed-4ddf-5e7e-e744-8fba60fa2c37/displayicon.png'
  },
  reaver_karambit: {
    id: 'val_reaver_karambit',
    name: 'Reaver Karambit',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3100,
    image: 'https://media.valorant-api.com/weaponskins/b73d7b16-4652-bc5b-5c4c-068aabb19d0a/displayicon.png'
  },
  champions_2021_karambit: {
    id: 'val_champions_2021_karambit',
    name: 'Champions 2021 Karambit',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3900,
    image: 'https://media.valorant-api.com/weaponskins/1ea64c8d-43c4-fce8-7354-01bdd6c0ee17/displayicon.png'
  },
  champions_2022_butterfly: {
    id: 'val_champions_2022_butterfly',
    name: 'Champions 2022 Butterfly Knife',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3600,
    image: 'https://media.valorant-api.com/weaponskins/6946cd0e-4e4a-ec4f-9238-dfb71715722b/displayicon.png'
  },
  ignite_fan: {
    id: 'val_ignite_fan',
    name: 'Ignite Fan (Flâneur)',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 2900,
    image: 'https://media.valorant-api.com/weaponskins/1cd09fbd-43cb-a5f6-90fa-08994342d747/displayicon.png'
  },
  lockin_misericordia: {
    id: 'val_lockin_misericordia',
    name: 'VCT LOCK//IN Misericórdia',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 2800,
    image: 'https://media.valorant-api.com/weaponskins/9a98f7dd-426c-603e-0569-e9b317c25ee4/displayicon.png'
  },
  prime_karambit: {
    id: 'val_prime_karambit',
    name: 'Prime//2.0 Karambit',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 2400,
    image: 'https://media.valorant-api.com/weaponskins/9237e734-4a2a-38ae-7438-6cbee901877d/displayicon.png'
  },
  sovereign_sword: {
    id: 'val_sovereign_sword',
    name: 'Sovereign Sword',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 2200,
    image: 'https://media.valorant-api.com/weaponskins/2e77ac95-4681-3d87-bbdc-93a50ff6b1f6/displayicon.png'
  },
  onimaru_katana: {
    id: 'val_onimaru_katana',
    name: 'Onimaru Kunitsuna (Oni Katana)',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3000,
    image: 'https://media.valorant-api.com/weaponskins/4e7342a5-4820-2d79-a488-0fa51a4357f7/displayicon.png'
  },
  xenohunter_knife: {
    id: 'val_xenohunter_knife',
    name: 'Xenohunter Knife',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 2350,
    image: 'https://media.valorant-api.com/weaponskins/c5482640-4652-bc5b-29c6-769e8198db27/displayicon.png'
  },

  // Exclusive (Red)
  kuronami_vandal: {
    id: 'val_kuronami_vandal',
    name: 'Kuronami Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 480,
    image: 'https://media.valorant-api.com/weaponskins/d8d5d7a1-4d81-8560-54bc-0692ab40f69b/displayicon.png'
  },
  reaver_vandal: {
    id: 'val_reaver_vandal',
    name: 'Reaver Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 420,
    image: 'https://media.valorant-api.com/weaponskins/30388628-42f0-606c-82c0-73ad43de997f/displayicon.png'
  },
  prime_vandal: {
    id: 'val_prime_vandal',
    name: 'Prime Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 400,
    image: 'https://media.valorant-api.com/weaponskins/b9ee2457-481c-6776-3f5b-0ca8e8f90c89/displayicon.png'
  },
  elderflame_vandal: {
    id: 'val_elderflame_vandal',
    name: 'Elderflame Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 490,
    image: 'https://media.valorant-api.com/weaponskins/18609205-4edb-5966-cff8-0fba0230ba1e/displayicon.png'
  },
  araxys_vandal: {
    id: 'val_araxys_vandal',
    name: 'Araxys Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 440,
    image: 'https://media.valorant-api.com/weaponskins/4c926aa9-4f26-bc80-c486-9b888333373f/displayicon.png'
  },
  glitchpop_vandal: {
    id: 'val_glitchpop_vandal',
    name: 'Glitchpop Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 390,
    image: 'https://media.valorant-api.com/weaponskins/74789f33-4632-8052-96d7-258538721a32/displayicon.png'
  },

  // Premium (Pink)
  ion_phantom: {
    id: 'val_ion_phantom',
    name: 'Ion Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'premium',
    basePrice: 210,
    image: 'https://media.valorant-api.com/weaponskins/e86bf7e4-4dd3-fbee-533b-fa875344bbaf/displayicon.png'
  },
  oni_phantom: {
    id: 'val_oni_phantom',
    name: 'Oni Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'premium',
    basePrice: 220,
    image: 'https://media.valorant-api.com/weaponskins/36791b03-452d-8dad-0091-898cc28d2196/displayicon.png'
  },
  xenohunter_phantom: {
    id: 'val_xenohunter_phantom',
    name: 'Xenohunter Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'premium',
    basePrice: 195,
    image: 'https://media.valorant-api.com/weaponskins/fac0cea1-45a9-1549-c120-af8f0150e562/displayicon.png'
  },

  // Deluxe (Purple)
  xenohunter_frenzy: {
    id: 'val_xenohunter_frenzy',
    name: 'Xenohunter Frenzy',
    weapon: 'Frenzy',
    game: 'val',
    rarity: 'deluxe',
    basePrice: 35,
    image: 'https://media.valorant-api.com/weaponskins/a4b0cd8b-40dc-41e3-646d-d58802b2e310/displayicon.png'
  },
  xenohunter_bucky: {
    id: 'val_xenohunter_bucky',
    name: 'Xenohunter Bucky',
    weapon: 'Bucky',
    game: 'val',
    rarity: 'deluxe',
    basePrice: 28,
    image: 'https://media.valorant-api.com/weaponskins/0666931c-4580-efd0-af47-afb9f2f72e55/displayicon.png'
  },

  // Select (Blue)
  xenohunter_odin: {
    id: 'val_xenohunter_odin',
    name: 'Xenohunter Odin',
    weapon: 'Odin',
    game: 'val',
    rarity: 'select',
    basePrice: 6,
    image: 'https://media.valorant-api.com/weaponskins/94c085e6-48e1-c879-2552-88bf7850c5a8/displayicon.png'
  }
};

// CASES DEFINITION
// Each case costs 1 balance (user rule: 1 bakiye 1 kasa)
const CASES = [
  // === CS2 CASES ===
  {
    id: 'cs2_legends',
    name: 'CS2 Efsaneleri Kasası',
    subtitle: 'Dragon Lore & Howl Şansı',
    game: 'cs2',
    cost: 1,
    icon: '🔥',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV',
    items: [
      { skin: CS2_SKINS.dlore, weight: 0.25 },
      { skin: CS2_SKINS.howl, weight: 0.35 },
      { skin: CS2_SKINS.karambit_fade, weight: 0.4 },
      { skin: CS2_SKINS.fire_serpent, weight: 1.5 },
      { skin: CS2_SKINS.printstream_m4, weight: 3.5 },
      { skin: CS2_SKINS.case_hardened, weight: 9.0 },
      { skin: CS2_SKINS.redline_ak, weight: 20.0 },
      { skin: CS2_SKINS.slate, weight: 30.0 },
      { skin: CS2_SKINS.high_beam, weight: 35.0 }
    ]
  },
  {
    id: 'cs2_knives_only',
    name: '★ Bıçak Kulübü Kasası',
    subtitle: 'Kelebek & Karambit Dünyası',
    game: 'cs2',
    cost: 1,
    icon: '🗡️',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw',
    items: [
      { skin: CS2_SKINS.bfk_fade, weight: 0.25 },
      { skin: CS2_SKINS.bfk_doppler, weight: 0.35 },
      { skin: CS2_SKINS.karambit_fade, weight: 0.4 },
      { skin: CS2_SKINS.m9_lore, weight: 0.8 },
      { skin: CS2_SKINS.skeleton_slaughter, weight: 1.2 },
      { skin: CS2_SKINS.asiimov, weight: 5.0 },
      { skin: CS2_SKINS.kill_confirmed, weight: 7.0 },
      { skin: CS2_SKINS.redline_ak, weight: 25.0 },
      { skin: CS2_SKINS.atheris, weight: 30.0 },
      { skin: CS2_SKINS.cortex, weight: 30.0 }
    ]
  },
  {
    id: 'cs2_covert_frenzy',
    name: 'Covert (Kırmızı) Avı',
    subtitle: 'Sadece Yüksek Rarity & Kırmızı Düşüş',
    game: 'cs2',
    cost: 1,
    icon: '⚡',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_F7Rienhgk1tjyIpYPwJiPTcAAoCpsiEO5ZsUbpm9C2Zuni4VHW3o5EzSX62HxP7Sg96-hWVqYi_6TJz1aW0nxrkGs',
    items: [
      { skin: CS2_SKINS.bfk_fade, weight: 0.3 },
      { skin: CS2_SKINS.printstream_m4, weight: 2.0 },
      { skin: CS2_SKINS.printstream_deagle, weight: 3.5 },
      { skin: CS2_SKINS.kill_confirmed, weight: 4.2 },
      { skin: CS2_SKINS.asiimov, weight: 5.0 },
      { skin: CS2_SKINS.water_elemental, weight: 20.0 },
      { skin: CS2_SKINS.slate, weight: 35.0 },
      { skin: CS2_SKINS.high_beam, weight: 30.0 }
    ]
  },

  // === VALORANT CASES ===
  {
    id: 'val_champions_melee',
    name: 'VALORANT Efsane Bıçaklar',
    subtitle: 'Kuronami Yaiba & Champions Karambit',
    game: 'val',
    cost: 1,
    icon: '👑',
    image: 'https://media.valorant-api.com/weaponskins/e37229ed-4ddf-5e7e-e744-8fba60fa2c37/displayicon.png',
    items: [
      { skin: VAL_SKINS.kuronami_yaiba, weight: 0.3 },
      { skin: VAL_SKINS.champions_2021_karambit, weight: 0.3 },
      { skin: VAL_SKINS.champions_2022_butterfly, weight: 0.4 },
      { skin: VAL_SKINS.reaver_karambit, weight: 0.5 },
      { skin: VAL_SKINS.onimaru_katana, weight: 0.7 },
      { skin: VAL_SKINS.ignite_fan, weight: 0.8 },
      { skin: VAL_SKINS.lockin_misericordia, weight: 1.0 },
      { skin: VAL_SKINS.kuronami_vandal, weight: 3.0 },
      { skin: VAL_SKINS.reaver_vandal, weight: 4.0 },
      { skin: VAL_SKINS.oni_phantom, weight: 14.0 },
      { skin: VAL_SKINS.xenohunter_frenzy, weight: 35.0 },
      { skin: VAL_SKINS.xenohunter_odin, weight: 40.0 }
    ]
  },
  {
    id: 'val_kuronami_vandal_rush',
    name: 'Kuronami & Yağmacı Vandal Kasası',
    subtitle: 'En Popüler Vandal Skinleri',
    game: 'val',
    cost: 1,
    icon: '🌊',
    image: 'https://media.valorant-api.com/weaponskins/d8d5d7a1-4d81-8560-54bc-0692ab40f69b/displayicon.png',
    items: [
      { skin: VAL_SKINS.kuronami_yaiba, weight: 0.35 },
      { skin: VAL_SKINS.kuronami_vandal, weight: 2.0 },
      { skin: VAL_SKINS.elderflame_vandal, weight: 2.2 },
      { skin: VAL_SKINS.araxys_vandal, weight: 2.5 },
      { skin: VAL_SKINS.reaver_vandal, weight: 3.0 },
      { skin: VAL_SKINS.prime_vandal, weight: 3.5 },
      { skin: VAL_SKINS.glitchpop_vandal, weight: 4.0 },
      { skin: VAL_SKINS.ion_phantom, weight: 12.0 },
      { skin: VAL_SKINS.xenohunter_bucky, weight: 35.0 },
      { skin: VAL_SKINS.xenohunter_odin, weight: 35.45 }
    ]
  },
  {
    id: 'val_prime_reaver_duel',
    name: 'Asil & Yağmacı Karambit Düellosu',
    subtitle: 'İki İkonik Set Bir Arada',
    game: 'val',
    cost: 1,
    icon: '🔮',
    image: 'https://media.valorant-api.com/weaponskins/b73d7b16-4652-bc5b-5c4c-068aabb19d0a/displayicon.png',
    items: [
      { skin: VAL_SKINS.reaver_karambit, weight: 0.4 },
      { skin: VAL_SKINS.prime_karambit, weight: 0.6 },
      { skin: VAL_SKINS.sovereign_sword, weight: 0.8 },
      { skin: VAL_SKINS.xenohunter_knife, weight: 1.0 },
      { skin: VAL_SKINS.reaver_vandal, weight: 3.0 },
      { skin: VAL_SKINS.prime_vandal, weight: 3.2 },
      { skin: VAL_SKINS.oni_phantom, weight: 12.0 },
      { skin: VAL_SKINS.xenohunter_phantom, weight: 14.0 },
      { skin: VAL_SKINS.xenohunter_frenzy, weight: 35.0 },
      { skin: VAL_SKINS.xenohunter_odin, weight: 30.0 }
    ]
  }
];

module.exports = {
  CS2_SKINS,
  VAL_SKINS,
  CASES
};
