/* Preview-only mock of the FiveM NUI backend. Feeds the Sky shop with sample data
   so the redesigned UI can be inspected in a browser. NOT part of the deliverable. */
(function () {
  const CDN = 'https://cdn.sky-systems.net';
  const cfg = window.__SKY_DEFAULT_CONFIG;
  const lang = window.__SKY_DEFAULT_LANG;

  function item(name, img, price, pay, opts) {
    return Object.assign({
      name: name,
      label: name,
      img: img,
      price: price,
      pay: pay || 'coins',
      stock: -1,
      discount: 0,
      vipTier: 'none',
      category: 'category-1'
    }, opts || {});
  }

  const shops = {
    'shop-1': {
      'category-1': [
        item('Ignus', CDN + '/vehicles/ignus.png', 4500, 'coins', { stock: 3 }),
        item('Zentorno', CDN + '/vehicles/zentorno.png', 3800, 'coins', { discount: 15 }),
        item('Krieger', CDN + '/vehicles/krieger.png', 5200, 'coins', { vipTier: 'plus' }),
        item('Tyrant', CDN + '/vehicles/tyrant.png', 6100, 'coins'),
        item('Emerus', CDN + '/vehicles/emerus.png', 4900, 'coins', { stock: 1 }),
        item('Deveste', CDN + '/vehicles/deveste.png', 4200, 'coins')
      ],
      'category-2': [
        item('Speeder', CDN + '/vehicles/speeder.png', 2200, 'coins'),
        item('Toro', CDN + '/vehicles/toro.png', 2600, 'coins', { discount: 10 })
      ],
      'category-3': [
        item('Buzzard', CDN + '/vehicles/buzzard.png', 5000, 'coins'),
        item('Akula', CDN + '/vehicles/akula.png', 7000, 'coins', { vipTier: 'premium' })
      ]
    },
    'shop-2': {
      'category-1': [
        item('Starter Pack', CDN + '/items/t20pack.png', 1500, 'coins', { discount: 20 }),
        item('Pro Pack', CDN + '/items/case_5.png', 3000, 'coins'),
        item('Elite Pack', CDN + '/items/case_5.png', 5000, 'coins', { vipTier: 'plus' })
      ]
    },
    'shop-3': {
      'category-1': [
        item('Combat Pistol', CDN + '/weapons/combatpistol_7.png', 800, 'coins'),
        item('Carbine Rifle', CDN + '/weapons/combatpistol_7.png', 2400, 'coins', { stock: 5 }),
        item('Heavy Sniper', CDN + '/weapons/combatpistol_7.png', 4000, 'coins', { discount: 12 })
      ]
    },
    'shop-4': {
      'category-1': [
        item('First Aid Kit', CDN + '/items/first_aid_kit.png', 300, 'money'),
        item('Armor Plate', CDN + '/items/first_aid_kit.png', 500, 'money', { stock: 8 }),
        item('Repair Kit', CDN + '/items/first_aid_kit.png', 450, 'money')
      ]
    },
    'shop-5': {
      'category-1': [
        item('Neon Kit', CDN + '/items/case_5.png', 900, 'coins'),
        item('Custom Plate', CDN + '/items/case_5.png', 600, 'coins', { discount: 25 })
      ]
    }
  };

  function reward(label, img, chance, rarity) {
    return { name: label, label: label, img: img, chance: chance, rarity: rarity || 'common', pay: 'coins', price: 0 };
  }
  const caseRewards = [
    reward('Ignus', CDN + '/vehicles/ignus.png', 2, 'legendary'),
    reward('Zentorno', CDN + '/vehicles/zentorno.png', 8, 'super'),
    reward('Combat Pistol', CDN + '/weapons/combatpistol_7.png', 20, 'rare'),
    reward('First Aid Kit', CDN + '/items/first_aid_kit.png', 70, 'common')
  ];
  function caseDef(label, img, price) {
    return { label: label, img: img, pay: 'coins', price: price, stock: -1, rewards: caseRewards, category: 'category-1' };
  }
  const cases = {
    Categories: {
      'category-1': [
        caseDef('Mystery Case', CDN + '/items/case_5.png', 500),
        caseDef('Golden Case', CDN + '/items/case_5.png', 1200),
        caseDef('Elite Case', CDN + '/items/case_5.png', 2500)
      ],
      'category-2': [
        caseDef('Car Case', CDN + '/items/case_5.png', 3000),
        caseDef('Super Car Case', CDN + '/items/case_5.png', 6000)
      ]
    },
    BonusCase: { label: 'Free Case', img: CDN + '/items/case_5.png', pay: 'coins', price: 0, stock: -1, rewards: caseRewards }
  };

  const payload = {
    type: 'open',
    shop: shops,
    cases: cases,
    locales: lang,
    config: cfg,
    coins: 12500,
    spend: 120,
    scripts: [],
    playtimeXP: 150,
    playtimeXPTime: 3000,
    playtimeXPTimeLeft: 2050,
    vip: { tierId: 'plus', tierIndex: 1, expires: 0 },
    switch: undefined
  };

  function send() { window.postMessage(payload, '*'); }
  // The Vue module is deferred; retry until its message listener is attached & display=true.
  let tries = 0;
  const timer = setInterval(function () {
    tries++;
    send();
    if (tries > 12) clearInterval(timer);
  }, 250);
  window.addEventListener('load', send);
})();
