// Real skin database with verified official image assets and realistic market prices
// Rarities:
// CS2: 'milspec' (Blue), 'restricted' (Purple), 'classified' (Pink), 'covert' (Red), 'knife' (Gold)
// VAL: 'select' (Blue), 'deluxe' (Purple), 'premium' (Pink), 'exclusive' (Red), 'knife' (Gold)

const CS2_SKINS = {
  // Knives (Gold) - Verified 200 OK Steam CDN
  bfk_fade: {
    id: 'cs2_bfk_fade',
    name: '★ Butterfly Knife | Fade',
    weapon: 'Butterfly Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 6800,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw'
  },
  bfk_doppler: {
    id: 'cs2_bfk_doppler',
    name: '★ Butterfly Knife | Doppler Phase 2',
    weapon: 'Butterfly Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 6200,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2qvw-J3s-p5SiihmSIqsi-HlorwOy7DAVRPVssnHaMUuhe9xIHlMuvqtgPf2IoTyC383Sod7CY-sr4DVfZ2qKPU3g-TNuE-545DeqjFvb87vg'
  },
  karambit_fade: {
    id: 'cs2_karambit_fade',
    name: '★ Karambit | Fade',
    weapon: 'Karambit',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 5600,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SD1iWwOpzj-1gSCGn20tztm_UyIn_JHKUbgYlWMcmQ-ZcskSwldS0MOnntAfd3YlMzH35jntXrnE8SOGRGG8'
  },
  m9_lore: {
    id: 'cs2_m9_lore',
    name: '★ M9 Bayonet | Lore',
    weapon: 'M9 Bayonet',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 4900,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Wts2sab1iLvWHMWSF_uMvj-NoVha_mg8ijDGMnYftbyrBOw52D5R0FOYPtkG6ltOxNrjl4FPdiN0WzC723SxP6ypp6u8LVKY7uvqAFpeI3XY'
  },
  skeleton_slaughter: {
    id: 'cs2_skeleton_slaughter',
    name: '★ Skeleton Knife | Slaughter',
    weapon: 'Skeleton Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 4600,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-SA1iKxOxksd5lRi67gVMh62_RzdygJHORZlAlDpZwQOYM4Ri5k4HhNezg4wOLg49Nyy772y9J8G81tBUopZdW'
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
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvzSCkpu3cnvFPQB2DpUkROFY4Rntw93lP7i241DbiI1BxSuviHlKunk_6-sHU71lpPMTRLyP4Q'
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
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V7JkMPWBMWuZxuZi_rZsS3zgzU8isW3dnIr6eHKfPVAhDpojEe9YsUW4xta1Nuzm5FDci4NbjXKpmWVQppo'
  },

  // Mil-Spec (Blue)
  high_beam: {
    id: 'cs2_high_beam',
    name: 'Glock-18 | High Beam',
    weapon: 'Glock-18',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 1.5,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a7s24bbZ5KfecMWWc1OtJvOhuRz39zU5yt2vQntn9dC3Dbw8iDJQhF-IJ5xDqkdSxMr6251aMiI5BynqtiTQJsHhqpMNExQ'
  },
  cortex: {
    id: 'cs2_cortex',
    name: 'USP-S | Cortex',
    weapon: 'USP-S',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 3.5,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_u1jpN5lRi67gVNz4G7Qm938cS_Da1AhXpB1EeVb4xm4mtDjN7vj4A3b2NpGyCr52i4Y8G81tMzdoYZ7'
  },
  ak47_uncharted: {
    id: 'cs2_ak47_uncharted',
    name: 'AK-47 | Uncharted',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 2.2,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIeqHC2SvzedxuPUnFnCwwBl_5D_Syon8dnyUaQUlD5oiQ7ECuxW7l920ZL-w4AfX2IlByTK-0H0PRM7cOA'
  },
  m4a4_magnesium: {
    id: 'cs2_m4a4_magnesium',
    name: 'M4A4 | Magnesium',
    weapon: 'M4A4',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 2.0,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSI_icHneV09FxuO56Wxa_nBovp3OAzo2vdHPFPFUmCJRxRbNZ4xewx9W1Nb7j4gzXg99Ayy73iC1Aun1q_a9cBiEfMG3G'
  },
  awp_capillary: {
    id: 'cs2_awp_capillary',
    name: 'AWP | Capillary',
    weapon: 'AWP',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 3.0,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V7JoKf6sAm6Xyfo44bE5HSrmlx5z4GTUzt__I3yebQAgA8R3FuFfsBTqx9W2Y7vq5lbfjZUFk3ugIlCuqg'
  },
  glock_polymer: {
    id: 'cs2_glock_polymer',
    name: 'Glock-18 | Clear Polymer',
    weapon: 'Glock-18',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 1.8,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1c_M2pZKtuK8-DAWuJzOtkj-1gSCGn200h4TnQwtqoci_CPQYlDsAiRuZc5hK7kd2zZbm37lGK2o5HnH2v2ixXrnE85Jt4rDY'
  },
  mac10_ensnared: {
    id: 'cs2_mac10_ensnared',
    name: 'MAC-10 | Ensnared',
    weapon: 'MAC-10',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 1.6,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1Y-s2jaac8cM-DB3-ZxNF6ueZhW2fikB935ziGztj7JHyQbgIkWZsmFrJY4xTpwdOzP-Oz7laNj4lFyy2tkGoXudbL5uIf'
  },
  ak47_elite_build: {
    id: 'cs2_ak47_elite_build',
    name: 'AK-47 | Elite Build',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 3.2,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSLfGAGmKC2NF6ueZhW2e2wh9y5GjTztirdSqfP1dyCpclR7FZ5xe9wNbhZei25FGPjokXxC2vkGoXuQLr5jvs'
  },
  // CS:GO Weapon Case #1 Skins (+%28 Gerçek Piyasa Fiyatı Artırıldı)
  karambit_ch: {
    id: 'cs2_karambit_ch',
    name: '★ Karambit | Case Hardened (Blue Gem)',
    weapon: 'Karambit',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 44800, // 35.000 TL + %28
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SH1ifyOJztN5lRi67gVNz5DvUmdj4eXuWOFAhAsF4RLFc5BC4xtbuY7yx7wDbgo9CzSj2h3xK8G81tB_XeHWq'
  },
  ak47_case_hardened: {
    id: 'cs2_ak47_case_hardened',
    name: 'AK-47 | Case Hardened (Tier 1)',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 9600, // 7.500 TL + %28
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiNK0P2nZKFpH_yaCW-Ej7sk5bE8Sn-2lEpz4zndzoyvdHuUPwFzWZYiE7EK4Bi4k9TlY-y24FbAy9USGSiZd5Q'
  },
  awp_lightning_strike: {
    id: 'cs2_awp_lightning_strike',
    name: 'AWP | Lightning Strike',
    weapon: 'AWP',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 19200, // 15.000 TL + %28
    image: 'https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_C9k4_upYLBjKf6UMWaH0dF6ueZhW2frwU1_sW2EmNyvc32RZwMpCpcjQ-EJ4xbtmt3gYezk4wzb3tpAy3mrkGoXubsGIfVN'
  },
  deagle_hypnotic: {
    id: 'cs2_deagle_hypnotic',
    name: 'Desert Eagle | Hypnotic',
    weapon: 'Desert Eagle',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 4480, // 3.500 TL + %28
    image: 'https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7vORfqF_NPmUAVicyOl-pK9qSyyywxgjtmnVytyocnLGPA4iWcYmRLYIu0S-xtbuMLjg51DXjoJC02yg2VjGnh4J'
  },
  glock_dragon_tattoo: {
    id: 'cs2_glock_dragon_tattoo',
    name: 'Glock-18 | Dragon Tattoo',
    weapon: 'Glock-18',
    game: 'cs2',
    rarity: 'restricted',
    basePrice: 2816, // 2.200 TL + %28
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2qeqVqL_6sCWufwuVJvOhuRz39xUl-6miDzI37dHyXOlIkA8MmROVfshO9w9G1Ye-ztgPX34tEyi74jjQJsHi_DRfxVg'
  },
  m4a1s_dark_water: {
    id: 'cs2_m4a1s_dark_water',
    name: 'M4A1-S | Dark Water',
    weapon: 'M4A1-S',
    game: 'cs2',
    rarity: 'restricted',
    basePrice: 2560, // 2.000 TL + %28
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9Jo-9oRCyMnRgmpSTLy9igc3PDbVcnDZd3R-de5hHpl4CxZO6z4gLWjt5Dzyv8iCJA6C5j5vFCD_ThScH7Ig'
  },
  usps_dark_water: {
    id: 'cs2_usps_dark_water',
    name: 'USP-S | Dark Water',
    weapon: 'USP-S',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 1920, // 1.500 TL + %28
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSIf2sFGKS0-9JtOB7RBa_nBovp3OHy9v8J3vFbgIhC5UmQ7UIsxm7wNDnNr_rswOMiNlGmCWoiH9Juis9_a9cBl2xnYuj'
  },
  aug_wings: {
    id: 'cs2_aug_wings',
    name: 'AUG | Wings',
    weapon: 'AUG',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 576, // 450 TL + %28
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwi5Hf9Ttk6fevfKxoMuOsD3KX_uJ_t-l9AX7qzE5_sGmEw9uoJCrBOgMoDsN2ReMI4EPrm4fvY-m04ASPgt8Uz3_gznQePzx-iqc'
  },
  sg553_ultraviolet: {
    id: 'cs2_sg553_ultraviolet',
    name: 'SG 553 | Ultraviolet',
    weapon: 'SG 553',
    game: 'cs2',
    rarity: 'milspec',
    basePrice: 448, // 350 TL + %28
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLimcO1qx1I4M2-fbZ9LPWsAm6Xyfo44bQ-Tn7gwRt-t2uAw96tIn7FOAF1CsckQLUJ4xXskdO2NLzrtAyIi5UFk3tU_MwgmA'
  },

  // New CS2 Skins (Chroma & Clutch/Prisma)
  karambit_doppler: {
    id: 'cs2_karambit_doppler',
    name: '★ Karambit | Doppler',
    weapon: 'Karambit',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 4800,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SA1iSze91u_FsTju_qhAmoT-Jn4bjJC_4Ml93UtZuRLQPsBawkNfiMbnl5AKMiopCnin7iCJBv31j4rkBBKEg-6zUjV3GY6p9v8dpLWT3Fg'
  },
  bfk_marble_fade: {
    id: 'cs2_bfk_marble_fade',
    name: '★ Butterfly Knife | Marble Fade',
    weapon: 'Butterfly Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 5800,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2qvzO9ksu1scC-ykRgYvzSCkpu3JCrBPVMkCZIiFLUC40S-l9DkZerg4Qfc3Y9DzCuo3SlK6ydv5e9UA71lpPNwsjHPzA'
  },
  skeleton_fade: {
    id: 'cs2_skeleton_fade',
    name: '★ Skeleton Knife | Fade',
    weapon: 'Skeleton Knife',
    game: 'cs2',
    rarity: 'knife',
    basePrice: 4800,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-SD1iWwOpzj-1gSCGn20kjt2-En9mpcCmQag8hXsciQeJYthW9kILkMLji4g3Ygo8Uznj6jX9XrnE8raC5r1M'
  },
  ak47_vulcan: {
    id: 'cs2_ak47_vulcan',
    name: 'AK-47 | Vulcan',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 650,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uJ_t-l9AXCxxEh14zjTztivci2ePQZ2W8NzTecD4BKwloLiYeqxtAOIj9gUyyngznQeF7I6QE8'
  },
  awp_hyper_beast: {
    id: 'cs2_awp_hyper_beast',
    name: 'AWP | Hyper Beast',
    weapon: 'AWP',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 280,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-1gSCGn20pxtm_WzNuoeHKeaFAnCZUiTe5bt0HqxofmZOrm5Q2IjoMQzS_5iShXrnE8NzWs__c'
  },
  m4a4_emperor: {
    id: 'cs2_m4a4_emperor',
    name: 'M4A4 | The Emperor',
    weapon: 'M4A4',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 320,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSJf2DC3Wf09F6ueZhW2exwBh_6m3dnt36InjDPQ4oXJt1TbJeshW_mtfjN-vrsgaKiokWy333kGoXuRj4z9Nd'
  },
  m4a1s_cyrex: {
    id: 'cs2_m4a1s_cyrex',
    name: 'M4A1-S | Cyrex',
    weapon: 'M4A1-S',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 160,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj-JwXSyrqhEutDWR1N77cimSbQQgC8F5QLYCsELpltTnZuvk7wbcjdhDzy_43yMb6ilvt7kcEf1yDWu2yf8'
  },
  ak47_bloodsport: {
    id: 'cs2_ak47_bloodsport',
    name: 'AK-47 | Bloodsport',
    weapon: 'AK-47',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 380,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSIvycAWOD0eFkpN5lRi67gVN15mmDw9egci_EPFAkDMQlTeZe4EXplNa0Yrvr5wbd345GyHioiC4b8G81tFuqg_k_'
  },
  usps_neonoir: {
    id: 'cs2_usps_neonoir',
    name: 'USP-S | Neo-Noir',
    weapon: 'USP-S',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 110,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA0tF4v-h7cCW6khUz_WXdmd-vI3uRPwEkApR4QuBcu0Xrk4biYr_mtQXdidlCz3r63Ska7Hx1o7FVWuokIcU'
  },
  deagle_ocean_drive: {
    id: 'cs2_deagle_ocean_drive',
    name: 'Desert Eagle | Ocean Drive',
    weapon: 'Desert Eagle',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 130,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ_yWMWyZ1e1-j-1gSCGn2x5-sG7Wzdyvc3OSbgcnXpR5FO9bukTtm9WzMePhswaN2N5CmCj_jyhXrnE8ibjhEyc'
  },
  deagle_code_red: {
    id: 'cs2_deagle_code_red',
    name: 'Desert Eagle | Code Red',
    weapon: 'Desert Eagle',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 190,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk6OGRbKFsJ_yWMWaXxvxzo_JmXRa_nBovp3PRmNj4c3mTb1RxC5cjF-EItRnrlNzkYrnk5gaI3Y0UmyX52H9K7ixs_a9cBsGEcOCn'
  },
  glock_vogue: {
    id: 'cs2_glock_vogue',
    name: 'Glock-18 | Vogue',
    weapon: 'Glock-18',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 45,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK8-WF2KTzuBiseJ9cCW6khUz_T-GyNavdCqRawN1CMFwTOcO5hO7loXiY-zmsQKPi44QzHj22ikcvy11o7FVfFOBmfY'
  },
  ssg_dragonfire: {
    id: 'cs2_ssg_dragonfire',
    name: 'SSG 08 | Dragonfire',
    weapon: 'SSG 08',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 75,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-XHGaXzuBwufNscDqwmg0ijDGMnYftbyrFPVAoWcQjELQOuxO4k4e1N-nnsQfW2I5Mz3ivi3wb7Stj5ukAUKY7uvqAqS55_Pw'
  },
  m4a4_in_living_color: {
    id: 'cs2_m4a4_in_living_color',
    name: 'M4A4 | In Living Color',
    weapon: 'M4A4',
    game: 'cs2',
    rarity: 'classified',
    basePrice: 65,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSLP-FC1icyOl-pK84GH2wxhty4DjcyNuhdHyXbAVxW8QjTbEMthC8kNa0MLmzs1Hbj95E02yg2bbWGcKW'
  },
  awp_wildfire: {
    id: 'cs2_awp_wildfire',
    name: 'AWP | Wildfire',
    weapon: 'AWP',
    game: 'cs2',
    rarity: 'covert',
    basePrice: 420,
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V7NkLPSVB3WV_uJ_t-l9AX7rxhl-tmzSwomtdC6TPwQnW5UkR-YD5kK-ltCzP-Ox4FfXiNoQyyrgznQeu9L0PzQ'
  }
};

