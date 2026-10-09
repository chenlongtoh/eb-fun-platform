/* Play StaySEAN knowledge base.
   A listed tag is Yes, ~tag is Probably, ?tag is Don't know, ^tag is Probably not, !tag is No.
   Every attribute not listed for a subject is No. */
import type { Attribute, Database, Subject } from './types.ts'

type AttrRow = [key: string, question: string, keywords: string, opposite?: string]

const ATTR_ROWS: AttrRow[] = [
  // [key, question, keywords]
  [
    'real',
    'Is it real (not fictional)?',
    'real,exist,exists,existed,really,actual,real life,true story',
  ],
  [
    'fictional',
    'Is it a fictional character or creature?',
    'fictional,fiction,made up,imaginary,character,invented,cartoon character,not real,fake',
  ],
  [
    'person',
    'Is it a person (or a human-like character)?',
    'person,people,someone,somebody,human-like,humanoid,man,woman,guy,girl,boy,lady,celebrity,famous person',
  ],
  ['human', 'Is it a human being?', 'human,human being,homo sapiens,mortal'],
  [
    'animal',
    'Is it an animal (or animal-like)?',
    'animal,creature,beast,critter,species,pet animal,wildlife',
  ],
  [
    'food',
    'Is it something you eat or drink?',
    'food,eat it,eat this,you eat,i eat,we eat,edible,eaten,dish,meal,snack,cuisine,consume,taste,tasty,drink it,yummy,delicious',
  ],
  [
    'place',
    'Is it a place?',
    'place,location,somewhere,visit,travel destination,destination,geography,area,region,go there,live there',
  ],
  [
    'object',
    'Is it a man-made object?',
    'object,thing,item,man-made,manmade,device,gadget,tool or object,product,invention,artifact',
  ],
  [
    'mythical',
    'Is it from myth, legend or folklore?',
    'myth,mythical,mythology,legend,legendary,folklore,fairy tale,god,deity,fable',
  ],
  [
    'robot',
    'Is it a robot or machine being?',
    'robot,android,machine,cyborg,droid,ai,artificial',
  ],
  ['male', 'Is it male?', 'male,a man,boy,guy,gentleman,masculine'],
  ['female', 'Is it female?', 'female,woman,girl,lady,feminine'],
  [
    'alive',
    'Is it alive today?',
    'alive,living,still alive,living today,exist today,still around',
    'dead,died,deceased,extinct,passed away',
  ],
  [
    'musician',
    'Is it a musician or singer?',
    'musician,singer,sing,sings,song,songs,music,band,rapper,composer,pop star,popstar,guitarist,pianist,album',
  ],
  [
    'athlete',
    'Is it an athlete / sports star?',
    'athlete,sport,sports,sportsman,player,football,soccer,basketball,tennis,olympic,olympics,boxer,runner,badminton,champion',
  ],
  [
    'actor',
    'Is it an actor / entertainer?',
    'actor,actress,acting,act,film star,movie star,entertainer,tv host,hollywood,star in movies',
  ],
  [
    'politician',
    'Is it a political leader or activist?',
    'politician,political,president,prime minister,leader,activist,government,ruler,politics,elected',
  ],
  [
    'scientist',
    'Is it a scientist or inventor?',
    'scientist,science,inventor,invented,physicist,engineer,discover,discovered,researcher,genius,astronaut',
  ],
  [
    'business',
    'Is it a businessperson or entrepreneur?',
    'business,businessman,businesswoman,entrepreneur,ceo,billionaire,company,founder,rich,tycoon',
  ],
  [
    'writer',
    'Is it a writer or thinker?',
    'writer,author,write,wrote,poet,playwright,novelist,philosopher,books written',
  ],
  [
    'artist',
    'Is it a painter or visual artist?',
    'painter,artist,paint,painting,art,artwork,sculptor,drawing',
  ],
  [
    'royalty',
    'Is it royalty (king, queen, emperor, prince...)?',
    'royal,royalty,king,queen,prince,princess,emperor,empress,monarch,crown,throne,pharaoh',
  ],
  [
    'historical',
    'Was it born / created before 1900?',
    'historical,history,ancient,old,before 1900,19th century,centuries ago,long ago,medieval,old times',
  ],
  [
    'modern',
    'Is this person famous in the 21st century?',
    'modern,21st century,nowadays,current,contemporary,still famous',
  ],
  [
    'anime',
    'Is it from anime or manga?',
    'anime,manga,japanese cartoon,japanese animation',
  ],
  [
    'movie',
    'Is it known from movies?',
    'movie,film,films,cinema,hollywood film,big screen,blockbuster,movies',
  ],
  [
    'cartoon',
    'Is it from a western cartoon / animated film?',
    'cartoon,animated,animation,cartoons,pixar,looney',
  ],
  [
    'videogame',
    'Is it from a video game?',
    'video game,videogame,game character,gaming,nintendo,console,games,playstation,xbox',
  ],
  [
    'book',
    'Did it come from a book or novel?',
    'book,novel,books,literature,story book,author wrote,written',
  ],
  [
    'comics',
    'Is it from comic books?',
    'comic,comics,comic book,marvel,dc,graphic novel,strip',
  ],
  [
    'superhero',
    'Is it a superhero?',
    'superhero,super hero,hero,avenger,justice league,crime fighter,cape',
  ],
  [
    'villain',
    'Is it a villain or bad guy?',
    'villain,bad guy,evil,bad,antagonist,baddie,enemy,monster,dark side',
  ],
  [
    'powers',
    'Does it have superpowers or magic?',
    'superpower,superpowers,powers,magic,magical,wizard,witch,spells,supernatural,force',
    'no powers,powerless,ordinary',
  ],
  ['disney', 'Is it connected to Disney or Pixar?', 'disney,pixar,walt disney'],
  [
    'na',
    'Is it from / in North America?',
    'north america,america,american,usa,us,united states,canada,canadian,new york,hollywood',
  ],
  [
    'latin',
    'Is it from Latin America or the Caribbean?',
    'latin america,south america,latin,mexico,mexican,brazil,argentina,caribbean,jamaica,central america',
  ],
  [
    'europe',
    'Is it from / in Europe?',
    'europe,european,uk,british,england,english,france,french,germany,german,italy,italian,spain,greece,greek',
  ],
  [
    'asia',
    'Is it from / in Asia?',
    'asia,asian,japan,japanese,china,chinese,india,indian,korea,korean,malaysia,malaysian,singapore,thailand,middle east',
  ],
  [
    'africa',
    'Is it from / in Africa?',
    'africa,african,egypt,egyptian,kenya,south africa,nigeria',
  ],
  [
    'oceania',
    'Is it from / in Australia or Oceania?',
    'australia,australian,oceania,new zealand,pacific,aussie',
  ],
  ['mammal', 'Is it a mammal?', 'mammal,mammals,fur,furry,hairy,milk feeding'],
  ['bird', 'Is it a bird?', 'bird,birds,feather,feathers,beak,avian'],
  [
    'reptile',
    'Is it a reptile?',
    'reptile,reptiles,scales,scaly,lizard,cold-blooded,cold blooded,dinosaur',
  ],
  ['fish', 'Is it a fish?', 'fish,fishes,gills,fins'],
  ['insect', 'Is it an insect?', 'insect,bug,bugs,insects'],
  [
    'water',
    'Does it live in / is it associated with water?',
    'water,sea,ocean,swim,swims,swimming,aquatic,underwater,river,lake,marine',
  ],
  [
    'fourlegs',
    'Does it have four legs?',
    'four legs,4 legs,legs,quadruped,four-legged,walk on four,paws',
  ],
  ['fly', 'Can it fly?', 'fly,flies,flying,flight,wings,airborne,soar,float in air'],
  [
    'pet',
    'Is it commonly kept as a pet?',
    'pet,pets,domestic,domesticated,house pet,keep at home',
  ],
  ['farm', 'Is it a farm animal?', 'farm,farm animal,livestock,barn,cattle'],
  [
    'carnivore',
    'Does it eat meat?',
    'carnivore,carnivorous,eat meat,eats meat,meat eater,predator,hunt,hunter,prey',
  ],
  [
    'big',
    'Is it bigger than a person?',
    'big,large,huge,giant,bigger,larger,tall,massive,enormous,size',
  ],
  [
    'pattern',
    'Does it have stripes or spots?',
    'stripes,striped,spots,spotted,pattern,patterned',
  ],
  [
    'dangerous',
    'Is it dangerous to people?',
    'dangerous,danger,deadly,kill,scary,harmful,venomous,poisonous,bite,attack,lethal',
  ],
  [
    'sweet',
    'Does it taste sweet?',
    'sweet,sugar,sugary,dessert,candy',
    'savoury,savory,salty',
  ],
  ['drink', 'Is it a drink?', 'drink,beverage,liquid,sip,drinkable'],
  ['fruit', 'Is it a fruit?', 'fruit,fruits,fruity'],
  [
    'meat',
    'Does it usually contain meat or fish?',
    'meat,meaty,beef,pork,chicken meat,non vegetarian,contains meat',
    'vegetarian,vegan,meatless',
  ],
  [
    'fastfood',
    'Is it fast food / junk food?',
    "fast food,junk food,fastfood,mcdonalds,mcdonald's,takeaway,takeout",
  ],
  ['spicy', 'Is it spicy?', 'spicy,spice,chili,chilli,hot spicy,pedas,peppery'],
  [
    'hot',
    'Is it usually hot (served hot or hot climate)?',
    'hot,warm,heated,served hot,tropical,warm weather,heat',
    'cold,cool,chilled,frozen,icy,freezing',
  ],
  [
    'baked',
    'Is it baked (bread, pastry, cake)?',
    'baked,bake,bakery,pastry,bread,oven,dough,flour',
  ],
  [
    'rice_noodle',
    'Is it made with rice or noodles?',
    'rice,noodle,noodles,pasta,grain',
  ],
  ['dairy', 'Does it contain dairy (milk, cheese)?', 'dairy,milk,cheese,cream,lactose'],
  ['country', 'Is it a country?', 'country,nation,countries,state,sovereign'],
  ['city', 'Is it a city?', 'city,town,metropolis,urban,cities'],
  ['capital', 'Is it a capital city?', 'capital,capital city'],
  [
    'landmark',
    'Is it a man-made landmark or building?',
    'landmark,building,monument,tower,architecture,structure,built,attraction,wonder of the world',
  ],
  [
    'nature',
    'Is it a natural wonder (mountain, desert, forest...)?',
    'natural,nature,mountain,desert,forest,jungle,waterfall,canyon,landscape,natural wonder',
  ],
  [
    'coastal',
    'Is it by the sea?',
    'coast,coastal,beach,seaside,sea,ocean,port,harbour,harbor',
  ],
  ['island', 'Is it an island (or islands)?', 'island,islands,isle'],
  [
    'space',
    'Is it connected to outer space?',
    'space,outer space,galaxy,planet,star wars,astronaut,universe,cosmos,alien,stars,moon',
  ],
  [
    'electronic',
    'Is it electronic / does it use electricity?',
    'electronic,electric,electricity,battery,plug,digital,tech,technology,charge',
  ],
  [
    'handheld',
    'Can you hold it in one hand?',
    'hold,handheld,in one hand,small,portable,pocket,carry,tiny,little',
  ],
  [
    'vehicle',
    'Is it a vehicle?',
    'vehicle,transport,transportation,ride,drive,travel in,car,carry people',
  ],
  ['wheels', 'Does it have wheels?', 'wheel,wheels,tyre,tire,tyres,tires'],
  ['screen', 'Does it have a screen?', 'screen,display,monitor'],
  [
    'kitchen',
    'Is it used in the kitchen?',
    'kitchen,cook,cooking,cookware,utensil,dining',
  ],
  [
    'furniture',
    'Is it furniture?',
    'furniture,sit,sit on,lie on,home furniture,household',
  ],
  [
    'tool',
    'Is it a tool used for a task?',
    'tool,tools,cut,cutting,build,fix,work tool,utility',
  ],
  [
    'toy',
    'Is it a toy or used for play?',
    'toy,toys,play,plaything,children,kids,game',
  ],
  [
    'wearable',
    'Do you wear it?',
    'wear,wearable,worn,clothing,clothes,accessory,fashion,put on',
  ],
  [
    'instrument',
    'Is it a musical instrument?',
    'instrument,musical instrument,play music',
  ],
  [
    'metal',
    'Is it mostly made of metal?',
    'metal,metallic,steel,iron,aluminium,aluminum',
  ],
  ['wood', 'Is it often made of wood?', 'wood,wooden,timber'],
  [
    'round',
    'Is it round?',
    'round,circle,circular,sphere,spherical,ball shaped,ball-shaped',
  ],
  [
    'nobel',
    'Did this person win a Nobel Prize?',
    'nobel,nobel prize,prize winner,award',
  ],
  [
    'physics',
    'Is it known for physics or electricity?',
    'physics,physicist,gravity,relativity,electricity,radioactivity',
  ],
  [
    'uk',
    'Is it from / in the UK (Britain)?',
    'uk,britain,british,england,english,united kingdom,scotland,london',
  ],
  [
    'beard',
    'Does he have a beard or moustache (in his famous look)?',
    'beard,moustache,mustache,facial hair,bearded',
  ],
  [
    'glasses',
    'Does this person wear glasses?',
    'glasses,spectacles,specs,wear glasses',
  ],
  [
    'weapon',
    'Does it use (or is it) a weapon?',
    'weapon,gun,sword,bow,arrow,fight,fighter,lightsaber,shield',
  ],
  ['night', 'Is it active at night?', 'night,nocturnal,dark,vampire,night time'],
  [
    'populous',
    'Does it have over 100 million people?',
    'population,populous,people live,million people,crowded,big population',
  ],
  [
    'internet',
    'Does it connect to the internet?',
    'internet,online,wifi,web,email,apps,app',
  ],
  [
    'study',
    'Is it used for work or study?',
    'study,school,work,office,homework,write,writing,read,reading',
  ],
  ['sharp', 'Is it sharp?', 'sharp,blade,pointy,cut'],
  ['head', 'Is it worn on the head or face?', 'head,face,on your head,hat,cap,eyes'],
  [
    'prodigy',
    'Did this person become famous as a child?',
    'child,prodigy,child star,young,kid,as a child,child prodigy',
  ],
  [
    'team_sport',
    'Is it connected to a team sport?',
    'team sport,team,football club,club,basketball team,soccer team,league',
  ],
  [
    'ruins',
    'Is it famous for ancient ruins?',
    'ruins,ruin,ancient ruins,archaeology,archaeological',
  ],
  [
    'glass',
    'Is it made of glass or see-through?',
    'glass,see through,see-through,transparent,clear',
  ],
  [
    'build',
    'Is it used to build or fix things?',
    'build,building tool,fix,repair,construction,diy,nail,nails',
  ],
  ['red', 'Is it mainly red?', 'red,crimson,scarlet'],
  [
    'orange',
    'Is it mainly orange?',
    'orange,orange colour,orange color,orange-coloured,orangish',
  ],
  ['yellow', 'Is it mainly yellow?', 'yellow,golden,gold'],
  ['green', 'Is it mainly green?', 'green'],
  ['blue', 'Is it mainly blue?', 'blue'],
  ['purple', 'Is it mainly purple?', 'purple,violet'],
  ['pink', 'Is it mainly pink?', 'pink'],
  ['brown', 'Is it mainly brown?', 'brown'],
  ['black', 'Is it mainly black?', 'black,dark coloured,dark colored'],
  ['white', 'Is it mainly white?', 'white'],
  ['grey', 'Is it mainly grey?', 'grey,gray,silver'],
]

