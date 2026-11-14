// Multilingual encyclopedic dataset for celestial bodies and exploration history.

export const PLANET_DATA = {
  moon: {
    en: {
      name: 'Moon',
      kicker: 'Earth Natural Satellite',
      subtitle: 'Earth sole natural satellite and humanity first off-world proving ground.',
      radius: '1,737.4 km',
      gravity: '0.166 g (1.62 m/s²)',
      day_length: '29.5 Earth days (708 hours)',
      temperature: '-130°C to +120°C',
      heritage_summary: 'Apollo descent stages, LRVs, ALSEP packages, Surveyor landers',
      story: [
        'The Moon is humanity first stepping stone into the cosmos and Earth only natural satellite. Devoid of atmosphere, wind, or rain, its basalt plains (maria) and ancient highland craters preserve every footprint, rover wheel track, and descent stage in pristine stillness.',
        'Between 1969 and 1972, the Apollo program landed twelve humans on the lunar surface. When each crew ascended into orbit, they left behind their descent stages to serve as launch pads. Alongside these monuments sit electric lunar rovers, nuclear-powered ALSEP stations, and robotic Surveyor landers, creating an enduring outdoor museum of human ingenuity under the black lunar sky.'
      ],
      facts: [
        'Preserved for millennia: Without erosion from weather or liquid water, artifacts left on the Moon will remain recognizable for millions of years.',
        'Lunar ringing: Passive seismometers from Apollo ALSEP proved that the dry, fractured lunar crust vibrates for hours like a bell following heavy impacts.',
        'Tranquility Base: The Apollo 11 descent stage carries a stainless steel plaque declaring: We came in peace for all mankind.',
        'Thermal extremes: Surface temperatures swing by over 250 degrees Celsius between the two-week lunar night and lunar midday.'
      ]
    },
    ru: {
      name: 'Луна',
      kicker: 'Естественный спутник Земли',
      subtitle: 'Единственный естественный спутник Земли и первая площадка высадки человечества.',
      radius: '1737.4 км',
      gravity: '0.166 g (1.62 м/с²)',
      day_length: '29.5 земных суток (708 часов)',
      temperature: 'от -130°C до +120°C',
      heritage_summary: 'Ступени Apollo, вездеходы LRV, станции ALSEP и Surveyor',
      story: [
        'Луна - первый рубеж человечества на пути в дальний космос и единственный естественный спутник Земли. Лишенная атмосферы, ветра и дождей, ее поверхность хранит каждый след подошвы, колеи луноходов и посадочные ступени в первозданной тишине.',
        'С 1969 по 1972 год программа Apollo доставила на Луну двенадцать исследователей. При возвращении экипажей на орбиту посадочные платформы оставались служить стартовыми столами. Рядом с ними застыли лунные электромобили, ядерные научные комплексы ALSEP и роботизированные станции Surveyor, образовав вечный музей инженерной мысли человечества.'
      ],
      facts: [
        'Сохранность на миллионы лет: Без атмосферной эрозии и воды оставленное оборудование сохранится в неизменном виде миллионы лет.',
        'Лунный резонанс: Сейсмометры Apollo ALSEP доказали, что сухие лунные недра гудят от ударов часами, словно гигантский колокол.',
        'База Спокойствия: Посадочная ступень Apollo 11 несет памятную табличку со словами: Мы пришли с миром от всего человечества.',
        'Температурные перепады: Перепад температур между 14-суточной лунной ночью и зенитным днем превышает 250 градусов Цельсия.'
      ]
    },
    kk: {
      name: 'Ай',
      kicker: 'Жердің табиғи серігі',
      subtitle: 'Жердің жалғыз табиғи серігі және адам баласы аяқ басқан алғашқы аспан денесі.',
      radius: '1737.4 км',
      gravity: '0.166 g (1.62 м/с²)',
      day_length: '29.5 жер тәулігі (708 сағат)',
      temperature: '-130°C-тан +120°C-қа дейін',
      heritage_summary: 'Apollo қону сатылары, LRV көліктері, ALSEP және Surveyor кешендері',
      story: [
        'Ай - адамзаттың ашық ғарышқа жасаған алғашқы қадамы және Жердің жалғыз табиғи серігі. Атмосферасы, желі мен жаңбыры жоқ ай беті әрбір ізді, көлік дөңгелегінің ізін және қону сатыларын мыңдаған жылдар бойы бастапқы қалпында сақтайды.',
        '1969 бен 1972 жылдар аралығында Apollo бағдарламасы бойынша Ай бетіне он екі ғарышкер аяқ басты. Олар орбитаға қайта көтерілгенде қону сатылары ұшыру тұғыры ретінде төменде қалды. Олардың қасында ай көліктері, SNAP-27 плутоний станциялары және Surveyor аппараттары мәңгілік тыныштықта тұр.'
      ],
      facts: [
        'Миллиондаған жылдық сақталу: Атмосфера мен су болмағандықтан, Ай бетіндегі барлық жабдық миллион жыл бойы бұзылмай сақталады.',
        'Ай жаңғырығы: Apollo ғарышкерлері орнатқан сейсмометрлер қатты соққы кезінде Ай қойнауы қола қоңыраудай бірнеше сағат жаңғырығатынын дәлелдеді.',
        'Тыныштық базасы: Apollo 11 қону сатысында Біз бүкіл адамзат атынан бейбітшілікпен келдік деген тарихи жазу бар.',
        'Тәуліктік температура ауытқуы: 14 күндік түн мен күн арасындағы температура айырмашылығы 250 градустан асады.'
      ]
    }
  },
  mars: {
    en: {
      name: 'Mars',
      kicker: 'The Red Planet',
      subtitle: 'Humanity premier robotic proving ground and future outpost.',
      radius: '3,389.5 km',
      gravity: '0.379 g (3.72 m/s²)',
      day_length: '24h 39m 35s (1 sol)',
      temperature: '-140°C to +20°C',
      heritage_summary: 'Viking stations, Pathfinder, Spirit, Opportunity, Phoenix, InSight, Ingenuity',
      story: [
        'Mars is humanity greatest robotic proving ground. Known as the Red Planet due to iron oxide minerals covering its plains, Mars possesses colossal ancient volcanoes, canyon valleys carved by ancient waters, and frozen polar ice caps.',
        'Over the past half-century, robotic pioneers have made Mars their permanent silent home. From the stationary Viking landers that sent the first surface color panoramas, to long-distance wheeled explorers like Opportunity and Spirit, and the historic powered flights of Ingenuity, these machines built the foundation for future human explorers.'
      ],
      facts: [
        'Colossal Volcano: Olympus Mons stands 21.9 km tall, nearly three times the height of Mount Everest, making it the tallest volcano in the Solar System.',
        'Ancient Liquid Water: Hematite blueberries discovered by Opportunity confirmed that liquid water once pooled and flowed on Mars for long geological epochs.',
        'Thin Atmosphere: Surface atmospheric pressure is less than 1% of Earth, composed of 95% carbon dioxide, yet sufficient to host dust devils and global storms.',
        'First Off-World Flight: The Ingenuity helicopter proved powered aerodynamic flight is possible in thin alien air, completing 72 historic sorties.'
      ]
    },
    ru: {
      name: 'Марс',
      kicker: 'Красная планета',
      subtitle: 'Главный полигон роботизированных миссий и будущий форпост человечества.',
      radius: '3389.5 км',
      gravity: '0.379 g (3.72 м/с²)',
      day_length: '24 ч 39 мин 35 с (1 сол)',
      temperature: 'от -140°C до +20°C',
      heritage_summary: 'Станции Viking, Pathfinder, Spirit, Opportunity, Phoenix, InSight, Ingenuity',
      story: [
        'Марс - главный полигон роботизированных исследований человечества. Названный Красной планетой из-за оксидов железа, покрывающих его пустыни, Марс обладает колоссальными древними вулканами, каньонами высохших рек и полярными шапками из водяного льда и углекислоты.',
        'За последние полвека роботизированные первопроходцы стали постоянными обитателями планеты. От неподвижных станций Viking, передавших первые цветные панорамы, до колесных марафонцев Spirit и Opportunity и исторического вертолета Ingenuity, эти машины заложили научный фундамент для будущей высадки людей.'
      ],
      facts: [
        'Колоссальный вулкан: Гора Олимп вздымается на 21.9 км, что почти в три раза выше Эвереста, являясь высочайшим вулканом Солнечной системы.',
        'Следы древней воды: Гематитовая черника, найденная Opportunity, окончательно доказала, что на Марсе длительное время существовали озера жидкой воды.',
        'Разреженная атмосфера: Давление у поверхности составляет менее 1% земного, а атмосфера на 95% состоит из углекислого газа.',
        'Первый атмосферный полет: Вертолет Ingenuity доказал возможность управляемого винтокрылого полета в разреженном воздухе, совершив 72 успешных вылета.'
      ]
    },
    kk: {
      name: 'Марс',
      kicker: 'Қызыл ғаламшар',
      subtitle: 'Адамзаттың ең басты роботтандырылған зерттеу алаңы және болашақ мекені.',
      radius: '3389.5 км',
      gravity: '0.379 g (3.72 м/с²)',
      day_length: '24 сағ 39 мин 35 с (1 сол)',
      temperature: '-140°C-тан +20°C-қа дейін',
      heritage_summary: 'Viking станциялары, Pathfinder, Spirit, Opportunity, Phoenix, InSight, Ingenuity',
      story: [
        'Марс - адамзаттың ең басты роботтандырылған зерттеу алаңы. Топырағындағы темір тотығына байланысты Қызыл ғаламшар аталған Марста күн жүйесіндегі ең биік жанартаулар, ежелгі өзен аңғарлары және мұзды полярлық қабаттар бар.',
        'Соңғы жарты ғасырда роботталған барлаушылар бұл ғаламшарды өз үйіне айналдырды. Алғашқы түсті панорамаларды жіберген Viking аппараттарынан бастап, 45 шақырым жүріп өткен Opportunity роверіне және өзге әлемде алғаш рет ұшқан Ingenuity тікұшағына дейін бұл техника адамзаттың келуіне жол салып берді.'
      ],
      facts: [
        'Алып жанартау: Олимп тауының биіктігі 21.9 км құрайды, бұл Эвересттен үш есе биік әрі бүкіл Күн жүйесіндегі ең зәулім жанартау.',
        'Ежелгі судың іздері: Opportunity ровері тапқан гематит көкжидектері Марста миллиондаған жылдар бойы тұщы сұйық су болғанын нақты дәлелдеді.',
        'Өте жұқа атмосфера: Марс атмосферасының қысымы Жердің бір пайызына да жетпейді, оның 95 пайызы көмірқышқыл газынан тұрады.',
        'Өзге ғаламшардағы алғашқы ұшу: Ingenuity тікұшағы сирек ауада басқарылатын винтті ұшудың мүмкін екенін дәлелдеп, 72 рет сәтті әуеге көтерілді.'
      ]
    }
  },
  ceres: {
    en: {
      name: 'Ceres',
      kicker: 'Dwarf Planet',
      subtitle: 'Largest world in the asteroid belt, orbited perpetually by the silent Dawn probe.',
      radius: '473 km',
      gravity: '0.029 g (0.28 m/s²)',
      day_length: '9 hours 4 minutes',
      temperature: '-105°C to -38°C',
      heritage_summary: 'Dawn spacecraft in permanent orbital graveyard',
      story: [
        'Ceres is the largest body in the main asteroid belt between Mars and Jupiter. Composed of rock and water ice, it represents an ancient protoplanetary relic from the dawn of our solar system.',
        'After exploring asteroid Vesta, NASA Dawn spacecraft entered orbit around Ceres in 2015. When its hydrazine attitude fuel ran out in 2018, Dawn was left in a perpetual stable orbit, where it will silently drift for decades without contaminating the surface.'
      ],
      facts: [
        'Bright Faculae: Cerealia Facula in Occator Crater contains bright sodium carbonate salt deposits reflecting sunlight.',
        'Cryovolcanism: Ahuna Mons is a 4-km-high cryovolcano that erupted brine-slurry instead of molten lava.',
        'Water Reservoir: Ceres may contain substantial amounts of water ice beneath its dark crust.'
      ]
    },
    ru: {
      name: 'Церера',
      kicker: 'Карликовая планета',
      subtitle: 'Крупнейшее тело пояса астероидов, навечно оберегаемое зондом Dawn.',
      radius: '473 км',
      gravity: '0.029 g (0.28 м/с²)',
      day_length: '9 часов 4 минуты',
      temperature: 'от -105°C до -38°C',
      heritage_summary: 'Зонд Dawn на стабильной орбите вечного покоя',
      story: [
        'Церера - крупнейший объект главного пояса астероидов между Марсом и Юпитером. Состоящая из смеси камня и водяного льда, она представляет собой древнейший протопланетный реликт эпохи формирования Солнечной системы.',
        'В 2015 году зонд NASA Dawn вышел на орбиту Цереры после изучения Весты. Когда в 2018 году закончилось гидразиновое топливо, станцию оставили на расчетной вечной орбите, где она продолжит бесшумно кружить десятилетиями.'
      ],
      facts: [
        'Яркие пятна: В кратере Оккатор обнаружены яркие отложения солей карбоната натрия, ослепительно сияющие на солнце.',
        'Криовулканизм: Гора Ахуна высотой 4 км является ледяным криовулканом, извергавшим соленый ил.',
        'Запасы льда: Недра Цереры содержат значительное количество замерзшей воды под темной поверхностью.'
      ]
    },
    kk: {
      name: 'Церера',
      kicker: 'Ергежейлі ғаламшар',
      subtitle: 'Астероидтар белдеуіндегі ең үлкен дене және Dawn зондының мәңгілік мекені.',
      radius: '473 км',
      gravity: '0.029 g (0.28 м/с²)',
      day_length: '9 сағат 4 минут',
      temperature: '-105°C-тан -38°C-қа дейін',
      heritage_summary: 'Dawn ғарыш аппараты мәңгілік орбитада',
      story: [
        'Церера - Марс пен Юпитер арасындағы негізгі астероидтар белдеуіндегі ең ірі нысан. Тас пен су мұзынан тұратын бұл ғаламшар күн жүйесінің қалыптасу дәуірінен сақталған жәдігер болып табылады.',
        '2015 жылы NASA-ның Dawn зонды Церера орбитасына шықты. 2018 жылы гидразин жанармайы таусылғанда, аппарат осы ғаламшардың айналасындағы тұрақты орбитада мәңгілікке үнсіз қалдырылды.'
      ],
      facts: [
        'Жарқыраған тұздар: Оккатор кратерінде күн сәулесіне шағылысатын ақ түсті натрий карбонаты тұздары табылды.',
        'Криожанартау: Биіктігі 4 км Ахуна тауы лаваның орнына тұзды мұз атқылаған криожанартау болып табылады.',
        'Су қоры: Церераның қараңғы қыртысы астында мол мұз қабаты бар.'
      ]
    }
  },
  eros: {
    en: {
      name: '433 Eros',
      kicker: 'Near-Earth Asteroid',
      subtitle: 'Elongated peanut-shaped asteroid bearing the landed NEAR Shoemaker probe.',
      radius: '8.4 km (mean radius)',
      gravity: '0.0006 g (0.0059 m/s²)',
      day_length: '5 hours 16 minutes',
      temperature: '-150°C to +100°C',
      heritage_summary: 'NEAR Shoemaker landed robotic probe',
      story: [
        '433 Eros is an S-type near-Earth asteroid shaped like a tumbling peanut. Measuring roughly 34 kilometers in length, its cratered and boulder-strewn surface represents pristine primitive planetary building blocks.',
        'On February 12, 2001, NASA NEAR Shoemaker became the first human spacecraft ever to touch down on an asteroid. Designed only as an orbiter, it performed an improvised soft descent, survived landing, and beamed signals from the dusty asteroid surface for two weeks.'
      ],
      facts: [
        'Historic Touchdown: NEAR Shoemaker landed at a gentle speed of less than 2 meters per second in 2001.',
        'Regolith Ponding: Surface images showed flat ponds of fine dust filling low depressions and crater bottoms.',
        'Ancient Composition: Eros is an undifferentiated chondritic body that has remained largely unaltered since the early Solar System.'
      ]
    },
    ru: {
      name: '433 Эрос',
      kicker: 'Околоземный астероид',
      subtitle: 'Вытянутый астероид, принявший на свою поверхность аппарат NEAR Shoemaker.',
      radius: '8.4 км (средний радиус)',
      gravity: '0.0006 g (0.0059 м/с²)',
      day_length: '5 часов 16 минут',
      temperature: 'от -150°C до +100°C',
      heritage_summary: 'Посадочный роботизированный зонд NEAR Shoemaker',
      story: [
        '433 Эрос - околоземный астероид типа S, имеющий форму вытянутого арахиса длиной 34 километра. Его испещренная кратерами и валунами поверхность представляет собой первичный строительный материал Солнечной системы.',
        '12 февраля 2001 года станция NEAR Shoemaker стала первым аппаратом в истории, совершившим посадку на поверхность астероида. Изначально спроектированный только для орбитальных съемок, зонд выполнил мягкое касание со скоростью пешехода и передавал сигналы с поверхности еще две недели.'
      ],
      facts: [
        'Историческая посадка: NEAR Shoemaker коснулся поверхности со скоростью менее 2 м/с в феврале 2001 года.',
        'Пылевые озера: Снимки аппарата выявили загадочные плоские скопления тончайшей пыли на дне кратеров.',
        'Первозданный состав: Эрос представляет собой недифференцированный хондрит, почти не изменившийся за 4.5 млрд лет.'
      ]
    },
    kk: {
      name: '433 Эрос',
      kicker: 'Жер маңындағы астероид',
      subtitle: 'NEAR Shoemaker зонды қонған сопақша пішінді көне астероид.',
      radius: '8.4 км (орташа радиусы)',
      gravity: '0.0006 g (0.0059 м/с²)',
      day_length: '5 сағат 16 минут',
      temperature: '-150°C-тан +100°C-қа дейін',
      heritage_summary: 'NEAR Shoemaker автоматты ғарыш аппараты',
      story: [
        '433 Эрос - ұзындығы 34 шақырымға созылған жержаңғақ пішіндес Жерге жақын астероид. Тастар мен кратерлерге толы оның беті Күн жүйесінің алғашқы құрылыс материалдарынан тұрады.',
        '2001 жылғы 12 ақпанда NASA-ның NEAR Shoemaker аппараты астероид бетіне алғаш рет қонған тарихи зонд болды. Бастапқыда тек орбитадан түсіруге арналғанына қарамастан, ол жұмсақ қонуды орындап, астероид бетінен тағы екі апта бойы сигнал таратты.'
      ],
      facts: [
        'Тарихи қону: NEAR Shoemaker 2001 жылы секундына 2 метрден аз жылдамдықпен астероидқа қонды.',
        'Шаңды көлдер: Аппарат кратер түбіндегі тегіс ұсақ шаң жиналған орындарды суретке түсірді.',
        'Көне құрылым: Эрос 4.5 миллиард жыл бойы өзгермеген бастапқы хондрит затынан тұрады.'
      ]
    }
  },
  solar_system: {
    en: {
      name: 'Deep Space',
      kicker: 'Interstellar Expanse',
      subtitle: 'Solar System escape trajectories carrying mankind silent interstellar scouts.',
      radius: 'Over 130 AU',
      gravity: 'Microgravity',
      day_length: 'Infinite trajectory',
      temperature: '2.7 K (-270.4°C, CMB)',
      heritage_summary: 'Pioneer 10 & 11, Kepler Space Telescope, Voyager probes',
      story: [
        'Beyond planetary surfaces, discarded human hardware drifts endlessly across the void of interplanetary and interstellar space. Deep space missions conquered the asteroid belt, explored giant outer worlds, and broke free from the gravitational grip of the Sun.',
        'Craft like Pioneer 10 and 11 carry engraved gold-anodized aluminum plaques with greetings from Earth, cruising past the heliopause toward distant stellar constellations. In heliocentric orbits nearby, telescopes like Kepler confirmed thousands of alien worlds before falling silent.'
      ],
      facts: [
        'Golden Plaques: Pioneer 10 and 11 carry pictorial messages showing human figures and Solar System coordinates for any extraterrestrial finders.',
        'Beyond the Sun: Pioneer and Voyager probes are traveling on hyperbolic escape trajectories that will never return to the Sun.',
        'Exoplanet Bounty: Kepler observed over 530,000 stars and confirmed 2,662 exoplanets before fuel exhaustion ended its mission in 2018.'
      ]
    },
    ru: {
      name: 'Дальний космос',
      kicker: 'Межзвездное пространство',
      subtitle: 'Траектории гравитационного ухода, уносящие межзвездных разведчиков за пределы Солнечной системы.',
      radius: 'Более 130 а.е.',
      gravity: 'Микрогравитация',
      day_length: 'Бесконечная траектория',
      temperature: '2.7 K (-270.4°C, реликтовый фон)',
      heritage_summary: 'Пионер-10 и 11, телескоп Кеплер, аппараты Вояджер',
      story: [
        'За пределами твердых планетных поверхностей по безмолвной пустоте межпланетного и межзвездного пространства бесконечно дрейфуют исторические аппараты человечества. Они первыми преодолели пояс астероидов, исследовали планеты-гиганты и преодолели гравитацию Солнца.',
        'Аппараты Пионер-10 и Пионер-11 несут позолоченные алюминиевые пластинки с посланием человечества, направляясь к далеким созвездиям. Неподалеку на гелиоцентрических орбитах дрейфует телескоп Кеплер, открывший тысячи экзопланет до того, как его радиопередатчики замолчали.'
      ],
      facts: [
        'Золотые пластинки: Пионер-10 и 11 несут гравированные послания с изображением людей и координат Солнечной системы.',
        'За пределы Солнца: Аппараты движутся по незамкнутым гиперболическим траекториям и никогда не вернутся обратно.',
        'Охотник за планетами: Кеплер изучил более 530 000 звезд и подтвердил существование 2662 экзопланет до выработки топлива в 2018 году.'
      ]
    },
    kk: {
      name: 'Терең ғарыш',
      kicker: 'Жұлдызаралық кеңістік',
      subtitle: 'Күн жүйесінен тыс жұлдызаралық кеңістікке бет алған үнсіз барлаушылар траекториясы.',
      radius: '130 а.б. астам',
      gravity: 'Микрогравитация',
      day_length: 'Шексіз траектория',
      temperature: '2.7 K (-270.4°C, реликтік сәуле)',
      heritage_summary: 'Пионер-10 және 11, Кеплер телескопы, Вояджер аппараттары',
      story: [
        'Ғаламшарлардың қатты қабатынан тыс, жұлдызаралық кеңістіктің түпсіз тереңдігінде адамзаттың тарихи аппараттары мәңгілікке жүзіп барады. Олар астероидтар белдеуін ең алғаш кесіп өтіп, алып ғаламшарларды зерттеп, Күннің тартылыс күшінен босап шықты.',
        'Пионер-10 және Пионер-11 аппараттары Жерден сәлемдеме жазылған алтын жалатылған пластиналарды алып, алыс шоқжұлдыздарға бет алды. Олардың қасында мыңдаған экзопланеталарды ашып үнсіз қалған Кеплер ғарыш телескопы күн орбитасымен бірге қалқып келеді.'
      ],
      facts: [
        'Алтын пластиналар: Пионер-10 және 11 адамдардың суреті мен Күн жүйесінің координаттары бейнеленген пластиналарды тасымалдауда.',
        'Күннен тысқары: Бұл зондтар Күн жүйесіне ешқашан қайта оралмайтын гиперболалық траекториямен ұшуда.',
        'Ғаламшарлар аңшысы: Кеплер 530 мыңнан астам жұлдызды бақылап, жанармайы таусылғанша 2662 жаңа экзопланетаны ғылыми растады.'
      ]
    }
  }
};

export function getPlanetData(bodyCode, lang = 'en') {
  const normalizedCode = bodyCode || 'moon';
  const bodyInfo = PLANET_DATA[normalizedCode] || PLANET_DATA.moon;
  return bodyInfo[lang] || bodyInfo.en || PLANET_DATA.moon.en;
}