const VAL_SKINS = {
  // SARI (Gold / Knives)
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
  ignite_fan: {
    id: 'val_ignite_fan',
    name: 'Ignite Fan',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 2900,
    image: 'https://media.valorant-api.com/weaponskins/1cd09fbd-43cb-a5f6-90fa-08994342d747/displayicon.png'
  },
  araxys_bio_harvester: {
    id: 'val_araxys_bio_harvester',
    name: 'Araxys Bio Harvester',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3200,
    image: 'https://media.valorant-api.com/weaponskins/a486efac-4415-1bfa-68d1-19bca9968101/displayicon.png'
  },

  // CHAMPIONS ALL YEARS (Eskiden Yeniye Değer Skalası: 2021 Karambit 20.570 TL, 2024 Bıçak 4.840 TL) +%21
  champions_2021_karambit: {
    id: 'val_champions_2021_karambit',
    name: 'Champions 2021 Karambit',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 20570,
    image: 'https://media.valorant-api.com/weaponskins/1ea64c8d-43c4-fce8-7354-01bdd6c0ee17/displayicon.png'
  },
  champions_2021_vandal: {
    id: 'val_champions_2021_vandal',
    name: 'Champions 2021 Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'knife',
    basePrice: 16335,
    image: 'https://media.valorant-api.com/weaponskins/9bf19b77-4b33-7203-9f2c-16932970622f/displayicon.png'
  },
  champions_2022_butterfly: {
    id: 'val_champions_2022_butterfly',
    name: 'Champions 2022 Butterfly Knife',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 13915,
    image: 'https://media.valorant-api.com/weaponskins/6946cd0e-4e4a-ec4f-9238-dfb71715722b/displayicon.png'
  },
  champions_2022_phantom: {
    id: 'val_champions_2022_phantom',
    name: 'Champions 2022 Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'knife',
    basePrice: 10285,
    image: 'https://media.valorant-api.com/weaponskins/8c72ae0b-4357-1a75-ad62-fbaec7b64f92/displayicon.png'
  },
  champions_2023_kunai: {
    id: 'val_champions_2023_kunai',
    name: 'Champions 2023 Kunai',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 8470,
    image: 'https://media.valorant-api.com/weaponskins/27f27500-491c-32d4-1db6-1f85e479c103/displayicon.png'
  },
  champions_2023_vandal: {
    id: 'val_champions_2023_vandal',
    name: 'Champions 2023 Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'knife',
    basePrice: 6655,
    image: 'https://media.valorant-api.com/weaponskins/b0f65660-4c51-13b7-9d01-e29a1e2879b0/displayicon.png'
  },
  champions_2024_blade: {
    id: 'val_champions_2024_blade',
    name: 'Champions 2024 Blade',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 4840,
    image: 'https://media.valorant-api.com/weaponskins/30300aea-4d8a-320d-5cb0-0e8badc8d3df/displayicon.png'
  },
  champions_2024_phantom: {
    id: 'val_champions_2024_phantom',
    name: 'Champions 2024 Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'knife',
    basePrice: 3872,
    image: 'https://media.valorant-api.com/weaponskins/cc1da8cd-452f-a007-0bf8-b68a471c3a6e/displayicon.png'
  },
  // 2025 CHAMPIONS BUNDLE
  champions_2025_blade: {
    id: 'val_champions_2025_blade',
    name: 'Champions 2025 Dagger',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3025,
    image: 'https://media.valorant-api.com/weaponskins/e37229ed-4ddf-5e7e-e744-8fba60fa2c37/displayicon.png'
  },
  champions_2025_vandal: {
    id: 'val_champions_2025_vandal',
    name: 'Champions 2025 Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'knife',
    basePrice: 2420,
    image: 'https://media.valorant-api.com/weaponskins/b9ee2457-481c-6776-3f5b-0ca8e8f90c89/displayicon.png'
  },
  // 2026 CHAMPIONS BUNDLE
  champions_2026_katana: {
    id: 'val_champions_2026_katana',
    name: 'Champions 2026 Katana',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 1936,
    image: 'https://media.valorant-api.com/weaponskins/b73d7b16-4652-bc5b-5c4c-068aabb19d0a/displayicon.png'
  },
  champions_2026_phantom: {
    id: 'val_champions_2026_phantom',
    name: 'Champions 2026 Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'knife',
    basePrice: 1573,
    image: 'https://media.valorant-api.com/weaponskins/74789f33-4632-8052-96d7-258538721a32/displayicon.png'
  },

  // KIRMIZI (Exclusive / Red)
  kuronami_vandal: {
    id: 'val_kuronami_vandal',
    name: 'Kuronami Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 480,
    image: 'https://media.valorant-api.com/weaponskins/d8d5d7a1-4d81-8560-54bc-0692ab40f69b/displayicon.png'
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

  // DÜŞÜK KADEME SKİNLER (Select / Deluxe)
  smite_classic: {
    id: 'val_smite_classic',
    name: 'Smite Classic',
    weapon: 'Classic',
    game: 'val',
    rarity: 'select',
    basePrice: 1.2,
    image: 'https://media.valorant-api.com/weaponskins/22fdc42d-4ad6-2bec-8033-8a8bdf178826/displayicon.png'
  },
  luxe_ghost: {
    id: 'val_luxe_ghost',
    name: 'Luxe Ghost',
    weapon: 'Ghost',
    game: 'val',
    rarity: 'select',
    basePrice: 1.8,
    image: 'https://media.valorant-api.com/weaponskins/cb98b0d6-4e26-973c-c10d-a38637d04b65/displayicon.png'
  },
  infantry_operator: {
    id: 'val_infantry_operator',
    name: 'Infantry Operator',
    weapon: 'Operator',
    game: 'val',
    rarity: 'select',
    basePrice: 2.5,
    image: 'https://media.valorant-api.com/weaponskins/341ef273-43fb-7911-71e8-50adada4cee1/displayicon.png'
  },
  convex_judge: {
    id: 'val_convex_judge',
    name: 'Convex Judge',
    weapon: 'Judge',
    game: 'val',
    rarity: 'select',
    basePrice: 1.6,
    image: 'https://media.valorant-api.com/weaponskins/03751fa0-46db-0df3-b8cb-99adf373ecda/displayicon.png'
  },
  schema_stinger: {
    id: 'val_schema_stinger',
    name: 'Schema Stinger',
    weapon: 'Stinger',
    game: 'val',
    rarity: 'select',
    basePrice: 1.5,
    image: 'https://media.valorant-api.com/weaponskins/46c8b165-4ba5-d42c-79e9-4fba8951ca48/displayicon.png'
  },
  sensation_vandal: {
    id: 'val_sensation_vandal',
    name: 'Sensation Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'select',
    basePrice: 3.0,
    image: 'https://media.valorant-api.com/weaponskins/72c1e90b-40ca-4304-02eb-28bb2aea4ed2/displayicon.png'
  },
  endeavour_bulldog: {
    id: 'val_endeavour_bulldog',
    name: 'Endeavour Bulldog',
    weapon: 'Bulldog',
    game: 'val',
    rarity: 'select',
    basePrice: 1.8,
    image: 'https://media.valorant-api.com/weaponskins/3f8be578-4e47-8afd-1e6c-cb9bb326e8b5/displayicon.png'
  },
  altitude_odin: {
    id: 'val_altitude_odin',
    name: 'Altitude Odin',
    weapon: 'Odin',
    game: 'val',
    rarity: 'select',
    basePrice: 2.2,
    image: 'https://media.valorant-api.com/weaponskins/89be9866-4807-6235-2a95-499cd23828df/displayicon.png'
  },

  // Yeni Eklenen Valorant Skinleri (Oni & Samuray / Kaos & Tekillik)
  onimaru_kunitsuna: {
    id: 'val_onimaru_kunitsuna',
    name: '★ Onimaru Kunitsuna Katana',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3500,
    image: 'https://media.valorant-api.com/weaponskins/4e7342a5-4820-2d79-a488-0fa51a4357f7/displayicon.png'
  },
  ruined_king_blade: {
    id: 'val_ruined_king_blade',
    name: '★ Mahvolmuş Kralın Kılıcı',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 2950,
    image: 'https://media.valorant-api.com/weaponskins/b1e9530d-4618-4f2e-1b75-f1a90c91b19e/displayicon.png'
  },
  oni_vandal: {
    id: 'val_oni_vandal',
    name: 'Oni Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 450,
    image: 'https://media.valorant-api.com/weaponskins/7156c2ee-41fc-f8f4-d457-ebb287965c08/displayicon.png'
  },
  oni_phantom: {
    id: 'val_oni_phantom',
    name: 'Oni Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 450,
    image: 'https://media.valorant-api.com/weaponskins/36791b03-452d-8dad-0091-898cc28d2196/displayicon.png'
  },
  ion_vandal: {
    id: 'val_ion_vandal',
    name: 'İyon Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 420,
    image: 'https://media.valorant-api.com/weaponskins/596ce51d-40e3-dc21-b02d-b08d070a7883/displayicon.png'
  },
  ruination_phantom: {
    id: 'val_ruination_phantom',
    name: 'Mahvolmuş Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'premium',
    basePrice: 390,
    image: 'https://media.valorant-api.com/weaponskins/5b43d27b-419c-f2bc-53fe-d7829dad46b3/displayicon.png'
  },
  sovereign_ghost: {
    id: 'val_sovereign_ghost',
    name: 'Asil Ruh Ghost',
    weapon: 'Ghost',
    game: 'val',
    rarity: 'deluxe',
    basePrice: 120,
    image: 'https://media.valorant-api.com/weaponskins/a9890917-41ea-eb55-47e7-ee990a87fa4e/displayicon.png'
  },
  sakura_vandal: {
    id: 'val_sakura_vandal',
    name: 'Sakura Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'deluxe',
    basePrice: 60,
    image: 'https://media.valorant-api.com/weaponskins/f946ef5c-46ab-e146-a712-1d99a1651356/displayicon.png'
  },
  sakura_classic: {
    id: 'val_sakura_classic',
    name: 'Sakura Classic',
    weapon: 'Classic',
    game: 'val',
    rarity: 'select',
    basePrice: 18,
    image: 'https://media.valorant-api.com/weaponskins/6ba7a7a0-4057-4d5c-7c98-579f232db298/displayicon.png'
  },
  kohaku_classic: {
    id: 'val_kohaku_classic',
    name: 'Kohaku & Matsuba Classic',
    weapon: 'Classic',
    game: 'val',
    rarity: 'select',
    basePrice: 12,
    image: 'https://media.valorant-api.com/weaponskins/be7cf362-4993-b9e4-9ba9-cdac6c99b8e4/displayicon.png'
  },
  blade_of_chaos: {
    id: 'val_blade_of_chaos',
    name: '★ Kaosun Kılıcı',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3600,
    image: 'https://media.valorant-api.com/weaponskins/6e0496c1-4c98-7abe-16c4-7ca3653e5cd8/displayicon.png'
  },
  singularity_butterfly: {
    id: 'val_singularity_butterfly',
    name: '★ Singularity Kelebek Bıçağı',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3400,
    image: 'https://media.valorant-api.com/weaponskins/a114e83d-4662-6a6f-4717-bfb82fd9b8e0/displayicon.png'
  },
  rgx_firefly: {
    id: 'val_rgx_firefly',
    name: '★ RGX 11z Pro Firefly Kelebek',
    weapon: 'Melee',
    game: 'val',
    rarity: 'knife',
    basePrice: 3200,
    image: 'https://media.valorant-api.com/weaponskins/03de6b1a-4497-72e8-ae0c-2984b2e7e2b9/displayicon.png'
  },
  prelude_vandal: {
    id: 'val_prelude_vandal',
    name: 'Kaosun Başlangıcı Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 490,
    image: 'https://media.valorant-api.com/weaponskins/522a264e-4ca7-adb0-6cf1-28b2ef938727/displayicon.png'
  },
  singularity_vandal: {
    id: 'val_singularity_vandal',
    name: 'Singularity Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 470,
    image: 'https://media.valorant-api.com/weaponskins/d6c7ff28-467e-bb3f-3c0c-c5b9445e55ca/displayicon.png'
  },
  rgx_vandal: {
    id: 'val_rgx_vandal',
    name: 'RGX 11z Pro Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 460,
    image: 'https://media.valorant-api.com/weaponskins/e5490f71-455b-74ad-f762-f5a876d4dff9/displayicon.png'
  },
  singularity_phantom: {
    id: 'val_singularity_phantom',
    name: 'Singularity Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'exclusive',
    basePrice: 450,
    image: 'https://media.valorant-api.com/weaponskins/5eec4ce6-443d-e9b5-4c5b-2b967d426bd3/displayicon.png'
  },
  sentinels_vandal: {
    id: 'val_sentinels_vandal',
    name: 'Işığın Muhafızı Vandal',
    weapon: 'Vandal',
    game: 'val',
    rarity: 'premium',
    basePrice: 380,
    image: 'https://media.valorant-api.com/weaponskins/e8df3725-40de-b8ec-77bd-62a989685a85/displayicon.png'
  },
  minima_phantom: {
    id: 'val_minima_phantom',
    name: 'Minima Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'deluxe',
    basePrice: 50,
    image: 'https://media.valorant-api.com/weaponskins/2e3538f1-450f-cfe6-f93e-73862cd39314/displayicon.png'
  },
  prism_phantom: {
    id: 'val_prism_phantom',
    name: 'Prizma Phantom',
    weapon: 'Phantom',
    game: 'val',
    rarity: 'deluxe',
    basePrice: 40,
    image: 'https://media.valorant-api.com/weaponskins/6586a7db-4041-6a29-f37c-d6817657caa5/displayicon.png'
  },
  reverie_classic: {
    id: 'val_reverie_classic',
    name: 'Hülya Classic',
    weapon: 'Classic',
    game: 'val',
    rarity: 'select',
    basePrice: 14,
    image: 'https://media.valorant-api.com/weaponskins/8bc021a4-4832-300e-2844-afa3d1d9465f/displayicon.png'
  }
};

// CASES DEFINITION
const CASES = [
  // ==========================================
  // === CS2 CASES (REAL OFFICIAL NAMES & ICONS)
  // ==========================================
  {
    id: 'cs2_weapon_case_1',
    name: 'CS:GO Silah Kasası #1',
    subtitle: 'Tarihin En Değerli Kasası (+%28 Fiyat)',
    game: 'cs2',
    cost: 20,
    icon: 'fa-box-open',
    image: 'https://community.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bji61XxRCKg0MSz_nUDvPb-OPFvdKTFDzbAkbp16bY5Gn6wkx9ysj7Xntf9IC6WZgA-Sswnnj45WXo',
    items: [
      // 1 SARI (Gold / Knife) - %28 Artırılmış
      { skin: CS2_SKINS.karambit_ch, weight: 0.4 },
      // 1 KIRMIZI (Covert / Red) - %28 Artırılmış
      { skin: CS2_SKINS.awp_lightning_strike, weight: 1.6 },
      // 2 PEMBE (Classified / Pink) - %28 Artırılmış
      { skin: CS2_SKINS.ak47_case_hardened, weight: 5.0 },
      { skin: CS2_SKINS.deagle_hypnotic, weight: 8.0 },
      // 2 MOR (Restricted / Purple) - %28 Artırılmış
      { skin: CS2_SKINS.glock_dragon_tattoo, weight: 15.0 },
      { skin: CS2_SKINS.m4a1s_dark_water, weight: 18.0 },
      // 3 MAVİ (Mil-Spec / Blue) - %28 Artırılmış
      { skin: CS2_SKINS.usps_dark_water, weight: 22.0 },
      { skin: CS2_SKINS.aug_wings, weight: 15.0 },
      { skin: CS2_SKINS.sg553_ultraviolet, weight: 15.0 }
    ]
  },
  {
    id: 'cs2_kilowatt',
    name: 'Kilowatt Kasası',
    subtitle: 'İlk Resmi CS2 Kasası',
    game: 'cs2',
    cost: 1,
    icon: 'fa-bolt',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnEVvqf_a6VoIfGSXz7Hlbwg57QwSS_mxhl15jiGyN37c3_GZw91W8BwRflK7EfKsa2sfw',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: CS2_SKINS.bfk_fade, weight: 0.35 },
      // 2 KIRMIZI (Covert / Red)
      { skin: CS2_SKINS.dlore, weight: 1.5 },
      { skin: CS2_SKINS.fire_serpent, weight: 3.5 },
      // PEMBE & MOR
      { skin: CS2_SKINS.case_hardened, weight: 9.0 },
      { skin: CS2_SKINS.redline_ak, weight: 20.0 },
      { skin: CS2_SKINS.slate, weight: 30.0 },
      // 3 MAVİ (Mil-Spec)
      { skin: CS2_SKINS.high_beam, weight: 12.0 },
      { skin: CS2_SKINS.ak47_uncharted, weight: 12.0 },
      { skin: CS2_SKINS.m4a4_magnesium, weight: 11.65 }
    ]
  },
  {
    id: 'cs2_dreams_nightmares',
    name: 'Rüyalar ve Kâbuslar Kasası',
    subtitle: 'Doppler Bıçak Koleksiyonu',
    game: 'cs2',
    cost: 1,
    icon: 'fa-moon',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnIV7Kb5OaU-JqfHDzXFle0u4LY8Gy_kkRgisGzcm4v4J3vDOAQmDMdyRvlK7EcmeCU3yw',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: CS2_SKINS.bfk_doppler, weight: 0.4 },
      // 2 KIRMIZI (Covert / Red)
      { skin: CS2_SKINS.asiimov, weight: 4.5 },
      { skin: CS2_SKINS.kill_confirmed, weight: 5.5 },
      // PEMBE & MOR
      { skin: CS2_SKINS.water_elemental, weight: 15.0 },
      { skin: CS2_SKINS.slate, weight: 20.0 },
      { skin: CS2_SKINS.atheris, weight: 18.0 },
      // 3 MAVİ (Mil-Spec)
      { skin: CS2_SKINS.cortex, weight: 12.2 },
      { skin: CS2_SKINS.awp_capillary, weight: 12.2 },
      { skin: CS2_SKINS.mac10_ensnared, weight: 12.2 }
    ]
  },
  {
    id: 'cs2_revolution',
    name: 'Devrim Kasası',
    subtitle: 'M4A4 Howl & Printstream',
    game: 'cs2',
    cost: 1,
    icon: 'fa-fire',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnAVvfb6aqduc_TFVjTCxbx05OU4S3jilE9w4DzRnImtIy2Sa1JzDJEhRPlK7EcO4U8gfA',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: CS2_SKINS.karambit_fade, weight: 0.35 },
      // 2 KIRMIZI (Covert / Red)
      { skin: CS2_SKINS.howl, weight: 1.5 },
      { skin: CS2_SKINS.printstream_deagle, weight: 3.5 },
      // PEMBE & MOR
      { skin: CS2_SKINS.case_hardened, weight: 9.0 },
      { skin: CS2_SKINS.redline_ak, weight: 22.0 },
      // 3 MAVİ (Mil-Spec)
      { skin: CS2_SKINS.cortex, weight: 21.2 },
      { skin: CS2_SKINS.high_beam, weight: 21.2 },
      { skin: CS2_SKINS.ak47_elite_build, weight: 21.25 }
    ]
  },
  {
    id: 'cs2_recoil',
    name: 'Geri Tepme Kasası',
    subtitle: 'M9 Bayonet Lore & Kill Confirmed',
    game: 'cs2',
    cost: 1,
    icon: 'fa-crosshairs',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnMVu6b-avA-JqSSCjSWwuhz47U9TCzlxh9yt2WGnNqgIi-fbgUkWMNxFPlK7EdIJF6a2Q',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: CS2_SKINS.m9_lore, weight: 0.45 },
      // 2 KIRMIZI (Covert / Red)
      { skin: CS2_SKINS.kill_confirmed, weight: 4.5 },
      { skin: CS2_SKINS.printstream_m4, weight: 5.0 },
      // PEMBE & MOR
      { skin: CS2_SKINS.water_elemental, weight: 16.0 },
      { skin: CS2_SKINS.slate, weight: 35.0 },
      // 3 MAVİ (Mil-Spec)
      { skin: CS2_SKINS.cortex, weight: 13.0 },
      { skin: CS2_SKINS.glock_polymer, weight: 13.0 },
      { skin: CS2_SKINS.m4a4_magnesium, weight: 13.05 }
    ]
  },
  {
    id: 'cs2_chroma',
    name: 'Kroma Kasası',
    subtitle: 'Karambit Doppler & Vulcan',
    game: 'cs2',
    cost: 1,
    icon: 'fa-cube',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_fq2wP7qr6bqI5cvHDCzfBlbcv57JqF3zrxRkj4W6Dwo34dy6QPQAoC5ZyW6dU5cxvklfG',
    items: [
      { skin: CS2_SKINS.karambit_doppler, weight: 0.4 },
      { skin: CS2_SKINS.ak47_vulcan, weight: 3.5 },
      { skin: CS2_SKINS.m4a1s_cyrex, weight: 4.5 },
      { skin: CS2_SKINS.awp_hyper_beast, weight: 9.0 },
      { skin: CS2_SKINS.usps_neonoir, weight: 14.0 },
      { skin: CS2_SKINS.ssg_dragonfire, weight: 20.0 },
      { skin: CS2_SKINS.glock_vogue, weight: 22.0 },
      { skin: CS2_SKINS.m4a4_magnesium, weight: 26.6 }
    ]
  },
  {
    id: 'cs2_clutch_prisma',
    name: 'Prizma & Kavrama Kasası',
    subtitle: 'Butterfly Marble Fade & Bloodsport',
    game: 'cs2',
    cost: 1,
    icon: 'fa-gem',
    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_fr3AV6aD8O6BpdKKQVmPEwr1zs-c8Tnngl09w52zTmY2sc3jBag8jXpohE_lK7Ede7E2Kfw',
    items: [
      { skin: CS2_SKINS.bfk_marble_fade, weight: 0.35 },
      { skin: CS2_SKINS.ak47_bloodsport, weight: 3.5 },
      { skin: CS2_SKINS.m4a4_emperor, weight: 4.0 },
      { skin: CS2_SKINS.awp_wildfire, weight: 7.0 },
      { skin: CS2_SKINS.deagle_code_red, weight: 11.0 },
      { skin: CS2_SKINS.deagle_ocean_drive, weight: 18.0 },
      { skin: CS2_SKINS.m4a4_in_living_color, weight: 22.0 },
      { skin: CS2_SKINS.glock_polymer, weight: 34.15 }
    ]
  },

  // ==========================================
  // === VALORANT CASES
  // ==========================================
  // 1. ÖZEL CHAMPIONS KASASI — Sadece gerçek Champions skinleri, yıl bazlı nadirlik
  {
    id: 'val_champions_vault',
    name: 'Champions Kasası',
    subtitle: '2021-2026 Yıllarına Özel Champions Koleksiyonu',
    game: 'val',
    cost: 100,
    icon: 'fa-trophy',
    image: 'https://media.valorant-api.com/weaponskins/1ea64c8d-43c4-fce8-7354-01bdd6c0ee17/displayicon.png',
    items: [
      // 2021 — SARI (Knife) — Vandal + Karambit (gerçek)
      { skin: { id: 'val_champs2021_vandal', name: 'Champions 2021 Vandal', weapon: 'Vandal', game: 'val', rarity: 'knife', basePrice: 22000, image: 'https://media.valorant-api.com/weaponskins/9bf19b77-4b33-7203-9f2c-16932970622f/displayicon.png' }, weight: 0.5 },
      { skin: { id: 'val_champs2021_knife',  name: 'Champions 2021 Karambit', weapon: 'Melee', game: 'val', rarity: 'knife', basePrice: 28000, image: 'https://media.valorant-api.com/weaponskins/1ea64c8d-43c4-fce8-7354-01bdd6c0ee17/displayicon.png' }, weight: 0.3 },
      // 2022 — KIRMIZI (Exclusive) — Phantom + Butterfly Knife (gerçek)
      { skin: { id: 'val_champs2022_phantom', name: 'Champions 2022 Phantom', weapon: 'Phantom', game: 'val', rarity: 'exclusive', basePrice: 14000, image: 'https://media.valorant-api.com/weaponskins/8c72ae0b-4357-1a75-ad62-fbaec7b64f92/displayicon.png' }, weight: 1.5 },
      { skin: { id: 'val_champs2022_knife',   name: 'Champions 2022 Butterfly Knife', weapon: 'Melee', game: 'val', rarity: 'exclusive', basePrice: 18000, image: 'https://media.valorant-api.com/weaponskins/6946cd0e-4e4a-ec4f-9238-dfb71715722b/displayicon.png' }, weight: 0.8 },
      // 2023 — PEMBE (Premium) — Vandal + Kunai (gerçek)
      { skin: { id: 'val_champs2023_vandal', name: 'Champions 2023 Vandal', weapon: 'Vandal', game: 'val', rarity: 'premium', basePrice: 8500, image: 'https://media.valorant-api.com/weaponskins/b0f65660-4c51-13b7-9d01-e29a1e2879b0/displayicon.png' }, weight: 5.0 },
      { skin: { id: 'val_champs2023_kunai',  name: 'Champions 2023 Kunai', weapon: 'Melee', game: 'val', rarity: 'premium', basePrice: 12000, image: 'https://media.valorant-api.com/weaponskins/27f27500-491c-32d4-1db6-1f85e479c103/displayicon.png' }, weight: 1.5 },
      // 2024 — KOYU MAVİ (Deluxe) — Phantom + Blade (gerçek)
      { skin: { id: 'val_champs2024_phantom', name: 'Champions 2024 Phantom', weapon: 'Phantom', game: 'val', rarity: 'deluxe', basePrice: 4200, image: 'https://media.valorant-api.com/weaponskins/cc1da8cd-452f-a007-0bf8-b68a471c3a6e/displayicon.png' }, weight: 12.0 },
      { skin: { id: 'val_champs2024_blade',   name: 'Champions 2024 Blade', weapon: 'Melee', game: 'val', rarity: 'deluxe', basePrice: 6500, image: 'https://media.valorant-api.com/weaponskins/30300aea-4d8a-320d-5cb0-0e8badc8d3df/displayicon.png' }, weight: 5.0 },
      // 2025 — MAVİ (Select) — Vandal + Butterfly Knife (gerçek)
      { skin: { id: 'val_champs2025_vandal', name: 'Champions 2025 Vandal', weapon: 'Vandal', game: 'val', rarity: 'select', basePrice: 1800, image: 'https://media.valorant-api.com/weaponskins/15cc1aab-432f-34d8-e0e8-d2925d54324b/displayicon.png' }, weight: 25.0 },
      { skin: { id: 'val_champs2025_knife',  name: 'Champions 2025 Butterfly Knife', weapon: 'Melee', game: 'val', rarity: 'select', basePrice: 3200, image: 'https://media.valorant-api.com/weaponskins/d901cc46-43c7-ebe8-9c5a-f7963f1a4db3/displayicon.png' }, weight: 10.0 },
      // 2026 — GRİ (Standard) — Phantom + Fan (gerçek)
      { skin: { id: 'val_champs2026_phantom', name: 'Champions 2026 Phantom', weapon: 'Phantom', game: 'val', rarity: 'standard', basePrice: 600, image: 'https://media.valorant-api.com/weaponskins/7b17cfbb-4d50-4908-9da5-18afb3a63d8a/displayicon.png' }, weight: 22.9 },
      { skin: { id: 'val_champs2026_fan',     name: 'Champions 2026 Fan', weapon: 'Melee', game: 'val', rarity: 'standard', basePrice: 1200, image: 'https://media.valorant-api.com/weaponskins/f401b55f-4b7d-c7a5-d698-a5ab0a54df39/displayicon.png' }, weight: 15.5 }
      // Toplam ağırlık: 0.5+0.3+1.5+0.8+5.0+1.5+12.0+5.0+25.0+10.0+22.9+15.5 = 100.0
    ]
  },
  {
    id: 'val_kuronami_edition',
    name: 'Kuronami Koleksiyon Kasası',
    subtitle: '1 Sarı, 2 Kırmızı',
    game: 'val',
    cost: 1,
    icon: 'fa-water',
    image: 'https://media.valorant-api.com/weaponskins/e37229ed-4ddf-5e7e-e744-8fba60fa2c37/displayicon.png',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: VAL_SKINS.kuronami_yaiba, weight: 0.4 },
      // 2 KIRMIZI (Exclusive / Red)
      { skin: VAL_SKINS.kuronami_vandal, weight: 3.5 },
      { skin: VAL_SKINS.elderflame_vandal, weight: 3.5 },
      // KALANLAR (Select / Deluxe)
      { skin: VAL_SKINS.smite_classic, weight: 25.0 },
      { skin: VAL_SKINS.luxe_ghost, weight: 22.0 },
      { skin: VAL_SKINS.infantry_operator, weight: 18.0 },
      { skin: VAL_SKINS.convex_judge, weight: 15.0 },
      { skin: VAL_SKINS.schema_stinger, weight: 12.6 }
    ]
  },
  {
    id: 'val_reaver_prime_edition',
    name: 'Yağmacı & Asil Kasası',
    subtitle: '1 Sarı, 2 Kırmızı',
    game: 'val',
    cost: 1,
    icon: 'fa-gem',
    image: 'https://media.valorant-api.com/weaponskins/b73d7b16-4652-bc5b-5c4c-068aabb19d0a/displayicon.png',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: VAL_SKINS.reaver_karambit, weight: 0.45 },
      // 2 KIRMIZI (Exclusive / Red)
      { skin: VAL_SKINS.reaver_vandal, weight: 3.5 },
      { skin: VAL_SKINS.prime_vandal, weight: 3.5 },
      // KALANLAR (Select / Deluxe)
      { skin: VAL_SKINS.endeavour_bulldog, weight: 25.0 },
      { skin: VAL_SKINS.luxe_ghost, weight: 22.0 },
      { skin: VAL_SKINS.convex_judge, weight: 18.0 },
      { skin: VAL_SKINS.schema_stinger, weight: 15.0 },
      { skin: VAL_SKINS.infantry_operator, weight: 12.55 }
    ]
  },
  {
    id: 'val_araxys_glitchpop',
    name: 'Araxys & Kaos Kasası',
    subtitle: '1 Sarı, 2 Kırmızı',
    game: 'val',
    cost: 1,
    icon: 'fa-crown',
    image: 'https://media.valorant-api.com/weaponskins/4c926aa9-4f26-bc80-c486-9b888333373f/displayicon.png',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: VAL_SKINS.araxys_bio_harvester, weight: 0.35 },
      // 2 KIRMIZI (Exclusive / Red)
      { skin: VAL_SKINS.araxys_vandal, weight: 3.5 },
      { skin: VAL_SKINS.glitchpop_vandal, weight: 3.5 },
      // KALANLAR (Select / Deluxe)
      { skin: VAL_SKINS.smite_classic, weight: 25.0 },
      { skin: VAL_SKINS.altitude_odin, weight: 22.0 },
      { skin: VAL_SKINS.sensation_vandal, weight: 18.0 },
      { skin: VAL_SKINS.infantry_operator, weight: 15.0 },
      { skin: VAL_SKINS.schema_stinger, weight: 12.65 }
    ]
  },
  {
    id: 'val_flaneur_edition',
    name: 'Flâneur & Yelpaze Kasası',
    subtitle: '1 Sarı, 2 Kırmızı',
    game: 'val',
    cost: 1,
    icon: 'fa-fan',
    image: 'https://media.valorant-api.com/weaponskins/1cd09fbd-43cb-a5f6-90fa-08994342d747/displayicon.png',
    items: [
      // 1 SARI (Gold / Knife)
      { skin: VAL_SKINS.ignite_fan, weight: 0.5 },
      // 2 KIRMIZI (Exclusive / Red)
      { skin: VAL_SKINS.kuronami_vandal, weight: 3.5 },
      { skin: VAL_SKINS.prime_vandal, weight: 3.5 },
      // KALANLAR (Select / Deluxe)
      { skin: VAL_SKINS.luxe_ghost, weight: 24.0 },
      { skin: VAL_SKINS.smite_classic, weight: 22.0 },
      { skin: VAL_SKINS.convex_judge, weight: 18.0 },
      { skin: VAL_SKINS.endeavour_bulldog, weight: 15.0 },
      { skin: VAL_SKINS.altitude_odin, weight: 13.5 }
    ]
  },
  {
    id: 'val_oni_samurai',
    name: 'Oni & Samuray Kasası',
    subtitle: 'Onimaru Kunitsuna & Oni Koleksiyonu',
    game: 'val',
    cost: 1,
    icon: 'fa-khanda',
    image: 'https://media.valorant-api.com/weaponskins/4e7342a5-4820-2d79-a488-0fa51a4357f7/displayicon.png',
    items: [
      { skin: VAL_SKINS.onimaru_kunitsuna, weight: 0.4 },
      { skin: VAL_SKINS.ruined_king_blade, weight: 0.5 },
      { skin: VAL_SKINS.oni_vandal, weight: 3.5 },
      { skin: VAL_SKINS.oni_phantom, weight: 3.5 },
      { skin: VAL_SKINS.ion_vandal, weight: 4.0 },
      { skin: VAL_SKINS.ruination_phantom, weight: 6.0 },
      { skin: VAL_SKINS.sovereign_ghost, weight: 15.0 },
      { skin: VAL_SKINS.sakura_vandal, weight: 20.0 },
      { skin: VAL_SKINS.sakura_classic, weight: 23.0 },
      { skin: VAL_SKINS.kohaku_classic, weight: 24.1 }
    ]
  },
  {
    id: 'val_chaos_singularity',
    name: 'Kaos & Tekillik Kasası',
    subtitle: 'Kaosun Başlangıcı & Singularity',
    game: 'val',
    cost: 1,
    icon: 'fa-meteor',
    image: 'https://media.valorant-api.com/weaponskins/6e0496c1-4c98-7abe-16c4-7ca3653e5cd8/displayicon.png',
    items: [
      { skin: VAL_SKINS.blade_of_chaos, weight: 0.35 },
      { skin: VAL_SKINS.singularity_butterfly, weight: 0.45 },
      { skin: VAL_SKINS.rgx_firefly, weight: 0.45 },
      { skin: VAL_SKINS.prelude_vandal, weight: 3.25 },
      { skin: VAL_SKINS.singularity_vandal, weight: 3.5 },
      { skin: VAL_SKINS.rgx_vandal, weight: 4.0 },
      { skin: VAL_SKINS.singularity_phantom, weight: 4.0 },
      { skin: VAL_SKINS.sentinels_vandal, weight: 6.0 },
      { skin: VAL_SKINS.minima_phantom, weight: 18.0 },
      { skin: VAL_SKINS.prism_phantom, weight: 25.0 },
      { skin: VAL_SKINS.reverie_classic, weight: 35.0 }
    ]
  }
];

module.exports = {
  CS2_SKINS,
  VAL_SKINS,
  CASES
};
