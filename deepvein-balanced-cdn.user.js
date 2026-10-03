// ==UserScript==
// @name         Deep Vein Idle 自给成长与职业助手
// @namespace    local.deepvein.balanced
// @version      0.5.22
// @description  均衡、经验、主业与收菜Boss辅助四模式；自动换装、原生队列保留、任务与市场比价；默认暂停
// @updateURL    https://gcore.jsdelivr.net/gh/ljyoukong-cpu/deepvein-idle-helper@main/deepvein-balanced-cdn.meta.js
// @downloadURL  https://gcore.jsdelivr.net/gh/ljyoukong-cpu/deepvein-idle-helper@main/deepvein-balanced-cdn.user.js
// @match        https://deepveinidle.com/*
// @run-at       document-start
// @grant        none
// @sandbox      raw
// @noframes
// ==/UserScript==

(function () {
'use strict';
const SCRIPT_VERSION="0.5.22";
const SCRIPT_DISTRIBUTION="cdn";
const GAME_DATA={"client":"index-B8UTkOtA.js","sha256":"84543fadd7e2f007631259f63fc1b8dcce409544bd1b6d9a96e4ba33e76ea9ba","captured":"2026-10-03","compatibleClients":[{"client":"index-CmaDy2eO.js","sha256":"3313256315ac50a80561f28194c4277ab0552923bf28d96d7a4ddd5915456acf"},{"client":"index-DeoJ7Jh9.js","sha256":"70ef13fc889e4339d7c93e1ed023bf526576d777fce7a8713aaa6aadb627e289"},{"client":"index-IFlmlYxK.js","sha256":"693f2d43a8e6878a2368507daf1f24a35d917e4d8787c65c22ba8ea9ab12583a"},{"client":"index-BLSaPO15.js","sha256":"8990f3fc177963fdc84cd0b2ec4105470fa71a9edbced5753f5843980bf78d98"}],"protocol":3,"skills":["mining","fishing","woodcutting","farming","thieving","cooking","smithing","fletching","herblore","crafting","enhancing","melee","ranged","magic","defence","hitpoints"],"xp":{"journeyLevel":99,"baseXp":100,"growth":1.12,"beyondStep":0.1,"beyondGrowth":1.145,"speedPerLevelAboveRequirement":0.005},"tickMs":600,"jobs":[{"id":1,"name":"Copper","skill":"mining","group":"Ore","levelReq":1,"baseTicks":5,"xp":2,"inputs":[],"output":{"itemId":1,"qty":1}},{"id":2,"name":"Tin","skill":"mining","group":"Ore","levelReq":1,"baseTicks":5,"xp":3,"inputs":[],"output":{"itemId":2,"qty":1}},{"id":3,"name":"Iron","skill":"mining","group":"Ore","levelReq":15,"baseTicks":6,"xp":5,"inputs":[],"output":{"itemId":3,"qty":1},"bonus":{"itemId":100,"chance":0.0005}},{"id":4,"name":"Silver","skill":"mining","group":"Ore","levelReq":30,"baseTicks":7,"xp":9,"inputs":[],"output":{"itemId":4,"qty":1},"bonus":{"itemId":100,"chance":0.001}},{"id":5,"name":"Coal","skill":"mining","group":"Ore","levelReq":40,"baseTicks":8,"xp":14,"inputs":[],"output":{"itemId":5,"qty":1},"bonus":{"itemId":100,"chance":0.001}},{"id":6,"name":"Gold","skill":"mining","group":"Ore","levelReq":55,"baseTicks":9,"xp":22,"inputs":[],"output":{"itemId":6,"qty":1},"bonus":{"itemId":100,"chance":0.002}},{"id":7,"name":"Cobalt","skill":"mining","group":"Ore","levelReq":65,"baseTicks":11,"xp":37,"inputs":[],"output":{"itemId":7,"qty":1},"bonus":{"itemId":100,"chance":0.003}},{"id":8,"name":"Meteoric","skill":"mining","group":"Ore","levelReq":85,"baseTicks":13,"xp":59,"inputs":[],"output":{"itemId":8,"qty":1},"bonus":{"itemId":100,"chance":0.005}},{"id":21,"name":"Shrimp","skill":"fishing","group":"Fish","levelReq":1,"baseTicks":5,"xp":2,"inputs":[],"output":{"itemId":20,"qty":1}},{"id":22,"name":"Sardine","skill":"fishing","group":"Fish","levelReq":5,"baseTicks":5,"xp":3,"inputs":[],"output":{"itemId":21,"qty":1}},{"id":23,"name":"Trout","skill":"fishing","group":"Fish","levelReq":20,"baseTicks":6,"xp":7,"inputs":[],"output":{"itemId":22,"qty":1}},{"id":24,"name":"Salmon","skill":"fishing","group":"Fish","levelReq":30,"baseTicks":7,"xp":11,"inputs":[],"output":{"itemId":23,"qty":1}},{"id":25,"name":"Tuna","skill":"fishing","group":"Fish","levelReq":45,"baseTicks":8,"xp":17,"inputs":[],"output":{"itemId":24,"qty":1}},{"id":26,"name":"Lobster","skill":"fishing","group":"Fish","levelReq":60,"baseTicks":10,"xp":28,"inputs":[],"output":{"itemId":25,"qty":1}},{"id":27,"name":"Swordfish","skill":"fishing","group":"Fish","levelReq":75,"baseTicks":11,"xp":44,"inputs":[],"output":{"itemId":26,"qty":1}},{"id":28,"name":"Shark","skill":"fishing","group":"Fish","levelReq":90,"baseTicks":13,"xp":60,"inputs":[],"output":{"itemId":27,"qty":1}},{"id":30,"name":"Tree","skill":"woodcutting","group":"Wood","levelReq":1,"baseTicks":5,"xp":3,"inputs":[],"output":{"itemId":10,"qty":1},"bonus":{"itemId":160,"chance":0.0125}},{"id":31,"name":"Oak","skill":"woodcutting","group":"Wood","levelReq":15,"baseTicks":6,"xp":7,"inputs":[],"output":{"itemId":11,"qty":1},"bonus":{"itemId":161,"chance":0.008333333333333333}},{"id":32,"name":"Willow","skill":"woodcutting","group":"Wood","levelReq":30,"baseTicks":7,"xp":11,"inputs":[],"output":{"itemId":12,"qty":1},"bonus":{"itemId":162,"chance":0.005555555555555556}},{"id":33,"name":"Maple","skill":"woodcutting","group":"Wood","levelReq":45,"baseTicks":8,"xp":18,"inputs":[],"output":{"itemId":13,"qty":1},"bonus":{"itemId":163,"chance":0.0038461538461538464}},{"id":34,"name":"Yew","skill":"woodcutting","group":"Wood","levelReq":60,"baseTicks":10,"xp":29,"inputs":[],"output":{"itemId":14,"qty":1},"bonus":{"itemId":164,"chance":0.002777777777777778}},{"id":35,"name":"Magic","skill":"woodcutting","group":"Wood","levelReq":75,"baseTicks":12,"xp":48,"inputs":[],"output":{"itemId":15,"qty":1},"bonus":{"itemId":165,"chance":0.0022222222222222222}},{"id":160,"name":"Potato","skill":"farming","group":"Crops","levelReq":1,"baseTicks":2,"xp":110,"inputs":[{"itemId":160,"qty":1}],"output":{"itemId":170,"qty":1},"grow":800},{"id":161,"name":"Glowcap","skill":"farming","group":"Crops","levelReq":15,"baseTicks":2,"xp":380,"inputs":[{"itemId":161,"qty":1}],"output":{"itemId":171,"qty":1},"grow":1500},{"id":162,"name":"Cave turnip","skill":"farming","group":"Crops","levelReq":30,"baseTicks":2,"xp":900,"inputs":[{"itemId":162,"qty":1}],"output":{"itemId":172,"qty":1},"grow":2500},{"id":163,"name":"Bitterroot","skill":"farming","group":"Crops","levelReq":45,"baseTicks":2,"xp":1900,"inputs":[{"itemId":163,"qty":1}],"output":{"itemId":173,"qty":1},"grow":4000},{"id":164,"name":"Voidmelon","skill":"farming","group":"Crops","levelReq":60,"baseTicks":2,"xp":3800,"inputs":[{"itemId":164,"qty":1}],"output":{"itemId":174,"qty":1},"grow":6000},{"id":165,"name":"Ember pepper","skill":"farming","group":"Crops","levelReq":75,"baseTicks":2,"xp":6500,"inputs":[{"itemId":165,"qty":1}],"output":{"itemId":175,"qty":1},"grow":9000},{"id":41,"name":"Bronze bar","skill":"smithing","group":"Bars","levelReq":1,"baseTicks":4,"xp":6,"inputs":[{"itemId":1,"qty":1},{"itemId":2,"qty":1}],"output":{"itemId":40,"qty":1}},{"id":42,"name":"Iron bar","skill":"smithing","group":"Bars","levelReq":15,"baseTicks":4,"xp":8,"inputs":[{"itemId":3,"qty":1}],"output":{"itemId":41,"qty":1}},{"id":43,"name":"Steel bar","skill":"smithing","group":"Bars","levelReq":30,"baseTicks":4,"xp":35,"inputs":[{"itemId":3,"qty":1},{"itemId":5,"qty":2}],"output":{"itemId":42,"qty":1}},{"id":44,"name":"Cobalt bar","skill":"smithing","group":"Bars","levelReq":60,"baseTicks":4,"xp":108,"inputs":[{"itemId":7,"qty":1},{"itemId":5,"qty":3}],"output":{"itemId":43,"qty":1}},{"id":45,"name":"Meteoric bar","skill":"smithing","group":"Bars","levelReq":85,"baseTicks":4,"xp":253,"inputs":[{"itemId":8,"qty":1},{"itemId":5,"qty":4}],"output":{"itemId":44,"qty":1}},{"id":51,"name":"Bronze pickaxe","skill":"smithing","group":"Pickaxes","levelReq":1,"baseTicks":5,"xp":17,"inputs":[{"itemId":40,"qty":2}],"output":{"itemId":80,"qty":1}},{"id":52,"name":"Iron pickaxe","skill":"smithing","group":"Pickaxes","levelReq":15,"baseTicks":5,"xp":27,"inputs":[{"itemId":41,"qty":2}],"output":{"itemId":81,"qty":1}},{"id":53,"name":"Steel pickaxe","skill":"smithing","group":"Pickaxes","levelReq":30,"baseTicks":5,"xp":83,"inputs":[{"itemId":42,"qty":2}],"output":{"itemId":82,"qty":1}},{"id":54,"name":"Cobalt pickaxe","skill":"smithing","group":"Pickaxes","levelReq":60,"baseTicks":5,"xp":240,"inputs":[{"itemId":43,"qty":2}],"output":{"itemId":83,"qty":1}},{"id":55,"name":"Meteoric pickaxe","skill":"smithing","group":"Pickaxes","levelReq":85,"baseTicks":5,"xp":552,"inputs":[{"itemId":44,"qty":2}],"output":{"itemId":84,"qty":1}},{"id":56,"name":"Bronze rod","skill":"fletching","group":"Rods","levelReq":1,"baseTicks":5,"xp":8,"inputs":[{"itemId":40,"qty":1},{"itemId":10,"qty":1}],"output":{"itemId":85,"qty":1}},{"id":57,"name":"Iron rod","skill":"fletching","group":"Rods","levelReq":15,"baseTicks":5,"xp":13,"inputs":[{"itemId":41,"qty":1},{"itemId":11,"qty":1}],"output":{"itemId":86,"qty":1}},{"id":58,"name":"Steel rod","skill":"fletching","group":"Rods","levelReq":30,"baseTicks":5,"xp":41,"inputs":[{"itemId":42,"qty":1},{"itemId":12,"qty":1}],"output":{"itemId":87,"qty":1}},{"id":59,"name":"Cobalt rod","skill":"fletching","group":"Rods","levelReq":60,"baseTicks":5,"xp":120,"inputs":[{"itemId":43,"qty":1},{"itemId":14,"qty":1}],"output":{"itemId":88,"qty":1}},{"id":60,"name":"Meteoric rod","skill":"fletching","group":"Rods","levelReq":85,"baseTicks":5,"xp":276,"inputs":[{"itemId":44,"qty":1},{"itemId":15,"qty":1}],"output":{"itemId":89,"qty":1}},{"id":308,"name":"Bronze pan","skill":"smithing","group":"Pans","levelReq":1,"baseTicks":5,"xp":8,"inputs":[{"itemId":40,"qty":1}],"output":{"itemId":360,"qty":1}},{"id":309,"name":"Iron pan","skill":"smithing","group":"Pans","levelReq":15,"baseTicks":5,"xp":13,"inputs":[{"itemId":41,"qty":1}],"output":{"itemId":361,"qty":1}},{"id":310,"name":"Steel pan","skill":"smithing","group":"Pans","levelReq":30,"baseTicks":5,"xp":41,"inputs":[{"itemId":42,"qty":1}],"output":{"itemId":362,"qty":1}},{"id":311,"name":"Cobalt pan","skill":"smithing","group":"Pans","levelReq":60,"baseTicks":5,"xp":120,"inputs":[{"itemId":43,"qty":1}],"output":{"itemId":363,"qty":1}},{"id":312,"name":"Meteoric pan","skill":"smithing","group":"Pans","levelReq":85,"baseTicks":5,"xp":276,"inputs":[{"itemId":44,"qty":1}],"output":{"itemId":364,"qty":1}},{"id":313,"name":"Bronze hammer","skill":"smithing","group":"Hammers","levelReq":1,"baseTicks":5,"xp":17,"inputs":[{"itemId":40,"qty":2}],"output":{"itemId":365,"qty":1}},{"id":314,"name":"Iron hammer","skill":"smithing","group":"Hammers","levelReq":15,"baseTicks":5,"xp":27,"inputs":[{"itemId":41,"qty":2}],"output":{"itemId":366,"qty":1}},{"id":315,"name":"Steel hammer","skill":"smithing","group":"Hammers","levelReq":30,"baseTicks":5,"xp":83,"inputs":[{"itemId":42,"qty":2}],"output":{"itemId":367,"qty":1}},{"id":316,"name":"Cobalt hammer","skill":"smithing","group":"Hammers","levelReq":60,"baseTicks":5,"xp":240,"inputs":[{"itemId":43,"qty":2}],"output":{"itemId":368,"qty":1}},{"id":317,"name":"Meteoric hammer","skill":"smithing","group":"Hammers","levelReq":85,"baseTicks":5,"xp":552,"inputs":[{"itemId":44,"qty":2}],"output":{"itemId":369,"qty":1}},{"id":318,"name":"Bronze knife","skill":"smithing","group":"Knives","levelReq":1,"baseTicks":5,"xp":8,"inputs":[{"itemId":40,"qty":1}],"output":{"itemId":370,"qty":1}},{"id":319,"name":"Iron knife","skill":"smithing","group":"Knives","levelReq":15,"baseTicks":5,"xp":13,"inputs":[{"itemId":41,"qty":1}],"output":{"itemId":371,"qty":1}},{"id":320,"name":"Steel knife","skill":"smithing","group":"Knives","levelReq":30,"baseTicks":5,"xp":41,"inputs":[{"itemId":42,"qty":1}],"output":{"itemId":372,"qty":1}},{"id":321,"name":"Cobalt knife","skill":"smithing","group":"Knives","levelReq":60,"baseTicks":5,"xp":120,"inputs":[{"itemId":43,"qty":1}],"output":{"itemId":373,"qty":1}},{"id":322,"name":"Meteoric knife","skill":"smithing","group":"Knives","levelReq":85,"baseTicks":5,"xp":276,"inputs":[{"itemId":44,"qty":1}],"output":{"itemId":374,"qty":1}},{"id":323,"name":"Bronze needle","skill":"crafting","group":"Needles","levelReq":1,"baseTicks":5,"xp":8,"inputs":[{"itemId":40,"qty":1}],"output":{"itemId":375,"qty":1}},{"id":324,"name":"Iron needle","skill":"crafting","group":"Needles","levelReq":15,"baseTicks":5,"xp":13,"inputs":[{"itemId":41,"qty":1}],"output":{"itemId":376,"qty":1}},{"id":325,"name":"Steel needle","skill":"crafting","group":"Needles","levelReq":30,"baseTicks":5,"xp":41,"inputs":[{"itemId":42,"qty":1}],"output":{"itemId":377,"qty":1}},{"id":326,"name":"Cobalt needle","skill":"crafting","group":"Needles","levelReq":60,"baseTicks":5,"xp":120,"inputs":[{"itemId":43,"qty":1}],"output":{"itemId":378,"qty":1}},{"id":327,"name":"Meteoric needle","skill":"crafting","group":"Needles","levelReq":85,"baseTicks":5,"xp":276,"inputs":[{"itemId":44,"qty":1}],"output":{"itemId":379,"qty":1}},{"id":328,"name":"Bronze mortar","skill":"crafting","group":"Mortars","levelReq":1,"baseTicks":5,"xp":17,"inputs":[{"itemId":40,"qty":2}],"output":{"itemId":380,"qty":1}},{"id":329,"name":"Iron mortar","skill":"crafting","group":"Mortars","levelReq":15,"baseTicks":5,"xp":27,"inputs":[{"itemId":41,"qty":2}],"output":{"itemId":381,"qty":1}},{"id":330,"name":"Steel mortar","skill":"crafting","group":"Mortars","levelReq":30,"baseTicks":5,"xp":83,"inputs":[{"itemId":42,"qty":2}],"output":{"itemId":382,"qty":1}},{"id":331,"name":"Cobalt mortar","skill":"crafting","group":"Mortars","levelReq":60,"baseTicks":5,"xp":240,"inputs":[{"itemId":43,"qty":2}],"output":{"itemId":383,"qty":1}},{"id":332,"name":"Meteoric mortar","skill":"crafting","group":"Mortars","levelReq":85,"baseTicks":5,"xp":552,"inputs":[{"itemId":44,"qty":2}],"output":{"itemId":384,"qty":1}},{"id":333,"name":"Bronze hoe","skill":"fletching","group":"Hoes","levelReq":1,"baseTicks":5,"xp":17,"inputs":[{"itemId":40,"qty":1},{"itemId":10,"qty":2}],"output":{"itemId":385,"qty":1}},{"id":334,"name":"Iron hoe","skill":"fletching","group":"Hoes","levelReq":15,"baseTicks":5,"xp":27,"inputs":[{"itemId":41,"qty":1},{"itemId":11,"qty":2}],"output":{"itemId":386,"qty":1}},{"id":335,"name":"Steel hoe","skill":"fletching","group":"Hoes","levelReq":30,"baseTicks":5,"xp":83,"inputs":[{"itemId":42,"qty":1},{"itemId":12,"qty":2}],"output":{"itemId":387,"qty":1}},{"id":336,"name":"Cobalt hoe","skill":"fletching","group":"Hoes","levelReq":60,"baseTicks":5,"xp":240,"inputs":[{"itemId":43,"qty":1},{"itemId":14,"qty":2}],"output":{"itemId":388,"qty":1}},{"id":337,"name":"Meteoric hoe","skill":"fletching","group":"Hoes","levelReq":85,"baseTicks":5,"xp":552,"inputs":[{"itemId":44,"qty":1},{"itemId":15,"qty":2}],"output":{"itemId":389,"qty":1}},{"id":46,"name":"Bronze axe","skill":"smithing","group":"Axes","levelReq":1,"baseTicks":5,"xp":17,"inputs":[{"itemId":40,"qty":2}],"output":{"itemId":90,"qty":1}},{"id":47,"name":"Iron axe","skill":"smithing","group":"Axes","levelReq":15,"baseTicks":5,"xp":27,"inputs":[{"itemId":41,"qty":2}],"output":{"itemId":91,"qty":1}},{"id":48,"name":"Steel axe","skill":"smithing","group":"Axes","levelReq":30,"baseTicks":5,"xp":83,"inputs":[{"itemId":42,"qty":2}],"output":{"itemId":92,"qty":1}},{"id":49,"name":"Cobalt axe","skill":"smithing","group":"Axes","levelReq":60,"baseTicks":5,"xp":240,"inputs":[{"itemId":43,"qty":2}],"output":{"itemId":93,"qty":1}},{"id":50,"name":"Meteoric axe","skill":"smithing","group":"Axes","levelReq":85,"baseTicks":5,"xp":552,"inputs":[{"itemId":44,"qty":2}],"output":{"itemId":94,"qty":1}},{"id":61,"name":"Cook shrimp","skill":"cooking","group":"Food","levelReq":1,"baseTicks":4,"xp":4,"inputs":[{"itemId":20,"qty":1}],"output":{"itemId":60,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":26}},{"id":62,"name":"Cook sardine","skill":"cooking","group":"Food","levelReq":5,"baseTicks":4,"xp":5,"inputs":[{"itemId":21,"qty":1}],"output":{"itemId":61,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":30}},{"id":63,"name":"Cook trout","skill":"cooking","group":"Food","levelReq":20,"baseTicks":4,"xp":10,"inputs":[{"itemId":22,"qty":1}],"output":{"itemId":62,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":45}},{"id":64,"name":"Cook salmon","skill":"cooking","group":"Food","levelReq":30,"baseTicks":4,"xp":14,"inputs":[{"itemId":23,"qty":1}],"output":{"itemId":63,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":55}},{"id":65,"name":"Cook tuna","skill":"cooking","group":"Food","levelReq":45,"baseTicks":4,"xp":22,"inputs":[{"itemId":24,"qty":1}],"output":{"itemId":64,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":70}},{"id":66,"name":"Cook lobster","skill":"cooking","group":"Food","levelReq":60,"baseTicks":4,"xp":36,"inputs":[{"itemId":25,"qty":1}],"output":{"itemId":65,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":85}},{"id":67,"name":"Cook swordfish","skill":"cooking","group":"Food","levelReq":75,"baseTicks":4,"xp":59,"inputs":[{"itemId":26,"qty":1}],"output":{"itemId":66,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":100}},{"id":68,"name":"Cook shark","skill":"cooking","group":"Food","levelReq":90,"baseTicks":4,"xp":92,"inputs":[{"itemId":27,"qty":1}],"output":{"itemId":67,"qty":1},"burn":{"itemId":70,"chanceAtReq":0.3,"safeAtLevel":115}},{"id":110,"name":"Bronze blade","skill":"smithing","group":"Weapons","levelReq":1,"baseTicks":5,"xp":8,"inputs":[{"itemId":40,"qty":1}],"output":{"itemId":110,"qty":1}},{"id":111,"name":"Iron blade","skill":"smithing","group":"Weapons","levelReq":15,"baseTicks":5,"xp":13,"inputs":[{"itemId":41,"qty":1}],"output":{"itemId":111,"qty":1}},{"id":112,"name":"Steel blade","skill":"smithing","group":"Weapons","levelReq":30,"baseTicks":5,"xp":41,"inputs":[{"itemId":42,"qty":1}],"output":{"itemId":112,"qty":1}},{"id":113,"name":"Cobalt blade","skill":"smithing","group":"Weapons","levelReq":60,"baseTicks":5,"xp":120,"inputs":[{"itemId":43,"qty":1}],"output":{"itemId":113,"qty":1}},{"id":114,"name":"Meteoric blade","skill":"smithing","group":"Weapons","levelReq":85,"baseTicks":5,"xp":276,"inputs":[{"itemId":44,"qty":1}],"output":{"itemId":114,"qty":1}},{"id":338,"name":"Bronze greatsword","skill":"smithing","group":"Two-handers","levelReq":1,"baseTicks":5,"xp":17,"inputs":[{"itemId":40,"qty":2}],"output":{"itemId":390,"qty":1}},{"id":339,"name":"Iron greatsword","skill":"smithing","group":"Two-handers","levelReq":15,"baseTicks":5,"xp":27,"inputs":[{"itemId":41,"qty":2}],"output":{"itemId":391,"qty":1}},{"id":340,"name":"Steel greatsword","skill":"smithing","group":"Two-handers","levelReq":30,"baseTicks":5,"xp":83,"inputs":[{"itemId":42,"qty":2}],"output":{"itemId":392,"qty":1}},{"id":341,"name":"Cobalt greatsword","skill":"smithing","group":"Two-handers","levelReq":60,"baseTicks":5,"xp":240,"inputs":[{"itemId":43,"qty":2}],"output":{"itemId":393,"qty":1}},{"id":342,"name":"Meteoric greatsword","skill":"smithing","group":"Two-handers","levelReq":85,"baseTicks":5,"xp":552,"inputs":[{"itemId":44,"qty":2}],"output":{"itemId":394,"qty":1}},{"id":343,"name":"Colossus greatsword","skill":"smithing","group":"Two-handers","levelReq":99,"baseTicks":6,"xp":1350,"inputs":[{"itemId":44,"qty":2},{"itemId":252,"qty":3}],"output":{"itemId":395,"qty":1}},{"id":115,"name":"Bronze shield","skill":"smithing","group":"Shields","levelReq":1,"baseTicks":5,"xp":25,"inputs":[{"itemId":40,"qty":3}],"output":{"itemId":115,"qty":1}},{"id":116,"name":"Iron shield","skill":"smithing","group":"Shields","levelReq":15,"baseTicks":5,"xp":40,"inputs":[{"itemId":41,"qty":3}],"output":{"itemId":116,"qty":1}},{"id":117,"name":"Steel shield","skill":"smithing","group":"Shields","levelReq":30,"baseTicks":5,"xp":124,"inputs":[{"itemId":42,"qty":3}],"output":{"itemId":117,"qty":1}},{"id":118,"name":"Cobalt shield","skill":"smithing","group":"Shields","levelReq":60,"baseTicks":5,"xp":360,"inputs":[{"itemId":43,"qty":3}],"output":{"itemId":118,"qty":1}},{"id":119,"name":"Meteoric shield","skill":"smithing","group":"Shields","levelReq":85,"baseTicks":5,"xp":828,"inputs":[{"itemId":44,"qty":3}],"output":{"itemId":119,"qty":1}},{"id":120,"name":"Bronze helm","skill":"smithing","group":"Helmets","levelReq":1,"baseTicks":5,"xp":17,"inputs":[{"itemId":40,"qty":2}],"output":{"itemId":120,"qty":1}},{"id":121,"name":"Iron helm","skill":"smithing","group":"Helmets","levelReq":15,"baseTicks":5,"xp":27,"inputs":[{"itemId":41,"qty":2}],"output":{"itemId":121,"qty":1}},{"id":122,"name":"Steel helm","skill":"smithing","group":"Helmets","levelReq":30,"baseTicks":5,"xp":83,"inputs":[{"itemId":42,"qty":2}],"output":{"itemId":122,"qty":1}},{"id":123,"name":"Cobalt helm","skill":"smithing","group":"Helmets","levelReq":60,"baseTicks":5,"xp":240,"inputs":[{"itemId":43,"qty":2}],"output":{"itemId":123,"qty":1}},{"id":124,"name":"Meteoric helm","skill":"smithing","group":"Helmets","levelReq":85,"baseTicks":5,"xp":552,"inputs":[{"itemId":44,"qty":2}],"output":{"itemId":124,"qty":1}},{"id":125,"name":"Bronze plate","skill":"smithing","group":"Bodies","levelReq":1,"baseTicks":5,"xp":42,"inputs":[{"itemId":40,"qty":5}],"output":{"itemId":125,"qty":1}},{"id":126,"name":"Iron plate","skill":"smithing","group":"Bodies","levelReq":15,"baseTicks":5,"xp":67,"inputs":[{"itemId":41,"qty":5}],"output":{"itemId":126,"qty":1}},{"id":127,"name":"Steel plate","skill":"smithing","group":"Bodies","levelReq":30,"baseTicks":5,"xp":207,"inputs":[{"itemId":42,"qty":5}],"output":{"itemId":127,"qty":1}},{"id":128,"name":"Cobalt plate","skill":"smithing","group":"Bodies","levelReq":60,"baseTicks":5,"xp":600,"inputs":[{"itemId":43,"qty":5}],"output":{"itemId":128,"qty":1}},{"id":129,"name":"Meteoric plate","skill":"smithing","group":"Bodies","levelReq":85,"baseTicks":5,"xp":1380,"inputs":[{"itemId":44,"qty":5}],"output":{"itemId":129,"qty":1}},{"id":130,"name":"Bronze greaves","skill":"smithing","group":"Legs","levelReq":1,"baseTicks":5,"xp":34,"inputs":[{"itemId":40,"qty":4}],"output":{"itemId":130,"qty":1}},{"id":131,"name":"Iron greaves","skill":"smithing","group":"Legs","levelReq":15,"baseTicks":5,"xp":53,"inputs":[{"itemId":41,"qty":4}],"output":{"itemId":131,"qty":1}},{"id":132,"name":"Steel greaves","skill":"smithing","group":"Legs","levelReq":30,"baseTicks":5,"xp":165,"inputs":[{"itemId":42,"qty":4}],"output":{"itemId":132,"qty":1}},{"id":133,"name":"Cobalt greaves","skill":"smithing","group":"Legs","levelReq":60,"baseTicks":5,"xp":480,"inputs":[{"itemId":43,"qty":4}],"output":{"itemId":133,"qty":1}},{"id":134,"name":"Meteoric greaves","skill":"smithing","group":"Legs","levelReq":85,"baseTicks":5,"xp":1104,"inputs":[{"itemId":44,"qty":4}],"output":{"itemId":134,"qty":1}},{"id":301,"name":"Colossus blade","skill":"smithing","group":"Weapons","levelReq":99,"baseTicks":6,"xp":1900,"inputs":[{"itemId":44,"qty":3},{"itemId":252,"qty":2}],"output":{"itemId":350,"qty":1}},{"id":302,"name":"Colossus shield","skill":"smithing","group":"Shields","levelReq":99,"baseTicks":6,"xp":1900,"inputs":[{"itemId":44,"qty":3},{"itemId":252,"qty":2}],"output":{"itemId":351,"qty":1}},{"id":303,"name":"Colossus helm","skill":"smithing","group":"Helmets","levelReq":99,"baseTicks":6,"xp":1250,"inputs":[{"itemId":44,"qty":2},{"itemId":252,"qty":1}],"output":{"itemId":352,"qty":1}},{"id":304,"name":"Colossus plate","skill":"smithing","group":"Bodies","levelReq":99,"baseTicks":6,"xp":3100,"inputs":[{"itemId":44,"qty":5},{"itemId":252,"qty":3}],"output":{"itemId":353,"qty":1}},{"id":305,"name":"Colossus greaves","skill":"smithing","group":"Legs","levelReq":99,"baseTicks":6,"xp":2500,"inputs":[{"itemId":44,"qty":4},{"itemId":252,"qty":2}],"output":{"itemId":354,"qty":1}},{"id":140,"name":"Shortbow","skill":"fletching","group":"Shortbows","levelReq":1,"baseTicks":5,"xp":5,"inputs":[{"itemId":10,"qty":1}],"output":{"itemId":140,"qty":1}},{"id":141,"name":"Oak shortbow","skill":"fletching","group":"Shortbows","levelReq":15,"baseTicks":5,"xp":11,"inputs":[{"itemId":11,"qty":1}],"output":{"itemId":141,"qty":1}},{"id":142,"name":"Willow shortbow","skill":"fletching","group":"Shortbows","levelReq":30,"baseTicks":5,"xp":17,"inputs":[{"itemId":12,"qty":1}],"output":{"itemId":142,"qty":1}},{"id":143,"name":"Maple shortbow","skill":"fletching","group":"Shortbows","levelReq":45,"baseTicks":5,"xp":27,"inputs":[{"itemId":13,"qty":1}],"output":{"itemId":143,"qty":1}},{"id":144,"name":"Yew shortbow","skill":"fletching","group":"Shortbows","levelReq":60,"baseTicks":5,"xp":43,"inputs":[{"itemId":14,"qty":1}],"output":{"itemId":144,"qty":1}},{"id":145,"name":"Magic shortbow","skill":"fletching","group":"Shortbows","levelReq":75,"baseTicks":5,"xp":70,"inputs":[{"itemId":15,"qty":1}],"output":{"itemId":145,"qty":1}},{"id":146,"name":"Longbow","skill":"fletching","group":"Longbows","levelReq":1,"baseTicks":5,"xp":10,"inputs":[{"itemId":10,"qty":2}],"output":{"itemId":146,"qty":1}},{"id":147,"name":"Oak longbow","skill":"fletching","group":"Longbows","levelReq":15,"baseTicks":5,"xp":22,"inputs":[{"itemId":11,"qty":2}],"output":{"itemId":147,"qty":1}},{"id":148,"name":"Willow longbow","skill":"fletching","group":"Longbows","levelReq":30,"baseTicks":5,"xp":34,"inputs":[{"itemId":12,"qty":2}],"output":{"itemId":148,"qty":1}},{"id":149,"name":"Maple longbow","skill":"fletching","group":"Longbows","levelReq":45,"baseTicks":5,"xp":54,"inputs":[{"itemId":13,"qty":2}],"output":{"itemId":149,"qty":1}},{"id":150,"name":"Yew longbow","skill":"fletching","group":"Longbows","levelReq":60,"baseTicks":5,"xp":86,"inputs":[{"itemId":14,"qty":2}],"output":{"itemId":150,"qty":1}},{"id":151,"name":"Magic longbow","skill":"fletching","group":"Longbows","levelReq":75,"baseTicks":5,"xp":140,"inputs":[{"itemId":15,"qty":2}],"output":{"itemId":151,"qty":1}},{"id":200,"name":"Staff","skill":"fletching","group":"Staffs","levelReq":1,"baseTicks":5,"xp":8,"inputs":[{"itemId":10,"qty":2}],"output":{"itemId":152,"qty":1}},{"id":201,"name":"Oak staff","skill":"fletching","group":"Staffs","levelReq":15,"baseTicks":5,"xp":22,"inputs":[{"itemId":11,"qty":2}],"output":{"itemId":153,"qty":1}},{"id":202,"name":"Willow staff","skill":"fletching","group":"Staffs","levelReq":30,"baseTicks":5,"xp":40,"inputs":[{"itemId":12,"qty":2}],"output":{"itemId":154,"qty":1}},{"id":203,"name":"Maple staff","skill":"fletching","group":"Staffs","levelReq":45,"baseTicks":5,"xp":65,"inputs":[{"itemId":13,"qty":2}],"output":{"itemId":155,"qty":1}},{"id":204,"name":"Yew staff","skill":"fletching","group":"Staffs","levelReq":60,"baseTicks":5,"xp":100,"inputs":[{"itemId":14,"qty":2}],"output":{"itemId":156,"qty":1}},{"id":205,"name":"Magic staff","skill":"fletching","group":"Staffs","levelReq":75,"baseTicks":5,"xp":150,"inputs":[{"itemId":15,"qty":2}],"output":{"itemId":157,"qty":1}},{"id":210,"name":"Sage","skill":"farming","group":"Herbs","levelReq":10,"baseTicks":2,"xp":260,"inputs":[{"itemId":190,"qty":1}],"output":{"itemId":193,"qty":1},"grow":1200},{"id":211,"name":"Nightshade","skill":"farming","group":"Herbs","levelReq":35,"baseTicks":2,"xp":1200,"inputs":[{"itemId":191,"qty":1}],"output":{"itemId":194,"qty":1},"grow":3000},{"id":212,"name":"Dragonleaf","skill":"farming","group":"Herbs","levelReq":65,"baseTicks":2,"xp":4600,"inputs":[{"itemId":192,"qty":1}],"output":{"itemId":195,"qty":1},"grow":7000},{"id":220,"name":"Gatherer's draught","skill":"herblore","group":"Potions","levelReq":1,"baseTicks":6,"xp":30,"inputs":[{"itemId":193,"qty":1},{"itemId":240,"qty":1}],"output":{"itemId":220,"qty":1}},{"id":225,"name":"Swift draught","skill":"herblore","group":"Potions","levelReq":20,"baseTicks":6,"xp":70,"inputs":[{"itemId":193,"qty":1},{"itemId":242,"qty":1}],"output":{"itemId":225,"qty":1}},{"id":226,"name":"Nourishing draught","skill":"herblore","group":"Potions","levelReq":50,"baseTicks":6,"xp":240,"inputs":[{"itemId":194,"qty":1},{"itemId":244,"qty":1}],"output":{"itemId":226,"qty":1}},{"id":227,"name":"Haste draught","skill":"herblore","group":"Potions","levelReq":70,"baseTicks":7,"xp":460,"inputs":[{"itemId":195,"qty":1},{"itemId":245,"qty":1}],"output":{"itemId":227,"qty":1}},{"id":221,"name":"Hunter's brew","skill":"herblore","group":"Potions","levelReq":35,"baseTicks":6,"xp":120,"inputs":[{"itemId":194,"qty":1},{"itemId":243,"qty":1}],"output":{"itemId":221,"qty":1}},{"id":222,"name":"Warrior's tonic","skill":"herblore","group":"Potions","levelReq":60,"baseTicks":6,"xp":300,"inputs":[{"itemId":195,"qty":1},{"itemId":244,"qty":1}],"output":{"itemId":222,"qty":1}},{"id":223,"name":"Elixir of the vein","skill":"herblore","group":"Potions","levelReq":80,"baseTicks":7,"xp":700,"inputs":[{"itemId":194,"qty":1},{"itemId":195,"qty":1},{"itemId":246,"qty":1}],"output":{"itemId":223,"qty":1}},{"id":224,"name":"Abyssal tonic","skill":"herblore","group":"Potions","levelReq":95,"baseTicks":7,"xp":1600,"inputs":[{"itemId":195,"qty":1},{"itemId":249,"qty":1}],"output":{"itemId":224,"qty":1}},{"id":230,"name":"Cut gem","skill":"crafting","group":"Gems","levelReq":1,"baseTicks":5,"xp":16,"inputs":[{"itemId":100,"qty":1}],"output":{"itemId":180,"qty":1}},{"id":231,"name":"Silver ring","skill":"crafting","group":"Rings","levelReq":20,"baseTicks":6,"xp":58,"inputs":[{"itemId":4,"qty":1},{"itemId":180,"qty":1}],"output":{"itemId":181,"qty":1}},{"id":232,"name":"Gold ring","skill":"crafting","group":"Rings","levelReq":45,"baseTicks":6,"xp":156,"inputs":[{"itemId":6,"qty":1},{"itemId":180,"qty":1}],"output":{"itemId":182,"qty":1}},{"id":233,"name":"Meteoric ring","skill":"crafting","group":"Rings","levelReq":75,"baseTicks":7,"xp":455,"inputs":[{"itemId":44,"qty":1},{"itemId":180,"qty":2}],"output":{"itemId":183,"qty":1}},{"id":307,"name":"Wyrm ring","skill":"crafting","group":"Rings","levelReq":95,"baseTicks":8,"xp":1200,"inputs":[{"itemId":356,"qty":1},{"itemId":180,"qty":2}],"output":{"itemId":358,"qty":1}},{"id":234,"name":"Silver amulet","skill":"crafting","group":"Amulets","levelReq":30,"baseTicks":6,"xp":84,"inputs":[{"itemId":4,"qty":1},{"itemId":180,"qty":1}],"output":{"itemId":184,"qty":1}},{"id":235,"name":"Gold amulet","skill":"crafting","group":"Amulets","levelReq":55,"baseTicks":6,"xp":221,"inputs":[{"itemId":6,"qty":1},{"itemId":180,"qty":1}],"output":{"itemId":185,"qty":1}},{"id":236,"name":"Meteoric amulet","skill":"crafting","group":"Amulets","levelReq":85,"baseTicks":7,"xp":618,"inputs":[{"itemId":44,"qty":1},{"itemId":180,"qty":2}],"output":{"itemId":186,"qty":1}},{"id":306,"name":"Leviathan amulet","skill":"crafting","group":"Amulets","levelReq":95,"baseTicks":8,"xp":1400,"inputs":[{"itemId":355,"qty":1},{"itemId":180,"qty":2}],"output":{"itemId":357,"qty":1}},{"id":260,"name":"Pelt coif","skill":"crafting","group":"Leather","levelReq":1,"baseTicks":6,"xp":8,"inputs":[{"itemId":240,"qty":2}],"output":{"itemId":260,"qty":1}},{"id":261,"name":"Pelt chaps","skill":"crafting","group":"Leather","levelReq":1,"baseTicks":6,"xp":12,"inputs":[{"itemId":240,"qty":3}],"output":{"itemId":262,"qty":1}},{"id":262,"name":"Pelt jerkin","skill":"crafting","group":"Leather","levelReq":1,"baseTicks":6,"xp":20,"inputs":[{"itemId":240,"qty":5}],"output":{"itemId":261,"qty":1}},{"id":263,"name":"Bogskin coif","skill":"crafting","group":"Leather","levelReq":15,"baseTicks":6,"xp":22,"inputs":[{"itemId":241,"qty":2}],"output":{"itemId":263,"qty":1}},{"id":264,"name":"Bogskin chaps","skill":"crafting","group":"Leather","levelReq":15,"baseTicks":6,"xp":33,"inputs":[{"itemId":241,"qty":3}],"output":{"itemId":265,"qty":1}},{"id":265,"name":"Bogskin jerkin","skill":"crafting","group":"Leather","levelReq":15,"baseTicks":6,"xp":55,"inputs":[{"itemId":241,"qty":5}],"output":{"itemId":264,"qty":1}},{"id":266,"name":"Chitin coif","skill":"crafting","group":"Leather","levelReq":30,"baseTicks":6,"xp":60,"inputs":[{"itemId":242,"qty":2}],"output":{"itemId":266,"qty":1}},{"id":267,"name":"Chitin chaps","skill":"crafting","group":"Leather","levelReq":30,"baseTicks":6,"xp":90,"inputs":[{"itemId":242,"qty":3}],"output":{"itemId":268,"qty":1}},{"id":268,"name":"Chitin jerkin","skill":"crafting","group":"Leather","levelReq":30,"baseTicks":6,"xp":150,"inputs":[{"itemId":242,"qty":5}],"output":{"itemId":267,"qty":1}},{"id":269,"name":"Fur coif","skill":"crafting","group":"Leather","levelReq":60,"baseTicks":7,"xp":180,"inputs":[{"itemId":245,"qty":2}],"output":{"itemId":269,"qty":1}},{"id":270,"name":"Fur chaps","skill":"crafting","group":"Leather","levelReq":60,"baseTicks":7,"xp":270,"inputs":[{"itemId":245,"qty":3}],"output":{"itemId":271,"qty":1}},{"id":271,"name":"Fur jerkin","skill":"crafting","group":"Leather","levelReq":60,"baseTicks":7,"xp":450,"inputs":[{"itemId":245,"qty":5}],"output":{"itemId":270,"qty":1}},{"id":272,"name":"Scale coif","skill":"crafting","group":"Leather","levelReq":85,"baseTicks":7,"xp":460,"inputs":[{"itemId":247,"qty":2}],"output":{"itemId":272,"qty":1}},{"id":273,"name":"Scale chaps","skill":"crafting","group":"Leather","levelReq":85,"baseTicks":7,"xp":690,"inputs":[{"itemId":247,"qty":3}],"output":{"itemId":274,"qty":1}},{"id":274,"name":"Scale jerkin","skill":"crafting","group":"Leather","levelReq":85,"baseTicks":7,"xp":1150,"inputs":[{"itemId":247,"qty":5}],"output":{"itemId":273,"qty":1}},{"id":289,"name":"Troll coif","skill":"crafting","group":"Leather","levelReq":95,"baseTicks":8,"xp":1250,"inputs":[{"itemId":248,"qty":2}],"output":{"itemId":338,"qty":1}},{"id":290,"name":"Troll chaps","skill":"crafting","group":"Leather","levelReq":95,"baseTicks":8,"xp":1900,"inputs":[{"itemId":248,"qty":3}],"output":{"itemId":340,"qty":1}},{"id":291,"name":"Troll jerkin","skill":"crafting","group":"Leather","levelReq":95,"baseTicks":8,"xp":3100,"inputs":[{"itemId":248,"qty":5}],"output":{"itemId":339,"qty":1}},{"id":292,"name":"Drake coif","skill":"crafting","group":"Leather","levelReq":99,"baseTicks":8,"xp":3300,"inputs":[{"itemId":251,"qty":2}],"output":{"itemId":341,"qty":1}},{"id":293,"name":"Drake chaps","skill":"crafting","group":"Leather","levelReq":99,"baseTicks":8,"xp":5000,"inputs":[{"itemId":251,"qty":3}],"output":{"itemId":343,"qty":1}},{"id":294,"name":"Drake jerkin","skill":"crafting","group":"Leather","levelReq":99,"baseTicks":8,"xp":8300,"inputs":[{"itemId":251,"qty":5}],"output":{"itemId":342,"qty":1}},{"id":240,"name":"Bread stall","skill":"thieving","group":"Stalls","levelReq":1,"baseTicks":6,"xp":8,"inputs":[],"output":{"itemId":200,"qty":6},"caught":{"chanceAtReq":0.25,"safeAtLevel":30,"stunTicks":8}},{"id":241,"name":"Silk stall","skill":"thieving","group":"Stalls","levelReq":25,"baseTicks":7,"xp":30,"inputs":[],"output":{"itemId":200,"qty":28},"caught":{"chanceAtReq":0.3,"safeAtLevel":60,"stunTicks":10},"bonus":{"itemId":191,"chance":0.03333333333333333}},{"id":242,"name":"Gem stall","skill":"thieving","group":"Stalls","levelReq":50,"baseTicks":8,"xp":80,"inputs":[],"output":{"itemId":200,"qty":90},"bonus":{"itemId":100,"chance":0.04},"caught":{"chanceAtReq":0.32,"safeAtLevel":85,"stunTicks":12}},{"id":243,"name":"Relic stall","skill":"thieving","group":"Stalls","levelReq":75,"baseTicks":9,"xp":200,"inputs":[],"output":{"itemId":200,"qty":260},"bonus":{"itemId":208,"chance":0.03},"caught":{"chanceAtReq":0.35,"safeAtLevel":110,"stunTicks":15}},{"id":244,"name":"Linen line","skill":"thieving","group":"Cloth","levelReq":1,"baseTicks":7,"xp":7,"inputs":[],"output":{"itemId":300,"qty":1},"caught":{"chanceAtReq":0.25,"safeAtLevel":30,"stunTicks":8}},{"id":245,"name":"Silk cart","skill":"thieving","group":"Cloth","levelReq":25,"baseTicks":8,"xp":26,"inputs":[],"output":{"itemId":301,"qty":1},"caught":{"chanceAtReq":0.3,"safeAtLevel":60,"stunTicks":10}},{"id":246,"name":"Gilded loom","skill":"thieving","group":"Cloth","levelReq":50,"baseTicks":9,"xp":70,"inputs":[],"output":{"itemId":302,"qty":1},"caught":{"chanceAtReq":0.32,"safeAtLevel":85,"stunTicks":12}},{"id":247,"name":"Reliquary vestry","skill":"thieving","group":"Cloth","levelReq":75,"baseTicks":10,"xp":175,"inputs":[],"output":{"itemId":303,"qty":1},"caught":{"chanceAtReq":0.35,"safeAtLevel":110,"stunTicks":15}},{"id":248,"name":"Homespun hood","skill":"crafting","group":"Cloth","levelReq":1,"baseTicks":6,"xp":9,"inputs":[{"itemId":300,"qty":2}],"output":{"itemId":304,"qty":1}},{"id":249,"name":"Homespun skirt","skill":"crafting","group":"Cloth","levelReq":1,"baseTicks":6,"xp":14,"inputs":[{"itemId":300,"qty":3}],"output":{"itemId":306,"qty":1}},{"id":250,"name":"Homespun robe","skill":"crafting","group":"Cloth","levelReq":1,"baseTicks":6,"xp":23,"inputs":[{"itemId":300,"qty":5}],"output":{"itemId":305,"qty":1}},{"id":251,"name":"Silk hood","skill":"crafting","group":"Cloth","levelReq":25,"baseTicks":6,"xp":50,"inputs":[{"itemId":301,"qty":2}],"output":{"itemId":307,"qty":1}},{"id":252,"name":"Silk skirt","skill":"crafting","group":"Cloth","levelReq":25,"baseTicks":6,"xp":75,"inputs":[{"itemId":301,"qty":3}],"output":{"itemId":309,"qty":1}},{"id":253,"name":"Silk robe","skill":"crafting","group":"Cloth","levelReq":25,"baseTicks":6,"xp":125,"inputs":[{"itemId":301,"qty":5}],"output":{"itemId":308,"qty":1}},{"id":254,"name":"Gilded hood","skill":"crafting","group":"Cloth","levelReq":50,"baseTicks":7,"xp":145,"inputs":[{"itemId":302,"qty":2}],"output":{"itemId":310,"qty":1}},{"id":255,"name":"Gilded skirt","skill":"crafting","group":"Cloth","levelReq":50,"baseTicks":7,"xp":215,"inputs":[{"itemId":302,"qty":3}],"output":{"itemId":312,"qty":1}},{"id":256,"name":"Gilded robe","skill":"crafting","group":"Cloth","levelReq":50,"baseTicks":7,"xp":360,"inputs":[{"itemId":302,"qty":5}],"output":{"itemId":311,"qty":1}},{"id":257,"name":"Voidweave hood","skill":"crafting","group":"Cloth","levelReq":75,"baseTicks":7,"xp":380,"inputs":[{"itemId":303,"qty":2}],"output":{"itemId":313,"qty":1}},{"id":258,"name":"Voidweave skirt","skill":"crafting","group":"Cloth","levelReq":75,"baseTicks":7,"xp":570,"inputs":[{"itemId":303,"qty":3}],"output":{"itemId":315,"qty":1}},{"id":259,"name":"Voidweave robe","skill":"crafting","group":"Cloth","levelReq":75,"baseTicks":7,"xp":950,"inputs":[{"itemId":303,"qty":5}],"output":{"itemId":314,"qty":1}},{"id":295,"name":"Wightweave hood","skill":"crafting","group":"Cloth","levelReq":90,"baseTicks":8,"xp":1000,"inputs":[{"itemId":303,"qty":2},{"itemId":250,"qty":1}],"output":{"itemId":344,"qty":1}},{"id":296,"name":"Wightweave skirt","skill":"crafting","group":"Cloth","levelReq":90,"baseTicks":8,"xp":1500,"inputs":[{"itemId":303,"qty":3},{"itemId":250,"qty":2}],"output":{"itemId":346,"qty":1}},{"id":297,"name":"Wightweave robe","skill":"crafting","group":"Cloth","levelReq":90,"baseTicks":8,"xp":2500,"inputs":[{"itemId":303,"qty":5},{"itemId":250,"qty":3}],"output":{"itemId":345,"qty":1}},{"id":275,"name":"Pelt gloves","skill":"crafting","group":"Gloves","levelReq":5,"baseTicks":6,"xp":10,"inputs":[{"itemId":240,"qty":4}],"output":{"itemId":323,"qty":1}},{"id":276,"name":"Bogskin gloves","skill":"crafting","group":"Gloves","levelReq":25,"baseTicks":6,"xp":28,"inputs":[{"itemId":241,"qty":2},{"itemId":202,"qty":1}],"output":{"itemId":324,"qty":1}},{"id":277,"name":"Chitin gloves","skill":"crafting","group":"Gloves","levelReq":45,"baseTicks":6,"xp":75,"inputs":[{"itemId":242,"qty":2},{"itemId":203,"qty":1}],"output":{"itemId":325,"qty":1}},{"id":278,"name":"Bone gloves","skill":"crafting","group":"Gloves","levelReq":65,"baseTicks":7,"xp":225,"inputs":[{"itemId":243,"qty":2},{"itemId":204,"qty":1}],"output":{"itemId":326,"qty":1}},{"id":280,"name":"Pelt quiver","skill":"fletching","group":"Quivers","levelReq":1,"baseTicks":5,"xp":14,"inputs":[{"itemId":240,"qty":2},{"itemId":10,"qty":1}],"output":{"itemId":329,"qty":1}},{"id":281,"name":"Bogskin quiver","skill":"fletching","group":"Quivers","levelReq":15,"baseTicks":5,"xp":34,"inputs":[{"itemId":241,"qty":2},{"itemId":11,"qty":1}],"output":{"itemId":330,"qty":1}},{"id":282,"name":"Chitin quiver","skill":"fletching","group":"Quivers","levelReq":30,"baseTicks":5,"xp":70,"inputs":[{"itemId":242,"qty":2},{"itemId":12,"qty":1}],"output":{"itemId":331,"qty":1}},{"id":283,"name":"Fur quiver","skill":"fletching","group":"Quivers","levelReq":60,"baseTicks":5,"xp":150,"inputs":[{"itemId":245,"qty":2},{"itemId":13,"qty":1}],"output":{"itemId":332,"qty":1}},{"id":284,"name":"Scale quiver","skill":"fletching","group":"Quivers","levelReq":85,"baseTicks":5,"xp":320,"inputs":[{"itemId":247,"qty":2},{"itemId":14,"qty":1}],"output":{"itemId":333,"qty":1}},{"id":298,"name":"Troll quiver","skill":"fletching","group":"Quivers","levelReq":95,"baseTicks":6,"xp":700,"inputs":[{"itemId":248,"qty":2},{"itemId":15,"qty":1}],"output":{"itemId":347,"qty":1}},{"id":299,"name":"Drake quiver","skill":"fletching","group":"Quivers","levelReq":99,"baseTicks":6,"xp":1400,"inputs":[{"itemId":251,"qty":2},{"itemId":15,"qty":2}],"output":{"itemId":348,"qty":1}},{"id":285,"name":"Linen grimoire","skill":"crafting","group":"Grimoires","levelReq":1,"baseTicks":6,"xp":16,"inputs":[{"itemId":300,"qty":3}],"output":{"itemId":334,"qty":1}},{"id":286,"name":"Silk grimoire","skill":"crafting","group":"Grimoires","levelReq":25,"baseTicks":6,"xp":85,"inputs":[{"itemId":301,"qty":3},{"itemId":241,"qty":1}],"output":{"itemId":335,"qty":1}},{"id":287,"name":"Gilded grimoire","skill":"crafting","group":"Grimoires","levelReq":50,"baseTicks":7,"xp":230,"inputs":[{"itemId":302,"qty":3},{"itemId":244,"qty":1}],"output":{"itemId":336,"qty":1}},{"id":288,"name":"Voidweave grimoire","skill":"crafting","group":"Grimoires","levelReq":75,"baseTicks":7,"xp":560,"inputs":[{"itemId":303,"qty":3},{"itemId":246,"qty":2}],"output":{"itemId":337,"qty":1}},{"id":300,"name":"Wightweave grimoire","skill":"crafting","group":"Grimoires","levelReq":90,"baseTicks":8,"xp":1200,"inputs":[{"itemId":303,"qty":3},{"itemId":250,"qty":2}],"output":{"itemId":349,"qty":1}},{"id":279,"name":"Scale gloves","skill":"crafting","group":"Gloves","levelReq":85,"baseTicks":7,"xp":575,"inputs":[{"itemId":247,"qty":2},{"itemId":206,"qty":1}],"output":{"itemId":327,"qty":1}}],"gear":[{"itemId":80,"slot":"pickaxe","bonus":0.08},{"itemId":81,"slot":"pickaxe","bonus":0.16},{"itemId":82,"slot":"pickaxe","bonus":0.25},{"itemId":83,"slot":"pickaxe","bonus":0.35},{"itemId":84,"slot":"pickaxe","bonus":0.5},{"itemId":85,"slot":"rod","bonus":0.08},{"itemId":86,"slot":"rod","bonus":0.16},{"itemId":87,"slot":"rod","bonus":0.25},{"itemId":88,"slot":"rod","bonus":0.35},{"itemId":89,"slot":"rod","bonus":0.5},{"itemId":90,"slot":"axe","bonus":0.08},{"itemId":91,"slot":"axe","bonus":0.16},{"itemId":92,"slot":"axe","bonus":0.25},{"itemId":93,"slot":"axe","bonus":0.35},{"itemId":94,"slot":"axe","bonus":0.5},{"itemId":323,"slot":"gloves","bonus":0.08},{"itemId":324,"slot":"gloves","bonus":0.16},{"itemId":325,"slot":"gloves","bonus":0.25},{"itemId":326,"slot":"gloves","bonus":0.35},{"itemId":327,"slot":"gloves","bonus":0.5},{"itemId":360,"slot":"pan","bonus":0.08},{"itemId":361,"slot":"pan","bonus":0.16},{"itemId":362,"slot":"pan","bonus":0.25},{"itemId":363,"slot":"pan","bonus":0.35},{"itemId":364,"slot":"pan","bonus":0.5},{"itemId":365,"slot":"hammer","bonus":0.08},{"itemId":366,"slot":"hammer","bonus":0.16},{"itemId":367,"slot":"hammer","bonus":0.25},{"itemId":368,"slot":"hammer","bonus":0.35},{"itemId":369,"slot":"hammer","bonus":0.5},{"itemId":370,"slot":"knife","bonus":0.08},{"itemId":371,"slot":"knife","bonus":0.16},{"itemId":372,"slot":"knife","bonus":0.25},{"itemId":373,"slot":"knife","bonus":0.35},{"itemId":374,"slot":"knife","bonus":0.5},{"itemId":375,"slot":"needle","bonus":0.08},{"itemId":376,"slot":"needle","bonus":0.16},{"itemId":377,"slot":"needle","bonus":0.25},{"itemId":378,"slot":"needle","bonus":0.35},{"itemId":379,"slot":"needle","bonus":0.5},{"itemId":380,"slot":"mortar","bonus":0.08},{"itemId":381,"slot":"mortar","bonus":0.16},{"itemId":382,"slot":"mortar","bonus":0.25},{"itemId":383,"slot":"mortar","bonus":0.35},{"itemId":384,"slot":"mortar","bonus":0.5},{"itemId":385,"slot":"hoe","bonus":0.08},{"itemId":386,"slot":"hoe","bonus":0.16},{"itemId":387,"slot":"hoe","bonus":0.25},{"itemId":388,"slot":"hoe","bonus":0.35},{"itemId":389,"slot":"hoe","bonus":0.5},{"itemId":328,"slot":"mount","bonus":0.12},{"itemId":110,"slot":"weapon","accuracy":6,"strength":5,"defence":0,"speed":4,"levelReq":1,"needs":"melee"},{"itemId":111,"slot":"weapon","accuracy":14,"strength":12,"defence":0,"speed":4,"levelReq":15,"needs":"melee"},{"itemId":112,"slot":"weapon","accuracy":24,"strength":21,"defence":0,"speed":4,"levelReq":30,"needs":"melee"},{"itemId":113,"slot":"weapon","accuracy":38,"strength":34,"defence":0,"speed":4,"levelReq":60,"needs":"melee"},{"itemId":114,"slot":"weapon","accuracy":56,"strength":50,"defence":0,"speed":4,"levelReq":85,"needs":"melee"},{"itemId":390,"slot":"weapon","accuracy":7,"strength":5,"defence":0,"speed":4,"twoHanded":true,"levelReq":1,"needs":"melee"},{"itemId":391,"slot":"weapon","accuracy":16,"strength":15,"defence":0,"speed":4,"twoHanded":true,"levelReq":15,"needs":"melee"},{"itemId":392,"slot":"weapon","accuracy":27,"strength":24,"defence":0,"speed":4,"twoHanded":true,"levelReq":30,"needs":"melee"},{"itemId":393,"slot":"weapon","accuracy":53,"strength":48,"defence":0,"speed":4,"twoHanded":true,"levelReq":60,"needs":"melee"},{"itemId":394,"slot":"weapon","accuracy":72,"strength":65,"defence":0,"speed":4,"twoHanded":true,"levelReq":85,"needs":"melee"},{"itemId":395,"slot":"weapon","accuracy":80,"strength":72,"defence":0,"speed":4,"twoHanded":true,"levelReq":99,"needs":"melee"},{"itemId":115,"slot":"shield","accuracy":0,"strength":3,"defence":4,"levelReq":1,"needs":"melee","style":"melee"},{"itemId":116,"slot":"shield","accuracy":0,"strength":9,"defence":9,"levelReq":15,"needs":"melee","style":"melee"},{"itemId":117,"slot":"shield","accuracy":0,"strength":14,"defence":16,"levelReq":30,"needs":"melee","style":"melee"},{"itemId":118,"slot":"shield","accuracy":0,"strength":35,"defence":25,"levelReq":60,"needs":"melee","style":"melee"},{"itemId":119,"slot":"shield","accuracy":0,"strength":43,"defence":37,"levelReq":85,"needs":"melee","style":"melee"},{"itemId":329,"slot":"shield","accuracy":2,"strength":1,"defence":0,"ranged":true,"levelReq":1,"needs":"ranged","style":"ranged"},{"itemId":330,"slot":"shield","accuracy":4,"strength":3,"defence":0,"ranged":true,"levelReq":15,"needs":"ranged","style":"ranged"},{"itemId":331,"slot":"shield","accuracy":7,"strength":5,"defence":0,"ranged":true,"levelReq":30,"needs":"ranged","style":"ranged"},{"itemId":332,"slot":"shield","accuracy":11,"strength":8,"defence":0,"ranged":true,"levelReq":60,"needs":"ranged","style":"ranged"},{"itemId":333,"slot":"shield","accuracy":16,"strength":12,"defence":0,"ranged":true,"levelReq":85,"needs":"ranged","style":"ranged"},{"itemId":347,"slot":"shield","accuracy":20,"strength":15,"defence":0,"ranged":true,"levelReq":95,"needs":"ranged","style":"ranged"},{"itemId":348,"slot":"shield","accuracy":24,"strength":18,"defence":0,"ranged":true,"levelReq":99,"needs":"ranged","style":"ranged"},{"itemId":334,"slot":"shield","accuracy":2,"strength":1,"defence":0,"magic":true,"levelReq":1,"needs":"magic","style":"magic"},{"itemId":335,"slot":"shield","accuracy":5,"strength":4,"defence":0,"magic":true,"levelReq":25,"needs":"magic","style":"magic"},{"itemId":336,"slot":"shield","accuracy":9,"strength":7,"defence":0,"magic":true,"levelReq":50,"needs":"magic","style":"magic"},{"itemId":337,"slot":"shield","accuracy":14,"strength":11,"defence":0,"magic":true,"levelReq":75,"needs":"magic","style":"magic"},{"itemId":349,"slot":"shield","accuracy":18,"strength":14,"defence":0,"magic":true,"levelReq":90,"needs":"magic","style":"magic"},{"itemId":120,"slot":"helmet","accuracy":1,"strength":0,"defence":3,"levelReq":1,"needs":"melee","style":"melee"},{"itemId":121,"slot":"helmet","accuracy":2,"strength":0,"defence":7,"levelReq":15,"needs":"melee","style":"melee"},{"itemId":122,"slot":"helmet","accuracy":4,"strength":0,"defence":12,"levelReq":30,"needs":"melee","style":"melee"},{"itemId":123,"slot":"helmet","accuracy":7,"strength":0,"defence":19,"levelReq":60,"needs":"melee","style":"melee"},{"itemId":124,"slot":"helmet","accuracy":10,"strength":0,"defence":28,"levelReq":85,"needs":"melee","style":"melee"},{"itemId":125,"slot":"body","accuracy":2,"strength":0,"defence":6,"levelReq":1,"needs":"melee","style":"melee"},{"itemId":126,"slot":"body","accuracy":5,"strength":0,"defence":14,"levelReq":15,"needs":"melee","style":"melee"},{"itemId":127,"slot":"body","accuracy":8,"strength":0,"defence":24,"levelReq":30,"needs":"melee","style":"melee"},{"itemId":128,"slot":"body","accuracy":13,"strength":0,"defence":38,"levelReq":60,"needs":"melee","style":"melee"},{"itemId":129,"slot":"body","accuracy":20,"strength":0,"defence":56,"levelReq":85,"needs":"melee","style":"melee"},{"itemId":130,"slot":"legs","accuracy":2,"strength":0,"defence":5,"levelReq":1,"needs":"melee","style":"melee"},{"itemId":131,"slot":"legs","accuracy":4,"strength":0,"defence":11,"levelReq":15,"needs":"melee","style":"melee"},{"itemId":132,"slot":"legs","accuracy":7,"strength":0,"defence":19,"levelReq":30,"needs":"melee","style":"melee"},{"itemId":133,"slot":"legs","accuracy":10,"strength":0,"defence":30,"levelReq":60,"needs":"melee","style":"melee"},{"itemId":134,"slot":"legs","accuracy":15,"strength":0,"defence":44,"levelReq":85,"needs":"melee","style":"melee"},{"itemId":350,"slot":"weapon","accuracy":70,"strength":63,"defence":0,"speed":4,"levelReq":99,"needs":"melee"},{"itemId":351,"slot":"shield","accuracy":0,"strength":43,"defence":46,"levelReq":99,"needs":"melee","style":"melee"},{"itemId":352,"slot":"helmet","accuracy":12,"strength":0,"defence":35,"levelReq":99,"needs":"melee","style":"melee"},{"itemId":353,"slot":"body","accuracy":24,"strength":0,"defence":70,"levelReq":99,"needs":"melee","style":"melee"},{"itemId":354,"slot":"legs","accuracy":19,"strength":0,"defence":55,"levelReq":99,"needs":"melee","style":"melee"},{"itemId":260,"slot":"helmet","accuracy":1,"strength":0,"defence":2,"levelReq":1,"needs":"ranged","style":"ranged"},{"itemId":261,"slot":"body","accuracy":2,"strength":0,"defence":4,"levelReq":1,"needs":"ranged","style":"ranged"},{"itemId":262,"slot":"legs","accuracy":2,"strength":0,"defence":3,"levelReq":1,"needs":"ranged","style":"ranged"},{"itemId":263,"slot":"helmet","accuracy":3,"strength":0,"defence":4,"levelReq":15,"needs":"ranged","style":"ranged"},{"itemId":264,"slot":"body","accuracy":5,"strength":0,"defence":8,"levelReq":15,"needs":"ranged","style":"ranged"},{"itemId":265,"slot":"legs","accuracy":4,"strength":0,"defence":7,"levelReq":15,"needs":"ranged","style":"ranged"},{"itemId":266,"slot":"helmet","accuracy":5,"strength":0,"defence":7,"levelReq":30,"needs":"ranged","style":"ranged"},{"itemId":267,"slot":"body","accuracy":8,"strength":0,"defence":14,"levelReq":30,"needs":"ranged","style":"ranged"},{"itemId":268,"slot":"legs","accuracy":6,"strength":0,"defence":11,"levelReq":30,"needs":"ranged","style":"ranged"},{"itemId":269,"slot":"helmet","accuracy":8,"strength":0,"defence":11,"levelReq":60,"needs":"ranged","style":"ranged"},{"itemId":270,"slot":"body","accuracy":13,"strength":0,"defence":23,"levelReq":60,"needs":"ranged","style":"ranged"},{"itemId":271,"slot":"legs","accuracy":10,"strength":0,"defence":18,"levelReq":60,"needs":"ranged","style":"ranged"},{"itemId":272,"slot":"helmet","accuracy":12,"strength":0,"defence":17,"levelReq":85,"needs":"ranged","style":"ranged"},{"itemId":273,"slot":"body","accuracy":20,"strength":0,"defence":34,"levelReq":85,"needs":"ranged","style":"ranged"},{"itemId":274,"slot":"legs","accuracy":15,"strength":0,"defence":26,"levelReq":85,"needs":"ranged","style":"ranged"},{"itemId":338,"slot":"helmet","accuracy":15,"strength":0,"defence":21,"levelReq":95,"needs":"ranged","style":"ranged"},{"itemId":339,"slot":"body","accuracy":25,"strength":0,"defence":42,"levelReq":95,"needs":"ranged","style":"ranged"},{"itemId":340,"slot":"legs","accuracy":19,"strength":0,"defence":32,"levelReq":95,"needs":"ranged","style":"ranged"},{"itemId":341,"slot":"helmet","accuracy":18,"strength":0,"defence":25,"levelReq":99,"needs":"ranged","style":"ranged"},{"itemId":342,"slot":"body","accuracy":30,"strength":0,"defence":50,"levelReq":99,"needs":"ranged","style":"ranged"},{"itemId":343,"slot":"legs","accuracy":22,"strength":0,"defence":38,"levelReq":99,"needs":"ranged","style":"ranged"},{"itemId":140,"slot":"weapon","accuracy":5,"strength":4,"defence":0,"speed":3,"ranged":true,"levelReq":1,"needs":"ranged"},{"itemId":141,"slot":"weapon","accuracy":12,"strength":10,"defence":0,"speed":3,"ranged":true,"levelReq":15,"needs":"ranged"},{"itemId":142,"slot":"weapon","accuracy":20,"strength":17,"defence":0,"speed":3,"ranged":true,"levelReq":30,"needs":"ranged"},{"itemId":143,"slot":"weapon","accuracy":30,"strength":26,"defence":0,"speed":3,"ranged":true,"levelReq":45,"needs":"ranged"},{"itemId":144,"slot":"weapon","accuracy":42,"strength":37,"defence":0,"speed":3,"ranged":true,"levelReq":60,"needs":"ranged"},{"itemId":145,"slot":"weapon","accuracy":56,"strength":50,"defence":0,"speed":3,"ranged":true,"levelReq":75,"needs":"ranged"},{"itemId":152,"slot":"weapon","accuracy":5,"strength":4,"defence":0,"speed":6,"magic":true,"levelReq":1,"needs":"magic"},{"itemId":153,"slot":"weapon","accuracy":12,"strength":10,"defence":0,"speed":6,"magic":true,"levelReq":15,"needs":"magic"},{"itemId":154,"slot":"weapon","accuracy":20,"strength":17,"defence":0,"speed":6,"magic":true,"levelReq":30,"needs":"magic"},{"itemId":155,"slot":"weapon","accuracy":30,"strength":26,"defence":0,"speed":6,"magic":true,"levelReq":45,"needs":"magic"},{"itemId":156,"slot":"weapon","accuracy":42,"strength":37,"defence":0,"speed":6,"magic":true,"levelReq":60,"needs":"magic"},{"itemId":157,"slot":"weapon","accuracy":56,"strength":50,"defence":0,"speed":6,"magic":true,"levelReq":75,"needs":"magic"},{"itemId":181,"slot":"ring","accuracy":4,"strength":2,"defence":0,"levelReq":20,"needs":"defence"},{"itemId":182,"slot":"ring","accuracy":9,"strength":5,"defence":0,"levelReq":45,"needs":"defence"},{"itemId":183,"slot":"ring","accuracy":16,"strength":9,"defence":0,"levelReq":75,"needs":"defence"},{"itemId":358,"slot":"ring","accuracy":22,"strength":13,"defence":0,"levelReq":95,"needs":"defence"},{"itemId":184,"slot":"amulet","accuracy":0,"strength":0,"defence":4,"luck":0.25,"levelReq":30,"needs":"none"},{"itemId":185,"slot":"amulet","accuracy":0,"strength":0,"defence":8,"luck":0.5,"levelReq":55,"needs":"none"},{"itemId":186,"slot":"amulet","accuracy":0,"strength":0,"defence":14,"luck":1,"levelReq":85,"needs":"none"},{"itemId":357,"slot":"amulet","accuracy":0,"strength":0,"defence":18,"luck":1.5,"levelReq":95,"needs":"none"},{"itemId":304,"slot":"helmet","accuracy":2,"strength":0,"defence":1,"levelReq":1,"needs":"magic","style":"magic"},{"itemId":305,"slot":"body","accuracy":3,"strength":0,"defence":2,"levelReq":1,"needs":"magic","style":"magic"},{"itemId":306,"slot":"legs","accuracy":2,"strength":0,"defence":1,"levelReq":1,"needs":"magic","style":"magic"},{"itemId":307,"slot":"helmet","accuracy":6,"strength":0,"defence":2,"levelReq":25,"needs":"magic","style":"magic"},{"itemId":308,"slot":"body","accuracy":10,"strength":0,"defence":5,"levelReq":25,"needs":"magic","style":"magic"},{"itemId":309,"slot":"legs","accuracy":8,"strength":0,"defence":4,"levelReq":25,"needs":"magic","style":"magic"},{"itemId":310,"slot":"helmet","accuracy":11,"strength":0,"defence":4,"levelReq":50,"needs":"magic","style":"magic"},{"itemId":311,"slot":"body","accuracy":18,"strength":0,"defence":9,"levelReq":50,"needs":"magic","style":"magic"},{"itemId":312,"slot":"legs","accuracy":14,"strength":0,"defence":7,"levelReq":50,"needs":"magic","style":"magic"},{"itemId":313,"slot":"helmet","accuracy":17,"strength":0,"defence":7,"levelReq":75,"needs":"magic","style":"magic"},{"itemId":314,"slot":"body","accuracy":28,"strength":0,"defence":14,"levelReq":75,"needs":"magic","style":"magic"},{"itemId":315,"slot":"legs","accuracy":22,"strength":0,"defence":11,"levelReq":75,"needs":"magic","style":"magic"},{"itemId":344,"slot":"helmet","accuracy":21,"strength":0,"defence":9,"levelReq":90,"needs":"magic","style":"magic"},{"itemId":345,"slot":"body","accuracy":35,"strength":0,"defence":17,"levelReq":90,"needs":"magic","style":"magic"},{"itemId":346,"slot":"legs","accuracy":27,"strength":0,"defence":14,"levelReq":90,"needs":"magic","style":"magic"},{"itemId":146,"slot":"weapon","accuracy":7,"strength":6,"defence":0,"speed":5,"ranged":true,"levelReq":1,"needs":"ranged"},{"itemId":147,"slot":"weapon","accuracy":15,"strength":13,"defence":0,"speed":5,"ranged":true,"levelReq":15,"needs":"ranged"},{"itemId":148,"slot":"weapon","accuracy":24,"strength":22,"defence":0,"speed":5,"ranged":true,"levelReq":30,"needs":"ranged"},{"itemId":149,"slot":"weapon","accuracy":36,"strength":33,"defence":0,"speed":5,"ranged":true,"levelReq":45,"needs":"ranged"},{"itemId":150,"slot":"weapon","accuracy":50,"strength":46,"defence":0,"speed":5,"ranged":true,"levelReq":60,"needs":"ranged"},{"itemId":151,"slot":"weapon","accuracy":66,"strength":62,"defence":0,"speed":5,"ranged":true,"levelReq":75,"needs":"ranged"}],"items":{"1":{"id":1,"name":"Copper","stackable":false,"value":3},"2":{"id":2,"name":"Tin","stackable":false,"value":4},"3":{"id":3,"name":"Iron","stackable":false,"value":12},"4":{"id":4,"name":"Silver","stackable":false,"value":40},"5":{"id":5,"name":"Coal","stackable":false,"value":55},"6":{"id":6,"name":"Gold","stackable":false,"value":140},"7":{"id":7,"name":"Cobalt","stackable":false,"value":380},"8":{"id":8,"name":"Meteoric","stackable":false,"value":900},"10":{"id":10,"name":"Logs","stackable":false,"value":3},"11":{"id":11,"name":"Oak logs","stackable":false,"value":15},"12":{"id":12,"name":"Willow logs","stackable":false,"value":45},"13":{"id":13,"name":"Maple logs","stackable":false,"value":100},"14":{"id":14,"name":"Yew logs","stackable":false,"value":240},"15":{"id":15,"name":"Magic logs","stackable":false,"value":600},"20":{"id":20,"name":"Shrimp","stackable":false,"value":4},"21":{"id":21,"name":"Sardine","stackable":false,"value":9},"22":{"id":22,"name":"Trout","stackable":false,"value":26},"23":{"id":23,"name":"Salmon","stackable":false,"value":48},"24":{"id":24,"name":"Tuna","stackable":false,"value":92},"25":{"id":25,"name":"Lobster","stackable":false,"value":175},"26":{"id":26,"name":"Swordfish","stackable":false,"value":330},"27":{"id":27,"name":"Shark","stackable":false,"value":780},"40":{"id":40,"name":"Bronze bar","stackable":false,"value":12},"41":{"id":41,"name":"Iron bar","stackable":false,"value":22},"42":{"id":42,"name":"Steel bar","stackable":false,"value":156},"43":{"id":43,"name":"Cobalt bar","stackable":false,"value":660},"44":{"id":44,"name":"Meteoric bar","stackable":false,"value":1527},"60":{"id":60,"name":"Cooked shrimp","stackable":false,"value":9,"heals":3},"61":{"id":61,"name":"Cooked sardine","stackable":false,"value":15,"heals":4},"62":{"id":62,"name":"Cooked trout","stackable":false,"value":44,"heals":7},"63":{"id":63,"name":"Cooked salmon","stackable":false,"value":82,"heals":9},"64":{"id":64,"name":"Cooked tuna","stackable":false,"value":150,"heals":12},"65":{"id":65,"name":"Cooked lobster","stackable":false,"value":290,"heals":16},"66":{"id":66,"name":"Cooked swordfish","stackable":false,"value":550,"heals":20},"67":{"id":67,"name":"Cooked shark","stackable":false,"value":1280,"heals":26},"70":{"id":70,"name":"Burnt food","stackable":true,"value":0},"80":{"id":80,"name":"Bronze pickaxe","stackable":false,"value":29},"81":{"id":81,"name":"Iron pickaxe","stackable":false,"value":54},"82":{"id":82,"name":"Steel pickaxe","stackable":false,"value":346},"83":{"id":83,"name":"Cobalt pickaxe","stackable":false,"value":1435},"84":{"id":84,"name":"Meteoric pickaxe","stackable":false,"value":3461},"85":{"id":85,"name":"Bronze rod","stackable":false,"value":20},"86":{"id":86,"name":"Iron rod","stackable":false,"value":47},"87":{"id":87,"name":"Steel rod","stackable":false,"value":235},"88":{"id":88,"name":"Cobalt rod","stackable":false,"value":1015},"89":{"id":89,"name":"Meteoric rod","stackable":false,"value":2534},"90":{"id":90,"name":"Bronze axe","stackable":false,"value":29},"91":{"id":91,"name":"Iron axe","stackable":false,"value":54},"92":{"id":92,"name":"Steel axe","stackable":false,"value":346},"93":{"id":93,"name":"Cobalt axe","stackable":false,"value":1435},"94":{"id":94,"name":"Meteoric axe","stackable":false,"value":3461},"100":{"id":100,"name":"Rough gem","stackable":true,"value":2500},"110":{"id":110,"name":"Bronze blade","stackable":false,"value":17},"111":{"id":111,"name":"Iron blade","stackable":false,"value":32},"112":{"id":112,"name":"Steel blade","stackable":false,"value":190},"113":{"id":113,"name":"Cobalt blade","stackable":false,"value":775},"114":{"id":114,"name":"Meteoric blade","stackable":false,"value":1934},"115":{"id":115,"name":"Bronze shield","stackable":false,"value":41},"116":{"id":116,"name":"Iron shield","stackable":false,"value":76},"117":{"id":117,"name":"Steel shield","stackable":false,"value":502},"118":{"id":118,"name":"Cobalt shield","stackable":false,"value":2095},"119":{"id":119,"name":"Meteoric shield","stackable":false,"value":4988},"120":{"id":120,"name":"Bronze helm","stackable":false,"value":29},"121":{"id":121,"name":"Iron helm","stackable":false,"value":54},"122":{"id":122,"name":"Steel helm","stackable":false,"value":346},"123":{"id":123,"name":"Cobalt helm","stackable":false,"value":1435},"124":{"id":124,"name":"Meteoric helm","stackable":false,"value":3461},"125":{"id":125,"name":"Bronze plate","stackable":false,"value":65},"126":{"id":126,"name":"Iron plate","stackable":false,"value":120},"127":{"id":127,"name":"Steel plate","stackable":false,"value":814},"128":{"id":128,"name":"Cobalt plate","stackable":false,"value":3415},"129":{"id":129,"name":"Meteoric plate","stackable":false,"value":8042},"130":{"id":130,"name":"Bronze greaves","stackable":false,"value":53},"131":{"id":131,"name":"Iron greaves","stackable":false,"value":98},"132":{"id":132,"name":"Steel greaves","stackable":false,"value":658},"133":{"id":133,"name":"Cobalt greaves","stackable":false,"value":2755},"134":{"id":134,"name":"Meteoric greaves","stackable":false,"value":6515},"140":{"id":140,"name":"Shortbow","stackable":false,"value":8},"141":{"id":141,"name":"Oak shortbow","stackable":false,"value":25},"142":{"id":142,"name":"Willow shortbow","stackable":false,"value":79},"143":{"id":143,"name":"Maple shortbow","stackable":false,"value":158},"144":{"id":144,"name":"Yew shortbow","stackable":false,"value":355},"145":{"id":145,"name":"Magic shortbow","stackable":false,"value":820},"146":{"id":146,"name":"Longbow","stackable":false,"value":11},"147":{"id":147,"name":"Oak longbow","stackable":false,"value":40},"148":{"id":148,"name":"Willow longbow","stackable":false,"value":124},"149":{"id":149,"name":"Maple longbow","stackable":false,"value":258},"150":{"id":150,"name":"Yew longbow","stackable":false,"value":595},"151":{"id":151,"name":"Magic longbow","stackable":false,"value":1420},"152":{"id":152,"name":"Staff","stackable":false,"value":11},"153":{"id":153,"name":"Oak staff","stackable":false,"value":40},"154":{"id":154,"name":"Willow staff","stackable":false,"value":124},"155":{"id":155,"name":"Maple staff","stackable":false,"value":258},"156":{"id":156,"name":"Yew staff","stackable":false,"value":595},"157":{"id":157,"name":"Magic staff","stackable":false,"value":1420},"160":{"id":160,"name":"Potato seed","stackable":true,"value":2},"161":{"id":161,"name":"Glowcap spore","stackable":true,"value":6},"162":{"id":162,"name":"Turnip seed","stackable":true,"value":14},"163":{"id":163,"name":"Bitterroot seed","stackable":true,"value":30},"164":{"id":164,"name":"Voidmelon seed","stackable":true,"value":60},"165":{"id":165,"name":"Pepper seed","stackable":true,"value":110},"170":{"id":170,"name":"Potato","stackable":false,"value":7,"heals":3},"171":{"id":171,"name":"Glowcap","stackable":false,"value":22,"heals":5},"172":{"id":172,"name":"Cave turnip","stackable":false,"value":55,"heals":7},"173":{"id":173,"name":"Bitterroot","stackable":false,"value":120,"heals":10},"174":{"id":174,"name":"Voidmelon","stackable":false,"value":260,"heals":14},"175":{"id":175,"name":"Ember pepper","stackable":false,"value":520,"heals":20},"180":{"id":180,"name":"Cut gem","stackable":true,"value":2505},"181":{"id":181,"name":"Silver ring","stackable":false,"value":2563},"182":{"id":182,"name":"Gold ring","stackable":false,"value":2703},"183":{"id":183,"name":"Meteoric ring","stackable":false,"value":6757},"184":{"id":184,"name":"Silver amulet","stackable":false,"value":2579},"185":{"id":185,"name":"Gold amulet","stackable":false,"value":2741},"186":{"id":186,"name":"Meteoric amulet","stackable":false,"value":6944},"190":{"id":190,"name":"Sage seed","stackable":true,"value":6},"191":{"id":191,"name":"Nightshade seed","stackable":true,"value":40},"192":{"id":192,"name":"Dragonleaf seed","stackable":true,"value":220},"193":{"id":193,"name":"Sage","stackable":true,"value":18},"194":{"id":194,"name":"Nightshade","stackable":true,"value":110},"195":{"id":195,"name":"Dragonleaf","stackable":true,"value":520},"200":{"id":200,"name":"Coins","stackable":true,"value":1},"201":{"id":201,"name":"Gnawed charm","stackable":true,"value":1500},"202":{"id":202,"name":"Bog pearl","stackable":true,"value":4000},"203":{"id":203,"name":"Dry sigil","stackable":true,"value":12000},"204":{"id":204,"name":"Cairn token","stackable":true,"value":40000},"205":{"id":205,"name":"Rime fang","stackable":true,"value":120000},"206":{"id":206,"name":"Ember heart","stackable":true,"value":350000},"207":{"id":207,"name":"Abyssal eye","stackable":true,"value":900000},"208":{"id":208,"name":"Voidshard","stackable":true,"value":1500},"209":{"id":209,"name":"Gravemaw skull","stackable":false,"value":250000},"210":{"id":210,"name":"Hollow crown","stackable":false,"value":1000000},"211":{"id":211,"name":"Riftborne heart","stackable":false,"value":4000000},"212":{"id":212,"name":"Colossus core","stackable":false,"value":15000000},"213":{"id":213,"name":"Wraith ash","stackable":true,"value":15000},"214":{"id":214,"name":"Stalker fang","stackable":true,"value":30000},"215":{"id":215,"name":"Troll tusk","stackable":true,"value":50000},"216":{"id":216,"name":"Wight crown","stackable":true,"value":120000},"217":{"id":217,"name":"Drake scale","stackable":true,"value":250000},"218":{"id":218,"name":"Colossus ember","stackable":true,"value":500000},"220":{"id":220,"name":"Gatherer's draught","stackable":true,"value":28},"221":{"id":221,"name":"Hunter's brew","stackable":true,"value":272},"222":{"id":222,"name":"Warrior's tonic","stackable":true,"value":835},"223":{"id":223,"name":"Elixir of the vein","stackable":true,"value":1643},"224":{"id":224,"name":"Abyssal tonic","stackable":true,"value":2103},"225":{"id":225,"name":"Swift draught","stackable":true,"value":96},"226":{"id":226,"name":"Nourishing draught","stackable":true,"value":387},"227":{"id":227,"name":"Haste draught","stackable":true,"value":1205},"240":{"id":240,"name":"Gnawer pelt","stackable":true,"value":5},"241":{"id":241,"name":"Bogling skin","stackable":true,"value":12},"242":{"id":242,"name":"Husk chitin","stackable":true,"value":60},"243":{"id":243,"name":"Cairn bone","stackable":true,"value":120},"244":{"id":244,"name":"Wraith dust","stackable":true,"value":200},"245":{"id":245,"name":"Rimewolf fur","stackable":true,"value":500},"246":{"id":246,"name":"Stalker claw","stackable":true,"value":700},"247":{"id":247,"name":"Ember scale","stackable":true,"value":1200},"248":{"id":248,"name":"Troll hide","stackable":true,"value":800},"249":{"id":249,"name":"Horror ichor","stackable":true,"value":1000},"250":{"id":250,"name":"Ice wight shard","stackable":true,"value":1500},"251":{"id":251,"name":"Drake hide","stackable":true,"value":2000},"252":{"id":252,"name":"Colossus chip","stackable":true,"value":3000},"260":{"id":260,"name":"Pelt coif","stackable":false,"value":15},"261":{"id":261,"name":"Pelt jerkin","stackable":false,"value":30},"262":{"id":262,"name":"Pelt chaps","stackable":false,"value":20},"263":{"id":263,"name":"Bogskin coif","stackable":false,"value":34},"264":{"id":264,"name":"Bogskin jerkin","stackable":false,"value":70},"265":{"id":265,"name":"Bogskin chaps","stackable":false,"value":46},"266":{"id":266,"name":"Chitin coif","stackable":false,"value":154},"267":{"id":267,"name":"Chitin jerkin","stackable":false,"value":334},"268":{"id":268,"name":"Chitin chaps","stackable":false,"value":214},"269":{"id":269,"name":"Fur coif","stackable":false,"value":1115},"270":{"id":270,"name":"Fur jerkin","stackable":false,"value":2615},"271":{"id":271,"name":"Fur chaps","stackable":false,"value":1615},"272":{"id":272,"name":"Scale coif","stackable":false,"value":2807},"273":{"id":273,"name":"Scale jerkin","stackable":false,"value":6407},"274":{"id":274,"name":"Scale chaps","stackable":false,"value":4007},"280":{"id":280,"name":"Gnawer pup","stackable":false,"value":0},"281":{"id":281,"name":"Bogling tadpole","stackable":false,"value":0},"282":{"id":282,"name":"Husk grub","stackable":false,"value":0},"283":{"id":283,"name":"Cairn wisp","stackable":false,"value":0},"284":{"id":284,"name":"Rimewolf cub","stackable":false,"value":0},"285":{"id":285,"name":"Emberkin spark","stackable":false,"value":0},"286":{"id":286,"name":"Horror spawn","stackable":false,"value":0},"287":{"id":287,"name":"Wraith mote","stackable":false,"value":0},"288":{"id":288,"name":"Stalker kit","stackable":false,"value":0},"289":{"id":289,"name":"Frost troll whelp","stackable":false,"value":0},"290":{"id":290,"name":"Ice wight shard-child","stackable":false,"value":0},"291":{"id":291,"name":"Ash drake hatchling","stackable":false,"value":0},"292":{"id":292,"name":"Cinder ember","stackable":false,"value":0},"293":{"id":293,"name":"Gem pack","stackable":true,"value":10},"294":{"id":294,"name":"Pouch of gems","stackable":true,"value":1200},"295":{"id":295,"name":"Chest of gems","stackable":true,"value":2600},"296":{"id":296,"name":"Vein of gems","stackable":true,"value":7000},"297":{"id":297,"name":"Hoard of gems","stackable":true,"value":15000},"300":{"id":300,"name":"Homespun bolt","stackable":true,"value":12},"301":{"id":301,"name":"Silk bolt","stackable":true,"value":70},"302":{"id":302,"name":"Gilded bolt","stackable":true,"value":260},"303":{"id":303,"name":"Voidweave bolt","stackable":true,"value":900},"304":{"id":304,"name":"Homespun hood","stackable":false,"value":29},"305":{"id":305,"name":"Homespun robe","stackable":false,"value":65},"306":{"id":306,"name":"Homespun skirt","stackable":false,"value":41},"307":{"id":307,"name":"Silk hood","stackable":false,"value":166},"308":{"id":308,"name":"Silk robe","stackable":false,"value":376},"309":{"id":309,"name":"Silk skirt","stackable":false,"value":236},"310":{"id":310,"name":"Gilded hood","stackable":false,"value":597},"311":{"id":311,"name":"Gilded robe","stackable":false,"value":1377},"312":{"id":312,"name":"Gilded skirt","stackable":false,"value":857},"313":{"id":313,"name":"Voidweave hood","stackable":false,"value":2020},"314":{"id":314,"name":"Voidweave robe","stackable":false,"value":4720},"315":{"id":315,"name":"Voidweave skirt","stackable":false,"value":2920},"316":{"id":316,"name":"Rock mite nymph","stackable":false,"value":0},"317":{"id":317,"name":"Fen lurker spawn","stackable":false,"value":0},"318":{"id":318,"name":"Grave beetle grub","stackable":false,"value":0},"319":{"id":319,"name":"Sump crawler hatchling","stackable":false,"value":0},"320":{"id":320,"name":"Stone eater pebble","stackable":false,"value":0},"321":{"id":321,"name":"Barrow pup","stackable":false,"value":0},"322":{"id":322,"name":"Chalk wightling","stackable":false,"value":0},"323":{"id":323,"name":"Pelt gloves","stackable":false,"value":75},"324":{"id":324,"name":"Bogskin gloves","stackable":false,"value":4000},"325":{"id":325,"name":"Chitin gloves","stackable":false,"value":12000},"326":{"id":326,"name":"Bone gloves","stackable":false,"value":40000},"327":{"id":327,"name":"Scale gloves","stackable":false,"value":350000},"328":{"id":328,"name":"Horse","stackable":false,"value":10000},"329":{"id":329,"name":"Pelt quiver","stackable":false,"value":18},"330":{"id":330,"name":"Bogskin quiver","stackable":false,"value":49},"331":{"id":331,"name":"Chitin quiver","stackable":false,"value":199},"332":{"id":332,"name":"Fur quiver","stackable":false,"value":1215},"333":{"id":333,"name":"Scale quiver","stackable":false,"value":3047},"334":{"id":334,"name":"Linen grimoire","stackable":false,"value":41},"335":{"id":335,"name":"Silk grimoire","stackable":false,"value":248},"336":{"id":336,"name":"Gilded grimoire","stackable":false,"value":1057},"337":{"id":337,"name":"Voidweave grimoire","stackable":false,"value":4320},"338":{"id":338,"name":"Troll coif","stackable":false,"value":2183},"339":{"id":339,"name":"Troll jerkin","stackable":false,"value":4583},"340":{"id":340,"name":"Troll chaps","stackable":false,"value":2983},"341":{"id":341,"name":"Drake coif","stackable":false,"value":4650},"342":{"id":342,"name":"Drake jerkin","stackable":false,"value":10650},"343":{"id":343,"name":"Drake chaps","stackable":false,"value":6650},"344":{"id":344,"name":"Wightweave hood","stackable":false,"value":3800},"345":{"id":345,"name":"Wightweave robe","stackable":false,"value":9500},"346":{"id":346,"name":"Wightweave skirt","stackable":false,"value":6200},"347":{"id":347,"name":"Troll quiver","stackable":false,"value":2783},"348":{"id":348,"name":"Drake quiver","stackable":false,"value":5850},"349":{"id":349,"name":"Wightweave grimoire","stackable":false,"value":6200},"350":{"id":350,"name":"Colossus blade","stackable":false,"value":11231},"351":{"id":351,"name":"Colossus shield","stackable":false,"value":11231},"352":{"id":352,"name":"Colossus helm","stackable":false,"value":6704},"353":{"id":353,"name":"Colossus plate","stackable":false,"value":17285},"354":{"id":354,"name":"Colossus greaves","stackable":false,"value":12758},"355":{"id":355,"name":"Leviathan scale","stackable":true,"value":20000},"356":{"id":356,"name":"Wyrm ember","stackable":true,"value":20000},"357":{"id":357,"name":"Leviathan amulet","stackable":false,"value":25593},"358":{"id":358,"name":"Wyrm ring","stackable":false,"value":25593},"359":{"id":359,"name":"Protection scroll","stackable":true,"value":10},"360":{"id":360,"name":"Bronze pan","stackable":false,"value":17},"361":{"id":361,"name":"Iron pan","stackable":false,"value":32},"362":{"id":362,"name":"Steel pan","stackable":false,"value":190},"363":{"id":363,"name":"Cobalt pan","stackable":false,"value":775},"364":{"id":364,"name":"Meteoric pan","stackable":false,"value":1934},"365":{"id":365,"name":"Bronze hammer","stackable":false,"value":29},"366":{"id":366,"name":"Iron hammer","stackable":false,"value":54},"367":{"id":367,"name":"Steel hammer","stackable":false,"value":346},"368":{"id":368,"name":"Cobalt hammer","stackable":false,"value":1435},"369":{"id":369,"name":"Meteoric hammer","stackable":false,"value":3461},"370":{"id":370,"name":"Bronze knife","stackable":false,"value":17},"371":{"id":371,"name":"Iron knife","stackable":false,"value":32},"372":{"id":372,"name":"Steel knife","stackable":false,"value":190},"373":{"id":373,"name":"Cobalt knife","stackable":false,"value":775},"374":{"id":374,"name":"Meteoric knife","stackable":false,"value":1934},"375":{"id":375,"name":"Bronze needle","stackable":false,"value":17},"376":{"id":376,"name":"Iron needle","stackable":false,"value":32},"377":{"id":377,"name":"Steel needle","stackable":false,"value":190},"378":{"id":378,"name":"Cobalt needle","stackable":false,"value":775},"379":{"id":379,"name":"Meteoric needle","stackable":false,"value":1934},"380":{"id":380,"name":"Bronze mortar","stackable":false,"value":29},"381":{"id":381,"name":"Iron mortar","stackable":false,"value":54},"382":{"id":382,"name":"Steel mortar","stackable":false,"value":346},"383":{"id":383,"name":"Cobalt mortar","stackable":false,"value":1435},"384":{"id":384,"name":"Meteoric mortar","stackable":false,"value":3461},"385":{"id":385,"name":"Bronze hoe","stackable":false,"value":23},"386":{"id":386,"name":"Iron hoe","stackable":false,"value":62},"387":{"id":387,"name":"Steel hoe","stackable":false,"value":280},"388":{"id":388,"name":"Cobalt hoe","stackable":false,"value":1255},"389":{"id":389,"name":"Meteoric hoe","stackable":false,"value":3134},"390":{"id":390,"name":"Bronze greatsword","stackable":false,"value":29},"391":{"id":391,"name":"Iron greatsword","stackable":false,"value":54},"392":{"id":392,"name":"Steel greatsword","stackable":false,"value":346},"393":{"id":393,"name":"Cobalt greatsword","stackable":false,"value":1435},"394":{"id":394,"name":"Meteoric greatsword","stackable":false,"value":3461},"395":{"id":395,"name":"Colossus greatsword","stackable":false,"value":12704},"396":{"id":396,"name":"Golden Week gift box","stackable":true,"value":25},"400":{"id":400,"name":"Pebble golem","stackable":false,"value":0},"401":{"id":401,"name":"Baby kraken","stackable":false,"value":0},"402":{"id":402,"name":"Acorn squirrel","stackable":false,"value":0},"403":{"id":403,"name":"Queen bee","stackable":false,"value":0},"404":{"id":404,"name":"Raccoon","stackable":false,"value":0},"405":{"id":405,"name":"Chef rat","stackable":false,"value":0},"406":{"id":406,"name":"Ember salamander","stackable":false,"value":0},"407":{"id":407,"name":"Fletch falcon","stackable":false,"value":0},"408":{"id":408,"name":"Toadstool","stackable":false,"value":0},"409":{"id":409,"name":"Yarn kitten","stackable":false,"value":0},"410":{"id":410,"name":"Star fairy","stackable":false,"value":0}},"toolSkills":{"pickaxe":"mining","rod":"fishing","axe":"woodcutting","gloves":"thieving","pan":"cooking","hammer":"smithing","knife":"fletching","needle":"crafting","mortar":"herblore","hoe":"farming"},"rarityMultipliers":[1,1.3,1.6,2.2,3],"enhanceScale":0.06,"sites":[{"id":1,"x":187,"y":78,"kind":"rock","jobIds":[1]},{"id":2,"x":194,"y":91,"kind":"rock","jobIds":[2]},{"id":3,"x":200,"y":60,"kind":"rock","jobIds":[1]},{"id":4,"x":196,"y":62,"kind":"rock","jobIds":[1]},{"id":5,"x":200,"y":56,"kind":"rock","jobIds":[2]},{"id":6,"x":192,"y":63,"kind":"rock","jobIds":[2]},{"id":7,"x":196,"y":57,"kind":"rock","jobIds":[3]},{"id":8,"x":200,"y":52,"kind":"rock","jobIds":[3]},{"id":9,"x":204,"y":55,"kind":"rock","jobIds":[3]},{"id":10,"x":200,"y":45,"kind":"rock","jobIds":[4]},{"id":11,"x":196,"y":49,"kind":"rock","jobIds":[4]},{"id":12,"x":204,"y":49,"kind":"rock","jobIds":[4]},{"id":13,"x":198,"y":37,"kind":"rock","jobIds":[5]},{"id":14,"x":202,"y":40,"kind":"rock","jobIds":[5]},{"id":15,"x":197,"y":41,"kind":"rock","jobIds":[5]},{"id":16,"x":194,"y":37,"kind":"rock","jobIds":[6]},{"id":17,"x":190,"y":41,"kind":"rock","jobIds":[6]},{"id":18,"x":186,"y":45,"kind":"rock","jobIds":[6]},{"id":19,"x":190,"y":33,"kind":"rock","jobIds":[7]},{"id":20,"x":186,"y":37,"kind":"rock","jobIds":[7]},{"id":21,"x":182,"y":41,"kind":"rock","jobIds":[7]},{"id":22,"x":181,"y":35,"kind":"rock","jobIds":[8]},{"id":23,"x":177,"y":39,"kind":"rock","jobIds":[8]},{"id":24,"x":185,"y":33,"kind":"rock","jobIds":[8]},{"id":25,"x":214,"y":83,"kind":"fishing","jobIds":[21]},{"id":26,"x":216,"y":79,"kind":"fishing","jobIds":[21]},{"id":27,"x":214,"y":89,"kind":"fishing","jobIds":[22]},{"id":28,"x":208,"y":65,"kind":"fishing","jobIds":[22]},{"id":29,"x":218,"y":75,"kind":"fishing","jobIds":[23]},{"id":30,"x":205,"y":60,"kind":"fishing","jobIds":[23]},{"id":31,"x":212,"y":67,"kind":"fishing","jobIds":[24]},{"id":32,"x":217,"y":93,"kind":"fishing","jobIds":[24]},{"id":33,"x":216,"y":69,"kind":"fishing","jobIds":[25]},{"id":34,"x":230,"y":82,"kind":"fishing","jobIds":[25]},{"id":35,"x":220,"y":71,"kind":"fishing","jobIds":[26]},{"id":36,"x":205,"y":54,"kind":"fishing","jobIds":[26]},{"id":37,"x":168,"y":80,"kind":"fishing","jobIds":[27]},{"id":38,"x":171,"y":87,"kind":"fishing","jobIds":[27]},{"id":39,"x":221,"y":95,"kind":"fishing","jobIds":[28]},{"id":40,"x":173,"y":91,"kind":"fishing","jobIds":[28]},{"id":42,"x":197,"y":85,"kind":"furnace","jobIds":[41,42,43,44,45]},{"id":43,"x":204,"y":86,"kind":"anvil","jobIds":[51,52,53,54,55,56,57,58,59,60,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,46,47,48,49,50,110,111,112,113,114,338,339,340,341,342,343,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,301,302,303,304,305,140,141,142,143,144,145,146,147,148,149,150,151,200,201,202,203,204,205,230,231,232,233,307,234,235,236,306,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,289,290,291,292,293,294,248,249,250,251,252,253,254,255,256,257,258,259,295,296,297,275,276,277,278,280,281,282,283,284,298,299,285,286,287,288,300,279]},{"id":44,"x":202,"y":83,"kind":"fire","jobIds":[61,62,63,64,65,66,67,68,220,225,226,227,221,222,223,224]},{"id":46,"x":113,"y":177,"kind":"furnace","jobIds":[41,42,43,44,45]},{"id":47,"x":113,"y":180,"kind":"anvil","jobIds":[51,52,53,54,55,56,57,58,59,60,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,46,47,48,49,50,110,111,112,113,114,338,339,340,341,342,343,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,301,302,303,304,305,140,141,142,143,144,145,146,147,148,149,150,151,200,201,202,203,204,205,230,231,232,233,307,234,235,236,306,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,289,290,291,292,293,294,248,249,250,251,252,253,254,255,256,257,258,259,295,296,297,275,276,277,278,280,281,282,283,284,298,299,285,286,287,288,300,279]},{"id":48,"x":110,"y":179,"kind":"fire","jobIds":[61,62,63,64,65,66,67,68,220,225,226,227,221,222,223,224]},{"id":56,"x":172,"y":39,"kind":"tree","jobIds":[30]},{"id":57,"x":167,"y":43,"kind":"tree","jobIds":[30]},{"id":58,"x":174,"y":34,"kind":"tree","jobIds":[30]},{"id":59,"x":174,"y":29,"kind":"tree","jobIds":[31]},{"id":60,"x":169,"y":34,"kind":"tree","jobIds":[31]},{"id":61,"x":162,"y":41,"kind":"tree","jobIds":[31]},{"id":62,"x":171,"y":23,"kind":"tree","jobIds":[32]},{"id":63,"x":166,"y":28,"kind":"tree","jobIds":[32]},{"id":64,"x":161,"y":33,"kind":"tree","jobIds":[32]},{"id":65,"x":168,"y":18,"kind":"tree","jobIds":[33]},{"id":66,"x":163,"y":23,"kind":"tree","jobIds":[33]},{"id":67,"x":158,"y":28,"kind":"tree","jobIds":[33]},{"id":68,"x":161,"y":16,"kind":"tree","jobIds":[34]},{"id":69,"x":156,"y":21,"kind":"tree","jobIds":[34]},{"id":70,"x":151,"y":26,"kind":"tree","jobIds":[34]},{"id":71,"x":151,"y":18,"kind":"tree","jobIds":[35]},{"id":72,"x":146,"y":25,"kind":"tree","jobIds":[35]},{"id":73,"x":156,"y":16,"kind":"tree","jobIds":[35]},{"id":74,"x":207,"y":93,"kind":"field","jobIds":[160,161,162,163,164,165,210,211,212]},{"id":75,"x":209,"y":93,"kind":"field","jobIds":[160,161,162,163,164,165,210,211,212]},{"id":76,"x":211,"y":93,"kind":"field","jobIds":[160,161,162,163,164,165,210,211,212]},{"id":77,"x":207,"y":97,"kind":"field","jobIds":[160,161,162,163,164,165,210,211,212]},{"id":78,"x":209,"y":97,"kind":"field","jobIds":[160,161,162,163,164,165,210,211,212]},{"id":79,"x":211,"y":97,"kind":"field","jobIds":[160,161,162,163,164,165,210,211,212]},{"id":80,"x":196,"y":77,"kind":"stall","jobIds":[240]},{"id":81,"x":198,"y":77,"kind":"stall","jobIds":[241]},{"id":82,"x":200,"y":77,"kind":"stall","jobIds":[242]},{"id":83,"x":202,"y":77,"kind":"stall","jobIds":[243]},{"id":84,"x":115,"y":179,"kind":"stall","jobIds":[240]},{"id":85,"x":115,"y":181,"kind":"stall","jobIds":[241]},{"id":86,"x":112,"y":182,"kind":"stall","jobIds":[242]},{"id":87,"x":116,"y":171,"kind":"stall","jobIds":[243]},{"id":359,"x":199,"y":86,"kind":"stall","jobIds":[244]},{"id":360,"x":195,"y":83,"kind":"stall","jobIds":[245]},{"id":361,"x":201,"y":87,"kind":"stall","jobIds":[246]},{"id":362,"x":195,"y":88,"kind":"stall","jobIds":[247]},{"id":363,"x":104,"y":180,"kind":"stall","jobIds":[244]},{"id":364,"x":114,"y":170,"kind":"stall","jobIds":[245]},{"id":365,"x":117,"y":173,"kind":"stall","jobIds":[246]},{"id":366,"x":117,"y":181,"kind":"stall","jobIds":[247]}],"banks":[{"id":1,"x":200,"y":82,"approach":{"x":200,"y":83}},{"id":2,"x":110,"y":177,"approach":{"x":110,"y":178}}],"zones":[{"id":1,"name":"The Warrens","monsterId":1,"population":10,"x":191,"y":133,"width":12,"height":12},{"id":2,"name":"Mirefen","monsterId":2,"population":10,"x":204,"y":147,"width":12,"height":12},{"id":3,"name":"Dust Hollow","monsterId":3,"population":10,"x":242,"y":58,"width":12,"height":12},{"id":4,"name":"The Cairns","monsterId":4,"population":12,"x":128,"y":185,"width":13,"height":13},{"id":5,"name":"Frostmarch","monsterId":5,"population":10,"x":224,"y":167,"width":12,"height":12},{"id":6,"name":"Cinder Reach","monsterId":6,"population":12,"x":80,"y":22,"width":13,"height":13},{"id":7,"name":"The Deep","monsterId":7,"population":10,"x":67,"y":9,"width":12,"height":12},{"id":8,"name":"Sunscar Dunes","monsterId":8,"population":10,"x":175,"y":209,"width":11,"height":11},{"id":9,"name":"The Glass Flats","monsterId":9,"population":12,"x":92,"y":51,"width":12,"height":12},{"id":10,"name":"Frostwild Hollow","monsterId":10,"population":12,"x":12,"y":128,"width":12,"height":12},{"id":11,"name":"Rimeholt","monsterId":11,"population":12,"x":14,"y":100,"width":12,"height":12},{"id":12,"name":"Ashfall","monsterId":12,"population":12,"x":61,"y":38,"width":12,"height":12},{"id":13,"name":"The Cinder Throne","monsterId":13,"population":12,"x":47,"y":23,"width":12,"height":12},{"id":14,"name":"The Scree","monsterId":14,"population":12,"x":229,"y":104,"width":12,"height":12},{"id":15,"name":"Sallow Reach","monsterId":15,"population":14,"x":148,"y":185,"width":13,"height":13},{"id":16,"name":"The Boneyard","monsterId":16,"population":10,"x":49,"y":160,"width":11,"height":11},{"id":17,"name":"Sunken Row","monsterId":17,"population":12,"x":168,"y":174,"width":12,"height":12},{"id":18,"name":"Gritmaw","monsterId":18,"population":14,"x":64,"y":198,"width":13,"height":13},{"id":19,"name":"Hollowbarrow","monsterId":19,"population":12,"x":81,"y":106,"width":12,"height":12},{"id":20,"name":"The Chalk Steps","monsterId":20,"population":14,"x":214,"y":11,"width":13,"height":13}],"monsters":[{"id":1,"name":"Gnawer","level":2,"hp":8,"maxHit":1,"attack":1,"defence":1,"speed":4,"xp":8,"gold":[1,2],"bonus":{"itemId":201,"chance":0.0004},"drop":240},{"id":2,"name":"Bogling","level":8,"hp":18,"maxHit":3,"attack":8,"defence":6,"speed":4,"xp":22,"gold":[2,4],"bonus":{"itemId":202,"chance":0.0006},"drop":241},{"id":3,"name":"Husk","level":20,"hp":40,"maxHit":6,"attack":20,"defence":18,"speed":4,"xp":60,"gold":[17,32],"bonus":{"itemId":203,"chance":0.0008},"drop":242},{"id":4,"name":"Cairn wight","level":40,"hp":75,"maxHit":10,"attack":40,"defence":38,"speed":4,"xp":165,"gold":[117,217],"bonus":{"itemId":204,"chance":0.001},"drop":243},{"id":5,"name":"Rimewolf","level":60,"hp":120,"maxHit":15,"attack":62,"defence":58,"speed":4,"xp":380,"gold":[369,685],"bonus":{"itemId":205,"chance":0.0014},"drop":245},{"id":6,"name":"Emberkin","level":80,"hp":180,"maxHit":22,"attack":85,"defence":80,"speed":5,"xp":780,"gold":[837,1554],"bonus":{"itemId":206,"chance":0.002},"drop":247},{"id":7,"name":"Deep horror","level":95,"hp":260,"maxHit":30,"attack":100,"defence":96,"speed":5,"xp":1500,"gold":[1365,2535],"bonus":{"itemId":207,"chance":0.0015},"drop":249,"dropChance":0.5},{"id":8,"name":"Sand wraith","level":50,"hp":95,"maxHit":12,"attack":50,"defence":48,"speed":4,"xp":250,"gold":[220,409],"bonus":{"itemId":213,"chance":0.0012},"drop":244},{"id":9,"name":"Dune stalker","level":70,"hp":150,"maxHit":18,"attack":72,"defence":68,"speed":4,"xp":550,"gold":[572,1063],"bonus":{"itemId":214,"chance":0.0016},"drop":246},{"id":10,"name":"Frost troll","level":85,"hp":210,"maxHit":25,"attack":90,"defence":84,"speed":5,"xp":1000,"gold":[994,1847],"bonus":{"itemId":215,"chance":0.0011},"drop":248,"dropChance":0.5},{"id":11,"name":"Ice wight","level":105,"hp":300,"maxHit":34,"attack":112,"defence":106,"speed":5,"xp":2000,"gold":[1509,2802],"bonus":{"itemId":216,"chance":0.0015},"drop":250,"dropChance":0.5},{"id":12,"name":"Ash drake","level":120,"hp":360,"maxHit":40,"attack":128,"defence":120,"speed":5,"xp":2800,"gold":[1724,3202],"bonus":{"itemId":217,"chance":0.00175},"drop":251,"dropChance":0.5},{"id":13,"name":"Cinder colossus","level":140,"hp":440,"maxHit":48,"attack":150,"defence":140,"speed":6,"xp":4000,"gold":[2012,3736],"bonus":{"itemId":218,"chance":0.002},"drop":252,"dropChance":0.5},{"id":14,"name":"Rock mite","level":3,"hp":10,"maxHit":1,"attack":3,"defence":2,"speed":4,"xp":11,"gold":[1,2],"bonus":{"itemId":201,"chance":0.0004},"drop":240},{"id":15,"name":"Fen lurker","level":5,"hp":13,"maxHit":2,"attack":5,"defence":4,"speed":4,"xp":15,"gold":[1,2],"bonus":{"itemId":201,"chance":0.0005},"drop":240},{"id":16,"name":"Grave beetle","level":12,"hp":26,"maxHit":4,"attack":12,"defence":10,"speed":4,"xp":34,"gold":[4,9],"bonus":{"itemId":202,"chance":0.0006},"drop":241},{"id":17,"name":"Sump crawler","level":16,"hp":33,"maxHit":5,"attack":16,"defence":14,"speed":4,"xp":46,"gold":[9,18],"bonus":{"itemId":202,"chance":0.0007},"drop":241},{"id":18,"name":"Stone eater","level":22,"hp":44,"maxHit":6,"attack":22,"defence":20,"speed":4,"xp":70,"gold":[22,41],"bonus":{"itemId":203,"chance":0.0008},"drop":242},{"id":19,"name":"Barrow hound","level":26,"hp":51,"maxHit":7,"attack":26,"defence":24,"speed":4,"xp":91,"gold":[35,65],"bonus":{"itemId":203,"chance":0.0009},"drop":242},{"id":20,"name":"Chalk wight","level":32,"hp":61,"maxHit":8,"attack":32,"defence":30,"speed":4,"xp":122,"gold":[62,116],"bonus":{"itemId":203,"chance":0.001},"drop":242}],"farmUnlocks":[1,1,15,30,45,60],"farmWaterTrim":20,"plusScale":10000,"rarityScale":1000,"rarityXp":[1,1.5,3,8,25],"rarityChance":{"legendary":0.000006666666666666667,"epic":0.000125,"rare":0.0025,"uncommon":0.025},"toolLuck":[0,0.25,0.75,2,5],"enhanceGold":[100,300,1000,3000,8000,20000],"enhanceThresholds":[15,30,50,75,90],"enhanceShards":3,"shardId":208,"coinId":200,"formulaBaseline":"index-BH7O_PDX.js","foodHealingMultipliers":[1,1.2,1.5,2,3]};
/* Acorn
MIT License

Copyright (C) 2012-2022 by various contributors (see AUTHORS)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
const parsePublicClient=(()=>{const exports={},module={exports};
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.acorn = {}));
})(this, (function (exports) { 'use strict';

  // This file was generated. Do not modify manually!
  var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 80, 3, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 343, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 726, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];

  // This file was generated. Do not modify manually!
  var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 2, 60, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 42, 9, 8936, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 496, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4153, 7, 221, 3, 5761, 15, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 4191];

  // This file was generated. Do not modify manually!
  var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u0897-\u089f\u08ca-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3c\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0cf3\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ece\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u180f-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf-\u1ace\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\u30fb\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f\uff65";

  // This file was generated. Do not modify manually!
  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u0870-\u0887\u0889-\u088e\u08a0-\u08c9\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c5d\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cdd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1711\u171f-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4c\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c8a\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7cd\ua7d0\ua7d1\ua7d3\ua7d5-\ua7dc\ua7f2-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";

  // These are a run-length and offset encoded representation of the
  // >0xffff code points that are a valid part of identifiers. The
  // offset starts at 0x10000, and each pair of numbers represents an
  // offset to the next range, and then a size of the range.

  // Reserved word lists for various dialects of the language

  var reservedWords = {
    3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
    5: "class enum extends super const export import",
    6: "enum",
    strict: "implements interface let package private protected public static yield",
    strictBind: "eval arguments"
  };

  // And the keywords

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

  var keywords$1 = {
    5: ecma5AndLessKeywords,
    "5module": ecma5AndLessKeywords + " export import",
    6: ecma5AndLessKeywords + " const class extends export import super"
  };

  var keywordRelationalOperator = /^in(stanceof)?$/;

  // ## Character categories

  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  // This has a complexity linear to the value of the code. The
  // assumption is that looking up astral identifier characters is
  // rare.
  function isInAstralSet(code, set) {
    var pos = 0x10000;
    for (var i = 0; i < set.length; i += 2) {
      pos += set[i];
      if (pos > code) { return false }
      pos += set[i + 1];
      if (pos >= code) { return true }
    }
    return false
  }

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code, astral) {
    if (code < 65) { return code === 36 }
    if (code < 91) { return true }
    if (code < 97) { return code === 95 }
    if (code < 123) { return true }
    if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
    if (astral === false) { return false }
    return isInAstralSet(code, astralIdentifierStartCodes)
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code, astral) {
    if (code < 48) { return code === 36 }
    if (code < 58) { return true }
    if (code < 65) { return false }
    if (code < 91) { return true }
    if (code < 97) { return code === 95 }
    if (code < 123) { return true }
    if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
    if (astral === false) { return false }
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // The `startsExpr` property is used to check if the token ends a
  // `yield` expression. It is set on all token types that either can
  // directly start an expression (like a quotation mark) or can
  // continue an expression (like the body of a string).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var TokenType = function TokenType(label, conf) {
    if ( conf === void 0 ) conf = {};

    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop || null;
    this.updateContext = null;
  };

  function binop(name, prec) {
    return new TokenType(name, {beforeExpr: true, binop: prec})
  }
  var beforeExpr = {beforeExpr: true}, startsExpr = {startsExpr: true};

  // Map keyword names to token types.

  var keywords = {};

  // Succinct definitions of keyword token types
  function kw(name, options) {
    if ( options === void 0 ) options = {};

    options.keyword = name;
    return keywords[name] = new TokenType(name, options)
  }

  var types$1 = {
    num: new TokenType("num", startsExpr),
    regexp: new TokenType("regexp", startsExpr),
    string: new TokenType("string", startsExpr),
    name: new TokenType("name", startsExpr),
    privateId: new TokenType("privateId", startsExpr),
    eof: new TokenType("eof"),

    // Punctuation token types.
    bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
    bracketR: new TokenType("]"),
    braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
    braceR: new TokenType("}"),
    parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
    parenR: new TokenType(")"),
    comma: new TokenType(",", beforeExpr),
    semi: new TokenType(";", beforeExpr),
    colon: new TokenType(":", beforeExpr),
    dot: new TokenType("."),
    question: new TokenType("?", beforeExpr),
    questionDot: new TokenType("?."),
    arrow: new TokenType("=>", beforeExpr),
    template: new TokenType("template"),
    invalidTemplate: new TokenType("invalidTemplate"),
    ellipsis: new TokenType("...", beforeExpr),
    backQuote: new TokenType("`", startsExpr),
    dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

    // Operators. These carry several kinds of properties to help the
    // parser use them properly (the presence of these properties is
    // what categorizes them as operators).
    //
    // `binop`, when present, specifies that this operator is a binary
    // operator, and will refer to its precedence.
    //
    // `prefix` and `postfix` mark the operator as a prefix or postfix
    // unary operator.
    //
    // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
    // binary operators with a very low precedence, that should result
    // in AssignmentExpression nodes.

    eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
    assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
    incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
    prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=/===/!==", 6),
    relational: binop("</>/<=/>=", 7),
    bitShift: binop("<</>>/>>>", 8),
    plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10),
    starstar: new TokenType("**", {beforeExpr: true}),
    coalesce: binop("??", 1),

    // Keyword token types.
    _break: kw("break"),
    _case: kw("case", beforeExpr),
    _catch: kw("catch"),
    _continue: kw("continue"),
    _debugger: kw("debugger"),
    _default: kw("default", beforeExpr),
    _do: kw("do", {isLoop: true, beforeExpr: true}),
    _else: kw("else", beforeExpr),
    _finally: kw("finally"),
    _for: kw("for", {isLoop: true}),
    _function: kw("function", startsExpr),
    _if: kw("if"),
    _return: kw("return", beforeExpr),
    _switch: kw("switch"),
    _throw: kw("throw", beforeExpr),
    _try: kw("try"),
    _var: kw("var"),
    _const: kw("const"),
    _while: kw("while", {isLoop: true}),
    _with: kw("with"),
    _new: kw("new", {beforeExpr: true, startsExpr: true}),
    _this: kw("this", startsExpr),
    _super: kw("super", startsExpr),
    _class: kw("class", startsExpr),
    _extends: kw("extends", beforeExpr),
    _export: kw("export"),
    _import: kw("import", startsExpr),
    _null: kw("null", startsExpr),
    _true: kw("true", startsExpr),
    _false: kw("false", startsExpr),
    _in: kw("in", {beforeExpr: true, binop: 7}),
    _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
    _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
    _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
    _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
  };

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n?|\n|\u2028|\u2029/;
  var lineBreakG = new RegExp(lineBreak.source, "g");

  function isNewLine(code) {
    return code === 10 || code === 13 || code === 0x2028 || code === 0x2029
  }

  function nextLineBreak(code, from, end) {
    if ( end === void 0 ) end = code.length;

    for (var i = from; i < end; i++) {
      var next = code.charCodeAt(i);
      if (isNewLine(next))
        { return i < end - 1 && next === 13 && code.charCodeAt(i + 1) === 10 ? i + 2 : i + 1 }
    }
    return -1
  }

  var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

  var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

  var ref = Object.prototype;
  var hasOwnProperty = ref.hasOwnProperty;
  var toString = ref.toString;

  var hasOwn = Object.hasOwn || (function (obj, propName) { return (
    hasOwnProperty.call(obj, propName)
  ); });

  var isArray = Array.isArray || (function (obj) { return (
    toString.call(obj) === "[object Array]"
  ); });

  var regexpCache = Object.create(null);

  function wordsRegexp(words) {
    return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"))
  }

  function codePointToString(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) { return String.fromCharCode(code) }
    code -= 0x10000;
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
  }

  var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;

  // These are used when `options.locations` is on, for the
  // `startLoc` and `endLoc` properties.

  var Position = function Position(line, col) {
    this.line = line;
    this.column = col;
  };

  Position.prototype.offset = function offset (n) {
    return new Position(this.line, this.column + n)
  };

  var SourceLocation = function SourceLocation(p, start, end) {
    this.start = start;
    this.end = end;
    if (p.sourceFile !== null) { this.source = p.sourceFile; }
  };

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  function getLineInfo(input, offset) {
    for (var line = 1, cur = 0;;) {
      var nextBreak = nextLineBreak(input, cur, offset);
      if (nextBreak < 0) { return new Position(line, offset - cur) }
      ++line;
      cur = nextBreak;
    }
  }

  // A second argument must be given to configure the parser process.
  // These options are recognized (only `ecmaVersion` is required):

  var defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must be
    // either 3, 5, 6 (or 2015), 7 (2016), 8 (2017), 9 (2018), 10
    // (2019), 11 (2020), 12 (2021), 13 (2022), 14 (2023), or `"latest"`
    // (the latest version the library supports). This influences
    // support for strict mode, the set of reserved words, and support
    // for new syntax features.
    ecmaVersion: null,
    // `sourceType` indicates the mode the code should be parsed in.
    // Can be either `"script"` or `"module"`. This influences global
    // strict mode and parsing of `import` and `export` declarations.
    sourceType: "script",
    // `onInsertedSemicolon` can be a callback that will be called when
    // a semicolon is automatically inserted. It will be passed the
    // position of the inserted semicolon as an offset, and if
    // `locations` is enabled, it is given the location as a `{line,
    // column}` object as second argument.
    onInsertedSemicolon: null,
    // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
    // trailing commas.
    onTrailingComma: null,
    // By default, reserved words are only enforced if ecmaVersion >= 5.
    // Set `allowReserved` to a boolean value to explicitly turn this on
    // an off. When this option has the value "never", reserved words
    // and keywords can also not be used as property names.
    allowReserved: null,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When enabled, import/export statements are not constrained to
    // appearing at the top of the program, and an import.meta expression
    // in a script isn't considered an error.
    allowImportExportEverywhere: false,
    // By default, await identifiers are allowed to appear at the top-level scope only if ecmaVersion >= 2022.
    // When enabled, await identifiers are allowed to appear at the top-level scope,
    // but they are still not allowed in non-async functions.
    allowAwaitOutsideFunction: null,
    // When enabled, super identifiers are not constrained to
    // appearing in methods and do not raise an error when they appear elsewhere.
    allowSuperOutsideMethod: null,
    // When enabled, hashbang directive in the beginning of file is
    // allowed and treated as a line comment. Enabled by default when
    // `ecmaVersion` >= 2023.
    allowHashBang: false,
    // By default, the parser will verify that private properties are
    // only used in places where they are valid and have been declared.
    // Set this to false to turn such checks off.
    checkPrivateFields: true,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokens returned from `tokenizer().getToken()`. Note
    // that you are not allowed to call the parser from the
    // callback—that will corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    // When this option has an array as value, objects representing the
    // comments are pushed to it.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null,
    // When enabled, parenthesized expressions are represented by
    // (non-standard) ParenthesizedExpression nodes
    preserveParens: false
  };

  // Interpret and default an options object

  var warnedAboutEcmaVersion = false;

  function getOptions(opts) {
    var options = {};

    for (var opt in defaultOptions)
      { options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt]; }

    if (options.ecmaVersion === "latest") {
      options.ecmaVersion = 1e8;
    } else if (options.ecmaVersion == null) {
      if (!warnedAboutEcmaVersion && typeof console === "object" && console.warn) {
        warnedAboutEcmaVersion = true;
        console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
      }
      options.ecmaVersion = 11;
    } else if (options.ecmaVersion >= 2015) {
      options.ecmaVersion -= 2009;
    }

    if (options.allowReserved == null)
      { options.allowReserved = options.ecmaVersion < 5; }

    if (!opts || opts.allowHashBang == null)
      { options.allowHashBang = options.ecmaVersion >= 14; }

    if (isArray(options.onToken)) {
      var tokens = options.onToken;
      options.onToken = function (token) { return tokens.push(token); };
    }
    if (isArray(options.onComment))
      { options.onComment = pushComment(options, options.onComment); }

    return options
  }

  function pushComment(options, array) {
    return function(block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? "Block" : "Line",
        value: text,
        start: start,
        end: end
      };
      if (options.locations)
        { comment.loc = new SourceLocation(this, startLoc, endLoc); }
      if (options.ranges)
        { comment.range = [start, end]; }
      array.push(comment);
    }
  }

  // Each scope gets a bitset that may contain these flags
  var
      SCOPE_TOP = 1,
      SCOPE_FUNCTION = 2,
      SCOPE_ASYNC = 4,
      SCOPE_GENERATOR = 8,
      SCOPE_ARROW = 16,
      SCOPE_SIMPLE_CATCH = 32,
      SCOPE_SUPER = 64,
      SCOPE_DIRECT_SUPER = 128,
      SCOPE_CLASS_STATIC_BLOCK = 256,
      SCOPE_CLASS_FIELD_INIT = 512,
      SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;

  function functionFlags(async, generator) {
    return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0)
  }

  // Used in checkLVal* and declareName to determine the type of a binding
  var
      BIND_NONE = 0, // Not a binding
      BIND_VAR = 1, // Var-style binding
      BIND_LEXICAL = 2, // Let- or const-style binding
      BIND_FUNCTION = 3, // Function declaration
      BIND_SIMPLE_CATCH = 4, // Simple (identifier pattern) catch binding
      BIND_OUTSIDE = 5; // Special case for function names as bound inside the function

  var Parser = function Parser(options, input, startPos) {
    this.options = options = getOptions(options);
    this.sourceFile = options.sourceFile;
    this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
    var reserved = "";
    if (options.allowReserved !== true) {
      reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
      if (options.sourceType === "module") { reserved += " await"; }
    }
    this.reservedWords = wordsRegexp(reserved);
    var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
    this.reservedWordsStrict = wordsRegexp(reservedStrict);
    this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
    this.input = String(input);

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false;

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos;
      this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
      this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
    } else {
      this.pos = this.lineStart = 0;
      this.curLine = 1;
    }

    // Properties of the current token:
    // Its type
    this.type = types$1.eof;
    // For tokens that include more information than their type, the value
    this.value = null;
    // Its start and end offset
    this.start = this.end = this.pos;
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition();

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext();
    this.exprAllowed = true;

    // Figure out if it's a module code.
    this.inModule = options.sourceType === "module";
    this.strict = this.inModule || this.strictDirective(this.pos);

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1;
    this.potentialArrowInForAwait = false;

    // Positions to delayed-check that yield/await does not exist in default parameters.
    this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
    // Labels in scope.
    this.labels = [];
    // Thus-far undefined exports.
    this.undefinedExports = Object.create(null);

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
      { this.skipLineComment(2); }

    // Scope tracking for duplicate variable names (see scope.js)
    this.scopeStack = [];
    this.enterScope(SCOPE_TOP);

    // For RegExp validation
    this.regexpState = null;

    // The stack of private names.
    // Each element has two properties: 'declared' and 'used'.
    // When it exited from the outermost class definition, all used private names must be declared.
    this.privateNameStack = [];
  };

  var prototypeAccessors = { inFunction: { configurable: true },inGenerator: { configurable: true },inAsync: { configurable: true },canAwait: { configurable: true },allowSuper: { configurable: true },allowDirectSuper: { configurable: true },treatFunctionsAsVar: { configurable: true },allowNewDotTarget: { configurable: true },inClassStaticBlock: { configurable: true } };

  Parser.prototype.parse = function parse () {
    var node = this.options.program || this.startNode();
    this.nextToken();
    return this.parseTopLevel(node)
  };

  prototypeAccessors.inFunction.get = function () { return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0 };

  prototypeAccessors.inGenerator.get = function () { return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 };

  prototypeAccessors.inAsync.get = function () { return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 };

  prototypeAccessors.canAwait.get = function () {
    for (var i = this.scopeStack.length - 1; i >= 0; i--) {
      var ref = this.scopeStack[i];
        var flags = ref.flags;
      if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT)) { return false }
      if (flags & SCOPE_FUNCTION) { return (flags & SCOPE_ASYNC) > 0 }
    }
    return (this.inModule && this.options.ecmaVersion >= 13) || this.options.allowAwaitOutsideFunction
  };

  prototypeAccessors.allowSuper.get = function () {
    var ref = this.currentThisScope();
      var flags = ref.flags;
    return (flags & SCOPE_SUPER) > 0 || this.options.allowSuperOutsideMethod
  };

  prototypeAccessors.allowDirectSuper.get = function () { return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0 };

  prototypeAccessors.treatFunctionsAsVar.get = function () { return this.treatFunctionsAsVarInScope(this.currentScope()) };

  prototypeAccessors.allowNewDotTarget.get = function () {
    for (var i = this.scopeStack.length - 1; i >= 0; i--) {
      var ref = this.scopeStack[i];
        var flags = ref.flags;
      if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT) ||
          ((flags & SCOPE_FUNCTION) && !(flags & SCOPE_ARROW))) { return true }
    }
    return false
  };

  prototypeAccessors.inClassStaticBlock.get = function () {
    return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0
  };

  Parser.extend = function extend () {
      var plugins = [], len = arguments.length;
      while ( len-- ) plugins[ len ] = arguments[ len ];

    var cls = this;
    for (var i = 0; i < plugins.length; i++) { cls = plugins[i](cls); }
    return cls
  };

  Parser.parse = function parse (input, options) {
    return new this(options, input).parse()
  };

  Parser.parseExpressionAt = function parseExpressionAt (input, pos, options) {
    var parser = new this(options, input, pos);
    parser.nextToken();
    return parser.parseExpression()
  };

  Parser.tokenizer = function tokenizer (input, options) {
    return new this(options, input)
  };

  Object.defineProperties( Parser.prototype, prototypeAccessors );

  var pp$9 = Parser.prototype;

  // ## Parser utilities

  var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
  pp$9.strictDirective = function(start) {
    if (this.options.ecmaVersion < 5) { return false }
    for (;;) {
      // Try to find string literal.
      skipWhiteSpace.lastIndex = start;
      start += skipWhiteSpace.exec(this.input)[0].length;
      var match = literal.exec(this.input.slice(start));
      if (!match) { return false }
      if ((match[1] || match[2]) === "use strict") {
        skipWhiteSpace.lastIndex = start + match[0].length;
        var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
        var next = this.input.charAt(end);
        return next === ";" || next === "}" ||
          (lineBreak.test(spaceAfter[0]) &&
           !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === "!" && this.input.charAt(end + 1) === "="))
      }
      start += match[0].length;

      // Skip semicolon, if any.
      skipWhiteSpace.lastIndex = start;
      start += skipWhiteSpace.exec(this.input)[0].length;
      if (this.input[start] === ";")
        { start++; }
    }
  };

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  pp$9.eat = function(type) {
    if (this.type === type) {
      this.next();
      return true
    } else {
      return false
    }
  };

  // Tests whether parsed token is a contextual keyword.

  pp$9.isContextual = function(name) {
    return this.type === types$1.name && this.value === name && !this.containsEsc
  };

  // Consumes contextual keyword if possible.

  pp$9.eatContextual = function(name) {
    if (!this.isContextual(name)) { return false }
    this.next();
    return true
  };

  // Asserts that following token is given contextual keyword.

  pp$9.expectContextual = function(name) {
    if (!this.eatContextual(name)) { this.unexpected(); }
  };

  // Test whether a semicolon can be inserted at the current position.

  pp$9.canInsertSemicolon = function() {
    return this.type === types$1.eof ||
      this.type === types$1.braceR ||
      lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  };

  pp$9.insertSemicolon = function() {
    if (this.canInsertSemicolon()) {
      if (this.options.onInsertedSemicolon)
        { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
      return true
    }
  };

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  pp$9.semicolon = function() {
    if (!this.eat(types$1.semi) && !this.insertSemicolon()) { this.unexpected(); }
  };

  pp$9.afterTrailingComma = function(tokType, notNext) {
    if (this.type === tokType) {
      if (this.options.onTrailingComma)
        { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
      if (!notNext)
        { this.next(); }
      return true
    }
  };

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  pp$9.expect = function(type) {
    this.eat(type) || this.unexpected();
  };

  // Raise an unexpected token error.

  pp$9.unexpected = function(pos) {
    this.raise(pos != null ? pos : this.start, "Unexpected token");
  };

  var DestructuringErrors = function DestructuringErrors() {
    this.shorthandAssign =
    this.trailingComma =
    this.parenthesizedAssign =
    this.parenthesizedBind =
    this.doubleProto =
      -1;
  };

  pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
    if (!refDestructuringErrors) { return }
    if (refDestructuringErrors.trailingComma > -1)
      { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
    var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
    if (parens > -1) { this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern"); }
  };

  pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
    if (!refDestructuringErrors) { return false }
    var shorthandAssign = refDestructuringErrors.shorthandAssign;
    var doubleProto = refDestructuringErrors.doubleProto;
    if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
    if (shorthandAssign >= 0)
      { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
    if (doubleProto >= 0)
      { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
  };

  pp$9.checkYieldAwaitInDefaultParams = function() {
    if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
      { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
    if (this.awaitPos)
      { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
  };

  pp$9.isSimpleAssignTarget = function(expr) {
    if (expr.type === "ParenthesizedExpression")
      { return this.isSimpleAssignTarget(expr.expression) }
    return expr.type === "Identifier" || expr.type === "MemberExpression"
  };

  var pp$8 = Parser.prototype;

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  pp$8.parseTopLevel = function(node) {
    var exports = Object.create(null);
    if (!node.body) { node.body = []; }
    while (this.type !== types$1.eof) {
      var stmt = this.parseStatement(null, true, exports);
      node.body.push(stmt);
    }
    if (this.inModule)
      { for (var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1)
        {
          var name = list[i];

          this.raiseRecoverable(this.undefinedExports[name].start, ("Export '" + name + "' is not defined"));
        } }
    this.adaptDirectivePrologue(node.body);
    this.next();
    node.sourceType = this.options.sourceType;
    return this.finishNode(node, "Program")
  };

  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

  pp$8.isLet = function(context) {
    if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
    // For ambiguous cases, determine if a LexicalDeclaration (or only a
    // Statement) is allowed here. If context is not empty then only a Statement
    // is allowed. However, `let [` is an explicit negative lookahead for
    // ExpressionStatement, so special-case it first.
    if (nextCh === 91 || nextCh === 92) { return true } // '[', '\'
    if (context) { return false }

    if (nextCh === 123 || nextCh > 0xd7ff && nextCh < 0xdc00) { return true } // '{', astral
    if (isIdentifierStart(nextCh, true)) {
      var pos = next + 1;
      while (isIdentifierChar(nextCh = this.input.charCodeAt(pos), true)) { ++pos; }
      if (nextCh === 92 || nextCh > 0xd7ff && nextCh < 0xdc00) { return true }
      var ident = this.input.slice(next, pos);
      if (!keywordRelationalOperator.test(ident)) { return true }
    }
    return false
  };

  // check 'async [no LineTerminator here] function'
  // - 'async /*foo*/ function' is OK.
  // - 'async /*\n*/ function' is invalid.
  pp$8.isAsyncFunction = function() {
    if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
      { return false }

    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length, after;
    return !lineBreak.test(this.input.slice(this.pos, next)) &&
      this.input.slice(next, next + 8) === "function" &&
      (next + 8 === this.input.length ||
       !(isIdentifierChar(after = this.input.charCodeAt(next + 8)) || after > 0xd7ff && after < 0xdc00))
  };

  pp$8.isUsingKeyword = function(isAwaitUsing, isFor) {
    if (this.options.ecmaVersion < 17 || !this.isContextual(isAwaitUsing ? "await" : "using"))
      { return false }

    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length;

    if (lineBreak.test(this.input.slice(this.pos, next))) { return false }

    if (isAwaitUsing) {
      var awaitEndPos = next + 5 /* await */, after;
      if (this.input.slice(next, awaitEndPos) !== "using" ||
        awaitEndPos === this.input.length ||
        isIdentifierChar(after = this.input.charCodeAt(awaitEndPos)) ||
        (after > 0xd7ff && after < 0xdc00)
      ) { return false }

      skipWhiteSpace.lastIndex = awaitEndPos;
      var skipAfterUsing = skipWhiteSpace.exec(this.input);
      if (skipAfterUsing && lineBreak.test(this.input.slice(awaitEndPos, awaitEndPos + skipAfterUsing[0].length))) { return false }
    }

    if (isFor) {
      var ofEndPos = next + 2 /* of */, after$1;
      if (this.input.slice(next, ofEndPos) === "of") {
        if (ofEndPos === this.input.length ||
          (!isIdentifierChar(after$1 = this.input.charCodeAt(ofEndPos)) && !(after$1 > 0xd7ff && after$1 < 0xdc00))) { return false }
      }
    }

    var ch = this.input.charCodeAt(next);
    return isIdentifierStart(ch, true) || ch === 92 // '\'
  };

  pp$8.isAwaitUsing = function(isFor) {
    return this.isUsingKeyword(true, isFor)
  };

  pp$8.isUsing = function(isFor) {
    return this.isUsingKeyword(false, isFor)
  };

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.

  pp$8.parseStatement = function(context, topLevel, exports) {
    var starttype = this.type, node = this.startNode(), kind;

    if (this.isLet(context)) {
      starttype = types$1._var;
      kind = "let";
    }

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case types$1._break: case types$1._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
    case types$1._debugger: return this.parseDebuggerStatement(node)
    case types$1._do: return this.parseDoStatement(node)
    case types$1._for: return this.parseForStatement(node)
    case types$1._function:
      // Function as sole body of either an if statement or a labeled statement
      // works, but not when it is part of a labeled statement that is the sole
      // body of an if statement.
      if ((context && (this.strict || context !== "if" && context !== "label")) && this.options.ecmaVersion >= 6) { this.unexpected(); }
      return this.parseFunctionStatement(node, false, !context)
    case types$1._class:
      if (context) { this.unexpected(); }
      return this.parseClass(node, true)
    case types$1._if: return this.parseIfStatement(node)
    case types$1._return: return this.parseReturnStatement(node)
    case types$1._switch: return this.parseSwitchStatement(node)
    case types$1._throw: return this.parseThrowStatement(node)
    case types$1._try: return this.parseTryStatement(node)
    case types$1._const: case types$1._var:
      kind = kind || this.value;
      if (context && kind !== "var") { this.unexpected(); }
      return this.parseVarStatement(node, kind)
    case types$1._while: return this.parseWhileStatement(node)
    case types$1._with: return this.parseWithStatement(node)
    case types$1.braceL: return this.parseBlock(true, node)
    case types$1.semi: return this.parseEmptyStatement(node)
    case types$1._export:
    case types$1._import:
      if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 40 || nextCh === 46) // '(' or '.'
          { return this.parseExpressionStatement(node, this.parseExpression()) }
      }

      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel)
          { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
        if (!this.inModule)
          { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
      }
      return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports)

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
    default:
      if (this.isAsyncFunction()) {
        if (context) { this.unexpected(); }
        this.next();
        return this.parseFunctionStatement(node, true, !context)
      }

      var usingKind = this.isAwaitUsing(false) ? "await using" : this.isUsing(false) ? "using" : null;
      if (usingKind) {
        if (topLevel && this.options.sourceType === "script") {
          this.raise(this.start, "Using declaration cannot appear in the top level when source type is `script`");
        }
        if (usingKind === "await using") {
          if (!this.canAwait) {
            this.raise(this.start, "Await using cannot appear outside of async function");
          }
          this.next();
        }
        this.next();
        this.parseVar(node, false, usingKind);
        this.semicolon();
        return this.finishNode(node, "VariableDeclaration")
      }

      var maybeName = this.value, expr = this.parseExpression();
      if (starttype === types$1.name && expr.type === "Identifier" && this.eat(types$1.colon))
        { return this.parseLabeledStatement(node, maybeName, expr, context) }
      else { return this.parseExpressionStatement(node, expr) }
    }
  };

  pp$8.parseBreakContinueStatement = function(node, keyword) {
    var isBreak = keyword === "break";
    this.next();
    if (this.eat(types$1.semi) || this.insertSemicolon()) { node.label = null; }
    else if (this.type !== types$1.name) { this.unexpected(); }
    else {
      node.label = this.parseIdent();
      this.semicolon();
    }

    // Verify that there is an actual destination to break or
    // continue to.
    var i = 0;
    for (; i < this.labels.length; ++i) {
      var lab = this.labels[i];
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
        if (node.label && isBreak) { break }
      }
    }
    if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
  };

  pp$8.parseDebuggerStatement = function(node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement")
  };

  pp$8.parseDoStatement = function(node) {
    this.next();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("do");
    this.labels.pop();
    this.expect(types$1._while);
    node.test = this.parseParenExpression();
    if (this.options.ecmaVersion >= 6)
      { this.eat(types$1.semi); }
    else
      { this.semicolon(); }
    return this.finishNode(node, "DoWhileStatement")
  };

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  pp$8.parseForStatement = function(node) {
    this.next();
    var awaitAt = (this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await")) ? this.lastTokStart : -1;
    this.labels.push(loopLabel);
    this.enterScope(0);
    this.expect(types$1.parenL);
    if (this.type === types$1.semi) {
      if (awaitAt > -1) { this.unexpected(awaitAt); }
      return this.parseFor(node, null)
    }
    var isLet = this.isLet();
    if (this.type === types$1._var || this.type === types$1._const || isLet) {
      var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
      this.next();
      this.parseVar(init$1, true, kind);
      this.finishNode(init$1, "VariableDeclaration");
      return this.parseForAfterInit(node, init$1, awaitAt)
    }
    var startsWithLet = this.isContextual("let"), isForOf = false;

    var usingKind = this.isUsing(true) ? "using" : this.isAwaitUsing(true) ? "await using" : null;
    if (usingKind) {
      var init$2 = this.startNode();
      this.next();
      if (usingKind === "await using") { this.next(); }
      this.parseVar(init$2, true, usingKind);
      this.finishNode(init$2, "VariableDeclaration");
      return this.parseForAfterInit(node, init$2, awaitAt)
    }
    var containsEsc = this.containsEsc;
    var refDestructuringErrors = new DestructuringErrors;
    var initPos = this.start;
    var init = awaitAt > -1
      ? this.parseExprSubscripts(refDestructuringErrors, "await")
      : this.parseExpression(true, refDestructuringErrors);
    if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      if (awaitAt > -1) { // implies `ecmaVersion >= 9` (see declaration of awaitAt)
        if (this.type === types$1._in) { this.unexpected(awaitAt); }
        node.await = true;
      } else if (isForOf && this.options.ecmaVersion >= 8) {
        if (init.start === initPos && !containsEsc && init.type === "Identifier" && init.name === "async") { this.unexpected(); }
        else if (this.options.ecmaVersion >= 9) { node.await = false; }
      }
      if (startsWithLet && isForOf) { this.raise(init.start, "The left-hand side of a for-of loop may not start with 'let'."); }
      this.toAssignable(init, false, refDestructuringErrors);
      this.checkLValPattern(init);
      return this.parseForIn(node, init)
    } else {
      this.checkExpressionErrors(refDestructuringErrors, true);
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init)
  };

  // Helper method to parse for loop after variable initialization
  pp$8.parseForAfterInit = function(node, init, awaitAt) {
    if ((this.type === types$1._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init.declarations.length === 1) {
      if (this.options.ecmaVersion >= 9) {
        if (this.type === types$1._in) {
          if (awaitAt > -1) { this.unexpected(awaitAt); }
        } else { node.await = awaitAt > -1; }
      }
      return this.parseForIn(node, init)
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init)
  };

  pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
    this.next();
    return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync)
  };

  pp$8.parseIfStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    // allow function declarations in branches, but only in non-strict mode
    node.consequent = this.parseStatement("if");
    node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
    return this.finishNode(node, "IfStatement")
  };

  pp$8.parseReturnStatement = function(node) {
    if (!this.inFunction && !this.options.allowReturnOutsideFunction)
      { this.raise(this.start, "'return' outside of function"); }
    this.next();

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.eat(types$1.semi) || this.insertSemicolon()) { node.argument = null; }
    else { node.argument = this.parseExpression(); this.semicolon(); }
    return this.finishNode(node, "ReturnStatement")
  };

  pp$8.parseSwitchStatement = function(node) {
    this.next();
    node.discriminant = this.parseParenExpression();
    node.cases = [];
    this.expect(types$1.braceL);
    this.labels.push(switchLabel);
    this.enterScope(0);

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    var cur;
    for (var sawDefault = false; this.type !== types$1.braceR;) {
      if (this.type === types$1._case || this.type === types$1._default) {
        var isCase = this.type === types$1._case;
        if (cur) { this.finishNode(cur, "SwitchCase"); }
        node.cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();
        if (isCase) {
          cur.test = this.parseExpression();
        } else {
          if (sawDefault) { this.raiseRecoverable(this.lastTokStart, "Multiple default clauses"); }
          sawDefault = true;
          cur.test = null;
        }
        this.expect(types$1.colon);
      } else {
        if (!cur) { this.unexpected(); }
        cur.consequent.push(this.parseStatement(null));
      }
    }
    this.exitScope();
    if (cur) { this.finishNode(cur, "SwitchCase"); }
    this.next(); // Closing brace
    this.labels.pop();
    return this.finishNode(node, "SwitchStatement")
  };

  pp$8.parseThrowStatement = function(node) {
    this.next();
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
      { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement")
  };

  // Reused empty array added for node fields that are always empty.

  var empty$1 = [];

  pp$8.parseCatchClauseParam = function() {
    var param = this.parseBindingAtom();
    var simple = param.type === "Identifier";
    this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
    this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
    this.expect(types$1.parenR);

    return param
  };

  pp$8.parseTryStatement = function(node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.type === types$1._catch) {
      var clause = this.startNode();
      this.next();
      if (this.eat(types$1.parenL)) {
        clause.param = this.parseCatchClauseParam();
      } else {
        if (this.options.ecmaVersion < 10) { this.unexpected(); }
        clause.param = null;
        this.enterScope(0);
      }
      clause.body = this.parseBlock(false);
      this.exitScope();
      node.handler = this.finishNode(clause, "CatchClause");
    }
    node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer)
      { this.raise(node.start, "Missing catch or finally clause"); }
    return this.finishNode(node, "TryStatement")
  };

  pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
    this.next();
    this.parseVar(node, false, kind, allowMissingInitializer);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration")
  };

  pp$8.parseWhileStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("while");
    this.labels.pop();
    return this.finishNode(node, "WhileStatement")
  };

  pp$8.parseWithStatement = function(node) {
    if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
    this.next();
    node.object = this.parseParenExpression();
    node.body = this.parseStatement("with");
    return this.finishNode(node, "WithStatement")
  };

  pp$8.parseEmptyStatement = function(node) {
    this.next();
    return this.finishNode(node, "EmptyStatement")
  };

  pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
    for (var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1)
      {
      var label = list[i$1];

      if (label.name === maybeName)
        { this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    } }
    var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
    for (var i = this.labels.length - 1; i >= 0; i--) {
      var label$1 = this.labels[i];
      if (label$1.statementStart === node.start) {
        // Update information about previous labels on this node
        label$1.statementStart = this.start;
        label$1.kind = kind;
      } else { break }
    }
    this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
    node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
    this.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement")
  };

  pp$8.parseExpressionStatement = function(node, expr) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement")
  };

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
    if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;
    if ( node === void 0 ) node = this.startNode();

    node.body = [];
    this.expect(types$1.braceL);
    if (createNewLexicalScope) { this.enterScope(0); }
    while (this.type !== types$1.braceR) {
      var stmt = this.parseStatement(null);
      node.body.push(stmt);
    }
    if (exitStrict) { this.strict = false; }
    this.next();
    if (createNewLexicalScope) { this.exitScope(); }
    return this.finishNode(node, "BlockStatement")
  };

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  pp$8.parseFor = function(node, init) {
    node.init = init;
    this.expect(types$1.semi);
    node.test = this.type === types$1.semi ? null : this.parseExpression();
    this.expect(types$1.semi);
    node.update = this.type === types$1.parenR ? null : this.parseExpression();
    this.expect(types$1.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, "ForStatement")
  };

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  pp$8.parseForIn = function(node, init) {
    var isForIn = this.type === types$1._in;
    this.next();

    if (
      init.type === "VariableDeclaration" &&
      init.declarations[0].init != null &&
      (
        !isForIn ||
        this.options.ecmaVersion < 8 ||
        this.strict ||
        init.kind !== "var" ||
        init.declarations[0].id.type !== "Identifier"
      )
    ) {
      this.raise(
        init.start,
        ((isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer")
      );
    }
    node.left = init;
    node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
    this.expect(types$1.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement")
  };

  // Parse a list of variable declarations.

  pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
    node.declarations = [];
    node.kind = kind;
    for (;;) {
      var decl = this.startNode();
      this.parseVarId(decl, kind);
      if (this.eat(types$1.eq)) {
        decl.init = this.parseMaybeAssign(isFor);
      } else if (!allowMissingInitializer && kind === "const" && !(this.type === types$1._in || (this.options.ecmaVersion >= 6 && this.isContextual("of")))) {
        this.unexpected();
      } else if (!allowMissingInitializer && (kind === "using" || kind === "await using") && this.options.ecmaVersion >= 17 && this.type !== types$1._in && !this.isContextual("of")) {
        this.raise(this.lastTokEnd, ("Missing initializer in " + kind + " declaration"));
      } else if (!allowMissingInitializer && decl.id.type !== "Identifier" && !(isFor && (this.type === types$1._in || this.isContextual("of")))) {
        this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
      } else {
        decl.init = null;
      }
      node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(types$1.comma)) { break }
    }
    return node
  };

  pp$8.parseVarId = function(decl, kind) {
    decl.id = kind === "using" || kind === "await using"
      ? this.parseIdent()
      : this.parseBindingAtom();

    this.checkLValPattern(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
  };

  var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;

  // Parse a function declaration or literal (depending on the
  // `statement & FUNC_STATEMENT`).

  // Remove `allowExpressionBody` for 7.0.0, as it is only called with false
  pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
    this.initFunction(node);
    if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
      if (this.type === types$1.star && (statement & FUNC_HANGING_STATEMENT))
        { this.unexpected(); }
      node.generator = this.eat(types$1.star);
    }
    if (this.options.ecmaVersion >= 8)
      { node.async = !!isAsync; }

    if (statement & FUNC_STATEMENT) {
      node.id = (statement & FUNC_NULLABLE_ID) && this.type !== types$1.name ? null : this.parseIdent();
      if (node.id && !(statement & FUNC_HANGING_STATEMENT))
        // If it is a regular function declaration in sloppy mode, then it is
        // subject to Annex B semantics (BIND_FUNCTION). Otherwise, the binding
        // mode depends on properties of the current scope (see
        // treatFunctionsAsVar).
        { this.checkLValSimple(node.id, (this.strict || node.generator || node.async) ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION); }
    }

    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(node.async, node.generator));

    if (!(statement & FUNC_STATEMENT))
      { node.id = this.type === types$1.name ? this.parseIdent() : null; }

    this.parseFunctionParams(node);
    this.parseFunctionBody(node, allowExpressionBody, false, forInit);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, (statement & FUNC_STATEMENT) ? "FunctionDeclaration" : "FunctionExpression")
  };

  pp$8.parseFunctionParams = function(node) {
    this.expect(types$1.parenL);
    node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
  };

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  pp$8.parseClass = function(node, isStatement) {
    this.next();

    // ecma-262 14.6 Class Definitions
    // A class definition is always strict mode code.
    var oldStrict = this.strict;
    this.strict = true;

    this.parseClassId(node, isStatement);
    this.parseClassSuper(node);
    var privateNameMap = this.enterClassBody();
    var classBody = this.startNode();
    var hadConstructor = false;
    classBody.body = [];
    this.expect(types$1.braceL);
    while (this.type !== types$1.braceR) {
      var element = this.parseClassElement(node.superClass !== null);
      if (element) {
        classBody.body.push(element);
        if (element.type === "MethodDefinition" && element.kind === "constructor") {
          if (hadConstructor) { this.raiseRecoverable(element.start, "Duplicate constructor in the same class"); }
          hadConstructor = true;
        } else if (element.key && element.key.type === "PrivateIdentifier" && isPrivateNameConflicted(privateNameMap, element)) {
          this.raiseRecoverable(element.key.start, ("Identifier '#" + (element.key.name) + "' has already been declared"));
        }
      }
    }
    this.strict = oldStrict;
    this.next();
    node.body = this.finishNode(classBody, "ClassBody");
    this.exitClassBody();
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
  };

  pp$8.parseClassElement = function(constructorAllowsSuper) {
    if (this.eat(types$1.semi)) { return null }

    var ecmaVersion = this.options.ecmaVersion;
    var node = this.startNode();
    var keyName = "";
    var isGenerator = false;
    var isAsync = false;
    var kind = "method";
    var isStatic = false;

    if (this.eatContextual("static")) {
      // Parse static init block
      if (ecmaVersion >= 13 && this.eat(types$1.braceL)) {
        this.parseClassStaticBlock(node);
        return node
      }
      if (this.isClassElementNameStart() || this.type === types$1.star) {
        isStatic = true;
      } else {
        keyName = "static";
      }
    }
    node.static = isStatic;
    if (!keyName && ecmaVersion >= 8 && this.eatContextual("async")) {
      if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) {
        isAsync = true;
      } else {
        keyName = "async";
      }
    }
    if (!keyName && (ecmaVersion >= 9 || !isAsync) && this.eat(types$1.star)) {
      isGenerator = true;
    }
    if (!keyName && !isAsync && !isGenerator) {
      var lastValue = this.value;
      if (this.eatContextual("get") || this.eatContextual("set")) {
        if (this.isClassElementNameStart()) {
          kind = lastValue;
        } else {
          keyName = lastValue;
        }
      }
    }

    // Parse element name
    if (keyName) {
      // 'async', 'get', 'set', or 'static' were not a keyword contextually.
      // The last token is any of those. Make it the element name.
      node.computed = false;
      node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
      node.key.name = keyName;
      this.finishNode(node.key, "Identifier");
    } else {
      this.parseClassElementName(node);
    }

    // Parse element value
    if (ecmaVersion < 13 || this.type === types$1.parenL || kind !== "method" || isGenerator || isAsync) {
      var isConstructor = !node.static && checkKeyName(node, "constructor");
      var allowsDirectSuper = isConstructor && constructorAllowsSuper;
      // Couldn't move this check into the 'parseClassMethod' method for backward compatibility.
      if (isConstructor && kind !== "method") { this.raise(node.key.start, "Constructor can't have get/set modifier"); }
      node.kind = isConstructor ? "constructor" : kind;
      this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
    } else {
      this.parseClassField(node);
    }

    return node
  };

  pp$8.isClassElementNameStart = function() {
    return (
      this.type === types$1.name ||
      this.type === types$1.privateId ||
      this.type === types$1.num ||
      this.type === types$1.string ||
      this.type === types$1.bracketL ||
      this.type.keyword
    )
  };

  pp$8.parseClassElementName = function(element) {
    if (this.type === types$1.privateId) {
      if (this.value === "constructor") {
        this.raise(this.start, "Classes can't have an element named '#constructor'");
      }
      element.computed = false;
      element.key = this.parsePrivateIdent();
    } else {
      this.parsePropertyName(element);
    }
  };

  pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
    // Check key and flags
    var key = method.key;
    if (method.kind === "constructor") {
      if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
      if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
    } else if (method.static && checkKeyName(method, "prototype")) {
      this.raise(key.start, "Classes may not have a static property named prototype");
    }

    // Parse value
    var value = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);

    // Check value
    if (method.kind === "get" && value.params.length !== 0)
      { this.raiseRecoverable(value.start, "getter should have no params"); }
    if (method.kind === "set" && value.params.length !== 1)
      { this.raiseRecoverable(value.start, "setter should have exactly one param"); }
    if (method.kind === "set" && value.params[0].type === "RestElement")
      { this.raiseRecoverable(value.params[0].start, "Setter cannot use rest params"); }

    return this.finishNode(method, "MethodDefinition")
  };

  pp$8.parseClassField = function(field) {
    if (checkKeyName(field, "constructor")) {
      this.raise(field.key.start, "Classes can't have a field named 'constructor'");
    } else if (field.static && checkKeyName(field, "prototype")) {
      this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
    }

    if (this.eat(types$1.eq)) {
      // To raise SyntaxError if 'arguments' exists in the initializer.
      this.enterScope(SCOPE_CLASS_FIELD_INIT | SCOPE_SUPER);
      field.value = this.parseMaybeAssign();
      this.exitScope();
    } else {
      field.value = null;
    }
    this.semicolon();

    return this.finishNode(field, "PropertyDefinition")
  };

  pp$8.parseClassStaticBlock = function(node) {
    node.body = [];

    var oldLabels = this.labels;
    this.labels = [];
    this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
    while (this.type !== types$1.braceR) {
      var stmt = this.parseStatement(null);
      node.body.push(stmt);
    }
    this.next();
    this.exitScope();
    this.labels = oldLabels;

    return this.finishNode(node, "StaticBlock")
  };

  pp$8.parseClassId = function(node, isStatement) {
    if (this.type === types$1.name) {
      node.id = this.parseIdent();
      if (isStatement)
        { this.checkLValSimple(node.id, BIND_LEXICAL, false); }
    } else {
      if (isStatement === true)
        { this.unexpected(); }
      node.id = null;
    }
  };

  pp$8.parseClassSuper = function(node) {
    node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
  };

  pp$8.enterClassBody = function() {
    var element = {declared: Object.create(null), used: []};
    this.privateNameStack.push(element);
    return element.declared
  };

  pp$8.exitClassBody = function() {
    var ref = this.privateNameStack.pop();
    var declared = ref.declared;
    var used = ref.used;
    if (!this.options.checkPrivateFields) { return }
    var len = this.privateNameStack.length;
    var parent = len === 0 ? null : this.privateNameStack[len - 1];
    for (var i = 0; i < used.length; ++i) {
      var id = used[i];
      if (!hasOwn(declared, id.name)) {
        if (parent) {
          parent.used.push(id);
        } else {
          this.raiseRecoverable(id.start, ("Private field '#" + (id.name) + "' must be declared in an enclosing class"));
        }
      }
    }
  };

  function isPrivateNameConflicted(privateNameMap, element) {
    var name = element.key.name;
    var curr = privateNameMap[name];

    var next = "true";
    if (element.type === "MethodDefinition" && (element.kind === "get" || element.kind === "set")) {
      next = (element.static ? "s" : "i") + element.kind;
    }

    // `class { get #a(){}; static set #a(_){} }` is also conflict.
    if (
      curr === "iget" && next === "iset" ||
      curr === "iset" && next === "iget" ||
      curr === "sget" && next === "sset" ||
      curr === "sset" && next === "sget"
    ) {
      privateNameMap[name] = "true";
      return false
    } else if (!curr) {
      privateNameMap[name] = next;
      return false
    } else {
      return true
    }
  }

  function checkKeyName(node, name) {
    var computed = node.computed;
    var key = node.key;
    return !computed && (
      key.type === "Identifier" && key.name === name ||
      key.type === "Literal" && key.value === name
    )
  }

  // Parses module export declaration.

  pp$8.parseExportAllDeclaration = function(node, exports) {
    if (this.options.ecmaVersion >= 11) {
      if (this.eatContextual("as")) {
        node.exported = this.parseModuleExportName();
        this.checkExport(exports, node.exported, this.lastTokStart);
      } else {
        node.exported = null;
      }
    }
    this.expectContextual("from");
    if (this.type !== types$1.string) { this.unexpected(); }
    node.source = this.parseExprAtom();
    if (this.options.ecmaVersion >= 16)
      { node.attributes = this.parseWithClause(); }
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration")
  };

  pp$8.parseExport = function(node, exports) {
    this.next();
    // export * from '...'
    if (this.eat(types$1.star)) {
      return this.parseExportAllDeclaration(node, exports)
    }
    if (this.eat(types$1._default)) { // export default ...
      this.checkExport(exports, "default", this.lastTokStart);
      node.declaration = this.parseExportDefaultDeclaration();
      return this.finishNode(node, "ExportDefaultDeclaration")
    }
    // export var|const|let|function|class ...
    if (this.shouldParseExportStatement()) {
      node.declaration = this.parseExportDeclaration(node);
      if (node.declaration.type === "VariableDeclaration")
        { this.checkVariableExport(exports, node.declaration.declarations); }
      else
        { this.checkExport(exports, node.declaration.id, node.declaration.id.start); }
      node.specifiers = [];
      node.source = null;
      if (this.options.ecmaVersion >= 16)
        { node.attributes = []; }
    } else { // export { x, y as z } [from '...']
      node.declaration = null;
      node.specifiers = this.parseExportSpecifiers(exports);
      if (this.eatContextual("from")) {
        if (this.type !== types$1.string) { this.unexpected(); }
        node.source = this.parseExprAtom();
        if (this.options.ecmaVersion >= 16)
          { node.attributes = this.parseWithClause(); }
      } else {
        for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
          // check for keywords used as local names
          var spec = list[i];

          this.checkUnreserved(spec.local);
          // check if export is defined
          this.checkLocalExport(spec.local);

          if (spec.local.type === "Literal") {
            this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
          }
        }

        node.source = null;
        if (this.options.ecmaVersion >= 16)
          { node.attributes = []; }
      }
      this.semicolon();
    }
    return this.finishNode(node, "ExportNamedDeclaration")
  };

  pp$8.parseExportDeclaration = function(node) {
    return this.parseStatement(null)
  };

  pp$8.parseExportDefaultDeclaration = function() {
    var isAsync;
    if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
      var fNode = this.startNode();
      this.next();
      if (isAsync) { this.next(); }
      return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync)
    } else if (this.type === types$1._class) {
      var cNode = this.startNode();
      return this.parseClass(cNode, "nullableID")
    } else {
      var declaration = this.parseMaybeAssign();
      this.semicolon();
      return declaration
    }
  };

  pp$8.checkExport = function(exports, name, pos) {
    if (!exports) { return }
    if (typeof name !== "string")
      { name = name.type === "Identifier" ? name.name : name.value; }
    if (hasOwn(exports, name))
      { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
    exports[name] = true;
  };

  pp$8.checkPatternExport = function(exports, pat) {
    var type = pat.type;
    if (type === "Identifier")
      { this.checkExport(exports, pat, pat.start); }
    else if (type === "ObjectPattern")
      { for (var i = 0, list = pat.properties; i < list.length; i += 1)
        {
          var prop = list[i];

          this.checkPatternExport(exports, prop);
        } }
    else if (type === "ArrayPattern")
      { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
        var elt = list$1[i$1];

          if (elt) { this.checkPatternExport(exports, elt); }
      } }
    else if (type === "Property")
      { this.checkPatternExport(exports, pat.value); }
    else if (type === "AssignmentPattern")
      { this.checkPatternExport(exports, pat.left); }
    else if (type === "RestElement")
      { this.checkPatternExport(exports, pat.argument); }
  };

  pp$8.checkVariableExport = function(exports, decls) {
    if (!exports) { return }
    for (var i = 0, list = decls; i < list.length; i += 1)
      {
      var decl = list[i];

      this.checkPatternExport(exports, decl.id);
    }
  };

  pp$8.shouldParseExportStatement = function() {
    return this.type.keyword === "var" ||
      this.type.keyword === "const" ||
      this.type.keyword === "class" ||
      this.type.keyword === "function" ||
      this.isLet() ||
      this.isAsyncFunction()
  };

  // Parses a comma-separated list of module exports.

  pp$8.parseExportSpecifier = function(exports) {
    var node = this.startNode();
    node.local = this.parseModuleExportName();

    node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
    this.checkExport(
      exports,
      node.exported,
      node.exported.start
    );

    return this.finishNode(node, "ExportSpecifier")
  };

  pp$8.parseExportSpecifiers = function(exports) {
    var nodes = [], first = true;
    // export { x, y as z } [from '...']
    this.expect(types$1.braceL);
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      nodes.push(this.parseExportSpecifier(exports));
    }
    return nodes
  };

  // Parses import declaration.

  pp$8.parseImport = function(node) {
    this.next();

    // import '...'
    if (this.type === types$1.string) {
      node.specifiers = empty$1;
      node.source = this.parseExprAtom();
    } else {
      node.specifiers = this.parseImportSpecifiers();
      this.expectContextual("from");
      node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
    }
    if (this.options.ecmaVersion >= 16)
      { node.attributes = this.parseWithClause(); }
    this.semicolon();
    return this.finishNode(node, "ImportDeclaration")
  };

  // Parses a comma-separated list of module imports.

  pp$8.parseImportSpecifier = function() {
    var node = this.startNode();
    node.imported = this.parseModuleExportName();

    if (this.eatContextual("as")) {
      node.local = this.parseIdent();
    } else {
      this.checkUnreserved(node.imported);
      node.local = node.imported;
    }
    this.checkLValSimple(node.local, BIND_LEXICAL);

    return this.finishNode(node, "ImportSpecifier")
  };

  pp$8.parseImportDefaultSpecifier = function() {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLValSimple(node.local, BIND_LEXICAL);
    return this.finishNode(node, "ImportDefaultSpecifier")
  };

  pp$8.parseImportNamespaceSpecifier = function() {
    var node = this.startNode();
    this.next();
    this.expectContextual("as");
    node.local = this.parseIdent();
    this.checkLValSimple(node.local, BIND_LEXICAL);
    return this.finishNode(node, "ImportNamespaceSpecifier")
  };

  pp$8.parseImportSpecifiers = function() {
    var nodes = [], first = true;
    if (this.type === types$1.name) {
      nodes.push(this.parseImportDefaultSpecifier());
      if (!this.eat(types$1.comma)) { return nodes }
    }
    if (this.type === types$1.star) {
      nodes.push(this.parseImportNamespaceSpecifier());
      return nodes
    }
    this.expect(types$1.braceL);
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      nodes.push(this.parseImportSpecifier());
    }
    return nodes
  };

  pp$8.parseWithClause = function() {
    var nodes = [];
    if (!this.eat(types$1._with)) {
      return nodes
    }
    this.expect(types$1.braceL);
    var attributeKeys = {};
    var first = true;
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      var attr = this.parseImportAttribute();
      var keyName = attr.key.type === "Identifier" ? attr.key.name : attr.key.value;
      if (hasOwn(attributeKeys, keyName))
        { this.raiseRecoverable(attr.key.start, "Duplicate attribute key '" + keyName + "'"); }
      attributeKeys[keyName] = true;
      nodes.push(attr);
    }
    return nodes
  };

  pp$8.parseImportAttribute = function() {
    var node = this.startNode();
    node.key = this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
    this.expect(types$1.colon);
    if (this.type !== types$1.string) {
      this.unexpected();
    }
    node.value = this.parseExprAtom();
    return this.finishNode(node, "ImportAttribute")
  };

  pp$8.parseModuleExportName = function() {
    if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
      var stringLiteral = this.parseLiteral(this.value);
      if (loneSurrogate.test(stringLiteral.value)) {
        this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
      }
      return stringLiteral
    }
    return this.parseIdent(true)
  };

  // Set `ExpressionStatement#directive` property for directive prologues.
  pp$8.adaptDirectivePrologue = function(statements) {
    for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
      statements[i].directive = statements[i].expression.raw.slice(1, -1);
    }
  };
  pp$8.isDirectiveCandidate = function(statement) {
    return (
      this.options.ecmaVersion >= 5 &&
      statement.type === "ExpressionStatement" &&
      statement.expression.type === "Literal" &&
      typeof statement.expression.value === "string" &&
      // Reject parenthesized strings.
      (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
    )
  };

  var pp$7 = Parser.prototype;

  // Convert existing expression atom to assignable pattern
  // if possible.

  pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 6 && node) {
      switch (node.type) {
      case "Identifier":
        if (this.inAsync && node.name === "await")
          { this.raise(node.start, "Cannot use 'await' as identifier inside an async function"); }
        break

      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
        break

      case "ObjectExpression":
        node.type = "ObjectPattern";
        if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];

        this.toAssignable(prop, isBinding);
          // Early error:
          //   AssignmentRestProperty[Yield, Await] :
          //     `...` DestructuringAssignmentTarget[Yield, Await]
          //
          //   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
          if (
            prop.type === "RestElement" &&
            (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
          ) {
            this.raise(prop.argument.start, "Unexpected token");
          }
        }
        break

      case "Property":
        // AssignmentProperty has type === "Property"
        if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
        this.toAssignable(node.value, isBinding);
        break

      case "ArrayExpression":
        node.type = "ArrayPattern";
        if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
        this.toAssignableList(node.elements, isBinding);
        break

      case "SpreadElement":
        node.type = "RestElement";
        this.toAssignable(node.argument, isBinding);
        if (node.argument.type === "AssignmentPattern")
          { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
        break

      case "AssignmentExpression":
        if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isBinding);
        break

      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isBinding, refDestructuringErrors);
        break

      case "ChainExpression":
        this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
        break

      case "MemberExpression":
        if (!isBinding) { break }

      default:
        this.raise(node.start, "Assigning to rvalue");
      }
    } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
    return node
  };

  // Convert list of expression atoms to binding list.

  pp$7.toAssignableList = function(exprList, isBinding) {
    var end = exprList.length;
    for (var i = 0; i < end; i++) {
      var elt = exprList[i];
      if (elt) { this.toAssignable(elt, isBinding); }
    }
    if (end) {
      var last = exprList[end - 1];
      if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
        { this.unexpected(last.argument.start); }
    }
    return exprList
  };

  // Parses spread element.

  pp$7.parseSpread = function(refDestructuringErrors) {
    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    return this.finishNode(node, "SpreadElement")
  };

  pp$7.parseRestBinding = function() {
    var node = this.startNode();
    this.next();

    // RestElement inside of a function parameter must be an identifier
    if (this.options.ecmaVersion === 6 && this.type !== types$1.name)
      { this.unexpected(); }

    node.argument = this.parseBindingAtom();

    return this.finishNode(node, "RestElement")
  };

  // Parses lvalue (assignable) atom.

  pp$7.parseBindingAtom = function() {
    if (this.options.ecmaVersion >= 6) {
      switch (this.type) {
      case types$1.bracketL:
        var node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(types$1.bracketR, true, true);
        return this.finishNode(node, "ArrayPattern")

      case types$1.braceL:
        return this.parseObj(true)
      }
    }
    return this.parseIdent()
  };

  pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
    var elts = [], first = true;
    while (!this.eat(close)) {
      if (first) { first = false; }
      else { this.expect(types$1.comma); }
      if (allowEmpty && this.type === types$1.comma) {
        elts.push(null);
      } else if (allowTrailingComma && this.afterTrailingComma(close)) {
        break
      } else if (this.type === types$1.ellipsis) {
        var rest = this.parseRestBinding();
        this.parseBindingListItem(rest);
        elts.push(rest);
        if (this.type === types$1.comma) { this.raiseRecoverable(this.start, "Comma is not permitted after the rest element"); }
        this.expect(close);
        break
      } else {
        elts.push(this.parseAssignableListItem(allowModifiers));
      }
    }
    return elts
  };

  pp$7.parseAssignableListItem = function(allowModifiers) {
    var elem = this.parseMaybeDefault(this.start, this.startLoc);
    this.parseBindingListItem(elem);
    return elem
  };

  pp$7.parseBindingListItem = function(param) {
    return param
  };

  // Parses assignment pattern around given atom if possible.

  pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
    left = left || this.parseBindingAtom();
    if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) { return left }
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.right = this.parseMaybeAssign();
    return this.finishNode(node, "AssignmentPattern")
  };

  // The following three functions all verify that a node is an lvalue —
  // something that can be bound, or assigned to. In order to do so, they perform
  // a variety of checks:
  //
  // - Check that none of the bound/assigned-to identifiers are reserved words.
  // - Record name declarations for bindings in the appropriate scope.
  // - Check duplicate argument names, if checkClashes is set.
  //
  // If a complex binding pattern is encountered (e.g., object and array
  // destructuring), the entire pattern is recursively checked.
  //
  // There are three versions of checkLVal*() appropriate for different
  // circumstances:
  //
  // - checkLValSimple() shall be used if the syntactic construct supports
  //   nothing other than identifiers and member expressions. Parenthesized
  //   expressions are also correctly handled. This is generally appropriate for
  //   constructs for which the spec says
  //
  //   > It is a Syntax Error if AssignmentTargetType of [the production] is not
  //   > simple.
  //
  //   It is also appropriate for checking if an identifier is valid and not
  //   defined elsewhere, like import declarations or function/class identifiers.
  //
  //   Examples where this is used include:
  //     a += …;
  //     import a from '…';
  //   where a is the node to be checked.
  //
  // - checkLValPattern() shall be used if the syntactic construct supports
  //   anything checkLValSimple() supports, as well as object and array
  //   destructuring patterns. This is generally appropriate for constructs for
  //   which the spec says
  //
  //   > It is a Syntax Error if [the production] is neither an ObjectLiteral nor
  //   > an ArrayLiteral and AssignmentTargetType of [the production] is not
  //   > simple.
  //
  //   Examples where this is used include:
  //     (a = …);
  //     const a = …;
  //     try { … } catch (a) { … }
  //   where a is the node to be checked.
  //
  // - checkLValInnerPattern() shall be used if the syntactic construct supports
  //   anything checkLValPattern() supports, as well as default assignment
  //   patterns, rest elements, and other constructs that may appear within an
  //   object or array destructuring pattern.
  //
  //   As a special case, function parameters also use checkLValInnerPattern(),
  //   as they also support defaults and rest constructs.
  //
  // These functions deliberately support both assignment and binding constructs,
  // as the logic for both is exceedingly similar. If the node is the target of
  // an assignment, then bindingType should be set to BIND_NONE. Otherwise, it
  // should be set to the appropriate BIND_* constant, like BIND_VAR or
  // BIND_LEXICAL.
  //
  // If the function is called with a non-BIND_NONE bindingType, then
  // additionally a checkClashes object may be specified to allow checking for
  // duplicate argument names. checkClashes is ignored if the provided construct
  // is an assignment (i.e., bindingType is BIND_NONE).

  pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
    if ( bindingType === void 0 ) bindingType = BIND_NONE;

    var isBind = bindingType !== BIND_NONE;

    switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name))
        { this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
      if (isBind) {
        if (bindingType === BIND_LEXICAL && expr.name === "let")
          { this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name"); }
        if (checkClashes) {
          if (hasOwn(checkClashes, expr.name))
            { this.raiseRecoverable(expr.start, "Argument name clash"); }
          checkClashes[expr.name] = true;
        }
        if (bindingType !== BIND_OUTSIDE) { this.declareName(expr.name, bindingType, expr.start); }
      }
      break

    case "ChainExpression":
      this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
      break

    case "MemberExpression":
      if (isBind) { this.raiseRecoverable(expr.start, "Binding member expression"); }
      break

    case "ParenthesizedExpression":
      if (isBind) { this.raiseRecoverable(expr.start, "Binding parenthesized expression"); }
      return this.checkLValSimple(expr.expression, bindingType, checkClashes)

    default:
      this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
    }
  };

  pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
    if ( bindingType === void 0 ) bindingType = BIND_NONE;

    switch (expr.type) {
    case "ObjectPattern":
      for (var i = 0, list = expr.properties; i < list.length; i += 1) {
        var prop = list[i];

      this.checkLValInnerPattern(prop, bindingType, checkClashes);
      }
      break

    case "ArrayPattern":
      for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
        var elem = list$1[i$1];

      if (elem) { this.checkLValInnerPattern(elem, bindingType, checkClashes); }
      }
      break

    default:
      this.checkLValSimple(expr, bindingType, checkClashes);
    }
  };

  pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
    if ( bindingType === void 0 ) bindingType = BIND_NONE;

    switch (expr.type) {
    case "Property":
      // AssignmentProperty has type === "Property"
      this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
      break

    case "AssignmentPattern":
      this.checkLValPattern(expr.left, bindingType, checkClashes);
      break

    case "RestElement":
      this.checkLValPattern(expr.argument, bindingType, checkClashes);
      break

    default:
      this.checkLValPattern(expr, bindingType, checkClashes);
    }
  };

  // The algorithm used to determine whether a regexp can appear at a
  // given point in the program is loosely based on sweet.js' approach.
  // See https://github.com/mozilla/sweet.js/wiki/design


  var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
    this.token = token;
    this.isExpr = !!isExpr;
    this.preserveSpace = !!preserveSpace;
    this.override = override;
    this.generator = !!generator;
  };

  var types = {
    b_stat: new TokContext("{", false),
    b_expr: new TokContext("{", true),
    b_tmpl: new TokContext("${", false),
    p_stat: new TokContext("(", false),
    p_expr: new TokContext("(", true),
    q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
    f_stat: new TokContext("function", false),
    f_expr: new TokContext("function", true),
    f_expr_gen: new TokContext("function", true, false, null, true),
    f_gen: new TokContext("function", false, false, null, true)
  };

  var pp$6 = Parser.prototype;

  pp$6.initialContext = function() {
    return [types.b_stat]
  };

  pp$6.curContext = function() {
    return this.context[this.context.length - 1]
  };

  pp$6.braceIsBlock = function(prevType) {
    var parent = this.curContext();
    if (parent === types.f_expr || parent === types.f_stat)
      { return true }
    if (prevType === types$1.colon && (parent === types.b_stat || parent === types.b_expr))
      { return !parent.isExpr }

    // The check for `tt.name && exprAllowed` detects whether we are
    // after a `yield` or `of` construct. See the `updateContext` for
    // `tt.name`.
    if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed)
      { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
    if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow)
      { return true }
    if (prevType === types$1.braceL)
      { return parent === types.b_stat }
    if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name)
      { return false }
    return !this.exprAllowed
  };

  pp$6.inGeneratorContext = function() {
    for (var i = this.context.length - 1; i >= 1; i--) {
      var context = this.context[i];
      if (context.token === "function")
        { return context.generator }
    }
    return false
  };

  pp$6.updateContext = function(prevType) {
    var update, type = this.type;
    if (type.keyword && prevType === types$1.dot)
      { this.exprAllowed = false; }
    else if (update = type.updateContext)
      { update.call(this, prevType); }
    else
      { this.exprAllowed = type.beforeExpr; }
  };

  // Used to handle edge cases when token context could not be inferred correctly during tokenization phase

  pp$6.overrideContext = function(tokenCtx) {
    if (this.curContext() !== tokenCtx) {
      this.context[this.context.length - 1] = tokenCtx;
    }
  };

  // Token-specific context update code

  types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
    if (this.context.length === 1) {
      this.exprAllowed = true;
      return
    }
    var out = this.context.pop();
    if (out === types.b_stat && this.curContext().token === "function") {
      out = this.context.pop();
    }
    this.exprAllowed = !out.isExpr;
  };

  types$1.braceL.updateContext = function(prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
    this.exprAllowed = true;
  };

  types$1.dollarBraceL.updateContext = function() {
    this.context.push(types.b_tmpl);
    this.exprAllowed = true;
  };

  types$1.parenL.updateContext = function(prevType) {
    var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
    this.context.push(statementParens ? types.p_stat : types.p_expr);
    this.exprAllowed = true;
  };

  types$1.incDec.updateContext = function() {
    // tokExprAllowed stays unchanged
  };

  types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
    if (prevType.beforeExpr && prevType !== types$1._else &&
        !(prevType === types$1.semi && this.curContext() !== types.p_stat) &&
        !(prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) &&
        !((prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types.b_stat))
      { this.context.push(types.f_expr); }
    else
      { this.context.push(types.f_stat); }
    this.exprAllowed = false;
  };

  types$1.colon.updateContext = function() {
    if (this.curContext().token === "function") { this.context.pop(); }
    this.exprAllowed = true;
  };

  types$1.backQuote.updateContext = function() {
    if (this.curContext() === types.q_tmpl)
      { this.context.pop(); }
    else
      { this.context.push(types.q_tmpl); }
    this.exprAllowed = false;
  };

  types$1.star.updateContext = function(prevType) {
    if (prevType === types$1._function) {
      var index = this.context.length - 1;
      if (this.context[index] === types.f_expr)
        { this.context[index] = types.f_expr_gen; }
      else
        { this.context[index] = types.f_gen; }
    }
    this.exprAllowed = true;
  };

  types$1.name.updateContext = function(prevType) {
    var allowed = false;
    if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
      if (this.value === "of" && !this.exprAllowed ||
          this.value === "yield" && this.inGeneratorContext())
        { allowed = true; }
    }
    this.exprAllowed = allowed;
  };

  // A recursive descent parser operates by defining functions for all
  // syntactic elements, and recursively calling those, each function
  // advancing the input stream and returning an AST node. Precedence
  // of constructs (for example, the fact that `!x[1]` means `!(x[1])`
  // instead of `(!x)[1]` is handled by the fact that the parser
  // function that parses unary prefix operators is called first, and
  // in turn calls the function that parses `[]` subscripts — that
  // way, it'll receive the node for `x[1]` already parsed, and wraps
  // *that* in the unary operator node.
  //
  // Acorn uses an [operator precedence parser][opp] to handle binary
  // operator precedence, because it is much more compact than using
  // the technique outlined above, which uses different, nesting
  // functions to specify precedence, for all of the ten binary
  // precedence levels that JavaScript defines.
  //
  // [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser


  var pp$5 = Parser.prototype;

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  pp$5.checkPropClash = function(prop, propHash, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
      { return }
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
      { return }
    var key = prop.key;
    var name;
    switch (key.type) {
    case "Identifier": name = key.name; break
    case "Literal": name = String(key.value); break
    default: return
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
      if (name === "__proto__" && kind === "init") {
        if (propHash.proto) {
          if (refDestructuringErrors) {
            if (refDestructuringErrors.doubleProto < 0) {
              refDestructuringErrors.doubleProto = key.start;
            }
          } else {
            this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
          }
        }
        propHash.proto = true;
      }
      return
    }
    name = "$" + name;
    var other = propHash[name];
    if (other) {
      var redefinition;
      if (kind === "init") {
        redefinition = this.strict && other.init || other.get || other.set;
      } else {
        redefinition = other.init || other[kind];
      }
      if (redefinition)
        { this.raiseRecoverable(key.start, "Redefinition of property"); }
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      };
    }
    other[kind] = true;
  };

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initalization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).

  pp$5.parseExpression = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseMaybeAssign(forInit, refDestructuringErrors);
    if (this.type === types$1.comma) {
      var node = this.startNodeAt(startPos, startLoc);
      node.expressions = [expr];
      while (this.eat(types$1.comma)) { node.expressions.push(this.parseMaybeAssign(forInit, refDestructuringErrors)); }
      return this.finishNode(node, "SequenceExpression")
    }
    return expr
  };

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
    if (this.isContextual("yield")) {
      if (this.inGenerator) { return this.parseYield(forInit) }
      // The tokenizer will assume an expression is allowed after
      // `yield`, but this isn't that kind of yield
      else { this.exprAllowed = false; }
    }

    var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
    if (refDestructuringErrors) {
      oldParenAssign = refDestructuringErrors.parenthesizedAssign;
      oldTrailingComma = refDestructuringErrors.trailingComma;
      oldDoubleProto = refDestructuringErrors.doubleProto;
      refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
    } else {
      refDestructuringErrors = new DestructuringErrors;
      ownDestructuringErrors = true;
    }

    var startPos = this.start, startLoc = this.startLoc;
    if (this.type === types$1.parenL || this.type === types$1.name) {
      this.potentialArrowAt = this.start;
      this.potentialArrowInForAwait = forInit === "await";
    }
    var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
    if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
    if (this.type.isAssign) {
      var node = this.startNodeAt(startPos, startLoc);
      node.operator = this.value;
      if (this.type === types$1.eq)
        { left = this.toAssignable(left, false, refDestructuringErrors); }
      if (!ownDestructuringErrors) {
        refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.doubleProto = -1;
      }
      if (refDestructuringErrors.shorthandAssign >= left.start)
        { refDestructuringErrors.shorthandAssign = -1; } // reset because shorthand default was used correctly
      if (this.type === types$1.eq)
        { this.checkLValPattern(left); }
      else
        { this.checkLValSimple(left); }
      node.left = left;
      this.next();
      node.right = this.parseMaybeAssign(forInit);
      if (oldDoubleProto > -1) { refDestructuringErrors.doubleProto = oldDoubleProto; }
      return this.finishNode(node, "AssignmentExpression")
    } else {
      if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
    }
    if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
    if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
    return left
  };

  // Parse a ternary conditional (`?:`) operator.

  pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseExprOps(forInit, refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    if (this.eat(types$1.question)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.test = expr;
      node.consequent = this.parseMaybeAssign();
      this.expect(types$1.colon);
      node.alternate = this.parseMaybeAssign(forInit);
      return this.finishNode(node, "ConditionalExpression")
    }
    return expr
  };

  // Start the precedence parser.

  pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit)
  };

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
    var prec = this.type.binop;
    if (prec != null && (!forInit || this.type !== types$1._in)) {
      if (prec > minPrec) {
        var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
        var coalesce = this.type === types$1.coalesce;
        if (coalesce) {
          // Handle the precedence of `tt.coalesce` as equal to the range of logical expressions.
          // In other words, `node.right` shouldn't contain logical expressions in order to check the mixed error.
          prec = types$1.logicalAND.binop;
        }
        var op = this.value;
        this.next();
        var startPos = this.start, startLoc = this.startLoc;
        var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
        var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
        if ((logical && this.type === types$1.coalesce) || (coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND))) {
          this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
        }
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit)
      }
    }
    return left
  };

  pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
    if (right.type === "PrivateIdentifier") { this.raise(right.start, "Private identifier can only be left side of binary expression"); }
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.operator = op;
    node.right = right;
    return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
  };

  // Parse unary operators, both prefix and postfix.

  pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
    var startPos = this.start, startLoc = this.startLoc, expr;
    if (this.isContextual("await") && this.canAwait) {
      expr = this.parseAwait(forInit);
      sawUnary = true;
    } else if (this.type.prefix) {
      var node = this.startNode(), update = this.type === types$1.incDec;
      node.operator = this.value;
      node.prefix = true;
      this.next();
      node.argument = this.parseMaybeUnary(null, true, update, forInit);
      this.checkExpressionErrors(refDestructuringErrors, true);
      if (update) { this.checkLValSimple(node.argument); }
      else if (this.strict && node.operator === "delete" && isLocalVariableAccess(node.argument))
        { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
      else if (node.operator === "delete" && isPrivateFieldAccess(node.argument))
        { this.raiseRecoverable(node.start, "Private fields can not be deleted"); }
      else { sawUnary = true; }
      expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    } else if (!sawUnary && this.type === types$1.privateId) {
      if ((forInit || this.privateNameStack.length === 0) && this.options.checkPrivateFields) { this.unexpected(); }
      expr = this.parsePrivateIdent();
      // only could be private fields in 'in', such as #x in obj
      if (this.type !== types$1._in) { this.unexpected(); }
    } else {
      expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
      if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
      while (this.type.postfix && !this.canInsertSemicolon()) {
        var node$1 = this.startNodeAt(startPos, startLoc);
        node$1.operator = this.value;
        node$1.prefix = false;
        node$1.argument = expr;
        this.checkLValSimple(expr);
        this.next();
        expr = this.finishNode(node$1, "UpdateExpression");
      }
    }

    if (!incDec && this.eat(types$1.starstar)) {
      if (sawUnary)
        { this.unexpected(this.lastTokStart); }
      else
        { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false) }
    } else {
      return expr
    }
  };

  function isLocalVariableAccess(node) {
    return (
      node.type === "Identifier" ||
      node.type === "ParenthesizedExpression" && isLocalVariableAccess(node.expression)
    )
  }

  function isPrivateFieldAccess(node) {
    return (
      node.type === "MemberExpression" && node.property.type === "PrivateIdentifier" ||
      node.type === "ChainExpression" && isPrivateFieldAccess(node.expression) ||
      node.type === "ParenthesizedExpression" && isPrivateFieldAccess(node.expression)
    )
  }

  // Parse call, dot, and `[]`-subscript expressions.

  pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseExprAtom(refDestructuringErrors, forInit);
    if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")")
      { return expr }
    var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
    if (refDestructuringErrors && result.type === "MemberExpression") {
      if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
      if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
      if (refDestructuringErrors.trailingComma >= result.start) { refDestructuringErrors.trailingComma = -1; }
    }
    return result
  };

  pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
    var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
        this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 &&
        this.potentialArrowAt === base.start;
    var optionalChained = false;

    while (true) {
      var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);

      if (element.optional) { optionalChained = true; }
      if (element === base || element.type === "ArrowFunctionExpression") {
        if (optionalChained) {
          var chainNode = this.startNodeAt(startPos, startLoc);
          chainNode.expression = element;
          element = this.finishNode(chainNode, "ChainExpression");
        }
        return element
      }

      base = element;
    }
  };

  pp$5.shouldParseAsyncArrow = function() {
    return !this.canInsertSemicolon() && this.eat(types$1.arrow)
  };

  pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit)
  };

  pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
    var optionalSupported = this.options.ecmaVersion >= 11;
    var optional = optionalSupported && this.eat(types$1.questionDot);
    if (noCalls && optional) { this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions"); }

    var computed = this.eat(types$1.bracketL);
    if (computed || (optional && this.type !== types$1.parenL && this.type !== types$1.backQuote) || this.eat(types$1.dot)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      if (computed) {
        node.property = this.parseExpression();
        this.expect(types$1.bracketR);
      } else if (this.type === types$1.privateId && base.type !== "Super") {
        node.property = this.parsePrivateIdent();
      } else {
        node.property = this.parseIdent(this.options.allowReserved !== "never");
      }
      node.computed = !!computed;
      if (optionalSupported) {
        node.optional = optional;
      }
      base = this.finishNode(node, "MemberExpression");
    } else if (!noCalls && this.eat(types$1.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
      this.yieldPos = 0;
      this.awaitPos = 0;
      this.awaitIdentPos = 0;
      var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
      if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
        this.checkPatternErrors(refDestructuringErrors, false);
        this.checkYieldAwaitInDefaultParams();
        if (this.awaitIdentPos > 0)
          { this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function"); }
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit)
      }
      this.checkExpressionErrors(refDestructuringErrors, true);
      this.yieldPos = oldYieldPos || this.yieldPos;
      this.awaitPos = oldAwaitPos || this.awaitPos;
      this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
      var node$1 = this.startNodeAt(startPos, startLoc);
      node$1.callee = base;
      node$1.arguments = exprList;
      if (optionalSupported) {
        node$1.optional = optional;
      }
      base = this.finishNode(node$1, "CallExpression");
    } else if (this.type === types$1.backQuote) {
      if (optional || optionalChained) {
        this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
      }
      var node$2 = this.startNodeAt(startPos, startLoc);
      node$2.tag = base;
      node$2.quasi = this.parseTemplate({isTagged: true});
      base = this.finishNode(node$2, "TaggedTemplateExpression");
    }
    return base
  };

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
    // If a division operator appears in an expression position, the
    // tokenizer got confused, and we force it to read a regexp instead.
    if (this.type === types$1.slash) { this.readRegexp(); }

    var node, canBeArrow = this.potentialArrowAt === this.start;
    switch (this.type) {
    case types$1._super:
      if (!this.allowSuper)
        { this.raise(this.start, "'super' keyword outside a method"); }
      node = this.startNode();
      this.next();
      if (this.type === types$1.parenL && !this.allowDirectSuper)
        { this.raise(node.start, "super() call outside constructor of a subclass"); }
      // The `super` keyword can appear at below:
      // SuperProperty:
      //     super [ Expression ]
      //     super . IdentifierName
      // SuperCall:
      //     super ( Arguments )
      if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL)
        { this.unexpected(); }
      return this.finishNode(node, "Super")

    case types$1._this:
      node = this.startNode();
      this.next();
      return this.finishNode(node, "ThisExpression")

    case types$1.name:
      var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
      var id = this.parseIdent(false);
      if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types$1._function)) {
        this.overrideContext(types.f_expr);
        return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit)
      }
      if (canBeArrow && !this.canInsertSemicolon()) {
        if (this.eat(types$1.arrow))
          { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false, forInit) }
        if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types$1.name && !containsEsc &&
            (!this.potentialArrowInForAwait || this.value !== "of" || this.containsEsc)) {
          id = this.parseIdent(false);
          if (this.canInsertSemicolon() || !this.eat(types$1.arrow))
            { this.unexpected(); }
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true, forInit)
        }
      }
      return id

    case types$1.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = {pattern: value.pattern, flags: value.flags};
      return node

    case types$1.num: case types$1.string:
      return this.parseLiteral(this.value)

    case types$1._null: case types$1._true: case types$1._false:
      node = this.startNode();
      node.value = this.type === types$1._null ? null : this.type === types$1._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal")

    case types$1.parenL:
      var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
      if (refDestructuringErrors) {
        if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
          { refDestructuringErrors.parenthesizedAssign = start; }
        if (refDestructuringErrors.parenthesizedBind < 0)
          { refDestructuringErrors.parenthesizedBind = start; }
      }
      return expr

    case types$1.bracketL:
      node = this.startNode();
      this.next();
      node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression")

    case types$1.braceL:
      this.overrideContext(types.b_expr);
      return this.parseObj(false, refDestructuringErrors)

    case types$1._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, 0)

    case types$1._class:
      return this.parseClass(this.startNode(), false)

    case types$1._new:
      return this.parseNew()

    case types$1.backQuote:
      return this.parseTemplate()

    case types$1._import:
      if (this.options.ecmaVersion >= 11) {
        return this.parseExprImport(forNew)
      } else {
        return this.unexpected()
      }

    default:
      return this.parseExprAtomDefault()
    }
  };

  pp$5.parseExprAtomDefault = function() {
    this.unexpected();
  };

  pp$5.parseExprImport = function(forNew) {
    var node = this.startNode();

    // Consume `import` as an identifier for `import.meta`.
    // Because `this.parseIdent(true)` doesn't check escape sequences, it needs the check of `this.containsEsc`.
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword import"); }
    this.next();

    if (this.type === types$1.parenL && !forNew) {
      return this.parseDynamicImport(node)
    } else if (this.type === types$1.dot) {
      var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
      meta.name = "import";
      node.meta = this.finishNode(meta, "Identifier");
      return this.parseImportMeta(node)
    } else {
      this.unexpected();
    }
  };

  pp$5.parseDynamicImport = function(node) {
    this.next(); // skip `(`

    // Parse node.source.
    node.source = this.parseMaybeAssign();

    if (this.options.ecmaVersion >= 16) {
      if (!this.eat(types$1.parenR)) {
        this.expect(types$1.comma);
        if (!this.afterTrailingComma(types$1.parenR)) {
          node.options = this.parseMaybeAssign();
          if (!this.eat(types$1.parenR)) {
            this.expect(types$1.comma);
            if (!this.afterTrailingComma(types$1.parenR)) {
              this.unexpected();
            }
          }
        } else {
          node.options = null;
        }
      } else {
        node.options = null;
      }
    } else {
      // Verify ending.
      if (!this.eat(types$1.parenR)) {
        var errorPos = this.start;
        if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
          this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
        } else {
          this.unexpected(errorPos);
        }
      }
    }

    return this.finishNode(node, "ImportExpression")
  };

  pp$5.parseImportMeta = function(node) {
    this.next(); // skip `.`

    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);

    if (node.property.name !== "meta")
      { this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'"); }
    if (containsEsc)
      { this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters"); }
    if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere)
      { this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module"); }

    return this.finishNode(node, "MetaProperty")
  };

  pp$5.parseLiteral = function(value) {
    var node = this.startNode();
    node.value = value;
    node.raw = this.input.slice(this.start, this.end);
    if (node.raw.charCodeAt(node.raw.length - 1) === 110)
      { node.bigint = node.value != null ? node.value.toString() : node.raw.slice(0, -1).replace(/_/g, ""); }
    this.next();
    return this.finishNode(node, "Literal")
  };

  pp$5.parseParenExpression = function() {
    this.expect(types$1.parenL);
    var val = this.parseExpression();
    this.expect(types$1.parenR);
    return val
  };

  pp$5.shouldParseArrow = function(exprList) {
    return !this.canInsertSemicolon()
  };

  pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
    var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
    if (this.options.ecmaVersion >= 6) {
      this.next();

      var innerStartPos = this.start, innerStartLoc = this.startLoc;
      var exprList = [], first = true, lastIsComma = false;
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
      this.yieldPos = 0;
      this.awaitPos = 0;
      // Do not save awaitIdentPos to allow checking awaits nested in parameters
      while (this.type !== types$1.parenR) {
        first ? first = false : this.expect(types$1.comma);
        if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
          lastIsComma = true;
          break
        } else if (this.type === types$1.ellipsis) {
          spreadStart = this.start;
          exprList.push(this.parseParenItem(this.parseRestBinding()));
          if (this.type === types$1.comma) {
            this.raiseRecoverable(
              this.start,
              "Comma is not permitted after the rest element"
            );
          }
          break
        } else {
          exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
        }
      }
      var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
      this.expect(types$1.parenR);

      if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
        this.checkPatternErrors(refDestructuringErrors, false);
        this.checkYieldAwaitInDefaultParams();
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        return this.parseParenArrowList(startPos, startLoc, exprList, forInit)
      }

      if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
      if (spreadStart) { this.unexpected(spreadStart); }
      this.checkExpressionErrors(refDestructuringErrors, true);
      this.yieldPos = oldYieldPos || this.yieldPos;
      this.awaitPos = oldAwaitPos || this.awaitPos;

      if (exprList.length > 1) {
        val = this.startNodeAt(innerStartPos, innerStartLoc);
        val.expressions = exprList;
        this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
      } else {
        val = exprList[0];
      }
    } else {
      val = this.parseParenExpression();
    }

    if (this.options.preserveParens) {
      var par = this.startNodeAt(startPos, startLoc);
      par.expression = val;
      return this.finishNode(par, "ParenthesizedExpression")
    } else {
      return val
    }
  };

  pp$5.parseParenItem = function(item) {
    return item
  };

  pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit)
  };

  // New's precedence is slightly tricky. It must allow its argument to
  // be a `[]` or dot subscript expression, but not a call — at least,
  // not without wrapping it in parentheses. Thus, it uses the noCalls
  // argument to parseSubscripts to prevent it from consuming the
  // argument list.

  var empty = [];

  pp$5.parseNew = function() {
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword new"); }
    var node = this.startNode();
    this.next();
    if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
      var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
      meta.name = "new";
      node.meta = this.finishNode(meta, "Identifier");
      this.next();
      var containsEsc = this.containsEsc;
      node.property = this.parseIdent(true);
      if (node.property.name !== "target")
        { this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'"); }
      if (containsEsc)
        { this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters"); }
      if (!this.allowNewDotTarget)
        { this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block"); }
      return this.finishNode(node, "MetaProperty")
    }
    var startPos = this.start, startLoc = this.startLoc;
    node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
    if (this.eat(types$1.parenL)) { node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false); }
    else { node.arguments = empty; }
    return this.finishNode(node, "NewExpression")
  };

  // Parse template expression.

  pp$5.parseTemplateElement = function(ref) {
    var isTagged = ref.isTagged;

    var elem = this.startNode();
    if (this.type === types$1.invalidTemplate) {
      if (!isTagged) {
        this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
      }
      elem.value = {
        raw: this.value.replace(/\r\n?/g, "\n"),
        cooked: null
      };
    } else {
      elem.value = {
        raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
        cooked: this.value
      };
    }
    this.next();
    elem.tail = this.type === types$1.backQuote;
    return this.finishNode(elem, "TemplateElement")
  };

  pp$5.parseTemplate = function(ref) {
    if ( ref === void 0 ) ref = {};
    var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

    var node = this.startNode();
    this.next();
    node.expressions = [];
    var curElt = this.parseTemplateElement({isTagged: isTagged});
    node.quasis = [curElt];
    while (!curElt.tail) {
      if (this.type === types$1.eof) { this.raise(this.pos, "Unterminated template literal"); }
      this.expect(types$1.dollarBraceL);
      node.expressions.push(this.parseExpression());
      this.expect(types$1.braceR);
      node.quasis.push(curElt = this.parseTemplateElement({isTagged: isTagged}));
    }
    this.next();
    return this.finishNode(node, "TemplateLiteral")
  };

  pp$5.isAsyncProp = function(prop) {
    return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
      (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types$1.star)) &&
      !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  };

  // Parse an object literal or binding pattern.

  pp$5.parseObj = function(isPattern, refDestructuringErrors) {
    var node = this.startNode(), first = true, propHash = {};
    node.properties = [];
    this.next();
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      var prop = this.parseProperty(isPattern, refDestructuringErrors);
      if (!isPattern) { this.checkPropClash(prop, propHash, refDestructuringErrors); }
      node.properties.push(prop);
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
  };

  pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
    var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
    if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
      if (isPattern) {
        prop.argument = this.parseIdent(false);
        if (this.type === types$1.comma) {
          this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
        }
        return this.finishNode(prop, "RestElement")
      }
      // Parse argument.
      prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
      // To disallow trailing comma via `this.toAssignable()`.
      if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
        refDestructuringErrors.trailingComma = this.start;
      }
      // Finish
      return this.finishNode(prop, "SpreadElement")
    }
    if (this.options.ecmaVersion >= 6) {
      prop.method = false;
      prop.shorthand = false;
      if (isPattern || refDestructuringErrors) {
        startPos = this.start;
        startLoc = this.startLoc;
      }
      if (!isPattern)
        { isGenerator = this.eat(types$1.star); }
    }
    var containsEsc = this.containsEsc;
    this.parsePropertyName(prop);
    if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
      isAsync = true;
      isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
      this.parsePropertyName(prop);
    } else {
      isAsync = false;
    }
    this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
    return this.finishNode(prop, "Property")
  };

  pp$5.parseGetterSetter = function(prop) {
    var kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    prop.kind = kind;
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get")
        { this.raiseRecoverable(start, "getter should have no params"); }
      else
        { this.raiseRecoverable(start, "setter should have exactly one param"); }
    } else {
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
    }
  };

  pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
    if ((isGenerator || isAsync) && this.type === types$1.colon)
      { this.unexpected(); }

    if (this.eat(types$1.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
      prop.kind = "init";
    } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
      if (isPattern) { this.unexpected(); }
      prop.method = true;
      prop.value = this.parseMethod(isGenerator, isAsync);
      prop.kind = "init";
    } else if (!isPattern && !containsEsc &&
               this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
               (prop.key.name === "get" || prop.key.name === "set") &&
               (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
      if (isGenerator || isAsync) { this.unexpected(); }
      this.parseGetterSetter(prop);
    } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
      if (isGenerator || isAsync) { this.unexpected(); }
      this.checkUnreserved(prop.key);
      if (prop.key.name === "await" && !this.awaitIdentPos)
        { this.awaitIdentPos = startPos; }
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
      } else if (this.type === types$1.eq && refDestructuringErrors) {
        if (refDestructuringErrors.shorthandAssign < 0)
          { refDestructuringErrors.shorthandAssign = this.start; }
        prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
      } else {
        prop.value = this.copyNode(prop.key);
      }
      prop.kind = "init";
      prop.shorthand = true;
    } else { this.unexpected(); }
  };

  pp$5.parsePropertyName = function(prop) {
    if (this.options.ecmaVersion >= 6) {
      if (this.eat(types$1.bracketL)) {
        prop.computed = true;
        prop.key = this.parseMaybeAssign();
        this.expect(types$1.bracketR);
        return prop.key
      } else {
        prop.computed = false;
      }
    }
    return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never")
  };

  // Initialize empty function node.

  pp$5.initFunction = function(node) {
    node.id = null;
    if (this.options.ecmaVersion >= 6) { node.generator = node.expression = false; }
    if (this.options.ecmaVersion >= 8) { node.async = false; }
  };

  // Parse object or class method.

  pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
    var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

    this.initFunction(node);
    if (this.options.ecmaVersion >= 6)
      { node.generator = isGenerator; }
    if (this.options.ecmaVersion >= 8)
      { node.async = !!isAsync; }

    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));

    this.expect(types$1.parenL);
    node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
    this.parseFunctionBody(node, false, true, false);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "FunctionExpression")
  };

  // Parse arrow function expression with given parameters.

  pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

    this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
    this.initFunction(node);
    if (this.options.ecmaVersion >= 8) { node.async = !!isAsync; }

    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;

    node.params = this.toAssignableList(params, true);
    this.parseFunctionBody(node, true, false, forInit);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "ArrowFunctionExpression")
  };

  // Parse function body and check parameters.

  pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
    var isExpression = isArrowFunction && this.type !== types$1.braceL;
    var oldStrict = this.strict, useStrict = false;

    if (isExpression) {
      node.body = this.parseMaybeAssign(forInit);
      node.expression = true;
      this.checkParams(node, false);
    } else {
      var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
      if (!oldStrict || nonSimple) {
        useStrict = this.strictDirective(this.end);
        // If this is a strict mode function, verify that argument names
        // are not repeated, and it does not try to bind the words `eval`
        // or `arguments`.
        if (useStrict && nonSimple)
          { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
      }
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldLabels = this.labels;
      this.labels = [];
      if (useStrict) { this.strict = true; }

      // Add the params to varDeclaredNames to ensure that an error is thrown
      // if a let/const declaration in the function clashes with one of the params.
      this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
      // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
      if (this.strict && node.id) { this.checkLValSimple(node.id, BIND_OUTSIDE); }
      node.body = this.parseBlock(false, undefined, useStrict && !oldStrict);
      node.expression = false;
      this.adaptDirectivePrologue(node.body.body);
      this.labels = oldLabels;
    }
    this.exitScope();
  };

  pp$5.isSimpleParamList = function(params) {
    for (var i = 0, list = params; i < list.length; i += 1)
      {
      var param = list[i];

      if (param.type !== "Identifier") { return false
    } }
    return true
  };

  // Checks function params for various disallowed patterns such as using "eval"
  // or "arguments" and duplicate parameters.

  pp$5.checkParams = function(node, allowDuplicates) {
    var nameHash = Object.create(null);
    for (var i = 0, list = node.params; i < list.length; i += 1)
      {
      var param = list[i];

      this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
    }
  };

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
    var elts = [], first = true;
    while (!this.eat(close)) {
      if (!first) {
        this.expect(types$1.comma);
        if (allowTrailingComma && this.afterTrailingComma(close)) { break }
      } else { first = false; }

      var elt = (void 0);
      if (allowEmpty && this.type === types$1.comma)
        { elt = null; }
      else if (this.type === types$1.ellipsis) {
        elt = this.parseSpread(refDestructuringErrors);
        if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0)
          { refDestructuringErrors.trailingComma = this.start; }
      } else {
        elt = this.parseMaybeAssign(false, refDestructuringErrors);
      }
      elts.push(elt);
    }
    return elts
  };

  pp$5.checkUnreserved = function(ref) {
    var start = ref.start;
    var end = ref.end;
    var name = ref.name;

    if (this.inGenerator && name === "yield")
      { this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator"); }
    if (this.inAsync && name === "await")
      { this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function"); }
    if (!(this.currentThisScope().flags & SCOPE_VAR) && name === "arguments")
      { this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer"); }
    if (this.inClassStaticBlock && (name === "arguments" || name === "await"))
      { this.raise(start, ("Cannot use " + name + " in class static initialization block")); }
    if (this.keywords.test(name))
      { this.raise(start, ("Unexpected keyword '" + name + "'")); }
    if (this.options.ecmaVersion < 6 &&
      this.input.slice(start, end).indexOf("\\") !== -1) { return }
    var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
    if (re.test(name)) {
      if (!this.inAsync && name === "await")
        { this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function"); }
      this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
    }
  };

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  pp$5.parseIdent = function(liberal) {
    var node = this.parseIdentNode();
    this.next(!!liberal);
    this.finishNode(node, "Identifier");
    if (!liberal) {
      this.checkUnreserved(node);
      if (node.name === "await" && !this.awaitIdentPos)
        { this.awaitIdentPos = node.start; }
    }
    return node
  };

  pp$5.parseIdentNode = function() {
    var node = this.startNode();
    if (this.type === types$1.name) {
      node.name = this.value;
    } else if (this.type.keyword) {
      node.name = this.type.keyword;

      // To fix https://github.com/acornjs/acorn/issues/575
      // `class` and `function` keywords push new context into this.context.
      // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
      // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
      if ((node.name === "class" || node.name === "function") &&
        (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
        this.context.pop();
      }
      this.type = types$1.name;
    } else {
      this.unexpected();
    }
    return node
  };

  pp$5.parsePrivateIdent = function() {
    var node = this.startNode();
    if (this.type === types$1.privateId) {
      node.name = this.value;
    } else {
      this.unexpected();
    }
    this.next();
    this.finishNode(node, "PrivateIdentifier");

    // For validating existence
    if (this.options.checkPrivateFields) {
      if (this.privateNameStack.length === 0) {
        this.raise(node.start, ("Private field '#" + (node.name) + "' must be declared in an enclosing class"));
      } else {
        this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
      }
    }

    return node
  };

  // Parses yield expression inside generator.

  pp$5.parseYield = function(forInit) {
    if (!this.yieldPos) { this.yieldPos = this.start; }

    var node = this.startNode();
    this.next();
    if (this.type === types$1.semi || this.canInsertSemicolon() || (this.type !== types$1.star && !this.type.startsExpr)) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = this.eat(types$1.star);
      node.argument = this.parseMaybeAssign(forInit);
    }
    return this.finishNode(node, "YieldExpression")
  };

  pp$5.parseAwait = function(forInit) {
    if (!this.awaitPos) { this.awaitPos = this.start; }

    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeUnary(null, true, false, forInit);
    return this.finishNode(node, "AwaitExpression")
  };

  var pp$4 = Parser.prototype;

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  pp$4.raise = function(pos, message) {
    var loc = getLineInfo(this.input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    if (this.sourceFile) {
      message += " in " + this.sourceFile;
    }
    var err = new SyntaxError(message);
    err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
    throw err
  };

  pp$4.raiseRecoverable = pp$4.raise;

  pp$4.curPosition = function() {
    if (this.options.locations) {
      return new Position(this.curLine, this.pos - this.lineStart)
    }
  };

  var pp$3 = Parser.prototype;

  var Scope = function Scope(flags) {
    this.flags = flags;
    // A list of var-declared names in the current lexical scope
    this.var = [];
    // A list of lexically-declared names in the current lexical scope
    this.lexical = [];
    // A list of lexically-declared FunctionDeclaration names in the current lexical scope
    this.functions = [];
  };

  // The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

  pp$3.enterScope = function(flags) {
    this.scopeStack.push(new Scope(flags));
  };

  pp$3.exitScope = function() {
    this.scopeStack.pop();
  };

  // The spec says:
  // > At the top level of a function, or script, function declarations are
  // > treated like var declarations rather than like lexical declarations.
  pp$3.treatFunctionsAsVarInScope = function(scope) {
    return (scope.flags & SCOPE_FUNCTION) || !this.inModule && (scope.flags & SCOPE_TOP)
  };

  pp$3.declareName = function(name, bindingType, pos) {
    var redeclared = false;
    if (bindingType === BIND_LEXICAL) {
      var scope = this.currentScope();
      redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
      scope.lexical.push(name);
      if (this.inModule && (scope.flags & SCOPE_TOP))
        { delete this.undefinedExports[name]; }
    } else if (bindingType === BIND_SIMPLE_CATCH) {
      var scope$1 = this.currentScope();
      scope$1.lexical.push(name);
    } else if (bindingType === BIND_FUNCTION) {
      var scope$2 = this.currentScope();
      if (this.treatFunctionsAsVar)
        { redeclared = scope$2.lexical.indexOf(name) > -1; }
      else
        { redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1; }
      scope$2.functions.push(name);
    } else {
      for (var i = this.scopeStack.length - 1; i >= 0; --i) {
        var scope$3 = this.scopeStack[i];
        if (scope$3.lexical.indexOf(name) > -1 && !((scope$3.flags & SCOPE_SIMPLE_CATCH) && scope$3.lexical[0] === name) ||
            !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
          redeclared = true;
          break
        }
        scope$3.var.push(name);
        if (this.inModule && (scope$3.flags & SCOPE_TOP))
          { delete this.undefinedExports[name]; }
        if (scope$3.flags & SCOPE_VAR) { break }
      }
    }
    if (redeclared) { this.raiseRecoverable(pos, ("Identifier '" + name + "' has already been declared")); }
  };

  pp$3.checkLocalExport = function(id) {
    // scope.functions must be empty as Module code is always strict.
    if (this.scopeStack[0].lexical.indexOf(id.name) === -1 &&
        this.scopeStack[0].var.indexOf(id.name) === -1) {
      this.undefinedExports[id.name] = id;
    }
  };

  pp$3.currentScope = function() {
    return this.scopeStack[this.scopeStack.length - 1]
  };

  pp$3.currentVarScope = function() {
    for (var i = this.scopeStack.length - 1;; i--) {
      var scope = this.scopeStack[i];
      if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK)) { return scope }
    }
  };

  // Could be useful for `this`, `new.target`, `super()`, `super.property`, and `super[property]`.
  pp$3.currentThisScope = function() {
    for (var i = this.scopeStack.length - 1;; i--) {
      var scope = this.scopeStack[i];
      if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK) &&
          !(scope.flags & SCOPE_ARROW)) { return scope }
    }
  };

  var Node = function Node(parser, pos, loc) {
    this.type = "";
    this.start = pos;
    this.end = 0;
    if (parser.options.locations)
      { this.loc = new SourceLocation(parser, loc); }
    if (parser.options.directSourceFile)
      { this.sourceFile = parser.options.directSourceFile; }
    if (parser.options.ranges)
      { this.range = [pos, 0]; }
  };

  // Start an AST node, attaching a start offset.

  var pp$2 = Parser.prototype;

  pp$2.startNode = function() {
    return new Node(this, this.start, this.startLoc)
  };

  pp$2.startNodeAt = function(pos, loc) {
    return new Node(this, pos, loc)
  };

  // Finish an AST node, adding `type` and `end` properties.

  function finishNodeAt(node, type, pos, loc) {
    node.type = type;
    node.end = pos;
    if (this.options.locations)
      { node.loc.end = loc; }
    if (this.options.ranges)
      { node.range[1] = pos; }
    return node
  }

  pp$2.finishNode = function(node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
  };

  // Finish node at given position

  pp$2.finishNodeAt = function(node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc)
  };

  pp$2.copyNode = function(node) {
    var newNode = new Node(this, node.start, this.startLoc);
    for (var prop in node) { newNode[prop] = node[prop]; }
    return newNode
  };

  // This file was generated by "bin/generate-unicode-script-values.js". Do not modify manually!
  var scriptValuesAddedInUnicode = "Gara Garay Gukh Gurung_Khema Hrkt Katakana_Or_Hiragana Kawi Kirat_Rai Krai Nag_Mundari Nagm Ol_Onal Onao Sunu Sunuwar Todhri Todr Tulu_Tigalari Tutg Unknown Zzzz";

  // This file contains Unicode properties extracted from the ECMAScript specification.
  // The lists are extracted like so:
  // $$('#table-binary-unicode-properties > figure > table > tbody > tr > td:nth-child(1) code').map(el => el.innerText)

  // #table-binary-unicode-properties
  var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
  var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
  var ecma11BinaryProperties = ecma10BinaryProperties;
  var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
  var ecma13BinaryProperties = ecma12BinaryProperties;
  var ecma14BinaryProperties = ecma13BinaryProperties;

  var unicodeBinaryProperties = {
    9: ecma9BinaryProperties,
    10: ecma10BinaryProperties,
    11: ecma11BinaryProperties,
    12: ecma12BinaryProperties,
    13: ecma13BinaryProperties,
    14: ecma14BinaryProperties
  };

  // #table-binary-unicode-properties-of-strings
  var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";

  var unicodeBinaryPropertiesOfStrings = {
    9: "",
    10: "",
    11: "",
    12: "",
    13: "",
    14: ecma14BinaryPropertiesOfStrings
  };

  // #table-unicode-general-category-values
  var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";

  // #table-unicode-script-values
  var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
  var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
  var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
  var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
  var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
  var ecma14ScriptValues = ecma13ScriptValues + " " + scriptValuesAddedInUnicode;

  var unicodeScriptValues = {
    9: ecma9ScriptValues,
    10: ecma10ScriptValues,
    11: ecma11ScriptValues,
    12: ecma12ScriptValues,
    13: ecma13ScriptValues,
    14: ecma14ScriptValues
  };

  var data = {};
  function buildUnicodeData(ecmaVersion) {
    var d = data[ecmaVersion] = {
      binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
      binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
      nonBinary: {
        General_Category: wordsRegexp(unicodeGeneralCategoryValues),
        Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
      }
    };
    d.nonBinary.Script_Extensions = d.nonBinary.Script;

    d.nonBinary.gc = d.nonBinary.General_Category;
    d.nonBinary.sc = d.nonBinary.Script;
    d.nonBinary.scx = d.nonBinary.Script_Extensions;
  }

  for (var i = 0, list = [9, 10, 11, 12, 13, 14]; i < list.length; i += 1) {
    var ecmaVersion = list[i];

    buildUnicodeData(ecmaVersion);
  }

  var pp$1 = Parser.prototype;

  // Track disjunction structure to determine whether a duplicate
  // capture group name is allowed because it is in a separate branch.
  var BranchID = function BranchID(parent, base) {
    // Parent disjunction branch
    this.parent = parent;
    // Identifies this set of sibling branches
    this.base = base || this;
  };

  BranchID.prototype.separatedFrom = function separatedFrom (alt) {
    // A branch is separate from another branch if they or any of
    // their parents are siblings in a given disjunction
    for (var self = this; self; self = self.parent) {
      for (var other = alt; other; other = other.parent) {
        if (self.base === other.base && self !== other) { return true }
      }
    }
    return false
  };

  BranchID.prototype.sibling = function sibling () {
    return new BranchID(this.parent, this.base)
  };

  var RegExpValidationState = function RegExpValidationState(parser) {
    this.parser = parser;
    this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
    this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
    this.source = "";
    this.flags = "";
    this.start = 0;
    this.switchU = false;
    this.switchV = false;
    this.switchN = false;
    this.pos = 0;
    this.lastIntValue = 0;
    this.lastStringValue = "";
    this.lastAssertionIsQuantifiable = false;
    this.numCapturingParens = 0;
    this.maxBackReference = 0;
    this.groupNames = Object.create(null);
    this.backReferenceNames = [];
    this.branchID = null;
  };

  RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
    var unicodeSets = flags.indexOf("v") !== -1;
    var unicode = flags.indexOf("u") !== -1;
    this.start = start | 0;
    this.source = pattern + "";
    this.flags = flags;
    if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
      this.switchU = true;
      this.switchV = true;
      this.switchN = true;
    } else {
      this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
      this.switchV = false;
      this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
    }
  };

  RegExpValidationState.prototype.raise = function raise (message) {
    this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
  };

  // If u flag is given, this returns the code point at the index (it combines a surrogate pair).
  // Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
  RegExpValidationState.prototype.at = function at (i, forceU) {
      if ( forceU === void 0 ) forceU = false;

    var s = this.source;
    var l = s.length;
    if (i >= l) {
      return -1
    }
    var c = s.charCodeAt(i);
    if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
      return c
    }
    var next = s.charCodeAt(i + 1);
    return next >= 0xDC00 && next <= 0xDFFF ? (c << 10) + next - 0x35FDC00 : c
  };

  RegExpValidationState.prototype.nextIndex = function nextIndex (i, forceU) {
      if ( forceU === void 0 ) forceU = false;

    var s = this.source;
    var l = s.length;
    if (i >= l) {
      return l
    }
    var c = s.charCodeAt(i), next;
    if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l ||
        (next = s.charCodeAt(i + 1)) < 0xDC00 || next > 0xDFFF) {
      return i + 1
    }
    return i + 2
  };

  RegExpValidationState.prototype.current = function current (forceU) {
      if ( forceU === void 0 ) forceU = false;

    return this.at(this.pos, forceU)
  };

  RegExpValidationState.prototype.lookahead = function lookahead (forceU) {
      if ( forceU === void 0 ) forceU = false;

    return this.at(this.nextIndex(this.pos, forceU), forceU)
  };

  RegExpValidationState.prototype.advance = function advance (forceU) {
      if ( forceU === void 0 ) forceU = false;

    this.pos = this.nextIndex(this.pos, forceU);
  };

  RegExpValidationState.prototype.eat = function eat (ch, forceU) {
      if ( forceU === void 0 ) forceU = false;

    if (this.current(forceU) === ch) {
      this.advance(forceU);
      return true
    }
    return false
  };

  RegExpValidationState.prototype.eatChars = function eatChars (chs, forceU) {
      if ( forceU === void 0 ) forceU = false;

    var pos = this.pos;
    for (var i = 0, list = chs; i < list.length; i += 1) {
      var ch = list[i];

        var current = this.at(pos, forceU);
      if (current === -1 || current !== ch) {
        return false
      }
      pos = this.nextIndex(pos, forceU);
    }
    this.pos = pos;
    return true
  };

  /**
   * Validate the flags part of a given RegExpLiteral.
   *
   * @param {RegExpValidationState} state The state to validate RegExp.
   * @returns {void}
   */
  pp$1.validateRegExpFlags = function(state) {
    var validFlags = state.validFlags;
    var flags = state.flags;

    var u = false;
    var v = false;

    for (var i = 0; i < flags.length; i++) {
      var flag = flags.charAt(i);
      if (validFlags.indexOf(flag) === -1) {
        this.raise(state.start, "Invalid regular expression flag");
      }
      if (flags.indexOf(flag, i + 1) > -1) {
        this.raise(state.start, "Duplicate regular expression flag");
      }
      if (flag === "u") { u = true; }
      if (flag === "v") { v = true; }
    }
    if (this.options.ecmaVersion >= 15 && u && v) {
      this.raise(state.start, "Invalid regular expression flag");
    }
  };

  function hasProp(obj) {
    for (var _ in obj) { return true }
    return false
  }

  /**
   * Validate the pattern part of a given RegExpLiteral.
   *
   * @param {RegExpValidationState} state The state to validate RegExp.
   * @returns {void}
   */
  pp$1.validateRegExpPattern = function(state) {
    this.regexp_pattern(state);

    // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
    // parsing contains a |GroupName|, reparse with the goal symbol
    // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
    // exception if _P_ did not conform to the grammar, if any elements of _P_
    // were not matched by the parse, or if any Early Error conditions exist.
    if (!state.switchN && this.options.ecmaVersion >= 9 && hasProp(state.groupNames)) {
      state.switchN = true;
      this.regexp_pattern(state);
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
  pp$1.regexp_pattern = function(state) {
    state.pos = 0;
    state.lastIntValue = 0;
    state.lastStringValue = "";
    state.lastAssertionIsQuantifiable = false;
    state.numCapturingParens = 0;
    state.maxBackReference = 0;
    state.groupNames = Object.create(null);
    state.backReferenceNames.length = 0;
    state.branchID = null;

    this.regexp_disjunction(state);

    if (state.pos !== state.source.length) {
      // Make the same messages as V8.
      if (state.eat(0x29 /* ) */)) {
        state.raise("Unmatched ')'");
      }
      if (state.eat(0x5D /* ] */) || state.eat(0x7D /* } */)) {
        state.raise("Lone quantifier brackets");
      }
    }
    if (state.maxBackReference > state.numCapturingParens) {
      state.raise("Invalid escape");
    }
    for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
      var name = list[i];

      if (!state.groupNames[name]) {
        state.raise("Invalid named capture referenced");
      }
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
  pp$1.regexp_disjunction = function(state) {
    var trackDisjunction = this.options.ecmaVersion >= 16;
    if (trackDisjunction) { state.branchID = new BranchID(state.branchID, null); }
    this.regexp_alternative(state);
    while (state.eat(0x7C /* | */)) {
      if (trackDisjunction) { state.branchID = state.branchID.sibling(); }
      this.regexp_alternative(state);
    }
    if (trackDisjunction) { state.branchID = state.branchID.parent; }

    // Make the same message as V8.
    if (this.regexp_eatQuantifier(state, true)) {
      state.raise("Nothing to repeat");
    }
    if (state.eat(0x7B /* { */)) {
      state.raise("Lone quantifier brackets");
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
  pp$1.regexp_alternative = function(state) {
    while (state.pos < state.source.length && this.regexp_eatTerm(state)) {}
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
  pp$1.regexp_eatTerm = function(state) {
    if (this.regexp_eatAssertion(state)) {
      // Handle `QuantifiableAssertion Quantifier` alternative.
      // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
      // is a QuantifiableAssertion.
      if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
        // Make the same message as V8.
        if (state.switchU) {
          state.raise("Invalid quantifier");
        }
      }
      return true
    }

    if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
      this.regexp_eatQuantifier(state);
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
  pp$1.regexp_eatAssertion = function(state) {
    var start = state.pos;
    state.lastAssertionIsQuantifiable = false;

    // ^, $
    if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
      return true
    }

    // \b \B
    if (state.eat(0x5C /* \ */)) {
      if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
        return true
      }
      state.pos = start;
    }

    // Lookahead / Lookbehind
    if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
      var lookbehind = false;
      if (this.options.ecmaVersion >= 9) {
        lookbehind = state.eat(0x3C /* < */);
      }
      if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
        this.regexp_disjunction(state);
        if (!state.eat(0x29 /* ) */)) {
          state.raise("Unterminated group");
        }
        state.lastAssertionIsQuantifiable = !lookbehind;
        return true
      }
    }

    state.pos = start;
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
  pp$1.regexp_eatQuantifier = function(state, noError) {
    if ( noError === void 0 ) noError = false;

    if (this.regexp_eatQuantifierPrefix(state, noError)) {
      state.eat(0x3F /* ? */);
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
  pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
    return (
      state.eat(0x2A /* * */) ||
      state.eat(0x2B /* + */) ||
      state.eat(0x3F /* ? */) ||
      this.regexp_eatBracedQuantifier(state, noError)
    )
  };
  pp$1.regexp_eatBracedQuantifier = function(state, noError) {
    var start = state.pos;
    if (state.eat(0x7B /* { */)) {
      var min = 0, max = -1;
      if (this.regexp_eatDecimalDigits(state)) {
        min = state.lastIntValue;
        if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
          max = state.lastIntValue;
        }
        if (state.eat(0x7D /* } */)) {
          // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
          if (max !== -1 && max < min && !noError) {
            state.raise("numbers out of order in {} quantifier");
          }
          return true
        }
      }
      if (state.switchU && !noError) {
        state.raise("Incomplete quantifier");
      }
      state.pos = start;
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
  pp$1.regexp_eatAtom = function(state) {
    return (
      this.regexp_eatPatternCharacters(state) ||
      state.eat(0x2E /* . */) ||
      this.regexp_eatReverseSolidusAtomEscape(state) ||
      this.regexp_eatCharacterClass(state) ||
      this.regexp_eatUncapturingGroup(state) ||
      this.regexp_eatCapturingGroup(state)
    )
  };
  pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
    var start = state.pos;
    if (state.eat(0x5C /* \ */)) {
      if (this.regexp_eatAtomEscape(state)) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatUncapturingGroup = function(state) {
    var start = state.pos;
    if (state.eat(0x28 /* ( */)) {
      if (state.eat(0x3F /* ? */)) {
        if (this.options.ecmaVersion >= 16) {
          var addModifiers = this.regexp_eatModifiers(state);
          var hasHyphen = state.eat(0x2D /* - */);
          if (addModifiers || hasHyphen) {
            for (var i = 0; i < addModifiers.length; i++) {
              var modifier = addModifiers.charAt(i);
              if (addModifiers.indexOf(modifier, i + 1) > -1) {
                state.raise("Duplicate regular expression modifiers");
              }
            }
            if (hasHyphen) {
              var removeModifiers = this.regexp_eatModifiers(state);
              if (!addModifiers && !removeModifiers && state.current() === 0x3A /* : */) {
                state.raise("Invalid regular expression modifiers");
              }
              for (var i$1 = 0; i$1 < removeModifiers.length; i$1++) {
                var modifier$1 = removeModifiers.charAt(i$1);
                if (
                  removeModifiers.indexOf(modifier$1, i$1 + 1) > -1 ||
                  addModifiers.indexOf(modifier$1) > -1
                ) {
                  state.raise("Duplicate regular expression modifiers");
                }
              }
            }
          }
        }
        if (state.eat(0x3A /* : */)) {
          this.regexp_disjunction(state);
          if (state.eat(0x29 /* ) */)) {
            return true
          }
          state.raise("Unterminated group");
        }
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatCapturingGroup = function(state) {
    if (state.eat(0x28 /* ( */)) {
      if (this.options.ecmaVersion >= 9) {
        this.regexp_groupSpecifier(state);
      } else if (state.current() === 0x3F /* ? */) {
        state.raise("Invalid group");
      }
      this.regexp_disjunction(state);
      if (state.eat(0x29 /* ) */)) {
        state.numCapturingParens += 1;
        return true
      }
      state.raise("Unterminated group");
    }
    return false
  };
  // RegularExpressionModifiers ::
  //   [empty]
  //   RegularExpressionModifiers RegularExpressionModifier
  pp$1.regexp_eatModifiers = function(state) {
    var modifiers = "";
    var ch = 0;
    while ((ch = state.current()) !== -1 && isRegularExpressionModifier(ch)) {
      modifiers += codePointToString(ch);
      state.advance();
    }
    return modifiers
  };
  // RegularExpressionModifier :: one of
  //   `i` `m` `s`
  function isRegularExpressionModifier(ch) {
    return ch === 0x69 /* i */ || ch === 0x6d /* m */ || ch === 0x73 /* s */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
  pp$1.regexp_eatExtendedAtom = function(state) {
    return (
      state.eat(0x2E /* . */) ||
      this.regexp_eatReverseSolidusAtomEscape(state) ||
      this.regexp_eatCharacterClass(state) ||
      this.regexp_eatUncapturingGroup(state) ||
      this.regexp_eatCapturingGroup(state) ||
      this.regexp_eatInvalidBracedQuantifier(state) ||
      this.regexp_eatExtendedPatternCharacter(state)
    )
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
  pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
    if (this.regexp_eatBracedQuantifier(state, true)) {
      state.raise("Nothing to repeat");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
  pp$1.regexp_eatSyntaxCharacter = function(state) {
    var ch = state.current();
    if (isSyntaxCharacter(ch)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }
    return false
  };
  function isSyntaxCharacter(ch) {
    return (
      ch === 0x24 /* $ */ ||
      ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
      ch === 0x2E /* . */ ||
      ch === 0x3F /* ? */ ||
      ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
      ch >= 0x7B /* { */ && ch <= 0x7D /* } */
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
  // But eat eager.
  pp$1.regexp_eatPatternCharacters = function(state) {
    var start = state.pos;
    var ch = 0;
    while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
      state.advance();
    }
    return state.pos !== start
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
  pp$1.regexp_eatExtendedPatternCharacter = function(state) {
    var ch = state.current();
    if (
      ch !== -1 &&
      ch !== 0x24 /* $ */ &&
      !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
      ch !== 0x2E /* . */ &&
      ch !== 0x3F /* ? */ &&
      ch !== 0x5B /* [ */ &&
      ch !== 0x5E /* ^ */ &&
      ch !== 0x7C /* | */
    ) {
      state.advance();
      return true
    }
    return false
  };

  // GroupSpecifier ::
  //   [empty]
  //   `?` GroupName
  pp$1.regexp_groupSpecifier = function(state) {
    if (state.eat(0x3F /* ? */)) {
      if (!this.regexp_eatGroupName(state)) { state.raise("Invalid group"); }
      var trackDisjunction = this.options.ecmaVersion >= 16;
      var known = state.groupNames[state.lastStringValue];
      if (known) {
        if (trackDisjunction) {
          for (var i = 0, list = known; i < list.length; i += 1) {
            var altID = list[i];

            if (!altID.separatedFrom(state.branchID))
              { state.raise("Duplicate capture group name"); }
          }
        } else {
          state.raise("Duplicate capture group name");
        }
      }
      if (trackDisjunction) {
        (known || (state.groupNames[state.lastStringValue] = [])).push(state.branchID);
      } else {
        state.groupNames[state.lastStringValue] = true;
      }
    }
  };

  // GroupName ::
  //   `<` RegExpIdentifierName `>`
  // Note: this updates `state.lastStringValue` property with the eaten name.
  pp$1.regexp_eatGroupName = function(state) {
    state.lastStringValue = "";
    if (state.eat(0x3C /* < */)) {
      if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
        return true
      }
      state.raise("Invalid capture group name");
    }
    return false
  };

  // RegExpIdentifierName ::
  //   RegExpIdentifierStart
  //   RegExpIdentifierName RegExpIdentifierPart
  // Note: this updates `state.lastStringValue` property with the eaten name.
  pp$1.regexp_eatRegExpIdentifierName = function(state) {
    state.lastStringValue = "";
    if (this.regexp_eatRegExpIdentifierStart(state)) {
      state.lastStringValue += codePointToString(state.lastIntValue);
      while (this.regexp_eatRegExpIdentifierPart(state)) {
        state.lastStringValue += codePointToString(state.lastIntValue);
      }
      return true
    }
    return false
  };

  // RegExpIdentifierStart ::
  //   UnicodeIDStart
  //   `$`
  //   `_`
  //   `\` RegExpUnicodeEscapeSequence[+U]
  pp$1.regexp_eatRegExpIdentifierStart = function(state) {
    var start = state.pos;
    var forceU = this.options.ecmaVersion >= 11;
    var ch = state.current(forceU);
    state.advance(forceU);

    if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
      ch = state.lastIntValue;
    }
    if (isRegExpIdentifierStart(ch)) {
      state.lastIntValue = ch;
      return true
    }

    state.pos = start;
    return false
  };
  function isRegExpIdentifierStart(ch) {
    return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
  }

  // RegExpIdentifierPart ::
  //   UnicodeIDContinue
  //   `$`
  //   `_`
  //   `\` RegExpUnicodeEscapeSequence[+U]
  //   <ZWNJ>
  //   <ZWJ>
  pp$1.regexp_eatRegExpIdentifierPart = function(state) {
    var start = state.pos;
    var forceU = this.options.ecmaVersion >= 11;
    var ch = state.current(forceU);
    state.advance(forceU);

    if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
      ch = state.lastIntValue;
    }
    if (isRegExpIdentifierPart(ch)) {
      state.lastIntValue = ch;
      return true
    }

    state.pos = start;
    return false
  };
  function isRegExpIdentifierPart(ch) {
    return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
  pp$1.regexp_eatAtomEscape = function(state) {
    if (
      this.regexp_eatBackReference(state) ||
      this.regexp_eatCharacterClassEscape(state) ||
      this.regexp_eatCharacterEscape(state) ||
      (state.switchN && this.regexp_eatKGroupName(state))
    ) {
      return true
    }
    if (state.switchU) {
      // Make the same message as V8.
      if (state.current() === 0x63 /* c */) {
        state.raise("Invalid unicode escape");
      }
      state.raise("Invalid escape");
    }
    return false
  };
  pp$1.regexp_eatBackReference = function(state) {
    var start = state.pos;
    if (this.regexp_eatDecimalEscape(state)) {
      var n = state.lastIntValue;
      if (state.switchU) {
        // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
        if (n > state.maxBackReference) {
          state.maxBackReference = n;
        }
        return true
      }
      if (n <= state.numCapturingParens) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatKGroupName = function(state) {
    if (state.eat(0x6B /* k */)) {
      if (this.regexp_eatGroupName(state)) {
        state.backReferenceNames.push(state.lastStringValue);
        return true
      }
      state.raise("Invalid named reference");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
  pp$1.regexp_eatCharacterEscape = function(state) {
    return (
      this.regexp_eatControlEscape(state) ||
      this.regexp_eatCControlLetter(state) ||
      this.regexp_eatZero(state) ||
      this.regexp_eatHexEscapeSequence(state) ||
      this.regexp_eatRegExpUnicodeEscapeSequence(state, false) ||
      (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
      this.regexp_eatIdentityEscape(state)
    )
  };
  pp$1.regexp_eatCControlLetter = function(state) {
    var start = state.pos;
    if (state.eat(0x63 /* c */)) {
      if (this.regexp_eatControlLetter(state)) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatZero = function(state) {
    if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
      state.lastIntValue = 0;
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
  pp$1.regexp_eatControlEscape = function(state) {
    var ch = state.current();
    if (ch === 0x74 /* t */) {
      state.lastIntValue = 0x09; /* \t */
      state.advance();
      return true
    }
    if (ch === 0x6E /* n */) {
      state.lastIntValue = 0x0A; /* \n */
      state.advance();
      return true
    }
    if (ch === 0x76 /* v */) {
      state.lastIntValue = 0x0B; /* \v */
      state.advance();
      return true
    }
    if (ch === 0x66 /* f */) {
      state.lastIntValue = 0x0C; /* \f */
      state.advance();
      return true
    }
    if (ch === 0x72 /* r */) {
      state.lastIntValue = 0x0D; /* \r */
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
  pp$1.regexp_eatControlLetter = function(state) {
    var ch = state.current();
    if (isControlLetter(ch)) {
      state.lastIntValue = ch % 0x20;
      state.advance();
      return true
    }
    return false
  };
  function isControlLetter(ch) {
    return (
      (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
      (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
  pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
    if ( forceU === void 0 ) forceU = false;

    var start = state.pos;
    var switchU = forceU || state.switchU;

    if (state.eat(0x75 /* u */)) {
      if (this.regexp_eatFixedHexDigits(state, 4)) {
        var lead = state.lastIntValue;
        if (switchU && lead >= 0xD800 && lead <= 0xDBFF) {
          var leadSurrogateEnd = state.pos;
          if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
            var trail = state.lastIntValue;
            if (trail >= 0xDC00 && trail <= 0xDFFF) {
              state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
              return true
            }
          }
          state.pos = leadSurrogateEnd;
          state.lastIntValue = lead;
        }
        return true
      }
      if (
        switchU &&
        state.eat(0x7B /* { */) &&
        this.regexp_eatHexDigits(state) &&
        state.eat(0x7D /* } */) &&
        isValidUnicode(state.lastIntValue)
      ) {
        return true
      }
      if (switchU) {
        state.raise("Invalid unicode escape");
      }
      state.pos = start;
    }

    return false
  };
  function isValidUnicode(ch) {
    return ch >= 0 && ch <= 0x10FFFF
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
  pp$1.regexp_eatIdentityEscape = function(state) {
    if (state.switchU) {
      if (this.regexp_eatSyntaxCharacter(state)) {
        return true
      }
      if (state.eat(0x2F /* / */)) {
        state.lastIntValue = 0x2F; /* / */
        return true
      }
      return false
    }

    var ch = state.current();
    if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
  pp$1.regexp_eatDecimalEscape = function(state) {
    state.lastIntValue = 0;
    var ch = state.current();
    if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
      do {
        state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
        state.advance();
      } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
      return true
    }
    return false
  };

  // Return values used by character set parsing methods, needed to
  // forbid negation of sets that can match strings.
  var CharSetNone = 0; // Nothing parsed
  var CharSetOk = 1; // Construct parsed, cannot contain strings
  var CharSetString = 2; // Construct parsed, can contain strings

  // https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
  pp$1.regexp_eatCharacterClassEscape = function(state) {
    var ch = state.current();

    if (isCharacterClassEscape(ch)) {
      state.lastIntValue = -1;
      state.advance();
      return CharSetOk
    }

    var negate = false;
    if (
      state.switchU &&
      this.options.ecmaVersion >= 9 &&
      ((negate = ch === 0x50 /* P */) || ch === 0x70 /* p */)
    ) {
      state.lastIntValue = -1;
      state.advance();
      var result;
      if (
        state.eat(0x7B /* { */) &&
        (result = this.regexp_eatUnicodePropertyValueExpression(state)) &&
        state.eat(0x7D /* } */)
      ) {
        if (negate && result === CharSetString) { state.raise("Invalid property name"); }
        return result
      }
      state.raise("Invalid property name");
    }

    return CharSetNone
  };

  function isCharacterClassEscape(ch) {
    return (
      ch === 0x64 /* d */ ||
      ch === 0x44 /* D */ ||
      ch === 0x73 /* s */ ||
      ch === 0x53 /* S */ ||
      ch === 0x77 /* w */ ||
      ch === 0x57 /* W */
    )
  }

  // UnicodePropertyValueExpression ::
  //   UnicodePropertyName `=` UnicodePropertyValue
  //   LoneUnicodePropertyNameOrValue
  pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
    var start = state.pos;

    // UnicodePropertyName `=` UnicodePropertyValue
    if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
      var name = state.lastStringValue;
      if (this.regexp_eatUnicodePropertyValue(state)) {
        var value = state.lastStringValue;
        this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
        return CharSetOk
      }
    }
    state.pos = start;

    // LoneUnicodePropertyNameOrValue
    if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
      var nameOrValue = state.lastStringValue;
      return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue)
    }
    return CharSetNone
  };

  pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
    if (!hasOwn(state.unicodeProperties.nonBinary, name))
      { state.raise("Invalid property name"); }
    if (!state.unicodeProperties.nonBinary[name].test(value))
      { state.raise("Invalid property value"); }
  };

  pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
    if (state.unicodeProperties.binary.test(nameOrValue)) { return CharSetOk }
    if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) { return CharSetString }
    state.raise("Invalid property name");
  };

  // UnicodePropertyName ::
  //   UnicodePropertyNameCharacters
  pp$1.regexp_eatUnicodePropertyName = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while (isUnicodePropertyNameCharacter(ch = state.current())) {
      state.lastStringValue += codePointToString(ch);
      state.advance();
    }
    return state.lastStringValue !== ""
  };

  function isUnicodePropertyNameCharacter(ch) {
    return isControlLetter(ch) || ch === 0x5F /* _ */
  }

  // UnicodePropertyValue ::
  //   UnicodePropertyValueCharacters
  pp$1.regexp_eatUnicodePropertyValue = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while (isUnicodePropertyValueCharacter(ch = state.current())) {
      state.lastStringValue += codePointToString(ch);
      state.advance();
    }
    return state.lastStringValue !== ""
  };
  function isUnicodePropertyValueCharacter(ch) {
    return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
  }

  // LoneUnicodePropertyNameOrValue ::
  //   UnicodePropertyValueCharacters
  pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
    return this.regexp_eatUnicodePropertyValue(state)
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
  pp$1.regexp_eatCharacterClass = function(state) {
    if (state.eat(0x5B /* [ */)) {
      var negate = state.eat(0x5E /* ^ */);
      var result = this.regexp_classContents(state);
      if (!state.eat(0x5D /* ] */))
        { state.raise("Unterminated character class"); }
      if (negate && result === CharSetString)
        { state.raise("Negated character class may contain strings"); }
      return true
    }
    return false
  };

  // https://tc39.es/ecma262/#prod-ClassContents
  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
  pp$1.regexp_classContents = function(state) {
    if (state.current() === 0x5D /* ] */) { return CharSetOk }
    if (state.switchV) { return this.regexp_classSetExpression(state) }
    this.regexp_nonEmptyClassRanges(state);
    return CharSetOk
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
  // https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
  pp$1.regexp_nonEmptyClassRanges = function(state) {
    while (this.regexp_eatClassAtom(state)) {
      var left = state.lastIntValue;
      if (state.eat(0x2D /* - */) && this.regexp_eatClassAtom(state)) {
        var right = state.lastIntValue;
        if (state.switchU && (left === -1 || right === -1)) {
          state.raise("Invalid character class");
        }
        if (left !== -1 && right !== -1 && left > right) {
          state.raise("Range out of order in character class");
        }
      }
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
  pp$1.regexp_eatClassAtom = function(state) {
    var start = state.pos;

    if (state.eat(0x5C /* \ */)) {
      if (this.regexp_eatClassEscape(state)) {
        return true
      }
      if (state.switchU) {
        // Make the same message as V8.
        var ch$1 = state.current();
        if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
          state.raise("Invalid class escape");
        }
        state.raise("Invalid escape");
      }
      state.pos = start;
    }

    var ch = state.current();
    if (ch !== 0x5D /* ] */) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
  pp$1.regexp_eatClassEscape = function(state) {
    var start = state.pos;

    if (state.eat(0x62 /* b */)) {
      state.lastIntValue = 0x08; /* <BS> */
      return true
    }

    if (state.switchU && state.eat(0x2D /* - */)) {
      state.lastIntValue = 0x2D; /* - */
      return true
    }

    if (!state.switchU && state.eat(0x63 /* c */)) {
      if (this.regexp_eatClassControlLetter(state)) {
        return true
      }
      state.pos = start;
    }

    return (
      this.regexp_eatCharacterClassEscape(state) ||
      this.regexp_eatCharacterEscape(state)
    )
  };

  // https://tc39.es/ecma262/#prod-ClassSetExpression
  // https://tc39.es/ecma262/#prod-ClassUnion
  // https://tc39.es/ecma262/#prod-ClassIntersection
  // https://tc39.es/ecma262/#prod-ClassSubtraction
  pp$1.regexp_classSetExpression = function(state) {
    var result = CharSetOk, subResult;
    if (this.regexp_eatClassSetRange(state)) ; else if (subResult = this.regexp_eatClassSetOperand(state)) {
      if (subResult === CharSetString) { result = CharSetString; }
      // https://tc39.es/ecma262/#prod-ClassIntersection
      var start = state.pos;
      while (state.eatChars([0x26, 0x26] /* && */)) {
        if (
          state.current() !== 0x26 /* & */ &&
          (subResult = this.regexp_eatClassSetOperand(state))
        ) {
          if (subResult !== CharSetString) { result = CharSetOk; }
          continue
        }
        state.raise("Invalid character in character class");
      }
      if (start !== state.pos) { return result }
      // https://tc39.es/ecma262/#prod-ClassSubtraction
      while (state.eatChars([0x2D, 0x2D] /* -- */)) {
        if (this.regexp_eatClassSetOperand(state)) { continue }
        state.raise("Invalid character in character class");
      }
      if (start !== state.pos) { return result }
    } else {
      state.raise("Invalid character in character class");
    }
    // https://tc39.es/ecma262/#prod-ClassUnion
    for (;;) {
      if (this.regexp_eatClassSetRange(state)) { continue }
      subResult = this.regexp_eatClassSetOperand(state);
      if (!subResult) { return result }
      if (subResult === CharSetString) { result = CharSetString; }
    }
  };

  // https://tc39.es/ecma262/#prod-ClassSetRange
  pp$1.regexp_eatClassSetRange = function(state) {
    var start = state.pos;
    if (this.regexp_eatClassSetCharacter(state)) {
      var left = state.lastIntValue;
      if (state.eat(0x2D /* - */) && this.regexp_eatClassSetCharacter(state)) {
        var right = state.lastIntValue;
        if (left !== -1 && right !== -1 && left > right) {
          state.raise("Range out of order in character class");
        }
        return true
      }
      state.pos = start;
    }
    return false
  };

  // https://tc39.es/ecma262/#prod-ClassSetOperand
  pp$1.regexp_eatClassSetOperand = function(state) {
    if (this.regexp_eatClassSetCharacter(state)) { return CharSetOk }
    return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state)
  };

  // https://tc39.es/ecma262/#prod-NestedClass
  pp$1.regexp_eatNestedClass = function(state) {
    var start = state.pos;
    if (state.eat(0x5B /* [ */)) {
      var negate = state.eat(0x5E /* ^ */);
      var result = this.regexp_classContents(state);
      if (state.eat(0x5D /* ] */)) {
        if (negate && result === CharSetString) {
          state.raise("Negated character class may contain strings");
        }
        return result
      }
      state.pos = start;
    }
    if (state.eat(0x5C /* \ */)) {
      var result$1 = this.regexp_eatCharacterClassEscape(state);
      if (result$1) {
        return result$1
      }
      state.pos = start;
    }
    return null
  };

  // https://tc39.es/ecma262/#prod-ClassStringDisjunction
  pp$1.regexp_eatClassStringDisjunction = function(state) {
    var start = state.pos;
    if (state.eatChars([0x5C, 0x71] /* \q */)) {
      if (state.eat(0x7B /* { */)) {
        var result = this.regexp_classStringDisjunctionContents(state);
        if (state.eat(0x7D /* } */)) {
          return result
        }
      } else {
        // Make the same message as V8.
        state.raise("Invalid escape");
      }
      state.pos = start;
    }
    return null
  };

  // https://tc39.es/ecma262/#prod-ClassStringDisjunctionContents
  pp$1.regexp_classStringDisjunctionContents = function(state) {
    var result = this.regexp_classString(state);
    while (state.eat(0x7C /* | */)) {
      if (this.regexp_classString(state) === CharSetString) { result = CharSetString; }
    }
    return result
  };

  // https://tc39.es/ecma262/#prod-ClassString
  // https://tc39.es/ecma262/#prod-NonEmptyClassString
  pp$1.regexp_classString = function(state) {
    var count = 0;
    while (this.regexp_eatClassSetCharacter(state)) { count++; }
    return count === 1 ? CharSetOk : CharSetString
  };

  // https://tc39.es/ecma262/#prod-ClassSetCharacter
  pp$1.regexp_eatClassSetCharacter = function(state) {
    var start = state.pos;
    if (state.eat(0x5C /* \ */)) {
      if (
        this.regexp_eatCharacterEscape(state) ||
        this.regexp_eatClassSetReservedPunctuator(state)
      ) {
        return true
      }
      if (state.eat(0x62 /* b */)) {
        state.lastIntValue = 0x08; /* <BS> */
        return true
      }
      state.pos = start;
      return false
    }
    var ch = state.current();
    if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) { return false }
    if (isClassSetSyntaxCharacter(ch)) { return false }
    state.advance();
    state.lastIntValue = ch;
    return true
  };

  // https://tc39.es/ecma262/#prod-ClassSetReservedDoublePunctuator
  function isClassSetReservedDoublePunctuatorCharacter(ch) {
    return (
      ch === 0x21 /* ! */ ||
      ch >= 0x23 /* # */ && ch <= 0x26 /* & */ ||
      ch >= 0x2A /* * */ && ch <= 0x2C /* , */ ||
      ch === 0x2E /* . */ ||
      ch >= 0x3A /* : */ && ch <= 0x40 /* @ */ ||
      ch === 0x5E /* ^ */ ||
      ch === 0x60 /* ` */ ||
      ch === 0x7E /* ~ */
    )
  }

  // https://tc39.es/ecma262/#prod-ClassSetSyntaxCharacter
  function isClassSetSyntaxCharacter(ch) {
    return (
      ch === 0x28 /* ( */ ||
      ch === 0x29 /* ) */ ||
      ch === 0x2D /* - */ ||
      ch === 0x2F /* / */ ||
      ch >= 0x5B /* [ */ && ch <= 0x5D /* ] */ ||
      ch >= 0x7B /* { */ && ch <= 0x7D /* } */
    )
  }

  // https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
  pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
    var ch = state.current();
    if (isClassSetReservedPunctuator(ch)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }
    return false
  };

  // https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
  function isClassSetReservedPunctuator(ch) {
    return (
      ch === 0x21 /* ! */ ||
      ch === 0x23 /* # */ ||
      ch === 0x25 /* % */ ||
      ch === 0x26 /* & */ ||
      ch === 0x2C /* , */ ||
      ch === 0x2D /* - */ ||
      ch >= 0x3A /* : */ && ch <= 0x3E /* > */ ||
      ch === 0x40 /* @ */ ||
      ch === 0x60 /* ` */ ||
      ch === 0x7E /* ~ */
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
  pp$1.regexp_eatClassControlLetter = function(state) {
    var ch = state.current();
    if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
      state.lastIntValue = ch % 0x20;
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
  pp$1.regexp_eatHexEscapeSequence = function(state) {
    var start = state.pos;
    if (state.eat(0x78 /* x */)) {
      if (this.regexp_eatFixedHexDigits(state, 2)) {
        return true
      }
      if (state.switchU) {
        state.raise("Invalid escape");
      }
      state.pos = start;
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
  pp$1.regexp_eatDecimalDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while (isDecimalDigit(ch = state.current())) {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
      state.advance();
    }
    return state.pos !== start
  };
  function isDecimalDigit(ch) {
    return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
  pp$1.regexp_eatHexDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while (isHexDigit(ch = state.current())) {
      state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
      state.advance();
    }
    return state.pos !== start
  };
  function isHexDigit(ch) {
    return (
      (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
      (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
      (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
    )
  }
  function hexToInt(ch) {
    if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
      return 10 + (ch - 0x41 /* A */)
    }
    if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
      return 10 + (ch - 0x61 /* a */)
    }
    return ch - 0x30 /* 0 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
  // Allows only 0-377(octal) i.e. 0-255(decimal).
  pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
    if (this.regexp_eatOctalDigit(state)) {
      var n1 = state.lastIntValue;
      if (this.regexp_eatOctalDigit(state)) {
        var n2 = state.lastIntValue;
        if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
          state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
        } else {
          state.lastIntValue = n1 * 8 + n2;
        }
      } else {
        state.lastIntValue = n1;
      }
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
  pp$1.regexp_eatOctalDigit = function(state) {
    var ch = state.current();
    if (isOctalDigit(ch)) {
      state.lastIntValue = ch - 0x30; /* 0 */
      state.advance();
      return true
    }
    state.lastIntValue = 0;
    return false
  };
  function isOctalDigit(ch) {
    return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
  // And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
  pp$1.regexp_eatFixedHexDigits = function(state, length) {
    var start = state.pos;
    state.lastIntValue = 0;
    for (var i = 0; i < length; ++i) {
      var ch = state.current();
      if (!isHexDigit(ch)) {
        state.pos = start;
        return false
      }
      state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
      state.advance();
    }
    return true
  };

  // Object type used to represent tokens. Note that normally, tokens
  // simply exist as properties on the parser object. This is only
  // used for the onToken callback and the external tokenizer.

  var Token = function Token(p) {
    this.type = p.type;
    this.value = p.value;
    this.start = p.start;
    this.end = p.end;
    if (p.options.locations)
      { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
    if (p.options.ranges)
      { this.range = [p.start, p.end]; }
  };

  // ## Tokenizer

  var pp = Parser.prototype;

  // Move to the next token

  pp.next = function(ignoreEscapeSequenceInKeyword) {
    if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc)
      { this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword); }
    if (this.options.onToken)
      { this.options.onToken(new Token(this)); }

    this.lastTokEnd = this.end;
    this.lastTokStart = this.start;
    this.lastTokEndLoc = this.endLoc;
    this.lastTokStartLoc = this.startLoc;
    this.nextToken();
  };

  pp.getToken = function() {
    this.next();
    return new Token(this)
  };

  // If we're in an ES6 environment, make parsers iterable
  if (typeof Symbol !== "undefined")
    { pp[Symbol.iterator] = function() {
      var this$1$1 = this;

      return {
        next: function () {
          var token = this$1$1.getToken();
          return {
            done: token.type === types$1.eof,
            value: token
          }
        }
      }
    }; }

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  // Read a single token, updating the parser object's token-related
  // properties.

  pp.nextToken = function() {
    var curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

    this.start = this.pos;
    if (this.options.locations) { this.startLoc = this.curPosition(); }
    if (this.pos >= this.input.length) { return this.finishToken(types$1.eof) }

    if (curContext.override) { return curContext.override(this) }
    else { this.readToken(this.fullCharCodeAtPos()); }
  };

  pp.readToken = function(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
      { return this.readWord() }

    return this.getTokenFromCode(code)
  };

  pp.fullCharCodeAtPos = function() {
    var code = this.input.charCodeAt(this.pos);
    if (code <= 0xd7ff || code >= 0xdc00) { return code }
    var next = this.input.charCodeAt(this.pos + 1);
    return next <= 0xdbff || next >= 0xe000 ? code : (code << 10) + next - 0x35fdc00
  };

  pp.skipBlockComment = function() {
    var startLoc = this.options.onComment && this.curPosition();
    var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
    if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
    this.pos = end + 2;
    if (this.options.locations) {
      for (var nextBreak = (void 0), pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1;) {
        ++this.curLine;
        pos = this.lineStart = nextBreak;
      }
    }
    if (this.options.onComment)
      { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                             startLoc, this.curPosition()); }
  };

  pp.skipLineComment = function(startSkip) {
    var start = this.pos;
    var startLoc = this.options.onComment && this.curPosition();
    var ch = this.input.charCodeAt(this.pos += startSkip);
    while (this.pos < this.input.length && !isNewLine(ch)) {
      ch = this.input.charCodeAt(++this.pos);
    }
    if (this.options.onComment)
      { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                             startLoc, this.curPosition()); }
  };

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  pp.skipSpace = function() {
    loop: while (this.pos < this.input.length) {
      var ch = this.input.charCodeAt(this.pos);
      switch (ch) {
      case 32: case 160: // ' '
        ++this.pos;
        break
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10: case 8232: case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break
      case 47: // '/'
        switch (this.input.charCodeAt(this.pos + 1)) {
        case 42: // '*'
          this.skipBlockComment();
          break
        case 47:
          this.skipLineComment(2);
          break
        default:
          break loop
        }
        break
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop
        }
      }
    }
  };

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  pp.finishToken = function(type, val) {
    this.end = this.pos;
    if (this.options.locations) { this.endLoc = this.curPosition(); }
    var prevType = this.type;
    this.type = type;
    this.value = val;

    this.updateContext(prevType);
  };

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  pp.readToken_dot = function() {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next >= 48 && next <= 57) { return this.readNumber(true) }
    var next2 = this.input.charCodeAt(this.pos + 2);
    if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
      this.pos += 3;
      return this.finishToken(types$1.ellipsis)
    } else {
      ++this.pos;
      return this.finishToken(types$1.dot)
    }
  };

  pp.readToken_slash = function() { // '/'
    var next = this.input.charCodeAt(this.pos + 1);
    if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(types$1.slash, 1)
  };

  pp.readToken_mult_modulo_exp = function(code) { // '%*'
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    var tokentype = code === 42 ? types$1.star : types$1.modulo;

    // exponentiation operator ** and **=
    if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
      ++size;
      tokentype = types$1.starstar;
      next = this.input.charCodeAt(this.pos + 2);
    }

    if (next === 61) { return this.finishOp(types$1.assign, size + 1) }
    return this.finishOp(tokentype, size)
  };

  pp.readToken_pipe_amp = function(code) { // '|&'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
      if (this.options.ecmaVersion >= 12) {
        var next2 = this.input.charCodeAt(this.pos + 2);
        if (next2 === 61) { return this.finishOp(types$1.assign, 3) }
      }
      return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2)
    }
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1)
  };

  pp.readToken_caret = function() { // '^'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(types$1.bitwiseXOR, 1)
  };

  pp.readToken_plus_min = function(code) { // '+-'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
      if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
          (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
        // A `-->` line comment
        this.skipLineComment(3);
        this.skipSpace();
        return this.nextToken()
      }
      return this.finishOp(types$1.incDec, 2)
    }
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(types$1.plusMin, 1)
  };

  pp.readToken_lt_gt = function(code) { // '<>'
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
      if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types$1.assign, size + 1) }
      return this.finishOp(types$1.bitShift, size)
    }
    if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
        this.input.charCodeAt(this.pos + 3) === 45) {
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4);
      this.skipSpace();
      return this.nextToken()
    }
    if (next === 61) { size = 2; }
    return this.finishOp(types$1.relational, size)
  };

  pp.readToken_eq_excl = function(code) { // '=!'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) { return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
    if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
      this.pos += 2;
      return this.finishToken(types$1.arrow)
    }
    return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1)
  };

  pp.readToken_question = function() { // '?'
    var ecmaVersion = this.options.ecmaVersion;
    if (ecmaVersion >= 11) {
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 46) {
        var next2 = this.input.charCodeAt(this.pos + 2);
        if (next2 < 48 || next2 > 57) { return this.finishOp(types$1.questionDot, 2) }
      }
      if (next === 63) {
        if (ecmaVersion >= 12) {
          var next2$1 = this.input.charCodeAt(this.pos + 2);
          if (next2$1 === 61) { return this.finishOp(types$1.assign, 3) }
        }
        return this.finishOp(types$1.coalesce, 2)
      }
    }
    return this.finishOp(types$1.question, 1)
  };

  pp.readToken_numberSign = function() { // '#'
    var ecmaVersion = this.options.ecmaVersion;
    var code = 35; // '#'
    if (ecmaVersion >= 13) {
      ++this.pos;
      code = this.fullCharCodeAtPos();
      if (isIdentifierStart(code, true) || code === 92 /* '\' */) {
        return this.finishToken(types$1.privateId, this.readWord1())
      }
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
  };

  pp.getTokenFromCode = function(code) {
    switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46: // '.'
      return this.readToken_dot()

    // Punctuation tokens.
    case 40: ++this.pos; return this.finishToken(types$1.parenL)
    case 41: ++this.pos; return this.finishToken(types$1.parenR)
    case 59: ++this.pos; return this.finishToken(types$1.semi)
    case 44: ++this.pos; return this.finishToken(types$1.comma)
    case 91: ++this.pos; return this.finishToken(types$1.bracketL)
    case 93: ++this.pos; return this.finishToken(types$1.bracketR)
    case 123: ++this.pos; return this.finishToken(types$1.braceL)
    case 125: ++this.pos; return this.finishToken(types$1.braceR)
    case 58: ++this.pos; return this.finishToken(types$1.colon)

    case 96: // '`'
      if (this.options.ecmaVersion < 6) { break }
      ++this.pos;
      return this.finishToken(types$1.backQuote)

    case 48: // '0'
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
        if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
      }

    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return this.readNumber(false)

    // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return this.readString(code)

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.
    case 47: // '/'
      return this.readToken_slash()

    case 37: case 42: // '%*'
      return this.readToken_mult_modulo_exp(code)

    case 124: case 38: // '|&'
      return this.readToken_pipe_amp(code)

    case 94: // '^'
      return this.readToken_caret()

    case 43: case 45: // '+-'
      return this.readToken_plus_min(code)

    case 60: case 62: // '<>'
      return this.readToken_lt_gt(code)

    case 61: case 33: // '=!'
      return this.readToken_eq_excl(code)

    case 63: // '?'
      return this.readToken_question()

    case 126: // '~'
      return this.finishOp(types$1.prefix, 1)

    case 35: // '#'
      return this.readToken_numberSign()
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
  };

  pp.finishOp = function(type, size) {
    var str = this.input.slice(this.pos, this.pos + size);
    this.pos += size;
    return this.finishToken(type, str)
  };

  pp.readRegexp = function() {
    var escaped, inClass, start = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(start, "Unterminated regular expression"); }
      var ch = this.input.charAt(this.pos);
      if (lineBreak.test(ch)) { this.raise(start, "Unterminated regular expression"); }
      if (!escaped) {
        if (ch === "[") { inClass = true; }
        else if (ch === "]" && inClass) { inClass = false; }
        else if (ch === "/" && !inClass) { break }
        escaped = ch === "\\";
      } else { escaped = false; }
      ++this.pos;
    }
    var pattern = this.input.slice(start, this.pos);
    ++this.pos;
    var flagsStart = this.pos;
    var flags = this.readWord1();
    if (this.containsEsc) { this.unexpected(flagsStart); }

    // Validate pattern
    var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
    state.reset(start, pattern, flags);
    this.validateRegExpFlags(state);
    this.validateRegExpPattern(state);

    // Create Literal#value property value.
    var value = null;
    try {
      value = new RegExp(pattern, flags);
    } catch (e) {
      // ESTree requires null if it failed to instantiate RegExp object.
      // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
    }

    return this.finishToken(types$1.regexp, {pattern: pattern, flags: flags, value: value})
  };

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
    // `len` is used for character escape sequences. In that case, disallow separators.
    var allowSeparators = this.options.ecmaVersion >= 12 && len === undefined;

    // `maybeLegacyOctalNumericLiteral` is true if it doesn't have prefix (0x,0o,0b)
    // and isn't fraction part nor exponent part. In that case, if the first digit
    // is zero then disallow separators.
    var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;

    var start = this.pos, total = 0, lastCode = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i, ++this.pos) {
      var code = this.input.charCodeAt(this.pos), val = (void 0);

      if (allowSeparators && code === 95) {
        if (isLegacyOctalNumericLiteral) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals"); }
        if (lastCode === 95) { this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore"); }
        if (i === 0) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits"); }
        lastCode = code;
        continue
      }

      if (code >= 97) { val = code - 97 + 10; } // a
      else if (code >= 65) { val = code - 65 + 10; } // A
      else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
      else { val = Infinity; }
      if (val >= radix) { break }
      lastCode = code;
      total = total * radix + val;
    }

    if (allowSeparators && lastCode === 95) { this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits"); }
    if (this.pos === start || len != null && this.pos - start !== len) { return null }

    return total
  };

  function stringToNumber(str, isLegacyOctalNumericLiteral) {
    if (isLegacyOctalNumericLiteral) {
      return parseInt(str, 8)
    }

    // `parseFloat(value)` stops parsing at the first numeric separator then returns a wrong value.
    return parseFloat(str.replace(/_/g, ""))
  }

  function stringToBigInt(str) {
    if (typeof BigInt !== "function") {
      return null
    }

    // `BigInt(value)` throws syntax error if the string contains numeric separators.
    return BigInt(str.replace(/_/g, ""))
  }

  pp.readRadixNumber = function(radix) {
    var start = this.pos;
    this.pos += 2; // 0x
    var val = this.readInt(radix);
    if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
    if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
      val = stringToBigInt(this.input.slice(start, this.pos));
      ++this.pos;
    } else if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
    return this.finishToken(types$1.num, val)
  };

  // Read an integer, octal integer, or floating-point number.

  pp.readNumber = function(startsWithDot) {
    var start = this.pos;
    if (!startsWithDot && this.readInt(10, undefined, true) === null) { this.raise(start, "Invalid number"); }
    var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
    if (octal && this.strict) { this.raise(start, "Invalid number"); }
    var next = this.input.charCodeAt(this.pos);
    if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
      var val$1 = stringToBigInt(this.input.slice(start, this.pos));
      ++this.pos;
      if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
      return this.finishToken(types$1.num, val$1)
    }
    if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
    if (next === 46 && !octal) { // '.'
      ++this.pos;
      this.readInt(10);
      next = this.input.charCodeAt(this.pos);
    }
    if ((next === 69 || next === 101) && !octal) { // 'eE'
      next = this.input.charCodeAt(++this.pos);
      if (next === 43 || next === 45) { ++this.pos; } // '+-'
      if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

    var val = stringToNumber(this.input.slice(start, this.pos), octal);
    return this.finishToken(types$1.num, val)
  };

  // Read a string value, interpreting backslash-escapes.

  pp.readCodePoint = function() {
    var ch = this.input.charCodeAt(this.pos), code;

    if (ch === 123) { // '{'
      if (this.options.ecmaVersion < 6) { this.unexpected(); }
      var codePos = ++this.pos;
      code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
      ++this.pos;
      if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
    } else {
      code = this.readHexChar(4);
    }
    return code
  };

  pp.readString = function(quote) {
    var out = "", chunkStart = ++this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated string constant"); }
      var ch = this.input.charCodeAt(this.pos);
      if (ch === quote) { break }
      if (ch === 92) { // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(false);
        chunkStart = this.pos;
      } else if (ch === 0x2028 || ch === 0x2029) {
        if (this.options.ecmaVersion < 10) { this.raise(this.start, "Unterminated string constant"); }
        ++this.pos;
        if (this.options.locations) {
          this.curLine++;
          this.lineStart = this.pos;
        }
      } else {
        if (isNewLine(ch)) { this.raise(this.start, "Unterminated string constant"); }
        ++this.pos;
      }
    }
    out += this.input.slice(chunkStart, this.pos++);
    return this.finishToken(types$1.string, out)
  };

  // Reads template string tokens.

  var INVALID_TEMPLATE_ESCAPE_ERROR = {};

  pp.tryReadTemplateToken = function() {
    this.inTemplateElement = true;
    try {
      this.readTmplToken();
    } catch (err) {
      if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
        this.readInvalidTemplateToken();
      } else {
        throw err
      }
    }

    this.inTemplateElement = false;
  };

  pp.invalidStringToken = function(position, message) {
    if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
      throw INVALID_TEMPLATE_ESCAPE_ERROR
    } else {
      this.raise(position, message);
    }
  };

  pp.readTmplToken = function() {
    var out = "", chunkStart = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated template"); }
      var ch = this.input.charCodeAt(this.pos);
      if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) { // '`', '${'
        if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
          if (ch === 36) {
            this.pos += 2;
            return this.finishToken(types$1.dollarBraceL)
          } else {
            ++this.pos;
            return this.finishToken(types$1.backQuote)
          }
        }
        out += this.input.slice(chunkStart, this.pos);
        return this.finishToken(types$1.template, out)
      }
      if (ch === 92) { // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(true);
        chunkStart = this.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.pos);
        ++this.pos;
        switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; }
        case 10:
          out += "\n";
          break
        default:
          out += String.fromCharCode(ch);
          break
        }
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        chunkStart = this.pos;
      } else {
        ++this.pos;
      }
    }
  };

  // Reads a template token to search for the end, without validating any escape sequences
  pp.readInvalidTemplateToken = function() {
    for (; this.pos < this.input.length; this.pos++) {
      switch (this.input[this.pos]) {
      case "\\":
        ++this.pos;
        break

      case "$":
        if (this.input[this.pos + 1] !== "{") { break }
        // fall through
      case "`":
        return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos))

      case "\r":
        if (this.input[this.pos + 1] === "\n") { ++this.pos; }
        // fall through
      case "\n": case "\u2028": case "\u2029":
        ++this.curLine;
        this.lineStart = this.pos + 1;
        break
      }
    }
    this.raise(this.start, "Unterminated template");
  };

  // Used to read escaped characters

  pp.readEscapedChar = function(inTemplate) {
    var ch = this.input.charCodeAt(++this.pos);
    ++this.pos;
    switch (ch) {
    case 110: return "\n" // 'n' -> '\n'
    case 114: return "\r" // 'r' -> '\r'
    case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
    case 117: return codePointToString(this.readCodePoint()) // 'u'
    case 116: return "\t" // 't' -> '\t'
    case 98: return "\b" // 'b' -> '\b'
    case 118: return "\u000b" // 'v' -> '\u000b'
    case 102: return "\f" // 'f' -> '\f'
    case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
    case 10: // ' \n'
      if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
      return ""
    case 56:
    case 57:
      if (this.strict) {
        this.invalidStringToken(
          this.pos - 1,
          "Invalid escape sequence"
        );
      }
      if (inTemplate) {
        var codePos = this.pos - 1;

        this.invalidStringToken(
          codePos,
          "Invalid escape sequence in template string"
        );
      }
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        this.pos += octalStr.length - 1;
        ch = this.input.charCodeAt(this.pos);
        if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
          this.invalidStringToken(
            this.pos - 1 - octalStr.length,
            inTemplate
              ? "Octal literal in template string"
              : "Octal literal in strict mode"
          );
        }
        return String.fromCharCode(octal)
      }
      if (isNewLine(ch)) {
        // Unicode new line characters after \ get removed from output in both
        // template literals and strings
        if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
        return ""
      }
      return String.fromCharCode(ch)
    }
  };

  // Used to read character escape sequences ('\x', '\u', '\U').

  pp.readHexChar = function(len) {
    var codePos = this.pos;
    var n = this.readInt(16, len);
    if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
    return n
  };

  // Read an identifier, and return it as a string. Sets `this.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  pp.readWord1 = function() {
    this.containsEsc = false;
    var word = "", first = true, chunkStart = this.pos;
    var astral = this.options.ecmaVersion >= 6;
    while (this.pos < this.input.length) {
      var ch = this.fullCharCodeAtPos();
      if (isIdentifierChar(ch, astral)) {
        this.pos += ch <= 0xffff ? 1 : 2;
      } else if (ch === 92) { // "\"
        this.containsEsc = true;
        word += this.input.slice(chunkStart, this.pos);
        var escStart = this.pos;
        if (this.input.charCodeAt(++this.pos) !== 117) // "u"
          { this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX"); }
        ++this.pos;
        var esc = this.readCodePoint();
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
          { this.invalidStringToken(escStart, "Invalid Unicode escape"); }
        word += codePointToString(esc);
        chunkStart = this.pos;
      } else {
        break
      }
      first = false;
    }
    return word + this.input.slice(chunkStart, this.pos)
  };

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  pp.readWord = function() {
    var word = this.readWord1();
    var type = types$1.name;
    if (this.keywords.test(word)) {
      type = keywords[word];
    }
    return this.finishToken(type, word)
  };

  // Acorn is a tiny, fast JavaScript parser written in JavaScript.
  //
  // Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
  // various contributors and released under an MIT license.
  //
  // Git repositories for Acorn are available at
  //
  //     http://marijnhaverbeke.nl/git/acorn
  //     https://github.com/acornjs/acorn.git
  //
  // Please use the [github bug tracker][ghbt] to report issues.
  //
  // [ghbt]: https://github.com/acornjs/acorn/issues


  var version = "8.15.0";

  Parser.acorn = {
    Parser: Parser,
    version: version,
    defaultOptions: defaultOptions,
    Position: Position,
    SourceLocation: SourceLocation,
    getLineInfo: getLineInfo,
    Node: Node,
    TokenType: TokenType,
    tokTypes: types$1,
    keywordTypes: keywords,
    TokContext: TokContext,
    tokContexts: types,
    isIdentifierChar: isIdentifierChar,
    isIdentifierStart: isIdentifierStart,
    Token: Token,
    isNewLine: isNewLine,
    lineBreak: lineBreak,
    lineBreakG: lineBreakG,
    nonASCIIwhitespace: nonASCIIwhitespace
  };

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and returns
  // an abstract syntax tree as specified by the [ESTree spec][estree].
  //
  // [estree]: https://github.com/estree/estree

  function parse(input, options) {
    return Parser.parse(input, options)
  }

  // This function tries to parse a single expression at a given
  // offset in a string. Useful for parsing mixed-language formats
  // that embed JavaScript expressions.

  function parseExpressionAt(input, pos, options) {
    return Parser.parseExpressionAt(input, pos, options)
  }

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenizer` export provides an interface to the tokenizer.

  function tokenizer(input, options) {
    return Parser.tokenizer(input, options)
  }

  exports.Node = Node;
  exports.Parser = Parser;
  exports.Position = Position;
  exports.SourceLocation = SourceLocation;
  exports.TokContext = TokContext;
  exports.Token = Token;
  exports.TokenType = TokenType;
  exports.defaultOptions = defaultOptions;
  exports.getLineInfo = getLineInfo;
  exports.isIdentifierChar = isIdentifierChar;
  exports.isIdentifierStart = isIdentifierStart;
  exports.isNewLine = isNewLine;
  exports.keywordTypes = keywords;
  exports.lineBreak = lineBreak;
  exports.lineBreakG = lineBreakG;
  exports.nonASCIIwhitespace = nonASCIIwhitespace;
  exports.parse = parse;
  exports.parseExpressionAt = parseExpressionAt;
  exports.tokContexts = types;
  exports.tokTypes = types$1;
  exports.tokenizer = tokenizer;
  exports.version = version;

}));

return exports.parse;})();
const PROFESSIONS={magic:'法师',melee:'单手战士',melee_twohand:'双手战士',ranged:'短弓游侠',ranged_long:'长弓游侠'};

const professionSkill=profession=>profession==='melee_twohand'?'melee':profession==='ranged_long'?'ranged':profession;
const starterWeapon=profession=>({magic:152,melee:110,melee_twohand:390,ranged:140,ranged_long:146})[profession];

function matchesProfessionWeapon(gear,profession) {
  if (!gear||gear.slot!=='weapon'||gear.needs!==professionSkill(profession)) return false;
  if (gear.needs==='melee') return !!gear.twoHanded===(profession==='melee_twohand');
  if (gear.needs==='ranged') return gear.speed===(profession==='ranged_long'?5:3);
  return true;
}

function bankedGatheringLoad(data,before,p) {
  const route=p.route,old=before?.route;
  if(!before||before.id!==p.id||p.lastTick<=before.lastTick||!route||!old||route.errand||old.errand||
    route.jobId!==old.jobId||route.siteId!==old.siteId||route.zoneId!==old.zoneId)return false;
  const job=data.jobs.find(j=>j.id===route.jobId);
  if(!job||job.inputs.length||!['mining','fishing','woodcutting'].includes(job.skill)||
    data.items[job.output.itemId]?.stackable)return false;
  const gained=id=>(p.bank[id]??0)-(before.bank[id]??0)-
    Math.max(0,(before.overflow?.[id]??0)-(p.overflow?.[id]??0));
  if(before.pack.some(item=>{
    if(item.itemId%data.plusScale%data.rarityScale!==job.output.itemId)return false;
    const count=pack=>pack.filter(i=>i.itemId===item.itemId).reduce((n,i)=>n+i.qty,0);
    const moved=count(before.pack)-count(p.pack);
    return moved>0&&gained(item.itemId)>=moved;
  }))return true;
  // A snapshot can arrive after banking and refilling the next partial pack.
  // Its size need not decrease; gathering XP plus new shelved output still
  // identifies the completed trip. Overflow moving back to shelves does not.
  return (p.skills?.[job.skill]??0)>(before.skills?.[job.skill]??0)&&
    Object.keys(p.bank).some(id=>id%data.plusScale%data.rarityScale===job.output.itemId&&gained(id)>0);
}

function finishTaskReason(data,p) {
  const route=p.route,job=data.jobs.find(j=>j.id===route?.jobId);
  if (!job||job.grow||route.errand||!route.phase||route.phase==='toBank'||route.limit===0) return null;
  const base=id=>id%data.plusScale%data.rarityScale;
  const used=p.pack.reduce((n,i)=>n+(data.items[base(i.itemId)]?.stackable?1:i.qty),0);
  const free=28+Math.max(0,p.perks?.pockets??0)-used;
  const output=data.items[job.output.itemId];
  if (['mining','fishing','woodcutting'].includes(job.skill)&&!job.inputs.length&&!output?.stackable) {
    return free>=job.output.qty?'继续当前采集，背包满或本批完成后再切换任务':null;
  }
  if (!['smithing','cooking','fletching','herblore','crafting'].includes(job.skill)||
    route.limit!==null&&!(route.limit>0)||route.rarity>0||p.workRarity>0) return null;
  if(route.limit===null&&output?.stackable&&job.inputs.every(i=>data.items[i.itemId]?.stackable))return null;
  let freed=0;
  for (const input of job.inputs) {
    const count=p.pack.filter(i=>i.itemId===input.itemId).reduce((n,i)=>n+i.qty,0);
    if (count<input.qty) return null;
    freed+=data.items[input.itemId]?.stackable?Number(count===input.qty):input.qty;
  }
  const extra=output?.stackable?Number(!p.pack.some(i=>i.itemId===job.output.itemId)):job.output.qty;
  return free+freed>=extra?'完成背包中已备材料的当前批次，再切换任务':null;
}

// Expected base rates from the reviewed client. House, potion, mastery, event
// and guild modifiers are omitted; these estimates are not measured XP/hour.
function workEstimate(data, job, skillLevel, options={}) {
  const speed=(1+Math.max(0,skillLevel-job.levelReq)*data.xp.speedPerLevelAboveRequirement)*
    (1+(options.toolBonus??0))*(1+.005*(options.quick??0));
  const failure=rule=>rule?Math.max(0,rule.chanceAtReq*(1-(skillLevel-job.levelReq)/
    (rule.safeAtLevel-job.levelReq)))*(1-.03*(options.hands??0)):0;
  const burn=failure(job.burn), caught=failure(job.caught), success=1-burn-caught;
  // A stun ending at tick t+s suppresses s-1 subsequent trials.
  const ticks=Math.max(1,job.baseTicks/speed)+caught*Math.max(0,(job.caught?.stunTicks??0)-1);
  const randomRarity=!job.inputs.length&&job.output.itemId!==data.coinId;
  const luck=1+(options.luck??0), c=data.rarityChance;
  const cumulative=[1,...['uncommon','rare','epic','legendary'].map(k=>Math.min(1,c[k]*luck)),0];
  const probabilities=randomRarity?cumulative.slice(0,5).map((n,i)=>n-cumulative[i+1]):[1,0,0,0,0];
  const xp=success*probabilities.reduce((sum,p,i)=>sum+p*Math.round(job.xp*data.rarityXp[i]),0);
  return {seconds:ticks*data.tickMs/1000,success,burn,caught,xp,
    commonOutput:success*probabilities[0]*job.output.qty,
    output:success*job.output.qty,
    coins:job.output.itemId===data.coinId?success*job.output.qty:0};
}

// Exact expected number of attacks for independent hits with uniform damage
// 1..maxHit, including misses and overkill. E[h]=(1 + p/M*sum E[h-d])/p.
function expectedAttacks(hp, maxHit, hitChance) {
  if(hitChance<=0) return Infinity;
  const expectation=new Float64Array(hp+1);
  let window=0;
  for(let remaining=1;remaining<=hp;remaining++) {
    window+=expectation[remaining-1];
    if(remaining-maxHit-1>=0) window-=expectation[remaining-maxHit-1];
    expectation[remaining]=1/hitChance+window/maxHit;
  }
  return expectation[hp];
}

function combatEstimate(data, monster, stats) {
  const divisor=stats.style==='magic'?4.5:stats.twoHanded?6:
    stats.style==='ranged'&&stats.speed===5?5:8;
  const maxHit=Math.max(1,1+Math.floor((stats.level+stats.strength)/divisor));
  const accuracy=Math.max(1,10+stats.level+stats.accuracy);
  const effectiveDefence=monster.defence*(stats.style==='magic'?.5:1);
  const hitChance=accuracy/(accuracy+10+effectiveDefence);
  const attacks=expectedAttacks(monster.hp,maxHit,hitChance);
  const seconds=attacks*stats.speed*data.tickMs/1000;
  const enemyHit=(10+monster.attack)/(20+monster.attack+stats.defenceLevel+stats.defence);
  // Continuous DPS is a conservative approximation: the final player hit can
  // prevent an enemy attack. No regeneration or damage-reduction buffs counted.
  const damage=seconds/(monster.speed*data.tickMs/1000)*enemyHit*(monster.maxHit+1)/2;
  return {seconds,attacks,maxHit,hitChance,effectiveDefence,damage,mainXp:monster.xp,
    xp:monster.xp+2*Math.max(1,Math.floor(monster.xp/3)),
    shards:Math.min(.2,.08+monster.level*.0013)*(1+Math.floor(monster.level/30)),
    coins:(monster.gold[0]+monster.gold[1])/2};
}

// Reviewed client index-O0haAaUW.js: Ah/g1 (potions), j4/Rt (quality
// buckets), S1/$1/Or/T1 (food). A potion adds 6000 ticks at its own quality.
const POTION_TICKS=6000;
function potionRefillQty(p,kind) {
  const remaining=Math.max(0,(p.brews?.[kind]??0)-p.lastTick);
  return remaining>POTION_TICKS*6?0:Math.ceil((POTION_TICKS*20-remaining)/POTION_TICKS);
}
const POTIONS=[
  {itemId:220,kind:'gatherer',label:'采集药剂'},
  {itemId:221,kind:'hunter',label:'猎人药剂'},
  {itemId:222,kind:'warrior',label:'战士药剂'},
  {itemId:223,kind:'elixir',label:'矿脉灵药'},
  {itemId:224,kind:'abyssal',label:'深渊药剂'},
  {itemId:225,kind:'swift',label:'疾行药剂'},
  {itemId:226,kind:'nourish',label:'滋养药剂'},
  {itemId:227,kind:'haste',label:'急速药剂'}
];

function brewPower(data,p,kind) {
  if(!((p.brews?.[kind]??0)>p.lastTick))return 0;
  const clamp=tier=>Math.max(0,Math.min(data.rarityMultipliers.length-1,tier));
  const buckets=p.brewBuckets?.[kind];
  if(buckets?.length) {
    const total=buckets.reduce((sum,n)=>sum+n,0);
    const elapsed=Math.max(0,p.lastTick-(p.brews[kind]-total));
    let covered=0;
    for(let tier=buckets.length-1;tier>=0;tier--) {
      covered+=buckets[tier];
      if(elapsed<covered)return data.rarityMultipliers[clamp(tier)];
    }
  }
  return data.rarityMultipliers[clamp(p.brewTier?.[kind]??0)];
}

function foodEffects(data,itemId) {
  const base=itemId%data.plusScale%data.rarityScale;
  if(!(data.items[base]?.heals>0))return {fedTicks:0,rootedTicks:0};
  const rarity=Math.max(0,Math.min(4,Math.floor(itemId%data.plusScale/data.rarityScale)));
  const fedTicks=[0,200,1000,18000,144000][rarity];
  if(base<170||base>179)return {fedTicks,rootedTicks:0};
  const crops=data.jobs.filter(j=>j.skill==='farming'&&j.grow!==undefined&&
    j.output.itemId>=170&&j.output.itemId<=179);
  const crop=crops.find(j=>j.output.itemId===base),maxLevel=Math.max(1,...crops.map(j=>j.levelReq));
  const progress=crop&&maxLevel>1?(crop.levelReq-1)/(maxLevel-1):0;
  const rootedTicks=Math.round((100+900*progress)/100)*100*[1,2,5,12,30][rarity];
  return {fedTicks,rootedTicks};
}

function buffKey(data,p) {
  return JSON.stringify([...POTIONS.map(({kind})=>brewPower(data,p,kind)),
    (p.brews?.fed??0)>p.lastTick,(p.brews?.rooted??0)>p.lastTick]);
}

function activeBuffs(data,p) {
  return [...POTIONS.map(({kind,label})=>({kind,label,power:brewPower(data,p,kind)})),
    {kind:'fed',label:'饱食：伤害 +25%',power:.25},
    {kind:'rooted',label:'扎根：承伤 -20%',power:.2}]
    .filter(({kind})=>(p.brews?.[kind]??0)>p.lastTick)
    .map(buff=>({...buff,remainingSeconds:(p.brews[buff.kind]-p.lastTick)*data.tickMs/1000}));
}

// Client index-DeoJ7Jh9.js: Vt/jl/J2/DT/G9/H2 and z9/In. Food is
// unstackable, while combat loot that does not fit goes directly to the bank.

function foodHealing(data,planner,p,itemId,eatAt=.5) {
  const base=planner.base(itemId),rarity=Math.floor(itemId%data.plusScale/data.rarityScale);
  const item=data.items[base];
  if(!item?.heals)return {heal:0,currentHeal:0,maxHp:0,rarity};
  const raw=Math.max(1,Math.round(item.heals*(data.foodHealingMultipliers??[1,1.2,1.5,2,3])[rarity]));
  const maxHp=Math.floor(planner.level(p.skills.hitpoints)*(1+.005*(p.masteries?.hp??0)));
  const gap=Math.max(1,maxHp-Math.floor(maxHp*eatAt));
  const meals=.025*(p.perks?.meals??0);
  const nourish=.25*brewPower(data,p,'nourish');
  // Do not assume a timed healing buff survives the entire expedition.
  return {heal:Math.min(gap,Math.floor(raw*(1+meals))),
    currentHeal:Math.min(gap,Math.floor(raw*(1+meals+nourish))),maxHp,rarity};
}

function combatSupplies(data,planner,p,estimate,options={}) {
  const {zone,monster}=options;
  const capacity=28+Math.max(0,Math.floor(p.perks?.pockets??0)),eatAt=options.eatAt??.5;
  const rarity=id=>Math.floor(id%data.plusScale/data.rarityScale);
  const eligible=id=>data.items[planner.base(id)]?.heals>0&&rarity(id)<=(p.foodMaxTier??1)&&
    !options.excludeFoodIds?.includes(id);
  const stock=id=>planner.count(p,id);
  const owned=[...new Set([...Object.keys(p.bank).map(Number),...p.pack.map(i=>i.itemId)])].filter(id=>eligible(id)&&stock(id)>0);
  const recipes=data.jobs.filter(j=>j.skill==='cooking'&&planner.level(p.skills.cooking)>=j.levelReq);
  const cooked=new Set(data.jobs.filter(j=>j.skill==='cooking').map(j=>j.output.itemId));
  const possible=[...new Set([...owned,...recipes.map(j=>j.output.itemId)])];
  const preferred=options.foodItemId??(p.foodItemId>0?p.foodItemId:null);
  const damage=Math.max(0,estimate.damage??0),seconds=Math.max(data.tickMs/1000,estimate.seconds??1);
  const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
  const bank=zone?[...data.banks].sort((a,b)=>distance(a,zone)-distance(b,zone))[0]:null;
  const roundTripSeconds=options.roundTripSeconds??(bank?
    (2*distance(bank,zone)+3)*data.tickMs/1000:3*data.tickMs/1000);
  const horizon=Math.max(1,options.horizon??1800);
  // Only presets actually exposed by the client; -1/-2 are sent as sentinels.
  const choices=[5,10,20,-2,-1].map(command=>({command,
    count:command===-1?capacity:command===-2?Math.max(1,capacity-1):Math.min(command,capacity)}))
    .sort((a,b)=>a.count-b.count);
  const weapon=planner.equipmentStats(p.equipment.weapon);
  const healInterval=Math.min(weapon?.speed??5,monster?.speed??5)*data.tickMs/1000;
  const plans=[];
  for(const id of (preferred>0&&eligible(preferred)?[preferred]:possible).filter(eligible)) {
    const healing=foodHealing(data,planner,p,id,eatAt),heal=healing.heal;
    const foodPerKill=heal>0?damage/heal:Infinity,safeFoodPerKill=foodPerKill*1.25;
    const sustainable=heal>0&&heal/Math.max(.6,healInterval)>damage/seconds*1.25;
    const cost=options.supplyCost?options.supplyCost(id):Infinity;
    for(const option of choices) {
      const tripKills=safeFoodPerKill>0?Math.max(.1,(option.count-1)/safeFoodPerKill):Infinity;
      const required=k=>Math.max(option.count,Math.ceil(k*safeFoodPerKill)+1);
      const duration=k=>{
        const missing=Math.max(0,required(k)-stock(id));
        return k*seconds+Math.max(0,Math.ceil(k/tripKills)-1)*roundTripSeconds+(missing>0?missing*cost:0);
      };
      let lo=0,hi=Math.min(options.limit??Infinity,horizon/seconds);
      for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(duration(mid)<=horizon)lo=mid;else hi=mid;}
      // Restocking can reset the encounter. A good healing rate is insufficient
      // when even a full load runs out before one kill (including the margin).
      plans.push({id,healing,foodPerKill,safeFoodPerKill,sustainable:sustainable&&tripKills>=1,...option,tripKills,kills:lo,
        required:required(lo),seconds:duration(lo),oneKillSeconds:duration(1),cost});
    }
  }
  // More food cannot force a depot trip: overflowing combat loot is banked.
  // Prefer the larger load when preparation and predicted throughput are equal.
  plans.sort((a,b)=>Number(b.sustainable)-Number(a.sustainable)||b.kills-a.kills||b.count-a.count||b.healing.heal-a.healing.heal);
  const automatic=!(preferred>0&&eligible(preferred));
  const cookedPlans=automatic?plans.filter(plan=>cooked.has(planner.base(plan.id))&&
    plan.sustainable&&plan.oneKillSeconds<=horizon):[];
  const selected=(cookedPlans.length?cookedPlans:plans)[0]??{id:60,healing:foodHealing(data,planner,p,60,eatAt),command:-1,count:capacity,
    foodPerKill:damage/3,safeFoodPerKill:damage/3*1.25,tripKills:1,kills:0,required:capacity,sustainable:false};
  const foodItemId=selected.id,healing=selected.healing,heal=healing.heal;
  const carry=selected.count,carryCommand=selected.command;
  const {foodPerKill,safeFoodPerKill,sustainable}=selected;
  const expectedKills=Math.max(.1,Math.min(options.limit??Infinity,horizon/seconds,selected.tripKills));
  const reserve=Math.max(carry,Math.min(carry*3,selected.required));
  const currentFood=p.pack.filter(i=>eligible(i.itemId)).reduce((n,i)=>n+i.qty,0);
  // A departure load is not a retreat threshold. Let an active fight consume
  // its meals before planning another batch, rather than leaving after one bite.
  const continuing=p.route?.zoneId!=null&&p.route.zoneId===zone?.id&&currentFood>0;
  const quantity=stock(foodItemId),needFood=!continuing&&quantity<carry?Math.max(0,reserve-quantity):0;
  const cumulative=[1,...['uncommon','rare','epic','legendary'].map(k=>
    Math.min(1,(data.rarityChance[k]??0)*(options.rarityMultiplier??1))),0];
  const probabilities=cumulative.slice(0,5).map((v,i)=>Math.max(0,v-cumulative[i+1]));
  const distinct=(chance,n)=>1-(1-Math.min(1,chance))**n;
  const drop=monster?.drop!=null?data.items[monster.drop]:null;
  const dropChance=Math.max(0,Math.min(1,monster?.dropChance??1));
  const shardChance=monster?Math.min(.2,.08+monster.level*.0013):0;
  const bonusChance=monster?Math.min(1,(monster.bonus?.chance??0)*(options.rarityMultiplier??1)):0;
  const lootSlots=drop?(drop.stackable?probabilities.reduce((n,chance)=>n+distinct(chance*dropChance,expectedKills),0):expectedKills*dropChance)+
    distinct(shardChance,expectedKills)+(data.items[monster.bonus?.itemId]?.stackable===false?
      bonusChance*expectedKills:distinct(bonusChance,expectedKills))+distinct(1/500000,expectedKills):0;
  const lootFreeAtStart=capacity-(data.items[planner.base(foodItemId)]?.stackable?1:carry);
  // This is a planning estimate, not a claim that rare loot is lost: In() banks
  // each drop that cannot fit. Keep that distinct from a forced restocking trip.
  const firstKillConsumed=Math.min(carry,Math.floor(foodPerKill));
  const room=lootFreeAtStart+firstKillConsumed;
  // Count independent material/shard/bonus/rare-drop rolls. Some high-level
  // monsters now drop their ordinary material only half of the time.
  const lootCounts=[1,0,0,0,0];
  for(const chance of [dropChance,shardChance,bonusChance,1/500000])
    for(let n=4;n>=0;n--)lootCounts[n]=lootCounts[n]*(1-chance)+(n?lootCounts[n-1]*chance:0);
  const firstKillBankChance=drop?Math.min(1,lootCounts.slice(Math.max(0,room+1)).reduce((sum,n)=>sum+n,0)):0;
  const otherFood=p.pack.some(i=>eligible(i.itemId)&&i.itemId!==foodItemId);
  const occupied=p.pack.filter(i=>i.itemId!==foodItemId).length;
  const bankFirst=p.route?.zoneId!==zone?.id&&quantity>=carry&&
    (currentFood<carry||otherFood||occupied+carry>capacity);
  const restockSeconds=roundTripSeconds/expectedKills;
  return {foodItemId,...healing,carry,carryCommand,reserve,needFood,available:quantity,currentFood,
    foodPerKill,safeFoodPerKill,expectedKills,roundTripSeconds,restockSeconds,capacity,
    lootSlots,lootFreeAtStart,firstKillBankChance,bankFirst,sustainable,
    horizonKills:selected.kills,foodSeconds:foodPerKill*(selected.cost??0),
    reason:(automatic?(cookedPlans.length?'优先熟食续航，作物保留用于补充增益；':
      sustainable&&!cooked.has(planner.base(foodItemId))?'熟食当前无法在计划窗口内安全续航，暂用现有作物过渡；':''):'')+
      `每趟带 ${carry} 份，备粮 ${reserve} 份；有效治疗 ${heal}，预计每趟 ${expectedKills.toFixed(1)} 杀，`+
      `补给往返 ${roundTripSeconds.toFixed(0)} 秒，出发留 ${lootFreeAtStart} 格、预计战利品占 ${lootSlots.toFixed(1)} 格。`+
      '已加 25% 耗粮余量；战斗包满时额外掉落直接入仓，不会仅因包满返程。'};
}


// A rolling comparison of attainable routes, including their self-supply work.
// Gold is a constraint from an actual planned expense, never an XP conversion.
function createStrategy(data, planner) {
  const horizon=1800, tick=data.tickMs/1000, jobs=data.jobs;
  const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
  const bankAt=p=>[...data.banks].sort((a,b)=>distance(p,a)-distance(p,b))[0];
  const siteAt=(p,j)=>data.sites.filter(s=>s.jobIds.includes(j.id))
    .sort((a,b)=>distance(p,a)-distance(p,b))[0];
  let measurements={};
  const setMeasurements=value=>{measurements=value??{};};
  function calibrated(p,key,e,lv) {
    const m=measurements[key];
    const working=m?m.seconds-(m.travelSeconds??0):0;
    if (!m||m.samples<3||working<60) return e;
    // Observed rates already include their buffs. Legacy records describe only
    // an unbuffed snapshot; never carry a temporary bonus into another state.
    if((m.buffKey??buffKey(data,{...p,brews:{}}))!==buffKey(data,p))return e;
    const equipmentKey=JSON.stringify(Object.keys(p.equipment).sort().map(k=>[k,p.equipment[k]]));
    const job=key.startsWith('job:')&&jobs.find(j=>j.id===Number(key.slice(4)));
    const levelsKey=JSON.stringify((job?[job.skill]:['melee','ranged','magic','defence','hitpoints']).map(s=>[s,lv[s]]));
    if (m.equipmentKey!==equipmentKey||m.levelsKey!==levelsKey) return e;
    // Remove observed travel before adding this candidate's separate travel
    // estimate. Do not infer faster material production from an XP bonus.
    const xp=m.xp??m.xpPerSecond*m.seconds,coins=m.coins??m.coinsPerSecond*m.seconds;
    return {...e,xp:Number.isFinite(xp)?xp/working*e.seconds:e.xp,
      coins:Number.isFinite(coins)?coins/working*e.seconds:e.coins,measured:true};
  }
  function estimateWork(p,j,lv=planner.levels(p)) {
    const slot=Object.keys(data.toolSkills).find(s=>data.toolSkills[s]===j.skill);
    return calibrated(p,`job:${j.id}`,workEstimate(data,j,lv[j.skill],{
      toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,
      quick:p.perks?.quick??0,hands:p.perks?.hands??0,
      luck:(data.toolLuck[Math.floor((p.equipment[slot]??0)%data.plusScale/data.rarityScale)]??0)+
        (planner.equipmentStats(p.equipment.amulet)?.luck??0)}),lv);
  }
  function combatOptions(p,profession='magic') {
    const style=professionSkill(profession);
    const lv=planner.levels(p), gear=Object.values(p.equipment).map(planner.equipmentStats).filter(Boolean);
    const w=planner.equipmentStats(p.equipment.weapon);
    if (!matchesProfessionWeapon(w,profession)) return [];
    const stat=k=>gear.reduce((n,g)=>n+(k==='defence'||!g.style||g.style===style?1:-1)*(g[k]??0),0);
    return data.monsters.filter(m=>m.maxHit<lv.hitpoints/3&&
      lv.hitpoints/((10+m.attack)/(20+m.attack+lv.defence+stat('defence'))*(1+m.maxHit)/2)>=6)
      .map(m=>({monster:m,zone:data.zones.find(z=>z.monsterId===m.id),
        ...calibrated(p,`combat:${m.id}`,combatEstimate(data,m,{style,level:lv[style],
          accuracy:stat('accuracy'),strength:stat('strength'),defence:stat('defence'),
          defenceLevel:lv.defence,speed:w.speed??5,twoHanded:w.twoHanded}),lv)}));
  }
  function supplyCost(p,id,trail=[]) {
    if (trail.includes(id)) return Infinity;
    const lv=planner.levels(p),next=[...trail,id];
    const choices=jobs.filter(j=>j.output.itemId===id&&j.levelReq<=lv[j.skill]&&!j.grow);
    return choices.length?Math.min(...choices.map(j=>{
      const e=estimateWork(p,j,lv);
      return (e.seconds+j.inputs.reduce((n,i)=>n+i.qty*supplyCost(p,i.itemId,next),0))/e.commonOutput;
    })):Infinity;
  }
  function routeEstimate(p,jobOrId,amount=20,{style='magic',ignoreStock=false,includeTravel=true,completeTrips=false}={}) {
    const root=typeof jobOrId==='object'?jobOrId:jobs.find(j=>j.id===jobOrId);
    const lv=planner.levels(p), stock={}, budget={}, recipes={}, supplyRecipes={};
    if (!ignoreStock) {
      for (const [id,n] of Object.entries(p.bank)) stock[id]=n;
      for (const i of p.pack) stock[i.itemId]=(stock[i.itemId]??0)+i.qty;
    }
    let seconds=0,xp=0,coins=0,position=p,unlocks=[];
    const travel=to=>{
      if (includeTravel) seconds+=distance(position,to)*tick;
      position=to;
    };
    const invalid=()=>({seconds:Infinity,xp:0,coins:0,budget:{coins:0,items:{}},recipes:{},supplyRecipes:{}});
    function work(j,n,trail) {
      if (!siteAt(position,j)||j.grow||!Number.isFinite(n)||n<=0) return false;
      if (lv[j.skill]<j.levelReq&&!unlock(j.skill,j.levelReq,trail)) return false;
      for (const i of j.inputs) if (!supply(i.itemId,i.qty*n,trail)) return false;
      const e=estimateWork(p,j,lv),site=siteAt(position,j),bank=bankAt(site);
      travel(site);
      seconds+=e.seconds*n;xp+=e.xp*n;coins+=e.coins*n;
      // Each planner batch is at most 50 attempts; reserve intermediate bank
      // visits instead of pretending a very long material chain is one action.
      const stackSlots=j.inputs.filter(i=>data.items[i.itemId]?.stackable).length+
        Number(!!data.items[j.output.itemId]?.stackable);
      const unitSlots=Math.max(data.items[j.output.itemId]?.stackable?0:j.output.qty,
        j.inputs.reduce((n,i)=>n+(data.items[i.itemId]?.stackable?0:i.qty),0));
      const load=completeTrips&&unitSlots?
        Math.min(50,Math.max(1,Math.floor((28+(p.perks?.pockets??0)-stackSlots)/unitSlots))):50;
      if (includeTravel) seconds+=Math.max(0,Math.ceil(n/load)-1)*(2*distance(site,bank)+3)*tick;
      if(completeTrips)travel(bank.approach??bank);
      recipes[j.skill]??=j.id;supplyRecipes[j.output.itemId]=j.id;
      if (j.output.itemId!==data.coinId) stock[j.output.itemId]=(stock[j.output.itemId]??0)+e.commonOutput*n;
      if (j.bonus) stock[j.bonus.itemId]=(stock[j.bonus.itemId]??0)+j.bonus.chance*n;
      return true;
    }
    function unlock(skill,target,trail) {
      const marker=`skill:${skill}`;
      if (trail.includes(marker)) return false;
      const available=jobs.filter(j=>j.skill===skill&&!j.grow&&j.levelReq<=lv[skill]&&siteAt(position,j));
      const choice=available.sort((a,b)=>estimateWork(p,b,lv).xp/estimateWork(p,b,lv).seconds-
        estimateWork(p,a,lv).xp/estimateWork(p,a,lv).seconds)[0];
      if (!choice) return false;
      const required=Math.max(0,planner.thresholds[target]-(p.skills[skill]??0));
      const n=Math.ceil(required/estimateWork(p,choice,lv).xp);
      if (!work(choice,n,[...trail,marker])) return false;
      unlocks.push({skill,target});lv[skill]=target;return true;
    }
    function supply(id,quantity,trail) {
      budget[id]=(budget[id]??0)+Math.ceil(quantity);
      const used=Math.min(quantity,stock[id]??0);stock[id]=(stock[id]??0)-used;
      const missing=quantity-used;
      if (missing<1e-7) return true;
      if (trail.includes(id)) return false;
      const next=[...trail,id];
      if(id===190) {
        const price=data.items[190].value*4;
        coins-=price;travel(bankAt(position).approach??bankAt(position));seconds+=tick;
        return true;
      }
      const choices=jobs.filter(j=>j.output.itemId===id&&!j.grow&&siteAt(position,j))
        .sort((a,b)=>a.levelReq-b.levelReq||estimateWork(p,a,lv).seconds/Math.max(.001,estimateWork(p,a,lv).commonOutput)-
          estimateWork(p,b,lv).seconds/Math.max(.001,estimateWork(p,b,lv).commonOutput));
      if (choices.length) {
        const j=choices[0],e=estimateWork(p,j,lv);
        if (!work(j,missing/e.commonOutput,next)) return false;
        stock[id]=Math.max(0,(stock[id]??0)-missing);return true;
      }
      // Harvests regenerate seeds. A crop source is attainable only when its
      // seed already exists, or a reviewed bonus drop supplies it. Unknown
      // merchant-only seeds never receive an invented acquisition time.
      const crop=jobs.find(j=>j.output.itemId===id&&j.grow&&j.levelReq<=lv.farming);
      if (crop) {
        const preference=planner.farmingPreference?.();
        if(preference?.mode==='manual'&&preference.jobId!==crop.id)return false;
        const planted=Object.values(p.plots??{}).some(f=>planner.base(f.seedItemId)===crop.inputs[0].itemId);
        const seeds=Object.keys(stock).some(k=>planner.base(Number(k))===crop.inputs[0].itemId&&stock[k]>0);
        if (!planted&&!seeds&&!supply(crop.inputs[0].itemId,1,next)) return false;
        const seedId=crop.inputs[0].itemId;
        const liveSeeds=Object.entries(stock).reduce((n,[id,qty])=>n+(planner.base(+id)===seedId?qty:0),0)+
          Object.values(p.plots??{}).filter(f=>planner.base(f.seedItemId)===seedId).length;
        const fields=Math.max(1,Math.min(data.farmUnlocks.filter(n=>n<=lv.farming).length,liveSeeds));
        const harvests=missing/(4+lv.farming/100);
        seconds+=Math.ceil(harvests/fields)*crop.grow*tick;xp+=harvests*crop.xp;
        recipes.farming=crop.id;supplyRecipes[id]=crop.id;
        return true;
      }
      const bonus=jobs.filter(j=>j.bonus?.itemId===id&&j.levelReq<=lv[j.skill]&&!j.grow)
        .sort((a,b)=>estimateWork(p,a,lv).seconds/a.bonus.chance-estimateWork(p,b,lv).seconds/b.bonus.chance)[0];
      if (bonus) {
        if (!work(bonus,missing/bonus.bonus.chance,next)) return false;
        stock[id]=Math.max(0,(stock[id]??0)-missing);return true;
      }
      const monster=combatOptions(p,style).filter(c=>c.monster.drop===id&&(c.monster.dropChance??1)>0||id===data.shardId)
        .sort((a,b)=>a.seconds/(id===data.shardId?a.shards:(a.monster.dropChance??1))-
          b.seconds/(id===data.shardId?b.shards:(b.monster.dropChance??1)))[0];
      if (!monster) return false;
      // A primary drop is one item of a rolled quality, not one ordinary item.
      // Use the same baseline rarity model as workEstimate; temporary bonuses
      // are not assumed to last for the entire material-supply expedition.
      const common=1-Math.min(1,data.rarityChance.uncommon*
        (1+(planner.equipmentStats(p.equipment.amulet)?.luck??0)));
      return fight(monster,missing/(id===data.shardId?monster.shards:common*(monster.monster.dropChance??1)),next);
    }
    function fight(c,n,trail=[]) {
      const supplies=combatSupplies(data,planner,p,c,{zone:c.zone,monster:c.monster,
        foodItemId:0,horizon,supplyCost:id=>supplyCost(p,id)});
      if (!supplies.sustainable||!supply(supplies.foodItemId,c.damage*n/supplies.heal,trail)) return false;
      const bank=bankAt(c.zone);
      const carried=p.pack.filter(i=>i.itemId===supplies.foodItemId).reduce((n,i)=>n+i.qty,0);
      const restockFirst=position!==p||supplies.bankFirst||!carried;
      if(restockFirst)travel(bankAt(position));
      const inside=position.x>=c.zone.x&&position.x<c.zone.x+(c.zone.width??1)&&
        position.y>=c.zone.y&&position.y<c.zone.y+(c.zone.height??1);
      if(!inside)travel(c.zone);
      const firstKills=restockFirst?supplies.expectedKills:
        Math.min(supplies.expectedKills,carried/supplies.safeFoodPerKill);
      const restocks=Math.max(0,Math.ceil((n-firstKills)/supplies.expectedKills));
      seconds+=c.seconds*n+(includeTravel?restocks*supplies.roundTripSeconds:0);
      xp+=c.xp*n;coins+=c.coins*n;
      if(completeTrips)travel(bank.approach??bank);
      return true;
    }
    let ok=false;
    if (root?.itemId!=null) {
      // Quote an additional missing quantity, while still using owned inputs.
      stock[root.itemId]=0;
      ok=supply(root.itemId,amount,[]);
    } else if (root?.monsterId) {
      const c=combatOptions(p,style).find(c=>c.monster.id===root.monsterId);
      ok=!!c&&fight(c,amount);
    } else if (root) ok=work(root,amount,[root.output.itemId]);
    if (!ok||!Number.isFinite(seconds)) return invalid();
    return {seconds,xp,coins,rate:{xp:xp/Math.max(1,seconds),coins:coins/Math.max(1,seconds)},
      budget:{coins:Math.max(0,-coins),items:budget},recipes,supplyRecipes,unlocks};
  }
  function candidates(p,style='magic',deferred={},options={}) {
    const skill=professionSkill(style);
    const stockedBatch=options.stockedBatch===true;
    const routeOptions={style,ignoreStock:!!options.sustainable,completeTrips:!!options.sustainable||stockedBatch};
    const lv=planner.levels(p), candidates=[];
    for (const job of jobs.filter(j=>!j.grow&&!deferred[j.skill]&&j.levelReq<=lv[j.skill]&&siteAt(p,j))) {
      const batch=stockedBatch?Math.min(50,planner.carriedBatch(p,job)):50;
      if(stockedBatch&&(!job.inputs.length||job.inputs.some(i=>planner.count(p,i.itemId)<i.qty*batch)))continue;
      const e=estimateWork(p,job,lv);
      let amount=options.sustainable||stockedBatch?batch:Math.min(5000,Math.max(1,Math.floor(horizon/e.seconds))),estimate;
      for (let attempt=0;attempt<4;attempt++) {
        estimate=routeEstimate(p,job,amount,routeOptions);
        if(options.sustainable||stockedBatch)break;
        if (estimate.seconds<=horizon||!Number.isFinite(estimate.seconds)||amount===1) break;
        amount=Math.max(1,Math.floor(amount*horizon/estimate.seconds*.98));
      }
      if (estimate.seconds>horizon) continue;
      if (!Number.isFinite(estimate.seconds)||!estimate.xp) continue;
      candidates.push({skill:job.skill,recipeId:job.id,mainXpRate:e.xp*amount/estimate.seconds,output:{itemId:job.output.itemId,qty:Math.floor(e.commonOutput*amount)},recipes:{...estimate.recipes,[job.skill]:job.id},
        supplyRecipes:estimate.supplyRecipes,batch,estimate,rate:estimate.rate,horizon,
        budget:routeEstimate(p,job,batch,{style}).budget,target:lv[job.skill]+1,stage:lv[job.skill]+1});
    }
    if(stockedBatch)return candidates.sort((a,b)=>b.mainXpRate-a.mainXpRate||a.recipeId-b.recipeId);
    let fighter=p,preparation={seconds:0,xp:0,coins:0,budget:{coins:0,items:{}}};
    if (!matchesProfessionWeapon(planner.equipmentStats(p.equipment.weapon),style)) {
      const starter=starterWeapon(style);
      const recipe=jobs.find(j=>j.output.itemId===starter);
      preparation=planner.count(p,starter)>0?preparation:routeEstimate(p,recipe,1,{style});
      fighter={...p,equipment:{...p.equipment,weapon:starter}};
      if (planner.equipmentStats(starter)?.twoHanded) fighter.equipment.shield=null;
    }
    if (!deferred[skill]&&Number.isFinite(preparation.seconds)) for (const c of combatOptions(fighter,style)) {
      const supplies=combatSupplies(data,planner,fighter,c,{zone:c.zone,monster:c.monster,
        foodItemId:0,horizon:Math.max(1,horizon-preparation.seconds),supplyCost:id=>supplyCost(fighter,id)});
      if (!supplies.sustainable||supplies.horizonKills<1) continue;
      const estimate=routeEstimate(fighter,{monsterId:c.monster.id},Math.max(1,Math.floor(supplies.horizonKills)),routeOptions);
      estimate.seconds+=preparation.seconds;estimate.xp+=preparation.xp;estimate.coins+=preparation.coins;
      estimate.rate={xp:estimate.xp/estimate.seconds,coins:estimate.coins/estimate.seconds};
      if (Number.isFinite(estimate.seconds)) candidates.push({skill,monsterId:c.monster.id,
        mainXpRate:c.mainXp*Math.max(1,Math.floor(supplies.horizonKills))/estimate.seconds,
        estimate,rate:estimate.rate,horizon,budget:routeEstimate(fighter,{monsterId:c.monster.id},20,{style}).budget,
        recipes:estimate.recipes,target:lv[skill]+1,stage:lv[skill]+1});
    }
    return candidates.sort((a,b)=>b.rate.xp-a.rate.xp||b.rate.coins-a.rate.coins||a.recipeId-b.recipeId);
  }
  function chooseGoal(p,served={},deferred={},style='magic') {
    const choices=candidates(p,style,deferred);
    if (!choices.length) return null;
    let best=choices[0];
    const current=choices.find(c=>c.recipeId===p.route?.jobId||c.monsterId&&data.zones.find(z=>z.id===p.route?.zoneId)?.monsterId===c.monsterId);
    // The model already charges travel; retain an active route within 5% to
    // absorb stochastic estimates without endless switching.
    if (current&&current.rate.xp>=best.rate.xp*.95) best=current;
    const goal={...best,reason:`滚动 ${horizon/60} 分钟：自给链总经验约 ${(best.rate.xp*60).toFixed(0)}/分，`+
      `直接金币约 ${(best.rate.coins*60).toFixed(1)}/分（盈余出售另计）；已计供料与旅行`};
    const investment=planner.investmentBudget?.(p,goal,style);
    if (investment) {
      goal.budget.coins=Math.max(goal.budget.coins,investment.coins);
      goal.enhancement=investment.enhancement;
      if (p.coins<investment.coins) goal.reason=`先补足已核算回本的投资 ${investment.coins} 金币；${goal.reason}`;
    }
    return goal;
  }
  return {chooseGoal,candidates,routeEstimate,estimateWork,combatOptions,setMeasurements,supplyCost,horizon};
}

// Read-only budgets and quotes; economy.js turns verified surplus into actions.
// Vendor, storage and worn-enhancement rules checked in index-DeoJ7Jh9.js.

const ENHANCEMENT_BASELINE=5;

function inventoryBudget(data, planner, p, goal=null) {
  const levels=planner.levels(p), items={...goal?.budget?.items};
  const capacity=p.unlimitedBank||(p.brews?.blessing??0)>p.lastTick?Infinity:
    75+(p.bankSlotsBought??0)+Math.floor((p.house?.storeroom??0)/2);
  const used=Object.values(p.bank).filter(n=>n>0).length;
  const recoverableOverflow=Object.entries(p.overflow??{}).some(([id,n])=>n>0&&
    ((p.bank[id]??0)>0||used<capacity));
  const pressure=used>=capacity-3||Object.values(p.overflow??{}).some(n=>n>0);
  const reserve=(id,qty)=>{items[id]=Math.max(items[id]??0,Math.ceil(qty));};
  const recipes=new Set(Object.values(goal?.recipes??{}));
  if(goal?.recipeId!=null)recipes.add(goal.recipeId);
  for(let route=p.route;route;route=route.after)if(route.jobId!=null)recipes.add(route.jobId);
  for(const id of recipes) {
    const job=data.jobs.find(j=>j.id===id);
    if(job)for(const input of job.inputs)reserve(input.itemId,input.qty*50);
  }
  function material(id,qty,trail=[]) {
    reserve(id,qty);
    if(trail.includes(id))return;
    const sources=data.jobs.filter(j=>j.output.itemId===id).sort((a,b)=>a.levelReq-b.levelReq);
    const job=sources.find(j=>levels[j.skill]>=j.levelReq)??(goal?.itemTarget?sources[0]:null);
    if(job)for(const input of job.inputs)material(input.itemId,
      Math.ceil(qty/job.output.qty)*input.qty,[...trail,id]);
  }
  for(const upgrade of [goal?.upgrade,goal?.toolUpgrade?.upgrade])
    if(upgrade?.id!=null)material(planner.base(upgrade.id),1);
  if(goal?.itemTarget)material(goal.targetItemId,goal.qty);
  // Food is a renewable supply, but a reserve must survive a sale and a new trip.
  const packCapacity=28+Math.max(0,p.perks?.pockets??0);
  const carry=p.foodPerTrip===-1?packCapacity:p.foodPerTrip===-2?Math.max(1,packCapacity-1):p.foodPerTrip??20;
  for(const item of Object.values(data.items))if(item.heals)reserve(item.id,Math.max(50,carry*3));
  return {items,coins:Math.max(0,goal?.budget?.coins??0),capacity,used,freeSlots:capacity-used,pressure,recoverableOverflow};
}
function enhanceQuote(data, planner, p, itemId) {
  const base=planner.base(itemId),n=Math.floor(itemId/data.plusScale);
  const rarity=Math.floor(itemId%data.plusScale/data.rarityScale);
  const recipe=data.jobs.find(j=>j.output.itemId===base);
  const tier=recipe?data.enhanceThresholds.filter(v=>recipe.levelReq>=v).length:3;
  const house=p.houseFurniture?.lectern?1+.01*(p.house?.lectern??0):1;
  const chance=Math.min(1,Math.max(.2,1-.06*n)*house*(1+.0025*(p.masteries?.enhance??0)));
  return {fromPlus:n,toPlus:n+1,chance,gold:data.enhanceGold[tier]*[1,3,8,20,50][rarity]*(n+1),
    shards:data.enhanceShards*(n+1),xp:Math.round(20*(n+1)*data.rarityXp[rarity]),
    failurePlus:0};
}

function reviewInventory(data, planner, p, goal=null, style='magic',budget=inventoryBudget(data,planner,p,goal)) {
  const lv=planner.levels(p),combatSkill=professionSkill(style);
  const name=id=>`${data.items[planner.base(id)]?.name??`物品 ${id}`}`+
    (id===planner.base(id)?'':`（品质 ${Math.floor(id%data.plusScale/data.rarityScale)}，+${Math.floor(id/data.plusScale)}）`);
  const seeds=new Set(data.jobs.filter(j=>j.grow).flatMap(j=>j.inputs.map(i=>i.itemId)));
  const inputs=new Set(data.jobs.flatMap(j=>j.inputs.map(i=>i.itemId)));
  const potions=new Set(data.jobs.filter(j=>j.skill==='herblore').map(j=>j.output.itemId));
  const houseMaterials=new Set([...data.jobs.filter(j=>['mining','woodcutting','fishing','farming'].includes(j.skill))
    .map(j=>j.output.itemId),...data.monsters.map(m=>m.drop)]);
  const stock=new Map();
  const add=(id,qty,place)=>{
    if(!qty||!Number.isFinite(id)) return;
    if(!stock.has(id))stock.set(id,{itemId:id,name:name(id),bank:0,pack:0,worn:0,overflow:0});
    stock.get(id)[place]+=qty;
  };
  Object.entries(p.bank).forEach(([id,qty])=>add(Number(id),qty,'bank'));
  p.pack.forEach(i=>add(i.itemId,i.qty,'pack'));
  Object.values(p.equipment).forEach(id=>add(id,1,'worn'));
  Object.entries(p.overflow??{}).forEach(([id,qty])=>add(Number(id),qty,'overflow'));
  const locked=new Set([goal?.upgrade?.id,goal?.toolUpgrade?.upgrade?.id,p.enhance?.itemId]);
  for(const set of p.gearSets??[])for(const id of Object.values(set?.items??{}))if(Number.isFinite(id))locked.add(id);
  // Saved sets resolve a missing enhancement level to another level of the same
  // base item and rarity (client a$). Preserve that fallback too.
  const lockedVariants=new Set([...locked].filter(Number.isFinite).map(id=>id%data.plusScale));
  const requirement=g=>g.levelReq??data.jobs.find(j=>j.output.itemId===planner.base(g.itemId))?.levelReq??1;
  const wearable=g=>lv[g.needs??data.toolSkills[g.slot]]>=requirement(g)||g.needs==='none';
  const relevant=g=>Object.hasOwn(data.toolSkills,g.slot)||(!g.style||g.style===combatSkill)&&
    (g.slot!=='weapon'||matchesProfessionWeapon(g,style))&&
    (g.slot!=='shield'||style!=='melee_twohand');
  const heldGear=[...stock.keys()].map(id=>planner.equipmentStats(id)).filter(Boolean);
  const selfSource=(id,trail=[])=>!trail.includes(id)&&(id===data.coinId||data.jobs.some(j=>
    j.output.itemId===id&&lv[j.skill]>=j.levelReq&&j.inputs.every(i=>selfSource(i.itemId,[...trail,id]))));
  function dominated(g) {
    return heldGear.some(h=>h.itemId!==g.itemId&&h.slot===g.slot&&relevant(h)&&
      (g.slot!=='weapon'||h.needs===g.needs)&&
      (h.style??combatSkill)===(g.style??combatSkill)&&!!h.twoHanded===!!g.twoHanded&&
      (wearable(h)||requirement(h)<=requirement(g))&&
      ['bonus','accuracy','strength','defence','luck'].every(k=>(h[k]??0)>=(g[k]??0))&&
      (h.speed??0)<=(g.speed??0)&&
      (['bonus','accuracy','strength','defence','luck'].some(k=>(h[k]??0)>(g[k]??0))||(h.speed??0)<(g.speed??0)));
  }
  const items=[...stock.values()].map(row=>{
    const id=row.itemId,base=planner.base(id),g=planner.equipmentStats(id);
    const total=row.bank+row.pack+row.worn+row.overflow;
    let keep=total,reason='用途未完全覆盖，先保留',category='保留';
    if(locked.has(id)||lockedVariants.has(id%data.plusScale))reason='装备方案／当前打造或强化目标';
    else if(id!==base)reason='稀有或已强化物品，避免按普通商人底价处理';
    else if(seeds.has(base))reason='种子用于持续补种，不作为普通盈余出售';
    else if(base===data.shardId||base===359)reason='强化材料／保护卷轴，留给有收益的升级';
    else if(potions.has(base))reason='药水按实际任务和消耗价值使用，保留待用';
    else if(data.items[base]?.heals) {keep=Math.min(total,budget.items[base]??50);reason='保留至少三趟战斗食物及当前计划需要量';}
    else if(inputs.has(base)||houseMaterials.has(base)) {
      const renewable=selfSource(base);
      const planned=budget.items[base]??0;
      if(renewable||planned>0) {
        keep=Math.min(total,Math.max(planned,budget.pressure?0:50));
        reason=planned?'保留当前批次、供料链和打造需要量':budget.pressure?
          '仓库紧张，出售暂未纳入计划且可自行重新采集的普通库存':'保留 50 件周转材料，出售明确盈余';
      } else reason='尚无可用自给来源或后续用途未预算，保留';
    }
    else if(base===70) {keep=0;category='可卖候选';reason='烧焦食物，出售回收金币';}
    else if(g) {
      keep=row.worn;
      if(relevant(g)&&!dominated(g))keep=Math.max(1,keep);
      keep=Math.min(total,keep);
      category=keep<total?'可卖候选':'保留';
      reason=!relevant(g)?'非所选职业的普通成品；已穿戴和套装引用另行保护':
        dominated(g)?'已有同位置且可替代的更好装备；已穿戴的仍保留':
        '保留一件未被现有装备替代的工具／本职业装备，重复成品可处理';
    }
    keep=Math.max(keep,Math.min(total,budget.items[id]??0),row.worn);
    const tradable=base!==data.coinId&&![294,295,296,297].includes(base)&&
      (data.items[base]?.value>0||base===70);
    const sell=tradable?Math.max(0,total-keep):0,vendorUnit=Math.max(1,Math.floor((data.items[base]?.value??0)*.4));
    if(sell>0)category='可卖候选';
    return {...row,total,keep,sell,sellFromBank:Math.min(row.bank,sell),vendorUnit,category,reason,
      estimatedCoins:sell*vendorUnit};
  });
  const enhancements=Object.entries(p.equipment).flatMap(([slot,id])=>{
    const before=planner.equipmentStats(id);
    if(!before||!relevant(before))return [];
    const after=planner.equipmentStats(id+data.plusScale),quote=enhanceQuote(data,planner,p,id);
    const changes=['accuracy','strength','defence','luck'].filter(k=>after[k]>before[k])
      .map(k=>`${{accuracy:'命中',strength:'力量',defence:'防御',luck:'幸运'}[k]} +${Math.round((after[k]-before[k])*1000)/1000}`);
    const skill=data.toolSkills[slot];
    let priority=2,benefit=changes.join('、')||'属性取整后不变',gain=changes.length;
    if(skill) {
      gain=(1+after.bonus)/(1+before.bonus)-1;
      benefit=slot==='hoe'?'当前后台种植不浇水，强化锄头不缩短自然生长时间':
        `未触及速度上限时，工作速度约 +${(gain*100).toFixed(2)}%`;
      if(slot==='hoe')gain=0;
      if(data.jobs.find(j=>j.id===p.route?.jobId)?.skill===skill)priority=0;
    } else if(slot==='weapon')priority=1;
    if(!gain)priority=4;
    const target=planner.equipmentStats(id%data.plusScale+ENHANCEMENT_BASELINE*data.plusScale);
    const towardBaseline=quote.fromPlus<ENHANCEMENT_BASELINE&&slot!=='hoe'&&slot!=='mount'&&
      ['accuracy','strength','defence','luck','bonus'].some(k=>(target[k]??0)>(before[k]??0));
    return [{itemId:id,name:name(id),slot,...quote,benefit,priority,
      recommendation:quote.fromPlus>=ENHANCEMENT_BASELINE?'已达 +5 基线，暂不自动追加':
        !gain?(towardBaseline?'通往 +5 的中间步骤，按完整提升与预算安排':'暂不强化'):
        quote.chance<1?'向 +5 提升，有失败归零风险；按盈余预算安排':'向 +5 提升，首级无失败风险',
      affordable:p.coins>=quote.gold&&planner.count(p,data.shardId)>=quote.shards}];
  }).sort((a,b)=>a.priority-b.priority||a.gold-b.gold);
  return {items,enhancements,budget};
}


// Count before sending so a refresh or an unconfirmed command cannot reset the
// attempt allowance. Failed/ambiguous work waits for the next equipment-use stage.
function createEnhancementTraining(data,planner,{read=()=>null,write=()=>{}}={}) {
  const state=read()??{records:{}};
  state.records??={};
  function sync() {
    // Another tab may have finished an attempt since this tracker was created.
    // Keep newer local records too if a storage write was unavailable.
    for(const [id,row]of Object.entries(read()?.records??{})) {
      const current=state.records[id];
      if(!current||row.stage>current.stage||row.stage===current.stage&&
        (row.attempts>current.attempts||row.attempts===current.attempts&&
          (row.failed&&!current.failed||current.pending&&!row.pending)))state.records[id]=row;
    }
  }
  const key=(p,itemId,slot)=>`${p.id}:${slot}:${itemId%data.plusScale}`;
  const stage=(p,itemId,slot)=>{
    const gear=planner.equipmentStats(itemId);
    const skill=data.toolSkills[slot]||(gear?.needs&&gear.needs!=='none'?gear.needs:gear?.style||'defence');
    return Math.floor((planner.levels(p)[skill]??1)/5);
  };
  function blocked(p,itemId,slot) {
    sync();
    const row=state.records[key(p,itemId,slot)];
    if(!row||row.stage!==stage(p,itemId,slot))return null;
    return row.pending?'上一强化结果尚未确认，本阶段不重复发送':
      row.failed?'本装备本阶段已有失败，先练其它技能':
      row.attempts>=ENHANCEMENT_BASELINE?'本装备本阶段已尝试五次，先练其它技能':null;
  }
  function issued(p,intent) {
    if(intent.t!=='enhance'||!intent.worn)return;
    sync();
    const id=key(p,intent.itemId,intent.worn),current=stage(p,intent.itemId,intent.worn);
    let row=state.records[id];
    if(!row||row.stage!==current)row=state.records[id]={playerId:p.id,stage:current,attempts:0};
    row.attempts++;
    row.pending={itemId:intent.itemId,slot:intent.worn,xp:p.skills.enhancing};
    write(state);
  }
  function observe(p) {
    sync();
    if(p.enhance)return;
    let changed=false;
    for(const row of Object.values(state.records)) {
      const pending=row.pending;
      if(row.playerId!==p.id||!pending||p.skills.enhancing<=pending.xp)continue;
      row.failed=p.equipment[pending.slot]!==pending.itemId+data.plusScale;
      delete row.pending;changed=true;
    }
    if(changed)write(state);
  }
  return {blocked,issued,observe};
}

// Enhancing levels do not unlock recipes or improve success odds. Train by
// improving equipment that will be used, never by manufacturing spare XP sinks.
function planEnhancement(data,planner,p,style='magic',goal=null) {
  if(p.enhance)return {intent:null,label:'等待本次强化结果',reason:'已有强化进行中，确认结果后再规划'};
  const lv=planner.levels(p),combatSkill=professionSkill(style);
  const attributes=['accuracy','strength','defence','luck','bonus'];
  const relevant=g=>g&&g.slot!=='hoe'&&(data.toolSkills[g.slot]||
    g.slot!=='mount'&&(!g.style||g.style===combatSkill)&&
    (g.slot!=='weapon'||matchesProfessionWeapon(g,style))&&
    (g.slot!=='shield'||style!=='melee_twohand'));
  const recipe=id=>data.jobs.find(j=>j.output.itemId===planner.base(id));
  const requirement=g=>g.levelReq??recipe(g.itemId)?.levelReq??1;
  const wearable=g=>!g.needs||g.needs==='none'?data.toolSkills[g.slot]:g.needs;
  const better=(a,b)=>attributes.every(k=>(a[k]??0)>=(b[k]??0))&&
    attributes.some(k=>(a[k]??0)>(b[k]??0));
  const owned=[...Object.keys(p.bank).filter(id=>p.bank[id]>0).map(Number),...p.pack.map(i=>i.itemId)];
  const options=[];
  let deferredReason='暂无值得强化的在用装备：先换阶段装备，或等待有实际属性收益的升级；不制造备用装备刷强化等级';
  for(const [slot,itemId]of Object.entries(p.equipment)) {
    const gear=planner.equipmentStats(itemId);
    if(goal?.specialization&&(goal.mainSkill===combatSkill?!!data.toolSkills[slot]:
      data.toolSkills[slot]!==goal.mainSkill))continue;
    if(!relevant(gear)||Math.floor(itemId/data.plusScale)>=ENHANCEMENT_BASELINE||goal?.upgrade?.slot===slot)continue;
    if(goal?.enhancement&&goal.enhancement.itemId!==itemId)continue;
    const quote=enhanceQuote(data,planner,p,itemId),after=planner.equipmentStats(itemId+data.plusScale);
    const target=planner.equipmentStats(itemId%data.plusScale+ENHANCEMENT_BASELINE*data.plusScale);
    // Rounded attributes can stay unchanged for one step on the way to +5.
    // Only cross that step when the baseline improves this same worn item.
    if(!better(after,gear)&&!(planner.enhancementTraining&&better(target,gear)))continue;
    const stopped=planner.enhancementTraining?.blocked(p,itemId,slot);
    if(stopped){deferredReason=stopped;continue;}
    const prior=goal?.enhancement;
    const otherCoins=Math.max(0,(goal?.budget?.coins??0)-(prior?.itemId===itemId?prior.gold??prior.quote?.gold??0:0));
    const otherShards=Math.max(0,(goal?.budget?.items?.[data.shardId]??0)-
      (prior?.itemId===itemId?prior.shards??prior.quote?.shards??0:0));
    // Beyond +1, use only existing surplus. One roll may spend at most 10% of
    // free coins and 25% of free shards; never acquire materials to chase a roll.
    if(quote.fromPlus>0&&(!planner.enhancementTraining||
      quote.gold>(p.coins-otherCoins)*.1||quote.shards>(planner.count(p,data.shardId)-otherShards)*.25)) {
      deferredReason='后续强化只用现有盈余：单次最多使用自由金币 10%、自由碎片 25%，保留换装和补给预算';continue;
    }
    // Equip an attainable tier upgrade first. Do not pay to enhance a piece
    // being replaced now or at the immediately upcoming level milestone.
    const replacement=[...data.gear.map(g=>g.itemId),...owned].some(id=>{
      const g=planner.equipmentStats(id),job=recipe(id);
      if(!relevant(g)||g.slot!==slot||!better(g,gear))return false;
      const skill=wearable(g),level=skill?lv[skill]:Infinity;
      return requirement(g)<=level+1&&(owned.includes(id)||job&&job.levelReq<=(lv[job.skill]??1)+1);
    });
    if(replacement)continue;
    const currentJob=data.jobs.find(j=>j.id===p.route?.jobId);
    const priority=slot==='weapon'?0:data.toolSkills[slot]===currentJob?.skill?1:data.toolSkills[slot]?2:3;
    options.push({itemId,slot,quote,priority,otherCoins,otherShards});
  }
  options.sort((a,b)=>a.priority-b.priority||a.quote.gold-b.quote.gold||a.itemId-b.itemId);
  const chosen=options[0];
  if(!chosen)return {intent:null,blocked:true,label:'强化暂缓',
    reason:deferredReason};
  const {itemId,slot,quote,otherCoins,otherShards}=chosen;
  const budget={coins:otherCoins+quote.gold,items:{...goal?.budget?.items,[data.shardId]:otherShards+quote.shards}};
  const enhancement={itemId,slot,toPlus:quote.toPlus,quote,gold:quote.gold,shards:quote.shards};
  const label=`强化在用装备 · ${data.items[planner.base(itemId)].name} +${quote.toPlus}`;
  const reason=`本次成功率 ${(quote.chance*100).toFixed(0)}%；消耗 ${quote.gold} 金币、${quote.shards} 碎片，获得 ${quote.xp} 强化经验；`+
    (quote.chance<1?'失败会回到 +0；':'')+
    '保留其它计划预算，在用装备目标 +5；逐级确认，同装备每阶段最多五次，失败后该阶段停止';
  const result={intent:null,label,reason,enhancement,budget};
  if(p.coins<budget.coins)return {...result,needs:{itemId:data.coinId,quantity:budget.coins},reason:`准备强化金币：需要 ${budget.coins}，当前 ${p.coins}；${reason}`};
  if(planner.count(p,data.shardId)<budget.items[data.shardId])return {...result,
    needs:{itemId:data.shardId,quantity:budget.items[data.shardId]},reason:`准备强化碎片：需要 ${budget.items[data.shardId]}，当前 ${planner.count(p,data.shardId)}；${reason}`};
  return {...result,intent:{t:'enhance',itemId,toPlus:quote.toPlus,once:true,worn:slot}};
}


function swiftPotion(data,planner,p,plan,window,drinkQty) {
  const itemId=225,next=plan?.intent,route=next??p.route;
  if(!route||next&&!['walk','setRoute','fight'].includes(next.t))return null;
  const job=data.jobs.find(j=>j.id===route.jobId);
  const target=next?.t==='walk'?next:data.sites.find(s=>s.id===route.siteId)??data.zones.find(z=>z.id===route.zoneId);
  if(!target||!next&&(!job||job.grow||route.limit===0))return null;
  const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y)),tick=data.tickMs/1000;
  const bank=point=>[...data.banks].sort((a,b)=>distance(point,a)-distance(point,b))[0].approach;
  // Native mounts use different quality/enhancement scaling from work tools.
  const mount=p.equipment.mount??0,mountBase=data.gear.find(g=>g.itemId===planner.base(mount)&&g.slot==='mount');
  const mountBonus=(mountBase?.bonus??0)*([1,1.5,2.25,3.5,5][Math.floor(mount%data.plusScale/data.rarityScale)]??1)*
    (1+.15*Math.floor(mount/data.plusScale));
  const stride=(1000+Math.round(mountBonus*1000))*(1+.005*(p.masteries?.move??0));
  const speed=Math.round(stride)/1000,boosted=Math.round(stride*1.2)/1000;
  let remaining=Math.min(600,Math.max(0,window)),travel=0,position=p;
  const move=to=>{const seconds=Math.min(remaining,distance(position,to)*tick/speed);
    travel+=seconds;remaining-=seconds;position=to;};
  // Drinking does not recompute an already generated path's strideSpeed.
  if(!next&&p.activity==='walking'&&p.path?.length) {
    remaining=Math.max(0,remaining-Math.max(0,p.path.length-(p.pathIndex??0))*tick/((p.strideSpeed??Math.round(stride))/1000));
    position=p.path.at(-1);
  }
  if(next?.t==='walk')move(target);
  else {
    if(!next&&route.phase==='toBank'&&!p.path?.length)move(bank(position));
    if(next)move(target);
    else position=target;
    if(job&&!job.inputs.length&&!job.grow&&['mining','fishing','woodcutting'].includes(job.skill)&&
      !data.items[job.output.itemId]?.stackable&&(route.onFull??'bank')==='bank'&&
      (next||!['toBank','banking'].includes(route.phase))) {
      const slot=Object.keys(data.toolSkills).find(k=>data.toolSkills[k]===job.skill);
      const seconds=workEstimate(data,job,planner.levels(p)[job.skill],{toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,
        quick:p.perks?.quick??0,hands:p.perks?.hands??0}).seconds;
      const capacity=28+Math.max(0,p.perks?.pockets??0);
      let dose=drinkQty;
      const freed=p.pack.filter(i=>i.itemId===itemId).reduce((slots,i)=>{
        const used=Math.min(dose,i.qty);dose-=used;
        return slots+(data.items[itemId]?.stackable?Number(used===i.qty):used);
      },0);
      const used=p.pack.reduce((sum,i)=>sum+(data.items[planner.base(i.itemId)]?.stackable?1:i.qty),0)-
        freed;
      let free=route.phase==='toBank'||route.phase==='banking'?capacity:Math.max(0,capacity-used);
      let count=route.limit==null||next&&route.limit===0?Infinity:Math.max(0,route.limit);
      while(remaining>0&&count>0) {
        const batch=Math.min(count,Math.floor(free/job.output.qty));
        remaining=Math.max(0,remaining-batch*seconds);count-=batch;
        if(count<=0||remaining<=0)break; // The final finite batch stops in place.
        move(bank(target));
        if(!next)break; // Existing work may be replaced at this banking boundary.
        remaining=Math.max(0,remaining-3*tick);move(target);free=capacity;
      }
    }
  }
  const saved=travel*(1-speed/boosted);
  return travel>0?{intent:{t:'drink',itemId,qty:1},label:'使用疾行药剂',gain:saved,
    reason:`移动速度 +20%；按未来 ${Math.ceil(Math.min(600,window))} 秒内本路线的新路程与中途存仓往返估算，`+
      `可加速路程约 ${Math.floor(travel)} 秒，预计节省 ${Math.floor(saved)} 秒；不计当前已生成路径和未知后续任务`}:null;
}

// Keep applicable owned potions active for the actual next/current task,
// not its supply-chain goal label. Surplus food retains its value check.
function planConsumable(data,planner,p,goal,profession,plan,window=600) {
  if(!p.brews||!Number.isFinite(p.lastTick)||p.enhance||plan?.blocked||plan?.deferUntilTick) {
    planner.watchPotions?.(p,[]);return null;
  }
  const next=plan?.intent;
  const route=next??p.route;
  const job=data.jobs.find(j=>j.id===route?.jobId);
  const budget=inventoryBudget(data,planner,p,goal),candidates=[];
  const active=kind=>(p.brews[kind]??0)>p.lastTick;
  const carried=id=>p.pack.some(i=>i.itemId===id&&i.qty>0);
  const accessible=id=>carried(id)||planner.nearBank(p)&&(p.bank[id]??0)>0;
  const producing=id=>job?.output.itemId===id||p.activity==='working'&&
    data.jobs.some(j=>[p.workJobId,p.route?.jobId].includes(j.id)&&j.output.itemId===id);
  const surplus=id=>Math.max(0,planner.count(p,id)-Math.max(0,budget.items[id]??0));
  const useQty=(id,desired)=>Math.min(desired,surplus(id),
    p.pack.filter(i=>i.itemId===id).reduce((sum,i)=>sum+i.qty,0)+(planner.nearBank(p)?p.bank[id]??0:0));
  const choose=()=>{
    const due=candidates.filter(({itemId})=>!producing(itemId))
      .map(potion=>({...potion,desired:potionRefillQty(p,potion.kind)})).filter(potion=>potion.desired>0);
    const missing=due.filter(({itemId,desired})=>surplus(itemId)<desired);
    planner.watchPotions?.(p,missing.map(potion=>potion.itemId));
    if(planner.nearBank(p)&&p.activity==='idle'&&!p.route&&!p.path?.length)
      for(const {itemId,desired}of missing) {
        const restock=planner.restockPotion?.(p,itemId,goal,desired);
        if(restock)return restock;
      }
    for(const {itemId,action,desired,canDrink=true}of due)if(canDrink) {
      const qty=useQty(itemId,desired);
      if(qty>0)return {...action,intent:{...action.intent,qty},
        reason:`${action.reason}；药效剩余不超过 6 小时，使用 ${qty} 瓶，目标约 20 小时（库存不足则先补现货）`};
    }
    return null;
  };
  const add=(potion,effect)=>candidates.push({...potion,canDrink:!!next||p.activity==='working',
    action:{intent:{t:'drink',itemId:potion.itemId,qty:1},
    label:`使用${potion.label}`,reason:`${effect}；按当前实际任务使用普通药水，保留计划用量`}});
  const swift=swiftPotion(data,planner,p,plan,window,useQty(225,potionRefillQty(p,'swift')));
  if(swift)candidates.push({itemId:225,kind:'swift',action:swift});
  if(next&&!['setRoute','fight'].includes(next.t)||!route)return choose();
  if(route.errand||job?.grow) {
    if(job?.grow&&route.errand&&(next||p.activity==='working')&&
      planner.farmPlots(p).some(f=>f.readyAt<=p.lastTick))add(POTIONS.find(p=>p.kind==='hunter'),'返还种子的品质稀有倍率 +25%');
    return choose();
  }
  const zone=data.zones.find(z=>z.id===route.zoneId),monster=data.monsters.find(m=>m.id===zone?.monsterId);
  if(!job&&!monster)return choose();
  if(!next&&route.limit===0)return choose();
  const tick=data.tickMs/1000,lv=planner.levels(p),limit=route.limit>0?route.limit:Infinity;
  const cap=Math.min(600,Math.max(0,window));
  const slot=job&&Object.keys(data.toolSkills).find(k=>data.toolSkills[k]===job.skill);
  const work=job&&workEstimate(data,job,lv[job.skill],{
    toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,quick:p.perks?.quick??0,hands:p.perks?.hands??0});
  const style=professionSkill(profession),gear=Object.values(p.equipment).map(planner.equipmentStats).filter(Boolean);
  const stat=key=>gear.reduce((sum,g)=>sum+(key==='defence'||!g.style||g.style===style?1:-1)*(g[key]??0),0);
  const weapon=planner.equipmentStats(p.equipment.weapon);
  const fightSeconds=(warrior=brewPower(data,p,'warrior'),haste=brewPower(data,p,'haste'),fed=active('fed')?.25:0)=>{
    const divisor=style==='magic'?4.5:weapon?.twoHanded?6:style==='ranged'&&weapon?.speed===5?5:8;
    const baseHit=Math.max(1,1+Math.floor((lv[style]+stat('strength'))/divisor));
    const maxHit=Math.ceil(baseHit*(1+.1*warrior+fed));
    const accuracy=Math.max(1,10+lv[style]+stat('accuracy')+Math.round(10*warrior));
    const hit=accuracy/(accuracy+10+monster.defence*(style==='magic'?.5:1));
    return expectedAttacks(monster.hp,maxHit,hit)*(weapon?.speed??5)*tick/(1+.2*haste);
  };
  const seconds=job?work.seconds:fightSeconds(),duration=Math.min(cap,limit*seconds);
  const coinRate=planner.coinRate(p);
  const foodId=p.foodItemId>0?p.foodItemId:p.pack.find(i=>data.items[planner.base(i.itemId)]?.heals)?.itemId??60;
  const food=data.items[planner.base(foodId)];
  const meanHit=monster?(monster.maxHit+1)/2:0;
  const rootedHit=monster?Array.from({length:monster.maxHit},(_,i)=>Math.max(1,Math.floor((i+1)*.8)))
    .reduce((sum,damage)=>sum+damage,0)/monster.maxHit:0;
  const damageReduction=meanHit?1-rootedHit/meanHit:0;
  const enemyDps=monster?(10+monster.attack)/(20+monster.attack+lv.defence+stat('defence'))*
    (active('rooted')?rootedHit:meanHit)/(monster.speed*tick):0;
  const foodRarity=Math.floor(foodId%data.plusScale/data.rarityScale);
  const rawHeal=Math.max(1,Math.round((food?.heals??0)*(data.foodHealingMultipliers??[1,1.2,1.5,2,3])[foodRarity]));
  const maxHp=Math.floor(lv.hitpoints*(1+.005*(p.masteries?.hp??0)));
  const gap=Math.max(1,maxHp-Math.floor(maxHp*(p.eatAt??.5)));
  const healFor=power=>Math.max(1,Math.min(gap,Math.floor(rawHeal*(1+.025*(p.perks?.meals??0)+.25*power))));
  const healing=healFor(brewPower(data,p,'nourish'));
  const foodValue=food?.value??0;
  for(const potion of POTIONS) {
    const {kind}=potion;
    let effect='';
    if((kind==='gatherer'&&job&&!job.inputs.length&&['mining','fishing','woodcutting','thieving'].includes(job.skill))||
      (kind==='elixir'&&(job||monster))) {
      effect='经验 +10%';
    } else if(kind==='warrior'&&monster) {
      effect='命中 +10、最大伤害 +10%';
    } else if(kind==='haste'&&monster) {
      effect='攻击速度 +20%';
    } else if(kind==='abyssal'&&monster) {
      effect='击杀金币 +25%';
    } else if(kind==='nourish'&&monster&&healFor(1)>healFor(0)) {
      effect='食物治疗 +25%';
    } else if(kind==='hunter'&&job&&!job.inputs.length&&job.output.itemId!==data.coinId) {
      effect='产物的品质稀有倍率 +25%';
    } else if(kind==='hunter'&&monster?.drop!=null) {
      effect='掉落物的品质稀有倍率 +25%';
    }
    if(effect)add(potion,effect);
  }
  const potion=choose();if(potion)return potion;
  if(!next&&p.activity!=='working')return null;
  if(duration<30)return null;
  const options=[];
  if(monster)for(const item of Object.values(data.items).filter(i=>i.heals)) {
    const itemId=item.id,effects=foodEffects(data,itemId);
    if(!effects.rootedTicks||active('rooted')||!accessible(itemId)||planner.count(p,itemId)<=Math.max(0,budget.items[itemId]??0))continue;
    const covered=Math.min(duration,effects.rootedTicks*tick);
    const savedFood=covered*enemyDps/healing*damageReduction*foodValue;
    if(savedFood>item.value)options.push({intent:{t:'eat',itemId,qty:1,...(!carried(itemId)?{shelf:true}:{})},
      label:'用盈余作物补充减伤',reason:`承伤 -20%，覆盖本批约 ${Math.ceil(covered)} 秒；`+
        `预计节省食物估值 ${Math.floor(savedFood)}，消耗作物估值 ${item.value} 金币，保留正常补给和计划原料`,gain:(savedFood-item.value)/Math.max(.001,coinRate)});
  }
  options.sort((a,b)=>b.gain-a.gain||a.intent.itemId-b.intent.itemId);
  return options[0]??null;
}


function createProgression(data,planner) {
  function status(p,style='magic',deferred={}) {
    const lv=planner.levels(p),skills=planner.trainedSkills(style).filter(s=>!['enhancing','defence','hitpoints'].includes(s));
    const eligible=skills.filter(s=>!deferred[s]);
    const lowestLevel=eligible.length?Math.min(...eligible.map(s=>lv[s])):null;
    const stage=lowestLevel===null?null:Math.min(planner.thresholds.length-1,(Math.floor(lowestLevel/5)+1)*5);
    const improvement=deferred.enhancing?null:planEnhancement(data,planner,p,style);
    return {stage,lowestLevel,
      remaining:eligible.filter(s=>lv[s]<stage).map(skill=>({skill,level:lv[skill],target:stage})),
      deferred:skills.filter(s=>deferred[s]).map(skill=>({skill,level:lv[skill]})),
      enhancement:improvement?.enhancement??null};
  }
  function chooseGoal(p,served={},deferred={},style='magic') {
    const state=status(p,style,deferred),lv=planner.levels(p),combatSkill=professionSkill(style);
    const candidates=planner.candidates(p,style,deferred),choices=[];
    const best=items=>items.sort((a,b)=>(b.rate?.xp??0)-(a.rate?.xp??0))[0];
    for(const {skill,level}of state.remaining.filter(s=>s.level===state.lowestLevel)) {
      let candidate=best(candidates.filter(c=>c.skill===skill));
      if(!candidate) {
        const jobs=data.jobs.filter(j=>j.skill===skill&&j.levelReq<=level&&data.sites.some(s=>s.jobIds.includes(j.id)));
        const scored=jobs.map(job=>{
          const e=workEstimate(data,job,level),seconds=e.seconds+(job.grow??0)*data.tickMs/1000;
          return {job,rate:{xp:e.xp/seconds,coins:e.coins/seconds}};
        }).sort((a,b)=>b.rate.xp-a.rate.xp||a.job.id-b.job.id);
        const fallback=scored[0];
        if(fallback)candidate={recipeId:fallback.job.id,recipes:{[skill]:fallback.job.id},batch:50,
          rate:fallback.rate,horizon:1800,budget:{coins:0,items:{}}};
        else if(skill===combatSkill)candidate={
          rate:{xp:0,coins:0},horizon:1800,budget:{coins:0,items:{}}};
      }
      const target=skill===combatSkill?Math.min(state.stage,level+1):state.stage;
      if(candidate)choices.push({...candidate,skill,target,stage:state.stage,growth:true,
        reason:`阶段 ${state.stage} 级：补齐落后技能（当前 ${level} 级），本批目标 ${target} 级；同阶段按实际收益选路线`});
    }
    if(state.enhancement) {
      const plan=planEnhancement(data,planner,p,style);
      choices.push({skill:'enhancing',target:lv.enhancing+1,stage:state.stage,growth:true,enhancementProject:true,
        enhancement:plan.enhancement,budget:plan.budget,horizon:1800,rate:{xp:0,coins:0},
        reason:`阶段装备强化：在用装备尝试 +${plan.enhancement.toPlus}，获得强化经验；单次后轮换，失败后本阶段停止重试`});
    }
    choices.sort((a,b)=>(served[a.skill]??0)-(served[b.skill]??0)||(b.rate?.xp??0)-(a.rate?.xp??0));
    return choices[0]??null;
  }
  return {chooseGoal,status};
}


const MAIN_TRADES={auto:'自动选择（按收益）',mining:'采矿',fishing:'钓鱼',woodcutting:'伐木',
  thieving:'盗窃',cooking:'烹饪',smithing:'锻造',fletching:'箭术制作',herblore:'炼药',crafting:'制作',combat:'战斗（按所选职业）'};

// Compare renewable production, not a one-time warehouse liquidation. Market
// proceeds are a finite-batch forecast; only marketFilled records actual income.
function createSpecialization(data,planner) {
  let owner=null,profession=null,selection='auto',selectedJob=null,selectedMonster=null,focus=null,pausedUntil={};
  const seconds=p=>p.lastTick*data.tickMs/1000;
  function select(p,style,requested='auto',jobId=null,monsterId=null) {
    if(owner===p.id&&profession===style&&selection===requested&&selectedJob===jobId&&selectedMonster===monsterId)return;
    owner=p.id;profession=style;selection=requested;selectedJob=jobId;selectedMonster=monsterId;focus=null;pausedUntil={};
  }
  function incomeChoices(p,candidates,style) {
    const choices=[];
    for(let c of candidates) {
      let proceeds=0;
      if(c.output&&c.output.itemId!==data.coinId) {
        const {itemId,qty}=c.output;
        const minSale=['mining','fishing','woodcutting'].includes(c.skill)&&!data.items[itemId]?.stackable?
          Math.min(qty,28+(p.perks?.pockets??0)):1;
        const before=reviewInventory(data,planner,p,c,style).items.find(i=>i.itemId===itemId);
        let saleQty=0,multiplier=1;
        for(;multiplier<=4;multiplier++) {
          const next={...p,bank:{...p.bank,[itemId]:(p.bank[itemId]??0)+qty*multiplier}};
          const after=reviewInventory(data,planner,next,c,style).items.find(i=>i.itemId===itemId);
          saleQty=Math.max(0,(after?.sell??0)-(before?.sell??0));
          if(saleQty>=minSale)break;
        }
        if(saleQty<minSale)saleQty=0;
        if(saleQty&&multiplier>1) {
          const estimate=planner.routeEstimate(p,c.recipeId,50*multiplier,{style,ignoreStock:true,completeTrips:true});
          if(!Number.isFinite(estimate.seconds)||estimate.seconds>1800||estimate.unlocks?.length)continue;
          c={...c,estimate,rate:estimate.rate};
        }
        // Protected potions, seeds, food reserves and gear are not sale income.
        if(saleQty>0) {
          const quote=planner.marketOpportunity?.(p,itemId,saleQty);
          if(quote?.qty===saleQty&&Number.isFinite(quote.net)&&quote.net>0)proceeds=quote.net;
        }
      }
      const coins=c.estimate.coins+proceeds;
      if(!(coins>0)||!Number.isFinite(c.estimate.seconds)||c.estimate.seconds<=0)continue;
      choices.push({...c,rate:{xp:c.rate.xp,coins:coins/c.estimate.seconds},marketProceeds:proceeds});
    }
    choices.sort((a,b)=>b.rate.coins-a.rate.coins||b.rate.xp-a.rate.xp);
    return choices;
  }
  function manualGoal(p,served,deferred,style,requested) {
    const skill=requested==='combat'?professionSkill(style):requested,lv=planner.levels(p),now=seconds(p);
    if(!focus)focus={skill,since:now,progressAt:now,xp:p.skills[skill]};
    if(p.skills[skill]>focus.xp){focus.xp=p.skills[skill];focus.progressAt=now;}
    const excluded=Object.fromEntries(data.skills.filter(s=>s!==skill).map(s=>[s,true]));
    let best,temporary=false,watched=[];
    if(deferred[skill]) {
      const side=Object.fromEntries(data.skills.filter(s=>s!=='thieving').map(s=>[s,true]));
      best=!deferred.thieving&&planner.candidates(p,style,side).filter(c=>c.output?.itemId===data.coinId)
        .sort((a,b)=>b.rate.coins-a.rate.coins)[0];
      temporary=true;
    } else {
      const renewable=planner.candidates(p,style,excluded,{sustainable:true})
        .filter(c=>c.skill===skill&&!c.estimate.unlocks?.length);
      watched=renewable.map(c=>c.output?.itemId).filter(Boolean);
      const preferred=renewable.find(c=>c.recipeId===focus.recipeId)?.output?.itemId;
      planner.watchMarket?.(p,[preferred,...watched].filter(Boolean),preferred);
      const earning=incomeChoices(p,renewable,style).filter(c=>
        c.marketProceeds>0||c.output?.itemId===data.coinId||c.monsterId!=null);
      // A funded production batch is useful now. Future replacement inputs
      // should not make a faster stocked recipe lose to a large low-tier pile.
      const stocked=earning.length?[]:planner.candidates(p,style,excluded,{stockedBatch:true});
      const candidates=(stocked.length?stocked:planner.candidates(p,style,excluded)).filter(c=>c.skill===skill)
        .sort((a,b)=>(b.mainXpRate??b.rate.xp)-(a.mainXpRate??a.rate.xp));
      best=earning[0]??candidates[0];
      const current=candidates.find(c=>c.recipeId!=null&&c.recipeId===focus.recipeId||c.monsterId!=null&&c.monsterId===focus.monsterId);
      if(!earning.length&&current&&(current.mainXpRate??current.rate.xp)>=(best.mainXpRate??best.rate.xp)*.95)best=current;
      // A chosen profession remains valid even before its materials or starter
      // weapon are unlocked. Existing planning resolves that explicit dependency.
      best??=planner.growthChooseGoal(p,served,excluded,style);
    }
    if(!best) {
      focus.reason='指定主业暂时受阻，等待条件恢复；不会自动更换主业';
      planner.watchMarket?.(p,[]);return null;
    }
    const target=Math.min(planner.thresholds.length-1,data.jobs.filter(j=>j.skill===skill&&j.levelReq>lv[skill])
      .map(j=>j.levelReq).sort((a,b)=>a-b)[0]??lv[skill]+5);
    const recipe=data.jobs.find(j=>j.id===best.recipeId);
    const reason=temporary?'指定主业正在等待材料／条件；临时赚取直接金币，条件恢复后返回主业':
      `固定主业 · ${MAIN_TRADES[requested]}：`+(best.marketProceeds?
        '当前配方有买单支持，按完整供料与税后收益比较；报价变化只重选本主业的路线':
        '按供料与往返后的主业经验选路线；无买单也不自动换主业')+
      (recipe?`；当前配方 ${recipe.name}`:'')+
      (!best.marketProceeds&&Number.isFinite(best.mainXpRate)?`，预计本业经验 ${(best.mainXpRate*60).toFixed(0)}/分`:'');
    Object.assign(focus,{target,reason,...(!temporary?{recipeId:best.recipeId,monsterId:best.monsterId,rate:best.rate}:{})});
    planner.watchMarket?.(p,[best.output?.itemId,...watched].filter(Boolean),best.output?.itemId);
    const batch=best.batch??50;
    const budget={coins:best.budget?.coins??0,items:{...best.budget?.items}};
    if(!temporary)for(const input of data.jobs.find(j=>j.id===best.recipeId)?.inputs??[])
      budget.items[input.itemId]=Math.max(budget.items[input.itemId]??0,input.qty*batch);
    return {...best,budget,growth:false,target:temporary?Math.min(planner.thresholds.length-1,lv[best.skill]+1):target,
      stage:target,specialization:true,manualTrade:requested,mainSkill:skill,temporary,
      startedXp:p.skills[best.skill],startedTick:p.lastTick,
      skipUpgrade:temporary||now-focus.progressAt>=600,batch,reason};
  }
  function fixedGoal(p,deferred,style,requested,job) {
    const skill=job.skill,lv=planner.levels(p),now=seconds(p);
    if(!focus)focus={skill,since:now,progressAt:now,xp:p.skills[skill]};
    if(p.skills[skill]>focus.xp){focus.xp=p.skills[skill];focus.progressAt=now;}
    const reason=`固定工作 · ${MAIN_TRADES[requested]}：${job.name}；准备所需装备与材料后返回此工作，不自动更换配方`;
    Object.assign(focus,{recipeId:job.id,reason});
    planner.watchMarket?.(p,[job.output.itemId],job.output.itemId);
    if(deferred[skill])return null;
    const batch=50,estimate=planner.routeEstimate(p,job,batch,{style});
    const target=Math.min(planner.thresholds.length-1,lv[skill]+1);
    const budget={coins:estimate.budget.coins,items:{...estimate.budget.items}};
    for(const input of job.inputs)budget.items[input.itemId]=Math.max(budget.items[input.itemId]??0,input.qty*batch);
    return {skill,recipeId:job.id,fixedRecipeId:job.id,recipes:{...estimate.recipes,[skill]:job.id},
      supplyRecipes:estimate.supplyRecipes,output:{...job.output},estimate,rate:estimate.rate,
      budget,target,stage:target,specialization:true,manualTrade:requested,mainSkill:skill,
      growth:false,startedXp:p.skills[skill],startedTick:p.lastTick,skipUpgrade:now-focus.progressAt>=600,batch,reason};
  }
  function chooseGoal(p,served={},deferred={},style='magic',requested='auto',jobId=null,monsterId=null) {
    if(!Object.hasOwn(MAIN_TRADES,requested))requested='auto';
    const fixed=data.jobs.find(j=>j.id===jobId&&j.skill===requested&&!j.grow);
    const monster=requested==='combat'&&data.monsters.find(m=>m.id===monsterId);
    select(p,style,requested,fixed?.id??null,monster?.id??null);
    if(fixed)return fixedGoal(p,deferred,style,requested,fixed);
    if(monster) {
      const skill=professionSkill(style),target=Math.min(planner.thresholds.length-1,planner.level(p.skills[skill])+1);
      const reason=`固定怪物：${monster.name}；检查安全、武器与食物，准备完成后返回此目标，不自动更换怪物`;
      focus??={skill,since:seconds(p)};Object.assign(focus,{target,monsterId:monster.id,reason});
      planner.watchMarket?.(p,[]);
      if(deferred[skill])return null;
      return {skill,monsterId:monster.id,fixedMonsterId:monster.id,target,stage:target,
        specialization:true,manualTrade:requested,mainSkill:skill,growth:false,horizon:1800,
        budget:{coins:0,items:{}},startedXp:p.skills[skill],startedTick:p.lastTick,reason};
    }
    if(requested!=='auto')return manualGoal(p,served,deferred,style,requested);
    const now=seconds(p),lv=planner.levels(p);
    if(focus&&p.skills[focus.skill]>focus.xp) {
      focus.xp=p.skills[focus.skill];focus.progressAt=now;
    }
    // A material/tool project that never reaches its main work cannot monopolize
    // the account. Finish the current load, then cool this direction for ten minutes.
    if(focus&&now-focus.progressAt>=900) {
      pausedUntil[focus.skill]=now+600;focus=null;
    }
    const excluded={...deferred};
    for(const [skill,until]of Object.entries(pausedUntil))if(until>now)excluded[skill]=true;
    const candidates=planner.candidates(p,style,excluded,{sustainable:true})
      .filter(c=>!c.estimate.unlocks?.length&&(!c.monsterId||
        matchesProfessionWeapon(planner.equipmentStats(p.equipment.weapon),style)));
    // Round-robin the skill groups before the market's bounded watch list, so
    // dozens of equipment recipes cannot hide every gathering opportunity.
    const groups=data.skills.map(skill=>candidates.filter(c=>c.skill===skill&&c.output?.itemId!==data.coinId));
    const ids=[];
    for(let i=0;i<Math.max(0,...groups.map(g=>g.length));i++)for(const group of groups)
      if(group[i]?.output?.itemId)ids.push(group[i].output.itemId);
    const preferred=candidates.find(c=>c.recipeId===focus?.recipeId)?.output?.itemId;
    planner.watchMarket?.(p,[preferred,...ids].filter(Boolean),preferred);
    const choices=incomeChoices(p,candidates,style);
    let best=choices[0];
    const current=choices.find(c=>c.skill===focus?.skill);
    if(current&&(now-focus.since<1800||best.rate.coins<current.rate.coins*1.2))best=current;
    if(!best) {
      focus=null;
      return null;
    }
    if(focus?.skill!==best.skill)focus={skill:best.skill,since:now,progressAt:now,xp:p.skills[best.skill]};
    const nextLevel=data.jobs.filter(j=>j.skill===best.skill&&j.levelReq>lv[best.skill])
      .map(j=>j.levelReq).sort((a,b)=>a-b)[0];
    const target=Math.min(planner.thresholds.length-1,nextLevel??lv[best.skill]+5);
    const reason=`主业持续经营：预计 ${Math.round(best.rate.coins*60)} 金币/分、${Math.round(best.rate.xp*60)} 经验/分；`+
      (best.marketProceeds?'普通盈余按当前买单扣税估算，成交量变化会重评；':'只计直接金币，未售库存不计收入；')+
      '已计重新供料和往返，完成批次后复核';
    Object.assign(focus,{target,rate:best.rate,reason,recipeId:best.recipeId});
    planner.watchMarket?.(p,[best.output?.itemId,...ids].filter(Boolean),best.output?.itemId);
    return {...best,target,stage:target,specialization:true,mainSkill:best.skill,
      startedXp:p.skills[best.skill],startedTick:p.lastTick,
      skipUpgrade:now-focus.progressAt>=600,batch:50,reason};
  }
  function status(p,style='magic',requested='auto',jobId=null,monsterId=null) {
    if(!Object.hasOwn(MAIN_TRADES,requested))requested='auto';
    const fixed=data.jobs.find(j=>j.id===jobId&&j.skill===requested&&!j.grow);
    const monster=requested==='combat'&&data.monsters.find(m=>m.id===monsterId);
    select(p,style,requested,fixed?.id??null,monster?.id??null);
    if(fixed)return {skill:fixed.skill,requested,fixedRecipeId:fixed.id,recipeId:fixed.id,
      reason:focus?.reason??`已固定工作：${fixed.name}，开始后准备此工作所需装备和材料`};
    if(monster)return {skill:professionSkill(style),requested,fixedMonsterId:monster.id,monsterId:monster.id,
      reason:focus?.reason??`已固定怪物：${monster.name}，开始后检查安全、武器与食物`};
    return focus?{skill:focus.skill,target:focus.target,since:focus.since,rate:focus.rate,reason:focus.reason,requested}:
      requested!=='auto'?{skill:requested==='combat'?professionSkill(style):requested,requested,reason:'已指定主业，开始后规划供料和练级'}:null;
  }
  function reset(){owner=null;focus=null;pausedUntil={};}
  return {chooseGoal,status,reset};
}


function createQuests(data,planner) {
  const dayTicks=86400000/data.tickMs;
  const title=q=>q.kind==='kill'?data.monsters.find(m=>m.id===q.monsterId)?.name:
    data.jobs.find(j=>j.id===q.jobId)?.name;
  function read(p) {
    if(!p?.quests||!Number.isFinite(p.lastTick)||p.lastTick<0)return [];
    const day=Math.floor(p.lastTick/dayTicks),rows=[];
    for(const [period,field,current,length]of [['daily','day',day,dayTicks],['weekly','week',Math.floor(day/7),7*dayTicks]]) {
      const stamp=p.quests[field];
      if(stamp!==current||!Array.isArray(p.quests[period]))continue;
      for(const q of p.quests[period]) {
        if(!q||typeof q.id!=='string'||!q.id||!['gather','craft','kill'].includes(q.kind)||
          !Number.isInteger(q.goal)||q.goal<=0||!Number.isInteger(q.done)||q.done<0||
          typeof q.claimed!=='boolean'||!data.skills.includes(q.reward?.skill)||
          !Number.isFinite(q.reward?.xp)||q.reward.xp<0||!Number.isFinite(q.reward?.coins)||q.reward.coins<0)continue;
        rows.push({...q,period,stamp,key:`${period}:${stamp}:${q.id}`,
          remaining:Math.max(0,q.goal-q.done),expiresAtTick:(stamp+1)*length});
      }
    }
    return rows;
  }
  function claim(p,style='magic') {
    const gear=planner.equipmentStats(p.equipment.weapon);
    const activeSkill=gear?.magic?'magic':gear?.ranged?'ranged':'melee';
    const q=read(p).find(q=>!q.claimed&&!q.remaining&&(q.kind!=='kill'||activeSkill===professionSkill(style)));
    if(!q)return null;
    const skill=q.kind==='kill'?activeSkill:q.reward.skill;
    return {intent:{t:'claimQuest',id:q.id},label:`领取${q.period==='daily'?'每日':'每周'}任务 · ${title(q)??q.id}`,
      reason:`领取 ${q.reward.coins} 金币与 ${q.reward.xp} ${skill} 经验；不打断当前任务`};
  }
  function chooseGoal(p,baseline,style='magic',deferred={}) {
    const levels=planner.levels(p),choices=[],coinThreshold=Math.max(0,baseline?.rate?.coins??0,planner.coinRate?.(p)??0);
    for(const q of read(p)) {
      if(q.claimed||!q.remaining||deferred[q.key])continue;
      const job=q.kind==='kill'?null:data.jobs.find(j=>j.id===q.jobId);
      const skill=q.kind==='kill'?professionSkill(style):job?.skill;
      if(!skill||!planner.trainedSkills(style).includes(skill)||job&&(job.grow||job.levelReq>levels[skill]))continue;
      if(q.kind==='kill'&&!data.monsters.some(m=>m.id===q.monsterId))continue;
      // Progress counts successful produced events, including rare results,
      // once per action. Existing output stock cannot substitute for the work.
      const success=job?workEstimate(data,job,levels[skill],{hands:p.perks?.hands??0}).success:1;
      if(!(success>0))continue;
      const estimate=planner.routeEstimate(p,job??{monsterId:q.monsterId},Math.ceil(q.remaining/success),{style});
      const seconds=estimate.seconds,left=(q.expiresAtTick-p.lastTick)*data.tickMs/1000;
      const horizon=q.period==='daily'?1200:600;
      if(!Number.isFinite(seconds)||seconds<=0||seconds>horizon||seconds>left)continue;
      const rate={xp:(estimate.xp+q.reward.xp)/seconds,coins:(estimate.coins+q.reward.coins)/seconds};
      if(baseline?.specialization&&skill!==baseline.mainSkill&&rate.coins<coinThreshold*1.2)continue;
      const dailyPriority=q.period==='daily'&&(q.reward.xp>0||q.reward.coins>0);
      if(!dailyPriority&&!(rate.xp>0&&rate.xp>=(baseline?.rate?.xp??0))&&!(rate.coins>0&&rate.coins>=coinThreshold))continue;
      const quest={key:q.key,id:q.id,period:q.period,stamp:q.stamp,kind:q.kind,
        ...(job?{jobId:job.id}:{monsterId:q.monsterId})};
      choices.push({skill,...(job?{recipeId:job.id}:{monsterId:q.monsterId}),batch:q.remaining,
        target:levels[skill]+1,stage:baseline?.stage,growth:true,quest,rate,budget:estimate.budget,
        ...(baseline?.specialization?{specialization:true,mainSkill:baseline.mainSkill,manualTrade:baseline.manualTrade}:{}),
        recipes:{...estimate.recipes,...(job?{[skill]:job.id}:{})},supplyRecipes:estimate.supplyRecipes,
        horizon,estimate,urgent:left<=seconds+(baseline?.horizon??1800),
        reason:`优先${q.period==='daily'?'每日':'每周'}任务 · ${title(q)}：剩 ${q.remaining} 次，`+
          `预计 ${Math.ceil(seconds/60)} 分钟；含奖励 ${Math.round(rate.xp*60)} 经验/分、${Math.round(rate.coins*60)} 金币/分`});
    }
    choices.sort((a,b)=>Number(b.quest.period==='daily')-Number(a.quest.period==='daily')||
      Number(b.urgent)-Number(a.urgent)||b.rate.xp-a.rate.xp||b.rate.coins-a.rate.coins||
      a.estimate.seconds-b.estimate.seconds||a.quest.key.localeCompare(b.quest.key));
    return choices[0]??null;
  }
  function completed(p,goal) {
    if(!goal?.quest)return false;
    const q=read(p).find(q=>q.key===goal.quest.key);
    return !q||q.claimed||q.remaining===0;
  }
  return {read,claim,chooseGoal,completed};
}


const NAMES = {
  mining:'采矿', fishing:'钓鱼', woodcutting:'伐木', farming:'农业', thieving:'盗窃',
  cooking:'烹饪', smithing:'锻造', fletching:'箭术制作', herblore:'炼药', crafting:'制作',
  enhancing:'强化', melee:'近战', ranged:'远程', magic:'魔法', defence:'防御', hitpoints:'生命'
};

function createPlanner(data) {
  const {jobs, sites, banks, monsters, zones} = data;
  const attacks = ['melee','ranged','magic'];
  const gear = new Map(data.gear.map(g => [g.itemId,g]));
  const thresholds = [0,0];
  const x = data.xp;
  for (let level = 2; level <= x.journeyLevel; level++) {
    thresholds[level] = Math.round(x.baseXp * (x.growth ** (level-1)-1) / (x.growth-1));
  }
  let total = thresholds.at(-1), step = total*x.beyondStep;
  while (total+step <= Number.MAX_SAFE_INTEGER) {
    total += step; thresholds.push(Math.round(total)); step *= x.beyondGrowth;
  }
  const level = xp => {
    let lo = 1, hi = thresholds.length-1;
    while (lo < hi) {
      const mid = Math.ceil((lo+hi)/2);
      if (thresholds[mid] <= xp) lo = mid; else hi = mid-1;
    }
    return lo;
  };
  const base = id => id % data.plusScale % data.rarityScale;
  const plus = id => Math.floor(id/data.plusScale);
  const rarity = id => Math.floor(id%data.plusScale/data.rarityScale);
  function equipmentStats(id) {
    const g=gear.get(base(id));
    if (!g) return null;
    const tier=data.rarityMultipliers[rarity(id)]??1, scale=1+data.enhanceScale*plus(id);
    return {...g,itemId:id,accuracy:Math.round(Math.round((g.accuracy??0)*tier)*scale),
      strength:Math.round(Math.round((g.strength??0)*tier)*scale),
      defence:Math.round(Math.round((g.defence??0)*tier)*scale),bonus:(g.bonus??0)*tier*scale,
      luck:(g.luck??0)*tier*scale};
  }
  const name = id => data.items[base(id)]?.name ?? jobs.find(j=>j.output.itemId===base(id))?.name ?? `物品 ${id}`;
  const distance = (a,b) => Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
  const levels = p => Object.fromEntries(data.skills.map(s=>[s,level(p.skills[s])]));
  // Crafting is explicitly common rarity; do not count rare materials as common ones.
  const count = (p,id) => id===data.coinId ? p.coins :
    (p.bank[id]??0)+p.pack.filter(i=>i.itemId===id).reduce((n,i)=>n+i.qty,0);
  const held = p => [...new Set([...Object.keys(p.bank).filter(id=>p.bank[id]>0).map(Number),
    ...p.pack.map(i=>i.itemId), ...Object.values(p.equipment).filter(Number.isFinite)])];
  const nearBank = p => banks.some(b=>distance(p,b)<=1);
  const nearestBank = p => [...banks].sort((a,b)=>distance(p,a)-distance(p,b))[0];
  const gearRequirement = id => {
    const g=gear.get(base(id));
    return {skill:g.needs??data.toolSkills[g.slot]??'none',
      level:g.levelReq??jobs.find(j=>j.output.itemId===base(id))?.levelReq??1};
  };
  function gearScore(id,style) {
    const g=equipmentStats(id);
    if (!g) return 0;
    if (g.bonus) return g.bonus;
    const same=!g.style||g.style===style;
    if (g.slot==='weapon') return (g.accuracy+2*g.strength)/(g.speed??4)*(g.twoHanded?1.3:1);
    return (same?1:-1)*(g.accuracy+2*g.strength)+g.defence*.5+(g.luck??0);
  }
  const action = (intent,label,reason='') => ({intent,label,reason});
  const wait = reason => ({intent:null,label:'等待当前任务',reason});
  const blocked = reason => ({intent:null,label:'需要处理',reason,blocked:true});
  function itemTargetChoices() {
    const choices=new Map();
    const add=(itemId,skill,levelReq,source)=>{
      if(itemId===data.coinId||!data.items[itemId]||choices.has(itemId))return;
      choices.set(itemId,{itemId,name:name(itemId),skill,levelReq,source});
    };
    for(const job of [...jobs].sort((a,b)=>a.levelReq-b.levelReq))
      if(sites.some(s=>s.jobIds.includes(job.id)))add(job.output.itemId,job.skill,job.levelReq,job.grow?'种植':'制作／采集');
    for(const job of jobs)if(job.bonus?.chance>0&&sites.some(s=>s.jobIds.includes(job.id)))
      add(job.bonus.itemId,job.skill,job.levelReq,'采集副产');
    for(const monster of monsters)if(zones.some(z=>z.monsterId===monster.id)) {
      if((monster.dropChance??1)>0)add(monster.drop,null,1,'怪物掉落');
      if(monster.bonus?.chance>0)add(monster.bonus.itemId,null,1,'怪物副产');
    }
    add(data.shardId,null,1,'战斗掉落');add(190,'farming',1,'商人种子');
    return [...choices.values()];
  }
  function planItemTarget(p,goal,profession='magic',completedLoad=false) {
    const id=goal?.targetItemId??goal?.itemId,qty=goal?.qty??goal?.required;
    const choice=itemTargetChoices().find(item=>item.itemId===id);
    if(!choice||!Number.isSafeInteger(qty)||qty<1)return blocked('目标物品或数量无效，请重新设置物品目标');
    Object.assign(goal,{itemTarget:true,targetItemId:id,qty,skill:choice.skill??professionSkill(profession),target:Infinity});
    goal.budget??={coins:0,items:{}};goal.budget.items??={};
    goal.budget.items[id]=Math.max(goal.budget.items[id]??0,qty);
    const owned=count(p,id)+(p.overflow?.[id]??0)+Object.values(p.equipment).filter(item=>item===id).length+(goal.listedQty??0);
    if(owned>=qty)return {...wait(`已备齐 ${name(id)}：${owned}/${qty}`),completed:true,goal};
    const current=jobs.find(job=>job.id===p.route?.jobId);
    const consuming=current?.inputs.some(input=>input.itemId===id);
    const eating=data.items[id]?.heals&&p.route?.zoneId!=null&&(p.foodItemId===id||
      p.pack.some(item=>item.itemId===id&&item.qty>0)||!(p.foodItemId>0)&&count(p,id)>0);
    if(consuming||eating)return {...action({t:'clearRoute'},'停止消耗目标物品的旧任务',
      `先保护 ${name(id)} 库存，再继续本次物品目标`),goal};
    const reason=!completedLoad&&finishTaskReason(data,p);
    if(reason)return {...wait(reason),goal};
    return planTask(p,goal,profession);
  }
  const bankAction = (p,intent,label) => nearBank(p) ? action(intent,label) :
    action({t:'walk',...nearestBank(p).approach},'前往仓库',label);
  function gatheringDeparture(p,job) {
    if(!['mining','fishing','woodcutting'].includes(job.skill)||job.inputs.length||data.items[job.output.itemId]?.stackable)return null;
    // Native setRoute only checks whether one more output fits, not whether old cargo was banked.
    const cargo=p.pack.some(i=>i.qty>0&&(nearBank(p)||
      base(i.itemId)!==job.output.itemId&&!data.items[base(i.itemId)]?.stackable));
    if(!cargo)return null;
    if(nearBank(p)&&(p.route||p.path?.length))return action({t:'clearRoute'},'采集出发前整理背包','先停止旧路线，再把旧物资存仓');
    return bankAction(p,{t:'deposit'},'采集出发前存仓，腾出整包空间');
  }
  function carriedBatch(p,job) {
    const stacks=job.inputs.filter(i=>data.items[i.itemId]?.stackable).length;
    const units=job.inputs.reduce((n,i)=>n+(data.items[i.itemId]?.stackable?0:i.qty),0);
    const outputStack=!!data.items[job.output.itemId]?.stackable;
    const room=28+(p.perks?.pockets??0)-stacks-Number(outputStack);
    return Math.max(1,units?Math.floor(room/units):outputStack?50:room);
  }
  function productionDeparture(p,job,limit) {
    if(!job.inputs.length||job.grow)return null;
    const carried=Math.min(...job.inputs.map(i=>Math.floor(p.pack.filter(v=>v.itemId===i.itemId)
      .reduce((n,v)=>n+v.qty,0)/i.qty)));
    // Native route startup skips loading when the pack holds even one recipe.
    // Bank a partial leftover load so the native loader takes a complete trip.
    const available=Math.min(...job.inputs.map(i=>Math.floor(count(p,i.itemId)/i.qty)));
    const desired=Math.min(limit||Infinity,carriedBatch(p,job),available);
    if(carried<1||carried>=desired)return null;
    if(nearBank(p)&&(p.route||p.path?.length))return action({t:'clearRoute'},'制作出发前准备整批原料','先停止旧路线，存回零散原料后按背包容量取料');
    return bankAction(p,{t:'deposit'},'存回零散原料，再整批取料制作');
  }
  const farmFields = p => sites.filter(s=>s.kind==='field').sort((a,b)=>a.id-b.id)
    .slice(0,data.farmUnlocks.filter(n=>level(p.skills.farming)>=n).length);
  function farmPlots(p) {
    return farmFields(p).flatMap(site=>{
      const plot=p.plots?.[site.id];
      const job=plot&&jobs.find(j=>j.grow&&j.inputs[0].itemId===base(plot.seedItemId));
      if (!job) return [];
      const duration=Math.round(job.grow/(plot.sowSpeed??1));
      const water=data.farmWaterTrim;
      const trim=plot.trim??Math.min(plot.watered??0,Math.floor(job.grow/2/water))*water;
      return [{site,job,readyAt:plot.plantedAt+duration-Math.min(trim,Math.floor(duration/2))}];
    });
  }
  const hasSeed = (p,job) => held(p).some(id=>base(id)===job.inputs[0].itemId&&count(p,id)>0);
  const seedCount = (p,job) => held(p).filter(id=>base(id)===job.inputs[0].itemId).reduce((n,id)=>n+count(p,id),0)+
    Object.entries(p.overflow??{}).filter(([id])=>base(+id)===job.inputs[0].itemId).reduce((n,[,qty])=>n+qty,0);
  let farmingChoice={mode:'auto',jobId:null};
  const farmingPreference=()=>({...farmingChoice});
  function setFarmingPreference(value) {
    const mode=value?.mode==='manual'?'manual':'auto';
    const jobId=jobs.find(j=>j.grow&&j.id===value?.jobId)?.id??null;
    if(mode!==farmingChoice.mode||jobId!==farmingChoice.jobId) {
      farmSearch=null;farmRetryAt=0;farmDelayReason=null;farmTarget=null;farmTargetReason=null;farmQuote=null;
    }
    farmingChoice={mode,jobId};
    return farmingPreference();
  }
  const manualFarmJob=()=>farmingChoice.mode==='manual'?jobs.find(j=>j.grow&&j.id===farmingChoice.jobId):null;
  const allowedCrop=job=>farmingChoice.mode!=='manual'||job.id===farmingChoice.jobId;
  function manualFarmReason(p) {
    if(farmingChoice.mode!=='manual')return null;
    const job=manualFarmJob();
    if(!job)return '手动农业尚未选择有效作物，先继续其他任务';
    if(level(p.skills.farming)<job.levelReq)return `手动选择 ${job.name} 需要农业 ${job.levelReq} 级（当前 ${level(p.skills.farming)}），先继续其他任务`;
    return null;
  }
  function waitForFarmBatch(p) {
    const growing=farmPlots(p).filter(f=>f.readyAt>p.lastTick);
    if (!growing.length) return null;
    const readyAt=Math.max(...growing.map(f=>f.readyAt));
    return {...wait(`等全部成熟后一起收菜，最晚约 ${Math.ceil((readyAt-p.lastTick)*data.tickMs/1000)} 秒；先练其他技能`),
      label:'等待整批作物成熟',deferUntilTick:readyAt};
  }
  const farmErrand = (p,job,site) => ({...action(
    {t:'setRoute',siteId:site.id,jobId:job.id,onFull:'bank',limit:0,errand:true},
    `收获并补种 · ${job.name}`,'播种／收获后继续主任务，生长期间练其他技能'),farmJobId:job.id});
  function harvestOnly(p) {
    farmState(p);
    farmDelayReason=manualFarmReason(p);
    if(farmDelayReason)return null;
    if(p.route?.errand||p.enhance||p.held||!p.route&&(p.path?.length||p.activity==='walking'))return null;
    const plots=farmPlots(p);
    if(plots.some(f=>f.readyAt>p.lastTick))return null;
    const eligible=jobs.filter(j=>j.grow&&allowedCrop(j)&&level(p.skills.farming)>=j.levelReq&&
      (hasSeed(p,j)||plots.some(f=>f.job.id===j.id)||farmingChoice.mode==='manual'&&plots.length)).sort((a,b)=>b.xp/b.grow-a.xp/a.grow);
    const job=eligible[0];
    if(!job) {
      if(farmingChoice.mode==='manual')farmDelayReason=`缺少所选 ${manualFarmJob().name} 种子；辅助模式不采购或采种，继续原任务`;
      return null;
    }
    const site=plots.find(f=>f.job.id===job.id)?.site??plots[0]?.site??farmFields(p).find(s=>!p.plots?.[s.id]);
    if(!site)return null;
    // The native unlimited errand banks the harvest and restores route.after;
    // a finite harvest limit would stop before restoring the saved route.
    return {...farmErrand(p,job,site),reason:'整批收获并用已有种子补种；由游戏保留原任务剩余数量，完成后继续玩家队列'};
  }
  let farmSearch=null,farmPlayerId=null,farmRetryAt=0,farmDelayReason=null,farmTarget=null,farmTargetReason=null,farmQuote=null;
  function farmState(p) {
    if (farmPlayerId===p.id) return;
    farmPlayerId=p.id;farmSearch=null;farmRetryAt=0;farmDelayReason=null;farmTarget=null;farmTargetReason=null;farmQuote=null;
  }
  function harvest(p,preferredJobId,goal=null,style='magic',completedLoad=false) {
    farmState(p);
    farmDelayReason=manualFarmReason(p);
    if(farmDelayReason)return null;
    if (p.route?.errand) return null;
    const plots=farmPlots(p), ready=plots.filter(f=>f.readyAt<=p.lastTick)
      .sort((a,b)=>a.readyAt-b.readyAt);
    const fields=farmFields(p),empty=fields.filter(s=>!p.plots?.[s.id]);
    const eligible=jobs.filter(j=>j.grow&&allowedCrop(j)&&level(p.skills.farming)>=j.levelReq);
    const demanded=j=>(goal?.budget?.items?.[j.output.itemId]??0)>count(p,j.output.itemId);
    const rank=(a,b)=>Number(demanded(b))-Number(demanded(a))||b.xp/b.grow-a.xp/a.grow||
      Number(b.id===preferredJobId)-Number(a.id===preferredJobId);
    const crops=eligible.sort(rank);
    // Native errands harvest every ripe plot, then sow only the route's crop.
    // A selected crop without seeds can therefore collect the old batch safely.
    const selected=crops[0]??manualFarmJob();
    farmTarget=selected;
    if(!selected)return null;
    farmTargetReason=demanded(selected)?`补充当前计划所需原料 ${name(selected.output.itemId)}`:'按已解锁作物的农业经验收益选择';
    const seedSlots=empty.length+ready.filter(f=>f.job.id!==selected.id).length;
    const seedNeed=Math.max(0,(seedSlots||(!empty.length&&!ready.length?plots.filter(f=>f.job.id!==selected.id).length:0))*
      selected.inputs[0].qty-seedCount(p,selected));
    if(farmQuote&&(farmQuote.jobId!==selected.id||!seedNeed))farmQuote=null;
    const urgentHarvest=ready.some(f=>demanded(f.job));
    const farmingRequired=level(p.skills.farming)<(goal?.farmingTarget??0);
    const naturalBreak=completedLoad||!p.route||p.route.phase==='toBank';
    // An unlimited route still gets a chance to collect a worthwhile full batch.
    const fullBatchDue=!p.route?.limit&&plots.length&&ready.length===plots.length&&
      p.lastTick-ready[0].readyAt>=600000/data.tickMs;
    const deferFarm=reason=>{farmDelayReason=reason;return null;};
    const waitingBatch=waitForFarmBatch(p);
    let foregroundRate=goal?.rate?.xp;
    if (foregroundRate==null) {
      const job=jobs.find(j=>j.id===p.route?.jobId&&!j.grow);
      const current=job?strategy.estimateWork(p,job):p.route?.zoneId!=null?
        strategy.combatOptions(p,style).find(c=>c.zone.id===p.route.zoneId):null;
      foregroundRate=current?current.xp/current.seconds:Math.max(0,...jobs.filter(j=>!j.grow&&!j.inputs.length&&
        level(p.skills[j.skill])>=j.levelReq).map(j=>{const e=strategy.estimateWork(p,j);return e.xp/e.seconds;}));
    }
    if (farmSearch&&(farmSearch.job.id!==selected.id||!seedNeed)) farmSearch=null;
    if (farmSearch&&p.lastTick-farmSearch.started>farmSearch.maxTicks) {
      farmRetryAt=p.lastTick+Math.min(farmSearch.job.grow,600000/data.tickMs);farmSearch=null;farmQuote=null;
    }
    if(!completedLoad&&!urgentHarvest&&finishTaskReason(data,p))
      return deferFarm('先完成当前采集背包或制作批次，再合并收菜、补种及采种准备');
    // Reserve enough independent seeds for this whole planting/replacement
    // batch; mature plots of the chosen crop return their own seed.
    const owned=eligible.filter(j=>j.id===selected.id&&hasSeed(p,j)&&!seedNeed);
    // Native sowing errands also collect ripe fields, so a partial harvest
    // must wait. With no ripe fields, spare seeds can fill empty land without
    // touching the crops that are still growing.
    if (waitingBatch&&ready.length) return deferFarm(waitingBatch.reason);
    if (empty.length&&owned.length&&!ready.length) {
      if (!urgentHarvest&&!naturalBreak&&!fullBatchDue)
        return deferFarm('已有种子，等当前任务结束或返仓时合并收菜、补种');
      return farmErrand(p,owned[0],empty[0]);
    }
    if (ready.length&&(urgentHarvest||farmingChoice.mode==='manual'||!seedNeed)) {
      const expand=empty.length&&hasSeed(p,selected);
      const errand=farmErrand(p,selected,expand?empty[0]:ready[0].site);
      const collected=ready;
      const tick=data.tickMs/1000,readyXp=collected.reduce((n,f)=>n+f.job.xp*
        (data.rarityXp[rarity(p.plots[f.site.id].seedItemId)]??1),0);
      // Native farming may fetch seeds first, visits several fields, banks the
      // harvest, then resumes the original site/zone. Geometry is an estimate.
      const bankAt=point=>banks.find(b=>b.id===p.homeBank)??nearestBank(point);
      let position=p,steps=0;
      const travel=target=>{steps+=distance(position,target);position=target;};
      if (!p.pack.some(i=>base(i.itemId)===selected.inputs[0].itemId&&i.qty>0)) travel(bankAt(p).approach);
      travel(sites.find(s=>s.id===errand.intent.siteId));
      const remaining=collected.filter(f=>f.site.id!==errand.intent.siteId);
      while (remaining.length) {
        remaining.sort((a,b)=>distance(position,a.site)-distance(position,b.site));
        travel(remaining.shift().site);
      }
      travel(bankAt(position).approach);
      travel(sites.find(s=>s.id===p.route?.siteId)??zones.find(z=>z.id===p.route?.zoneId)??p);
      const trip=(steps+(collected.length+(expand?1:0))*4)*tick;
      if (!urgentHarvest&&!naturalBreak&&!fullBatchDue)
        return deferFarm('作物已成熟，等当前任务结束或返仓时合并收菜');
      // Credit a real crop upgrade over the same foreground planning horizon.
      let upgradeSeeds=held(p).filter(id=>base(id)===selected.inputs[0].itemId).reduce((n,id)=>n+count(p,id),0);
      const horizon=Math.min(goal?.horizon??strategy.horizon,strategy.horizon)/tick;
      // Conservatively credit only the first empty field.
      const expansionXp=expand&&upgradeSeeds>=selected.inputs[0].qty?selected.xp/selected.grow*horizon:0;
      if (expansionXp) upgradeSeeds-=selected.inputs[0].qty;
      const upgradeXp=collected.reduce((n,f)=>{
        const gain=selected.xp/selected.grow-f.job.xp/f.job.grow;
        if (gain<=0||upgradeSeeds<selected.inputs[0].qty) return n;
        upgradeSeeds-=selected.inputs[0].qty;
        return n+gain*horizon;
      },0);
      if (!urgentHarvest&&!farmingRequired&&readyXp+upgradeXp+expansionXp<foregroundRate*trip) {
        farmDelayReason=`收菜往返约 ${Math.ceil(trip)} 秒，当前收益不足；等顺路或合批`;
        // Keep crop upgrades attainable even when old crops are not worth a trip.
        if (!naturalBreak) return null;
      } else return {...errand,reason:`合批收获 ${collected.length} 块；预计往返及农活约 ${Math.ceil(trip)} 秒，完成后继续主任务`};
    }
    const catchUp=goal&&data.skills.includes(goal.skill)&&(goal.growth||goal.quest)&&level(p.skills[goal.skill])<level(p.skills.farming);
    if(seedNeed&&farmingChoice.mode==='auto'&&catchUp&&!empty.length&&ready.length<plots.length&&!demanded(selected))
      return deferFarm('作物仍在生长，先推进当前主任务及其原料需求；整批成熟后再准备作物升级');
    const sage=selected.inputs[0].itemId===190?selected:null;
    const seedPrice=data.items[190].value*4;
    const seedQty=Math.min(seedNeed,Math.floor((p.coins-Math.max(0,goal?.budget?.coins??0))/seedPrice));
    if(naturalBreak&&sage&&seedQty>0) {
      if(nearBank(p)&&(p.route||p.path?.length))return {
        ...action({t:'clearRoute'},'补种子前停止旧路线','在已完成背包的边界确认停下，再按整批缺口补种子'),farmJobId:sage.id};
      return {...bankAction(p,{t:'vendorBuy',itemId:190,qty:seedQty},`补 ${seedQty} 颗鼠尾草种子`),
        farmJobId:sage.id,reason:`本批尚缺 ${seedNeed} 颗种子；保留当前计划金币，按商人单价 ${seedPrice} 购买 ${seedQty} 颗`};
    }
    if(seedNeed&&naturalBreak&&p.lastTick>=farmRetryAt) {
      const purchase=api.marketPurchase?.(p,selected.inputs[0].itemId,seedNeed,
        {...goal,rate:{...goal?.rate,xp:foregroundRate}},style);
      if(purchase?.marketWaiting) {
        farmQuote??={jobId:selected.id,started:p.lastTick};
        farmDelayReason=`${selected.name} 本批尚缺 ${seedNeed} 颗种子；市场比价最多等待 4 秒，然后继续采种或主任务`;
        if((p.lastTick-farmQuote.started)*data.tickMs<4000)return {...purchase,farmJobId:selected.id,reason:farmDelayReason};
      } else if(purchase?.intent)return {...purchase,farmJobId:selected.id};
    }
    if (p.lastTick>=farmRetryAt) {
      // These bounded investments deliberately make long-term farm progress
      // even when a short foreground XP window would always reject them.
      const unlocked=j=>level(p.skills[j.skill])>=j.levelReq;
      const seedTime=j=>strategy.estimateWork(p,j).seconds/j.bonus.chance;
      const missing=eligible.filter(j=>j.id===selected.id&&seedNeed>0&&
        (empty.length||plots.some(f=>f.job.id!==j.id)))
        .flatMap(job=>{
          const source=jobs.filter(j=>j.bonus?.itemId===job.inputs[0].itemId)
            .sort((a,b)=>Number(unlocked(b))-Number(unlocked(a))||a.levelReq-b.levelReq||seedTime(a)-seedTime(b))[0];
          return source?[{job,source}]:[];
        }).sort((a,b)=>Number(unlocked(b.source))-Number(unlocked(a.source))||
          (empty.length?seedTime(a.source)-seedTime(b.source):
            unlocked(a.source)?rank(a.job,b.job):a.source.levelReq-b.source.levelReq||rank(a.job,b.job)));
      const expansion=empty.length>0;
      if (farmSearch&&(farmSearch.expansion!==expansion||farmSearch.style!==style||
        !missing.some(c=>c.job.id===farmSearch.job.id))) farmSearch=null;
      if (!farmSearch&&missing.length) {
        if (!naturalBreak) return deferFarm('等当前任务结束或返仓，再准备农业种子');
        farmSearch={...missing[0],expansion,style,started:p.lastTick,
          maxTicks:Math.ceil(Math.min(600,goal?.horizon??strategy.horizon)*1000/data.tickMs)};
      }
      if (farmSearch) {
        const {job,source}=farmSearch;
        farmSearch.needed=seedNeed;
        if (!unlocked(source)) {
          farmSearch.goal??={skill:source.skill,target:source.levelReq,horizon:600};
          const result=plan(p,farmSearch.goal,style);
          if (result.blocked||result.deferUntilTick) {
            farmRetryAt=p.lastTick+Math.min(job.grow,600000/data.tickMs);farmSearch=null;
          } else return {...result,farmJobId:job.id,
            reason:`解锁 ${job.name} 的自采种子：先练${NAMES[source.skill]}至 ${source.levelReq} 级；${result.reason||result.label}`};
        } else {
          const site=sites.filter(s=>s.jobIds.includes(source.id)).sort((a,b)=>distance(p,a)-distance(p,b))[0];
          if (site) {
            if (naturalBreak&&(goal?goal.growth:!!api.growthChooseGoal)) {
              farmSearch.toolGoal??={skill:source.skill,target:level(p.skills[source.skill])+1,
                horizon:600,growth:true,toolOnly:true};
              const improvement=plan(p,farmSearch.toolGoal,style);
              if (improvement) return {...improvement,farmJobId:job.id,
                reason:`准备采种工具 · ${NAMES[source.skill]}：${improvement.reason||improvement.label}`};
            }
            if (p.route?.jobId===source.id) return {...wait(`继续自采 ${job.name} 种子，本批尚缺 ${seedNeed} 颗，备齐后补种／换种`),farmJobId:job.id};
            const departure=gatheringDeparture(p,source);
            if(departure)return {...departure,farmJobId:job.id};
            return {...action({t:'setRoute',jobId:source.id,siteId:site.id,onFull:'bank',limit:0,rarity:0},
              `为${expansion?'空田':'升级作物'}补种子 · ${job.name}`,`从 ${source.name} 自采；本轮最多 ${Math.ceil(farmSearch.maxTicks*data.tickMs/60000)} 分钟，超时先继续其他任务`),farmJobId:job.id};
          }
        }
      }
    }
    const missingSource=!jobs.some(j=>j.bonus?.itemId===selected.inputs[0].itemId);
    if(seedNeed&&(missingSource||p.lastTick<farmRetryAt)) {
      if(missingSource&&naturalBreak&&p.lastTick>=farmRetryAt) {
        farmRetryAt=p.lastTick+Math.min(selected.grow,600000/data.tickMs);farmQuote=null;
      }
      farmDelayReason=`${selected.name} 本批尚缺 ${seedNeed} 颗种子；`+
        (!missingSource?'本轮采种／解锁准备已达时间预算或暂不可行，先继续主任务，稍后重试':
          sage?'保留当前计划金币，等待可负担的商人或市场采购':'市场暂未购得，未找到已核实的自采来源');
      if(farmingChoice.mode==='auto'&&naturalBreak&&(empty.length||ready.length)) {
        const neededGrowth=Math.min(Infinity,...plots.filter(f=>f.readyAt>p.lastTick&&demanded(f.job)).map(f=>f.job.grow));
        const temporary=eligible.find(j=>(hasSeed(p,j)||ready.some(f=>f.job.id===j.id))&&
          (demanded(j)||j.grow<=neededGrowth));
        if(temporary) {
          farmDelayReason+=`；临时种植 ${temporary.name}，继续补齐目标 ${selected.name} 种子`;
          return {...farmErrand(p,temporary,empty[0]??ready[0].site),reason:farmDelayReason};
        }
      }
    }
    return null;
  }
  const trainedSkills = (style='magic') => data.skills.filter(s=>!attacks.includes(s)||s===professionSkill(style));
  const balancedChooseGoal = (p,served={},deferred={},style='magic') => {
    const lv = levels(p);
    const eligible=trainedSkills(style).filter(s=>!['defence','hitpoints'].includes(s)&&!deferred[s]);
    if (!eligible.length) return null;
    const stage = Math.min(thresholds.length-1, (Math.floor(Math.min(...eligible.map(s=>lv[s]))/5)+1)*5);
    const candidates = eligible.filter(s=>lv[s]<stage);
    candidates.sort((a,b)=>lv[a]-lv[b] || (served[a]??0)-(served[b]??0) || data.skills.indexOf(a)-data.skills.indexOf(b));
    const skill = candidates[0];
    return skill ? {skill,target:Math.min(stage,lv[skill]+1),stage} : null;
  };

  function plan(p, goal, profession='magic') {
    if (!goal||goal.toolOnly) return planTask(p,goal,profession);
    function prepareTool() {
      const result=planTask(p,goal.toolUpgrade,profession);
      if (!result||result.blocked||result.deferUntilTick) {delete goal.toolUpgrade;return null;}
      return {...result,goal,investmentGoal:goal,
        reason:`供料工具 · ${NAMES[goal.toolUpgrade.skill]}：${result.reason||result.label}`};
    }
    if (goal.toolUpgrade) {
      const result=prepareTool();
      if (result) return result;
    }
    const result=planTask(p,goal,profession);
    const job=result?.intent?.t==='setRoute'&&jobs.find(j=>j.id===result.intent.jobId);
    // Supply jobs used to skip all tool checks to prevent recursive upgrades.
    // Prepare one tool independently, then resume the original material plan.
    if (job&&!goal.upgrade?.priority&&!job.grow&&job.skill!==goal.skill&&Object.values(data.toolSkills).includes(job.skill)) {
      goal.toolUpgrade={skill:job.skill,target:level(p.skills[job.skill])+1,toolOnly:true,
        growth:goal.growth,horizon:goal.horizon,specialization:goal.specialization,
        startedTick:goal.startedTick,skipUpgrade:goal.skipUpgrade,budget:{coins:goal.budget?.coins??0,items:{}}};
      const improvement=prepareTool();
      if (improvement) return improvement;
    }
    return result;
  }
  function planTask(p, goal, profession='magic') {
    const style=professionSkill(profession);
    const lv = levels(p);
    let completedUpgrade=false;
    const unlocked = j => lv[j.skill]>=j.levelReq;
    const made = id => jobs.filter(j=>j.output.itemId===id);
    const atGoal = (skill,target) => lv[skill]>=target;
    const combatStyle = () => {
      const weapon = gear.get(base(p.equipment.weapon??0));
      return weapon?.magic ? 'magic' : weapon?.ranged ? 'ranged' : 'melee';
    };
    const canWear = id => {
      const g = gear.get(base(id));
      if (!g) return false;
      const requirement=gearRequirement(id);
      return requirement.skill==='none'||lv[requirement.skill]>=requirement.level;
    };
    function siteFor(job) {
      let choices = sites.filter(s=>s.jobIds.includes(job.id));
      if (job.grow) {
        const allowed = farmFields(p).map(s=>s.id);
        choices = choices.filter(s=>allowed.includes(s.id));
      }
      return choices.sort((a,b)=>distance(p,a)-distance(p,b))[0];
    }
    // Include failures, common-material yields and owned tools. Walking, house,
    // potion and mastery effects still make this a base-rate estimate.
    function jobEstimate(job) {
      return strategy.estimateWork(p,job,lv);
    }
    function cost(id, trail=[]) {
      if (trail.includes(id)) return Infinity;
      const producers = made(id).filter(unlocked);
      if (producers.length) return Math.min(...producers.map(j => {
        if(j.grow) {
          if(!allowedCrop(j)&&!farmPlots(p).some(f=>f.job.id===j.id))return Infinity;
          const seed=hasSeed(p,j)||Object.values(p.plots??{}).some(plot=>base(plot.seedItemId)===j.inputs[0].itemId);
          return (jobTime(j)+(seed?0:cost(j.inputs[0].itemId,[...trail,id])))/(4+lv.farming/100);
        }
        return (jobEstimate(j).seconds+j.inputs.reduce((sum,i)=>sum+i.qty*cost(i.itemId,[...trail,id]),0))/jobEstimate(j).commonOutput;
      }));
      if (monsters.some(m=>m.drop===id)) return 60;
      const bonuses = jobs.filter(j=>unlocked(j)&&j.bonus?.itemId===id);
      return bonuses.length ? Math.min(...bonuses.map(j=>jobTime(j)/j.bonus.chance)) : 3600;
    }
    function jobTime(job) {
      const e=jobEstimate(job);
      return e.seconds/e.success + (job.grow??0)/Math.max(1,data.farmUnlocks.filter(n=>lv.farming>=n).length)*data.tickMs/1000;
    }
    function batch(job, amount, trail=[]) {
      const site = siteFor(job);
      if (!site) return blocked(`${job.name} 没有可用地点`);
      if (job.grow) {
        if (p.route?.errand) return wait('完成本次收获补种后返回原任务');
        const manualReason=manualFarmReason(p);
        if(manualReason)return blocked(manualReason);
        const existing=farmPlots(p).some(f=>f.job.id===job.id);
        if(!allowedCrop(job)&&!existing)
          return blocked(`手动农业选择 ${manualFarmJob()?.name??'尚未设置'}，不会为 ${job.name} 改种；暂缓此目标，先继续其他任务`);
        const waitingBatch=waitForFarmBatch(p);
        if (waitingBatch&&(hasSeed(p,job)||existing))
          return {...waitingBatch,farmJobId:job.id};
        if(farmingChoice.mode==='manual') {
          if(!allowedCrop(job))return farmErrand(p,manualFarmJob(),farmPlots(p).find(f=>f.job.id===job.id).site);
          const result=harvest(p,job.id,{...goal,rate:{xp:0}},profession);
          return result??(waitingBatch?{...waitingBatch,farmJobId:job.id}:blocked(farmStatus(p).reason));
        }
      } else if (p.route?.jobId===job.id && p.route.zoneId==null) {
        if(goal.itemTarget&&job.output.itemId===goal.targetItemId&&p.route.limit==null)
          return action({t:'clearRoute'},'切换为目标所需数量','停止原无限路线后，按尚缺成品数量继续');
        return wait(`继续 ${job.name}`);
      }
      if (!trail.length) {
        const improvement=upgrade(job.skill);
        if (improvement) return improvement;
      }
      let quantity = Math.max(1,Math.min(50,Math.ceil(amount)));
      if (['mining','fishing','woodcutting'].includes(job.skill)&&!job.inputs.length&&!data.items[job.output.itemId]?.stackable) {
        const departure=gatheringDeparture(p,job);
        if(departure)return departure;
        const used=p.pack.reduce((n,i)=>n+(data.items[base(i.itemId)]?.stackable?1:i.qty),0);
        if(!goal.itemTarget||job.output.itemId!==goal.targetItemId)
          quantity=Math.min(50,Math.max(quantity,Math.ceil((28+(p.perks?.pockets??0)-used)/job.output.qty)));
      }
      const materialBatch = job.grow ? 1 : quantity;
      for (const ingredient of job.inputs) {
        if (job.grow && (held(p).some(id=>base(id)===ingredient.itemId&&count(p,id)>0) ||
          Object.values(p.plots??{}).some(plot=>base(plot.seedItemId)===ingredient.itemId))) continue;
        const needed = ingredient.qty*materialBatch;
        if (count(p,ingredient.itemId)<needed) {
          return need(ingredient.itemId,needed,trail);
        }
      }
      if (job.grow) return farmErrand(p,job,site);
      const exact=goal.quest?.jobId===job.id||goal.upgrade&&job.output.itemId===base(goal.upgrade.id)||
        goal.itemTarget&&job.output.itemId===goal.targetItemId;
      const limit=exact?quantity:0,departure=productionDeparture(p,job,limit);
      if(departure)return departure;
      return action({t:'setRoute',siteId:site.id,jobId:job.id,onFull:'bank',limit,rarity:0},
        job.name,exact?`为${NAMES[goal.skill]}完成指定物品；${quantity} 次`:
          `为${NAMES[goal.skill]}供料／练级；无限工作，按实际等级与材料在满包／原料批次结束时调整`);
    }
    function train(skill,target,trail=[]) {
      if (atGoal(skill,target)&&!(goal.manualTrade&&!goal.quest&&skill===goal.mainSkill)) return wait(`${NAMES[skill]}已达到 ${target} 级`);
      if(skill==='farming')goal.farmingTarget=Math.max(goal.farmingTarget??0,target);
      if(skill==='farming'&&manualFarmReason(p))return blocked(manualFarmReason(p));
      if (attacks.includes(skill)) return fight(skill);
      if (skill==='defence'||skill==='hitpoints') return fight(style);
      if (skill==='enhancing') return enhance();
      const prepareBatch=(goal.growth||goal.manualTrade||goal.batch>0)&&!goal.quest&&!goal.upgrade&&skill===goal.skill&&!trail.length;
      const fixed=skill===goal.mainSkill&&!trail.length?goal.fixedRecipeId:null;
      const batchLimits=new Map();
      function trainingLimit(job) {
        if(!prepareBatch||job.grow)return 50;
        if(batchLimits.has(job.id))return batchLimits.get(job.id);
        // A short recipe funded by owned gems must not become a long hunt for
        // random bonus drops when the leveling batch is enlarged. Intermediate
        // ingredients count too: two rough gems can fund two cut gems.
        const funded=amount=>{
          const stock={};
          function supply(id,quantity,seen=[]) {
            stock[id]??=count(p,id);
            const used=Math.min(quantity,stock[id]);stock[id]-=used;
            const missing=quantity-used;
            if(missing<=0||id===data.coinId)return true;
            if(seen.includes(id))return false;
            const source=made(id).find(unlocked)??made(id)[0];
            if(source?.grow)return true;
            if(source)return source.inputs.every(i=>supply(i.itemId,i.qty*Math.ceil(missing/source.output.qty),[...seen,id]));
            if(monsters.some(m=>m.drop===id))return true;
            return !jobs.some(j=>j.bonus?.itemId===id)&&!monsters.some(m=>m.bonus?.itemId===id);
          }
          return job.inputs.every(i=>supply(i.itemId,i.qty*amount));
        };
        let low=0,high=50;
        while(low<high) {
          const middle=Math.ceil((low+high)/2);
          if(funded(middle))low=middle;else high=middle-1;
        }
        batchLimits.set(job.id,low);return low;
      }
      const choices = jobs.filter(j=>j.skill===skill && (fixed==null||j.id===fixed) && (!j.grow||allowedCrop(j)) && unlocked(j) && siteFor(j)&&(fixed!=null||trainingLimit(j)>0));
      const neededXp = Math.max(1,thresholds[target]-p.skills[skill]);
      const score = j => {
        const e=jobEstimate(j),n = Math.min(20,Math.ceil(neededXp/(j.grow?j.xp:e.xp)));
        const ingredients = j.inputs.reduce((sum,i)=>sum+Math.max(0,i.qty*n-count(p,i.itemId))*cost(i.itemId,trail),0);
        const travel = distance(p,siteFor(j))*data.tickMs/1000;
        return (j.grow?j.xp:e.xp)*n/((j.grow?jobTime(j):e.seconds)*n+ingredients+travel);
      };
      choices.sort((a,b)=>score(b)-score(a)||a.id-b.id);
      if (!choices.length) return blocked(fixed!=null?`固定工作 ${jobs.find(j=>j.id===fixed)?.name} 缺少可持续准备的材料，等待材料或采购条件`:`${NAMES[skill]}没有已解锁任务`);
      goal.recipes ??= {};
      goal.recipeLevels??={};
      const preparation=prepareBatch?goal.craftPreparation:null;
      const prepared=choices.find(j=>j.id===preparation?.jobId);
      const cached=choices.find(j=>j.id===goal.recipes[skill]);
      const changed=goal.recipeLevels[skill]!=null&&goal.recipeLevels[skill]!==lv[skill];
      const job=prepared??(changed&&!goal.specialization?choices[0]:(cached??choices[0]));
      goal.recipeLevels[skill]=lv[skill];
      goal.recipes[skill]=job.id;
      let amount=goal.recipeId===job.id?Math.min(goal.batch??50,Math.ceil(neededXp/jobEstimate(job).xp)):
        Math.ceil(neededXp/(job.grow?job.xp:jobEstimate(job).xp));
      if(goal.specialization&&!goal.quest&&skill===goal.mainSkill&&!trail.length)amount=goal.batch??50;
      if(prepared)amount=preparation.amount;
      else if(prepareBatch&&job.inputs.length&&!job.grow) {
        const available=job.inputs.map(i=>Math.floor(count(p,i.itemId)/i.qty));
        if(available.every(n=>n>0)) amount=Math.min(amount,...available);
        else amount=Math.min(amount,Math.ceil((thresholds[lv[skill]+1]-p.skills[skill])/jobEstimate(job).xp),
          ...available.filter(n=>n>0));
        // Stackable products also need a useful supply batch; a few leftover
        // herbs must not turn every monster-material trip into two potions.
        if(!available.every(n=>n>0)&&(data.items[job.output.itemId]?.stackable||job.inputs.some(i=>!data.items[i.itemId]?.stackable))) {
          const load=carriedBatch(p,job);
          const useful=data.items[job.output.itemId]?.stackable?Math.min(load,
            Math.ceil((thresholds[lv[skill]+1]-thresholds[lv[skill]])/jobEstimate(job).xp)):load;
          amount=Math.max(amount,useful);
        }
      }
      if(prepareBatch)amount=Math.min(amount,Math.max(fixed!=null?1:0,trainingLimit(job)));
      const result=batch(job,amount,trail);
      if(prepareBatch&&job.inputs.length&&!job.grow) {
        // Once supply has started, new drops must not shrink the planned batch.
        // Clear at dispatch: batch-boundary waits can hide the later work receipt.
        if(result.intent?.t==='setRoute'&&result.intent.jobId===job.id||p.route?.jobId===job.id)
          delete goal.craftPreparation;
        else if(!goal.upgrade&&!result.blocked) {
          const quantity=Math.max(1,Math.min(50,Math.ceil(amount)));
          if(job.inputs.some(i=>count(p,i.itemId)<i.qty*quantity))
            goal.craftPreparation={jobId:job.id,amount:quantity};
        }
        if(goal.craftPreparation?.jobId===job.id) {
          const quantity=goal.craftPreparation.amount;
          const materials=job.inputs.map(i=>`${name(i.itemId)} ${count(p,i.itemId)}/${i.qty*quantity}`).join('、');
          result.reason=`本批制作 ${job.name} ×${quantity}；备料 ${materials}；${result.reason||result.label}`;
        }
      }
      return result;
    }
    function need(id, quantity, trail=[]) {
      if (trail.includes(id)) return blocked(`${name(id)} 的供料依赖形成循环`);
      if(goal.itemTarget) {
        goal.budget??={coins:0,items:{}};goal.budget.items??={};
        if(id!==data.coinId)goal.budget.items[id]=Math.max(goal.budget.items[id]??0,quantity);
      }
      const next = [...trail,id];
      if (id===data.coinId) {
        const job = jobs.filter(j=>j.skill==='thieving'&&j.output.itemId===id&&unlocked(j))
          .sort((a,b)=>b.output.qty/jobTime(b)-a.output.qty/jobTime(a))[0];
        return batch(job,Math.ceil((quantity-p.coins)/job.output.qty),next);
      }
      // The reviewed vendor sells this starter seed at four times base value.
      // A single seed is returned by harvesting and starts the herb supply chain.
      if(id===190) {
        const qty=goal.itemTarget&&id===goal.targetItemId?Math.min(100,Math.max(1,quantity-count(p,id))):1;
        const price=data.items[190].value*4*qty;
        const reserve=Math.max(0,(goal.budget?.coins??0)-((goal.budget?.items?.[190]??0)>0?price:0));
        if(p.coins<price+reserve)return need(data.coinId,price+reserve,next);
        if(nearBank(p)&&(p.route||p.path?.length))return action({t:'clearRoute'},'购买启动种子前停止旧路线');
        return bankAction(p,{t:'vendorBuy',itemId:190,qty},goal.itemTarget?`购买 ${qty} 粒鼠尾草种子 · ${price} 金币`:
          `购买一粒鼠尾草启动种子 · ${price} 金币`);
      }
      const acquisitionGoal=goal.upgrade?.xpRate>0?{...goal,rate:{xp:goal.upgrade.xpRate}}:goal;
      const purchase=api.marketPurchase?.(p,id,Math.max(0,quantity-count(p,id)),acquisitionGoal,profession);
      if (purchase) return purchase;
      if (id===data.shardId) return fight(style,id,false);
      const producers = made(id).sort((a,b)=>a.levelReq-b.levelReq);
      const available=producers.filter(unlocked).sort((a,b)=>{
        const time=j=>(jobEstimate(j).seconds+j.inputs.reduce((sum,i)=>sum+i.qty*cost(i.itemId,next),0))/jobEstimate(j).commonOutput;
        return time(a)-time(b);
      });
      const job = available.find(j=>j.id===goal.supplyRecipes?.[id])??available[0];
      if (job) {
        if(job.grow) {
          goal.budget??={coins:0,items:{}};goal.budget.items??={};
          goal.budget.items[id]=Math.max(goal.budget.items[id]??0,quantity);
        }
        const result=batch(job,Math.ceil((quantity-count(p,id))/job.output.qty),next);
        result.reason=`为${goal.itemTarget?`物品目标 ${name(goal.targetItemId)}`:goal.upgrade?`装备 ${name(goal.upgrade.id)}`:`${NAMES[goal.skill]} ${goal.target} 级目标`}补 ${name(id)}：`+
          `现有 ${count(p,id)}，计划需要 ${quantity}；${result.reason||result.label}`;
        return result;
      }
      if (producers.length) {
        const producer=producers[0],result=train(producer.skill,producer.levelReq,next);
        result.reason=`为 ${name(goal.upgrade?.id??id)} 解锁 ${NAMES[producer.skill]} ${lv[producer.skill]}→${producer.levelReq} 级（${name(id)}）；${result.reason||result.label}`;
        return result;
      }
      if (monsters.some(m=>m.drop===id||goal.itemTarget&&m.bonus?.itemId===id&&m.bonus.chance>0)) return fight(style,id,false);
      const source = jobs.filter(j=>j.bonus?.itemId===id&&unlocked(j))
        .sort((a,b)=>jobTime(a)/a.bonus.chance-jobTime(b)/b.bonus.chance)[0];
      if (source) return batch(source,50,next);
      if(goal.itemTarget) {
        const locked=jobs.filter(j=>j.bonus?.itemId===id&&j.bonus.chance>0).sort((a,b)=>a.levelReq-b.levelReq)[0];
        if(locked)return train(locked.skill,locked.levelReq,next);
      }
      return blocked(id===190 ? '缺少贤者种子：暂无已核实且合算的采购或自给来源，先继续其他技能' :
        `没有已知的自给来源：${name(id)}，暂缓此技能`);
    }
    function equip(itemId) {
      if (p.pack.some(i=>i.itemId===itemId)) return action({t:'wear',itemId},`装备 ${name(itemId)}`);
      return bankAction(p,{t:'equipFromBank',itemId},`装备 ${name(itemId)}`);
    }
    function selfSupply(id,trail=[]) {
      if (trail.includes(id)) return false;
      if (count(p,id)>0 || id===data.coinId || id===data.shardId) return true;
      if (jobs.some(j=>j.bonus?.itemId===id) || monsters.some(m=>m.drop===id||m.bonus.itemId===id)) return true;
      return made(id).some(j=>j.inputs.every(i=>selfSupply(i.itemId,[...trail,id])));
    }
    function upgrade(skill) {
      if(goal.itemTarget)return null;
      if(completedUpgrade||goal.temporary&&!goal.upgrade?.priority)return null;
      if (goal.upgrade) {
        const {id,slot}=goal.upgrade;
        const current=p.equipment[slot],worn=equipmentStats(current);
        const suitable=worn&&worn.slot===slot&&(!worn.style||worn.style===skill)&&
          (slot!=='weapon'||matchesProfessionWeapon(worn,profession));
        if (current===id||suitable&&gearScore(current,skill)>=gearScore(id,skill)) {
          delete goal.upgrade;completedUpgrade=true;return null;
        }
        else {
          const result=count(p,id)>0?equip(id):need(id,1);
          result.reason=`完成装备升级 ${name(id)}：${result.reason||result.label}`;
          if(result.blocked)delete goal.upgrade;
          return result;
        }
      }
      const combat=attacks.includes(skill);
      const slots=combat?['weapon','helmet','body','legs','shield','ring','amulet']:
        Object.keys(data.toolSkills).filter(slot=>data.toolSkills[slot]===skill);
      for (const ownedOnly of goal.growth?[true,false]:[false]) for (const slot of slots) {
        if (slot==='shield'&&(profession==='melee_twohand'||equipmentStats(p.equipment.weapon??0)?.twoHanded)) continue;
        const matches=id=>{
          const g=gear.get(base(id));
          return g?.slot===slot&&canWear(id)&&
            (slot!=='weapon'||matchesProfessionWeapon(g,profession))&&(!g.style||g.style===skill);
        };
        const owned=held(p).filter(matches);
        const craftable=ownedOnly?[]:data.gear.filter(g=>matches(g.itemId)&&made(g.itemId).length&&selfSupply(g.itemId)).map(g=>g.itemId);
        const current=p.equipment[slot];
        const candidates=[...new Set([...owned,...craftable])]
          .filter(id=>id!==current&&(current==null||!matches(current)||gearScore(id,skill)>gearScore(current,skill)))
          .map(id=>({id,investment:upgradeReturn(id,slot,skill,owned.includes(id))}))
          .filter(c=>c.investment.affordable).sort((a,b)=>{
            if(goal.growth&&owned.includes(a.id)!==owned.includes(b.id))return Number(owned.includes(b.id))-Number(owned.includes(a.id));
            if(goal.growth)return b.investment.after-a.investment.after||a.investment.seconds-b.investment.seconds;
            const value=c=>(c.investment.after??1)*(goal.horizon??strategy.horizon)-
              (c.investment.seconds??0)*(c.investment.after??1);
            return value(b)-value(a);
          });
        if (!candidates.length) continue;
        const {id:best,investment}=candidates[0];
        if (owned.includes(best)) {
          const result=equip(best);result.investment=investment;return result;
        }
        goal.upgrade={id:best,slot,skill,priority:true,xpRate:investment.after};
        const result=need(best,1);
        if(result.blocked)delete goal.upgrade;
        result.reason=goal.growth?`阶段装备 ${name(best)}：${result.reason||result.label}`:
          `装备升级 ${name(best)}，自制预计 ${Math.ceil(investment.payback/60)} 分钟回本：${result.reason||result.label}`;
        result.investment=investment;
        return result;
      }
      return null;
    }
    function upgradeReturn(id,slot,skill,owned) {
      const recipe=made(base(id)).sort((a,b)=>a.levelReq-b.levelReq)[0],next={...p,equipment:{...p.equipment,[slot]:id}};
      // Native equipping a two-handed weapon removes the shield.
      if (slot==='weapon'&&equipmentStats(id)?.twoHanded) next.equipment.shield=null;
      const horizon=goal.horizon??strategy.horizon;
      const preparation=owned?0:recipe?strategy.routeEstimate(p,recipe,1,{style:profession}):{seconds:Infinity,xp:0};
      // Reaching a wear requirement unlocks a directed manufacturing project.
      // Accessories without a wear skill still need an affordable return; a
      // level-one character must not pursue endgame jewellery before fighting.
      const requirement=gearRequirement(id),stageUpgrade=!owned&&requirement.skill!=='none'&&requirement.level>1;
      const stageReady=Number.isFinite(owned?0:preparation.seconds)&&(stageUpgrade||!(preparation.unlocks?.length));
      const bank=nearestBank(p),equipmentTrip=nearBank(p)||p.pack.some(i=>i.itemId===id)?0:2*distance(p,bank)*data.tickMs/1000;
      const cost=(owned?0:preparation.seconds)+equipmentTrip+data.tickMs/1000;
      let before=0,after=0;
      if (attacks.includes(skill)) {
        const oldOptions=strategy.combatOptions(p,profession),newOptions=strategy.combatOptions(next,profession);
        // A missing profession weapon is an enabling investment, not a return
        // percentage against an unrelated combat style.
        for (const c of oldOptions) {
          const old=strategy.routeEstimate(p,{monsterId:c.monster.id},20,{style:profession});
          before=Math.max(before,c.xp*20/old.seconds);
        }
        for (const c of newOptions) {
          const upgraded=strategy.routeEstimate(next,{monsterId:c.monster.id},20,{style:profession});
          // Equipment should improve combat progress and survival. Crediting
          // more cooking XP for eating more food would reward weaker gear.
          after=Math.max(after,c.xp*20/upgraded.seconds);
        }
        if (!oldOptions.length&&newOptions.length) return {affordable:goal.growth||stageUpgrade?stageReady:Number.isFinite(cost)&&cost<=horizon,
          seconds:cost,payback:cost,before,after,horizon};
      } else {
        const task=jobs.find(j=>j.id===goal.recipes?.[skill])??jobs.filter(j=>j.skill===skill&&unlocked(j)&&!j.grow)
          .sort((a,b)=>jobEstimate(b).xp/jobEstimate(b).seconds-jobEstimate(a).xp/jobEstimate(a).seconds)[0];
        if (!task) return {affordable:false,seconds:cost,payback:Infinity};
        before=strategy.routeEstimate(p,task,50).rate?.xp??0;
        after=strategy.routeEstimate(next,task,50).rate?.xp??0;
      }
      const gain=after-before,payback=gain>0?Math.max(cost,(cost*after-(preparation.xp??0))/gain):Infinity;
      return {affordable:goal.growth||stageUpgrade?stageReady&&gain>0:Number.isFinite(payback)&&cost<=horizon&&payback<=horizon,
        seconds:cost,payback,before,after,horizon};
    }
    function fight(style, requiredItem=null, prepareGear=true) {
      const fixedMonster=requiredItem===null&&goal.fixedMonsterId!=null?monsters.find(m=>m.id===goal.fixedMonsterId):null;
      if(requiredItem===null&&goal.fixedMonsterId!=null) {
        if(!fixedMonster)return blocked('固定怪物已不在当前数据中，请重新选择');
        if(!zones.some(z=>z.monsterId===fixedMonster.id))return blocked(`固定怪物 ${fixedMonster.name} 没有可用地点`);
      }
      if (prepareGear) {
        const improvement=upgrade(style);
        if (improvement) return improvement;
      }
      const weapons = held(p).filter(id=>{
        const g=gear.get(base(id));
        return matchesProfessionWeapon(g,profession)&&canWear(id);
      });
      const weaponScore = id => {
        return gearScore(id,style);
      };
      weapons.sort((a,b)=>weaponScore(b)-weaponScore(a));
      // upgrade() already compared owned alternatives and the bank trip. Keep
      // its decision instead of immediately overriding it with a raw stat sort.
      const weapon=weapons.includes(p.equipment.weapon)?p.equipment.weapon:weapons[0];
      if (weapon===undefined) {
        const starter=starterWeapon(profession);
        return need(starter,1);
      }
      if (p.equipment.weapon!==weapon) return equip(weapon);
      // Use deliberately conservative base stats: omit positive house/potion/mastery bonuses.
      const w=equipmentStats(weapon);
      const equipment=Object.values(p.equipment).filter(Number.isFinite).map(equipmentStats).filter(Boolean);
      const stat=key=>equipment.reduce((sum,g)=>sum+(key==='defence'||!g.style||g.style===style?1:-1)*(g[key]??0),0);
      const maxHp=lv.hitpoints;
      const safe = m => m.maxHit<maxHp/3 && maxHp/((10+m.attack)/(20+m.attack+lv.defence+stat('defence'))*(1+m.maxHit)/2)>=6;
      if(fixedMonster&&!safe(fixedMonster))return blocked(`固定怪物 ${fixedMonster.name} 目前无法安全战斗；请检查生命、防御与装备，不自动更换怪物`);
      const safeMonsters=monsters.filter(safe);
      if (!safeMonsters.length) return blocked('当前生命／防御不足以稳定战斗，请先检查装备与生命值');
      const choices=safeMonsters.filter(m=>(!fixedMonster||m.id===fixedMonster.id)&&zones.some(z=>z.monsterId===m.id)&&
        (requiredItem===null||requiredItem===data.shardId||m.drop===requiredItem&&(m.dropChance??1)>0||
          goal.itemTarget&&m.bonus?.itemId===requiredItem&&m.bonus.chance>0)).map(m=>{
        const estimate=combatEstimate(data,m,{style,level:lv[style],accuracy:stat('accuracy'),
          strength:stat('strength'),defence:stat('defence'),defenceLevel:lv.defence,speed:w.speed??5,twoHanded:w.twoHanded});
        const zone=zones.find(z=>z.monsterId===m.id);
        const supplies=combatSupplies(data,api,p,estimate,{zone,monster:m,foodItemId:0,
          excludeFoodIds:goal.itemTarget?[goal.targetItemId]:[],
          horizon:goal.horizon??strategy.horizon,supplyCost:id=>strategy.supplyCost(p,id)});
        const unitCost=strategy.supplyCost(p,supplies.foodItemId);
        const foodSeconds=estimate.damage/supplies.heal*(Number.isFinite(unitCost)?unitCost:0);
        const bank=nearestBank(zone),tickSeconds=data.tickMs/1000;
        const windowKills=Math.max(1,supplies.horizonKills);
        const approach=p.route?.zoneId===zone.id?0:(distance(p,bank)+distance(bank,zone))*tickSeconds/windowKills;
        const restock=supplies.restockSeconds;
        const travelSeconds=approach+restock,seconds=estimate.seconds+foodSeconds+travelSeconds;
        const yieldPerKill=requiredItem===data.shardId?estimate.shards:requiredItem!==null?
          (m.drop===requiredItem?(m.dropChance??1):m.bonus.chance):estimate.xp;
        return {...estimate,monsterId:m.id,name:m.name,monsterMaxHit:m.maxHit,zone,foodSeconds,travelSeconds,supplies,
          xpPerMinute:60*estimate.xp/seconds,mainXpPerMinute:60*estimate.mainXp/seconds,
          coinsPerMinute:60*estimate.coins/seconds,score:yieldPerKill/seconds};
      }).filter(c=>c.supplies.sustainable);
      choices.sort((a,b)=>b.score-a.score||b.coinsPerMinute-a.coinsPerMinute);
      // Small estimate changes should not cause repeated travel between similar spots.
      const current=choices.find(c=>c.zone.id===p.route?.zoneId);
      const planned=requiredItem===null?choices.find(c=>c.monsterId===(goal.fixedMonsterId??goal.monsterId)):undefined;
      if(fixedMonster&&!planned)return blocked(`固定怪物 ${fixedMonster.name} 目前无法安全持续补给；等待食物或装备条件，不自动更换怪物`);
      if(goal.quest&&requiredItem===null&&!planned)return blocked('任务目标怪物目前无法安全有效击杀，先继续成长');
      const selected=planned??(current&&current.score>=choices[0]?.score*.9?current:choices[0]);
      if (!selected) return blocked('所需材料的怪物目前过强，先提升其他战斗技能');
      const supplies=selected.supplies;
      // The client resolves the enemy attack before automatic eating. A full
      // food pack therefore does not make entering combat at low HP safe.
      const targetHp=Math.min(supplies.maxHp,Math.floor(supplies.maxHp*.5)+selected.monsterMaxHit+1);
      const entering=p.route?.zoneId!==selected.zone.id;
      if ((entering&&p.hp<targetHp)||p.hp<=selected.monsterMaxHit) {
        if (p.route||p.path?.length) return action({t:'clearRoute'},'先停止当前路线并治疗',
          `当前生命 ${p.hp}，开战前至少恢复到 ${targetHp}`);
        const eligible=id=>(data.items[base(id)]?.heals??0)>0&&rarity(id)<=(p.foodMaxTier??1)&&
          (!goal.itemTarget||id!==goal.targetItemId);
        const compare=(a,b)=>Number(b===supplies.foodItemId)-Number(a===supplies.foodItemId)||
          (data.items[base(b)]?.heals??0)-(data.items[base(a)]?.heals??0);
        const carried=p.pack.filter(i=>i.qty>0&&eligible(i.itemId)).map(i=>i.itemId).sort(compare)[0];
        const stored=Object.keys(p.bank).map(Number).filter(id=>p.bank[id]>0&&eligible(id)).sort(compare)[0];
        const itemId=carried??stored;
        if (itemId!==undefined) {
          const result=carried!==undefined?action({t:'eat',itemId,qty:1},'战斗前吃一份食物回血'):
            bankAction(p,{t:'eat',itemId,qty:1,shelf:true},'战斗前从仓库吃一份食物回血');
          result.reason=`当前生命 ${p.hp}，恢复至至少 ${targetHp} 后才开战；每份食物都等待实际回血确认`;
          result.healing={targetHp,itemId};return result;
        }
      }
      goal.budget??={coins:0,items:{}};goal.budget.items??={};
      goal.budget.items[supplies.foodItemId]=Math.max(goal.budget.items[supplies.foodItemId]??0,supplies.reserve);
      const preparation=goal.foodPreparation;
      if (preparation&&(preparation.playerId!==p.id||preparation.style!==profession||
        preparation.monsterId!==selected.monsterId||preparation.itemId!==supplies.foodItemId||
        count(p,preparation.itemId)>=preparation.target||
        p.route?.zoneId===selected.zone.id&&supplies.currentFood>0)) delete goal.foodPreparation;
      // Once replenishment starts, finish that batch. Stopping at one carry
      // load makes the first bite trigger the same preparation all over again.
      if (!goal.foodPreparation&&supplies.needFood>0) goal.foodPreparation={
        playerId:p.id,style:profession,monsterId:selected.monsterId,itemId:supplies.foodItemId,target:supplies.reserve};
      if (goal.foodPreparation) {
        const {itemId,target}=goal.foodPreparation;
        goal.budget.items[itemId]=Math.max(goal.budget.items[itemId]??0,target);
        const result=need(base(itemId),target);
        result.reason=`战斗备粮 ${target} 份：${result.reason||result.label}`;
        result.supplies=supplies;return result;
      }
      if (p.eatAt!==.5) return action({t:'eatAt',at:.5},'设置半血进食');
      if (p.foodItemId!==supplies.foodItemId) return action({t:'chooseFood',itemId:supplies.foodItemId},`选择 ${name(supplies.foodItemId)} 作为补给`);
      if (p.foodPerTrip!==supplies.carryCommand) return action({t:'carryFood',count:supplies.carryCommand},`每趟携带 ${supplies.carry} 份食物`,supplies.reason);
      const carriedTargetFood=goal.itemTarget&&data.items[goal.targetItemId]?.heals&&
        p.pack.some(i=>i.itemId===goal.targetItemId&&i.qty>0);
      if ((supplies.bankFirst||carriedTargetFood)&&p.pack.length) {
        // An adjacent cooking site can keep replacing deposited food before
        // the next snapshot. Stop and confirm the old route before emptying it.
        if (p.route||p.path?.length) return action({t:'clearRoute'},'战斗补给前停止旧路线',
          '确认旧任务停止后再存包，避免持续产出掩盖存包结果');
        return bankAction(p,{t:'deposit'},'战斗出发前存包并补足当趟食物');
      }
      const purpose=requiredItem===data.shardId?'补强化碎片（按碎片效率）':requiredItem!==null?`补材料 ${name(requiredItem)}（按掉落效率）`:'练经验（按总经验效率）';
      const reason=`${purpose}；预计命中 ${(selected.hitChance*100).toFixed(0)}%，击杀 ${selected.seconds.toFixed(1)} 秒；`+
        `${NAMES[style]}经验 ${selected.mainXpPerMinute.toFixed(0)}/分，总经验 ${selected.xpPerMinute.toFixed(0)}/分，金币 ${selected.coinsPerMinute.toFixed(1)}/分。`+
        `${style==='magic'?`法术按防御的一半计算：${selected.effectiveDefence}。`:''}`+
        `已计入自制食物和往返补给的估算；${supplies.reason}未计药水、住宅、精通等加成。`;
      const result=p.route?.zoneId===selected.zone.id && combatStyle()===style&&matchesProfessionWeapon(w,profession)?wait(reason):
        action({t:'fight',zoneId:selected.zone.id,limit:0},`${NAMES[style]} · ${selected.name}`,reason);
      if (!result.intent) result.label=`继续${NAMES[style]} · ${selected.name}`;
      return {...result,combat:selected};
    }
    function enhance() {
      const result=planEnhancement(data,api,p,profession,goal);
      if(result.enhancement) {
        goal.enhancement=result.enhancement;goal.budget=result.budget;
        goal.enhancementProject??=result.enhancement;
      }
      if(result.needs) {
        const supply=need(result.needs.itemId,result.needs.quantity);
        supply.reason=`${result.reason}；${supply.reason||supply.label}`;
        return supply;
      }
      return result;
    }
    if (!goal) return blocked('参与训练的技能已达到数据表的等级上限');
    if (!trainedSkills(profession).includes(goal.skill)) return blocked(`${PROFESSIONS[profession]}模式不训练${NAMES[goal.skill]}`);
    if(goal.fixedRecipeId!=null) {
      const fixed=jobs.find(j=>j.id===goal.fixedRecipeId&&!j.grow&&j.skill===goal.mainSkill);
      if(!fixed)return blocked('固定工作已不在当前主业数据中，请重新选择');
      if(!unlocked(fixed))return blocked(`固定工作 ${fixed.name} 需要${NAMES[fixed.skill]} ${fixed.levelReq} 级（当前 ${lv[fixed.skill]}），不会自动改练其他配方`);
      if(!siteFor(fixed))return blocked(`固定工作 ${fixed.name} 没有可用地点，等待条件变化`);
    }
    if (Object.values(p.overflow??{}).some(n=>n>0)) return blocked('仓库已有溢出物品，请整理后继续');
    if(goal.upgrade?.priority) {
      const result=upgrade(goal.upgrade.skill??data.toolSkills[goal.upgrade.slot]??style);
      if(result)return {...result,goal,...(goal.professionOnly||goal.toolOnly?{priorityGear:true,investmentGoal:goal}:{})};
    }
    if (goal.professionOnly||goal.toolOnly) {
      const result=upgrade(goal.toolOnly?goal.skill:style);
      if (!result) return null;
      return {...result,priorityGear:true,investmentGoal:goal};
    }
    if ((goal.budget?.coins??0)>p.coins) {
      const result=need(data.coinId,goal.budget.coins);
      result.reason=`补足当前计划现金预算 ${goal.budget.coins}：${result.reason||result.label}`;
      result.goal=goal;return result;
    }
    let result;
    if(goal.quest) {
      const quest=api.questRead(p).find(q=>q.key===goal.quest.key);
      if(!quest||quest.claimed||quest.remaining<=0)return wait('任务已完成或已刷新，重新安排成长');
      const job=jobs.find(j=>j.id===quest.jobId);
      if(quest.kind!=='kill'&&!job)return blocked('任务配方尚未核对，先继续成长');
      result=quest.kind==='kill'?fight(style):batch(job,quest.remaining);
    } else if(goal.itemTarget) {
      const id=goal.targetItemId,owned=count(p,id)+(p.overflow?.[id]??0)+
        Object.values(p.equipment).filter(item=>item===id).length+(goal.listedQty??0);
      result=need(id,count(p,id)+Math.max(0,goal.qty-owned));
    } else result=train(goal.skill,goal.target);
    result.goal=goal;
    return result;
  }
  function professionUpgrade(p,style='magic',investmentGoal=null,options={}) {
    const skill=professionSkill(style);
    const goal=investmentGoal??{skill,target:level(p.skills[skill])+1,horizon:1800,professionOnly:true,...options};
    return plan(p,goal,style);
  }
  function equipmentStatus(p,profession='magic') {
    const skill=professionSkill(profession),lv=levels(p),owned=held(p);
    const slots=['weapon','helmet','body','legs','shield','ring','amulet',...Object.keys(data.toolSkills)];
    return slots.filter(slot=>slot!=='shield'||profession!=='melee_twohand').map(slot=>{
      const current=p.equipment[slot],score=id=>gearScore(id,data.toolSkills[slot]??skill);
      const matches=id=>{const g=gear.get(base(id));return g?.slot===slot&&
        (slot!=='weapon'||matchesProfessionWeapon(g,profession))&&(!g.style||g.style===skill);};
      const candidates=[...new Set([...data.gear.map(g=>g.itemId),...owned])].filter(id=>matches(id)&&id!==current&&
        (current==null||!matches(current)||score(id)>score(current)));
      const wearable=id=>{const r=gearRequirement(id);return r.skill==='none'||lv[r.skill]>=r.level;};
      const describe=id=>{
        if(id==null)return null;
        const recipe=jobs.find(j=>j.output.itemId===base(id));
        const stock=count(p,id)>0;
        const supply=stock?{seconds:0,unlocks:[],budget:{items:{}}}:recipe?
          strategy.routeEstimate(p,recipe,1,{style:profession}):{seconds:Infinity,unlocks:[],budget:{items:{}}};
        return {id,name:name(id),wear:gearRequirement(id),owned:stock,requirements:supply.unlocks??[],
          materials:Object.fromEntries(Object.entries(supply.budget.items).map(([item,qty])=>[item,Math.max(0,qty-count(p,+item))]).filter(([,qty])=>qty>0)),
          seconds:supply.seconds};
      };
      const available=candidates.filter(wearable).sort((a,b)=>score(b)-score(a)||a-b);
      const future=candidates.filter(id=>!wearable(id)).sort((a,b)=>gearRequirement(a).level-gearRequirement(b).level||score(b)-score(a));
      return {slot,current:current==null?null:{id:current,name:name(current)},upgrade:describe(available[0]),next:describe(future[0])};
    });
  }
  function planAtBoundary(p,goal,style='magic',completedLoad=false) {
    const reason=!completedLoad&&finishTaskReason(data,p);
    if (reason) return wait(reason);
    return plan(p,goal,style);
  }
  function farmStatus(p) {
    farmState(p);
    const fields=farmFields(p),plots=farmPlots(p),empty=fields.filter(s=>!p.plots?.[s.id]).length;
    const best=farmingChoice.mode==='manual'?manualFarmJob():farmTarget??
      jobs.filter(j=>j.grow&&level(p.skills.farming)>=j.levelReq).sort((a,b)=>b.xp/b.grow-a.xp/a.grow)[0];
    const status={fields:fields.length,empty,planted:plots.length,preference:farmingPreference(),selectedName:best?.name??null,
      seedStock:best?seedCount(p,best):0};
    const manualReason=manualFarmReason(p);
    if(manualReason)return {...status,crop:best?.name,reason:manualReason};
    if (!best) return {...status,reason:'暂无已解锁作物'};
    let reason;
    if (farmDelayReason&&!p.route?.errand) reason=farmDelayReason;
    else if (farmSearch) reason=`${farmSearch.expansion?'补齐空田':'升级作物'} · ${farmSearch.job.name}：`+
      (level(p.skills[farmSearch.source.skill])<farmSearch.source.levelReq?
        `先练${NAMES[farmSearch.source.skill]}至 ${farmSearch.source.levelReq} 级，再自采种子`:`正在从 ${farmSearch.source.name} 自采种子，本批尚缺 ${farmSearch.needed} 颗`);
    else if (p.lastTick<farmRetryAt) reason='本轮采种／前置练级已达时间预算，先继续其他任务，稍后重试';
    else if (hasSeed(p,best)) reason=`${best.name} 种子已备好，空田补种／成熟后更换`;
    else if (!empty&&plots.every(f=>f.job.id===best.id)) reason=`${best.name} 已种满；收获后种子循环使用`;
    else if(farmingChoice.mode==='manual'&&best.inputs[0].itemId===190)
      reason='缺少所选种子；训练模式可在保留当前计划金币后，按空田缺口向商人采购；辅助模式等待已有种子';
    else {
      const source=jobs.find(j=>j.bonus?.itemId===best.inputs[0].itemId);
      reason=`已解锁 ${best.name}，缺种子；`+(!source?'未找到已核实的采种路线，暂时保留现有作物':
        level(p.skills[source.skill])<source.levelReq?`自采需${NAMES[source.skill]} ${source.levelReq} 级（当前 ${level(p.skills[source.skill])}）`:
        `将分批从 ${source.name} 自采，补齐空田后逐步换种`);
    }
    if(farmingChoice.mode==='manual')reason=`手动种植 ${best.name}：${reason}`;
    else if(farmTargetReason)reason=`${farmTargetReason} · ${best.name}：${reason}`;
    return {...status,crop:best.name,reason};
  }
  const api={level,levels,thresholds,trainedSkills,balancedChooseGoal,plan:planAtBoundary,planItemTarget,itemTargetChoices,count,base,nearBank,carriedBatch,equipmentStats,farmPlots,harvest,harvestOnly,professionUpgrade,equipmentStatus,farmStatus,
    setFarmingPreference,farmingPreference,
    taskBoundary:p=>!finishTaskReason(data,p)};
  api.consumable=(p,goal,style,plan,window)=>planConsumable(data,api,p,goal,style,plan,window);
  api.enhancementTraining=createEnhancementTraining(data,api);
  const strategy=createStrategy(data,api);
  Object.assign(api,{chooseGoal:strategy.chooseGoal,routeEstimate:strategy.routeEstimate,
    candidates:strategy.candidates,setMeasurements:strategy.setMeasurements,
    acquireEstimate:(p,id,qty,style='magic')=>strategy.routeEstimate(p,{itemId:id},qty,{style}),
    coinRate:p=>Math.max(0,...jobs.filter(j=>j.output.itemId===data.coinId&&!j.inputs.length&&level(p.skills[j.skill])>=j.levelReq)
      .map(j=>{const e=strategy.estimateWork(p,j);return e.coins/e.seconds;}))});
  const growth=createProgression(data,api);
  const specialization=createSpecialization(data,api);
  const quests=createQuests(data,api);
  return Object.assign(api,{growthChooseGoal:growth.chooseGoal,growthStatus:growth.status,
    specialistChooseGoal:specialization.chooseGoal,specializationStatus:specialization.status,
    resetSpecialization:specialization.reset,
    selectGoal(p,served,deferred,style,mode='balanced',mainTrade='auto',mainJobId=null,mainMonsterId=null) {
      if(mode!=='business')this.watchMarket?.(p,[]);
      return (mode==='business'?this.specialistChooseGoal:mode==='experience'?this.chooseGoal:
        this.growthChooseGoal??this.chooseGoal)(p,served,deferred,style,mainTrade,mainJobId,mainMonsterId);
    },
    questRead:quests.read,questClaim:quests.claim,questChooseGoal:quests.chooseGoal,questCompleted:quests.completed});
}


function createEconomy(data,planner,{autoSell=false,capacitySales=false}={}) {
  let lastGoal=null,lastPlayer=null,lastStyle=null,lastMode=null,lastMain=null,lastJob=null,lastMonster=null,investmentGoal=null,gearDeferredUntil=0,recovery=null;
  const budget=(p,goal)=>inventoryBudget(data,planner,p,goal);
  const review=(p,goal,style='magic')=>reviewInventory(data,planner,p,goal,style);
  const action=(intent,label,reason='',extra={})=>({intent,label,reason,...extra});
  const value=id=>Math.max(1,Math.floor((data.items[planner.base(id)]?.value??0)*.4));
  const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
  const bankFor=p=>[...data.banks].sort((a,b)=>distance(p,a)-distance(p,b))[0];
  const atBank=(p,intent,label,reason,extra={})=>planner.nearBank(p)?action(intent,label,reason,extra):
    action({t:'walk',...bankFor(p).approach},'整理库存 · 前往仓库',reason||label,extra);
  function investment(p,goal,style,reserve,includeUnfunded=false) {
    if(p.enhance)return null;
    const lv=planner.levels(p),combatSkill=professionSkill(style);
    const relevant=gear=>(!gear.style||gear.style===combatSkill)&&
      (gear.slot!=='weapon'||matchesProfessionWeapon(gear,style))&&
      (gear.slot!=='shield'||style!=='melee_twohand');
    const job=data.jobs.find(j=>j.id===(goal?.recipeId??goal?.recipes?.[goal?.skill]??p.route?.jobId));
    const monster=data.monsters.find(m=>m.id===(goal?.monsterId??data.zones.find(z=>z.id===p.route?.zoneId)?.monsterId));
    const stats=(equipment)=>{
      const gear=Object.entries(equipment).filter(([slot,id])=>Number.isFinite(id)&&
        (slot!=='shield'||style!=='melee_twohand')).map(([,id])=>planner.equipmentStats(id)).filter(Boolean);
      const weapon=planner.equipmentStats(equipment.weapon);
      const sum=k=>gear.reduce((n,g)=>n+(k==='defence'||!g.style||g.style===combatSkill?1:-1)*(g[k]??0),0);
      return {style:combatSkill,level:lv[combatSkill],accuracy:sum('accuracy'),strength:sum('strength'),
        defence:sum('defence'),defenceLevel:lv.defence,speed:weapon?.speed??5,twoHanded:weapon?.twoHanded};
    };
    const candidates=[];
    for(const [slot,id]of Object.entries(p.equipment)) {
      const gear=planner.equipmentStats(id);
      if(!gear||Math.floor(id/data.plusScale)!==0||slot==='hoe'||slot==='mount')continue;
      if(planner.enhancementTraining?.blocked(p,id,slot))continue;
      if(!relevant(gear))continue;
      if(goal?.upgrade?.slot===slot)continue;
      if(p.id===lastPlayer&&style===lastStyle&&investmentGoal?.upgrade?.slot===slot)continue;
      const quote=enhanceQuote(data,planner,p,id),next=planner.equipmentStats(id+data.plusScale);
      const otherCoins=Math.max(0,reserve.coins-(goal?.enhancement?.itemId===id?goal.enhancement.gold:0));
      if(quote.chance!==1||!includeUnfunded&&p.coins<quote.gold+otherCoins||
        planner.count(p,data.shardId)<quote.shards+(reserve.items[data.shardId]??0))continue;
      let coinGain=0,xpGain=0,xpRate=0,skill=null;
      const toolSkill=data.toolSkills[slot];
      if(toolSkill&&job?.skill===toolSkill&&!job.grow) {
        const opts={quick:p.perks?.quick??0,hands:p.perks?.hands??0};
        const before=workEstimate(data,job,lv[job.skill],{...opts,toolBonus:gear.bonus});
        const after=workEstimate(data,job,lv[job.skill],{...opts,toolBonus:next.bonus});
        const inputs=job.inputs.reduce((n,i)=>n+value(i.itemId)*i.qty,0);
        const profit=e=>e.coins+e.commonOutput*(job.output.itemId===data.coinId?0:value(job.output.itemId))-inputs;
        coinGain=profit(after)/after.seconds-profit(before)/before.seconds;
        xpRate=before.xp/before.seconds;xpGain=after.xp/after.seconds-xpRate;skill=job.skill;
      } else if(!toolSkill&&monster&&['magic','melee','ranged','defence','hitpoints'].includes(goal?.skill)) {
        const before=combatEstimate(data,monster,stats(p.equipment));
        const after=combatEstimate(data,monster,stats({...p.equipment,[slot]:id+data.plusScale}));
        const foods=Object.values(data.items).filter(i=>i.heals&&planner.count(p,i.id)>0);
        const healValue=foods.length?Math.min(...foods.map(i=>value(i.id)/Math.min(i.heals,lv.hitpoints*.5))):0;
        // Count only guaranteed coins and reduced food use; rare drops stay protected.
        coinGain=(after.coins-after.damage*healValue)/after.seconds-
          (before.coins-before.damage*healValue)/before.seconds;
        xpRate=before.xp/before.seconds;xpGain=after.xp/after.seconds-xpRate;skill=combatSkill;
      }
      if(!(coinGain>0)||xpGain<0)continue;
      // Shards have an opportunity cost even when already owned. Pay back within
      // the current planning window, or before the next equipment tier arrives.
      let horizon=goal?.horizon??1800;
      const currentRequirement=gear.levelReq??data.jobs.find(j=>j.output.itemId===planner.base(id))?.levelReq??1;
      const nextRequirement=data.gear.filter(g=>g.slot===slot&&relevant(g))
        .map(g=>g.levelReq??data.jobs.find(j=>j.output.itemId===g.itemId)?.levelReq??1)
        .filter(n=>n>Math.max(lv[skill]??1,currentRequirement)).sort((a,b)=>a-b)[0];
      if(nextRequirement&&xpRate>0)horizon=Math.min(horizon,
        (planner.thresholds[nextRequirement]-p.skills[skill])/xpRate);
      const cost=quote.gold+quote.shards*value(data.shardId),paybackSeconds=cost/coinGain;
      if(!Number.isFinite(paybackSeconds)||!Number.isFinite(horizon)||paybackSeconds>horizon)continue;
      candidates.push({id,slot,quote,cost,coinGain,xpGain,paybackSeconds,horizon,requiredCoins:quote.gold+otherCoins});
    }
    candidates.sort((a,b)=>a.paybackSeconds-b.paybackSeconds);
    return candidates[0]??null;
  }
  function investmentBudget(p,goal,style='magic') {
    const next=investment(p,goal,style,budget(p,goal),true);
    return next?{coins:next.requiredCoins,enhancement:{itemId:next.id,gold:next.quote.gold,shards:next.quote.shards}}:null;
  }
  function maintenance(p,goal,style='magic',mode='balanced',mainTrade='auto',mainJobId=null,mainMonsterId=null) {
    if(mode!=='business'){mainJobId=null;mainMonsterId=null;}
    if(p.id!==lastPlayer||style!==lastStyle||mode!==lastMode||mainTrade!==lastMain||mainJobId!==lastJob||mainMonsterId!==lastMonster){lastGoal=null;investmentGoal=null;gearDeferredUntil=0;recovery=null;lastPlayer=p.id;lastStyle=style;lastMode=mode;lastMain=mainTrade;lastJob=mainJobId;lastMonster=mainMonsterId;}
    if(mode==='business'&&goal?.mainSkill!==professionSkill(style))investmentGoal=null;
    const upgrading=goal?.upgrade?.priority||goal?.toolUpgrade?.upgrade?.priority;
    if(upgrading||goal?.itemTarget)investmentGoal=null;
    if(goal)lastGoal=goal;
    // Preserve the in-flight supply budget across a reconnect/goal-selection gap.
    let protection=goal??lastGoal;
    if(investmentGoal) {
      const current=budget(p,protection),invest=budget(p,investmentGoal),items={...current.items};
      for(const [id,qty]of Object.entries(invest.items))items[id]=Math.max(items[id]??0,qty);
      protection={...protection,upgrade:investmentGoal.upgrade,
        recipes:{...protection?.recipes,...investmentGoal.recipes},budget:{coins:current.coins+invest.coins,items}};
    }
    // An ordinary inventory detour would overwrite the game's saved farm errand.
    // Capacity emergencies are the only reason to interrupt that trip.
    const capacity=budget(p,protection);
    const blockedPack=capacity.freeSlots<=0&&p.pack.some(i=>(p.bank[i.itemId]??0)<=0);
    const overflow=Object.values(p.overflow??{}).some(n=>n>0)||blockedPack;
    const recoveryFlags={inventoryRecovery:true,capacityLimited:true};
    const waiting=()=>action(null,'等待溢出物品归仓',
      '仓库已有可用空间；等待新状态确认归仓，不反复取放或出售旧库存',
      {...recoveryFlags,refreshInventory:true});
    const overflowKey=()=>JSON.stringify([capacity.freeSlots,Object.entries(p.overflow??{}).filter(([,n])=>n>0)
      .map(([id,n])=>[id,n,(p.bank[id]??0)>0])]);
    if((capacity.recoverableOverflow||recovery?.itemId!=null)&&p.enhance)
      return action(null,'等待当前强化完成后归仓','保留正在进行的强化尝试，完成后再处理溢出物品',recoveryFlags);
    if(recovery?.itemId!=null) {
      const carried=p.pack.filter(i=>i.itemId===recovery.itemId).reduce((n,i)=>n+i.qty,0);
      if(recovery.phase==='withdrawing'&&carried>=recovery.packBefore+1) {
        recovery.phase='returning';
        return atBank(p,{t:'depositItem',itemId:recovery.itemId,qty:1},'归还归仓触发物品',
          '只归还刚取出的 1 件，不出售、不丢弃任何物品',recoveryFlags);
      }
      if(recovery.phase==='returning'&&carried<=recovery.packBefore)
        recovery=capacity.recoverableOverflow?{key:overflowKey()}:null;
      else return waiting();
    }
    if(capacity.recoverableOverflow) {
      if(recovery?.key===overflowKey())return waiting();
      if(!planner.nearBank(p))return atBank(p,null,'溢出物品可归仓，先返回仓库','',recoveryFlags);
      if(p.route||p.path?.length)return action({t:'clearRoute'},'归仓前停止旧路线','等待停止确认后再操作仓库',recoveryFlags);
      const packSize=p.pack.reduce((n,i)=>n+(data.items[planner.base(i.itemId)]?.stackable?1:i.qty),0);
      const newKinds=Object.entries(p.overflow??{}).filter(([id,n])=>n>0&&!(p.bank[id]>0)).length;
      const donor=Object.entries(p.bank).find(([id,n])=>n>0&&+id===planner.base(+id)&&data.items[id]&&
        (n>1||(p.overflow?.[id]??0)>0||capacity.freeSlots>newKinds));
      if(!donor)return waiting();
      const itemId=Number(donor[0]),packBefore=p.pack.filter(i=>i.itemId===itemId).reduce((n,i)=>n+i.qty,0);
      if(packSize>=28+(p.perks?.pockets??0)&&!(data.items[itemId].stackable&&packBefore>0)) {
        const depositable=p.pack.find(i=>(p.bank[i.itemId]??0)>0||capacity.freeSlots>0);
        if(depositable)return action({t:'depositItem',itemId:depositable.itemId,qty:depositable.qty},
          '归仓前腾出背包位置','只存入仓库当前能容纳的物品，再重新核对仓位',recoveryFlags);
      } else {
        // Native X9 calls ev after a withdrawal. Empty manual deposit (ov) does
        // not drain overflow, so borrow one known item and return exactly one.
        recovery={itemId,packBefore,phase:'withdrawing'};
        return action({t:'withdraw',itemId,qty:1},'触发溢出物品归仓','临时取出 1 件，归仓确认后立即放回',recoveryFlags);
      }
    }
    if(recovery)recovery=null;
    if(p.route?.errand&&!overflow)return null;
    if(!overflow&&p.coins>=capacity.coins&&finishTaskReason(data,p))return null;
    if(!overflow&&!upgrading&&!goal?.temporary&&!goal?.itemTarget&&planner.professionUpgrade&&p.lastTick>=gearDeferredUntil&&
      (mode!=='business'||goal?.mainSkill===professionSkill(style))) {
      const gearPlan=planner.professionUpgrade(p,style,investmentGoal,{growth:goal?!!goal.growth:mode==='balanced',stage:goal?.stage});
      investmentGoal=gearPlan?.investmentGoal??null;
      if(gearPlan?.blocked||gearPlan?.deferUntilTick) {
        gearDeferredUntil=gearPlan.deferUntilTick??p.lastTick+Math.ceil(300000/data.tickMs);
      } else if(gearPlan) {
        if(goal?.enhancement&&investmentGoal?.upgrade?.slot===planner.equipmentStats(goal.enhancement.itemId)?.slot) {
          goal.budget.coins=Math.max(0,goal.budget.coins-goal.enhancement.gold);delete goal.enhancement;
        }
        return {...gearPlan,priorityGear:true};
      }
    }
    if(goal) {
      const funding=upgrading||goal.enhancementProject||goal.temporary||goal.itemTarget?null:investmentBudget(p,goal,style);
      if(funding) {
        goal.budget??={items:{},coins:0};goal.budget.coins=funding.coins;goal.enhancement=funding.enhancement;
      } else if(goal.enhancement&&!goal.enhancementProject) {
        goal.budget.coins=Math.max(0,goal.budget.coins-goal.enhancement.gold);delete goal.enhancement;
      }
    }
    const inspected=review(p,protection,style),reserve=inspected.budget;
    const capacitySale=autoSell!==true&&capacitySales===true&&capacity.freeSlots<=0;
    const saleFlags=capacitySale?{capacitySale:true}:{};
    const rows=autoSell===true||capacitySale?inspected.items.filter(i=>i.sell>0):[];
    let deferredSale=null;
    const profit=rows.reduce((n,i)=>n+i.sellFromBank*i.vendorUnit,0);
    const urgent=reserve.pressure||p.coins<reserve.coins;
    // Small depot sales wait until a batch ends; clearing a productive route
    // would restart its supply plan even when the counter is next to the job.
    const detour=2*distance(p,bankFor(p))*data.tickMs/1000;
    const detourWorth=profit>=Math.max(200,detour*Math.max(1,goal?.rate?.coins??1));
    const idleAtBank=planner.nearBank(p)&&!p.route&&!p.path?.length;
    if(rows.length&&(idleAtBank||urgent||detourWorth)) {
      const bankRows=rows.filter(i=>i.sellFromBank>0).sort((a,b)=>
        (reserve.pressure?Number(b.sellFromBank===b.bank)-Number(a.sellFromBank===a.bank):0)||
        b.sellFromBank*b.vendorUnit-a.sellFromBank*a.vendorUnit);
      for(const row of bankRows) {
        const vendor=action({t:'marketDump',itemId:row.itemId,qty:row.sellFromBank,floor:row.vendorUnit},
          `出售盈余 · ${row.name} × ${row.sellFromBank}`,
          `${row.reason}；保留 ${row.keep}，系统回收收入 ${row.sellFromBank*row.vendorUnit} 金币`,saleFlags);
        const sale=planner.marketSale?planner.marketSale(p,vendor,protection,style):vendor;
        if(sale?.marketDeferred){deferredSale=sale;continue;}
        if(!sale)continue;
        // Stop production only once an actual sale is ready, not while a quote
        // or a free listing slot is pending. Recheck stock on the next snapshot.
        if(sale.intent?.t==='marketDump') {
          if(planner.nearBank(p)&&(p.route||p.path?.length))return action(
            {t:'clearRoute'},'出售前停止路线并确认库存','下一份状态重新计算可卖数量，出售完成后继续收益规划',saleFlags);
          return atBank(p,sale.intent,sale.label,sale.reason,saleFlags);
        }
        return {...sale,...saleFlags};
      }
      const deposit=rows.find(i=>i.pack>0&&((p.bank[i.itemId]??0)>0||reserve.freeSlots>0));
      if(deposit)return atBank(p,{t:'depositItem',itemId:deposit.itemId,qty:deposit.pack},
        `存入待售物品 · ${deposit.name}`,'只存入已确认可处理的普通物品，再按最新库存计算卖出量',saleFlags);
    }
    if(capacity.recoverableOverflow)return waiting();
    if(overflow&&(deferredSale||!rows.some(i=>i.bank>0&&i.sellFromBank===i.bank))) {
      if(goal?.itemTarget)return action(null,'物品目标等待仓库空间',
        '仓库剩余物品均受保护或正在等待成交；保留当前物品目标，整理后继续',{capacityLimited:true});
      // All remaining stock is protected. Continue a coin-only task without
      // creating new item kinds, rather than buying shelves or deleting valuables.
      const lv=planner.levels(p),choices=data.jobs.filter(j=>j.skill==='thieving'&&j.output.itemId===data.coinId&&
        !j.inputs.length&&j.levelReq<=lv.thieving&&(!j.bonus||(p.bank[j.bonus.itemId]??0)>0));
      choices.sort((a,b)=>b.output.qty/workEstimate(data,b,lv.thieving).seconds-
        a.output.qty/workEstimate(data,a,lv.thieving).seconds);
      const fixed=mode==='business'&&(mainJobId!=null||mainMonsterId!=null||goal?.fixedRecipeId!=null||goal?.fixedMonsterId!=null);
      const job=fixed?choices.find(j=>j.id===(mainJobId??goal?.fixedRecipeId)):choices[0];
      const site=job&&data.sites.find(s=>s.jobIds.includes(job.id));
      if(fixed&&!site)return action(null,'固定工作等待仓库空间','仓库空间不足；保留固定工作，等待整理或盈余成交后继续，不自动改做其他工作',{capacityLimited:true});
      if(site)return action(p.route?.jobId===job.id?null:
        {t:'setRoute',siteId:site.id,jobId:job.id,onFull:'bank',limit:0,rarity:0},
        fixed?'继续固定金币工作':'仓库保护 · 先赚金币',fixed?`继续所选 ${job.name}；此工作不新增物品种类，不更换固定目标`:!autoSell&&!capacitySale?'自动出售已关闭，库存留给玩家处理；先做不新增物品种类的任务':deferredSale?'市场物品等待成交；继续不新增物品种类的赚钱任务':
          '剩余库存均受保护；继续不新增物品种类的任务，保留稀有、种子及计划物资',
        {capacityLimited:true,...(p.ironman&&deferredSale?{reason:
          '铁人角色不能在玩家市场买卖普通物品；保留库存，请手动整理仓库，暂做不新增物品种类的工作'}:{})});
    }
    if(goal?.temporary||goal?.itemTarget||upgrading)return deferredSale;
    if((mode==='balanced'||goal&&(goal.specialization||mode==='experience'))&&!goal?.upgrade) {
      const enhancement=planEnhancement(data,planner,p,style,{...goal,budget:reserve,
        specialization:mode!=='balanced',mainSkill:goal?.mainSkill??goal?.skill});
      if(enhancement?.intent)return enhancement;
    }
    const upgrade=investment(p,goal,style,reserve);
    if(upgrade)return action({t:'enhance',itemId:upgrade.id,toPlus:1,once:true,worn:upgrade.slot},
      `强化在用装备 · ${data.items[planner.base(upgrade.id)].name} +1`,
      `首级成功率 100%；${upgrade.quote.gold} 金币、${upgrade.quote.shards} 碎片；`+
      `计入碎片价值，预计 ${(upgrade.paybackSeconds/60).toFixed(0)} 分钟回本，保留计划开销`,
      {investment:upgrade});
    return deferredSale;
  }
  return {maintenance,budget,review,investment,investmentBudget,setAutoSell:enabled=>{autoSell=enabled===true;},
    setCapacitySales:enabled=>{capacitySales=enabled===true;}};
}


// Limit orders can rest after a partial fill. Track only orders we submitted;
// inventory removed into escrow is not evidence of a sale or realized income.
function createMarket(data,planner,{now=Date.now,storage=null,autoSell=false,capacitySales=false}={}) {
  const key='deepvein-market-v1',ttl=15000,waitMs=4000,coolMs=30000;
  const reviewMs=1800000,recycleMs=7200000;
  const ironmanReason='铁人角色不支持普通玩家市场交易；保留盈余，请手动整理仓库';
  let saved={players:{}},savedText=null,storageReadable=true;
  let playerId=null,state=null,orders=[],ordersKnown=false,revision=0,taxBp=200,snapshotTick=-Infinity;
  let quotes=new Map(),requests=new Map(),cooldowns=new Map(),lastQuery=-Infinity,lastSync=-Infinity;
  let watched=[],potionWatched=[],watchCursor=0,priorityItem=null;
  let salesEnabled=autoSell===true;
  let capacitySalesEnabled=capacitySales===true;
  let need=null,recentOwned=[],reviewOrderId=null,status=salesEnabled?
    '市场优先；挂售至少 2 小时并重新定价后才回收':'自动出售已关闭，物品留给玩家处理';
  const persist=()=>{
    if(!storageReadable)return false;
    try {const text=JSON.stringify(saved);storage?.setItem(key,text);savedText=text;return true;} catch {return false;}
  };
  const quantity=(p,id)=>(p.bank[id]??0)+(p.overflow?.[id]??0)+
    p.pack.filter(i=>i.itemId===id).reduce((n,i)=>n+i.qty,0);
  const valid=n=>Number.isSafeInteger(n)&&n>0;
  const tradable=id=>valid(id)&&id===planner.base(id)&&data.items[id]&&id!==data.coinId&&
    ![294,295,296,297].includes(id)&&(data.items[id].value>0||id===70);
  const action=(intent,label,reason='')=>({intent,label,reason});
  const wait=reason=>({...action(null,'市场比价',reason),marketWaiting:true});
  const defer=reason=>{status=reason;return {...action(null,'市场出售待处理',reason),marketDeferred:true};};
  const natural=p=>!p.route||p.route.phase==='toBank';
  const matching=(order,intent)=>order.itemId===intent.itemId&&
    order.side===(intent.t==='marketBuy'?'buy':'sell')&&order.price===intent.price&&
    order.qtyTotal===intent.qty;
  const ownMatch=(order,owned)=>order.id===owned.id&&order.itemId===owned.itemId&&
    order.side===owned.side&&order.price===owned.price&&order.qtyTotal===owned.qtyTotal;
  function playerState(id) {
    const record=saved.players[id]??={owned:{},attempt:null,income:0,spent:0,fillKeys:[]};
    record.sales??={};record.potionPurchases??=[];
    return record;
  }
  function refresh() {
    if(!storage)return;
    try {
      const text=storage.getItem(key)??null;
      if(text!==savedText) {
        const value=JSON.parse(text??'null');
        if(value!==null&&!value?.players)throw new Error('Invalid market ledger');
        saved=value??{players:{}};savedText=text;
        if(playerId!==null)state=playerState(playerId);
      }
      storageReadable=true;
    } catch {storageReadable=false;}
  }
  function select(p) {
    // A passive tab also receives snapshots. Adopt the shared ledger before
    // writing so it cannot erase another tab's orders or spending commitment.
    refresh();
    if(playerId===p.id)return;
    playerId=p.id;state=playerState(playerId);
    orders=[];ordersKnown=false;revision=0;quotes=new Map();requests=new Map();cooldowns=new Map();
    watched=[];potionWatched=[];watchCursor=0;priorityItem=null;
    lastQuery=-Infinity;lastSync=-Infinity;need=null;recentOwned=[];reviewOrderId=null;snapshotTick=-Infinity;taxBp=200;
    if(state.attempt){state.attempt.revision=-1;state.attempt.reviewSale=false;}
  }
  function receive(frame) {
    if(!Array.isArray(frame?.m))return;
    refresh();
    const fillOccurrences=new Map();
    for(const message of frame.m) {
      if((message.t==='welcome'||message.t==='snapshot')&&message.you?.id!=null) {
        const p=message.you;
        if(!Number.isFinite(frame.tick)||!Number.isFinite(p.lastTick)||!Number.isFinite(p.coins)||
          !Number.isFinite(p.x)||!Number.isFinite(p.y)||!p.bank||typeof p.bank!=='object'||!Array.isArray(p.pack))continue;
        select(message.you);
        if(frame.tick<Math.max(snapshotTick,state.snapshotTick??-Infinity))continue;
        snapshotTick=frame.tick;state.snapshotTick=frame.tick;
        // After a disconnect, disappearance plus new stock cannot prove that
        // the stock came from this cancellation rather than later production.
        if(message.t==='welcome'&&state.attempt?.reviewSale){state.attempt.reviewSale=false;persist();}
        let changed=false;
        for(const [id,sale]of Object.entries(state.sales)) {
          if(state.attempt?.intent.t==='marketSell'&&state.attempt.intent.itemId===Number(id))continue;
          const stock=quantity(p,Number(id));
          if(stock===sale.stock)continue;
          sale.qty=Math.min(stock,Math.max(0,sale.qty-Math.max(0,(sale.stock??stock)-stock)));
          sale.stock=stock;
          if(!sale.qty)delete state.sales[id];
          changed=true;
        }
        if(changed)persist();
        if(Number.isFinite(message.marketTaxBp))taxBp=Math.max(0,Math.min(10000,message.marketTaxBp));
        if(Array.isArray(message.orders)) {
          orders=message.orders.filter(o=>valid(o.id)&&valid(o.itemId)&&valid(o.price)&&valid(o.qtyTotal)&&
            valid(o.qtyRemaining)&&['buy','sell'].includes(o.side));
          ordersKnown=true;revision++;
          for(const [id,owned]of Object.entries(state.owned)) {
            if(!orders.some(o=>ownMatch(o,owned))) {
              recentOwned.push({...owned,removedAt:now()});delete state.owned[id];
            }
          }
          persist();
        }
      } else if(message.t==='marketDepth'&&requests.has(message.itemId)&&!(frame.tick<snapshotTick)) {
        const rows=list=>(Array.isArray(list)?list:[]).filter(r=>valid(r.price)&&r.price<=1e9&&valid(r.qty));
        quotes.set(message.itemId,{at:now(),bids:rows(message.bids),asks:rows(message.asks),
          trades:rows(message.trades).filter(r=>Number.isFinite(r.tick))});
        requests.delete(message.itemId);
      } else if(message.t==='marketFilled'&&state&&valid(message.qty)&&Number.isFinite(message.coins)) {
        const signature=JSON.stringify(message),occurrence=fillOccurrences.get(signature)??0;
        fillOccurrences.set(signature,occurrence+1);
        const intent=state.attempt?.intent;
        const pending=intent&&intent.itemId===message.itemId&&
          (intent.t==='marketBuy'?'buy':intent.t==='marketSell'?'sell':null)===message.side;
        recentOwned=recentOwned.filter(o=>now()-o.removedAt<ttl);
        const owned=[...Object.values(state.owned),...recentOwned]
          .filter(o=>o.itemId===message.itemId&&o.side===message.side);
        const other=orders.some(o=>o.itemId===message.itemId&&o.side===message.side&&
          !state.owned[o.id]&&!pending);
        if((pending||owned.length===1)&&!other) {
          // The reviewed envelope has only tick, optional command ack a, and m;
          // there is no fill id. Preserve equal legs within one frame, while an
          // exact replay is ignored. Identical separate frames with the same
          // tick/ack remain ambiguous, so we conservatively do not count twice.
          const fillKey=JSON.stringify([frame.tick,frame.a??null,message,occurrence]);
          if(state.fillKeys.includes(fillKey))continue;
          state.fillKeys.push(fillKey);state.fillKeys=state.fillKeys.slice(-50);
          if(message.side==='sell')state.income+=Math.max(0,message.coins-(message.tax??0));
          else state.spent+=Math.max(0,message.coins);
          if(pending)state.attempt.filled=Math.min(intent.qty,(state.attempt.filled??0)+message.qty);
          persist();
        }
      }
    }
  }
  function query(p) {
    select(p);
    if(p.ironman)return null;
    if((!ordersKnown||state.attempt)&&now()-lastSync>=5000) {
      lastSync=now();return {t:'resync'};
    }
    if(state.attempt||now()-lastQuery<1500)return null;
    for(const [itemId,request]of requests)if((request.background||request.potionBackground)&&
      request.sentAt!=null&&now()-request.sentAt>=waitMs) {
      requests.delete(itemId);cooldowns.set(itemId,now()+coolMs);
    }
    for(const [itemId,request]of requests)if(request.sentAt==null) {
      request.sentAt=now();lastQuery=now();return {t:'marketDepth',itemId};
    }
    if([...requests.values()].some(request=>request.sentAt!=null&&now()-request.sentAt<waitMs))return null;
    if(!slots(p))return null;
    const priorityQuote=quotes.get(priorityItem);
    if(priorityItem!==null&&!hasOrder(priorityItem)&&(cooldowns.get(priorityItem)??0)<=now()&&
      (!priorityQuote||now()-priorityQuote.at>=8000)) {
      requests.set(priorityItem,{at:now(),sentAt:now(),background:true});lastQuery=now();
      return {t:'marketDepth',itemId:priorityItem};
    }
    const background=[...watched.map(itemId=>({itemId,potion:false})),...potionWatched.map(itemId=>({itemId,potion:true}))];
    for(let n=0;n<background.length;n++) {
      const {itemId,potion}=background[watchCursor++%background.length],current=quotes.get(itemId);
      if((cooldowns.get(itemId)??0)>now()||hasOrder(itemId)||current&&now()-current.at<(potion?8000:ttl))continue;
      requests.set(itemId,{at:now(),sentAt:now(),...(potion?{potionBackground:true}:{background:true})});lastQuery=now();
      return {t:'marketDepth',itemId};
    }
    return null;
  }
  function watch(p,itemIds,priorityItemId=null) {
    select(p);
    if(!salesEnabled){setAutoSell(false);return;}
    watched=p.ironman?[]:[...new Set(itemIds.filter(tradable))].slice(0,32);
    watchCursor%=watched.length||1;
    priorityItem=watched.includes(priorityItemId)?priorityItemId:null;
    for(const [id,request]of requests)if(request.background&&!watched.includes(id))requests.delete(id);
  }
  function watchPotions(p,itemIds) {
    select(p);
    potionWatched=p.ironman?[]:[...new Set(itemIds.filter(id=>POTIONS.some(potion=>potion.itemId===id)&&tradable(id)))].slice(0,8);
    for(const [id,request]of requests)if(request.potionBackground&&!potionWatched.includes(id))requests.delete(id);
  }
  function opportunity(p,itemId,qty) {
    select(p);
    if(p.ironman||!salesEnabled)return null;
    if(!tradable(itemId)||!valid(qty)||state.attempt||!slots(p)||hasOrder(itemId)||
      (cooldowns.get(itemId)??0)>now())return null;
    const book=quotes.get(itemId);
    if(!book||now()-book.at>=ttl)return watched.includes(itemId)?{pending:true}:null;
    // Value only new output that the current buyers could absorb after all
    // existing stock. Asking prices and escrow never count as earned income.
    const floor=Math.max(1,Math.floor(data.items[itemId].value*.4));
    let stock=quantity(p,itemId),remaining=qty,net=0;
    for(const bid of [...book.bids].sort((a,b)=>b.price-a.price)) {
      const old=Math.min(stock,bid.qty),take=Math.min(remaining,bid.qty-old);
      const proceeds=take*bid.price-Math.floor(take*bid.price*taxBp/10000);
      if(take>0&&proceeds<=floor*take)continue;
      stock-=old;remaining-=take;net+=proceeds;
      if(!remaining)return {net,qty};
    }
    return null;
  }
  function quote(id) {
    if((cooldowns.get(id)??0)>now())return {fallback:true};
    const current=quotes.get(id);
    if(current&&now()-current.at<ttl)return current;
    if(!requests.has(id))requests.set(id,{at:now(),sentAt:null});
    else {requests.get(id).background=false;requests.get(id).potionBackground=false;}
    if(requests.get(id).sentAt!=null&&now()-requests.get(id).sentAt>=waitMs) {
      requests.delete(id);cooldowns.set(id,now()+coolMs);return {fallback:true};
    }
    return {waiting:true};
  }
  function atBank(p,intent,label,critical=false) {
    if(!critical&&!natural(p))return action(null,'市场交易待返仓','先完成当前任务，再处理盈余订单');
    if(!planner.nearBank(p)) {
      const distance=b=>Math.max(Math.abs(p.x-b.x),Math.abs(p.y-b.y));
      const bank=[...data.banks].sort((a,b)=>distance(a)-distance(b))[0];
      return action({t:'walk',...bank.approach},'市场交易 · 前往仓库',label);
    }
    if(p.route||p.path?.length)return action({t:'clearRoute'},'交易前停止路线并确认库存',label);
    return action(intent,label);
  }
  function slots(p) {
    return ordersKnown&&orders.length<(p.marketOrderSlots??10)&&Object.keys(state.owned).length<3;
  }
  const hasOrder=id=>orders.some(o=>o.itemId===id);
  function listedQuantity(p,itemId) {
    select(p);
    return ordersKnown?orders.filter(o=>o.itemId===itemId&&o.side==='sell')
      .reduce((sum,o)=>sum+o.qtyRemaining,0):null;
  }
  function sale(p,vendorPlan,goal=null,profession='magic') {
    select(p);
    if(p.ironman)return defer(ironmanReason);
    const capacitySale=capacitySalesEnabled&&vendorPlan?.capacitySale===true;
    if(!salesEnabled&&!capacitySale)return defer('自动出售已关闭，物品留给玩家处理');
    const scoped=result=>capacitySale?{...result,capacitySale:true}:result;
    const intent=vendorPlan?.intent;
    if(intent?.t!=='marketDump')return vendorPlan;
    if(!tradable(intent.itemId))return defer('未确认可交易，保留物品');
    const id=intent.itemId;
    if(state.attempt)return defer('交易结果待确认，保留盈余并继续练级');
    if(!ordersKnown)return defer('等待同步市场订单，保留盈余并继续练级');
    if(hasOrder(id))return defer('同类物品已有订单，等待成交并继续练级');
    if(!slots(p))return defer('挂单槽暂满，保留盈余并继续练级');
    if((cooldowns.get(id)??0)>now())return defer('市场短暂冷却，稍后重新报价');
    const book=quote(id);
    if(book.waiting)return defer('查询买单与挂售价，等待期间继续练级');
    if(book.fallback)return defer('报价暂不可用，保留盈余并稍后重试');
    const previous=state.sales[id];
    const protectedQty=goal?.itemTarget?inventoryBudget(data,planner,p,goal).items[id]??0:0;
    const worn=Object.values(p.equipment??{}).filter(itemId=>itemId===id).length;
    const safeQty=Math.min(intent.qty,p.bank[id]??0,previous?.qty??1000000,1000000,
      Math.max(0,quantity(p,id)+worn-protectedQty));
    if(safeQty<=0)return defer('暂无可出售的已确认盈余');
    const net=(price,qty)=>price*qty-Math.floor(price*qty*taxBp/10000);
    const bid=[...book.bids].sort((a,b)=>b.price-a.price).find(row=>
      net(row.price,Math.min(safeQty,row.qty))>intent.floor*Math.min(safeQty,row.qty));
    if(bid&&safeQty>0) {
      status='优先成交税后高于系统回收的买单';
      return scoped(atBank(p,{t:'marketSell',itemId:id,qty:Math.min(safeQty,bid.qty),price:bid.price},
        `市场出售 · ${data.items[id].name}，单价 ${bid.price}`));
    }
    if(previous?.listedMs>=recycleMs&&previous.rounds>=2) {
      status='本批挂售已满 2 小时并重新定价，剩余物品转系统回收';
      return scoped({...vendorPlan,intent:{...intent,qty:safeQty},label:`长期未售出 · ${data.items[id].name} × ${safeQty}，系统回收`,
        reason:`累计挂售 ${Math.floor(previous.listedMs/60000)} 分钟、${previous.rounds} 轮；最新买单无更高税后收益，仅回收本批剩余盈余`});
    }
    const prices=[...book.asks.map(row=>row.price),...book.trades.filter(row=>
      row.tick<=p.lastTick&&(p.lastTick-row.tick)*data.tickMs<=600000).map(row=>row.price)];
    const minimum=Math.floor(intent.floor/(1-taxBp/10000))+1;
    const reference=prices.length?Math.min(...prices):intent.floor*2;
    const price=Math.max(minimum,previous?Math.min(reference,Math.floor(previous.price*.9)):reference);
    const qty=Math.min(safeQty,100);
    if(valid(price)&&price<=1e9&&net(price,qty)>intent.floor*qty) {
      status='市场挂卖；每 30 分钟顺路复核降价，累计至少 2 小时才回收';
      return scoped(atBank(p,{t:'marketSell',itemId:id,qty,price},
        `${previous?'市场重新定价':'市场挂卖'} · ${data.items[id].name} × ${qty}，单价 ${price}`,false));
    }
    return defer('没有税后高于回收价的合法挂售价，保留物品');
  }
  function purchase(p,itemId,qty,goal=null,profession='magic') {
    select(p);
    if(p.ironman||!tradable(itemId)||!valid(qty)||state.attempt)return null;
    need={itemId,qty,at:now()};
    const listed=orders.find(o=>o.itemId===itemId&&o.side==='sell'&&state.owned[o.id]);
    if(listed){reviewOrderId=null;return atBank(p,{t:'marketCancel',orderId:listed.id},'撤回自有挂单 · 当前制作需要',true);}
    if(!slots(p)||hasOrder(itemId)||(cooldowns.get(itemId)??0)>now())return null;
    const book=quote(itemId);
    if(book.waiting)return wait('查询当前缺口的卖盘，比较采购筹币时间与自制经验');
    if(book.fallback)return null;
    const ask=[...book.asks].sort((a,b)=>a.price-b.price)[0];if(!ask)return null;
    const available=Math.max(0,p.coins-(goal?.budget?.coins??0));
    const amount=Math.min(qty,ask.qty,Math.floor(available/ask.price),1000000);if(amount<1)return null;
    const rate=planner.coinRate?.(p),cost=amount*ask.price;
    if(!(rate>0)||!Number.isFinite(rate))return null;
    const bankDistance=Math.min(...data.banks.map(b=>Math.max(Math.abs(p.x-b.approach.x),Math.abs(p.y-b.approach.y))));
    const seconds=cost/rate+2*bankDistance*data.tickMs/1000;
    const self=planner.acquireEstimate?.(p,itemId,amount,profession);
    if(!self||seconds>(goal?.horizon??1800))return null;
    const job=data.jobs.find(j=>j.id===(goal?.recipeId??goal?.recipes?.[goal?.skill]));
    const tool=job&&Object.entries(data.toolSkills).find(([,skill])=>skill===job.skill)?.[0];
    const work=job&&workEstimate(data,job,planner.levels(p)[job.skill],
      {toolBonus:planner.equipmentStats(p.equipment[tool])?.bonus??0,quick:p.perks?.quick??0,hands:p.perks?.hands??0});
    const xpRate=goal?.rate?.xp??(work?work.xp/work.seconds:0);
    // Buying saves time but sacrifices the experience self-production earns.
    if((self.xp??0)>0&&!(xpRate>0))return null;
    if(Number.isFinite(self.seconds)&&!(seconds+(xpRate>0?(self.xp??0)/xpRate:0)<self.seconds))return null;
    status=`按当前缺口采购，预计筹币及往返 ${Math.ceil(seconds)} 秒`;
    return atBank(p,{t:'marketBuy',itemId,qty:amount,price:ask.price},
      `按需采购 · ${data.items[itemId].name} × ${amount}`,true);
  }
  function potionBudgetSpent() {
    if(!state)return 0;
    state.potionPurchases=state.potionPurchases.filter(entry=>now()-entry.at<3600000);
    return state.potionPurchases.reduce((sum,entry)=>sum+entry.cost,0);
  }
  function restockPotion(p,itemId,goal=null,desiredQty=1) {
    select(p);
    if(p.ironman||goal?.itemTarget&&goal.targetItemId===itemId||!valid(desiredQty)||!POTIONS.some(potion=>potion.itemId===itemId)||!tradable(itemId)||state.attempt||
      !planner.nearBank(p)||p.route||p.path?.length||p.enhance||p.held||p.raidHeld||p.queue?.length||
      !slots(p)||hasOrder(itemId)||
      (cooldowns.get(itemId)??0)>now())return null;
    const reserve=goal?.budget?.items?.[itemId]??0,coins=goal?.budget?.coins??0;
    const missing=Math.min(20,desiredQty)-Math.max(0,quantity(p,itemId)-reserve);
    if(missing<=0)return null;
    const limit=Math.min(3000,Math.floor(Math.max(0,p.coins-coins-1000)*.01));
    const spent=potionBudgetSpent();
    if(limit<=spent||!persist())return null;
    const book=quote(itemId);
    if(book.waiting||book.fallback)return null;
    const ask=[...book.asks].sort((a,b)=>a.price-b.price)[0];
    if(!ask||ask.price>data.items[itemId].value*3||ask.price+spent>limit)return null;
    const qty=Math.min(missing,ask.qty,Math.floor((limit-spent)/ask.price));
    if(!valid(qty))return null;
    return {...action({t:'marketBuy',itemId,qty,price:ask.price},`顺路补药 · ${data.items[itemId].name} × ${qty}`,
      `每瓶 ${ask.price} 金币，本批 ${qty*ask.price}；近一小时已承诺 ${spent}，当前额度 ${limit}；保留任务预算与 1000 金币`),
      consumablePurchase:true,potionRestock:{desiredQty,coins,reserve}};
  }
  function issued(before,intent,plan=null) {
    select(before);
    if(before.ironman&&['marketBuy','marketSell','marketCancel','marketDump'].includes(intent.t))return false;
    if(intent.t==='marketDump') {
      // Consume this batch's allowance before submission. An uncertain result
      // must not authorize recycling newly produced stock after a refresh.
      delete state.sales[intent.itemId];persist();
      return;
    }
    if(!['marketBuy','marketSell','marketCancel'].includes(intent.t)||state.attempt)return plan?.consumablePurchase?false:undefined;
    if(plan?.consumablePurchase) {
      const restock=plan.potionRestock;
      if(intent.t!=='marketBuy'||!restock||!valid(intent.qty)||!valid(intent.price))return false;
      const current=restockPotion(before,intent.itemId,
        {budget:{coins:restock.coins,items:{[intent.itemId]:restock.reserve}}},restock.desiredQty);
      if(!current||current.intent.price!==intent.price||current.intent.qty<intent.qty)return false;
    }
    const cancelled=intent.t==='marketCancel'?state.owned[intent.orderId]:null;
    const order=cancelled&&orders.find(o=>ownMatch(o,cancelled));
    const itemId=intent.itemId??cancelled?.itemId;
    state.attempt={intent:{...intent},at:now(),baselineIds:orders.map(o=>o.id),revision,
      cancelledOrder:order?{...cancelled,qtyRemaining:order.qtyRemaining}:cancelled,
      capacitySale:plan?.capacitySale===true,
      reviewSale:!!cancelled&&reviewOrderId===intent.orderId,
      before:{id:before.id,coins:before.coins,quantity:itemId?quantity(before,itemId):0},filled:0};
    if(plan?.consumablePurchase&&intent.t==='marketBuy') {
      // Reserve the full submitted amount before sending. Rejection or escrow
      // cancellation cannot turn a rolling spending limit into a retry loop.
      potionBudgetSpent();state.potionPurchases.push({at:now(),cost:intent.price*intent.qty});
      if(!persist()) {state.potionPurchases.pop();state.attempt=null;return false;}
      return true;
    }
    persist();
  }
  function confirmed(before,p,intent) {
    select(p);const attempt=state.attempt;
    if(!attempt||JSON.stringify(attempt.intent)!==JSON.stringify(intent))return false;
    if(intent.t==='marketCancel')return ordersKnown&&revision>attempt.revision&&
      !orders.some(o=>o.id===intent.orderId);
    const fresh=ordersKnown&&revision>attempt.revision;
    if(fresh&&orders.filter(o=>!attempt.baselineIds.includes(o.id)&&matching(o,intent)).length===1)return true;
    if((attempt.filled??0)>=intent.qty)return true;
    return fresh&&intent.t==='marketBuy'&&quantity(p,intent.itemId)-attempt.before.quantity>=intent.qty&&
      p.coins<attempt.before.coins;
  }
  function settled(p,intent) {
    select(p);const attempt=state.attempt;
    if(!attempt||!confirmed(null,p,intent))return;
    if(intent.t==='marketCancel') {
      const owned=state.owned[intent.orderId]??attempt.cancelledOrder;
      if(owned) {
        cooldowns.set(owned.itemId,now()+coolMs);
        if(owned.side==='sell') {
          const returned=Math.min(attempt.cancelledOrder?.qtyRemaining??0,
            Math.max(0,quantity(p,owned.itemId)-attempt.before.quantity));
          if(attempt.reviewSale&&returned>0)state.sales[owned.itemId]={qty:returned,stock:quantity(p,owned.itemId),price:owned.price,
            listedMs:(owned.listedMs??0)+Math.max(0,attempt.at-owned.at),rounds:owned.rounds??1,capacitySale:owned.capacitySale===true};
          else delete state.sales[owned.itemId];
        }
      }
      delete state.owned[intent.orderId];
    } else {
      const created=orders.filter(o=>!attempt.baselineIds.includes(o.id)&&matching(o,intent));
      const previous=intent.t==='marketSell'?state.sales[intent.itemId]:null;
      if(created.length===1)state.owned[created[0].id]={...created[0],at:attempt.at,
        listedMs:previous?.listedMs??0,rounds:(previous?.rounds??0)+1,capacitySale:attempt.capacitySale===true};
      if(intent.t==='marketSell')delete state.sales[intent.itemId];
      quotes.delete(intent.itemId);requests.delete(intent.itemId);
    }
    state.attempt=null;persist();
  }
  function next(p,goal=null) {
    select(p);
    if(p.ironman){status=ironmanReason;return null;}
    if(state.attempt) {
      if(confirmed(null,p,state.attempt.intent))settled(p,state.attempt.intent);
      else {status='交易结果待确认，暂不重发；继续自给';return null;}
    }
    if(!ordersKnown)return null;
    let deferredCancel=null;
    for(const owned of Object.values(state.owned)) {
      const order=orders.find(o=>ownMatch(o,owned));if(!order)continue;
      if((cooldowns.get(order.itemId)??0)>now())continue;
      if(order.side==='sell'&&!salesEnabled&&!(capacitySalesEnabled&&owned.capacitySale===true)) {
        reviewOrderId=null;
        const cancel=atBank(p,{t:'marketCancel',orderId:order.id},'自动出售已关闭，撤回脚本挂单');
        if(cancel.intent)return cancel;
        deferredCancel??=cancel;continue;
      }
      const reserves=goal?.itemTarget?inventoryBudget(data,planner,p,goal).items:goal?.budget?.items;
      const needed=(reserves?.[order.itemId]??0)>quantity(p,order.itemId)||
        (need?.itemId===order.itemId&&now()-need.at<ttl);
      if(order.side==='buy'||needed||now()-owned.at>=reviewMs) {
        reviewOrderId=order.side==='sell'&&!needed?order.id:null;
        return atBank(p,{t:'marketCancel',orderId:order.id},order.side==='buy'?
          '撤销采购余单，释放剩余金币':needed?'撤回自有挂单 · 当前计划需要':'复核市场挂单，撤回余量后重新定价',
          order.side==='buy'||needed);
      }
    }
    return deferredCancel;
  }
  function setAutoSell(enabled) {
    salesEnabled=enabled===true;
    if(!salesEnabled) {
      watched=[];priorityItem=null;watchCursor=0;reviewOrderId=null;
      for(const [id,request]of requests)if(request.background)requests.delete(id);
    }
    status=salesEnabled?'市场优先；挂售至少 2 小时并重新定价后才回收':'自动出售已关闭，物品留给玩家处理';
  }
  function setCapacitySales(enabled) {capacitySalesEnabled=enabled===true;}
  function rejected(code) {
    refresh();
    const known=['not-at-bank','price-changed','not-tradable','too-many-orders','cannot-afford',
      'below-floor','nothing-to-sell','no-such-order','storage-full','bank-full','pack-full',
      'nothing-to-deposit','nothing-to-withdraw','nothing-to-eat','cannot-enhance','cannot-fight',
      'cannot-set-route','cannot-wield','cannot-equip','level-too-low'];
    if(!state?.attempt||!known.includes(code))return;
    const intent=state.attempt.intent,owned=state.owned[intent.orderId];
    const id=intent.itemId??owned?.itemId;
    if(id!=null){cooldowns.set(id,now()+coolMs);quotes.delete(id);requests.delete(id);}
    state.attempt=null;status='市场暂不可用，短暂冷却后再比价';persist();
  }
  const summary=()=>`${status}；成交净收入 ${state?.income??0}，采购支出 ${state?.spent??0}，自有挂单 ${Object.keys(state?.owned??{}).length}；近一小时补药承诺 ${potionBudgetSpent()}`;
  return {receive,next,sale,purchase,restockPotion,potionBudgetSpent,query,watch,watchPotions,opportunity,listedQuantity,issued,confirmed,settled,rejected,summary,setAutoSell,setCapacitySales};
}


function measurementKeys(data,p,level) {
  const job=data.jobs.find(j=>j.id===p.route?.jobId),zone=data.zones.find(z=>z.id===p.route?.zoneId);
  const routeKey=p.route?.errand?null:zone?`combat:${zone.monsterId}`:job&&!job.grow?`job:${job.id}`:null;
  const skills=zone?['melee','ranged','magic','defence','hitpoints']:job?[job.skill]:[];
  return {routeKey,equipmentKey:JSON.stringify(Object.keys(p.equipment).sort().map(k=>[k,p.equipment[k]])),
    levelsKey:JSON.stringify(skills.map(s=>[s,level(p.skills[s])])),buffKey:buffKey(data,p)};
}

class Telemetry {
  constructor(data,level) {
    this.data=data;this.level=level;this.previous=null;this.dirty=false;this.playerId=null;
    this.totalXp=0;this.netCoins=0;this.activeSeconds=0;this.idleSeconds=0;this.rates={};
  }
  command(intent) {if(intent.t!=='resync')this.dirty=true;}
  receive(frame) {
    // Receipts can follow their snapshot in the same frame. Inspect the whole
    // frame before observing it; unrelated rewards must not calibrate a route.
    if(frame.m.some(m=>m.t==='marketFilled'||m.t==='streak'||
      m.t==='batch'&&m.e?.some(e=>e.kind==='achievement'||e.kind==='boxOpened')||
      m.t==='chat'&&['The Deep','Deep Vein'].includes(m.name)&&
        /^Your share of the .+: .+ — on your shelf at the depot\.$/.test(m.text??'')))this.dirty=true;
  }
  observe(p,now,{reset=false}={}) {
    if(this.playerId!==null&&this.playerId!==p.id){
      this.totalXp=0;this.netCoins=0;this.activeSeconds=0;this.idleSeconds=0;this.rates={};
    }
    this.playerId=p.id;
    const keys=measurementKeys(this.data,p,this.level);
    const base=id=>id%this.data.plusScale%this.data.rarityScale;
    const foodUnits=Object.entries(p.bank).reduce((n,[id,qty])=>n+(this.data.items[base(+id)]?.heals?qty:0),0)+
      p.pack.reduce((n,i)=>n+(this.data.items[base(i.itemId)]?.heals?i.qty:0),0);
    const current={...keys,id:p.id,at:now,skills:{...p.skills},coins:p.coins,
      enhancing:!!p.enhance,achievementCount:Object.keys(p.achievements??{}).length,
      foodUnits,kills:Object.values(p.tally?.monsters??{}).reduce((n,k)=>n+k,0),
      traveling:p.activity==='walking'||!!p.path?.length||['toBank','toSite'].includes(p.route?.phase),
      busy:!!(p.enhance||p.path?.length||p.activity==='walking'||p.activity==='working'||(!p.activity&&p.route))};
    const before=this.previous;this.previous=current;
    const seconds=before?(now-before.at)/1000:0;
    if(reset||!before||before.id!==p.id||seconds<=0||seconds>45){this.dirty=false;return;}
    const xp=Object.fromEntries(this.data.skills.map(s=>[s,p.skills[s]-before.skills[s]]));
    if(Object.values(xp).some(n=>n<0)){this.dirty=false;return;}
    this.totalXp+=Object.values(xp).reduce((a,b)=>a+b,0);this.netCoins+=p.coins-before.coins;
    if(before.busy)this.activeSeconds+=seconds;else this.idleSeconds+=seconds;
    if(!this.dirty&&before.achievementCount===current.achievementCount&&!current.enhancing&&!before.enhancing&&keys.routeKey&&before.routeKey===keys.routeKey&&
      before.equipmentKey===keys.equipmentKey&&before.levelsKey===keys.levelsKey&&before.buffKey===keys.buffKey){
      let rate=this.rates[keys.routeKey];
      if(!rate||rate.equipmentKey!==keys.equipmentKey||rate.levelsKey!==keys.levelsKey||rate.buffKey!==keys.buffKey)
        rate=this.rates[keys.routeKey]={...keys,seconds:0,xp:0,coins:0,samples:0,foodUsed:0,kills:0,travelSeconds:0};
      const skills=JSON.parse(keys.levelsKey).map(([s])=>s);
      rate.seconds+=seconds;rate.xp+=skills.reduce((sum,s)=>sum+xp[s],0);
      rate.coins+=p.coins-before.coins;rate.samples++;rate.updatedAt=now;
      if(keys.routeKey.startsWith('combat:')){
        rate.foodUsed+=Math.max(0,before.foodUnits-current.foodUnits);
        rate.kills+=Math.max(0,current.kills-before.kills);
      }
      if(before.traveling)rate.travelSeconds+=seconds;
      rate.xpPerSecond=rate.xp/rate.seconds;rate.coinsPerSecond=rate.coins/rate.seconds;
      rate.foodPerHour=rate.foodUsed*3600/rate.seconds;rate.secondsPerKill=rate.kills?rate.seconds/rate.kills:null;
    }
    this.dirty=false;
  }
  summary() {
    const seconds=this.activeSeconds+this.idleSeconds;
    return {playerId:this.playerId,totalXp:this.totalXp,netCoins:this.netCoins,activeSeconds:this.activeSeconds,
      idleSeconds:this.idleSeconds,xpPerHour:seconds?this.totalXp*3600/seconds:0,
      coinsPerHour:seconds?this.netCoins*3600/seconds:0,rates:this.rates};
  }
  restore(saved) {
    if(!saved||typeof saved!=='object')return;
    if(Number.isInteger(saved.playerId))this.playerId=saved.playerId;
    for(const key of ['totalXp','netCoins','activeSeconds','idleSeconds'])
      if(Number.isFinite(saved[key])&&(key==='netCoins'||saved[key]>=0))this[key]=saved[key];
    // Rate calibration is session-local: saved values may predate updated game data.
    this.previous=null;this.rates={};
  }
}

// Protocol and prediction evidence: research/world-boss-mechanics.md.
const copy=v=>v==null?v:JSON.parse(JSON.stringify(v));
const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
const same=(a,b)=>JSON.stringify(sorted(a))===JSON.stringify(sorted(b));
const wait=reason=>({label:'世界 Boss',reason});
const action=(intent,reason)=>({intent,label:'世界 Boss',reason});
const point=p=>Number.isInteger(p?.x)&&Number.isInteger(p?.y);
function savedTask(p){
  const r=p.route;
  if(r.questId!==undefined)return {kind:'quest',questId:r.questId};
  if(r.zoneId!==null)return {kind:'zone',zoneId:r.zoneId,limit:r.limit};
  return {kind:'job',siteId:r.siteId,jobId:r.jobId,onFull:r.onFull,limit:r.limit,rarity:p.workRarity??0};
}

function createWorldBoss(data,now=()=>Date.now()){
  let boss=null,run=null,external=false,externalUntil=null,ignored=null,lastDeath=null,lastResult=null;
  let tick=0,received=now(),fresh=false,playerId=null,snapshotAt=0,visibleBossId=null,observationSince=now();
  const currentTick=()=>tick+Math.max(0,now()-received)/(data.tickMs??600);
  const recentActivity=()=>fresh&&run?.stage==='fighting'&&Number.isFinite(run.lastActivityAt)&&
    now()>=run.lastActivityAt&&now()-run.lastActivityAt<=30000;
  const key=b=>b?`${b.name}:${b.until??`entity:${b.id}`}`:null;
  const ownQueue=p=>!!run&&p.id===run.playerId&&!!run.expectedQueue&&
    p.held===true&&p.raidHeld===true&&!p.route&&same(p.queue??[],run.expectedQueue);
  function acceptSaved(p){
    if(run?.savedConfirmed)return ownQueue(p);
    if(!run?.expectedQueue||p.id!==run.playerId||p.route||!p.held||!p.raidHeld)return false;
    const actual=p.queue??[],expected=run.expectedQueue;
    if(actual.length!==expected.length||!same(actual.slice(1),expected.slice(1)))return false;
    const head=actual[0],before=expected[0];
    if(!head)return false;
    if(before.limit===null&&head.limit!==null)return false;
    if(before.limit!==null&&Number.isFinite(before.limit)&&
      (!Number.isFinite(head.limit)||head.limit<=0||head.limit>before.limit))return false;
    if(!same({...head,limit:before.limit},before))return false;
    run.expectedQueue=copy(actual);run.savedConfirmed=true;return true;
  }
  function recordResult(reason){
    if(run)lastResult={name:run.name,attackSent:run.attackSent??null,hit:run.hit===true,
      reason:run.reason??reason??'角色已返回工作或原任务状态已改变，结束本轮接管',endedAt:run.endedAt??now()};
  }
  function finish(){recordResult();if(run)ignored=run.key;run=null;}
  function end(reason){
    if(!run||['ended','resuming'].includes(run.stage))return;
    run.stage='ended';run.reason=reason;run.endedAt=now();
  }
  function cancel(reason='调度暂停或玩家接管，结束本轮自动参与'){
    recordResult(reason);
    if(run){
      ignored=run.key;external=external||['attacking','fighting','dead'].includes(run.stage);
      if(external)externalUntil=run.until??externalUntil;
    }
    run=null;
  }
  function observe(frame){
    if(!frame||!Array.isArray(frame.m)||!Number.isFinite(frame.tick)||frame.tick<tick)return;
    const fightingAtStart=run&&['attacking','fighting','dead'].includes(run.stage)?run.playerId:null;
    // A snapshot can restore work before the same frame delivers our final hit.
    if(run&&['attacking','fighting'].includes(run.stage)&&
      !frame.m.some(m=>m.t==='bossRose'&&key(m)!==run.key)&&
      frame.m.some(m=>m.t==='raidHit'&&m.damage>0))run.hit=true;
    tick=frame.tick;received=now();
    for(const m of frame.m){
      if(m.t==='welcome'){
        boss=null;fresh=false;visibleBossId=null;observationSince=now();
        if(run)run.lastActivityAt=null;
        if(externalUntil===null)external=false;
        if(run&&m.you?.id!==run.playerId){run=null;ignored=null;external=false;lastDeath=null;}
      }
      if((m.t==='welcome'||m.t==='snapshot')&&m.you){
        if(playerId!==null&&m.you.id!==playerId)lastResult=null;
        playerId=m.you.id;snapshotAt=now();
        if(run&&m.you.id!==run.playerId){run=null;ignored=null;external=false;lastDeath=null;}
        if(run&&m.you.route&&!m.you.held&&!m.you.raidHeld&&run.stage!=='saving')finish();
      }
      if(m.t==='bossRose'&&point(m)&&typeof m.name==='string'&&Number.isFinite(m.until)){
        const previous=boss;
        const sameRound=previous?.name===m.name&&(previous.until==null||previous.until===m.until);
        if(!sameRound)visibleBossId=null;
        boss={name:m.name,x:m.x,y:m.y,until:m.until,id:sameRound?previous.id:null};fresh=true;
        const promoted=previous?.name===boss.name&&previous.until==null;
        if(promoted&&ignored===key(previous))ignored=key(boss);
        if(promoted&&external)externalUntil=boss.until;
        if(run&&run.until==null&&run.name===boss.name){run.until=boss.until;run.key=key(boss);}
        if(run&&run.key!==key(boss))end('本轮世界 Boss 已结束');
        if(previous&&!promoted&&key(previous)!==key(boss))external=false;
      }
      if(m.t==='enter'&&m.player?.kind==='boss'&&point(m.player)&&typeof m.player.name==='string'){
        const b=m.player;
        if(!(b.hpRemaining<=0)){
          boss={name:b.name,x:b.x,y:b.y,id:b.id,until:boss?.name===b.name?boss.until:null};fresh=true;
          visibleBossId=b.id;
          if(run&&run.name===b.name&&run.until!=null)boss.until=run.until;
        }
      }
      if(m.t==='move'&&boss?.id!=null&&m.id===boss.id&&point(m)){
        boss.x=m.x;boss.y=m.y;
      }
      if(m.t==='leave'&&m.id===visibleBossId)visibleBossId=null;
      if(m.t==='bossGone'||m.t==='bossHp'&&m.hpRemaining===0&&boss){
        boss=null;fresh=false;external=false;visibleBossId=null;
        if(run)end('Boss 已结束，等待原生恢复原任务');
      }
      if(m.t==='raidHit'||m.t==='raidRejoined'){
        if(run&&['attacking','fighting'].includes(run.stage)){
          run.stage='fighting';run.lastActivityAt=now();if(m.damage>0)run.hit=true;
        }else if(!run&&(m.t==='raidRejoined'||external||boss||ignored===null)){
          // A late hit from our finished round is not proof of a new unbounded raid.
          external=true;externalUntil=boss?.until??null;
        }
      }
      if(m.t==='bossStruck'&&m.died===false&&run&&['attacking','fighting'].includes(run.stage)){
        run.stage='fighting';run.lastActivityAt=now();
      }
      const died=m.t==='bossStruck'&&m.died===true||m.t==='batch'&&
        m.e?.some(e=>e.kind==='died'&&e.keptPack===true);
      if(died){
        if(run&&['attacking','fighting','dead'].includes(run.stage)||fightingAtStart!==null){
          lastDeath={playerId:run?.playerId??fightingAtStart,tick:frame.tick};
          if(run){if(run.stage!=='ended')run.stage='dead';run.deathTick=frame.tick;}
        }else if(!run)external=false;
      }
    }
  }
  function next(p){
    if(!p)return null;
    if(external&&externalUntil!==null&&currentTick()>=externalUntil){external=false;externalUntil=null;}
    if(run&&p.id!==run.playerId){finish();return null;}
    if(run){
      if(run.expectedQueue&&!run.savedConfirmed&&run.stage!=='saving'&&!acceptSaved(p)){
        if(now()-run.sentAt<=15000)return wait('本轮已结束，仍在核对服务器保留的原任务');
        return {...wait('原任务保存未获确认，已停止自动操作；请检查游戏队列后再开始'),blocked:true};
      }
      if(run.expectedQueue&&run.stage!=='saving'&&!ownQueue(p)){
        // Native restoration or a player edit always wins over our saved copy.
        finish();return null;
      }
      if(!run.expectedQueue&&(p.route||p.queue?.length||p.held)){finish();return null;}
      if(run.stage==='saving'){
        if(acceptSaved(p)){run.stage='ready';run.progressAt=now();run.position={x:p.x,y:p.y};}
        else if(!p.route&&p.held&&(p.raidHeld||!same(p.queue??[],run.beforeQueue))){finish();return null;}
        else if(now()-run.sentAt>15000)return {...wait('原任务保存未获确认，已停止自动操作；请检查游戏队列后再开始'),blocked:true};
        else return wait('等待服务器确认原任务和玩家队列已完整保留');
      }
      if(run.until!=null&&currentTick()>=run.until&&run.stage!=='ended'&&run.stage!=='resuming')
        end('本轮 Boss 已到期，等待原生恢复');
      if(run.stage==='ended'||run.stage==='resuming'){
        if(!run.expectedQueue){finish();return null;}
        if(run.stage==='resuming')return now()-run.sentAt>20000?
          {...wait('原任务恢复未获确认，已停止重发；请检查游戏队列后再开始'),blocked:true}:
          wait('已请求恢复原队首任务，等待服务器确认');
        if(now()-run.endedAt<6000||snapshotAt<=run.endedAt)return wait(run.reason);
        if(ownQueue(p))return action({t:'startQueued',index:0},'原生尚未恢复，续跑已核对的原任务；其余队列顺序不变');
        finish();return null;
      }
      if(!fresh)return wait('等待服务器重新确认本轮 Boss 状态');
      if(run.stage==='dead')return wait('本轮 Boss 已阵亡并保留贡献，不再返场；等待原生恢复');
      if(run.stage==='fighting')return wait(recentActivity()?
        run.hit?'近期收到参战回报，已命中 Boss':'近期收到参战回报，等待有效命中':
        run.hit?'曾命中 Boss，等待新的参战回报':'曾确认加入 Boss，等待新的参战回报');
      if(run.stage==='attacking'){
        if(now()-run.sentAt>20000)return action({t:'leaveWorldBoss'},'参战未获确认，停止本轮尝试并恢复原任务');
        return wait('已请求参战，等待服务器命中或参战确认');
      }
      if(!boss||key(boss)!==run.key){end('本轮 Boss 信息已变化');return wait(run.reason);}
      if(distance(p,boss)<=3)return action({t:'attackWorldBoss'},'已到达 Boss，使用当前装备参与本轮');
      if(!same(run.position,{x:p.x,y:p.y})){
        run.position={x:p.x,y:p.y};run.progressAt=now();run.walkAttempts=0;
      }
      if(now()-run.progressAt>60000||now()-run.startedAt>360000)
        return action({t:'leaveWorldBoss'},'赶路未推进或超时，放弃本轮并恢复原任务');
      if(run.stage==='moving'){
        const changed=run.destination&&distance(run.destination,boss)>3;
        const stopped=snapshotAt>run.sentAt&&now()-run.sentAt>=5000&&!p.path?.length&&p.activity!=='walking';
        if(!changed&&!stopped)return wait('正在前往世界 Boss，保留玩家原队列');
        if((run.walkAttempts??0)>=3)return action({t:'leaveWorldBoss'},'重新赶路仍未推进，结束本轮并恢复原任务');
      }
      return action({t:'walk',x:boss.x,y:boss.y},'前往服务器公布的 Boss 出生位置');
    }
    if(external||p.raidHeld)return wait('玩家正在参加世界 Boss，助手不接管也不收菜打断');
    if(!fresh||!boss||ignored===key(boss))return null;
    const remaining=boss.until==null?null:boss.until-currentTick(),steps=Math.max(0,distance(p,boss)-3);
    if(remaining!==null&&remaining<Math.max(15,steps*2+10))return null;
    if(remaining===null&&steps>0)return null;
    if(p.route?.errand||p.enhance||p.held||!p.route&&(p.path?.length||p.activity==='walking'||p.queue?.length))return null;
    if(p.route)return action({t:'setAside',raid:true},'临时保留当前任务的剩余份额和原队列，再参加世界 Boss');
    return distance(p,boss)<=3?action({t:'attackWorldBoss'},'使用当前装备参加世界 Boss'):
      action({t:'walk',x:boss.x,y:boss.y},'前往世界 Boss；不增加或覆盖玩家队列');
  }
  function issued(intent,p,reason){
    if(!intent||!p)return;
    if(!run&&['setAside','walk','attackWorldBoss'].includes(intent.t)&&boss&&fresh){
      lastResult=null;
      run={key:key(boss),name:boss.name,until:boss.until,playerId:p.id,stage:'ready',
        startedAt:now(),startTick:p.lastTick,sentAt:now(),progressAt:now(),position:{x:p.x,y:p.y},
        beforeQueue:copy(p.queue??[]),expectedQueue:null,hit:false,attackSent:false,lastActivityAt:null};
      if(intent.t==='setAside'&&intent.raid&&p.route)run.expectedQueue=[savedTask(p),...copy(p.queue??[])];
    }
    if(!run)return;
    run.sentAt=now();
    if(intent.t==='setAside')run.stage='saving';
    if(intent.t==='walk'){
      run.stage='moving';run.destination={x:intent.x,y:intent.y};run.walkAttempts=(run.walkAttempts??0)+1;
    }
    // issued precedes the socket send: this records a join request, not acceptance.
    if(intent.t==='attackWorldBoss'){run.stage='attacking';run.attackSent=true;}
    if(intent.t==='leaveWorldBoss')end(reason??'已停止本轮，等待原生恢复原任务');
    if(intent.t==='startQueued')run.stage='resuming';
  }
  function manualAction(intent){
    if(!intent)return;
    if(intent.t==='attackWorldBoss'){cancel();external=true;externalUntil=boss?.until??externalUntil;return;}
    if(intent.t==='leaveWorldBoss'){cancel();external=false;ignored=key(boss);return;}
    if(['queue','unqueue','moveQueued'].includes(intent.t)){cancel();ignored=key(boss);return;}
    if(['walk','setRoute','fight','clearRoute','setAside','startQueued','skip','enhance'].includes(intent.t)){
      cancel();external=false;ignored=key(boss);
    }
  }
  function retryNativeJoin(p){
    if(!run||run.stage!=='fighting'||run.nativeJoinRetried||!fresh||!boss||key(boss)!==run.key||
      visibleBossId==null||visibleBossId!==boss.id||!p||p.id!==run.playerId||!(p.hp>0)||distance(p,boss)>3||
      run.until!=null&&currentTick()>=run.until)return false;
    const quietSince=Math.max(observationSince,run.lastActivityAt??observationSince);
    if(now()-quietSince<=30000)return false;
    if(run.expectedQueue?!(run.savedConfirmed&&ownQueue(p)):(p.route||p.queue?.length||p.held))return false;
    run.nativeJoinRetried=true;run.stage='ready';return true;
  }
  return {
    observe,next,issued,manualAction,cancel,retryNativeJoin,
    ownsRun:()=>!!run,
    ownsQueue:p=>run?.expectedQueue&&!run.savedConfirmed?acceptSaved(p):ownQueue(p),
    ownsDeath:value=>lastDeath?.playerId===playerId&&lastDeath.tick===(typeof value==='number'?value:value?.tick),
    status:()=>({name:boss?.name??run?.name??null,phase:run?.stage??(external?'manual':'watching'),
      hit:run?.hit??false,recentActivity:recentActivity()===true,lastActivityAt:run?.lastActivityAt??null,
      owned:!!run,until:boss?.until??run?.until??null,lastResult:copy(lastResult)}),
    save:()=>copy({v:1,boss,run,external,externalUntil,ignored,lastDeath,playerId,lastResult}),
    restore(value){
      if(value?.v!==1)return;
      boss=null;fresh=false;visibleBossId=null;observationSince=now();
      external=value.external===true;ignored=typeof value.ignored==='string'?value.ignored:null;
      externalUntil=Number.isFinite(value.externalUntil)?value.externalUntil:null;
      playerId=value.playerId??null;lastDeath=value.lastDeath??null;
      const result=value.lastResult;
      lastResult=result&&typeof result.name==='string'&&typeof result.reason==='string'&&
        Number.isFinite(result.endedAt)&&(result.attackSent===null||typeof result.attackSent==='boolean')&&
        typeof result.hit==='boolean'?copy(result):null;
      const r=value.run;
      if(r&&Number.isFinite(r.playerId)&&typeof r.key==='string'&&Number.isFinite(r.startedAt)&&
        ['ready','saving','moving','attacking','fighting','dead','ended','resuming'].includes(r.stage)&&
        Array.isArray(r.beforeQueue)&&(r.expectedQueue===null||Array.isArray(r.expectedQueue)))run=copy(r);
    }
  };
}


// State-dependent refusals in the reviewed client sr() message table. Unknown
// codes remain a stop, not an invitation to replay a command.
const STATE_REFUSALS=new Set(['not-at-bank','bank-full','storage-full','pack-full',
  'nothing-to-sell','nothing-to-deposit','nothing-to-withdraw','nothing-to-eat','cannot-afford',
  'cannot-enhance','cannot-fight','cannot-set-route','cannot-wield','cannot-equip','level-too-low']);
const MARKET_ACTIONS=new Set(['marketBuy','marketSell','marketCancel']);
const MARKET_REFUSALS=new Set([...STATE_REFUSALS,'not-tradable','too-many-orders','price-changed','below-floor','no-such-order']);
// The helper sends no guild commands. These reviewed codes belong to the
// game's guild UI, which shares our connection. Revisit if guild automation is added.
const GUILD_REFUSALS=new Set(['guild-name','guild-tag','guild-name-taken','guild-tag-taken',
  'guild-already-in','guild-not-in','guild-no-such-player','guild-full','guild-rank','guild-not-invited',
  'guild-leader-cannot-leave','guild-self','guild-not-material','guild-not-tradable','guild-bank-full','guild-short','guild-room-full']);
function isGuildRefusal(code) {return GUILD_REFUSALS.has(code);}
const ROUTE_STOPS=new Set(['noMaterials','storageFull','unreachable','levelTooLow','noSuchSite']);
const quantity=(p,id)=>(p.bank[id]??0)+(p.overflow?.[id]??0)+p.pack.filter(i=>i.itemId===id).reduce((n,i)=>n+i.qty,0);
const equipmentProject=goal=>goal?.upgrade?.priority||goal?.toolUpgrade?.upgrade?.priority;

function validPlayer(p, skills) {
  return p && skills.every(s=>Number.isFinite(p.skills?.[s])&&p.skills[s]>=0) &&
    Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.coins)&&Number.isFinite(p.hp)&&
    p.bank && typeof p.bank==='object' && Array.isArray(p.pack) && p.equipment &&
    p.pack.every(i=>Number.isInteger(i.itemId)&&Number.isFinite(i.qty)) &&
    (p.route===null || (p.route&&typeof p.route==='object'));
}

function acknowledged(before, p, intent, data=null) {
  switch (intent.t) {
    case 'setRoute': return (p.route?.jobId===intent.jobId &&
      (intent.errand?p.route.errand===true:p.route?.siteId===intent.siteId)) ||
      (intent.errand && (JSON.stringify(p.plots??{})!==JSON.stringify(before.plots??{}) || p.skills.farming>before.skills.farming)) ||
      (p.lastStop?.jobId===intent.jobId&&p.lastStop.reason==='done'&&p.lastStop.tick>before.lastTick);
    case 'fight': return p.route?.zoneId===intent.zoneId ||
      (p.lastStop?.jobId===null&&p.lastStop.reason==='done'&&p.lastStop.tick>before.lastTick&&
        ['melee','ranged','magic'].some(s=>p.skills[s]>before.skills[s]));
    case 'walk': return Math.max(Math.abs(p.x-intent.x),Math.abs(p.y-intent.y))<=1;
    case 'wear': case 'equipFromBank': return Object.values(p.equipment).includes(intent.itemId);
    case 'deposit': return p.pack.length<before.pack.length || p.pack.length===0;
    case 'withdraw': return p.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)-
      before.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)>=intent.qty &&
      quantity(before,intent.itemId)===quantity(p,intent.itemId);
    case 'depositItem': return before.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)-
      p.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)>=intent.qty &&
      (p.bank[intent.itemId]??0)+(p.overflow?.[intent.itemId]??0)>
      (before.bank[intent.itemId]??0)+(before.overflow?.[intent.itemId]??0);
    case 'eatAt': return p.eatAt===intent.at;
    case 'chooseFood': return (p.foodItemId??0)===intent.itemId;
    case 'carryFood': return p.foodPerTrip===intent.count;
    case 'drink': {
      const kind=POTIONS.find(v=>v.itemId===intent.itemId)?.kind,qty=intent.qty??1;
      return !!kind&&Number.isInteger(qty)&&qty>0&&quantity(before,intent.itemId)-quantity(p,intent.itemId)>=qty&&
        (p.brews?.[kind]??0)>p.lastTick&&
        p.brews[kind]>=Math.max(before.lastTick,before.brews?.[kind]??0)+qty*POTION_TICKS;
    }
    case 'eat': return (p.hp>before.hp||Object.entries(data?foodEffects(data,intent.itemId):{})
      .some(([effect,ticks])=>ticks>0&&(p.brews?.[effect==='fedTicks'?'fed':'rooted']??0)>
        Math.max(p.lastTick,before.brews?.[effect==='fedTicks'?'fed':'rooted']??0))) && (intent.shelf?
      (before.bank[intent.itemId]??0)-(p.bank[intent.itemId]??0):
      before.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)-
      p.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0))>=(intent.qty??1);
    case 'clearRoute': return p.route===null&&!p.path?.length;
    case 'marketDump': return quantity(before,intent.itemId)-quantity(p,intent.itemId)>=intent.qty && p.coins>before.coins;
    case 'vendorBuy': return quantity(p,intent.itemId)-quantity(before,intent.itemId)>=intent.qty && p.coins<before.coins;
    case 'claimQuest': return ['daily','weekly'].some(period=>{
      const stamp=period==='daily'?'day':'week';
      return before.quests?.[stamp]===p.quests?.[stamp]&&
        before.quests?.[period]?.some(q=>q.id===intent.id&&!q.claimed&&q.done>=q.goal)&&
        p.quests?.[period]?.some(q=>q.id===intent.id&&q.claimed===true);
    });
    case 'enhance': return p.enhance?.itemId===intent.itemId || p.skills.enhancing>before.skills.enhancing;
    default: return false;
  }
}

class Trainer {
  constructor(data, planner, send, now=()=>Date.now()) {
    this.data=data; this.planner=planner; this.send=send; this.now=now;
    this.active=false; this.player=null; this.received=0; this.goal=null;
    this.pending=null; this.served={}; this.deferred={}; this.questDeferred={}; this.waitingGoals={}; this.blockedReasons={}; this.sequence=0;
    this.nextSync=0; this.nextAction=0; this.goalSince=0; this.bankedLoad=false;
    this.snapshotSequence=0; this.syncAfter=0; this.lastSync=-Infinity;
    this.message='等待登录后的游戏状态；安装后请刷新游戏';
    this.plan=null; this.history=[]; this.compatible=false;
    this.style='magic';
    this.mode='balanced';
    this.mainTrade='auto';
    this.mainJobId=null;
    this.mainMonsterId=null;
    this.itemTarget=null;
    this.boss=createWorldBoss(data,now);
    this.farmJobId=null;
    this.recovery=null; this.awaitingWelcome=false;
    this.resolution=null;this.progress=null;this.stallCheck=null;this.failures=[];
    this.telemetry=new Telemetry(data,planner.level);this.metrics=this.telemetry.summary();
  }
  log(message) {
    this.history.unshift({time:this.now(),message});
    this.history=this.history.slice(0,8);
    this.message=message;
  }
  pause(reason='已暂停调度，游戏继续当前任务',preserveBoss=false) {
    if(!preserveBoss)this.boss.cancel(reason);
    if(this.player)this.planner.watchPotions?.(this.player,[]);
    this.active=false; this.pending=null; this.recovery=null;this.resolution=null;this.stallCheck=null;this.bankedLoad=false; this.log(reason);
  }
  connectionLost(reason) {
    const resume=!reason&&(this.active||this.recovery);
    const previous=this.recovery??{playerId:this.player?.id,lastTick:this.player?.lastTick};
    this.pause(reason??(resume?'连接已断开，等待游戏自动重连；连上后自动继续':'连接已断开，调度保持暂停'),!!resume);
    this.compatible=false; this.awaitingWelcome=true;
    if (resume) this.recovery=previous;
  }
  setStyle(style) {
    if (!Object.hasOwn(PROFESSIONS,style)||style===this.style) return;
    this.cancelItemTarget();
    this.style=style;
    this.goal=null; this.plan=null; this.served={}; this.deferred={}; this.questDeferred={}; this.waitingGoals={}; this.blockedReasons={};
    this.pause(`已选择${PROFESSIONS[style]}，点击开始重新规划；游戏当前任务仍继续`);
  }
  setMode(mode) {
    const names={balanced:'均衡成长',experience:'经验优先',business:'主业经营',assist:'只收菜＋蹭世界 Boss'};
    if(!Object.hasOwn(names,mode)||mode===this.mode)return;
    this.cancelItemTarget();
    this.mode=mode;this.goal=null;this.plan=null;this.served={};this.deferred={};
    this.questDeferred={};this.waitingGoals={};this.blockedReasons={};
    this.planner.resetSpecialization?.();
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择${names[mode]}，点击开始应用；先完成当前背包或批次`);
  }
  chooseGoal(p) {
    if(this.planner.selectGoal)return this.planner.selectGoal(p,this.served,this.deferred,this.style,this.mode,this.mainTrade,this.mainJobId,this.mainMonsterId);
    return (this.planner.growthChooseGoal??this.planner.chooseGoal)(p,this.served,this.deferred,this.style);
  }
  setMainTrade(mainTrade) {
    if(!Object.hasOwn(MAIN_TRADES,mainTrade)||mainTrade===this.mainTrade)return;
    if(this.itemTarget){this.cancelItemTarget();this.pause('主业已更改，物品目标已取消');}
    this.mainTrade=mainTrade;this.mainJobId=null;this.mainMonsterId=null;this.planner.resetSpecialization?.();
    if(this.mode!=='business')return;
    this.goal=null;this.plan=null;this.served={};this.deferred={};this.questDeferred={};this.waitingGoals={};this.blockedReasons={};
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择主业：${MAIN_TRADES[mainTrade]}，点击开始应用；先完成当前背包或批次`);
  }
  setMainJob(jobId) {
    const job=this.data.jobs.find(j=>j.id===jobId&&j.skill===this.mainTrade&&!j.grow);
    if(jobId!==null&&!job||jobId===this.mainJobId)return;
    this.cancelItemTarget();
    this.mainJobId=jobId;this.planner.resetSpecialization?.();
    if(this.mode!=='business')return;
    this.goal=null;this.plan=null;this.served={};this.deferred={};this.questDeferred={};this.waitingGoals={};this.blockedReasons={};
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择${job?`固定工作：${job.name}`:'自动选择工作'}，点击开始应用；游戏当前任务仍继续`);
  }
  setMainMonster(monsterId) {
    const monster=this.data.monsters.find(m=>m.id===monsterId);
    if(this.mainTrade!=='combat'||monsterId!==null&&!monster||monsterId===this.mainMonsterId)return;
    this.cancelItemTarget();
    this.mainMonsterId=monsterId;this.planner.resetSpecialization?.();
    if(this.mode!=='business')return;
    this.goal=null;this.plan=null;this.served={};this.deferred={};this.questDeferred={};this.waitingGoals={};this.blockedReasons={};
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择${monster?`固定怪物：${monster.name}`:'自动选择怪物'}，点击开始应用；游戏当前任务仍继续`);
  }
  restoreItemTarget(saved) {
    if(saved==null){this.itemTarget=null;return true;}
    const choice=this.planner.itemTargetChoices?.().find(c=>c.itemId===saved.itemId);
    if(!choice||!Number.isSafeInteger(saved.playerId)||saved.playerId<0||
      !Number.isSafeInteger(saved.quantity)||saved.quantity<1||saved.quantity>1000000||
      !['pending','running','completed'].includes(saved.status)||
      (saved.status==='pending'?(saved.baseline!=null||saved.required!=null):
        !Number.isSafeInteger(saved.baseline)||saved.baseline<0||!Number.isSafeInteger(saved.required)||
        saved.required!==saved.baseline+saved.quantity))return false;
    this.itemTarget={itemTarget:true,playerId:saved.playerId,itemId:choice.itemId,targetItemId:choice.itemId,
      quantity:saved.quantity,baseline:saved.baseline??null,required:saved.required??null,
      qty:saved.required??null,status:saved.status,listedQty:0,skill:choice.skill};
    return true;
  }
  startItemTarget(itemId,amount) {
    const p=this.player;
    if(!p||!this.compatible){this.log('尚未同步兼容角色，不能开始物品目标');return false;}
    if(this.pending||this.resolution||p.enhance||p.route?.errand||p.held||p.raidHeld||p.queue?.length||
      this.boss.ownsRun()||this.boss.status().phase==='manual') {
      this.log('请等待当前操作、农事或 Boss 结束；物品目标不接管玩家队列或搁置任务');return false;
    }
    if(!this.restoreItemTarget({playerId:p.id,itemId,quantity:amount,baseline:null,required:null,status:'pending'})) {
      this.log('请选择可获取的普通物品，并输入 1 至 1000000 的整数数量');return false;
    }
    this.start(true);this.log('正在同步物品目标起始库存；本次额外获取，已有数量不计入进度');return this.active;
  }
  cancelItemTarget() {
    if(!this.itemTarget)return;
    this.itemTarget=null;
    if(this.goal?.itemTarget)this.goal=null;
    this.plan=null;this.log('物品目标已取消，继续当前批次后按原策略挂机');
  }
  itemTargetStatus() {
    const g=this.itemTarget;if(!g)return null;
    const listed=this.player?.id===g.playerId?this.market?.listedQuantity?.(this.player,g.itemId)??0:0;
    const owned=this.player?.id===g.playerId?quantity(this.player,g.itemId)+
      Object.values(this.player.equipment).filter(id=>id===g.itemId).length+listed:0;
    const completed=g.status==='completed';
    const gained=completed?g.quantity:g.baseline==null?0:Math.max(0,owned-g.baseline);
    return {...g,name:this.data.items[g.itemId]?.name??String(g.itemId),mode:this.mode,
      gained,remaining:Math.max(0,g.quantity-gained),completed};
  }
  manualAction(intent) {
    this.boss?.manualAction(intent,this.player);
    if(this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')return this.pause('检测到手动操作，已暂停调度');
    this.pending=null;this.resolution=null;this.plan=null;
    this.syncAfter=this.snapshotSequence;this.nextSync=0;this.nextAction=this.now()+1500;
    this.log('已让行手动操作；队列由你安排，继续监看收菜与世界 Boss');
  }
  receive(frame) {
    if (!frame || !Array.isArray(frame.m)) return;
    this.telemetry.receive(frame);
    this.market?.receive(frame);
    this.boss.observe(frame);
    const sequence=this.snapshotSequence;
    for (const message of frame.m) {
      if (message.t==='welcome') {
        this.compatible=message.protocol===this.data.protocol;
        if (!this.compatible) this.pause('游戏协议版本不匹配');
      }
      if (message.t==='welcome'||message.t==='snapshot') {
        if (this.awaitingWelcome&&message.t!=='welcome') continue;
        if (!this.awaitingWelcome&&Number.isFinite(this.snapshotTick) && frame.tick<this.snapshotTick) continue;
        if (!validPlayer(message.you,this.data.skills)) {
          this.pause('游戏状态格式发生变化，已暂停'); continue;
        }
        if(this.player&&message.you.id!==this.player.id) {
          this.waitingGoals={};
          if(this.active)this.pause('角色已变化，请检查后手动开始');
        }
        if(this.active&&message.you.lastStop?.reason==='died'&&message.you.lastStop.tick>(this.player?.lastTick??0)&&
          !this.boss.ownsDeath(message.you.lastStop.tick))
          this.pause('检测到角色死亡，请检查战斗配置后再继续');
        if (this.recovery && (this.recovery.playerId==null||message.you.id!==this.recovery.playerId)) {
          this.pause('重连后的角色已变化，请检查后手动开始');
        }
        if (this.recovery && (message.offline?.deaths>0 ||
          (message.you.lastStop?.reason==='died'&&message.you.lastStop.tick>this.recovery.lastTick&&
            !this.boss.ownsDeath(message.you.lastStop.tick)))) {
          this.pause('断线期间角色死亡，请检查战斗配置后再继续');
        }
        const first=!this.player;
        if(this.itemTarget&&this.itemTarget.playerId!==message.you.id)this.itemTarget=null;
        const oldRoute=this.player?.route,newRoute=message.you.route;
        if(message.t==='welcome'||this.player?.id!==message.you.id||!newRoute||
          oldRoute?.jobId!==newRoute.jobId||oldRoute?.siteId!==newRoute.siteId||oldRoute?.zoneId!==newRoute.zoneId)
          this.bankedLoad=false;
        else if(this.active&&bankedGatheringLoad(this.data,this.player,message.you))this.bankedLoad=true;
        this.telemetry.observe(message.you,this.now(),{reset:message.t==='welcome'||!!this.recovery||!this.active});
        this.metrics=this.telemetry.summary();this.planner.setMeasurements?.(this.metrics.rates);
        this.awaitingWelcome=false;
        this.player=message.you; this.received=this.now(); this.snapshotTick=frame.tick; this.awaitInitial=false;
        this.planner.enhancementTraining?.observe(this.player);
        this.snapshotSequence++;
        if(this.pending?.intent.t==='walk'){
          const position=`${this.player.x},${this.player.y}`;
          if(this.pending.position&&this.pending.position!==position)this.pending.sentAt=this.now();
          this.pending.position=position;
        }
        if (!this.active&&first) this.message=this.compatible?'已同步，可开始收益规划':'游戏协议版本不匹配';
        if (this.pending && (MARKET_ACTIONS.has(this.pending.intent.t)?
          this.market?.confirmed(this.pending.before,this.player,this.pending.intent):
          acknowledged(this.pending.before,this.player,this.pending.intent,this.data))) {
          const before=this.pending.before;
          if(this.pending.intent.t!=='clearRoute'&&(before.x!==this.player.x||before.y!==this.player.y||
            before.coins!==this.player.coins||JSON.stringify(before.equipment)!==JSON.stringify(this.player.equipment)||
            this.data.skills.some(s=>before.skills[s]!==this.player.skills[s])||
            JSON.stringify(before.pack)!==JSON.stringify(this.player.pack)))this.failures=[];
          if(MARKET_ACTIONS.has(this.pending.intent.t)) {
            this.market.settled(this.player,this.pending.intent);
            if(this.pending.intent.t==='marketBuy'){if(!this.pending.consumablePurchase&&!this.goal?.craftPreparation&&!equipmentProject(this.goal))this.goal=null;this.plan=null;}
          }
          if(this.pending.intent.t==='vendorBuy'){if(!this.goal?.craftPreparation&&!equipmentProject(this.goal))this.goal=null;this.plan=null;}
          this.nextAction=Math.min(this.nextAction,this.pending.sentAt+1000);
          this.log(`已确认：${this.pending.label}`); this.pending=null;this.resolution=null;
        }
        if(this.pending&&['setRoute','fight'].includes(this.pending.intent.t)&&
          ROUTE_STOPS.has(this.player.lastStop?.reason)&&this.player.lastStop.tick>this.pending.before.lastTick&&
          this.player.lastStop.jobId===(this.pending.intent.jobId??null)){
          const reason=this.player.lastStop.reason;
          if(this.fault(`任务结束：${reason}`,`routeStop:${this.pending.intent.jobId??this.pending.intent.zoneId}:${reason}`)){
            if(this.goal&&['unreachable','levelTooLow','noSuchSite'].includes(reason)){
              this.deferred[this.goal.skill]=this.now()+300000;this.goal=null;
            }
            this.pending=null;this.resolution=null;this.nextAction=this.now()+1000;
            this.log(`任务结束：${reason}；按新库存和位置重新规划`);
          }
        }
      }
      if (!this.active&&!this.recovery) continue;
      if (message.t==='error') {
        if(isGuildRefusal(message.code)) {
          this.log(`公会提示：${message.code==='guild-already-in'?'相关角色已在公会中':message.code}；不影响自动练级`);
          continue;
        }
        if(this.active&&this.pending&&MARKET_ACTIONS.has(this.pending.intent.t)&&MARKET_REFUSALS.has(message.code)) {
          this.market?.rejected(message.code);
          this.checkCommand(`市场状态已变化：${message.code}`,message.code);
        } else if(this.active&&this.pending&&STATE_REFUSALS.has(message.code))this.checkCommand(`服务器状态已变化：${message.code}`,message.code);
        else this.pause(`服务器拒绝操作：${String(message.code).slice(0,100)}`);
      }
      if (message.t==='batch' && message.e?.some(e=>e.kind==='died')&&!this.boss.ownsDeath(frame.tick)) this.pause('检测到角色死亡，请检查战斗配置后再继续');
      if (message.t==='batch' && frame.tick>=this.snapshotTick &&
        message.e?.some(e=>['routeStopped','routeResumed','enhanced','enhanceFailed','questDone'].includes(e.kind))) {
        // Completion events are hints; fetch the authoritative state before replanning.
        this.syncAfter=this.snapshotSequence;
        this.nextSync=Math.min(this.nextSync,Math.max(this.now(),this.lastSync+2000));
      }
    }
    if (this.recovery&&this.compatible&&this.snapshotSequence>sequence) {
      this.recovery=null;
      this.start(true);
      if (this.active) this.log('已重新同步同一角色，自动继续调度');
    }
  }
  start(preservePreparation=false) {
    if (!this.player||!this.compatible) return this.log('尚未取得兼容的角色状态，请刷新游戏后重试');
    if ((this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')&&this.player.queue?.length&&!this.boss.ownsQueue(this.player)) return this.log('请先在游戏中清空原有任务队列，再开始自动调度');
    this.active=true; this.recovery=null; this.pending=null;
    if(!preservePreparation||!this.goal?.craftPreparation&&!equipmentProject(this.goal))this.goal=null;
    this.plan=null;
    this.resolution=null;this.progress=null;this.stallCheck=null;this.failures=[];this.bankedLoad=false;
    this.startedAt=this.now(); this.awaitInitial=true;
    this.syncAfter=this.snapshotSequence;
    this.nextSync=0; this.nextAction=0; this.log(this.mode==='assist'?'已开始辅助收菜与世界 Boss；保留你的原任务和队列':`已开始收益规划 + ${PROFESSIONS[this.style]}训练`);
  }
  checkCommand(reason,code=null) {
    if(this.resolution)return;
    this.resolution={sequence:this.snapshotSequence,reason,code};
    this.nextSync=0;this.log(`${reason}；先同步确认，再重新规划`);
  }
  fault(reason,key=reason) {
    if(this.failureKey!==key)this.failures=[];
    this.failureKey=key;
    this.failures=this.failures.filter(t=>this.now()-t<600000);this.failures.push(this.now());
    if(this.failures.length>3){this.pause(`连续恢复仍未成功：${reason}`);return false;}
    return true;
  }
  issue(plan) {
    if((this.mode!=='assist'||this.goal?.itemTarget)&&['walk','setRoute','fight'].includes(plan.intent.t)) {
      const dose=this.planner.consumable?.(this.player,this.goal,this.style,plan);
      if(dose?.intent)plan=dose;
    }
    this.plan=plan;const {intent,label}=plan;
    if((MARKET_ACTIONS.has(intent.t)||intent.t==='marketDump')&&this.market?.issued(this.player,intent,plan)===false) {
      this.message=this.player.ironman?'铁人角色不能执行普通玩家市场交易；保留物品':'补药报价或预算未通过复核，跳过本次购买';return;
    }
    if(['setRoute','fight','walk','clearRoute'].includes(intent.t))this.bankedLoad=false;
    this.pending={intent,label,before:this.player,sentAt:this.now(),consumablePurchase:plan.consumablePurchase===true};
    this.nextAction=this.now()+4000;this.log(`执行：${label}`);this.telemetry.command(intent);
    if(intent.t==='enhance')this.planner.enhancementTraining?.issued(this.player,intent);
    this.send(intent);this.nextSync=Math.min(this.nextSync,this.now()+2000);
  }
  watchProgress(p) {
    if(!p.route&&!p.path?.length){this.progress=null;this.stallCheck=null;return false;}
    const job=this.data.jobs.find(j=>j.id===p.route?.jobId);
    const signature=JSON.stringify([p.x,p.y,p.path,p.route,p.activity,p.actionIndex,p.attemptTicks,p.foeHp,
      p.foeTicks,p.workJobId,p.workSiteId,p.stunUntil,job?p.skills[job.skill]:[p.skills[professionSkill(this.style)],p.skills.defence],
      p.route?.errand?p.plots:null]);
    const routeKey=`${p.route?.jobId??''}:${p.route?.zoneId??''}`;
    if(!this.progress||this.progress.signature!==signature){
      if(this.progress?.routeKey===routeKey)this.failures=[];
      this.progress={signature,routeKey,since:this.now()};this.stallCheck=null;return false;
    }
    // A long recipe or an explicit stun may legitimately take several minutes.
    const budget=Math.max(120000,(job?.baseTicks??0)*this.data.tickMs*4+60000);
    if(this.now()-this.progress.since<budget||p.stunUntil>p.lastTick)return false;
    if(!this.stallCheck){
      this.stallCheck={sequence:this.snapshotSequence};this.syncAfter=this.snapshotSequence;
      this.nextSync=this.now()+15000;this.lastSync=this.now();this.send({t:'resync'});
      this.log('任务长时间没有进展，正在同步核实');return true;
    }
    if(this.snapshotSequence<=this.stallCheck.sequence)return true;
    if(!this.fault('任务停滞',`stall:${routeKey}`))return true;
    this.stallCheck=null;this.progress=null;this.goal=null;
    this.issue({intent:{t:'clearRoute'},label:'停止停滞路线并重新规划'});return true;
  }
  runItemTarget(p) {
    const g=this.itemTarget;
    if(!g||g.status==='completed')return false;
    const listed=p.ironman?0:this.market?.listedQuantity?.(p,g.itemId)??(this.market?.listedQuantity?null:0);
    if(listed===null){this.message='正在同步目标物品的已有挂单，避免撤单被计作新增';return true;}
    g.listedQty=listed;
    const owned=quantity(p,g.itemId)+Object.values(p.equipment).filter(id=>id===g.itemId).length+listed;
    if(g.baseline===null) {
      if(!Number.isSafeInteger(owned)||!Number.isSafeInteger(owned+g.quantity)){this.pause('目标库存数量异常，请检查后重新设置');return true;}
      g.baseline=owned;g.required=owned+g.quantity;g.qty=g.required;g.status='running';
    }
    this.goal=g;
    if(p.route?.errand){this.message='完成本次收获补种后继续物品目标';return true;}
    const enough=owned>=g.required;
    if(enough&&(p.route||p.path?.length)){this.issue({intent:{t:'clearRoute'},label:'目标数量已够，结束本次工作'});return true;}
    // Keep the same project while blocked or waiting for crops. Ordinary daily
    // selection and timed growth rotation must never replace this explicit goal.
    let plan=this.planner.planItemTarget(p,g,this.style,this.bankedLoad);
    const market=this.market?.next(p,g,this.style);
    if(market?.intent){this.issue(market);return true;}
    const maintenance=this.planner.maintenance?.(p,g,this.style,this.mode,this.mainTrade,this.mainJobId,this.mainMonsterId);
    if(maintenance?.intent){this.issue(maintenance);return true;}
    if(maintenance?.marketWaiting||maintenance?.capacityLimited){this.plan=maintenance;this.message=maintenance.reason??maintenance.label;return true;}
    if(Object.values(p.overflow??{}).some(n=>n>0)){this.pause('物品目标等待仓库空间；目标已保留，请整理后继续');return true;}
    if(enough) {
      if(p.pack.length) {
        const bank=[...this.data.banks].sort((a,b)=>Math.max(Math.abs(p.x-a.x),Math.abs(p.y-a.y))-Math.max(Math.abs(p.x-b.x),Math.abs(p.y-b.y)))[0];
        this.issue(this.planner.nearBank(p)?{intent:{t:'deposit'},label:'目标完成前将随身物资存仓'}:
          {intent:{t:'walk',...bank.approach},label:'目标数量已够，返回仓库'});return true;
      }
      g.status='completed';this.goal=null;this.plan=null;this.bankedLoad=false;
      this.log(`物品目标完成：额外获得 ${this.data.items[g.itemId]?.name??g.itemId} ×${g.quantity}，恢复原挂机策略`);return true;
    }
    if(this.watchProgress(p))return true;
    const seedTarget=this.data.jobs.some(j=>j.grow&&j.inputs.some(i=>i.itemId===g.itemId));
    // Target seeds must stay in stock. Other crops may be harvested at a task
    // boundary, but optional farm investment must not displace the item project.
    const harvest=!seedTarget&&!plan.blocked&&plan.intent?.t!=='clearRoute'&&(this.bankedLoad||this.planner.taskBoundary?.(p))?
      this.planner.harvestOnly?.(p):null;
    plan=harvest??plan;
    if(plan.farmJobId)this.farmJobId=plan.farmJobId;
    this.plan=plan;
    if(!plan.intent){this.message=plan.reason??plan.label;return true;}
    this.bankedLoad=false;this.issue(plan);return true;
  }
  tick() {
    if (!this.active&&!this.recovery) return;
    const now=this.now();
    if (this.active&&now-(this.awaitInitial?this.startedAt:this.received)>45000) {
      this.pause('状态同步中；取得新状态后自动继续',true);
      this.recovery={playerId:this.player.id,lastTick:this.player.lastTick}; this.nextSync=0;
    }
    if (this.recovery) {
      if (!this.awaitingWelcome&&now>=this.nextSync) {
        this.nextSync=now+15000; this.send({t:'resync'});
      }
      return;
    }
    if (this.pending && now-this.pending.sentAt>(this.pending.intent.t==='walk'?300000:30000))
      this.checkCommand(`操作未得到确认：${this.pending.label}`);
    // A due periodic sync must not discard a response received since the last one.
    // Background timers can fire less often than the sync interval.
    const ready=!this.awaitInitial&&this.snapshotSequence>this.syncAfter;
    if (now>=this.nextSync) {
      this.syncAfter=this.snapshotSequence; this.nextSync=now+15000; this.lastSync=now;
      this.send({t:'resync'});
    }
    if(this.resolution&&this.snapshotSequence>this.resolution.sequence){
      const pending=this.pending,reason=this.resolution.reason,code=this.resolution.code;
      if(pending&&MARKET_ACTIONS.has(pending.intent.t)) {
        // The market ledger retains an ambiguous attempt across disconnects and
        // reloads. Resume self-supply without replaying that transaction.
        this.pending=null;this.resolution=null;if(!pending.consumablePurchase)this.goal=null;this.plan=null;this.nextAction=now+1000;
        this.log(code?'市场操作未成交，冷却后重新比价；继续常规规划':'交易结果仍待核实，暂停新交易并继续自给任务');
      } else {
        if(pending&&!code&&['enhance','marketDump','vendorBuy','eat','drink'].includes(pending.intent.t)&&
          (this.player.coins!==pending.before.coins||quantity(this.player,pending.intent.itemId)!==quantity(pending.before,pending.intent.itemId)||
            pending.intent.t==='eat'&&this.player.hp!==pending.before.hp))
          return this.pause('消耗型操作结果不明确，已暂停以防重复消耗');
        if(!this.fault(reason,`${pending?.intent.t}:${code??'timeout'}`))return;
        if(this.goal&&(code?.startsWith('cannot-')||code==='level-too-low')){
          this.deferred[this.goal.skill]=now+300000;this.blockedReasons[this.goal.skill]=reason;
        }
        this.pending=null;this.resolution=null;this.goal=null;this.plan=null;this.nextAction=now+1000;
        this.log('已取得新状态，重新选择可执行任务');
      }
    }
    if((this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')&&this.compatible&&!this.awaitInitial&&(ready||this.snapshotSequence>this.syncAfter)) {
      const query=this.market?.query(this.player);
      if(query&&!(query.t==='resync'&&this.lastSync===now)) {
        if(query.t==='resync')this.lastSync=now;
        this.send(query);
      }
    }
    if ((!ready&&this.snapshotSequence<=this.syncAfter)||this.awaitInitial||this.pending||now<this.nextAction) return;
    const p=this.player;
    if(p.enhance) {
      this.plan={intent:null,label:'等待本次强化结果',reason:'强化进行中，完成后继续原任务'};
      this.message=this.plan.reason;return;
    }
    const foodTarget=this.itemTarget&&this.itemTarget.status!=='completed'&&this.data.items[this.itemTarget.itemId]?.heals;
    const targetFoodAtRisk=foodTarget&&(!p.foodItemId||p.foodItemId===this.itemTarget.itemId||
      p.pack.some(i=>i.itemId===this.itemTarget.itemId&&i.qty>0));
    // Native Boss joining can load and consume food outside our supply planner.
    const deferBoss=targetFoodAtRisk&&!this.boss.ownsRun()&&this.boss.status().phase!=='manual';
    const bossPlan=deferBoss?null:this.boss.next(p);
    if(bossPlan) {
      this.plan=bossPlan;this.message=bossPlan.reason??bossPlan.label;
      if(bossPlan.blocked)return this.pause(bossPlan.reason,true);
      if(bossPlan.intent) {
        this.boss.issued(bossPlan.intent,p,bossPlan.reason);this.log(`执行：${bossPlan.label}`);
        this.send(bossPlan.intent);this.nextAction=now+1000;
        this.syncAfter=this.snapshotSequence;this.nextSync=0;
      }
      return;
    }
    if((this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')&&(p.held||p.raidHeld||p.queue?.length))
      return this.pause('检测到玩家队列或搁置任务，保留原队列并暂停成长调度');
    if(this.runItemTarget(p)) {
      if(deferBoss&&this.boss.status().name)this.message+='；本次先保留目标食物，暂缓自动加入 Boss';
      return;
    }
    if(this.mode==='assist') {
      this.plan=this.planner.harvestOnly?.(p)??null;
      if(this.plan?.intent)return this.issue(this.plan);
      this.message=this.plan?.reason??'监看作物与世界 Boss；继续你的原任务和队列';
      return;
    }
    const claim=this.planner.questClaim?.(p,this.style);
    if(claim?.intent)return this.issue(claim);
    if(this.goal?.enhancementProject&&this.goal.enhancement&&
      p.equipment[this.goal.enhancement.slot]!==this.goal.enhancement.itemId&&!p.enhance) {
      this.served.enhancing=++this.sequence;this.goal=null;this.plan=null;
    }
    // Reserve a fixed project's waiting batch before reviewing inventory sales.
    const maintenanceGoal=this.goal??(this.mode==='business'&&(this.mainJobId!=null||this.mainMonsterId!=null)?
      this.waitingGoals[this.mainTrade==='combat'?professionSkill(this.style):this.mainTrade]??this.chooseGoal(p):null);
    const marketPlan=this.market?.next(p,maintenanceGoal,this.style);
    if(marketPlan?.intent)return this.issue(marketPlan);
    const maintenance=this.planner.maintenance?.(p,maintenanceGoal,this.style,this.mode,this.mainTrade,this.mainJobId,this.mainMonsterId);
    if(maintenance?.intent)return this.issue(maintenance);
    if(maintenance?.marketWaiting){this.message=maintenance.reason??maintenance.label;return;}
    if(maintenance?.capacityLimited||maintenance?.priorityGear){
      this.plan=maintenance;
      const dose=this.planner.consumable?.(p,this.goal,this.style,{intent:null});
      if(dose?.intent)return this.issue(dose);
      if(!this.watchProgress(p))this.message=maintenance.reason??maintenance.label;
      return;
    }
    if (Object.values(p.overflow??{}).some(n=>n>0)) return this.pause(maintenance?.reason??'仓库溢出且没有安全可处理的盈余，请检查保留物品');
    if(this.watchProgress(p))return;
    // Let the game's one-off errand finish banking and restoring its saved route.
    if (p.route?.errand && this.data.jobs.some(j=>j.id===p.route.jobId&&j.grow)) {
      this.message='正在收获补种，完成后继续原任务'; return;
    }
    for (const [skill,until] of Object.entries(this.deferred)) if (until<=now) delete this.deferred[skill];
    for (const [key,until] of Object.entries(this.questDeferred)) if (until<=now) delete this.questDeferred[key];
    const goalTimeout=this.goal?.quest?(this.goal.horizon??600)*1000:600000;
    if (this.goal && !equipmentProject(this.goal) && (this.bankedLoad||!this.planner.taskBoundary||this.planner.taskBoundary(p)) &&
      ((this.goal.quest?this.planner.questCompleted(p,this.goal):
        this.planner.level(p.skills[this.goal.skill])>=this.goal.target) || now-this.goalSince>goalTimeout&&!this.goal.craftPreparation ||
        this.goal.specialization&&!p.route&&p.skills[this.goal.skill]>this.goal.startedXp ||
        this.goal.temporary&&!this.deferred[this.goal.mainSkill])) {
      this.served[this.goal.skill]=++this.sequence;
      if(this.goal.quest&&now-this.goalSince>goalTimeout)this.questDeferred[this.goal.quest.key]=now+120000;
      // Allow other skills a turn after a long ingredient-gathering slice.
      if (now-this.goalSince>600000&&!this.goal.rate&&this.goal.fixedRecipeId==null&&this.goal.fixedMonsterId==null)
        this.deferred[this.goal.skill]=now+120000;
      this.goal=null;
    }
    for(let attempt=0;attempt<this.data.skills.length;attempt++) {
      let proposedGoal=null;
      if(!(this.mode==='business'&&(this.mainJobId!=null||this.mainMonsterId!=null))&&this.goal?.quest?.period!=='daily'&&!this.goal?.craftPreparation&&!equipmentProject(this.goal)&&(this.bankedLoad||!this.planner.taskBoundary||this.planner.taskBoundary(p))&&
        this.planner.questRead?.(p).some(q=>!q.claimed&&q.remaining>0)) {
        proposedGoal=this.goal??this.chooseGoal(p);
        const quest=!equipmentProject(proposedGoal)&&!proposedGoal?.craftPreparation&&
          this.planner.questChooseGoal(p,proposedGoal,this.style,this.questDeferred);
        if(quest&&(!this.goal?.quest||quest.quest.period==='daily')){this.goal=quest;this.goalSince=now;}
      }
      for(const [skill,goal]of Object.entries(this.waitingGoals))
        if(this.planner.level(p.skills[skill])>=goal.target)delete this.waitingGoals[skill];
      // Select the foreground project before optional farm investment can take
      // the first turn. Otherwise a low skill may never get a material budget.
      if (!this.goal) {
        this.goal=proposedGoal??this.chooseGoal(p); this.goalSince=now;
        const waiting=this.waitingGoals[this.goal?.skill];
        if(!this.goal?.quest&&!equipmentProject(this.goal)&&waiting?.craftPreparation)this.goal=waiting;
        if(this.goal)delete this.waitingGoals[this.goal.skill];
      }
      // A growing herb crop still belongs to its deferred potion project while
      // another skill is running. Preserve that demand until the project resumes.
      let harvestGoal=this.goal;
      if(Object.keys(this.waitingGoals).length) {
        const items={...this.goal?.budget?.items};
        for(const goal of Object.values(this.waitingGoals))for(const [id,qty]of Object.entries(goal.budget?.items??{}))
          items[id]=Math.max(items[id]??0,qty);
        const farmingTarget=Math.max(this.goal?.farmingTarget??0,...Object.values(this.waitingGoals).map(g=>g.farmingTarget??0));
        harvestGoal={...this.goal,farmingTarget,budget:{...this.goal?.budget,items}};
      }
      const harvest=this.planner.harvest(p,this.farmJobId,harvestGoal,this.style,this.bankedLoad);
      if (!this.goal&&!harvest) {
        this.message=this.mode==='business'&&(this.mainJobId!=null||this.mainMonsterId!=null)?
          this.blockedReasons[this.mainTrade==='combat'?professionSkill(this.style):this.mainTrade]??'固定目标正在等待材料或条件恢复，不自动更换工作':'当前模式暂无可行任务，等待条件变化';
        return;
      }
      const preparation=this.goal?.craftPreparation;
      this.plan=harvest??this.planner.plan(p,this.goal,this.style,this.bankedLoad);
      if(preparation&&this.plan.intent?.t==='setRoute'&&this.plan.intent.jobId===preparation.jobId)
        this.goalSince=now;
      if (this.plan.farmJobId&&!harvest) this.farmJobId=this.plan.farmJobId;
      if (this.plan.deferUntilTick) {
        if(!this.goal){this.message=this.plan.reason;return;}
        this.waitingGoals[this.goal.skill]=this.goal;
        this.deferred[this.goal.skill]=now+Math.max(1000,(this.plan.deferUntilTick-p.lastTick)*this.data.tickMs);
        delete this.blockedReasons[this.goal.skill];
        this.log(this.plan.reason);this.goal=null;continue;
      }
      if (this.plan.blocked) {
        if (Object.values(p.overflow??{}).some(n=>n>0)) return this.pause(this.plan.reason);
        if(!this.goal){this.message=this.plan.reason;return;}
        this.log(`${NAMES[this.goal.skill]}：${this.plan.reason}`);
        this.blockedReasons[this.goal.skill]=this.plan.reason;
        if(this.goal.quest)this.questDeferred[this.goal.quest.key]=now+120000;
        else this.deferred[this.goal.skill]=now+120000;
        this.goal=null;
        continue;
      }
      if (this.goal) delete this.blockedReasons[this.goal.skill];
      const consumable=this.planner.consumable?.(p,this.goal,this.style,this.plan);
      if(consumable?.intent)return this.issue(consumable);
      if(!(harvest?.marketWaiting&&harvest.farmJobId))this.bankedLoad=false;
      if (!this.plan.intent) { this.message=this.plan.combat?this.plan.label:this.plan.reason; return; }
      return this.issue(this.plan);
    }
    this.message='当前候选任务均在等待条件变化';
  }
}

// Informational only: frontend filenames and file hashes never gate startup.
async function checkClient(data, sources, pageUrl) {
  const page=new URL(pageUrl);
  const clients=[data,...(data.compatibleClients??[])];
  const urls=[...new Set(sources.filter(Boolean))].map(src=>new URL(src,page))
    .filter(url=>url.origin===page.origin&&/^\/assets\/index-[\w-]+\.js$/.test(url.pathname));
  const known=urls.find(url=>clients.some(c=>url.pathname===`/assets/${c.client}`));
  if (known) return {ok:true,message:`已核对游戏版本：${known.pathname.split('/').pop()}`};
  return {ok:true,message:urls.length?
    `当前游戏：${urls.map(u=>u.pathname.split('/').pop()).join('、')}；未核对，已跳过版本限制`:
    '未识别游戏文件名；已跳过版本限制'};
}

// Parse public tables as literals. Downloaded game code is never evaluated.
function validateGameData(data) {
  const finite=n=>Number.isFinite(n)&&n>=0;
  const table=(rows,key,check)=>Array.isArray(rows)&&rows.length>0&&rows.length<10000&&
    new Set(rows.map(r=>r?.[key])).size===rows.length&&rows.every(r=>
      r&&Number.isInteger(r[key])&&r[key]>=0&&check(r));
  if(!data||!Array.isArray(data.skills)||!data.skills.includes('magic')||
    !Number.isFinite(data.tickMs)||data.tickMs<=0||!data.items) return false;
  const item=id=>Number.isInteger(id)&&Object.hasOwn(data.items,id);
  if(!Object.values(data.items).every(i=>i&&item(i.id)&&typeof i.name==='string'&&finite(i.value)))return false;
  if(!table(data.jobs,'id',j=>data.skills.includes(j.skill)&&typeof j.name==='string'&&
    finite(j.levelReq)&&j.levelReq>=1&&finite(j.xp)&&finite(j.baseTicks)&&j.baseTicks>0&&
    item(j.output?.itemId)&&finite(j.output.qty)&&j.output.qty>0&&Array.isArray(j.inputs)&&
    j.inputs.every(i=>item(i.itemId)&&finite(i.qty)&&i.qty>0)&&
    (!j.grow||finite(j.grow))&&['burn','caught'].every(k=>!j[k]||
      finite(j[k].chanceAtReq)&&j[k].chanceAtReq<=1&&j[k].safeAtLevel>j.levelReq)))return false;
  if(!table(data.gear,'itemId',g=>item(g.itemId)&&typeof g.slot==='string'&&
    ['accuracy','strength','defence','bonus','luck','speed','levelReq'].every(k=>g[k]===undefined||finite(g[k]))))return false;
  if(!table(data.monsters,'id',m=>typeof m.name==='string'&&
    ['level','hp','maxHit','attack','defence','speed','xp'].every(k=>finite(m[k]))&&m.hp>0&&m.speed>0&&
    (m.dropChance===undefined||finite(m.dropChance)&&m.dropChance<=1)&&
    Array.isArray(m.gold)&&m.gold.length===2&&m.gold.every(finite)&&m.gold[1]>=m.gold[0]&&item(m.drop)))return false;
  const xy=p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0;
  if(!table(data.sites,'id',s=>xy(s)&&Array.isArray(s.jobIds)&&s.jobIds.every(id=>data.jobs.some(j=>j.id===id))))return false;
  if(!table(data.zones,'id',z=>xy(z)&&data.monsters.some(m=>m.id===z.monsterId)))return false;
  if(!table(data.banks,'id',b=>xy(b)&&b.approach&&xy(b.approach)))return false;
  if(data.foodHealingMultipliers&&(!Array.isArray(data.foodHealingMultipliers)||
    data.foodHealingMultipliers.length!==5||!data.foodHealingMultipliers.every(n=>Number.isFinite(n)&&n>0)))return false;
  return ['baseXp','growth','beyondStep','beyondGrowth','speedPerLevelAboveRequirement','journeyLevel']
    .every(k=>finite(data.xp?.[k]))&&data.xp.baseXp>0&&data.xp.growth>=1.001&&
    data.xp.beyondStep>=.001&&data.xp.beyondGrowth>=1.001&&
    Number.isInteger(data.xp.journeyLevel)&&data.xp.journeyLevel>=2&&data.xp.journeyLevel<=2000;
}

function extractGameTables(source, parse, baseline) {
  if(typeof source!=='string'||source.length>6000000)throw new Error('公开数据大小异常');
  const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'});
  const declarations=new Map(),functions=new Map();
  for(const statement of ast.body) {
    if(statement.type==='VariableDeclaration')for(const d of statement.declarations)
      if(d.id.type==='Identifier')declarations.set(d.id.name,d.init);
    if(statement.type==='FunctionDeclaration')functions.set(statement.id.name,statement);
  }
  const keys=node=>node?.type==='ObjectExpression'?node.properties.map(p=>p.key?.name??p.key?.value):[];
  function literal(node,scope={},trail=[]) {
    if(!node||trail.length>40)throw new Error('不支持的数据表达式');
    if(node.type==='Literal')return node.value;
    if(node.type==='Identifier') {
      if(Object.hasOwn(scope,node.name))return scope[node.name];
      if(trail.includes(node.name))throw new Error('循环数据声明');
      return literal(declarations.get(node.name),scope,[...trail,node.name]);
    }
    if(node.type==='ArrayExpression')return node.elements.map(n=>literal(n,scope,trail));
    if(node.type==='ObjectExpression')return Object.fromEntries(node.properties.map(p=>{
      if(p.type!=='Property'||p.computed||p.kind!=='init'||p.method)throw new Error('非静态属性');
      const key=p.key.name??p.key.value;
      if(['__proto__','constructor','prototype'].includes(key))throw new Error('无效属性');
      return [key,literal(p.value,scope,trail)];
    }));
    if(node.type==='UnaryExpression') {
      const n=literal(node.argument,scope,trail);
      if(node.operator==='!')return !n;
      if(node.operator==='-')return -n;
    }
    if(node.type==='BinaryExpression') {
      const a=literal(node.left,scope,trail),b=literal(node.right,scope,trail);
      if(node.operator==='+')return a+b;if(node.operator==='-')return a-b;
      if(node.operator==='*')return a*b;if(node.operator==='/')return a/b;
    }
    if(node.type==='CallExpression'&&node.callee.type==='Identifier') {
      const fn=functions.get(node.callee.name),body=fn?.body.body;
      const result=body?.length===1&&body[0].type==='ReturnStatement'?body[0].argument:null;
      // Cooking's burn descriptor is the only allowed literal constructor.
      if(fn?.params.length===1&&fn.params[0].type==='Identifier'&&node.arguments.length===1&&
        keys(result).length===3&&['itemId','chanceAtReq','safeAtLevel'].every(k=>keys(result).includes(k)))
        return literal(result,{[fn.params[0].name]:literal(node.arguments[0],scope,trail)},[...trail,node.callee.name]);
    }
    throw new Error('公开表包含未知表达式，保留已核对数据');
  }
  function one(required,array=true,exact=false) {
    const matches=[...declarations.values()].filter(node=>{
      const row=array&&node?.type==='ArrayExpression'?node.elements[0]:!array?node:null;
      const names=keys(row);
      return required.every(k=>names.includes(k))&&(!exact||names.length===required.length);
    });
    if(matches.length!==1)throw new Error(`无法唯一识别公开表：${required.join('/')}`);
    return literal(matches[0]);
  }
  const foodArrays=new Set();
  function findHealing(node) {
    if(!node||typeof node!=='object')return;
    if(node.type==='BinaryExpression'&&node.operator==='*'&&node.left.type==='MemberExpression'&&
      (node.left.property.name??node.left.property.value)==='heals'&&node.right.type==='MemberExpression'&&
      node.right.object.type==='Identifier')foodArrays.add(node.right.object.name);
    for(const child of Object.values(node)) {
      if(Array.isArray(child))child.forEach(findHealing);
      else if(child&&typeof child==='object')findHealing(child);
    }
  }
  findHealing(ast);
  if(foodArrays.size>1)throw new Error('无法唯一识别食物品质治疗表');
  const items=Object.fromEntries(one(['id','name','stackable','value']).map(i=>[i.id,i]));
  const banks=one(['id','x','y'],true,true).map(b=>{
    const old=baseline.banks.find(o=>o.id===b.id&&o.x===b.x&&o.y===b.y);
    if(!old)throw new Error('仓库地图变化，需核对寻路数据');
    return {...b,approach:{...old.approach}};
  });
  const updated={...baseline,items,banks,
    jobs:one(['id','name','skill','baseTicks','xp','inputs','output']),
    gear:[...one(['itemId','slot','bonus']),...one(['itemId','slot','accuracy','strength','defence'])],
    sites:one(['id','x','y','kind','jobIds']).filter(s=>s.jobIds.length),
    zones:one(['id','monsterId','x','y','width','height']),
    monsters:one(['id','hp','attack','defence','speed','gold','drop']),
    xp:one(['journeyLevel','baseXp','growth','beyondStep','beyondGrowth','speedPerLevelAboveRequirement'],false),
    toolSkills:one(['pickaxe','rod','axe','gloves','pan','hammer','knife','needle','mortar','hoe'],false,true),
    ...(foodArrays.size?{foodHealingMultipliers:literal(declarations.get([...foodArrays][0]))}:{})
  };
  if(!validateGameData(updated))throw new Error('公开表校验失败，保留已核对数据');
  return updated;
}

async function refreshGameData(data,sources,pageUrl,{fetch:request,parse,storage}={}) {
  const page=new URL(pageUrl),url=sources.filter(Boolean).map(s=>new URL(s,page))
    .find(u=>u.origin===page.origin&&/^\/assets\/index-[\w-]+\.js$/.test(u.pathname));
  if(!url)return {updated:false,message:'未识别公开表入口；使用内置数据，未知内容跳过'};
  const client=url.pathname.split('/').pop(),key='deepvein-public-tables-v1';
  if(client===data.client)return {updated:false,message:`数据已核对：${client}`};
  try {
    const cache=JSON.parse(storage?.getItem(key)||'null');
    if(cache?.client===client&&cache.protocol===data.protocol&&validateGameData(cache))
      return {updated:true,data:cache,message:`已加载本页校验数据：${client}`};
  } catch { /* A damaged cache never prevents a fresh public-data check. */ }
  try {
    const response=await request(url.href,{credentials:'omit',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('官网暂不可读');
    const source=await response.text();
    const updated=extractGameTables(source,parse,data);
    updated.client=client;updated.captured=new Date().toISOString().slice(0,10);
    // Formula constants retain the reviewed baseline; tables are refreshed atomically.
    updated.formulaBaseline=data.formulaBaseline??data.client;
    try{storage?.setItem(key,JSON.stringify(updated));}catch { /* Refresh still applies in this tab. */ }
    return {updated:true,data:updated,message:`配方／装备／怪物表已更新并校验：${client}`};
  } catch(error) {
    return {updated:false,message:`${client} 数据更新暂缓：${error.message}；沿用已核对内容`};
  }
}

function validateIntent(data,p,intent) {
  if(intent.t==='withdraw') {
    const item=data.items[intent.itemId],used=p.pack.reduce((n,i)=>n+(data.items[i.itemId%data.plusScale%data.rarityScale]?.stackable?1:i.qty),0);
    return Number.isInteger(intent.itemId)&&!!item&&intent.qty===1&&(p.bank[intent.itemId]??0)>=1&&
      !p.route&&!p.path?.length&&!p.enhance&&data.banks.some(b=>Math.max(Math.abs(p.x-b.x),Math.abs(p.y-b.y))<=1)&&
      (used<28+(p.perks?.pockets??0)||item.stackable&&p.pack.some(i=>i.itemId===intent.itemId&&i.qty>0));
  }
  if(intent.t==='setAside')return intent.raid===true&&!!p.route&&!p.route.errand&&!p.held&&!p.enhance;
  if(intent.t==='startQueued')return intent.index===0&&p.held===true&&p.raidHeld===true&&!p.route&&!!p.queue?.length;
  if(intent.t==='drink') {
    const carried=p.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0);
    const atBank=data.banks.some(b=>Math.max(Math.abs(p.x-b.x),Math.abs(p.y-b.y))<=1);
    return Number.isInteger(intent.itemId)&&intent.itemId>=220&&intent.itemId<=227&&
      data.jobs.some(j=>j.skill==='herblore'&&j.output.itemId===intent.itemId)&&
      Number.isInteger(intent.qty)&&intent.qty>=1&&intent.qty<=20&&
      intent.qty<=carried+(atBank?(p.bank[intent.itemId]??0):0);
  }
  if(intent.t==='claimQuest')return typeof intent.id==='string'&&['daily','weekly'].some(period=>
    p.quests?.[period==='daily'?'day':'week']===Math.floor(p.lastTick/(86400000/data.tickMs)/(period==='daily'?1:7))&&
    p.quests?.[period]?.some(q=>q.id===intent.id&&!q.claimed&&Number.isInteger(q.goal)&&q.goal>0&&Number.isInteger(q.done)&&q.done>=q.goal));
  if(intent.t==='vendorBuy')return intent.itemId===190&&Number.isInteger(intent.qty)&&
    intent.qty>=1&&intent.qty<=data.farmUnlocks.length&&data.items[190]?.value>0;
  if (['marketDepth','marketBook','marketBuy','marketSell'].includes(intent.t)) {
    const known=Number.isSafeInteger(intent.itemId)&&intent.itemId>0&&
      Object.hasOwn(data.items,intent.itemId%data.plusScale%data.rarityScale);
    if (['marketDepth','marketBook'].includes(intent.t)) return known;
    return known&&Number.isInteger(intent.qty)&&intent.qty>0&&intent.qty<=1000000&&
      Number.isInteger(intent.price)&&intent.price>0&&intent.price<=1000000000&&
      Number.isSafeInteger(intent.qty*intent.price);
  }
  if (intent.t==='marketBooks') return Array.isArray(intent.itemIds)&&intent.itemIds.length>0&&intent.itemIds.length<=64&&
    intent.itemIds.every(itemId=>validateIntent(data,p,{t:'marketBook',itemId}));
  if (intent.t==='marketCancel') return Number.isSafeInteger(intent.orderId)&&intent.orderId>0;
  if(intent.t==='setRoute') {
    const job=data.jobs.find(j=>j.id===intent.jobId),site=data.sites.find(s=>s.id===intent.siteId);
    return !!job&&!!site&&site.jobIds.includes(job.id)&&Number.isInteger(intent.limit)&&intent.limit>=0;
  }
  if(intent.t==='fight')return data.zones.some(z=>z.id===intent.zoneId)&&Number.isInteger(intent.limit)&&intent.limit>=0;
  if(intent.t==='eat')return Number.isInteger(intent.itemId)&&intent.itemId>=0&&intent.itemId<data.plusScale&&
    data.items[intent.itemId%data.rarityScale]?.heals>0&&intent.qty===1&&
    (intent.shelf===undefined||typeof intent.shelf==='boolean');
  if(['wear','equipFromBank','enhance','marketDump'].includes(intent.t)) {
    const base=intent.itemId%data.plusScale%data.rarityScale;
    if(!Object.hasOwn(data.items,base))return false;
    if(intent.t==='marketDump')return intent.itemId===base&&Number.isInteger(intent.qty)&&intent.qty>0&&
      Number.isFinite(intent.floor)&&intent.floor>=Math.max(1,Math.floor(data.items[base].value*.4));
    return data.gear.some(g=>g.itemId===base);
  }
  return true;
}

const SCRIPT_UPDATE_URL='https://raw.githubusercontent.com/ljyoukong-cpu/deepvein-idle-helper/main/deepvein-balanced.meta.js';
const SCRIPT_INSTALL_URL='https://raw.githubusercontent.com/ljyoukong-cpu/deepvein-idle-helper/main/deepvein-balanced.user.js';
const SCRIPT_CDN_ROOT='https://gcore.jsdelivr.net/gh/ljyoukong-cpu/deepvein-idle-helper@main/deepvein-balanced-cdn';

function createUpdateChecker({version,fetch,distribution='github',now=()=>Date.now(),onChange=()=>{}}) {
  const sources=[{updateUrl:SCRIPT_UPDATE_URL,installUrl:SCRIPT_INSTALL_URL},
    {updateUrl:`${SCRIPT_CDN_ROOT}.meta.js`,installUrl:`${SCRIPT_CDN_ROOT}.user.js`}];
  if(distribution==='cdn')sources.reverse();
  const state={checking:false,available:null,installUrl:sources[0].installUrl,message:`当前运行 v${version}，等待检查更新`};
  let attemptedAt=null;
  const newer=(a,b)=>a.split('.').map((n,i)=>Number(n)-Number(b.split('.')[i])).find(n=>n!==0)>0;
  async function check(manual=false) {
    const time=now();
    if(state.checking||(attemptedAt!==null&&time-attemptedAt<(manual?60000:3600000)))return state;
    attemptedAt=time;state.checking=true;onChange();
    try {
      let latest=null;
      for(const candidate of sources) {
        try {
          const response=await fetch(candidate.updateUrl,{credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000)});
          if(!response.ok)throw new Error('update request failed');
          const metadata=await response.text();
          const remote=metadata.match(/^\/\/ @version[ \t]+([^\r\n]+)/m)?.[1].trim();
          const namespace=metadata.match(/^\/\/ @namespace[ \t]+([^\r\n]+)/m)?.[1].trim();
          if(metadata.length>8192||namespace!=='local.deepvein.balanced'||!/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(remote??''))throw new Error('invalid update metadata');
          if(!latest||newer(remote,latest.version))latest={...candidate,version:remote};
          // A reachable mirror can still serve an old cached manifest. Only a
          // upgrade at least as new as the known release can finish early.
          if(newer(remote,version)&&!newer(state.available??version,remote))break;
        } catch { /* The other fixed delivery path may still be reachable. */ }
      }
      if(!latest)throw new Error('all update sources failed');
      if(newer(latest.version,state.available??version))state.available=latest.version;
      if(!state.available||latest.version===state.available)state.installUrl=latest.installUrl;
      state.message=state.available?`发现 v${state.available}；当前运行 v${version}。点击更新，安装后刷新游戏生效。`:
        `当前运行 v${version}，未发现更新；每小时自动检查。`;
    } catch {
      state.message=`检查更新失败，当前 v${version} 继续运行。`+(state.available?`已发现 v${state.available}，可点击更新后刷新游戏。`:'可稍后重试或通过油猴检查更新。');
    } finally {state.checking=false;onChange();}
    return state;
  }
  return {state,check};
}

// Display-only names from the public client's static Chinese dictionary.
// Reviewed 2026-10-01: index-DaUDOU_u.js, SHA-256 900dd4f5f503a7792238920e29e06aef67d29a9be0cca44b12b77b6d340f6bde.
// Keep protocol names and numeric IDs unchanged; unknown future names stay visible.
const GAME_LABELS_ZH={
  // Added pets: native Chinese dictionary in index-B8UTkOtA.js (2026-10-03).
  "Pebble golem": "小石魔像",
  "Baby kraken": "小海妖",
  "Acorn squirrel": "橡果松鼠",
  "Queen bee": "蜂后",
  "Raccoon": "浣熊",
  "Chef rat": "厨师鼠",
  "Ember salamander": "余烬蝾螈",
  "Fletch falcon": "箭羽隼",
  "Toadstool": "毒蘑菇人",
  "Yarn kitten": "毛线小猫",
  "Star fairy": "星辰小仙",
  // Compatibility display names reported in the user's current dropdown.
  "Silk-lined hood": "丝衬兜帽",
  "Linen gloves": "亚麻手套",
  "Abyssal eye": "深渊之眼",
  "Abyssal tonic": "深渊补剂",
  "Ash drake": "灰龙",
  "Ash drake hatchling": "灰龙幼崽",
  "Barrow hound": "冢穴猎犬",
  "Barrow pup": "冢穴幼兽",
  "Bitterroot": "苦根",
  "Bitterroot seed": "苦根种子",
  "Bog pearl": "沼泽珍珠",
  "Bogling": "沼灵",
  "Bogling skin": "沼灵皮",
  "Bogling tadpole": "沼灵蝌蚪",
  "Bogskin chaps": "沼皮护腿",
  "Bogskin coif": "沼皮头巾",
  "Bogskin gloves": "沼皮手套",
  "Bogskin jerkin": "沼皮上衣",
  "Bogskin quiver": "沼皮箭袋",
  "Bone gloves": "骨手套",
  "Bread stall": "面包摊",
  "Bronze axe": "青铜斧",
  "Bronze bar": "青铜锭",
  "Bronze blade": "青铜剑",
  "Bronze greatsword": "青铜大剑",
  "Bronze greaves": "青铜护腿",
  "Bronze hammer": "青铜锤",
  "Bronze helm": "青铜头盔",
  "Bronze hoe": "青铜锄",
  "Bronze knife": "青铜刀",
  "Bronze mortar": "青铜研钵",
  "Bronze needle": "青铜针",
  "Bronze pan": "青铜平底锅",
  "Bronze pickaxe": "青铜镐",
  "Bronze plate": "青铜铠甲",
  "Bronze rod": "青铜钓竿",
  "Bronze shield": "青铜盾",
  "Burnt food": "烧焦的食物",
  "Cairn bone": "石冢骨",
  "Cairn token": "石冢徽记",
  "Cairn wight": "石冢尸灵",
  "Cairn wisp": "石冢幽光",
  "Cave turnip": "洞穴芜菁",
  "Chalk wight": "白垩尸灵",
  "Chalk wightling": "白垩尸灵",
  "Chest of gems": "宝石箱",
  "Chitin chaps": "甲壳护腿",
  "Chitin coif": "甲壳头巾",
  "Chitin gloves": "甲壳手套",
  "Chitin jerkin": "甲壳上衣",
  "Chitin quiver": "甲壳箭袋",
  "Cinder colossus": "灰烬巨像",
  "Cinder ember": "灰烬余火",
  "Coal": "煤炭",
  "Cobalt": "钴蓝",
  "Cobalt axe": "钴斧",
  "Cobalt bar": "钴锭",
  "Cobalt blade": "钴剑",
  "Cobalt greatsword": "钴大剑",
  "Cobalt greaves": "钴护腿",
  "Cobalt hammer": "钴锤",
  "Cobalt helm": "钴头盔",
  "Cobalt hoe": "钴锄",
  "Cobalt knife": "钴刀",
  "Cobalt mortar": "钴研钵",
  "Cobalt needle": "钴针",
  "Cobalt pan": "钴平底锅",
  "Cobalt pickaxe": "钴镐",
  "Cobalt plate": "钴铠甲",
  "Cobalt rod": "钴钓竿",
  "Cobalt shield": "钴盾",
  "Coins": "金币",
  "Colossus blade": "巨像之剑",
  "Colossus chip": "巨像碎片",
  "Colossus core": "巨像核心",
  "Colossus ember": "巨像余烬",
  "Colossus greatsword": "巨像大剑",
  "Colossus greaves": "巨像护腿",
  "Colossus helm": "巨像头盔",
  "Colossus plate": "巨像铠甲",
  "Colossus shield": "巨像之盾",
  "Cook lobster": "烹饪龙虾",
  "Cook salmon": "烹饪三文鱼",
  "Cook sardine": "烹饪沙丁鱼",
  "Cook shark": "烹饪鲨鱼",
  "Cook shrimp": "烹饪虾",
  "Cook swordfish": "烹饪剑鱼",
  "Cook trout": "烹饪鳟鱼",
  "Cook tuna": "烹饪金枪鱼",
  "Cooked lobster": "熟龙虾",
  "Cooked salmon": "熟三文鱼",
  "Cooked sardine": "熟沙丁鱼",
  "Cooked shark": "熟鲨鱼",
  "Cooked shrimp": "熟虾",
  "Cooked swordfish": "熟剑鱼",
  "Cooked trout": "熟鳟鱼",
  "Cooked tuna": "熟金枪鱼",
  "Copper": "铜矿",
  "Cut gem": "切割宝石",
  "Deep horror": "深渊恐魔",
  "Dragonleaf": "龙叶",
  "Dragonleaf seed": "龙叶种子",
  "Drake chaps": "幼龙护腿",
  "Drake coif": "幼龙头巾",
  "Drake hide": "幼龙皮",
  "Drake jerkin": "幼龙上衣",
  "Drake quiver": "幼龙箭袋",
  "Drake scale": "幼龙鳞",
  "Dry sigil": "干枯符印",
  "Dune stalker": "沙丘潜袭者",
  "Elixir of the vein": "矿脉灵药",
  "Ember Wyrm": "余烬飞龙",
  "Ember heart": "余烬之心",
  "Ember pepper": "余烬辣椒",
  "Ember scale": "余烬之鳞",
  "Emberkin": "余烬灵",
  "Emberkin spark": "余烬灵火花",
  "Epic": "史诗",
  "Fen lurker": "沼潜者",
  "Fen lurker spawn": "沼潜者幼体",
  "Frost Leviathan": "霜冻利维坦",
  "Frost troll": "霜巨魔",
  "Frost troll whelp": "霜巨魔幼崽",
  "Fur chaps": "毛皮护腿",
  "Fur coif": "毛皮头巾",
  "Fur jerkin": "毛皮上衣",
  "Fur quiver": "毛皮箭袋",
  "Gatherer's draught": "采集者药剂",
  "Gem pack": "宝石包",
  "Gem stall": "宝石摊",
  "Gilded bolt": "镀金布匹",
  "Gilded grimoire": "镀金魔典",
  "Gilded hood": "镀金兜帽",
  "Gilded loom": "镀金织机",
  "Gilded robe": "镀金长袍",
  "Gilded skirt": "镀金裙",
  "Glowcap": "荧光菇",
  "Glowcap spore": "荧光菇孢子",
  "Gnawed charm": "啃噬护符",
  "Gnawer": "啃噬者",
  "Gnawer pelt": "啃噬者毛皮",
  "Gnawer pup": "啃噬者幼崽",
  "Gold": "金币",
  "Gold amulet": "黄金护符",
  "Gold ring": "黄金戒指",
  "Golden Week gift box": "金秋礼盒",
  "Grave beetle": "墓甲虫",
  "Grave beetle grub": "墓甲虫幼虫",
  "Gravemaw skull": "墓噬者头骨",
  "Haste draught": "急速药剂",
  "Hoard of gems": "宝石堆",
  "Hollow crown": "空心王冠",
  "Homespun bolt": "粗布匹",
  "Homespun hood": "粗布兜帽",
  "Homespun robe": "粗布长袍",
  "Homespun skirt": "粗布裙",
  "Horror ichor": "恐魔脓液",
  "Horror spawn": "恐魔幼体",
  "Horse": "坐骑",
  "Hunter's brew": "猎人酿剂",
  "Husk": "空壳",
  "Husk chitin": "空壳甲壳",
  "Husk grub": "空壳幼虫",
  "Ice wight": "冰尸",
  "Ice wight shard": "冰尸碎片",
  "Ice wight shard-child": "冰尸幼体",
  "Iron": "铁矿",
  "Iron axe": "铁斧",
  "Iron bar": "铁锭",
  "Iron blade": "铁剑",
  "Iron greatsword": "铁大剑",
  "Iron greaves": "铁护腿",
  "Iron hammer": "铁锤",
  "Iron helm": "铁头盔",
  "Iron hoe": "铁锄",
  "Iron knife": "铁刀",
  "Iron mortar": "铁研钵",
  "Iron needle": "铁针",
  "Iron pan": "铁平底锅",
  "Iron pickaxe": "铁镐",
  "Iron plate": "铁铠甲",
  "Iron rod": "铁钓竿",
  "Iron shield": "铁盾",
  "Legendary": "传说",
  "Leviathan amulet": "利维坦护符",
  "Leviathan scale": "利维坦之鳞",
  "Linen grimoire": "亚麻魔典",
  "Linen line": "亚麻织线",
  "Lobster": "龙虾",
  "Logs": "原木",
  "Longbow": "长弓",
  "Magic": "魔法",
  "Magic logs": "魔法原木",
  "Magic longbow": "魔法长弓",
  "Magic shortbow": "魔法短弓",
  "Magic staff": "魔法法杖",
  "Maple": "枫木",
  "Maple logs": "枫木",
  "Maple longbow": "枫木长弓",
  "Maple shortbow": "枫木短弓",
  "Maple staff": "枫木法杖",
  "Meteoric": "陨铁矿",
  "Meteoric amulet": "陨铁护符",
  "Meteoric axe": "陨铁斧",
  "Meteoric bar": "陨铁锭",
  "Meteoric blade": "陨铁剑",
  "Meteoric greatsword": "陨铁大剑",
  "Meteoric greaves": "陨铁护腿",
  "Meteoric hammer": "陨铁锤",
  "Meteoric helm": "陨铁头盔",
  "Meteoric hoe": "陨铁锄",
  "Meteoric knife": "陨铁刀",
  "Meteoric mortar": "陨铁研钵",
  "Meteoric needle": "陨铁针",
  "Meteoric pan": "陨铁平底锅",
  "Meteoric pickaxe": "陨铁镐",
  "Meteoric plate": "陨铁铠甲",
  "Meteoric ring": "陨铁戒指",
  "Meteoric rod": "陨铁钓竿",
  "Meteoric shield": "陨铁盾",
  "Nightshade": "颠茄",
  "Nightshade seed": "颠茄种子",
  "Nourishing draught": "滋养药剂",
  "Oak": "橡木",
  "Oak logs": "橡木",
  "Oak longbow": "橡木长弓",
  "Oak shortbow": "橡木短弓",
  "Oak staff": "橡木法杖",
  "Pelt chaps": "兽皮护腿",
  "Pelt coif": "兽皮头巾",
  "Pelt gloves": "兽皮手套",
  "Pelt jerkin": "兽皮上衣",
  "Pelt quiver": "兽皮箭袋",
  "Pepper seed": "辣椒种子",
  "Potato": "土豆",
  "Potato seed": "土豆种子",
  "Pouch of gems": "宝石袋",
  "Protection scroll": "保护卷轴",
  "Rare": "稀有",
  "Relic stall": "遗物摊",
  "Reliquary vestry": "圣物储藏室",
  "Riftborne heart": "裂生之心",
  "Rime fang": "寒霜之牙",
  "Rimewolf": "霜狼",
  "Rimewolf cub": "霜狼幼崽",
  "Rimewolf fur": "霜狼毛皮",
  "Rock mite": "岩螨",
  "Rock mite nymph": "岩螨若虫",
  "Rough gem": "粗糙宝石",
  "Sage": "鼠尾草",
  "Sage seed": "鼠尾草种子",
  "Salmon": "三文鱼",
  "Sand wraith": "沙之怨灵",
  "Sardine": "沙丁鱼",
  "Scale chaps": "鳞片护腿",
  "Scale coif": "鳞片头巾",
  "Scale gloves": "鳞片手套",
  "Scale jerkin": "鳞片上衣",
  "Scale quiver": "鳞片箭袋",
  "Shark": "鲨鱼",
  "Shortbow": "短弓",
  "Shrimp": "虾",
  "Silk bolt": "丝绸布匹",
  "Silk cart": "丝绸车",
  "Silk grimoire": "丝绸魔典",
  "Silk hood": "丝绸兜帽",
  "Silk robe": "丝绸长袍",
  "Silk skirt": "丝绸裙",
  "Silk stall": "丝绸摊",
  "Silver": "银矿",
  "Silver amulet": "白银护符",
  "Silver ring": "白银戒指",
  "Staff": "法杖",
  "Stalker claw": "潜袭者之爪",
  "Stalker fang": "潜袭者之牙",
  "Stalker kit": "潜袭者幼崽",
  "Steel axe": "钢斧",
  "Steel bar": "钢锭",
  "Steel blade": "钢剑",
  "Steel greatsword": "钢大剑",
  "Steel greaves": "钢护腿",
  "Steel hammer": "钢锤",
  "Steel helm": "钢头盔",
  "Steel hoe": "钢锄",
  "Steel knife": "钢刀",
  "Steel mortar": "钢研钵",
  "Steel needle": "钢针",
  "Steel pan": "钢平底锅",
  "Steel pickaxe": "钢镐",
  "Steel plate": "钢铠甲",
  "Steel rod": "钢钓竿",
  "Steel shield": "钢盾",
  "Stone eater": "食石者",
  "Stone eater pebble": "食石者卵石",
  "Sump crawler": "污水爬行者",
  "Sump crawler hatchling": "污水爬行者幼体",
  "Swift draught": "疾行药剂",
  "Swordfish": "剑鱼",
  "Tin": "锡矿",
  "Tree": "树",
  "Troll chaps": "巨魔护腿",
  "Troll coif": "巨魔头巾",
  "Troll hide": "巨魔皮",
  "Troll jerkin": "巨魔上衣",
  "Troll quiver": "巨魔箭袋",
  "Troll tusk": "巨魔獠牙",
  "Trout": "鳟鱼",
  "Tuna": "金枪鱼",
  "Turnip seed": "芜菁种子",
  "Uncommon": "罕见",
  "Vein Colossus": "矿脉巨像",
  "Vein of gems": "宝石矿脉",
  "Voidmelon": "虚空瓜",
  "Voidmelon seed": "虚空瓜种子",
  "Voidshard": "虚空碎片",
  "Voidweave bolt": "虚织布匹",
  "Voidweave grimoire": "虚织魔典",
  "Voidweave hood": "虚织兜帽",
  "Voidweave robe": "虚织长袍",
  "Voidweave skirt": "虚织裙",
  "Warrior's tonic": "战士补剂",
  "Wight crown": "尸灵王冠",
  "Wightweave grimoire": "尸织魔典",
  "Wightweave hood": "尸织兜帽",
  "Wightweave robe": "尸织长袍",
  "Wightweave skirt": "尸织裙",
  "Willow": "柳木",
  "Willow logs": "柳木",
  "Willow longbow": "柳木长弓",
  "Willow shortbow": "柳木短弓",
  "Willow staff": "柳木法杖",
  "Wraith ash": "怨灵之烬",
  "Wraith dust": "怨灵之尘",
  "Wraith mote": "怨灵微粒",
  "Wyrm ember": "巨龙余烬",
  "Wyrm ring": "巨龙戒指",
  "Yew": "紫杉木",
  "Yew logs": "紫杉木",
  "Yew longbow": "紫杉长弓",
  "Yew shortbow": "紫杉短弓",
  "Yew staff": "紫杉法杖"
};

function gameLabel(name) {
  const text=String(name??'');
  return Object.hasOwn(GAME_LABELS_ZH,text)?GAME_LABELS_ZH[text]:text;
}

const GAME_LABEL_PATTERN=new RegExp('(^|[^A-Za-z0-9_])('+Object.keys(GAME_LABELS_ZH)
  .sort((a,b)=>b.length-a.length)
  .map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?=$|[^A-Za-z0-9_])','g');

function translateGameText(text) {
  return String(text??'').replace(GAME_LABEL_PATTERN,(_,prefix,name)=>prefix+gameLabel(name));
}

// Personal settlement evidence: research/boss-rewards-mechanics.md.
// Original chat ticks survive welcome-history replay and are not frame ticks.
const BOSS_LOOT_EPOCH=Date.UTC(2026,0,1);
const BOSS_LOOT_RECEIPT=/^Your share of the (.+): (.+) — on your shelf at the depot\.$/;

function createBossLootHistory(data,storage) {
  let playerId=null,entries=[],saved=true;
  const storageKey=()=>`deepvein-boss-loot-v1:${playerId}`;
  function receipt(message) {
    if(!message||!['Deep Vein','The Deep'].includes(message.name)||
      typeof message.text!=='string'||message.text.length>4000||
      !Number.isSafeInteger(message.tick)||message.tick<0)return null;
    const match=BOSS_LOOT_RECEIPT.exec(message.text),time=BOSS_LOOT_EPOCH+message.tick*data.tickMs;
    if(!match||!Number.isFinite(time)||time>8640000000000000)return null;
    return {key:`${message.tick}:${message.text}`,tick:message.tick,time,boss:match[1],reward:match[2]};
  }
  const newest=rows=>[...new Map(rows.map(row=>[row.key,row])).values()]
    .sort((a,b)=>b.tick-a.tick||a.key.localeCompare(b.key)).slice(0,100);
  function read() {
    try {
      const value=JSON.parse(storage.getItem(storageKey())??'null');
      if(value?.v!==1||!Array.isArray(value.entries))return [];
      return value.entries.slice(0,100).map(row=>receipt({name:'The Deep',tick:row?.tick,
        text:typeof row?.boss==='string'&&typeof row?.reward==='string'?
          `Your share of the ${row.boss}: ${row.reward} — on your shelf at the depot.`:null})).filter(Boolean);
    }catch {saved=false;return [];}
  }
  function observe(frame) {
    if(!Array.isArray(frame?.m))return;
    const welcome=frame.m.find(m=>m?.t==='welcome');
    if(welcome) {
      const id=welcome.you?.id;
      if(!Number.isSafeInteger(id)||id<0){connectionOpened();return;}
      if(id!==playerId){playerId=id;saved=true;entries=newest(read());}
    }
    if(playerId===null)return;
    const messages=[...(Array.isArray(welcome?.chat)?welcome.chat:[]),...frame.m.filter(m=>m?.t==='chat')];
    const incoming=messages.map(receipt).filter(Boolean);
    if(!incoming.length)return;
    const merged=newest([...read(),...entries,...incoming]);
    if(saved&&JSON.stringify(merged)===JSON.stringify(entries))return;
    entries=merged;
    try {storage.setItem(storageKey(),JSON.stringify({v:1,entries}));saved=true;}
    catch {saved=false;}
  }
  function connectionOpened(){playerId=null;entries=[];saved=true;}
  return {observe,connectionOpened,status:()=>({playerId,entries,saved})};
}

function createBossLootChat(document,history,translateGameText=text=>text) {
  let mounted=null,style=null,disposed=false;
  const css=`
    .chat[data-dv-loot-open]>.chat-body>[data-log]{position:absolute;visibility:hidden;pointer-events:none}
    .chat[data-dv-loot-open]>.chat-body>[data-dm-people],
    .chat[data-dv-loot-open]>.chat-body>[data-compose],
    .chat[data-dv-loot-open]>.chat-body>[data-chat-guest]{display:none!important}
    .chat .dv-boss-loot[hidden]{display:none!important}
    .chat .dv-boss-loot{box-sizing:border-box;min-height:80px;gap:10px}
    .chat .dv-loot-note{color:var(--ink-faint);font-size:.9em;line-height:1.5}
    .chat .dv-loot-entry{padding:0 0 9px;border-bottom:1px solid var(--edge);overflow-wrap:anywhere}
    .chat .dv-loot-entry:last-child{border-bottom:0}
    .chat .dv-loot-title{display:flex;flex-wrap:wrap;gap:3px 10px;align-items:baseline;margin-bottom:3px}
    .chat .dv-loot-boss{color:var(--brass);font-weight:700}
    .chat .dv-loot-time{color:var(--ink-faint);font-size:.85em;font-variant-numeric:tabular-nums}
    .chat .dv-loot-reward{color:var(--ink);line-height:1.5}
    .m-on .chat .dv-boss-loot{height:auto!important;min-height:0;flex:1 1 auto}
    .m-on .chat[data-dv-loot-open]>.chat-body>[data-log]{display:none!important}
  `;
  const element=(tag,className,text)=>{
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  const leave=(restoreScroll=true)=>{
    const m=mounted;if(!m?.active)return;
    m.active=false;m.panel.hidden=true;m.chat.removeAttribute('data-dv-loot-open');
    m.tab.setAttribute('aria-selected','false');
    for(const tab of m.tabs.querySelectorAll('[data-room]'))tab.setAttribute('aria-selected',String(tab.dataset.room===m.chat.dataset.room));
    if(restoreScroll&&m.chat.dataset.room===m.room)m.log.scrollTop=m.scroll;
  };
  const unmount=()=>{
    if(!mounted)return;
    leave();mounted.tabs.removeEventListener('click',mounted.onRoom);
    mounted.tab.remove();mounted.panel.remove();mounted=null;
  };
  function render() {
    const m=mounted;if(!m)return;
    const state=history.status(),signature=JSON.stringify(state);
    if(signature===m.signature)return;
    m.signature=signature;
    const scroll=m.panel.scrollTop;
    m.panel.replaceChildren();
    const note=state.playerId==null?'进入角色后开始记录自己的世界 Boss 掉落。':
      state.saved?'最近 100 条 · 仅保存本角色的掉落，记录保存在当前浏览器。':
        '浏览器暂时无法保存，刷新后本次记录可能丢失。';
    m.panel.append(element('div','dv-loot-note',note));
    const entries=state.entries??[];
    if(!entries.length)m.panel.append(element('div','dv-loot-note','暂无掉落记录；收到服务器的 Boss 奖励后会显示在这里。'));
    for(const entry of entries){
      const row=element('article','dv-loot-entry'),title=element('div','dv-loot-title');
      const time=Number.isFinite(entry.time)&&entry.time>0?new Date(entry.time).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'时间未知';
      title.append(element('strong','dv-loot-boss',translateGameText(entry.boss)),element('time','dv-loot-time',time));
      row.append(title,element('div','dv-loot-reward',translateGameText(entry.reward).replace(/\b(?:coins|gold)\b/gi,'金币').replace(/\bvoid ?shards\b/gi,'虚空碎片')));
      m.panel.append(row);
    }
    m.panel.scrollTop=scroll;
  }
  function refresh() {
    if(disposed||!document?.querySelector)return;
    const chat=document.querySelector('.chat'),body=chat?.querySelector('.chat-body'),tabs=body?.querySelector('.chat-tabs'),log=body?.querySelector('[data-log]');
    if(!chat||!body||!tabs||!log){unmount();return;}
    if(mounted?.chat!==chat||mounted.tabs!==tabs||!mounted.tab.isConnected||!mounted.panel.isConnected){
      unmount();
      chat.removeAttribute('data-dv-loot-open');
      for(const leftover of chat.querySelectorAll('[data-dv-boss-loot-tab],[data-dv-boss-loot-panel]'))leftover.remove();
      for(const nativeTab of tabs.querySelectorAll('[data-room]'))nativeTab.setAttribute('aria-selected',String(nativeTab.dataset.room===chat.dataset.room));
      if(!style){style=element('style');style.textContent=css;(document.head??document.body).append(style);}
      const tab=element('button','chat-tab','Boss 掉落'),panel=element('section','chat-log dv-boss-loot');
      tab.type='button';tab.dataset.dvBossLootTab='';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');
      panel.dataset.dvBossLootPanel='';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label','世界 Boss 掉落记录');panel.hidden=true;
      mounted={chat,body,tabs,log,tab,panel,active:false,room:null,scroll:0,height:260,signature:null,onRoom:null};
      const m=mounted;
      m.onRoom=event=>{
        const room=event.target.closest?.('[data-room]');
        if(!m.active||!room||!tabs.contains(room))return;
        const restore=room.dataset.room===m.room,scroll=m.scroll;
        leave(false);
        if(restore&&m.chat.dataset.room===m.room)m.log.scrollTop=scroll;
      };
      tabs.addEventListener('click',m.onRoom);
      tab.addEventListener('click',()=>{
        if(mounted!==m||m.active)return;
        m.scroll=log.scrollTop;m.room=chat.dataset.room;m.height=log.offsetHeight||parseFloat(log.style.height)||260;
        m.active=true;chat.setAttribute('data-dv-loot-open','');panel.hidden=false;
        panel.style.height=log.style.height||`${m.height}px`;
        for(const nativeTab of tabs.querySelectorAll('[data-room]'))nativeTab.setAttribute('aria-selected','false');
        tab.setAttribute('aria-selected','true');render();
      });
      tabs.append(tab);body.insertBefore(panel,log);
    }
    const m=mounted;
    if(m.active){
      if(m.chat.dataset.room!==m.room||m.tabs.querySelector('[data-room][aria-selected="true"]'))leave(false);
      else m.panel.style.height=m.log.style.height||`${m.height}px`;
    }
    render();
  }
  function destroy(){disposed=true;unmount();style?.remove();style=null;}
  return {refresh,destroy};
}

// Runs in the page at document-start. Uses the game's existing connection;
// Never reads credentials or opens a second game connection. Update checks read
// only the public release metadata; Tampermonkey handles installing new code.
(() => {
  if (window.__deepveinBalancedTrainer) return;
  window.__deepveinBalancedTrainer=true;
  const planner=createPlanner(GAME_DATA);
  const bossLoot=createBossLootHistory(GAME_DATA,localStorage);
  const bossLootChat=createBossLootChat(document,bossLoot,translateGameText);
  const farmingPreferenceKey='deepvein-farming-preference-v1';
  try {
    const saved=planner.setFarmingPreference(JSON.parse(localStorage.getItem(farmingPreferenceKey)||'null'));
    if(saved.mode==='manual'&&saved.jobId===null)planner.setFarmingPreference({mode:'auto',jobId:null});
  }catch{}
  const autoSellKey='deepvein-auto-sell-v1';
  let autoSell=false;
  try {autoSell=localStorage.getItem(autoSellKey)==='true';}catch{}
  const potionRestockKey='deepvein-potion-restock-v1',capacitySalesKey='deepvein-capacity-sales-v1';
  let potionRestock=true,capacitySales=true;
  try {
    potionRestock=localStorage.getItem(potionRestockKey)!=='false';
    capacitySales=localStorage.getItem(capacitySalesKey)!=='false';
  }catch{potionRestock=false;capacitySales=false;}
  const enhancementStorage={
    read:()=>{try {return JSON.parse(localStorage.getItem('deepvein-enhancement-training-v1')||'null');}catch{return null;}},
    write:value=>{try {localStorage.setItem('deepvein-enhancement-training-v1',JSON.stringify(value));}catch{}}
  };
  planner.enhancementTraining=createEnhancementTraining(GAME_DATA,planner,enhancementStorage);
  let economy=createEconomy(GAME_DATA,planner,{autoSell,capacitySales});
  planner.maintenance=(...args)=>economy.maintenance(...args);
  planner.investmentBudget=(...args)=>economy.investmentBudget(...args);
  const market=createMarket(GAME_DATA,planner,{now:()=>Date.now(),storage:localStorage,autoSell,capacitySales});
  planner.marketSale=(...args)=>market.sale(...args);
  planner.marketPurchase=(...args)=>market.purchase(...args);
  planner.marketOpportunity=(...args)=>market.opportunity(...args);
  planner.watchMarket=(...args)=>market.watch(...args);
  planner.restockPotion=(...args)=>potionRestock?market.restockPotion(...args):null;
  planner.watchPotions=(p,itemIds)=>market.watchPotions(p,potionRestock?itemIds:[]);
  const NativeWebSocket=window.WebSocket;
  let socket=null, panel=null, rendered='', farmingOptions='', mainJobOptions='', mainMonsterOptions='', targetOptions='', targetIdentity='', checking=false, startCheck=0, compatibilityMessage='', pumping=false,nativeBossClick=null;
  let foregroundSequence=-1,pendingNativeJoin=null;
  const owner=crypto.randomUUID();
  const leaseKey='deepvein-balanced-trainer-lease';
  const styleKey='deepvein-balanced-trainer-profession';
  const modeKey='deepvein-trainer-mode-v1';
  const mainTradeKey='deepvein-trainer-main-trade-v1';
  const mainJobKey='deepvein-trainer-main-job-v1';
  const mainMonsterKey='deepvein-trainer-main-monster-v1';
  const validMainJob=(jobId,trade)=>Number.isInteger(jobId)&&GAME_DATA.jobs.some(j=>j.id===jobId&&!j.grow&&j.skill===trade)?jobId:null;
  const validMainMonster=(monsterId,trade)=>trade==='combat'&&Number.isInteger(monsterId)&&GAME_DATA.monsters.some(m=>m.id===monsterId)?monsterId:null;
  const TRAINING_MODE_LABELS={balanced:'均衡成长',experience:'经验优先',business:'主业经营',assist:'只收菜＋蹭世界 Boss'};
  const modeInfo={
    balanced:'按五级阶段补齐生活和所选战斗职业的落后技能，适合全面成长。',
    experience:'比较供料与往返后的总经验效率，允许技能等级拉开差距。',
    business:'主业、具体工作与战斗目标均可自动或手选；指定目标不会因其他工作收益更高而被替换，仍可安排必要供料与换装。',
    assist:'仅合批收菜、用现有种子补种与蹭世界 Boss；保留玩家队列，完成临时外出后继续原任务。'
  };
  const runKey='deepvein-balanced-trainer-session';
  const itemTargetKey='deepvein-item-target-v1:';
  const metricsKey='deepvein-trainer-metrics-v1';
  let metricsPlayer=null,lastMetricsSave=0,dataCheck=null;
  let dataReady=[...document.scripts].some(s=>new URL(s.src||location.href,location.href).pathname===`/assets/${GAME_DATA.client}`);
  const readOnly=new Set(['resync','marketDepth','marketBook','marketBooks']);
  const recentRequests={actions:[],queries:[]};
  const rejectionKey='deepvein-rejections-v1';
  let rejections=[],rejectionsSaved=true;
  function readRejections() {
    try {
      const value=JSON.parse(localStorage.getItem(rejectionKey)||'null');
      if(Array.isArray(value))return value.filter(r=>r&&typeof r.code==='string'&&Number.isFinite(r.time)).slice(0,10);
    } catch { /* Keep in-memory evidence when storage is unavailable. */ }
    return rejections;
  }
  rejections=readRejections();
  const diagnosticIntent=intent=>Object.fromEntries(Object.entries(intent).filter(([key])=>
    ['t','itemId','jobId','siteId','zoneId','qty','price','floor','orderId','x','y','limit','errand','onFull','worn','toPlus','once','shelf','at','count','raid','index'].includes(key)));
  function diagnosticState(p,intent) {
    if(!p)return null;
    const id=intent?.itemId;
    return {tick:p.lastTick,x:p.x,y:p.y,activity:p.activity,nearBank:planner.nearBank(p),coins:p.coins,hp:p.hp,
      route:p.route?{...diagnosticIntent(p.route),phase:p.route.phase}:null,
      equipment:{...p.equipment},enhance:p.enhance?diagnosticIntent(p.enhance):null,packEntries:p.pack.length,
      item:id?{id,bank:p.bank[id]??0,pack:p.pack.filter(i=>i.itemId===id).reduce((n,i)=>n+i.qty,0),overflow:p.overflow?.[id]??0}:null};
  }
  const allowed=new Set([...readOnly,'setRoute','fight','walk','wear','equipFromBank','deposit',
    'eatAt','eat','drink','chooseFood','carryFood','enhance','clearRoute','marketDump','depositItem','withdraw','marketBuy','marketSell','marketCancel','vendorBuy','claimQuest',
    'setAside','attackWorldBoss','leaveWorldBoss','startQueued']);
  function rememberRequest(intent) {
    const list=recentRequests[readOnly.has(intent.t)?'queries':'actions'];
    list.push({time:Date.now(),intent:diagnosticIntent(intent)});if(list.length>5)list.shift();
  }
  function nativeBossJoinButton() {
    const visible=button=>button?.isConnected&&!button.hidden&&!button.disabled&&!button.closest('[hidden]')&&button.getClientRects().length;
    const pill=document.querySelector?.('[data-boss-pill]');
    if(visible(pill)&&/^(Join|加入|加入战斗)$/.test(pill.querySelector('.boss-pill-join')?.textContent.trim()??''))return pill;
    const button=document.querySelector?.('[data-boss-run]');
    return visible(button)&&/^(Attack|攻击)$/.test(button.textContent.trim())?button:null;
  }
  const trainer=new Trainer(GAME_DATA,planner,intent=>{
    if (!allowed.has(intent.t)) throw new Error('未支持的操作');
    if(!autoSell&&!(capacitySales&&trainer.plan?.capacitySale)&&['marketSell','marketDump'].includes(intent.t))
      throw new Error('日常出售已关闭，且当前操作不是获准的满仓清理');
    if (!validateIntent(GAME_DATA,trainer.player,intent)) throw new Error('计划涉及未知物品或任务，等待数据核对');
    if (!socket||socket.readyState!==NativeWebSocket.OPEN) throw new Error('游戏连接已断开');
    const send=()=>{NativeWebSocket.prototype.send.call(socket,JSON.stringify(intent));rememberRequest(intent);};
    if(intent.t==='attackWorldBoss'&&nativeBossJoinButton()) {
      const connection=socket,playerId=trainer.player.id,round=trainer.boss.status();
      // Our socket listener runs before the game's receiver. Let it apply the
      // snapshot before asking the native button to read its own player state.
      setTimeout(function joinNativeBoss(){
        if(!trainer.active||socket!==connection||socket.readyState!==NativeWebSocket.OPEN||
          trainer.player?.id!==playerId)return;
        if(Date.now()-trainer.received>45000){pump();return;}
        if(trainer.snapshotSequence<=foregroundSequence){pendingNativeJoin=joinNativeBoss;return;}
        const plan=trainer.boss.next(trainer.player),current=trainer.boss.status();
        if(plan?.intent||plan?.blocked){pump();return;}
        if(!current.owned||current.phase!=='attacking'||current.name!==round.name||current.until!==round.until)return;
        try {
          if(!claimLease()){trainer.pause('另一个标签页已接管调度');return;}
          const button=nativeBossJoinButton(),scope={sent:false,unexpected:false};
          if(button) {
            nativeBossClick=scope;
            try {button.click();}catch { /* Never replay an attack already sent by the native handler. */ }
            finally {nativeBossClick=null;}
          }
          if(!scope.sent&&!scope.unexpected&&trainer.active&&trainer.boss.ownsRun())send();
        } catch(error) {trainer.pause(`原生 Boss 加入未完成：${error.message}`);releaseLease();}
        finally {saveRun();render();}
      },0);
      return;
    }
    send();
  });
  const updates=createUpdateChecker({version:SCRIPT_VERSION,distribution:SCRIPT_DISTRIBUTION,fetch:(...args)=>fetch(...args),onChange:()=>render()});
  trainer.market=market;
  async function prepareData() {
    if(dataCheck)return dataCheck;
    dataCheck=(async()=>{
      const result=await refreshGameData(GAME_DATA,[...document.scripts].map(s=>s.src),location.href,
        {fetch:(...args)=>fetch(...args),parse:parsePublicClient,storage:localStorage});
      if(result.updated) {
        Object.assign(GAME_DATA,result.data);
        const refreshed=createPlanner(GAME_DATA);
        refreshed.setFarmingPreference(planner.farmingPreference());
        refreshed.enhancementTraining=createEnhancementTraining(GAME_DATA,refreshed,enhancementStorage);
        refreshed.marketSale=planner.marketSale;refreshed.marketPurchase=planner.marketPurchase;
        refreshed.marketOpportunity=planner.marketOpportunity;refreshed.watchMarket=planner.watchMarket;
        refreshed.restockPotion=planner.restockPotion;
        refreshed.watchPotions=planner.watchPotions;
        refreshed.investmentBudget=planner.investmentBudget;
        Object.assign(planner,refreshed);
        trainer.mainJobId=validMainJob(trainer.mainJobId,trainer.mainTrade);
        trainer.mainMonsterId=validMainMonster(trainer.mainMonsterId,trainer.mainTrade);
        trainer.telemetry.level=planner.level;trainer.telemetry.rates={};trainer.telemetry.previous=null;
        economy=createEconomy(GAME_DATA,planner,{autoSell,capacitySales});planner.maintenance=(...args)=>economy.maintenance(...args);
        planner.investmentBudget=(...args)=>economy.investmentBudget(...args);
        trainer.goal=null;trainer.plan=null;
      }
      compatibilityMessage=result.message;dataReady=true;render();
    })();
    return dataCheck;
  }
  function saveMetrics(force=false) {
    if(!trainer.player||!trainer.telemetry)return;
    if(metricsPlayer!==trainer.player.id) {
      metricsPlayer=trainer.player.id;
      try {
        const saved=JSON.parse(localStorage.getItem(metricsKey)||'null');
        if(saved?.playerId===metricsPlayer)trainer.telemetry.restore(saved.metrics);
      } catch { /* A malformed local report is ignored. */ }
    }
    if(!force&&Date.now()-lastMetricsSave<60000)return;
    lastMetricsSave=Date.now();
    try{localStorage.setItem(metricsKey,JSON.stringify({playerId:metricsPlayer,metrics:trainer.telemetry.summary()}));}
    catch { /* On-screen measurements remain available without storage. */ }
  }
  try { trainer.setStyle(localStorage.getItem(styleKey)); } catch { /* Default to mage. */ }
  try {
    const saved=localStorage.getItem(modeKey);
    trainer.mode=Object.hasOwn(TRAINING_MODE_LABELS,saved)?saved:'balanced';
  } catch { trainer.mode='balanced'; }
  try {
    const saved=localStorage.getItem(mainTradeKey);
    trainer.mainTrade=Object.hasOwn(MAIN_TRADES,saved)?saved:'auto';
  } catch { trainer.mainTrade='auto'; }
  try {trainer.mainJobId=validMainJob(JSON.parse(localStorage.getItem(mainJobKey)||'null'),trainer.mainTrade);}
  catch {trainer.mainJobId=null;}
  try {trainer.mainMonsterId=validMainMonster(JSON.parse(localStorage.getItem(mainMonsterKey)||'null'),trainer.mainTrade);}
  catch {trainer.mainMonsterId=null;}
  try {
    const saved=JSON.parse(sessionStorage.getItem(runKey)||'null');
    if (saved?.playerId!=null&&Object.hasOwn(PROFESSIONS,saved.style)) {
      trainer.style=saved.style;
      trainer.mode=Object.hasOwn(TRAINING_MODE_LABELS,saved.mode)?saved.mode:'balanced';
      trainer.mainTrade=Object.hasOwn(MAIN_TRADES,saved.mainTrade)?saved.mainTrade:'auto';
      trainer.mainJobId=validMainJob(saved.mainJobId,trainer.mainTrade);
      trainer.mainMonsterId=validMainMonster(saved.mainMonsterId,trainer.mainTrade);
      trainer.boss.restore(saved.boss);
      trainer.recovery={playerId:saved.playerId,lastTick:saved.lastTick};
      trainer.awaitingWelcome=true;
      trainer.message='等待游戏登录，同一角色登录后自动恢复本标签页的调度';
    }
  } catch { /* In-page reconnection still works without session storage. */ }
  let savedRun='',savedItemTarget='';
  function saveRun() {
    if(trainer.player) {
      const key=itemTargetKey+trainer.player.id,target=trainer.itemTarget;
      const record=target?.playerId===trainer.player.id?JSON.stringify(target):'';
      if(savedItemTarget!==key+record)try {
        if(record)sessionStorage.setItem(key,record);else sessionStorage.removeItem(key);
        savedItemTarget=key+record;
      } catch { /* The current target remains usable in this page. */ }
    }
    const record=trainer.active||trainer.recovery?JSON.stringify({
      playerId:trainer.recovery?.playerId??trainer.player?.id,
      lastTick:trainer.recovery?.lastTick??trainer.player?.lastTick,style:trainer.style,mode:trainer.mode,mainTrade:trainer.mainTrade,mainJobId:trainer.mainJobId,mainMonsterId:trainer.mainMonsterId,boss:trainer.boss.save()}):'';
    if (record===savedRun) return;
    try {
      if (record) sessionStorage.setItem(runKey,record); else sessionStorage.removeItem(runKey);
      savedRun=record;
    } catch { /* No cross-tab or permanent auto-start fallback. */ }
  }

  function releaseLease() {
    try {
      if (JSON.parse(localStorage.getItem(leaseKey)||'null')?.owner===owner) localStorage.removeItem(leaseKey);
    } catch { /* Nothing to release if storage is unavailable. */ }
  }
  function claimLease() {
    const now=Date.now();
    const lease=JSON.parse(localStorage.getItem(leaseKey)||'null');
    if (lease&&lease.owner!==owner&&lease.until>now) return false;
    localStorage.setItem(leaseKey,JSON.stringify({owner,until:now+20000}));
    return JSON.parse(localStorage.getItem(leaseKey))?.owner===owner;
  }
  window.WebSocket=class extends NativeWebSocket {
    constructor(...args) {
      super(...args);
      const url=new URL(String(args[0]),location.href);
      if (url.host!==location.host||url.pathname!=='/ws') return;
      if (socket) trainer.connectionLost();
      socket=this;
      bossLoot.connectionOpened();
      this.addEventListener('message',event=>{
        if (socket!==this||typeof event.data!=='string') return;
        try {
          const sequence=trainer.snapshotSequence;
          const frame=JSON.parse(event.data),pending=trainer.pending;
          const welcome=frame.m?.find(message=>message.t==='welcome');
          if(welcome?.you?.id!=null) {
            let saved=trainer.itemTarget?.playerId===welcome.you.id?trainer.itemTarget:null;
            if(!saved)try {saved=JSON.parse(sessionStorage.getItem(itemTargetKey+welcome.you.id)||'null');}catch{}
            trainer.restoreItemTarget(saved?.playerId===welcome.you.id?saved:null);
          }
          bossLoot.observe(frame);
          const errors=Array.isArray(frame.m)?frame.m.filter(m=>m.t==='error'):[];
          const context=errors.length&&trainer.player?{active:trainer.active,snapshotTick:trainer.snapshotTick,
            before:diagnosticState(pending?.before??trainer.player,pending?.intent),
            pending:pending?{label:pending.label?.slice(0,160),sentAt:pending.sentAt,intent:diagnosticIntent(pending.intent)}:null}:null;
          trainer.receive(frame);
          if(context) {
            // A frame may confirm an operation before reporting an unrelated error.
            // Capture every error even if the first one already paused the trainer.
            const previous=rejectionsSaved?readRejections():rejections;
            const records=errors.slice(-10).reverse().map(error=>({time:Date.now(),version:SCRIPT_VERSION,client:GAME_DATA.client,
              code:String(error.code??'未提供错误码').slice(0,120),frameTick:frame.tick,...context,
              scope:isGuildRefusal(error.code)?'guild':'unattributed',
              stale:frame.tick<context.snapshotTick,
              pendingConfirmed:!!pending&&trainer.snapshotSequence>sequence&&acknowledged(pending.before,trainer.player,pending.intent,GAME_DATA),
              after:diagnosticState(trainer.player,pending?.intent),
              actions:[...recentRequests.actions],queries:[...recentRequests.queries]}));
            rejections=[...records,...previous].slice(0,10);
            try {localStorage.setItem(rejectionKey,JSON.stringify(rejections));rejectionsSaved=true;}
            catch {rejectionsSaved=false;}
          }
          if (trainer.snapshotSequence>sequence) {
            pump();
            if(pendingNativeJoin){const join=pendingNativeJoin;pendingNativeJoin=null;setTimeout(join,0);}
          }
        }
        catch (error) { trainer.pause(`无法解析游戏状态：${error.message}`); }
        render();
      });
      this.addEventListener('close',event=>{
        if (socket!==this) return;
        ++startCheck; checking=false;
        trainer.connectionLost(event.code===4001?'角色已在别处登录，已取消自动恢复':
          event.code===4002?'服务器已停用此连接，已取消自动恢复':undefined);
        if (!trainer.recovery) releaseLease();
        render();
      });
    }
    send(raw) {
      if(this===socket&&nativeBossClick&&typeof raw==='string') {
        let intent;try {intent=JSON.parse(raw);}catch{}
        if(intent?.t==='attackWorldBoss'&&!nativeBossClick.unexpected) {
          if(nativeBossClick.sent)throw new Error('同次原生调用重复请求 Boss 攻击');
          const result=super.send(raw);nativeBossClick.sent=true;rememberRequest(intent);return result;
        }
        if(intent&&!readOnly.has(intent.t)) {
          nativeBossClick.unexpected=true;
          trainer.pause('原生 Boss 流程执行了其他操作，已交还游戏处理');releaseLease();saveRun();
        }
      }
      // A manual gameplay action takes precedence over the planner.
      if (this===socket&&(trainer.active||trainer.recovery)&&typeof raw==='string') {
        try {
          const intent=JSON.parse(raw),type=intent.t;
          if ((allowed.has(type)&&!readOnly.has(type))||['clearRoute','stopEnhance','queue','unqueue','moveQueued','unwear','gearSetApply','portal','setAside','skip','startQueued','goQuest'].includes(type)) {
            trainer.manualAction(intent);
            if(!trainer.active&&!trainer.recovery)releaseLease();
            saveRun();
          }
        } catch { /* Non-JSON traffic still belongs to the game. */ }
      }
      return super.send(raw);
    }
  };

  const mainJobName=job=>gameLabel(job.name);
  function farmingChoices(p) {
    const ids=p?[...new Set([...Object.keys(p.bank).map(Number),...p.pack.map(i=>i.itemId)])]:[];
    return GAME_DATA.jobs.filter(j=>j.grow).sort((a,b)=>a.levelReq-b.levelReq||a.id-b.id).map(j=>({
      id:j.id,name:gameLabel(j.name),level:j.levelReq,
      locked:!p||planner.level(p.skills.farming)<j.levelReq,
      seeds:p?ids.filter(id=>planner.base(id)===j.inputs[0].itemId).reduce((n,id)=>n+planner.count(p,id),0):null
    }));
  }
  function changeFarmingPreference(mode,jobId) {
    if(mode==='manual'&&jobId==null)jobId=farmingChoices(trainer.player).find(j=>!j.locked)?.id??GAME_DATA.jobs.find(j=>j.grow)?.id??null;
    const preference=planner.setFarmingPreference({mode,jobId});
    try {localStorage.setItem(farmingPreferenceKey,JSON.stringify(preference));}
    catch {trainer.log('种植偏好已应用，但无法保存；刷新后恢复原设置');}
    render();
  }
  async function startScheduling(target=null) {
    if(checking||trainer.recovery||!target&&trainer.active)return;
    const attempt=++startCheck;
    checking=true;trainer.log('正在启动…');render();
    try {
      await prepareData();
      if(attempt!==startCheck)return;
      checking=false;
      if(!claimLease())trainer.pause('另一个标签页正在调度，请先暂停那个标签页');
      else if(target)trainer.startItemTarget(target.itemId,target.quantity);
      else trainer.start();
    } catch {
      if(attempt!==startCheck)return;
      checking=false;trainer.pause('无法完成启动检查，请检查网站存储权限后重试');
    }
    render();
  }
  function mount() {
    const host=document.createElement('div');
    host.id='deepvein-balanced-trainer';
    host.style.cssText='position:fixed;right:12px;top:60px;z-index:2147483646;';
    panel=host.attachShadow({mode:'open'});
    panel.innerHTML=`<style>
      :host{all:initial;color-scheme:dark;font:13px/1.6 "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#eee9dd}
      *{box-sizing:border-box}section{display:flex;flex-direction:column;width:380px;max-width:calc(100vw - 24px);max-height:calc(100vh - 76px);max-height:calc(100dvh - 76px);background:#1c1b18;border:1px solid #494333;border-radius:14px;box-shadow:0 12px 36px #0005;overflow:hidden}
      header{display:flex;align-items:center;gap:8px;padding:13px 14px 10px;flex-shrink:0}.brand{flex:1;min-width:0}.eyebrow{font-size:10px;letter-spacing:2px;color:#c1a96e}.brand strong{display:block;font-size:15px;font-weight:650;letter-spacing:.2px}
      button,select,input{font:inherit}button,select{min-height:44px;border:1px solid #504b3d;border-radius:8px;background:#292721;color:#eee9dd}button{cursor:pointer;padding:8px 14px;font-weight:600}button:hover{background:#383328}button:disabled{opacity:.38;cursor:default}
      :is(button,select,input,summary,a):focus-visible{outline:2px solid #e2c274;outline-offset:3px}a{color:#d8bd7e;text-underline-offset:3px}header a{font-size:11px;white-space:nowrap}[data-fold]{width:44px;flex-shrink:0;border-color:transparent;background:transparent;padding:0;font-size:22px;color:#bfb8a6}
      .runbar{padding:0 14px 14px;border-bottom:1px solid #3b382f;flex-shrink:0}.run-state{display:flex;align-items:center;gap:8px;margin:0 0 8px}.run-state b{font-size:11px;font-weight:600;border:1px solid #5b523a;border-radius:5px;padding:1px 7px;color:#dac18b;white-space:nowrap}.run-state b[data-running="true"]{border-color:#657956;color:#b5d299}[data-status]{min-width:0;font-size:12px;color:#c6bead;max-height:3.2em;overflow:auto;margin:0}.buttons{display:flex;gap:8px}.buttons button{flex:1}[data-start]{background:#d4b36a;border-color:#d4b36a;color:#211d13}[data-start]:hover{background:#e1c381}
      .body{padding:14px;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#56503f transparent;overscroll-behavior:contain}[hidden]{display:none!important}p{margin:0 0 8px;overflow-wrap:anywhere}p:last-child{margin-bottom:0}.muted{color:#b7b0a0;font-size:12px}.label{font-size:10px;letter-spacing:1.5px;color:#c1a96e;margin-bottom:5px}.current{padding:0 1px 14px}[data-activity]{font-size:14px;font-weight:600}[data-task]{color:#ddc38d;font-size:12px}[data-goal],[data-reason]{font-size:12px;color:#b7b0a0}
      .card{background:#23211c;border:1px solid #3d392f;border-radius:10px;padding:12px;margin-bottom:10px}.card-heading{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:9px}.card-heading strong{font-size:13px;font-weight:600}.card-heading span{font-size:11px;color:#b7b0a0}.farm-counts{display:grid;grid-template-columns:repeat(3,1fr);padding:0 0 10px;margin-bottom:10px;border-bottom:1px solid #3d392f}.farm-counts span{color:#b7b0a0;font-size:11px}.farm-counts span+span{padding-left:12px;border-left:1px solid #3d392f}.farm-counts b{display:block;color:#eee9dd;font-size:21px;line-height:1.35;font-weight:500;font-variant-numeric:tabular-nums}[data-farm]{margin-bottom:12px;font-size:11px;line-height:1.65}[data-farming-note]{font-size:11px;color:#b7b0a0}
      label{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;margin-bottom:8px;font-size:12px}select{min-width:0;max-width:75%;padding:8px 9px;cursor:pointer}label select{flex:1}input[type="checkbox"]{width:18px;height:18px;accent-color:#d4b36a;flex-shrink:0;margin:13px 0 13px 10px}input[type="number"]{width:150px;min-height:44px;padding:8px 9px;border:1px solid #504b3d;border-radius:8px;background:#292721;color:#eee9dd}.setting-note{padding:0 0 9px}.notice{padding:10px;border:1px solid #766044;border-radius:8px;color:#e1c494;margin:10px 0;font-size:11px}
      details{border-top:1px solid #3d392f}summary{display:flex;align-items:center;justify-content:space-between;gap:10px;list-style:none;min-height:46px;padding:10px 1px;cursor:pointer;color:#d3cbbb;font-size:12px;font-weight:600}summary::-webkit-details-marker{display:none}summary::after{content:'+';color:#a79a7d;font-size:17px;font-weight:400}details[open]>summary::after{content:'−'}.detail-content{padding:1px 0 13px}.detail-content>details{margin:0 0 2px}.detail-content>details>summary{font-weight:400;color:#bfb6a3}.detail-content>details[open]{padding-bottom:12px}.detail-content>details>p,.detail-content>details>pre{padding:0 3px}
      .levels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 14px;margin:12px 0}.levels span{display:flex;justify-content:space-between;font-size:12px}.levels b{font-weight:500;font-variant-numeric:tabular-nums}.low{color:#dbbd78}.excluded{color:#8e887c}ol{padding-left:19px;max-height:200px;overflow:auto;font-size:11px;color:#b7b0a0}li{margin:6px 0;overflow-wrap:anywhere}pre{margin:10px 0}[data-inventory],[data-enhancement],[data-equipment]{white-space:pre-wrap;font:inherit;font-size:11px;line-height:1.7;max-height:260px;overflow:auto;color:#b7b0a0}
      [data-metrics],[data-farm],[data-market],[data-growth],[data-quests],[data-rejections],[data-buffs]{white-space:pre-line}.footer{display:flex;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid #3d392f;color:#968e7b;font-size:10px;letter-spacing:.2px}.update-actions{display:flex;align-items:center;gap:16px;margin:9px 0}.update-actions a{display:flex;align-items:center;min-height:44px}.fine-print{font-size:11px;color:#999281}
      .compact-label{display:none}section[data-folded="true"]{width:260px;flex-direction:row;align-items:center;border-radius:10px}section[data-folded="true"] header{order:1;padding:0;gap:0}section[data-folded="true"] .brand,section[data-folded="true"] [data-status],section[data-folded="true"] .full-label{display:none}section[data-folded="true"] .runbar{display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:3px 0 3px 10px;border:0}section[data-folded="true"] .run-state{flex:1;min-width:0;gap:6px;margin:0}section[data-folded="true"] .run-state::before{content:'助手';color:#c6bead;font-size:12px;white-space:nowrap}section[data-folded="true"] .run-state b{border:0;padding:0;font-size:12px}section[data-folded="true"] .buttons button{padding:6px 12px}section[data-folded="true"] .compact-label{display:inline}section[data-folded="true"][data-running="true"] [data-start],section[data-folded="true"][data-running="false"] [data-pause]{display:none}section[data-folded="true"] [data-update-badge]{font-size:0;padding:0 4px;min-height:44px;display:flex;align-items:center}section[data-folded="true"] [data-update-badge]::after{content:'更新';font-size:11px}
      @media(max-width:480px){:host{top:12px!important;right:8px!important}section{width:380px;max-width:calc(100vw - 16px);max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px)}header{padding-top:11px}.brand strong{font-size:14px}}
    </style><section aria-label="自给成长与职业助手">
      <header><div class="brand"><div class="eyebrow">DEEP VEIN · 助手</div><strong data-heading>均衡成长 · 职业专精</strong></div><a data-update-badge hidden target="_blank" rel="noopener noreferrer">有更新</a><button data-fold aria-label="收起面板" aria-expanded="true">−</button></header>
      <div class="runbar"><div class="run-state"><b data-run-state>待机</b><p data-status role="status">等待游戏状态…</p></div><div class="buttons"><button data-start><span class="full-label">开始调度</span><span class="compact-label">开始</span></button><button data-pause disabled><span class="full-label">暂停调度</span><span class="compact-label">暂停</span></button></div></div>
      <div class="body">
        <div class="current"><p class="label">当前任务</p><p data-activity>等待游戏状态</p><p data-task></p><p data-goal></p><p data-reason></p></div>
        <div class="card"><div class="card-heading"><strong>农田</strong><span data-farm-fields>等待田地状态</span></div>
          <div class="farm-counts"><span><b data-farm-ready>—</b>待收获</span><span><b data-farm-growing>—</b>生长中</span><span><b data-farm-empty>—</b>空田</span></div>
          <p data-farm class="muted"></p>
          <label>种植方式<select data-farming-mode aria-label="种植方式"><option value="auto">自动选择</option><option value="manual">指定作物</option></select></label>
          <label data-farming-crop-controls hidden>指定作物<select data-farming-crop aria-label="指定作物"></select></label>
          <p data-farming-note></p>
        </div>
        <div class="card"><div class="card-heading"><strong>世界 Boss</strong><span>临时参与 · 原队列保留</span></div><p data-boss class="muted"></p></div>
        <p data-last-rejection class="notice" hidden></p>
        <details data-settings-details><summary>成长设置<span data-settings-summary class="muted"></span></summary><div class="detail-content">
          <label>成长策略<select data-mode aria-label="成长策略">${Object.entries(TRAINING_MODE_LABELS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
          <p data-mode-info class="muted setting-note"></p>
          <div data-main-trade-controls hidden><label>主业<select data-main-trade aria-label="主业">${Object.entries(MAIN_TRADES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><div data-main-job-controls hidden><label>具体工作<select data-main-job aria-label="具体工作"></select></label><p data-main-job-info class="muted setting-note"></p></div><div data-main-monster-controls hidden><label>目标怪物<select data-main-monster aria-label="目标怪物"></select></label><p data-main-monster-info class="muted setting-note"></p></div><p class="muted setting-note">农业继续后台合批种收；强化随有用装备升级。手选主业不会被更赚钱的其它技能替换。</p></div>
          <label>战斗职业<select data-profession aria-label="战斗职业">${Object.entries(PROFESSIONS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
          <p data-profession-info class="muted"></p><p data-training-policy class="muted"></p>
          <p class="fine-print">切换成长策略／职业后点击“开始”。开始后断线或本页刷新自动恢复；暂停取消恢复。保持电脑运行和标签页打开。</p>
        </div></details>
        <details data-item-target-details><summary>物品目标<span data-item-target-summary class="muted">未设置</span></summary><div class="detail-content">
          <label>目标物品<select data-item-target-item aria-label="目标物品"></select></label>
          <label>另外获得<input data-item-target-quantity aria-label="另外获得数量" type="number" min="1" max="1000000" step="1" value="100"></label>
          <p data-item-target-status class="muted" role="status"></p>
          <div class="buttons"><button data-item-target-start>开始目标</button><button data-item-target-cancel disabled>取消目标</button></div>
          <p class="fine-print">仅普通品质；原库存不计，采购计新增，完成继续原策略。顺路收菜不额外补料，种子目标暂停播种；Boss 可能消耗目标食物时暂缓。暂停保留目标，切换策略、主业或职业取消；不接管玩家队列。</p>
        </div></details>
        <details data-progress-details><summary>等级与运行收益</summary><div class="detail-content"><p data-growth class="muted"></p><div class="levels"></div><p data-blocked class="muted"></p><p data-metrics class="muted"></p><p class="fine-print">只统计已观察到的在线区间；离线奖励不用于估算战斗效率。</p></div></details>
        <details data-more-details><summary>任务、装备与物资</summary><div class="detail-content">
          <details data-quests-details><summary>日常／周常任务</summary><p data-quests class="muted"></p><p class="fine-print">短且收益合算的任务优先，长任务顺路推进；完成后自动领奖，不停止当前工作。击杀任务经验按领奖时的武器职业发放。</p></details>
          <details data-equipment-details><summary>当前与下一档装备</summary><p data-equipment-policy class="muted"></p><pre data-equipment></pre></details>
          <details data-economy-details><summary>物资保留与强化预算</summary><pre data-inventory></pre><pre data-enhancement></pre>
            <details><summary>预算规则</summary><p class="fine-print">保留计划用料、关键种子和装备；在用装备以 +5 为基线，每次尝试一级并确认。后续强化单次不超过自由金币 10%、碎片 25%；同装备每阶段最多五次，失败停止本阶段重试。临近换代先换装，中间一级属性取整不变但 +5 有提升时可继续。</p><p class="fine-print">强化报价按基础属性估算，是否执行由策略决定；高阶失败可能回到 +0。售价有最低报价保护，未知物品和稀有装备保留。</p></details>
          </details>
          <details data-market-details><summary>市场比价与出售</summary><label>自动出售多余物品<input type="checkbox" data-auto-sell aria-label="自动出售多余物品"></label><label>满仓时出售普通盈余<input type="checkbox" data-capacity-sales aria-label="满仓时出售普通盈余"></label><p data-market class="muted"></p>
            <details><summary>出售范围与保护</summary><p class="fine-print">日常出售默认关闭，满仓清理默认开启。扣除计划用量后只卖普通盈余；保护稀有物品、种子、药水、食物储备、在用装备与装备方案，不自动捐赠。优先市场出售，挂售至少 2 小时且重新定价后才允许系统回收。关闭授权后顺路撤回相应脚本卖单，不动玩家手动单。</p></details>
          </details>
          <details data-buffs-details><summary>药水与食物</summary><p data-buffs class="muted"></p><label>限预算自动补普通药水<input type="checkbox" data-potion-restock aria-label="限预算自动补普通药水"></label><p class="fine-print">药效余量 ≤ 6 小时时按需补至约 20 小时；利用返仓空闲补货，不停工等报价，稀有药水保留。</p>
            <details><summary>补给预算与药效说明</summary><p class="fine-print">普通药每瓶叠加 1 小时，单次最多喝或买 20 瓶并逐批确认。优先利用普通盈余；滚动每小时订单不超过可用金币 1%，封顶 3000，另留 1000 金币与当前计划预算；单瓶不超过基础估值 3 倍。缺货或预算不足就少补，不专程返仓。</p><p class="fine-print">采集：采矿、钓鱼、伐木、盗窃经验 +10%；灵药：普通工作与战斗经验 +10%。猎人：提高产物、掉落及收菜返种品质。战士：命中 +10、最大伤害 +10%，法师也适用。疾行：新路程速度 +20%；急速：攻击速度 +20%；滋养：食物治疗 +25%；深渊：普通怪金币 +25%。以上为普通品质数值。</p><p class="fine-print">不保证断货或离仓时药效不断。富余作物按收益补战斗减伤；临时增益不降低安全携粮量。</p></details>
          </details>
        </div></details>
        <details data-diagnostics-details><summary>运行记录与诊断</summary><div class="detail-content"><ol></ol><button data-export>导出运行记录</button><details data-rejection-details hidden><summary>服务器拒绝记录</summary><p data-rejections class="muted"></p><button data-export-rejections>导出故障记录</button><p class="fine-print">最近 10 次仅保存在本机，刷新保留。公会提示不打断练级；同期操作仅作排查线索。记录不触发重试，未知错误仍会暂停。</p></details><p data-client class="fine-print"></p></div></details>
        <details data-update-details><summary>脚本更新<span class="muted">v${SCRIPT_VERSION}</span></summary><div class="detail-content"><p data-update-status role="status" class="muted"></p><div class="update-actions"><button data-update-check title="每分钟最多检查一次">检查更新</button><a data-update-install target="_blank" rel="noopener noreferrer">安装／更新</a></div><p class="fine-print">油猴可按自身设置自动更新；已打开的游戏页需刷新才能运行新版，不强制刷新或打断任务。</p></div></details>
        <div class="footer"><span>DEEP VEIN IDLE</span><span>成长策略 · 物资预算 · v${SCRIPT_VERSION}</span></div>
      </div>
    </section>`;
    document.body.append(host);
    for(const selector of ['[data-update-badge]','[data-update-install]'])panel.querySelector(selector).href=updates.state.installUrl;
    panel.querySelector('[data-update-check]').onclick=()=>updates.check(true);
    panel.querySelector('[data-farming-mode]').onchange=event=>changeFarmingPreference(event.currentTarget.value,planner.farmingPreference().jobId);
    panel.querySelector('[data-farming-crop]').onchange=event=>changeFarmingPreference('manual',Number(event.currentTarget.value));
    panel.querySelector('[data-auto-sell]').onchange=event=>{
      autoSell=event.currentTarget.checked===true;
      economy.setAutoSell(autoSell);market.setAutoSell(autoSell);planner.resetSpecialization();
      try {localStorage.setItem(autoSellKey,String(autoSell));}
      catch {trainer.log('出售设置未能保存，刷新后默认关闭');}
      render();
    };
    panel.querySelector('[data-potion-restock]').onchange=event=>{
      potionRestock=event.currentTarget.checked===true;
      try {localStorage.setItem(potionRestockKey,String(potionRestock));}
      catch {potionRestock=false;trainer.log('补药设置无法保存，自动补药已关闭');}
      if(!potionRestock&&trainer.player)market.watchPotions(trainer.player,[]);
      render();
    };
    panel.querySelector('[data-capacity-sales]').onchange=event=>{
      capacitySales=event.currentTarget.checked===true;
      try {localStorage.setItem(capacitySalesKey,String(capacitySales));}
      catch {capacitySales=false;trainer.log('满仓清理设置无法保存，本页已关闭');}
      economy.setCapacitySales(capacitySales);market.setCapacitySales(capacitySales);render();
    };
    panel.querySelector('[data-mode]').onchange=event=>{
      ++startCheck;checking=false;
      trainer.setMode(event.currentTarget.value);releaseLease();
      try {localStorage.setItem(modeKey,trainer.mode);}
      catch {trainer.log('策略已切换，但无法保存偏好；刷新后默认均衡成长');}
      render();
    };
    panel.querySelector('[data-main-trade]').onchange=event=>{
      if(trainer.mode==='business'){++startCheck;checking=false;}
      trainer.setMainTrade(event.currentTarget.value);
      if(trainer.mode==='business')releaseLease();
      try {
        localStorage.setItem(mainTradeKey,trainer.mainTrade);
        localStorage.setItem(mainJobKey,JSON.stringify(trainer.mainJobId));
        localStorage.setItem(mainMonsterKey,JSON.stringify(trainer.mainMonsterId));
      }
      catch {trainer.log('主业已切换，但无法保存偏好；刷新后自动选择主业');}
      render();
    };
    panel.querySelector('[data-main-job]').onchange=event=>{
      const jobId=event.currentTarget.value===''?null:validMainJob(Number(event.currentTarget.value),trainer.mainTrade);
      if(jobId===trainer.mainJobId)return;
      if(trainer.mode==='business'){++startCheck;checking=false;}
      trainer.setMainJob(jobId);
      if(trainer.mode==='business')releaseLease();
      try {localStorage.setItem(mainJobKey,JSON.stringify(trainer.mainJobId));}
      catch {trainer.log('具体工作已切换，但无法保存；刷新后恢复原设置');}
      render();
    };
    panel.querySelector('[data-main-monster]').onchange=event=>{
      const monsterId=event.currentTarget.value===''?null:validMainMonster(Number(event.currentTarget.value),trainer.mainTrade);
      if(monsterId===trainer.mainMonsterId)return;
      if(trainer.mode==='business'){++startCheck;checking=false;}
      trainer.setMainMonster(monsterId);
      if(trainer.mode==='business')releaseLease();
      try {localStorage.setItem(mainMonsterKey,JSON.stringify(trainer.mainMonsterId));}
      catch {trainer.log('目标怪物已切换，但无法保存；刷新后恢复原设置');}
      render();
    };
    panel.querySelector('[data-profession]').onchange=event=>{
      ++startCheck; checking=false;
      trainer.setStyle(event.currentTarget.value); releaseLease();
      try { localStorage.setItem(styleKey,trainer.style); }
      catch { trainer.log('职业已切换，但无法保存偏好；刷新后默认法师'); }
      render();
    };
    panel.querySelector('[data-fold]').onclick=event=>{
      const body=panel.querySelector('.body'); body.hidden=!body.hidden;
      panel.querySelector('section').setAttribute('data-folded',String(body.hidden));
      event.currentTarget.textContent=body.hidden?'+':'−';
      event.currentTarget.setAttribute('aria-label',body.hidden?'展开面板':'收起面板');
      event.currentTarget.setAttribute('aria-expanded',String(!body.hidden));
    };
    panel.querySelector('[data-start]').onclick=()=>startScheduling();
    panel.querySelector('[data-item-target-quantity]').value='100';
    panel.querySelector('[data-item-target-start]').onclick=()=>startScheduling({
      itemId:Number(panel.querySelector('[data-item-target-item]').value),
      quantity:Number(panel.querySelector('[data-item-target-quantity]').value)
    });
    panel.querySelector('[data-item-target-cancel]').onclick=()=>{
      ++startCheck;checking=false;trainer.cancelItemTarget();render();
    };
    panel.querySelector('[data-pause]').onclick=()=>{++startCheck;checking=false;trainer.pause();releaseLease();render();};
    panel.querySelector('[data-equipment-details]').ontoggle=()=>{rendered='';render();};
    panel.querySelector('[data-export]').onclick=()=>{
      const report={version:SCRIPT_VERSION,exportedAt:new Date().toISOString(),client:GAME_DATA.client,
        profession:trainer.style,mode:trainer.mode,mainTrade:trainer.mainTrade,mainJobId:trainer.mainJobId,mainMonsterId:trainer.mainMonsterId,itemTarget:trainer.itemTargetStatus(),farmingPreference:planner.farmingPreference(),autoSell,potionRestock,capacitySales,boss:trainer.boss.status(trainer.player),metrics:trainer.telemetry.summary(),history:trainer.history,rejections,
        goal:trainer.goal,waitingGoals:trainer.waitingGoals,blocked:trainer.blockedReasons,market:market.summary(),
        growth:trainer.player&&trainer.mode==='balanced'?planner.growthStatus(trainer.player,trainer.style,trainer.deferred):null,
        specialization:trainer.player&&trainer.mode==='business'?planner.specializationStatus(trainer.player,trainer.style,trainer.mainTrade,trainer.mainJobId,trainer.mainMonsterId):null,
        quests:trainer.player?planner.questRead(trainer.player):[],
        equipment:trainer.player?planner.equipmentStatus(trainer.player,trainer.style):null};
      const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='deepvein-run-report.json';link.click();
      URL.revokeObjectURL(url);
    };
    panel.querySelector('[data-export-rejections]').onclick=()=>{
      const url=URL.createObjectURL(new Blob([JSON.stringify({version:SCRIPT_VERSION,rejections},null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='deepvein-rejections.json';link.click();URL.revokeObjectURL(url);
    };
    render();
    updates.check();
    prepareData().then(()=>{if(trainer.recovery||trainer.active)pump();});
  }
  function render() {
    bossLootChat.refresh();
    saveRun();
    saveMetrics();
    if (!panel) return;
    const p=trainer.player, lv=p?planner.levels(p):null;
    const itemTarget=trainer.itemTargetStatus(),targetChoices=planner.itemTargetChoices();
    const review=p?economy.review(p,trainer.goal,trainer.style):null;
    const metrics=trainer.telemetry.summary();
    const marketText=market.summary();
    const crops=p?planner.farmPlots(p):[], ready=crops.filter(c=>c.readyAt<=p.lastTick).length;
    const farming=p?planner.farmStatus(p):null;
    const preference=planner.farmingPreference(),choices=farmingChoices(p),selectedCrop=choices.find(j=>j.id===preference.jobId);
    const farmText=farming?(crops.length&&!ready?`最近约 ${Math.max(1,Math.ceil((Math.min(...crops.map(c=>c.readyAt))-p.lastTick)*GAME_DATA.tickMs/60000))} 分钟成熟。`:'')+
      (farming.reason??'等待下一次合批种收'):'登录角色后显示田地与种子库存。';
    const farmingNote=(preference.mode==='auto'?'按原料需求与种植收益选种，缺种整批补充；辅助模式只用现有种子。':
      !p?'登录角色后核对作物等级与种子库存。':
      !selectedCrop?'未指定有效作物，等待重新选择。':selectedCrop.locked?`${selectedCrop.name}需农业 ${selectedCrop.level} 级；保留选择，解锁前暂停农田调度。`:
      selectedCrop.seeds===0?'缺种：可收获成熟作物，空田等待指定种子，不改种其他作物。':`下次可播种时使用${selectedCrop.name}，不改种其他作物。`)+
      (trainer.mode==='assist'?' 辅助模式只用现有或收回种子，不买种、不采种。':'')+' 所有策略共用；下次农活生效，已开始的收种先完成。不铲除正在生长的作物。';
    const growth=p&&trainer.mode==='balanced'?planner.growthStatus(p,trainer.style,trainer.deferred):null;
    const business=p&&trainer.mode==='business'?planner.specializationStatus(p,trainer.style,trainer.mainTrade,trainer.mainJobId,trainer.mainMonsterId):null;
    const mainJobs=GAME_DATA.jobs.filter(j=>!j.grow&&j.skill===trainer.mainTrade).sort((a,b)=>a.levelReq-b.levelReq||a.id-b.id)
      .map(j=>({id:j.id,name:mainJobName(j),level:j.levelReq,locked:!p||lv[j.skill]<j.levelReq}));
    const selectedMainJob=mainJobs.find(j=>j.id===trainer.mainJobId);
    const mainMonsters=GAME_DATA.monsters.map(m=>({id:m.id,name:gameLabel(m.name),level:m.level})).sort((a,b)=>a.level-b.level||a.id-b.id);
    const selectedMainMonster=mainMonsters.find(m=>m.id===trainer.mainMonsterId);
    const boss=trainer.boss.status(p);
    const mainTradeName=trainer.mainTrade==='combat'?`${PROFESSIONS[trainer.style]}战斗`:MAIN_TRADES[trainer.mainTrade];
    const buffs=p?activeBuffs(GAME_DATA,p):[];
    const quests=p?planner.questRead(p):[];
    const job=GAME_DATA.jobs.find(j=>j.id===p?.route?.jobId);
    const zone=GAME_DATA.zones.find(z=>z.id===p?.route?.zoneId);
    const monster=zone&&GAME_DATA.monsters.find(m=>m.id===zone.monsterId);
    const work=job?`${NAMES[job.skill]} · ${job.name}`:monster?`战斗 · ${monster.name}`:'';
    const bossActivity=boss.owned?{attacking:'世界 Boss · 等待参战确认',fighting:boss.recentActivity?
      (boss.hit?'世界 Boss · 已命中，近期收到参战回报':'世界 Boss · 近期参战回报，等待有效命中'):
      (boss.hit?'世界 Boss · 曾命中，当前参战待确认':'世界 Boss · 当前参战待确认'),
      dead:'世界 Boss · 已阵亡，等待本轮结束',ended:'世界 Boss · 等待恢复原任务',resuming:'世界 Boss · 恢复原任务中'}[boss.phase]:null;
    const activity=bossActivity??(!p?'等待游戏状态':p.enhance?'强化装备':p.route?.phase==='toBank'?`返回仓库${work?`（${work}）`:''}`:
      p.activity==='walking'||p.path?.length?`行走中${work?`（${work}）`:''}`:
      p.activity==='working'?work||'工作中':`空闲${work?`（已安排${work}）`:''}`);
    const equipmentOpen=panel.querySelector('[data-equipment-details]').open;
    const signature=JSON.stringify([updates.state,autoSell,potionRestock,capacitySales,itemTarget,targetChoices,review,metrics,farmText,farming,preference,choices,marketText,growth,business,mainJobs,trainer.mainJobId,mainMonsters,trainer.mainMonsterId,boss,buffs,quests,activity,equipmentOpen,checking,compatibilityMessage,trainer.style,trainer.mode,trainer.mainTrade,trainer.active,trainer.message,trainer.goal,trainer.plan?.label,trainer.plan?.reason,lv,trainer.history,trainer.blockedReasons,rejections,rejectionsSaved]);
    if (signature===rendered) return;
    rendered=signature;
    panel.querySelector('[data-update-status]').textContent=updates.state.checking?'正在检查脚本更新…':updates.state.message;
    panel.querySelector('[data-update-check]').disabled=updates.state.checking;
    for(const selector of ['[data-update-badge]','[data-update-install]'])panel.querySelector(selector).href=updates.state.installUrl;
    panel.querySelector('[data-update-badge]').hidden=!updates.state.available;
    panel.querySelector('[data-update-badge]').textContent=updates.state.available?`新版 ${updates.state.available}`:'';
    const trained=planner.trainedSkills(trainer.style);
    panel.querySelector('[data-mode]').value=trainer.mode;
    const targetSelect=panel.querySelector('[data-item-target-item]'),targetSignature=JSON.stringify(targetChoices);
    if(targetSignature!==targetOptions) {
      targetOptions=targetSignature;
      const selected=targetSelect.value;
      targetSelect.replaceChildren();
      for(const item of targetChoices) {
        const option=document.createElement('option');option.value=String(item.itemId);option.textContent=gameLabel(item.name);targetSelect.append(option);
      }
      targetSelect.value=targetChoices.some(item=>String(item.itemId)===selected)?selected:String(itemTarget?.itemId??targetChoices[0]?.itemId??'');
    }
    const identity=itemTarget?`${itemTarget.playerId}:${itemTarget.itemId}:${itemTarget.quantity}`:'';
    if(identity!==targetIdentity) {
      targetIdentity=identity;
      if(itemTarget) {
        targetSelect.value=String(itemTarget.itemId);
        panel.querySelector('[data-item-target-quantity]').value=String(itemTarget.quantity);
      }
    }
    panel.querySelector('[data-item-target-summary]').textContent=!itemTarget?'未设置':itemTarget.completed?'已完成':itemTarget.status==='pending'?'待同步':`${itemTarget.gained} / ${itemTarget.quantity}`;
    panel.querySelector('[data-item-target-status]').textContent=!itemTarget?'指定一件物品，集中准备原料并获得所填数量。':
      itemTarget.completed?`${gameLabel(itemTarget.name)}：已另外获得 ${itemTarget.gained} / ${itemTarget.quantity} 个。${trainer.active?`已继续${TRAINING_MODE_LABELS[trainer.mode]}。`:'调度已暂停。'}`:
      itemTarget.status==='pending'?`${gameLabel(itemTarget.name)}：等待最新库存，另外获得 ${itemTarget.quantity} 个；原有库存不计入。`:
      `${gameLabel(itemTarget.name)}：新增 ${itemTarget.gained} / ${itemTarget.quantity} 个，还差 ${itemTarget.remaining} 个。${trainer.active?'':'已暂停，点击开始调度继续目标。'}`;
    panel.querySelector('[data-item-target-start]').disabled=checking||!!trainer.recovery||!p||!trainer.compatible||!targetChoices.length;
    panel.querySelector('[data-item-target-cancel]').disabled=!itemTarget;
    panel.querySelector('[data-main-trade-controls]').hidden=trainer.mode!=='business';
    panel.querySelector('[data-main-trade]').value=trainer.mainTrade;
    panel.querySelector('[data-main-job-controls]').hidden=trainer.mode!=='business'||['auto','combat'].includes(trainer.mainTrade);
    const mainJobSelect=panel.querySelector('[data-main-job]'),mainJobSignature=JSON.stringify(mainJobs);
    if(mainJobSignature!==mainJobOptions) {
      mainJobOptions=mainJobSignature;mainJobSelect.replaceChildren();
      const automatic=document.createElement('option');automatic.value='';automatic.textContent='自动选择本业工作';mainJobSelect.append(automatic);
      for(const job of mainJobs) {
        const option=document.createElement('option');option.value=String(job.id);option.disabled=job.locked;
        option.textContent=`${job.name} · ${job.level} 级${job.locked?' · 未解锁':''}`;mainJobSelect.append(option);
      }
    }
    const mainJobValue=trainer.mainJobId==null?'':String(trainer.mainJobId);
    if(mainJobSelect.value!==mainJobValue)mainJobSelect.value=mainJobValue;
    panel.querySelector('[data-main-job-info]').textContent=(selectedMainJob?
      selectedMainJob.locked?`${selectedMainJob.name}需${mainTradeName} ${selectedMainJob.level} 级；保留选择，不换其他工作。`:
        `固定${selectedMainJob.name}；补料、换装、收菜或 Boss 后返回。`:'在本业内自动比较收益与经验效率。')+' 切换后暂停调度，点击开始应用。';
    panel.querySelector('[data-main-monster-controls]').hidden=trainer.mode!=='business'||trainer.mainTrade!=='combat';
    const monsterSelect=panel.querySelector('[data-main-monster]'),monsterSignature=JSON.stringify(mainMonsters);
    if(monsterSignature!==mainMonsterOptions) {
      mainMonsterOptions=monsterSignature;monsterSelect.replaceChildren();
      const automatic=document.createElement('option');automatic.value='';automatic.textContent='自动选择战斗目标';monsterSelect.append(automatic);
      for(const monster of mainMonsters) {
        const option=document.createElement('option');option.value=String(monster.id);
        option.textContent=`${monster.name} · ${monster.level} 级`;monsterSelect.append(option);
      }
    }
    const monsterValue=trainer.mainMonsterId==null?'':String(trainer.mainMonsterId);
    if(monsterSelect.value!==monsterValue)monsterSelect.value=monsterValue;
    panel.querySelector('[data-main-monster-info]').textContent=(selectedMainMonster?`固定挑战 ${selectedMainMonster.name}；武器或食物不足以安全战斗时等待准备，不改打其他怪物。`:
      '根据职业、装备与补给自动选择安全的战斗目标。')+' 切换后暂停调度，点击开始应用。';
    panel.querySelector('[data-heading]').textContent=TRAINING_MODE_LABELS[trainer.mode]+(trainer.mode==='assist'?'':' · 职业专精');
    panel.querySelector('[data-settings-summary]').textContent=trainer.mode==='assist'?'仅辅助':PROFESSIONS[trainer.style];
    panel.querySelector('[data-run-state]').textContent=checking?'检查中':trainer.recovery?'待恢复':trainer.active?'运行中':p?'已暂停':'待登录';
    panel.querySelector('[data-run-state]').setAttribute('data-running',String(trainer.active));
    panel.querySelector('[data-auto-sell]').checked=autoSell;
    panel.querySelector('[data-potion-restock]').checked=potionRestock;
    panel.querySelector('[data-capacity-sales]').checked=capacitySales;
    panel.querySelector('[data-mode-info]').textContent=modeInfo[trainer.mode]+(trainer.mode==='business'&&!autoSell?' 自动出售关闭；收入比较只计直接获得的金币。':'');
    panel.querySelector('[data-training-policy]').textContent=trainer.mode==='assist'?
      '不安排练级、装备、交易或采购任务；不采种、不解锁新作物。玩家可继续编辑自己的队列，手动操作优先。':
      `自动打造换装 · ${autoSell?'比价出售与必要采购':capacitySales?'仅满仓清理普通盈余 · 必要采购':'不自动出售 · 必要采购'}。常规切换遵守背包／批次边界；世界 Boss 临时参与结束后继续原任务。`;
    for(const selector of ['[data-equipment-details]','[data-economy-details]','[data-market-details]','[data-buffs-details]','[data-quests-details]'])
      panel.querySelector(selector).hidden=trainer.mode==='assist';
    panel.querySelector('[data-more-details]').hidden=trainer.mode==='assist';
    panel.querySelector('[data-equipment-policy]').textContent=trainer.mode==='balanced'?
      '穿戴等级、制作技能与供料技能分别检查。材料已解锁的有效提升会优先准备；尚缺前置技能的列出条件。':
      trainer.mode==='business'?'按主业需要和预计回本选择工具或战斗装备；这里也列出其它装备门槛，列出不代表立即制作。':
      '按预计经验收益和准备时间选择装备升级；列出全部门槛供参考，不强制逐件制作。';
    panel.querySelector('[data-profession]').value=trainer.style;
    panel.querySelector('[data-profession-info]').textContent=trainer.mode==='assist'?'辅助模式不安排职业练级或换装，使用角色当前装备。':
      `${PROFESSIONS[trainer.style]}路线 · 主修${NAMES[professionSkill(trainer.style)]} · 防御／生命自然提升，不单独追级`;
    panel.querySelector('[data-status]').textContent=trainer.message;
    panel.querySelector('[data-last-rejection]').hidden=!rejections.length;
    panel.querySelector('[data-rejection-details]').hidden=!rejections.length;
    panel.querySelector('[data-last-rejection]').textContent=rejections.length?
      `上次${rejections[0].scope==='guild'?'公会提示（不影响自动练级）':'服务器拒绝'}：${rejections[0].code}；详见下方记录${rejectionsSaved?'':'（未能保存，刷新前请导出）'}`:'';
    panel.querySelector('[data-rejections]').textContent=rejections.map(r=>
      `${new Date(r.time).toLocaleString()} · v${r.version} · ${r.code}`+
      `\n当时${r.active?'正在调度':'已暂停'}；${r.stale?'过期消息；':''}${r.scope==='guild'?'公会功能返回，与自动任务分开处理':'错误归属未确定'}`+
      `\n待确认操作：${r.pending?`${translateGameText(r.pending.label??r.pending.intent?.t??'未知')} (${r.pending.intent?.t??'未知'})`:'无'}`+
      (r.pendingConfirmed?'；同帧已观察到成功回报':'')).join('\n\n');
    panel.querySelector('[data-goal]').textContent=trainer.goal ?
      `目标：${NAMES[trainer.goal.skill]} · ${trainer.goal.reason??`目标 ${trainer.goal.target} 级`}` :
      trainer.mode==='balanced'?'检查落后技能、阶段装备和供料，选择下一项成长任务':
      trainer.mode==='experience'?'比较当前可执行路线的总经验效率，选择下一批工作':
      trainer.mode==='assist'?'等待合批收菜或世界 Boss；玩家自行安排原队列':
      trainer.mainTrade!=='auto'?`指定主业：${mainTradeName}${selectedMainJob?` · ${selectedMainJob.name}`:selectedMainMonster?` · ${selectedMainMonster.name}`:''}；准备本业工作和必要供料`:'比较持续收入与市场需求，自动选择主业和必要供料';
    panel.querySelector('[data-activity]').textContent=`当前：${activity}`;
    panel.querySelector('[data-growth]').textContent=growth?
      `当前阶段：${growth.stage??'等待条件'} 级\n待补齐：${growth.remaining.map(s=>`${NAMES[s.skill]} ${s.level}`).join('、')||'无'}`+
      (growth.deferred.length?`\n生长／条件等待：${growth.deferred.map(s=>NAMES[s.skill]).join('、')}`:'')+
      '\n防御／生命随战斗自然提升，不参与阶段对齐。强化目标 +5，逐次确认；预算不足或失败时暂缓。':
      trainer.mode==='experience'?'允许偏科；计入供料与旅行时间，以总经验效率选路线。农业仍在后台合批处理。':
      trainer.mode==='business'?(trainer.mainTrade!=='auto'?`指定主业：${mainTradeName}${selectedMainJob?` · 指定工作：${selectedMainJob.name}`:selectedMainMonster?` · 指定怪物：${selectedMainMonster.name}`:''}\n`:'')+
        (business?.skill?`当前主业：${NAMES[business.skill]??business.skill}\n${business.reason??''}`:
          trainer.mainTrade!=='auto'?'等待开始或本业条件满足；不自动更换指定主业。':'主业待评估：开始后按可执行路线和市场买单选择。')+
        '\n市场报价为有限批次估算，不保证成交；保持主业稳定，必要时补料或换工具。':
      trainer.mode==='assist'?'收菜等待已种田地全部成熟；只用已有或收回种子补种。世界 Boss 参与完成后继续原队列。':'';
    panel.querySelector('[data-buffs]').textContent=buffs.length?buffs.map(b=>
      `${b.label}${POTIONS.some(v=>v.kind===b.kind)?` · 当前效力 ×${b.power}`:''} · 本类总剩余 ${b.remainingSeconds>=3600?`${Math.floor(Math.ceil(b.remainingSeconds/60)/60)} 小时 ${Math.ceil(b.remainingSeconds/60)%60} 分钟`:`${Math.ceil(b.remainingSeconds/60)} 分钟`}`).join('\n'):'暂无生效的药水或食物增益';
    panel.querySelector('[data-quests]').textContent=quests.length?quests.map(q=>{
      const name=q.kind==='kill'?GAME_DATA.monsters.find(m=>m.id===q.monsterId)?.name:
        GAME_DATA.jobs.find(j=>j.id===q.jobId)?.name;
      const skill=q.kind==='kill'?professionSkill(trainer.style):q.reward.skill;
      return `${q.period==='daily'?'日常':'周常'} · ${name??'未知目标'} · ${q.done}/${q.goal}`+
        `\n${q.claimed?'已领取':q.remaining<=0?'待领取':`剩余 ${q.remaining} 次`} · ${q.reward.coins} 金币 + ${q.reward.xp} ${NAMES[skill]??skill}经验`;
    }).join('\n\n'):'等待游戏任务数据';
    if(p&&equipmentOpen) {
      const slots={weapon:'武器',helmet:'头部',body:'上衣',legs:'腿部',shield:'副手',ring:'戒指',amulet:'项链',pickaxe:'镐',axe:'斧',rod:'钓竿',pan:'锅',hammer:'锤',knife:'刀',hoe:'锄',gloves:'手套',needle:'针',mortar:'研钵'};
      const describe=(g,label)=>{
        if(!g)return '';
        const needs=g.requirements.filter(r=>(lv[r.skill]??0)<r.target).map(r=>`${NAMES[r.skill]??r.skill} ${r.target}`);
        const materials=Object.entries(g.materials).map(([id,qty])=>`${GAME_DATA.items[planner.base(+id)]?.name??id} ×${qty}`).join('、');
        return `\n${label}：${g.name}（${g.wear.skill==='none'?'无等级门槛':`${NAMES[g.wear.skill]??g.wear.skill} ${g.wear.level}`}）`+
          (g.owned?' · 已持有':needs.length?`\n先解锁：${needs.join('、')}`:`\n${Number.isFinite(g.seconds)?'前置技能已满足':'需掉落或市场来源'}`)+
          (materials?`\n缺料：${materials}`:'');
      };
      panel.querySelector('[data-equipment]').textContent=planner.equipmentStatus(p,trainer.style).map(s=>
        `${slots[s.slot]??s.slot}：${s.current?.name??'未装备'}${describe(s.upgrade,'当前可穿')}${describe(s.next,'下一档')}`).join('\n\n');
    }
    panel.querySelector('[data-task]').textContent=trainer.plan?.label??'';
    panel.querySelector('[data-reason]').textContent=trainer.plan?.reason??'';
    panel.querySelector('[data-task]').hidden=!trainer.plan?.label;
    panel.querySelector('[data-reason]').hidden=!trainer.plan?.reason;
    panel.querySelector('[data-farm]').textContent=farmText;
    panel.querySelector('[data-farm-fields]').textContent=farming?`${farming.fields} 块已解锁`:'等待田地状态';
    panel.querySelector('[data-farm-ready]').textContent=farming?String(ready):'—';
    panel.querySelector('[data-farm-growing]').textContent=farming?String(crops.length-ready):'—';
    panel.querySelector('[data-farm-empty]').textContent=farming?String(farming.empty):'—';
    panel.querySelector('[data-farming-mode]').value=preference.mode;
    panel.querySelector('[data-farming-crop-controls]').hidden=preference.mode!=='manual';
    panel.querySelector('[data-farming-note]').textContent=farmingNote;
    const cropSelect=panel.querySelector('[data-farming-crop]'),optionsSignature=JSON.stringify(choices);
    if(optionsSignature!==farmingOptions) {
      farmingOptions=optionsSignature;cropSelect.replaceChildren();
      for(const choice of choices) {
        const option=document.createElement('option');option.value=String(choice.id);option.disabled=choice.locked;
        option.textContent=`${choice.name} · ${choice.level} 级 · ${choice.locked?'未解锁':`种子 ${choice.seeds}`}`;
        cropSelect.append(option);
      }
    }
    const cropValue=preference.jobId==null?'':String(preference.jobId);
    if(cropSelect.value!==cropValue)cropSelect.value=cropValue;
    const bossPhase={saving:'确认保留原任务和队列',ready:'准备出发',moving:'正在前往',attacking:'等待参战确认',
      fighting:boss.recentActivity?(boss.hit?'已命中，近期收到参战回报':'近期收到参战回报，等待有效命中'):
        (boss.hit?'曾命中，等待新的参战回报':'等待新的参战回报'),dead:'本轮已阵亡，保留贡献并等待结束',
      ended:'本轮结束，等待恢复原任务',resuming:'恢复原任务中',manual:'玩家正在参战，助手让行',watching:'等待可参与机会'};
    const lastBoss=boss.lastResult;
    panel.querySelector('[data-boss]').textContent=boss.name?`世界 Boss：${boss.name} · ${bossPhase[boss.phase]??'等待状态'}`:
      lastBoss?`世界 Boss 上轮：${lastBoss.name} · ${lastBoss.hit?'服务器已确认命中':lastBoss.attackSent===true?'已请求加入，未收到有效命中确认':lastBoss.attackSent===false?'未请求加入':'旧版记录，加入请求未知'}；${lastBoss.reason}`:
      '世界 Boss：等待服务器公布';
    panel.querySelector('[data-market]').textContent=marketText;
    panel.querySelector('[data-metrics]').textContent=`累计经验 ${Math.round(metrics.totalXp)} · 净金币 ${Math.round(metrics.netCoins)}\n`+
      `观测经验 ${Math.round(metrics.xpPerHour)}/时 · 净金币 ${Math.round(metrics.coinsPerHour)}/时\n`+
      `工作 ${Math.round(metrics.activeSeconds/60)} 分钟 · 空闲 ${Math.round(metrics.idleSeconds/60)} 分钟`;
    panel.querySelector('[data-inventory]').textContent=review?review.items.sort((a,b)=>b.sell-a.sell).map(i=>
      `${i.name}：${autoSell||capacitySales?`${autoSell?'':'仅满仓时：'}留 ${i.keep}，可卖候选 ${i.sell}${i.sell>i.sellFromBank?'（部分需先存仓）':''}`:`不自动出售，计划保留量 ${i.keep}`}\n${i.reason}`
    ).join('\n\n'):'等待角色库存';
    panel.querySelector('[data-enhancement]').textContent=review?review.enhancements.map(e=>
      `${e.name} +${e.fromPlus}→+${e.toPlus}：${e.recommendation}\n${e.benefit}\n${e.gold} 金币 + ${e.shards} 碎片；成功率 ${(e.chance*100).toFixed(1)}%${e.affordable?'':'；当前材料不足'}`
    ).join('\n\n'):'等待装备状态';
    panel.querySelector('[data-blocked]').textContent=Object.entries(trainer.blockedReasons).map(([skill,why])=>`暂缓${NAMES[skill]}：${why}`).join('；');
    panel.querySelector('[data-client]').textContent=compatibilityMessage;
    panel.querySelector('[data-start]').disabled=checking||trainer.active||!!trainer.recovery||!p||!trainer.compatible;
    panel.querySelector('[data-pause]').disabled=!checking&&!trainer.active&&!trainer.recovery;
    panel.querySelector('section').setAttribute('data-running',String(checking||trainer.active||!!trainer.recovery));
    panel.querySelector('.run-state').title=translateGameText(trainer.message);
    // Translate only display text; planner identities and exported diagnostics stay intact.
    for(const selector of ['data-status','data-goal','data-activity','data-growth','data-buffs','data-quests',
      'data-equipment','data-task','data-reason','data-farm','data-farming-note','data-boss','data-market',
      'data-inventory','data-enhancement','data-blocked']) {
      const element=panel.querySelector(`[${selector}]`);
      element.textContent=translateGameText(element.textContent);
    }
    const grid=panel.querySelector('.levels'); grid.replaceChildren();
    if (lv) for (const [skill,n] of Object.entries(lv)) {
      const row=document.createElement('span'), value=document.createElement('b');
      row.textContent=NAMES[skill]; value.textContent=String(n);
      if (!trained.includes(skill)) {row.className='excluded';value.textContent=`${n} · 不练`;}
      else if (['defence','hitpoints'].includes(skill)) value.textContent=`${n} · 随战斗`;
      else if (skill===trainer.goal?.skill) row.className='low';
      row.append(value); grid.append(row);
    }
    const log=panel.querySelector('ol'); log.replaceChildren();
    for (const entry of trainer.history) {
      const li=document.createElement('li');
      li.textContent=`${new Date(entry.time).toLocaleTimeString()} ${translateGameText(entry.message)}`; log.append(li);
    }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded',mount,{once:true});
  function pump() {
    if (pumping) return;
    pumping=true;
    try {
      if (trainer.active||trainer.recovery) {
        if (!claimLease()) trainer.pause('另一个标签页已接管调度');
        else if(dataReady) {
          const boss=trainer.boss.status();
          if(trainer.active&&!trainer.recovery&&boss.phase==='fighting'&&!boss.recentActivity&&
            trainer.snapshotSequence>trainer.syncAfter&&Date.now()-trainer.received<=45000&&
            nativeBossJoinButton()&&trainer.boss.retryNativeJoin(trainer.player))
            trainer.log('长期未收到个人参战回报，重新点击原生加入；本轮只补入一次');
          trainer.tick();
        }
      } else releaseLease();
    } catch (error) {
      if ((trainer.active||trainer.recovery)&&socket?.readyState!==NativeWebSocket.OPEN) trainer.connectionLost();
      else {trainer.pause(`调度已暂停：${error.message}`);releaseLease();}
    } finally {pumping=false;}
    render();
  }
  const timer=setInterval(()=>{pump();updates.check();},1000);
  let pageHidden=document.hidden;
  document.addEventListener('visibilitychange',()=>{
    const returned=pageHidden&&!document.hidden;pageHidden=document.hidden;
    if(!returned||(!trainer.active&&!trainer.recovery)||trainer.awaitingWelcome||socket?.readyState!==NativeWebSocket.OPEN)return;
    // Invalidate the old snapshot before pumping; foregrounding is not permission to replay work.
    foregroundSequence=trainer.snapshotSequence;trainer.syncAfter=trainer.snapshotSequence;
    const lastSync=Math.max(trainer.lastSync,...recentRequests.queries.filter(r=>r.intent.t==='resync').map(r=>r.time));
    trainer.nextSync=Math.max(Date.now(),lastSync+2000);
    pump();
  });
  window.addEventListener('pagehide',()=>{saveRun();saveMetrics(true);clearInterval(timer);releaseLease();bossLootChat.destroy();},{once:true});
})();

})();
