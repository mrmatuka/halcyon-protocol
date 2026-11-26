import type { ComponentProps } from 'react';
import type { ComicIcon } from '../ui/components/ComicIcon';

type Translation = readonly [hu: string, en: string];
type GuideTopic = {
  title: Translation;
  steps: readonly {
    title: Translation;
    text: Translation;
    icon?: ComponentProps<typeof ComicIcon>['name'];
  }[];
};

export const helpTopics: readonly GuideTopic[] = [
  {
    title: ['Tájékozódás a felületen', 'Finding your way'],
    steps: [
      {
        icon: 'home',
        title: ['Főmenü', 'Main menu'],
        text: [
          'Az alsó menüsor ház ikonja visszavisz a nyitóképernyőre. Az Új kaland a könyvespolcot nyitja meg. A Folytatás a legfrissebb elérhető mentést tölti be.',
          'The house icon in the bottom bar returns you to the home screen. New adventure opens the bookshelf. Continue loads the latest available save.',
        ],
      },
      {
        icon: 'book',
        title: ['Könyvkaland', 'Book Adventures'],
        text: [
          'A nyitott könyv ikonja a beépített és a helyi könyvtárba felvett kalandok polcára visz.',
          'The open book icon shows the shelf with built-in adventures and adventures added to your local library.',
        ],
      },
      {
        icon: 'journal',
        title: ['Napló', 'Journal'],
        text: [
          'Játékon kívül a Karakterek nézetet nyitja meg. Kaland közben az aktuális karaktert, felszerelést és helyszínt mutatja.',
          'Outside a game, it opens the character library. During an adventure, it shows your current character, equipment, and location.',
        ],
      },
      {
        icon: 'settings',
        title: ['Beállítások', 'Settings'],
        text: [
          'A fogaskeréknél válthatsz magyar és angol között, megnyithatod a Történetszerkesztőt, és elérheted a Súgót. A Súgó bezárásával visszatérsz az előző képernyőre.',
          'The gear opens the language selector, Story editor, and Help. Closing Help returns you to the screen you were using.',
        ],
      },
    ],
  },
  {
    title: ['Kaland keresése és indítása', 'Finding and starting an adventure'],
    steps: [
      {
        icon: 'search',
        title: ['Keresés a polcon', 'Search the bookshelf'],
        text: [
          'Szűrj az oldalon látható műfajgombokkal. A felső sáv nagyítójával címre vagy műfajra kereshetsz. A Mind törli a műfajszűrőt, a nagyító újbóli megnyomása alaphelyzetbe állítja a keresést.',
          'Use the genre buttons to filter the shelf. Select the magnifier in the top bar to search by title or genre. All clears the genre filter. Select the magnifier again to clear the search.',
        ],
      },
      {
        title: ['Borító és kaland adatlapja', 'Cover and adventure details'],
        text: [
          'A borító megnyomásával megnyitod a kaland leírását és indítómenüjét. A borító alatti Folytatás közvetlenül betölti az adott kaland legfrissebb mentését, ha van ilyen.',
          'Select a cover to open the description and start menu. Continue below the cover loads that adventure’s latest save when one is available.',
        ],
      },
      {
        title: ['Új játék', 'New game'],
        text: [
          'Ha még nincs hozzárendelt karakter, válaszd a Saját karakter létrehozása gombot. Ha van, az Új játék képernyőn ellenőrizd a kijelölt karaktert, majd állítsd be a Játékmódot. A Könnyű +2-t ad, a Nehéz −2-t von le a próbák célszámából. Az opcionális Seed a véletlen dobások kezdőértéke. Koppints a Kaland indítása gombra.',
          'If no character is assigned, select Create your character. Otherwise, select New game, check the assigned character, and choose a Difficulty mode. Easy adds 2 to check targets, and Hard subtracts 2. The optional Seed sets the starting point for random rolls. Select Start adventure.',
        ],
      },
    ],
  },
  {
    title: ['Karakter létrehozása és hozzárendelése', 'Creating and assigning a character'],
    steps: [
      {
        title: ['Karaktergenerátor', 'Character creator'],
        text: [
          'Játékon kívül nyisd meg a Naplót, majd válaszd az Új karakter gombot. Írj be egy nevet, válassz kasztot és egyéni adottságot. A Véletlen karakter gomb kitölti a nevet, a kasztot, az adottságot, a pontokat és a portrét.',
          'Outside a game, open Journal and select New character. Enter a name and choose a class and personal trait. Random character fills in the name, class, trait, points, and portrait.',
        ],
      },
      {
        title: ['Pontok és portré', 'Points and portrait'],
        text: [
          'Ossz el legfeljebb 4 pontot kézzel, vagy használd a Pontok sorsolása gombot. A megjelenített érték a kasztot, az adottságot és a kiosztott pontokat is tartalmazza, a felső határ 10. A Kasztportré cseréje a kaszt képei között vált. A Saját portré feltöltése JPEG-, PNG- vagy WebP-képet fogad, legfeljebb 8 MB és 16 megapixel méretben.',
          'Allocate up to 4 points manually or select Roll attributes. The displayed value includes class, trait, and allocated points, with a maximum of 10. Change class portrait switches between class images. Upload portrait accepts JPEG, PNG, or WebP images up to 8 MB and 16 megapixels.',
        ],
      },
      {
        title: ['Összes kaland és mentés', 'All stories and saving'],
        text: [
          'Az Összes kaland bejelölésével ez lesz a közös alapértelmezett karakter. Kikapcsolva pipáld be a kiválasztott kalandokat. Az űrlap tetején nyomd meg a Karakter mentése gombot. Ha kalandból nyitottad meg a generátort, visszajutsz a kaland indítómenüjébe.',
          'Check All stories to make this the shared default character. With it off, tick the adventures you want to assign. Select Save character at the top of the form. If you opened the creator from an adventure, you return to that adventure’s start menu.',
        ],
      },
      {
        title: ['Karaktertár', 'Character library'],
        text: [
          'A kártyán a Szerkesztés, a Legyen alapértelmezett és a Törlés gombbal kezelheted a karaktert. A Kalandhoz rendelt karakterek listában kalandonként is választhatsz. Az egyedi hozzárendelés elsőbbséget élvez az új játék indításakor.',
          'Use Edit, Make default, or Delete on a character card. Adventure assignments lets you choose a character for each adventure. Individual assignments take precedence when starting a new game.',
        ],
      },
    ],
  },
  {
    title: ['Jelenetek, döntések és próbák', 'Scenes, choices, and checks'],
    steps: [
      {
        icon: 'next',
        title: ['Választás a jelenet végén', 'Making a choice'],
        text: [
          'Olvasd el a jelenetet, majd válassz az alatta lévő gombok közül. A válaszok más helyszínre vagy befejezéshez vezethetnek, és hatással lehetnek az életerődre, a tulajdonságaidra vagy a tárgyaidra. Néhány választás csak a feltételei teljesülésekor jelenik meg.',
          'Read the scene and select a choice below it. Choices can lead to different locations or endings and affect health, stats, or inventory. Some choices appear only when their conditions are met.',
        ],
      },
      {
        title: ['2d6-próba', '2d6 check'],
        text: [
          'A 2d6 jelölésnél a játék két hatoldalú kockával dob. A próba akkor sikeres, ha az összeg legfeljebb a tulajdonság értéke a tárgyak és a játékmód módosítóival együtt. Az eredményt és a célszámot a következő képernyőn látod. Szerencse-próba után a Szerencse 1-gyel csökken, ha még van belőle.',
          'A 2d6 badge means the game rolls two six-sided dice. The check succeeds at or below your stat plus item and difficulty modifiers. The next screen shows the result and target. A Luck check spends 1 Luck while you have any remaining.',
        ],
      },
      {
        title: ['Képességkártya és befejezés', 'Ability card and endings'],
        text: [
          'A Kártya gomb a mellette lévő döntést a kasztképességgel hajtja végre. Egy automatikus siker vagy egy tényleges újradobás elhasználja a képességet az adott játékban. A gyógyító képességet a Karakterlapon találod. Befejezés után az Új játék új próbálkozást indít, vagy visszaléphetsz a menübe.',
          'The Card button takes its associated choice using your class ability. An automatic success or an actual reroll spends the ability for that run. Healing abilities are on the character sheet. At an ending, choose New game to try again or return to the menu.',
        ],
      },
    ],
  },
  {
    title: ['Térkép és haladás', 'Map and progress'],
    steps: [
      {
        icon: 'map',
        title: ['Bejárt útvonal', 'Route map'],
        text: [
          'Játék közben kattints a jelenet fölötti Térkép gombra, vagy nyisd meg a Napló Térkép fülét. A térkép a már bejárt útvonalat mutatja, legfelül az aktuális helyszínnel. A korábban látott, majd újra meglátogatott helyszínek ismét szerepelnek az útvonalon.',
          'During play, select Map above the scene or open the Map tab in the Journal. The map shows the route you have taken, with your current location at the top. Revisiting a location adds it to the route again.',
        ],
      },
      {
        title: ['Felfedezett jelenetek', 'Scenes discovered'],
        text: [
          'A sáv azt mutatja, hány különböző jelenetet láttál a kaland összes jelenetéből. Egy visszatérés nem növeli a számlálót. A Befejezés elérve felirat külön jelzi, ha véget ért a játék, akkor is, ha más útvonalakon maradtak felfedezetlen jelenetek.',
          'The bar shows how many distinct scenes you have seen out of all scenes in the adventure. Revisits do not increase the count. Ending reached appears when your run ends, even if other routes still contain unexplored scenes.',
        ],
      },
      {
        title: ['Az útvonal mentése', 'Saving your route'],
        text: [
          'A kézi mentés és az automentés az útvonalat is tárolja. Régi mentés betöltésekor az útvonal rögzítése a betöltött helyszíntől indul, a sáv a rögzített jeleneteket számolja.',
          'Manual saves and autosaves include the route. When you load an older save, tracking starts at the loaded location and the bar counts the recorded scenes.',
        ],
      },
    ],
  },
  {
    title: ['Napló, felszerelés és mentések', 'Journal, equipment, and saves'],
    steps: [
      {
        icon: 'book',
        title: ['Napló játék közben', 'Journal during play'],
        text: [
          'Nyomd meg a jobb felső Napló ikont vagy az alsó Napló gombot. A Társak fülön látod a Karakterlapot, az életerőt és a képességet. Az Eszközök fül a tárgyakat mutatja. A Jegyzetek fülön láthatod a helyszínt és megnyithatod a mentéseket. A visszanyíl bezárja a Naplót.',
          'Select Journal in the top right or in the bottom bar. Companions shows the character sheet, health, and ability. Equipment lists your items. Notes shows the location and gives access to saves. The back arrow closes the Journal.',
        ],
      },
      {
        title: ['Mentés / Betöltés', 'Save / load'],
        text: [
          'A jelenet alján vagy a Napló Jegyzetek fülén nyisd meg a mentésablakot. A játék kalandonként egy automentést és három kézi helyet kezel. A Mentés felülírja a kiválasztott kézi helyet, a Betöltés visszaállítja az ott tárolt állást, a Törlés kiüríti a helyet. A kaland indítómenüjében a Betöltés gombbal is elérheted a mentéseket.',
          'Open the save dialog at the end of a scene or from the Journal’s Notes tab. Each adventure has one autosave and three manual slots. Save overwrites the selected manual slot, Load restores that progress, and Delete clears the slot. You can also reach saves from the adventure’s start menu using Load.',
        ],
      },
      {
        title: ['Hol vannak az adataim?', 'Where is my data?'],
        text: [
          'A mentések és a karakterek az adott böngészőprofilban tárolódnak. Másik eszközön vagy böngészőprofilban külön könyvtárad van. Ha az alkalmazás átmeneti tárhelyet jelez, az adatok újratöltéskor elveszhetnek. A régi mentés a mentéskori karaktert tölti vissza a Naplóba.',
          'Saves and characters are stored in this browser profile. Other devices and browser profiles have separate libraries. If the app reports temporary storage, data can be lost on reload. Loading an existing save restores the character as they were when it was saved.',
        ],
      },
    ],
  },
  {
    title: [
      'Kaland szerkesztése, importálása és megosztása',
      'Editing, importing, and sharing adventures',
    ],
    steps: [
      {
        title: ['Történetszerkesztő', 'Story editor'],
        text: [
          'Nyisd meg a Beállításokat, majd a Történetszerkesztőt. Válaszd az Új kaland szerkesztése gombot, vagy egy meglévő kaland mellett a Szerkesztést. Beépített kaland másolatához adj új kalandazonosítót.',
          'Open Settings, then Story editor. Select Create an adventure or choose Edit beside an existing adventure. Use a new Adventure ID to save a copy of a built-in adventure.',
        ],
      },
      {
        title: ['Adatlap és kinézet', 'Details and theme'],
        text: [
          'Itt állíthatod be az azonosítót, a magyar és angol címet, leírást és műfajt, a játékidőt, a nehézséget, a közös tulajdonságok megfeleltetését, a borítót, a színeket és a betűtípust. Válaszd ki a kezdőcsomópontot és a nulla életerőhöz tartozó befejezést.',
          'Set the ID, Hungarian and English titles, descriptions and genres, play time, difficulty, shared attribute mappings, cover, colors, and typeface. Select the start node and the ending for zero health.',
        ],
      },
      {
        title: ['Történetgráf', 'Story graph'],
        text: [
          'Az Új jelenet és Új befejezés gombok bővítik a gráfot. A listában kattints egy elemre, majd töltsd ki a címet, a történetszöveget és opcionálisan a jelenetképet a leírásával. A Második nyelv szerkesztése kapcsolóval add meg a fordításokat. Befejezésnél válassz Túlélés vagy Halál típust.',
          'Add nodes with Add scene or Add ending. Select a node in the list, then enter its title, text, and optionally a scene image with a description. Use Edit secondary language to add translations. For an ending, choose Survival or Death.',
        ],
      },
      {
        title: ['Döntések és próbák szerkesztése', 'Editing choices and checks'],
        text: [
          'A Választás hozzáadása után írd be a gomb szövegét. Egyszerű választásnál egy Célt adj meg, próbánál válassz tulajdonságot, majd állítsd be külön a siker és a kudarc útvonalát. A Haladó adatok alatt a JSON megnyitása elérhetővé teszi többek között a tárgyakat, feltételeket és fordításokat. Az Alkalmazás gomb érvényesíti a JSON-módosítást.',
          'Select Add choice and enter the button text. A simple choice needs one Target. For a check, select an attribute and set separate routes for success and failure. Under Advanced data, Open JSON exposes items, conditions, translations, and more. Select Apply to use the JSON changes.',
        ],
      },
      {
        title: ['Ellenőrzés, mentés és ZIP', 'Validation, saving, and ZIP'],
        text: [
          'Az Ellenőrzés megmutatja a csomaghibákat. A Mentés a könyvtárba vagy a Mentés másolatként után a kaland megjelenik a Könyvkaland polcon. Megosztáshoz használd a ZIP letöltése gombot. A másik játékos a Történetszerkesztőben a ZIP importálása gombbal adhatja a csomagot a saját polcához. Az AI szerzői útmutató letölthető segítség új csomag készítéséhez.',
          'Validate reports package errors. Save to library or Save a copy makes the adventure appear on the Book Adventures shelf. Use Download ZIP to share it. Another player can use Import ZIP in the Story editor to add the package to their shelf. The downloadable AI authoring guide covers creating new packages.',
        ],
      },
    ],
  },
];
