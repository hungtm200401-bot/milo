(function () {
  'use strict';

  const normalizeTerm = (t) =>
    String(t || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const MANIFEST = {
    // Grade 2: Units 1-12
    2: {
      1: {
        math: 'png', art: 'png', science: 'png', pe: 'png', 'p_e': 'png',
        computer_science: 'png', music: 'png', violin_practice: 'png', piano_practice: 'png',
        tired: 'png', bored: 'png', worried: 'png', difficult: 'png',
        easy: 'png', interesting: 'png', busy: 'png', important: 'png'
      },
      2: {
        crocodile: 'png', kangaroo: 'png', panda: 'png', snake: 'png',
        cheetah: 'png', seal: 'png', camel: 'png', whale: 'png',
        angry: 'png', smart: 'png', fat: 'png', thin: 'png',
        funny: 'png', lazy: 'png', dangerous: 'png', strong: 'png'
      },
      3: {
        cap: 'svg', flip_flops: 'svg', foggy: 'svg', hail: 'svg',
        lightning: 'svg', robe: 'svg', scarf: 'svg', sleet: 'svg',
        slippers: 'svg', sneakers: 'svg', storm: 'svg', sunglasses: 'svg',
        umbrella: 'svg', windy: 'svg', swimsuit: 'svg', gloves: 'svg'
      },
      4: {
        cap: 'png', flip_flops: 'png', foggy: 'png', hail: 'png',
        lightning: 'png', robe: 'png', scarf: 'png', sleet: 'png',
        slippers: 'png', sneakers: 'png', storm: 'png', sunglasses: 'png',
        swimsuit: 'png', umbrella: 'png', windy: 'png', gloves: 'png'
      },
      5: {
        belt: 'png', bracelet: 'png', earrings: 'png', necklace: 'png',
        ring: 'png', watch: 'png', handbag: 'png', backpack: 'png',
        cotton: 'png', leather: 'png', silk: 'png', wool: 'png',
        gold: 'png', silver: 'png', plastic: 'png', metal: 'png'
      },
      6: {
        bedroom: 'png', bathroom: 'png', kitchen: 'png', living_room: 'png',
        dining_room: 'png', garden: 'png', garage: 'png', balcony: 'png',
        armchair: 'png', bookcase: 'png', cupboard: 'png', sofa: 'png',
        table: 'png', wardrobe: 'png', lamp: 'png', mirror: 'png'
      },
      7: {
        bridge: 'png', castle: 'png', church: 'png', cinema: 'png',
        hospital: 'png', library: 'png', museum: 'png', park: 'png',
        police_station: 'png', post_office: 'png', restaurant: 'png', school: 'png',
        stadium: 'png', station: 'png', supermarket: 'png', theater: 'png'
      },
      8: {
        baker: 'png', builder: 'png', chef: 'png', dentist: 'png',
        doctor: 'png', farmer: 'png', firefighter: 'png', nurse: 'png',
        pilot: 'png', police_officer: 'png', singer: 'png', teacher: 'png',
        vet: 'png', waiter: 'png', driver: 'png', artist: 'png'
      },
      9: {
        apple: 'png', banana: 'png', bread: 'png', butter: 'png',
        cake: 'png', cheese: 'png', chicken: 'png', egg: 'png',
        fish: 'png', juice: 'png', meat: 'png', milk: 'png',
        rice: 'png', salad: 'png', sandwich: 'png', soup: 'png',
        tea: 'png', water: 'png', fruit: 'png', vegetables: 'png'
      },
      10: {
        active: 'png', bald: 'png', beard: 'png', blonde: 'png',
        chatty: 'png', creative: 'png', curly: 'png', eyebrows: 'png',
        grumpy: 'png', hardworking: 'png', helpful: 'png', kind: 'png',
        mustache: 'png', shy: 'png', straight: 'png', wavy: 'png'
      },
      11: {
        add: 'png', clue: 'png', entrance: 'png', equals: 'png',
        exit: 'png', hide: 'png', lost: 'png', maze: 'png',
        measure: 'png', minus: 'png', plus: 'png', problem: 'png',
        solve: 'png', subtract: 'png', sum: 'png', treasure_hunt: 'png'
      },
      12: {
        air_mattress: 'png', fins: 'png', grass: 'png', life_jacket: 'png',
        mask: 'png', picnic_basket: 'png', pool: 'png', sandcastle: 'png',
        sea: 'png', shell: 'png', shovel: 'png', snorkel: 'png',
        sunscreen: 'png', towel: 'png', waves: 'png', swimsuit: 'png'
      }
    },
    // Grade 3: Units 1-12
    3: {
      1: {
        below: 'png', above: 'png', beside: 'png', close_to: 'png',
        square: 'png', downtown: 'png', building: 'png', map: 'png',
        sign: 'png', cross: 'png', recreation_center: 'png', art_gallery: 'png',
        bridge: 'png', harbor: 'png', museum: 'png', theater: 'png',
        up: 'png', down: 'png', along: 'png', around: 'png'
      },
      2: {
        herbivore: 'png', carnivore: 'png', dinosaur: 'png', horn: 'png',
        tail: 'png', extinct: 'png', quick: 'png', careful: 'png',
        loud: 'png', dead: 'svg', pharaoh: 'svg', bury: 'svg',
        archeologist: 'svg', treasure: 'svg', thieves: 'svg', dig: 'svg',
        exhibit: 'svg', gold: 'svg', steps: 'svg', tomb: 'svg'
      },
      3: {
        campsite: 'png', blanket: 'svg', sleeping_bag: 'svg', camping_stove: 'svg',
        flashlight: 'svg', compass: 'svg', set_up_a_tent: 'svg', make_a_fire: 'svg',
        clean_up: 'svg', get_lost: 'svg', meet_new_people: 'svg', go_zip_lining: 'svg',
        go_rock_climbing: 'svg', beautiful: 'svg', go_kayaking: 'svg', heavy: 'svg',
        light: 'svg', unsafe: 'svg', waterfall: 'svg', coast: 'svg'
      },
      4: {
        giant: 'png', castle: 'png', bowl: 'png', coin: 'png',
        silver: 'png', enormous: 'png', furious: 'png', prince: 'png',
        princess: 'png', fairy_tale: 'png', king: 'png', queen: 'png',
        fierce: 'png', wife: 'png', hero: 'png', husband: 'png',
        myth: 'png', legend: 'png', search: 'png', hide: 'png'
      },
      5: {
        country: 'png', fresh_air: 'png', plant: 'png', insect: 'png',
        habitat: 'png', wildlife: 'png', pretty: 'png', full: 'png',
        rescue: 'png', throw_away: 'png', breathe: 'png', lungs: 'png',
        burn: 'png', coal: 'png', oil: 'png', fossil_fuel: 'png',
        electricity: 'png', power_plant: 'png', protect: 'png', gadgets: 'png'
      },
      6: {
        go_shopping: 'png', gift: 'png', stall: 'png', money: 'png',
        expensive: 'png', cheap: 'png', useful: 'png', colorful: 'png',
        choose: 'png', pay: 'png', quarter: 'png', half: 'png',
        hour: 'png', minute: 'png', second: 'png', century: 'png',
        decade: 'png', shadow: 'png', invent: 'png', tell_the_time: 'png'
      },
      7: {
        chess: 'png', band: 'png', musician: 'png', magazine: 'png',
        headphones: 'png', hang_out: 'png', afraid: 'png', famous: 'png',
        traditional: 'png', modern: 'png', orchestra: 'png', cello: 'png',
        drum: 'png', clarinet: 'png', saxophone: 'png', trombone: 'png',
        trumpet: 'svg', string: 'svg', dream: 'svg', exciting: 'svg'
      },
      8: {
        moon: 'png', bright: 'png', worried: 'png', cry: 'png',
        stick: 'png', owl: 'png', in_a_hurry: 'png', frightened: 'png',
        bump: 'png', rude: 'png', space_station: 'png', rocket: 'png',
        scientist: 'png', float: 'png', laboratory: 'png', launch: 'png',
        orbit: 'png', telescope: 'png', planet: 'png', spacesuit: 'png'
      },
      9: {
        roof: 'png', balcony: 'png', attic: 'png', view: 'png',
        wood: 'png', stone: 'png', sweep: 'png', build: 'png',
        steep: 'png', flat: 'png', narrow: 'png', wide: 'png',
        concrete: 'png', bricks: 'png', metal: 'png', plastic: 'png',
        move: 'png', stairs: 'png', elevator: 'png', basement: 'png'
      },
      10: {
        stomach: 'png', back: 'svg', neck: 'svg', shoulder: 'svg',
        fever: 'svg', bandage: 'svg', take_medicine: 'svg', rest: 'svg',
        pale: 'svg', sick: 'svg', muscles: 'svg', skin: 'svg',
        brain: 'svg', heart: 'svg', cold: 'svg', cough: 'svg',
        sneeze: 'svg', vaccination: 'svg', spread: 'svg', save_your_life: 'svg'
      },
      11: {
        south_pole: 'png', penguin: 'png', expedition: 'png', temperature: 'png',
        degrees: 'png', ice: 'png', continent: 'png', freezing: 'png',
        crack: 'png', deep: 'png', fur: 'png', octopus: 'png',
        hunt: 'png', krill: 'png', feather: 'png', layer: 'png',
        migrate: 'png', poisonous: 'png', wing: 'png', waterproof: 'png'
      },
      12: {
        lantern: 'png', parade: 'png', emperor: 'png', stilt_walker: 'png',
        annoying: 'png', hang: 'png', crowded: 'png', costume: 'png',
        furry: 'png', fireworks: 'png', eel: 'png', cathedral: 'png',
        bell: 'png', get_married: 'png', water_fight: 'png', spray: 'png',
        have_a_day_off: 'png', grown_up: 'png', sticky: 'png', coconut: 'png'
      }
    }
  };

  function getImagePath(grade, unit, term) {
    const g = Number(grade) || 2;
    const u = Number(unit) || 1;
    const norm = normalizeTerm(term);
    const ext = MANIFEST[g]?.[u]?.[norm] || 'png';
    return `assets/flashcards/grade${g}/g${g}_u${u}_${norm}.${ext}`;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderImageTag(grade, unit, term, fallbackIcon, className) {
    const src = getImagePath(grade, unit, term);
    const cls = className ? `vocab-real-img ${className}` : 'vocab-real-img';
    const alt = escapeHtml(term || 'vocabulary');
    const icon = escapeHtml(fallbackIcon || '🔤');
    return `<img src="${src}" alt="${alt}" class="${cls}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='${icon}';" />`;
  }

  window.MILO_VOCAB_IMAGES = {
    getImagePath,
    render: renderImageTag,
    normalizeTerm,
    manifest: MANIFEST
  };
})();
