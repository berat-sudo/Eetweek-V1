import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from './models/Recipe.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Default userId voor system recipes = NULL
// (dus géén userId invullen)
const SYSTEM_USER = null;

const recipes = [
  {
    name: "Aubergine stoof met zoete aardappel",
    
    tags: ["vegan", "glutenvrij", "lactosevrij"],
    image: "/Fotos/Firefly_Aubergine stoof met zoete aardappel 373271.jpg",
    duration: 50,
    ingredients: [ { "item": "Milde olijfolie", "amount": "0.5 el" },
      { "item": "Grote ui", "amount": "0.25 stuk, fijngesnipperd" },
      { "item": "Knoflook", "amount": "0.75 teen" },
      { "item": "Verse gember", "amount": "0.5 cm" },
      { "item": "Komijnpoeder", "amount": "0.25 tl" },
      { "item": "Kaneel", "amount": "0.25 tl" },
      { "item": "Nootmuskaat", "amount": "0.13 tl" },
      { "item": "Gerookt paprikapoeder", "amount": "0.25 tl" },
      { "item": "Aubergine", "amount": "0.25 stuk, in blokjes" },
      { "item": "Zoete aardappel", "amount": "125 g, geschild en in blokjes" },
      { "item": "Tomatenblokjes (uit blik)", "amount": "100 g" },
      { "item": "Kikkererwten (uit blik)", "amount": "66.25 g" },
      { "item": "Medjool dadel", "amount": "0.5 stuk, in kleine stukjes" },
      { "item": "Groentebouillon", "amount": "50 ml" },
      { "item": "Peper en zout", "amount": "naar smaak" },
      { "item": "Verse peterselie", "amount": "0.25 handje, fijngehakt" },
      { "item": "Amandelen (geroosterd)", "amount": "0.25 handje" },
      { "item": "Citroensap", "amount": "optioneel, naar smaak" } ],
    instructions: [ "Stap 1: Verhit de olijfolie in een grote braadpan of stoofpan op middelhoog vuur.<br>Stap 2: Voeg de ui toe en fruit 2-3 minuten tot deze zacht en licht goudbruin is.<br>Stap 3: Voeg de knoflook en gember toe en bak 1 minuut mee.<br>Stap 4: Voeg de komijnpoeder, kaneel, nootmuskaat en gerookt paprikapoeder toe. Roer goed door zodat de specerijen kort meebakken en hun geur vrijgeven.<br>Stap 5: Voeg de aubergine- en zoete aardappelblokjes toe en roer goed door zodat ze bedekt zijn met de specerijen en olie.<br>Stap 6: Voeg de tomatenblokjes, kikkererwten, stukjes dadel en groentebouillon toe. Breng op smaak met zout en peper.<br>Stap 7: Breng het geheel zachtjes aan de kook, zet het vuur laag en laat 30-35 minuten stoven tot de groenten zacht zijn en de saus dik is geworden. Roer tussendoor een paar keer goed door.<br>Stap 8: Roer de fijngehakte peterselie erdoor en proef. Voeg eventueel extra zout, peper of een beetje citroensap toe voor een frisse smaak.<br>Stap 9: Serveer de stoof warm met couscous, rijst, naan of flatbread.<br>Stap 10: Garneer eventueel met extra kruiden en geroosterde amandelen." ],
    macros: { protein: 11, carbs: 40, fat: 9 }
  },

  {
    name: "Romige kikkererwtensoep",
    
    tags: ["vegan", "glutenvrij", "lactosevrij", "soep", "gezond", "comfort food"],
    image: "/Fotos/Firefly_Romige kikkererwtensoep 922716.jpg",
    duration: 40,
    ingredients: [ { "item": "Olijfolie (mild)", "amount": "0.25 el" },
      { "item": "Rode ui", "amount": "0.25 stuk, fijngehakt" },
      { "item": "Knoflook", "amount": "0.75 teen, fijngehakt" },
      { "item": "Gerookt paprikapoeder", "amount": "0.25 tl" },
      { "item": "Rozemarijn (gedroogd)", "amount": "0.25 tl" },
      { "item": "Tijm", "amount": "0.25 tl" },
      { "item": "Chilivlokken", "amount": "0.13 tl" },
      { "item": "Kikkererwten (uit blik)", "amount": "0.5 blik (à 400 g)" },
      { "item": "Wortel", "amount": "0.25 stuk, geschild en in blokjes" },
      { "item": "Groentebouillon", "amount": "200 ml" },
      { "item": "Peper en zout", "amount": "naar smaak" },
      { "item": "Kikkererwten voor topping", "amount": "0.25 blik (à 400 g)" },
      { "item": "Olijfolie voor topping", "amount": "0.25 el" },
      { "item": "Paprikapoeder (gerookt)", "amount": "0.25 tl" },
      { "item": "Komijnpoeder", "amount": "0.25 tl" } ],
    instructions: [ "Stap 1: Verwarm de oven voor op 200°C.<br>Stap 2: Dep de kikkererwten voor de topping goed droog met een schone theedoek.<br>Stap 3: Meng in een kom de olijfolie, paprikapoeder, komijnpoeder, peper en zout. Verdeel de kikkererwten over een bakplaat met bakpapier en rooster 25–30 minuten tot ze krokant zijn. Schud halverwege even om.<br>Stap 4: Verhit in een soeppan 0.25 el olijfolie op middelhoog vuur. Voeg de knoflook toe en bak 1 minuut tot deze geurt.<br>Stap 5: Voeg paprikapoeder, rozemarijn, tijm, chilivlokken en wat zwarte peper toe en roer kort door.<br>Stap 6: Voeg de uitgelekte kikkererwten, de blokjes wortel en de groentebouillon toe. Roer goed door.<br>Stap 7: Breng de soep aan de kook, zet het vuur lager en laat 25 minuten zachtjes pruttelen met het deksel schuin op de pan. Roer af en toe door.<br>Stap 8: Pureer de soep glad en romig met een staafmixer of blender.<br>Stap 9: Proef en breng op smaak met zout en extra peper. Voeg eventueel wat extra bouillon of water toe als je een dunnere soep wilt.<br>Stap 10: Schep de soep in kommen en garneer met de geroosterde kikkererwten en een scheutje olijfolie.<br>Stap 11: Serveer eventueel met een stuk brood voor een volledige maaltijd." ],
    macros: { protein: 13, carbs: 32, fat: 7 }
  },
  {
    name: "Quiche caprese",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "quiche", "Italiaans", "lunch", "hartig", "gezond"],
    image: "/Fotos/Firefly_Quiche caprese 782758.jpg",
    duration: 55,
    ingredients: [
      { item: "Mozzarella", amount: "0.25 bol" },
      { item: "Pijnboompitten", amount: "7.5 g" },
      { item: "Cherrytomaatjes", amount: "100 g" },
      { item: "Eieren", amount: "1.25 stuks" },
      { item: "Crème fraîche", amount: "31.25 g" },
      { item: "Peper en zout", amount: "snufje" },
      { item: "Pesto", amount: "12.5 g" },
      { item: "Bladerdeeg", amount: "1.5 vellen" },
      { item: "Oregano", amount: "0.25 tl" },
      { item: "Paneermeel", amount: "0.25 el" }
    ],
    instructions: [
      "Stap 1: Verwarm de oven voor op 200°C.",
      "Stap 2: Laat de bladerdeegvellen iets ontdooien.",
      "Stap 3: Vet de quichevorm (24–26 cm) in en bekleed met de bladerdeegvellen. Druk de randen goed aan.",
      "Stap 4: Bestrooi de bodem met paneermeel om te voorkomen dat deze vochtig wordt.",
      "Stap 5: Halveer de cherrytomaatjes en verdeel ze over de bodem.",
      "Stap 6: Snijd de mozzarella in dunne plakjes en daarna in kleinere stukjes. Verdeel deze over de tomaatjes.",
      "Stap 7: Klop in een kom de eieren los met crème fraîche, pesto, oregano, peper en zout.",
      "Stap 8: Giet het mengsel gelijkmatig over de quichevulling.",
      "Stap 9: Strooi de pijnboompitten erover en verdeel eventueel wat extra pesto bovenop.",
      "Stap 10: Bak de quiche in het midden van de oven ca. 35 minuten goudbruin en gaar.",
      "Stap 11: Laat de quiche even afkoelen voordat je hem aansnijdt — zo blijft de bodem mooi stevig.",
      "Stap 12: Serveer eventueel met verse basilicum of rucola voor extra frisheid."
    ],
    macros: { protein: 18, carbs: 28, fat: 22 }
  },
  {
    name: "Andijviestamppot met spekjes",
    //userId: DEFAULT_USER_ID,
    tags: ["Hollands", "stamppot", "winter", "vlees", "comfortfood", "aardappels"],
    image: "/Fotos/Rudolphs-recept-_0042_Andijvie-Stamppot-met-Spekjes_0839-853x1024-2.jpg",
    duration: 35,
    ingredients: [
      { item: "Kruimige aardappels", amount: "300 g" },
      { item: "Andijvie", amount: "200 g" },
      { item: "Melk", amount: "50 ml" },
      { item: "Boter", amount: "1 klontje" },
      { item: "Peper en zout", amount: "naar smaak" },
      { item: "Spekjes", amount: "125 g" },
      { item: "Ui", amount: "0.5 stuks" }
    ],
    instructions: [
      "Stap 1: Schil de aardappels, snijd ze in stukken en kook ze in 15–20 minuten gaar.",
      "Stap 2: Bak ondertussen de spekjes en de fijngesneden ui in een droge koekenpan tot ze goudbruin zijn.",
      "Stap 3: Giet de aardappels af en stamp ze fijn met een stamper.",
      "Stap 4: Voeg een flinke scheut warme melk toe, samen met een klontje boter, peper en eventueel wat zout. Stamp tot een smeuïge puree.",
      "Stap 5: Voeg de andijvie beetje bij beetje toe en roer goed door tot alles gemengd is.",
      "Stap 6: Laat de stamppot nog een paar minuten op laag vuur staan zodat de andijvie iets slinkt.",
      "Stap 7: Schep de spekjes en ui erdoor of verdeel ze erover.",
      "Stap 8: Serveer direct, eventueel met wat appelmoes als bijgerecht."
    ],
    macros: { protein: 23, carbs: 32, fat: 18 }
  },
  {
    name: "Mac and cheese (macaroni met kaas)",
    //userId: DEFAULT_USER_ID,
    tags: ["comfortfood", "oven", "vegetarisch", "pasta", "kaas"],
    image: "/Fotos/Firefly_Mac and cheese (macaroni met kaas) 724647.jpg",
    duration: 40,
    ingredients: [
      { item: "Macaroni", amount: "75 g" },
      { item: "Boter", amount: "10 g" },
      { item: "Bloem", amount: "10 g" },
      { item: "Halfvolle melk", amount: "150 ml" },
      { item: "Geraspte jonge kaas", amount: "31.25 g" },
      { item: "Cheddar kaas", amount: "31.25 g" },
      { item: "Paprikapoeder", amount: "0.25 tl" },
      { item: "Knoflookpoeder", amount: "0.25 tl" },
      { item: "Nootmuskaat", amount: "0.13 tl" },
      { item: "Peper en zout", amount: "snuf" },
      { item: "Paneermeel of panko", amount: "0.5 el" }
    ],
    instructions: [
      "Stap 1: Verwarm de oven voor op 200°C.",
      "Stap 2: Kook de macaroni volgens de aanwijzingen op de verpakking beetgaar, giet af en zet apart.",
      "Stap 3: Smelt de boter in een ruime pan en voeg de bloem toe. Roer met een garde tot een gladde roux en laat 2 minuten zachtjes garen.",
      "Stap 4: Voeg beetje bij beetje de melk toe terwijl je blijft kloppen tot een gladde saus ontstaat. Laat kort indikken op laag vuur.",
      "Stap 5: Voeg ¾ van de jonge kaas en ¾ van de cheddar toe aan de saus en laat smelten.",
      "Stap 6: Breng de kaassaus op smaak met paprikapoeder, knoflookpoeder, nootmuskaat, peper en zout. Optioneel kun je wat chilipoeder toevoegen voor extra pit.",
      "Stap 7: Voeg de gekookte macaroni toe aan de saus en roer goed door tot alles mooi gemengd is.",
      "Stap 8: Giet het mengsel in een ovenschaal en strooi de resterende kaas en het paneermeel of panko erover.",
      "Stap 9: Bak de mac and cheese 20 minuten in de oven tot de bovenkant goudbruin en krokant is.",
      "Stap 10: Laat een paar minuten afkoelen voor het serveren. Bewaar eventueel afgedekt tot 2 dagen in de koelkast."
    ],
    macros: { protein: 21, carbs: 39, fat: 17 }
  },
  {
    name: "Babi pangang",
    //userId: DEFAULT_USER_ID,
    tags: ["Chinees", "vlees", "rijsttafel", "zoetzure saus", "comfortfood"],
    image: "/Fotos/Firefly_Babi pangang 724647.jpg",
    duration: 40,
    ingredients: [
      { item: "Hamlappen of varkenslappen (of vega stukjes)", amount: "100 g" },
      { item: "Ketjap", amount: "1 el" },
      { item: "Knoflook", amount: "0.5 teen" },
      { item: "Sambal", amount: "0.25 tl" },
      { item: "Zonnebloemolie", amount: "1 el" },
      { item: "Ui", amount: "0.5 stuk" },
      { item: "Gember", amount: "1 cm, fijn" },
      { item: "Tomatenpuree", amount: "35 g" },
      { item: "Citroensap", amount: "0.5 el" },
      { item: "Donkere basterdsuiker", amount: "1 el" },
      { item: "Ketchup", amount: "2.5 el" },
      { item: "Ketjap (extra voor saus)", amount: "0.25 el" },
      { item: "Chinees vijfkruidenpoeder", amount: "snuf" },
      { item: "Groentebouillon", amount: "75 ml" },
      { item: "Maïzena", amount: "0.25 el" }
    ],
    instructions: [
      "Stap 1: Snijd het vlees (of vega stukjes) in kleine stukjes en meng met 2 el ketjap, 0.25 tl sambal, 2 el zonnebloemolie en het geperste teentje knoflook. Laat dit marineren.",
      "Stap 2: Snijd de ui en gember fijn. Verhit 1 el zonnebloemolie in een pannetje en bak ui en gember 2 minuten.",
      "Stap 3: Voeg tomatenpuree toe en bak 1 minuut mee.",
      "Stap 4: Voeg citroensap, basterdsuiker, ketchup, 0.25 el ketjap en Chinees vijfkruidenpoeder toe en roer goed.",
      "Stap 5: Giet de groentebouillon erbij en breng zachtjes aan de kook.",
      "Stap 6: Meng de maïzena met 1 el water en voeg dit papje toe aan de saus. Laat ca. 10 minuten indikken. Voeg eventueel extra maïzena toe voor een dikkere saus.",
      "Stap 7: Bak het vlees of de vega stukjes gaar in een pan.",
      "Stap 8: Schep het gebakken vlees door de saus zodat alles goed bedekt is.",
      "Stap 9: Serveer met witte rijst, atjar, gebakken uitjes of een frisse komkommersalade."
    ],
    macros: { protein: 27, carbs: 22, fat: 15 }
  },
  {
    name: "Burrito met gehakt",
    //userId: DEFAULT_USER_ID,
    tags: ["Mexicaans", "wrap", "gehakt", "comfortfood", "makkelijk", "vlees"],
    image: "/Fotos/Firefly_Burrito met gehakt 724647.jpg",
    duration: 35,
    ingredients: [
      { item: "Rundergehakt (of vega)", amount: "62.5 g" },
      { item: "Burrito kruiden", amount: "0.25 el" },
      { item: "Tomatenpuree", amount: "0.5 el" },
      { item: "Zwarte bonen (of kidneybonen)", amount: "32.5 g" },
      { item: "Maïs", amount: "35 g" },
      { item: "Ui", amount: "0.25 stuk" },
      { item: "Knoflook", amount: "0.5 teen" },
      { item: "Tortilla wraps", amount: "1 grote" },
      { item: "Rijst", amount: "25 g" },
      { item: "Tomaat", amount: "0.5 stuk" },
      { item: "Geraspte kaas", amount: "18.75 g" },
      { item: "Avocado", amount: "0.5 stuk" },
      { item: "Zure room", amount: "1 el" }
    ],
    instructions: [
      "Stap 1: Kook de rijst volgens de verpakking en laat uitlekken en iets afkoelen.",
      "Stap 2: Snipper de ui en knoflook. Verhit een beetje olie in een pan en fruit de ui glazig. Voeg de knoflook toe en bak kort mee.",
      "Stap 3: Voeg het gehakt toe en bak rul in enkele minuten bruin.",
      "Stap 4: Roer de Mexicaanse kruiden en tomatenpuree erdoor en bak nog 2 minuten mee. Voeg vervolgens de uitgelekte mais en bonen toe. Breng op smaak met peper en eventueel extra kruiden of chili voor pit.",
      "Stap 5: Snijd de tomaat in kleine blokjes. Halveer de avocado, verwijder pit en schil, en prak het vruchtvlees fijn. Voeg eventueel een beetje citroensap toe.",
      "Stap 6: Beleg elke wrap in het midden met avocadopuree, gekookte rijst, gehaktmengsel, zure room, tomaat en geraspte kaas.",
      "Stap 7: Vouw de onderkant van de burrito over de vulling, vouw de zijkanten dicht en rol op. Optioneel kun je wat zure room op het randje smeren zodat hij goed dicht blijft.",
      "Stap 8: Verhit een pan met een beetje olie en bak de burrito's ca. 3 minuten goudbruin, met de naad naar beneden.",
      "Stap 9: Serveer direct of bewaar maximaal 2 dagen in de koelkast goed verpakt. Opwarmen kan in de oven of magnetron."
    ],
    macros: { protein: 21, carbs: 34, fat: 15 }
  },
  {
    name: "Pasta carbonara",
    //userId: DEFAULT_USER_ID,
    tags: ["Italiaans", "pasta", "klassieker", "snel", "comfortfood"],
    image: "/Fotos/Firefly_Pasta carbonara 772330.jpg",
    duration: 25,
    ingredients: [
      { item: "Spaghetti", amount: "100 g" },
      { item: "Gerookte spekblokjes of reepjes (pancetta of buikspek)", amount: "50 g" },
      { item: "Verse peterselie", amount: "handje" },
      { item: "Parmezaanse kaas (of Pecorino Romano)", amount: "25 g" },
      { item: "Eieren", amount: "0.75 stuk" },
      { item: "Peper", amount: "snuf" },
      { item: "Zout", amount: "snuf" }
    ],
    instructions: [
      "Stap 1: Bak de spekblokjes in een pan krokant, maar niet volledig uitgebakken. Laat ze uitlekken op keukenpapier.",
      "Stap 2: Kook de spaghetti in een grote pan met water en snufje zout ca. 10 minuten al dente. Vang een kopje pastawater op na het afgieten.",
      "Stap 3: Doe de spaghetti terug in de pan en voeg de gebakken spekjes toe. Zet het vuur uit.",
      "Stap 4: Kluts de eieren in een kom en voeg de geraspte kaas toe. Breng op smaak met peper.",
      "Stap 5: Giet het eiermengsel langzaam bij de spaghetti en roer direct door. Zorg dat de pasta heet genoeg is om de eieren te binden, maar niet te heet om roerei te voorkomen.",
      "Stap 6: Voeg eventueel een beetje pastawater toe voor een smeuïgere saus.",
      "Stap 7: Proef en breng op smaak met extra peper of zout. Garneer met wat kaas en verse peterselie.",
      "Stap 8: Serveer eventueel met een frisse salade. Voor een vegetarische variant kun je de spekblokjes vervangen door champignons of vegetarische spekjes."
    ],
    macros: { protein: 21, carbs: 55, fat: 15 }
  },
  {
    name: "Italiaanse pastasalade met pesto",
    //userId: DEFAULT_USER_ID,
    tags: ["Italiaans", "pastasalade", "lunch", "vegetarisch", "snel"],
    image: "/Fotos/Firefly_Italiaanse pastasalade met pesto 772330.jpg",
    duration: 20,
    ingredients: [
      { item: "Fusilli pasta", amount: "50 g" },
      { item: "Cherrytomaatjes", amount: "66.67 g" },
      { item: "Rucola", amount: "13.33 g" },
      { item: "Komkommer", amount: "0.17 stuk" },
      { item: "Zongedroogde tomaten", amount: "1.67 stuk" },
      { item: "Mini mozzarella balletjes", amount: "0.33 zak" },
      { item: "Basilicum (vers)", amount: "0.17 handje" },
      { item: "Pijnboompitten", amount: "0.5 eetlepel" },
      { item: "Peper", amount: "snuf" },
      { item: "Zout", amount: "snuf" },
      { item: "Olie", amount: "0.17 scheutje" },
      { item: "Pesto", amount: "15 g" },
      { item: "Citroensap", amount: "0.33 eetlepel" }
    ],
    instructions: [
      "Stap 1: Kook de fusilli pasta volgens de aanwijzingen op de verpakking beetgaar (8-10 min). Giet af, spoel kort met koud water en laat goed uitlekken.",
      "Stap 2: Snijd de cherrytomaatjes doormidden, de komkommer in blokjes en de zongedroogde tomaten in reepjes. Laat de mozzarella uitlekken. Hak de basilicum grof.",
      "Stap 3: Meng de pesto, olie, peper, zout en citroensap tot een dressing.",
      "Stap 4: Doe de gekookte pasta in een grote schaal. Voeg rucola, cherrytomaatjes, komkommer, zongedroogde tomaat, mozzarella en basilicum toe en meng met de pesto dressing.",
      "Stap 5: Rooster de pijnboompitten kort in een droge koekenpan tot ze goudbruin zijn en strooi deze over de salade.",
      "Stap 6: Laat de salade even staan zodat de smaken intrekken en serveer op kamertemperatuur voor de beste smaak."
    ],
    macros: { protein: 9, carbs: 35, fat: 12 }
  },
  {
    name: "Gevulde paprika met spinazie en feta",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "Grieks", "paprika", "glutenvrij", "koolhydraatarm"],
    image: "/Fotos/Firefly_Gevulde paprika met spinazie en feta 724647.jpg",
    duration: 45,
    ingredients: [
      { item: "Paprika", amount: "1 stuk" },
      { item: "Spinazie (vers)", amount: "100 g" },
      { item: "Knoflook", amount: "1 teen" },
      { item: "Amandelen", amount: "25 g" },
      { item: "Geraspte kaas", amount: "37.5 g" },
      { item: "Feta", amount: "75 g" },
      { item: "Ei", amount: "1 stuk" },
      { item: "Olijfolie", amount: "0.5 eetlepel" },
      { item: "Peper", amount: "snuf" },
      { item: "Zout", amount: "snuf" },
      { item: "Oregano", amount: "0.5 tl" }
    ],
    instructions: [
      "Stap 1: Verwarm de oven voor op 200°C en bekleed een ovenschaal met bakpapier of vet in.",
      "Stap 2: Snijd de paprika’s doormidden en verwijder de zaadlijsten. Leg de helften met de open kant naar boven in de ovenschaal.",
      "Stap 3: Hak de knoflook fijn. Verhit olijfolie in een pan en fruit de knoflook kort aan.",
      "Stap 4: Voeg in delen de spinazie toe en laat slinken.",
      "Stap 5: Doe de eieren in een kom, kruimel de feta erbij en voeg de helft van de geraspte kaas toe. Breng op smaak met peper, zout en oregano.",
      "Stap 6: Voeg de gebakken spinazie en fijngehakte amandelen toe. Meng alles goed door elkaar.",
      "Stap 7: Vul de paprikahelften met het spinaziemengsel en bestrooi de bovenkant met de rest van de geraspte kaas.",
      "Stap 8: Bak de gevulde paprika’s ca. 25 minuten in de oven tot ze gaar en licht goudbruin zijn.",
      "Stap 9: Laat eventueel afgedekt 2 dagen bewaren in de koelkast en warm opnieuw op in de oven."
    ],
    macros: { protein: 18, carbs: 10, fat: 20 }
  },
  {
    name: "Tacobowl met vega-gehakt",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "taco", "mexicaans", "glutenvrij"],
    image: "/Fotos/tacobowl_2.jpg",
    duration: 20,
    ingredients: [
      { item: "Basmati rijst", amount: "60 g" },
      { item: "Gehakt (vega)", amount: "100 g" },
      { item: "Rode ui", amount: "0.25 stuk" },
      { item: "Gerookt paprikapoeder", amount: "0.75 tl" },
      { item: "Cayennepeper", amount: "0.25 tl" },
      { item: "Komijn", amount: "0.25 tl" },
      { item: "Peper", amount: "snuf" },
      { item: "Zout", amount: "snuf" },
      { item: "Tomaten", amount: "1 stuk" },
      { item: "Avocado", amount: "0.5 stuk" },
      { item: "Limoen", amount: "0.25 stuk" },
      { item: "IJsbergsla", amount: "37.5 g" },
      { item: "Tacosaus", amount: "2 eetlepels" },
      { item: "Tortilla chips naturel", amount: "0.25 zak" },
      { item: "Crème fraîche of zure room", amount: "1 eetlepel" },
      { item: "Jalapeño uit pot", amount: "3 stuk" },
      { item: "Geraspte belegen kaas", amount: "30 g" }
    ],
    instructions: [
      "Stap 1: Kook de rijst volgens de verpakking gaar.",
      "Stap 2: Verhit olijfolie in een pan en fruit de ui.",
      "Stap 3: Voeg het (vega) gehakt toe samen met gerookt paprikapoeder, cayenne, komijn, peper en zout en bak mee.",
      "Stap 4: Snijd de tomaten in blokjes en prak de avocado met het sap van een halve limoen.",
      "Stap 5: Meng de helft van de taco saus door de gekookte rijst.",
      "Stap 6: Verdeel de rijst en ijsbergsla over twee kommen.",
      "Stap 7: Leg hierop het gehakt, de kaas, ingelegde rode ui, jalapeño, tomaten, avocado, resterende taco saus en zure room.",
      "Stap 8: Top af met tortilla chips en eventueel chili vlokjes. Serveer direct."
    ],
    macros: { protein: 18, carbs: 40, fat: 15 }
  },
  {
    name: "Pasta met cherrytomaatjes",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "pasta", "oven", "comfortfood"],
    image: "/Fotos/Firefly_Pasta met cherrytomaatjes 724647.jpg",
    duration: 30,
    ingredients: [
      { item: "Spaghetti", amount: "75 g" },
      { item: "Cherrytomaatjes", amount: "125 g" },
      { item: "Knoflook", amount: "1 teen" },
      { item: "Olie", amount: "0.5 eetlepel" },
      { item: "Ui", amount: "0.5 stuk" },
      { item: "Tomatenpuree", amount: "1 eetlepel" },
      { item: "Room", amount: "100 ml" },
      { item: "Parmezaanse kaas", amount: "1 eetlepel" },
      { item: "Basilicum", amount: "0.5 handje" },
      { item: "Oregano", amount: "0.5 tl" },
      { item: "Peper en zout", amount: "snuf" }
    ],
    instructions: [
      "Stap 1: Verwarm de oven voor op 200°C. Leg de cherrytomaatjes in een ovenschaal en meng met gehakte knoflook, olie, oregano, peper en zout. Bak 15 minuten tot ze zacht en licht geblakerd zijn.",
      "Stap 2: Kook de spaghetti volgens de verpakking gaar in gezouten water.",
      "Stap 3: Snipper de ui en fruit in een koekenpan met wat olie op middelhoog vuur. Voeg tomatenpuree toe en bak even mee.",
      "Stap 4: Voeg de room toe, laat zachtjes pruttelen tot een gladde saus. Breng op smaak met zout en peper.",
      "Stap 5: Meng de pasta met de saus, voeg de geroosterde cherrytomaatjes toe en roer goed door. Voeg eventueel kookvocht toe voor smeuïgheid.",
      "Stap 6: Serveer met Parmezaanse kaas en verse basilicum."
    ],
    macros: { protein: 12, carbs: 45, fat: 15 }
  },
  {
    name: "Miso aubergine uit de oven",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "vegan", "glutenvrij", "oven", "rijst"],
    image: "/Fotos/Firefly_Miso aubergine uit de oven 324465.jpg",
    duration: 45,
    ingredients: [
      { item: "Aubergines", amount: "1 stuk" },
      { item: "Bosui", amount: "1 bos" },
      { item: "Sesamzaadjes", amount: "0.5 eetlepel" },
      { item: "Rijst", amount: "75 g" },
      { item: "Roze peperbessen (optioneel)", amount: "0.5 eetlepel" },
      { item: "Misopasta", amount: "1 eetlepel" },
      { item: "Gember (geraspt)", amount: "1.5 cm" },
      { item: "Sesamolie", amount: "0.5 eetlepel" },
      { item: "Knoflook (fijngesneden)", amount: "0.5 teen" },
      { item: "Sojasaus (glutenvrij)", amount: "1 eetlepel" },
      { item: "Honing of agavesiroop", amount: "0.5 eetlepel" },
      { item: "Rijstazijn", amount: "0.5 eetlepel" }
    ],
    instructions: [
      "Stap 1: Verwarm de oven voor op 200°C. Halveer de aubergines in de lengte en snijd het vruchtvlees kruislings in, zonder de schil te beschadigen.",
      "Stap 2: Meng in een kom misopasta, geraspte gember, sesamolie, knoflook, sojasaus, honing en rijstazijn tot een gladde glaze.",
      "Stap 3: Leg de aubergines met de snijkant naar boven op een bakplaat met bakpapier en bestrijk royaal met de glaze. Zorg dat de glaze goed in de inkepingen komt.",
      "Stap 4: Bak 25–30 minuten tot ze zacht zijn en licht karamelliseren.",
      "Stap 5: Kook de rijst volgens de verpakking. Snijd de bosui in ringen en rooster de sesamzaadjes kort in een droge koekenpan.",
      "Stap 6: Serveer de aubergines met rijst, bosui, sesamzaadjes en eventueel roze peperbessen. Restjes zijn 3 dagen houdbaar in de koelkast en opnieuw op te warmen."
    ],
    macros: { protein: 6, carbs: 45, fat: 8 }
  },
  {
    name: "Gyoza salade",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "vegan", "lactose arm", "salade", "Aziatisch"],
    image: "/Fotos/Firefly_Gyoza salade met edamame en geraperde wortel 324465.jpg",
    duration: 20,
    ingredients: [
      { item: "Komkommer", amount: "0.25 stuk" },
      { item: "Edamame boontjes", amount: "50 g" },
      { item: "Peen julienne", amount: "37.5 g" },
      { item: "Gebakken uitjes", amount: "0.5 eetlepel" },
      { item: "Gyoza's (vega, diepvries)", amount: "5 stuks" },
      { item: "Wit sesamzaad", amount: "0.25 theelepel" },
      { item: "Zwart sesamzaad", amount: "0.25 theelepel" },
      { item: "Verse munt", amount: "0.25 handje" },
      { item: "Sojasaus", amount: "0.5 eetlepel" },
      { item: "Honing of agavesiroop", amount: "0.25 eetlepel" },
      { item: "Crispy chili olie", amount: "0.5 theelepel" },
      { item: "Sesamolie", amount: "0.75 eetlepel" },
      { item: "Limoensap", amount: "0.13 stuk" }
    ],
    instructions: [
      "Stap 1: Kook de edamame 3–4 minuten in ruim kokend water. Giet af, spoel met koud water en laat uitlekken.",
      "Stap 2: Bereid de gyoza volgens de verpakking (meestal eerst aanbakken in olie en dan stomen met een scheutje water). Laat iets afkoelen.",
      "Stap 3: Snijd de komkommer in stukjes en doe dit met peen julienne en edamame in een grote kom.",
      "Stap 4: Maak de dressing door sojasaus, honing, sesamolie, limoensap en crispy chili olie te mengen tot een gladde dressing.",
      "Stap 5: Voeg de gyoza toe aan de groenten, scheur de munt grof en doe erbij, voeg wit en zwart sesamzaad en gebakken uitjes toe.",
      "Stap 6: Giet de dressing over de salade en schep voorzichtig door. Serveer lauwwarm of koud. Tips: bewaar de dressing apart bij het bewaren om knapperigheid te behouden; voor een hoofdgerecht, houd 2–3 personen aan en voeg eventueel tofu of kip toe."
    ],
    macros: { protein: 8, carbs: 20, fat: 10 }
  },
  {
    name: "Pulled Jackfruit Taco's",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "vegan", "taco", "snelle maaltijd"],
    image: "/Fotos/Firefly_Pulled Jackfruit Taco's 772330.jpg",
    duration: 25,
    ingredients: [
      { item: "Mini wraps (corn & wheat)", amount: "4 stuks" },
      { item: "Jackfruit uit blik", amount: "140 g" },
      { item: "Barbecuesaus", amount: "50 ml" },
      { item: "Taco kruiden", amount: "0.5 eetlepel" },
      { item: "Avocado", amount: "0.5 stuk" },
      { item: "Verse koriander", amount: "0.5 bosje" },
      { item: "Maïs (Bonduelle)", amount: "70 g" },
      { item: "Zure room", amount: "62.5 ml" },
      { item: "Koolmix", amount: "75 g" },
      { item: "Ingelegde rode ui", amount: "0.5 stuk" },
      { item: "Limoen", amount: "0.5 stuk" }
    ],
    instructions: [
      "Stap 1: Laat de jackfruit uitlekken, spoel af en trek met een vork uit elkaar tot pulled vlees.",
      "Stap 2: Verhit olie in een pan, bak de jackfruit 5 minuten. Voeg bbq saus en tacokruiden toe en bak nog 10 minuten op laag vuur.",
      "Stap 3: Snijd avocado en limoen, laat de mais uitlekken en pluk de korianderblaadjes.",
      "Stap 4: Verwarm de mini wraps kort. Beleg met koolmix en het jackfruitmengsel.",
      "Stap 5: Verdeel avocado, mais, ingelegde ui en koriander over de taco’s.",
      "Stap 6: Werk af met zure room en een kneepje limoen. Serveer direct. Tip: Bewaar jackfruit en toppings apart in de koelkast maximaal 2 dagen. Voor vegan vervang de zure room door een plantaardige variant of soja kwark."
    ],
    macros: { protein: 7, carbs: 25, fat: 12 }
  },
  {
    name: "Souvlaki: Griekse spiesjes",
    //userId: DEFAULT_USER_ID,
    tags: ["vlees", "Grieks", "BBQ", "glutenvrij"],
    image: "/Fotos/Firefly_Souvlaki- Griekse spiesjes 772330.jpg",
    duration: 20,
    ingredients: [
      { item: "Varkenshaas", amount: "100 g" },
      { item: "Rode ui", amount: "0.5 stuk" },
      { item: "Olijfolie", amount: "scheutje" },
      { item: "Knoflook", amount: "0.25 teen" },
      { item: "Peper en zout", amount: "snufje" },
      { item: "Gedroogde oregano", amount: "0.25 theelepel" },
      { item: "Citroenrasp", amount: "0.25 theelepel" }
    ],
    instructions: [
      "Stap 1: Week de prikkers in water.",
      "Stap 2: Snijd de varkenshaas in grove stukken. Voeg knoflook, olijfolie, citroenrasp, peper, zout en oregano toe. Optioneel 3 uur marineren.",
      "Stap 3: Snijd de rode ui in partjes.",
      "Stap 4: Rijg het vlees afwisselend met ui aan de prikkers.",
      "Stap 5: Verhit grillpan of BBQ en bak de spiesjes ca. 5 minuten tot ze mooi bruin en nog iets rosé zijn.",
      "Stap 6: Serveer met pitabroodjes, tzatziki en citroenpartjes."
    ],
    macros: { protein: 22, carbs: 3, fat: 5 }
  },
  {
    name: "Pad Thai: Thaise noedel roerbak",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "glutenvrij", "lactose arm", "wok", "Thais", "kip", "tofu"],
    image: "/Fotos/Firefly_Pad Thai- Thaise noedel roerbak, met kip 324465.jpg",
    duration: 50,
    ingredients: [
      { item: "Rijstnoedels (platte)", amount: "50 g" },
      { item: "Bosui", amount: "1 stuk" },
      { item: "Rode ui", amount: "1 stuk" },
      { item: "Knoflook", amount: "1 teen" },
      { item: "Pinda's", amount: "0.5 handje" },
      { item: "Vissaus", amount: "1.5 eetlepel" },
      { item: "Sojasaus (glutenvrij)", amount: "1.5 eetlepel" },
      { item: "Limoensap", amount: "0.5 eetlepel" },
      { item: "Ei", amount: "1 stuk" },
      { item: "Taugé", amount: "25 g" },
      { item: "Champignons", amount: "25 g" },
      { item: "Verse koriander", amount: "naar smaak" },
      { item: "Zonnebloemolie", amount: "1 eetlepel" },
      { item: "Chili vlokjes", amount: "0.5 theelepel" },
      { item: "Kip of tofu (optioneel)", amount: "60 g" }
    ],
    instructions: [
      "Stap 1: Laat de rijstnoedels 30 minuten weken in koud water of kook ze kort en spoel af met koud water.",
      "Stap 2: Snijd de bosui, rode ui, knoflook en champignons. Klop het ei los.",
      "Stap 3: Verhit olie in een wok of pan en bak de rode ui, knoflook en helft van de bosui 2 minuten. Voeg champignons en eventueel tofu of kip toe en bak 3-4 minuten.",
      "Stap 4: Voeg de noedels toe en schep goed door. Voeg vissaus, limoensap en sojasaus toe.",
      "Stap 5: Schuif het geheel opzij en giet het ei aan de lege kant. Roer door tot roerei gevormd is en meng met de noedels.",
      "Stap 6: Voeg pinda's, koriander en taugé toe en meng kort door. Serveer met overgebleven bosui, extra koriander en chilivlokken."
    ],
    macros: { protein: 18, carbs: 45, fat: 12 }
  },
  {
    name: "Pannenkoeken: het beste basisrecept",
    //userId: DEFAULT_USER_ID,
    tags: ["vegetarisch", "ontbijt", "lunch", "snack", "basisrecept"],
    image: "/Fotos/Firefly_nederlandse platte Pannenkoeken met stroop en poedersuiker 324465.jpg",
    duration: 30,
    ingredients: [
      { item: "Bloem", amount: "112.5 g" },
      { item: "Eieren", amount: "1.13 stuks" },
      { item: "Melk", amount: "187.5 ml" },
      { item: "Zout", amount: "snufje" },
      { item: "Boter of margarine", amount: "om te bakken" },
      { item: "Optioneel: spek, appel, rozijnen en/of kaas", amount: "naar smaak" },
      { item: "Optioneel: stroop of poedersuiker", amount: "naar smaak" }
    ],
    instructions: [
      "Stap 1: Doe de bloem in een kom en voeg een snufje zout toe. Maak een kuiltje in het midden en kluts de eieren erdoor. Voeg een kwart van de melk toe en mix tot een glad beslag. Voeg beetje bij beetje de rest van de melk toe tot een egaal beslag.",
      "Stap 2: Verhit boter in een pan. Schep een lepel beslag in de pan en laat uitvloeien. Voeg eventueel appel, rozijnen of spek toe.",
      "Stap 3: Bak de pannenkoek tot de onderkant goudbruin is en de bovenzijde gestold. Draai om en bak de andere kant.",
      "Stap 4: Herhaal voor de rest van het beslag. Serveer met stroop of poedersuiker naar smaak."
    ],
    macros: { protein: 8, carbs: 45, fat: 6 }
  },
  {
    name: "Flammkuchen: klassiek met spekjes en ui",
    //userId: DEFAULT_USER_ID,
    tags: ["middagmaal", "borrelhapje", "gemiddeld", "klassiek", "Flammkuchen"],
    image: "/Fotos/Klassieke-flammkuchen-7.jpg",
    duration: 47,
    ingredients: [
      { item: "Flammkuchen deeg", amount: "0.5 portie (of kant-en-klaar)" },
      { item: "Crème fraîche", amount: "100 g" },
      { item: "Rode ui", amount: "1 grote" },
      { item: "Gerookte spekreepjes", amount: "150 g" },
      { item: "Zwarte peper", amount: "snufje" }
    ],
    instructions: [
      "Stap 1: Maak het flammkuchen deeg klaar zoals beschreven of gebruik kant-en-klaar deeg. Verwarm de oven voor op 230 graden.",
      "Stap 2: Rol het deeg uit tot ongeveer 2 mm dik en leg op een bakplaat.",
      "Stap 3: Besmeer het deeg met een laagje crème fraîche. Snijd de rode ui in ringen en verdeel samen met de spekreepjes over het deeg.",
      "Stap 4: Bestrooi met een snufje zwarte peper. Bak de flammkuchen 12 minuten in de oven tot hij goudbruin en knapperig is.",
      "Stap 5: Serveer direct, eventueel in stukjes als borrelhapje of met een salade als hoofdgerecht."
    ],
    macros: { protein: 12, carbs: 20, fat: 15 }
  },
  
  
  

];

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function importRecipes() {
  try {
    console.log("🔄 Import starten...");

    for (const recipe of recipes) {
      recipe.userId = SYSTEM_USER;

      await Recipe.findOneAndUpdate(
        { name: recipe.name, userId: SYSTEM_USER }, // match alleen standaardrecept
        recipe,
        { upsert: true, new: true }
      );

      console.log(`✔ Recept bijgewerkt/toegevoegd: ${recipe.name}`);
    }

    console.log("🎉 Import voltooid zonder je eigen recepten te verwijderen!");
    process.exit();
  } catch (err) {
    console.error("❌ Fout bij importeren:", err);
    process.exit(1);
  }
}

importRecipes();