const CAT_DEFAULTS: Record<string, string> = {
  PR: 'real person human',
  FC: 'fictional person ?alive ?modern',
  FX: 'fictional ?alive ?modern',
  AN: 'real animal alive ?male ?female ?historical',
  FD: 'real food ?historical',
  PL: 'real place big',
  OB: 'real object',
}

export const CAT_NAMES: Record<string, string> = {
  PR: 'Famous person',
  FC: 'Fictional character',
  FX: 'Fictional creature',
  AN: 'Animal',
  FD: 'Food & drink',
  PL: 'Place',
  OB: 'Object',
}

const RAW = `
PR|Albert Einstein|einstein|male scientist historical europe ~na nobel physics beard
PR|Isaac Newton|newton,sir isaac newton|male scientist historical europe physics uk
PR|Marie Curie|curie,madame curie|female scientist historical europe nobel physics
PR|Leonardo da Vinci|da vinci,leonardo|male artist scientist historical europe beard
PR|Pablo Picasso|picasso|male artist historical europe
PR|Vincent van Gogh|van gogh,vincent|male artist historical europe beard
PR|Frida Kahlo|frida,kahlo|female artist latin
PR|William Shakespeare|shakespeare,the bard|male writer historical europe uk ~beard
PR|J.K. Rowling|jk rowling,rowling,joanne rowling|female writer alive europe modern uk
PR|Confucius|kongzi,kong fuzi|male writer historical asia beard
PR|Napoleon Bonaparte|napoleon|male politician royalty historical europe ~weapon
PR|Queen Elizabeth II|elizabeth ii,queen elizabeth,elizabeth|female royalty ~politician europe modern uk
PR|Abraham Lincoln|lincoln,abe lincoln|male politician historical na beard
PR|George Washington|washington|male politician historical na
PR|Barack Obama|obama|male politician alive na modern nobel
PR|Donald Trump|trump|male politician business alive na modern ~actor
PR|Mahatma Gandhi|gandhi|male politician historical asia glasses
PR|Nelson Mandela|mandela|male politician africa modern nobel
PR|Martin Luther King Jr.|martin luther king,mlk|male politician na nobel beard
PR|Cleopatra|cleopatra vii|female royalty politician historical africa
PR|Genghis Khan|chinggis khan|male royalty politician historical asia beard ~weapon
PR|Mother Teresa|teresa,saint teresa|female europe ~asia ^modern nobel
PR|Michael Jackson|king of pop|male musician na ~modern prodigy ~movie
PR|Elvis Presley|elvis|male musician actor na movie
PR|Taylor Swift|taylor,swift|female musician alive na modern
PR|Beyoncé|beyonce,queen bey|female musician alive na modern ~actor ~movie
PR|Freddie Mercury|freddie|male musician europe uk beard
PR|Wolfgang Amadeus Mozart|mozart|male musician historical europe prodigy
PR|Ludwig van Beethoven|beethoven|male musician historical europe
PR|Jay Chou|zhou jielun,jay|male musician alive asia modern ~actor ~movie
PR|Lionel Messi|messi,leo messi|male athlete alive latin modern ~beard team_sport
PR|Cristiano Ronaldo|ronaldo,cr7|male athlete alive europe modern team_sport
PR|Michael Jordan|jordan|male athlete alive na ~business ~modern team_sport ~movie
PR|Serena Williams|serena|female athlete alive na modern
PR|Usain Bolt|bolt|male athlete alive latin modern
PR|Muhammad Ali|ali,cassius clay|male athlete na
PR|Lee Chong Wei|chong wei,datuk lee chong wei|male athlete alive asia modern
PR|Jackie Chan|jackie,cheng long|male actor alive asia modern movie
PR|Bruce Lee|bruce|male actor ~athlete asia ~na movie
PR|Leonardo DiCaprio|dicaprio,leo dicaprio|male actor alive na modern movie
PR|Marilyn Monroe|marilyn|female actor na movie
PR|Charlie Chaplin|chaplin|male actor historical europe uk beard movie
PR|Elon Musk|musk|male business ~scientist alive na ~africa modern space
PR|Steve Jobs|jobs|male business na modern ~scientist glasses
PR|Bill Gates|gates|male business alive na modern glasses
PR|Mark Zuckerberg|zuckerberg,zuck|male business alive na modern
PR|Oprah Winfrey|oprah|female business actor alive na modern ~movie
PR|Walt Disney|walt|male business ~artist na disney beard ~movie
PR|Thomas Edison|edison|male scientist business historical na ~physics
PR|Nikola Tesla|tesla|male scientist historical europe ~na physics beard
PR|Charles Darwin|darwin|male scientist historical europe uk beard
PR|Neil Armstrong|armstrong|male scientist na space
FC|Harry Potter|harry|male human powers book movie europe uk glasses
FC|Hermione Granger|hermione|female human powers book movie europe uk
FC|Lord Voldemort|voldemort,tom riddle,you know who|male human powers book movie europe villain uk dangerous
FC|Sherlock Holmes|sherlock,holmes|male human book movie europe uk ^weapon historical
FC|James Bond|007,bond|male human book movie europe uk weapon
FC|Frodo Baggins|frodo|male book movie ~europe ~uk
FC|Gandalf|gandalf the grey,gandalf the white|male book movie powers ~europe grey ~uk beard
FC|Darth Vader|vader,anakin skywalker,anakin|male human powers movie villain space black weapon ~disney dangerous
FC|Luke Skywalker|luke|male human powers movie space weapon ~disney
FC|Yoda|master yoda|male powers movie space green ~disney
FC|Indiana Jones|indy|male human movie na weapon
FC|Spider-Man|spiderman,spider man,peter parker,spidey|male human comics superhero powers movie na red blue ~disney
FC|Batman|bruce wayne,the batman|male human comics superhero movie na black ~weapon night
FC|Superman|clark kent,kal-el|male comics superhero powers movie na fly blue red ~space
FC|Wonder Woman|diana prince|female comics superhero powers movie ~na ~fly
FC|Iron Man|tony stark,ironman|male human comics superhero movie na fly red yellow ^powers metal beard ~disney
FC|Captain America|steve rogers|male human comics superhero movie na blue ~powers ~weapon ~disney
FC|Hulk|incredible hulk,bruce banner|male comics superhero powers movie na green big ~disney ~human
FC|The Joker|joker|male human comics villain movie na purple dangerous
FC|Thanos|male comics villain powers movie purple space big ^na ~disney dangerous
FC|Homer Simpson|homer|male human cartoon na yellow ~movie
FC|Elsa|queen elsa,frozen elsa|female human disney cartoon movie powers royalty blue ~europe
FC|Cinderella|cinders|female human disney cartoon movie book ~royalty blue ~europe mythical historical
FC|Snow White|female human disney cartoon movie ~royalty ~europe mythical royalty historical
FC|Ariel|little mermaid,the little mermaid|female disney cartoon movie water royalty ^human powers ~red historical
FC|Peter Pan|male human disney cartoon movie book fly green ~europe powers uk
FC|Aladdin|male human disney cartoon movie asia mythical historical
FC|Genie of the Lamp|genie,djinn,the genie,jinn|male disney cartoon movie powers blue fly mythical asia beard historical
FC|Shrek|male cartoon movie green ~big
FC|Naruto Uzumaki|naruto|male human anime powers asia orange
FC|Son Goku|goku,kakarot|male anime powers asia fly orange ^human
FC|Monkey D. Luffy|luffy,monkey d luffy|male human anime powers asia red
FC|Sailor Moon|usagi tsukino,usagi|female human anime powers asia
FC|Mario|super mario|male human videogame movie red beard ?asia
FC|Link|legend of zelda link|male ~human videogame green ~powers weapon ?asia
FC|Lara Croft|tomb raider|female human videogame movie europe uk weapon
FC|Master Chief|john 117,halo master chief|male human videogame green space weapon
FC|Santa Claus|father christmas,saint nick,santa|male human mythical powers fly red beard historical
FC|Robin Hood|male human mythical europe green ~movie uk weapon ?beard historical
FC|King Arthur|arthur|male human mythical royalty europe uk weapon ~beard historical
FC|Zeus|male mythical powers europe beard ~weapon ~royalty historical
FC|Medusa|gorgon|female mythical powers villain europe dangerous historical
FC|Sun Wukong|monkey king,wukong,sun wu kong|male mythical book powers asia fly animal historical
FC|Count Dracula|dracula|male book villain powers movie europe black ^human night dangerous historical
FC|Terminator|t-800,the terminator|male movie robot ~villain ^human metal weapon dangerous electronic
FX|Barbie|barbie doll|female movie toy pink na ~human
FX|Woody|sheriff woody|male disney cartoon movie toy brown ~person na
FX|Buzz Lightyear|buzz|male disney cartoon movie toy space ^fly white ~person na
FX|Mickey Mouse|mickey|male disney cartoon animal mammal black ~movie na
FX|Donald Duck|donald|male disney cartoon animal bird white na
FX|Bugs Bunny|bugs|male cartoon animal mammal grey na
FX|SpongeBob SquarePants|spongebob|male cartoon water yellow na ~animal ~movie
FX|Winnie the Pooh|pooh,pooh bear|male disney cartoon book animal mammal yellow europe uk
FX|Simba|lion king|male disney cartoon movie animal mammal royalty yellow fourlegs carnivore africa
FX|Nemo|finding nemo|male disney cartoon movie animal fish water orange pattern oceania
FX|Garfield|male cartoon comics animal mammal orange pet na pattern fourlegs
FX|Scooby-Doo|scooby,scooby doo|male cartoon animal mammal brown pet na fourlegs
FX|Snoopy|male comics cartoon animal mammal white pet na
FX|Pikachu|pokemon|anime videogame animal powers yellow asia ~movie
FX|Doraemon|male anime robot blue asia ~movie ~electronic
FX|Hello Kitty|kitty white|female animal white asia ^anime
FX|Totoro|my neighbor totoro|anime movie animal grey asia big
FX|Sonic the Hedgehog|sonic|male videogame animal mammal blue movie asia
FX|Pac-Man|pacman,pac man|male videogame yellow round asia
FX|R2-D2|r2d2,artoo|movie robot space white ~disney electronic metal
FX|WALL-E|walle,wall e|disney cartoon movie robot space brown electronic metal
FX|Godzilla|gojira|movie animal reptile big ~villain asia dangerous grey
FX|King Kong|kong|male movie animal mammal big na black dangerous
FX|Unicorn|mythical animal mammal powers white fourlegs big historical
FX|Dragon|mythical animal ~reptile fly powers big dangerous ~carnivore ~fourlegs historical
AN|Dog|puppy,doggy|mammal fourlegs pet ~carnivore
AN|Cat|kitten,kitty|mammal fourlegs pet carnivore ~night
AN|Lion|mammal fourlegs carnivore big dangerous africa yellow
AN|Tiger|mammal fourlegs carnivore big dangerous asia orange pattern
AN|Elephant|mammal fourlegs big africa asia grey
AN|Giraffe|mammal fourlegs big africa pattern yellow
AN|Zebra|mammal fourlegs ~big africa pattern white black
AN|Giant Panda|panda|mammal fourlegs ~big asia white black
AN|Kangaroo|roo|mammal oceania brown
AN|Koala|koala bear|mammal fourlegs oceania grey
AN|Monkey|monkeys|mammal ~fourlegs brown ~asia ~africa ~latin
AN|Gorilla|mammal big africa black ~dangerous
AN|Orangutan|mammal ~big asia orange
AN|Horse|pony|mammal fourlegs big farm brown ~pet
AN|Cow|cattle,bull|mammal fourlegs big farm pattern white black
AN|Pig|piggy,hog|mammal fourlegs farm pink
AN|Sheep|lamb|mammal fourlegs farm white
AN|Rabbit|bunny|mammal fourlegs pet white
AN|Mouse|mice,rat|mammal fourlegs grey ~pet ~night ~handheld
AN|Bat|bats|mammal fly black night
AN|Dolphin|mammal water grey carnivore
AN|Blue Whale|whale|mammal water big blue ~carnivore
AN|Shark|great white shark|fish water carnivore big dangerous grey
AN|Goldfish|fish water pet orange ~handheld
AN|Octopus|water carnivore ~red
AN|Penguin|bird ~water white black carnivore
AN|Eagle|bald eagle|bird fly carnivore brown ~na
AN|Owl|bird fly carnivore brown night
AN|Parrot|bird fly pet green ~latin
AN|Chicken|hen,rooster|bird farm white ^fly
AN|Flamingo|bird fly pink
AN|Peacock|peafowl|bird blue asia ~fly
AN|Crocodile|alligator,croc|reptile fourlegs carnivore big dangerous water green
AN|Snake|serpent,python,cobra|reptile carnivore ~dangerous green
AN|Turtle|tortoise|reptile fourlegs ~water green ~pet
AN|Frog|toad|fourlegs water green carnivore ~handheld
AN|Butterfly|insect fly pattern handheld
AN|Bee|honeybee,honey bee|insect fly yellow black pattern ~dangerous handheld
AN|Ant|ants|insect black handheld
AN|Spider|tarantula|carnivore black ^dangerous handheld
AN|Tyrannosaurus Rex|t-rex,trex,t rex,dinosaur|!alive reptile carnivore big dangerous ~na
AN|Camel|mammal fourlegs big asia africa brown farm
AN|Polar Bear|mammal fourlegs big carnivore dangerous white ~na
FD|Pizza|europe hot baked ~meat dairy round
FD|Sushi|rice_noodle meat asia
FD|Hamburger|burger,cheeseburger|meat fastfood hot na brown handheld
FD|Nasi Lemak|rice_noodle spicy asia ~meat ~hot
FD|Satay|sate|meat asia hot ~spicy
FD|Chocolate|choc|sweet brown ~europe ~latin ~dairy handheld
FD|Ice Cream|icecream,gelato|sweet dairy ~handheld
FD|Apple|fruit sweet red round handheld
FD|Banana|fruit sweet yellow handheld
FD|Durian|king of fruits|fruit asia ~sweet green
FD|Mango|fruit sweet asia yellow handheld
FD|Watermelon|fruit sweet green round ~africa
FD|Orange|oranges|fruit orange round ~sweet handheld
FD|Strawberry|strawberries|fruit sweet red handheld
FD|Rice|white rice|rice_noodle white asia ~hot
FD|Ramen|rice_noodle hot asia ~meat
FD|Spaghetti|pasta|rice_noodle hot europe
FD|Bread|baked ~europe brown
FD|Cheese|dairy yellow ~europe
FD|Egg|eggs|white ~round handheld
FD|French Fries|fries,chips|fastfood hot yellow ~europe ~na
FD|Coffee|kopi,espresso|drink hot brown ~latin ~africa
FD|Tea|teh,green tea|drink hot asia
FD|Milk|drink dairy white
FD|Coca-Cola|coke,cola|drink sweet na brown ~fastfood historical
FD|Teh Tarik|pulled tea|drink hot sweet asia dairy brown
FD|Cake|birthday cake|sweet baked ~dairy
FD|Donut|doughnut|sweet ~baked round na handheld
FD|Hot Dog|hotdog|meat fastfood hot na handheld
FD|Taco|tacos|~meat latin ~spicy handheld
FD|Croissant|~sweet baked europe dairy yellow handheld
FD|Curry|spicy hot asia ~meat yellow
FD|Kimchi|spicy asia red
FD|Popcorn|~sweet na white
FD|Honey|sweet yellow
FD|Roti Canai|roti prata,prata|~baked hot asia
PL|Paris|city capital europe historical
PL|London|city capital europe uk historical
PL|New York City|nyc,new york,big apple|city na coastal historical
PL|Tokyo|city capital asia coastal historical
PL|Kuala Lumpur|kl|city capital asia hot historical
PL|Singapore|country city capital asia coastal island hot ~historical
PL|Beijing|peking|city capital asia historical
PL|Sydney|city coastal oceania historical
PL|Rome|city capital europe historical ruins
PL|Dubai|city asia coastal hot historical
PL|Eiffel Tower|tour eiffel|landmark europe historical metal
PL|Great Wall of China|great wall|landmark asia historical ~ruins
PL|Taj Mahal|landmark asia white historical
PL|Statue of Liberty|lady liberty|landmark na green coastal historical metal
PL|Petronas Twin Towers|petronas towers,klcc,twin towers|landmark asia metal
PL|Pyramids of Giza|pyramids,great pyramid|landmark africa hot historical ruins
PL|Colosseum|coliseum|landmark europe historical ruins
PL|Mount Everest|everest|nature asia white ?historical
PL|Amazon Rainforest|amazon,amazon jungle|nature latin green hot ?historical
PL|Sahara Desert|sahara|nature africa hot ?historical
PL|Grand Canyon|nature na ?historical
PL|Niagara Falls|niagara|nature na water ?historical
PL|Antarctica|south pole|nature white ?historical
PL|The Moon|moon|space nature grey round ?historical
PL|Mars|red planet|space red round ~nature ?historical
PL|Japan|nippon|country asia island coastal populous historical
PL|Malaysia|country asia coastal hot
PL|United States|usa,america,united states of america,us|country na coastal populous historical
PL|Brazil|country latin coastal hot populous historical
PL|Egypt|country africa hot coastal populous historical ruins
PL|Australia|country oceania coastal island ^historical
PL|India|country asia coastal hot populous ~historical
PL|China|country asia coastal populous historical
PL|Disneyland|landmark na disney
PL|Hawaii|island coastal na hot ?historical
OB|Smartphone|phone,mobile phone,iphone,cellphone,handphone|electronic handheld screen internet ~study
OB|Laptop|computer,notebook computer|electronic screen internet study
OB|Television|tv,telly|electronic screen ~internet
OB|Car|automobile|vehicle wheels big metal electronic historical
OB|Bicycle|bike|vehicle wheels metal historical
OB|Airplane|plane,aeroplane,jet|vehicle fly wheels big metal electronic
OB|Rocket|spaceship|vehicle fly space big metal ?historical ~electronic
OB|Ship|boat|vehicle water big metal historical
OB|Umbrella|brolly|handheld historical
OB|Chair|stool|furniture ~wood historical
OB|Bed|furniture big ~wood historical
OB|Guitar|instrument wood historical
OB|Piano|instrument big black wood furniture historical
OB|Pencil|handheld tool yellow wood study ~sharp historical
OB|Book|novel|handheld study historical
OB|Wristwatch|watch|handheld wearable ~electronic ~metal ~historical
OB|Eyeglasses|glasses,spectacles|wearable handheld head historical glass
OB|Toothbrush|handheld tool historical
OB|Refrigerator|fridge|electronic kitchen big white ~metal
OB|Microwave|microwave oven|electronic kitchen ~metal
OB|Scissors|handheld tool metal sharp historical
OB|Hammer|handheld tool metal historical build
OB|Football|soccer ball,ball|toy round white black team_sport historical ~handheld
OB|Shoe|sneaker,shoes|wearable historical handheld
OB|Hat|cap|wearable head historical handheld
OB|Key|keys|handheld metal historical ~tool
OB|Light Bulb|lightbulb,bulb|electronic handheld historical ~round glass
OB|Camera|electronic handheld screen ^internet historical
OB|Teddy Bear|teddy|toy brown handheld
OB|Rubik's Cube|rubiks cube,rubik cube|toy handheld
OB|Sword|katana|handheld metal dangerous weapon sharp historical
OB|Toilet Paper|tissue,toilet roll|white handheld historical
OB|Water Bottle|bottle,tumbler|handheld ~metal ~blue ?historical
OB|Chopsticks|chopstick|kitchen handheld asia ~wood historical ~tool
`

const VALS: Record<string, number> = { '': 1, '~': 0.75, '?': 0.5, '^': 0.25, '!': 0 }

function buildSubjects(): Subject[] {
  const keys = ATTR_ROWS.map((row) => row[0])
  const subjects: Subject[] = []
  for (const [i, line] of RAW.trim().split('\n').entries()) {
    const parts = line.split('|')
    const tags = parts.length === 4 ? parts[3] : parts[2]
    const aliases = parts.length === 4 ? parts[2] : ''
    const cat = parts[0] ?? ''
    const name = parts[1] ?? ''
    const values: Record<string, number> = {}
    for (const key of keys) values[key] = 0
    const defaults = CAT_DEFAULTS[cat]
    if (defaults == null || tags == null) {
      throw new Error('Bad subject line: ' + line)
    }
    const all = (defaults + ' ' + tags).trim().split(/\s+/)
    for (const token of all) {
      const marked = /^[~?^!]/.test(token)
      const prefix = marked ? token[0] : ''
      const key = marked ? token.slice(1) : token
      if (!(key in values))
        throw new Error("Unknown attribute '" + key + "' in: " + line)
      values[key] = VALS[prefix] ?? 0
    }
    subjects.push({
      id: i,
      cat,
      name,
      aliases: aliases ? aliases.split(',').map((alias) => alias.trim()) : [],
      v: values,
    })
  }
  return subjects
}

function buildAttrs(): Attribute[] {
  return ATTR_ROWS.map((row) => ({
    key: row[0],
    q: row[1],
    kw: row[2].split(','),
    nkw: row[3] ? row[3].split(',') : [],
  }))
}

export const DB: Database = {
  ATTRS: buildAttrs(),
  SUBJECTS: buildSubjects(),
  CAT_NAMES,
}
