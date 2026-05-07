/**
 * Ex Novo City Simulator — runs entirely client-side
 * Simulates the Ex Novo collaborative city-building game for each city,
 * generating rich history, districts, leaders, crime lords, and factions.
 */

import { City, NPC, Faction } from '../types/world';

// ─── Data Tables ────────────────────────────────────────────────────────────

// FOUNDING REASONS — template-based: 50 × 60 × 50 = 150,000 combinations

const FR_WHAT = [
  'a natural harbour sheltered from storms by an outlying headland',
  'a vein of silver so pure it barely needed smelting',
  'the crossing of two ancient trade roads, one older than memory',
  'a holy site where a wandering saint performed an undeniable miracle',
  'a fertile river delta that flooded every year and left rich black soil',
  'a mountain pass controlling all traffic through the range',
  'a freshwater spring in an otherwise arid wasteland',
  'the ruins of a far older civilisation whose stones were too useful to quarry',
  'a military garrison that became a town after the war ended and the soldiers stayed',
  'a crossroads inn that grew into permanence over three generations',
  'a sacred grove chosen by a religious order as their founding seat',
  'an island too defensible to leave unfortified once the first garrison arrived',
  'a river ford that armies and merchants both needed, on good terms or bad',
  'a volcanic hot spring with documented healing properties',
  'a plateau unreachable by flood, avalanche, or conventional cavalry',
  'a lake so large it took a week to sail across in calm weather',
  'a cave network that provided shelter during a catastrophic winter',
  'the wreck of a great trading vessel whose cargo was too valuable to abandon',
  'a quarry of pale stone so fine that builders came from a thousand miles to purchase it',
  'a watchtower built to monitor an enemy that no longer exists in that form',
  'the field where a decisive battle ended and the survivors decided to stay',
  'a deep and perfectly sheltered natural harbour discovered during a storm',
  'a deposit of iron ore found by a blacksmith who refused to leave',
  'a river bend where boats could shelter and trade goods without continuing',
  'a cliff face full of caves needing only doors to become permanent dwellings',
  'an estuary rich with fish, salt, and amber washed from the deep',
  'a grove of trees bearing fruit throughout all seasons without fail',
  'an old road junction where travellers rested and merchants set up stalls',
  'a defensible hilltop with sight lines in all directions and no blind spots',
  'a valley enclosed on three sides and open only to trade winds from the south',
  'the confluence of three rivers navigable by deep-keel vessels',
  'a salt marsh that could be harvested to preserve enough food for whole armies',
  'a pass through the mountains so narrow three soldiers could hold it against thousands',
  'a beach where the tides deposited rare shells, amber, and sea-glass worth trading',
  'an underground reservoir discovered by miners who dug in the wrong direction',
  'a ridge of high ground dominating every road for twenty miles in every direction',
  'a natural cistern fed by seasonal rains that never ran dry even in drought',
  'a forest of timber so dense and straight it supplied shipyards across the region',
  'a tidal island reachable only at low water, defensible without a single wall',
  'a geothermal vent warming the soil enough to grow crops through winter',
  'a river with enough drop and current to power a dozen mills year-round',
  'a bay guarded by a reef that let fishing boats through but not war galleys',
  'a mountain spring whose water never froze and was said never to make anyone ill',
  'a natural amphitheatre used for trade negotiations long before the first house was built',
  'a salt lick drawing herd animals, and hunters, and eventually everyone else',
  'a tar pit used to preserve timbers, seal boats, and eventually build an industry',
  'a clay bed producing ceramic of unusual density and heat resistance',
  'a narrow canyon protecting the route to fertile upland grazing from coastal raids',
  'a river island large enough to fortify but small enough to defend with few guards',
  'a site of astronomical significance where the stars aligned on founding day',
];

const FR_HOW = [
  'A wandering merchant planted the first market stall',
  'Refugees from a collapsed empire built their first shelter',
  'A religious order established a waystation for pilgrims',
  'Deserters from a losing army found it too defensible to abandon',
  'A trade company chose it as a waypoint and never left',
  'Fisherfolk settling for winter stayed through spring and then forever',
  'A single blacksmith attracted customers until the customers built houses',
  'Escaped slaves who had nowhere else to go built the first walls',
  'A disgraced noble established a domain here out of spite and it thrived',
  'Miners working a nearby seam needed a permanent camp that outlasted the vein',
  'A pair of competing merchants each built inns and drew different customers',
  'Soldiers ordered to hold the position until relieved were never relieved',
  'A healer famous for treating a plague settled here and drew the sick and the well alike',
  'A community of scholars chose the site for its distance from political entanglements',
  'Three extended families, each too stubborn to leave, eventually built a town around their argument',
  'A failed military expedition wintered here and lost its will to continue',
  'Travellers blocked by an impassable road gave up waiting and built houses instead',
  'A caravan that could not continue due to injury or illness became the founding population',
  'A charismatic figure declared it sacred and followers arrived within the year',
  'Two rival guilds chose the same site and resolved their argument by building the first city council',
  'A feudal lord planted the first tower and sold plots to any family willing to pay the initial fee',
  'Pilgrims arrived at a holy site and could not bring themselves to leave after the journey',
  'A pirate captain retired here with enough wealth to hire workers and build properly',
  'Loggers working the forest upstream needed a way station that became a town',
  'A shipwright set up a yard and the workers needed somewhere to sleep',
  'Farmers pushed from their land by drought or flood or war settled on what land remained',
  'A prophesied founding drew three distinct communities to the same location',
  'An imperial garrison was withdrawn; the settlers who had grown up around it stayed behind',
  'Two nations both claimed the site; neither would yield; the resulting compromise became a city charter',
  'A seasonal market became year-round once enough merchants decided proximity was worth the rent',
  'A powerful family built their estate here and their servants\' quarters became a village',
  'A guild established a warehouse at the nearest navigable point to the source of their goods',
  'Survivors of a disaster that destroyed a nearby settlement rebuilt on ground they knew',
  'A religious schism produced a splinter community that needed its own city',
  'Traders who found the existing city too crowded, too taxed, or too hostile built this one',
  'An engineer hired to build a bridge liked the site so much they stayed to sell the tolls',
  'The discovery of a nearby monster threat caused everyone in the region to consolidate in one spot',
  'A census-taker found more people here than anywhere else and wrote it down as a city',
  'A catastrophic fire in a neighbouring settlement sent its entire population here',
  'Settlers following a legendary explorer chose this as their final waypoint',
  'A natural disaster rerouted a river, creating this harbour where none existed before',
  'A political exile established a domain here; those who agreed with them followed',
  'An eclipse, a comet, or some other omen convinced the founding population this was the place',
  'A legendary battle was fought nearby; the victors built a monument; the monument attracted settlers',
  'Three generations of a merchant family built slowly until the fourth could call it a city',
  'A travelling circus that broke its wagon here became the founding entertainment district',
  'A prison camp for conquered peoples eventually outlasted the conquering empire',
  'The last survivors of a sea voyage built here because they could go no further',
  'An order of knights established a chapter house that grew into a fortified settlement',
  'A single, stubborn family refused to leave for three generations, and eventually they were the majority',
  'Agricultural innovation in the surrounding area created enough surplus to feed a new city',
  'A flood, a fire, or an earthquake revealed something of value that attracted the first settlers',
  'A failed colonisation attempt left behind enough infrastructure to attract a second wave',
  'A new road cut through the wilderness and this was the halfway point',
  'Two rivers that once ran separately were joined by a canal, creating the first deep harbour',
  'A border post established to monitor a threat became the permanent settlement when the threat passed',
  'A mountain was found to be hollow; the first inhabitants moved inside',
  'The end of a war left thousands of soldiers with nowhere to return to and one very good campsite',
  'A legendary figure was born or died or buried here; the grave became a pilgrimage site',
  'An unusual natural phenomenon — permanent rainbow, constant wind, reversing tide — drew the curious',
];

const FR_NOW = [
  'Its streets carry the weight of that history in every stone and every name.',
  'The original purpose is gone but the city endures for reasons no one entirely agrees on.',
  'Three hundred years of soot and argument have made it impossible to imagine the site without it.',
  'The founding reason is now a myth; the city is its own justification.',
  'Generations of expansion have buried the original settlement under newer, larger buildings.',
  'The city has outlasted every empire that tried to claim credit for building it.',
  'Its founders would not recognise it, but they would understand it.',
  'The original community of a hundred has grown into something that feeds tens of thousands.',
  'Wars have been fought over it. Plagues have swept through it. It persists.',
  'What began as necessity has become identity — the city defines its people as much as they define it.',
  'The founding charter, still legally in force, describes a settlement a fraction of this size.',
  'It is old enough to have its own legends and young enough to still be making them.',
  'The reason it was built is still visible if you know where to look.',
  'Its position has made it powerful; its power has made it a target; its endurance has made it a legend.',
  'Whatever the founders intended, this is what it became.',
  'The city has been sacked, burned, rebuilt, and renamed, but never abandoned.',
  'It now sustains itself on trade, on reputation, and on the stubborn refusal of its people to leave.',
  'The original settlement is a museum district; everything else is very much alive.',
  'Its age gives it authority; its size gives it power; its people give it character.',
  'Other cities rise and fall; this one seems to simply accumulate.',
  'The city has its own gravity. Once you arrive, leaving is harder than expected.',
  'Its history is a palimpsest — each generation writes over the last without erasing it entirely.',
  'It has been at the centre of three different empires without belonging to any of them permanently.',
  'The founding myth is celebrated annually with a festival that has itself become a reason to visit.',
  'It is neither the largest nor the oldest city in the region, but it is the one everyone knows.',
  'What it lacks in elegance it compensates for in energy, history, and the smell of baking bread.',
  'Its walls have been rebuilt four times; its spirit has never been breached.',
  'The original settlers\' descendants still live here, in the same buildings, on the same streets.',
  'Every stone in the old quarter has a name and a story attached to it.',
  'It has a quality that travellers notice on arrival and cannot quite name: the sense that things happen here.',
  'The city has learned, over centuries, how to survive whatever history throws at it.',
  'It is governed not by one ruler but by centuries of accumulated custom and compromise.',
  'Newcomers arrive expecting a waystation and find themselves still here a decade later.',
  'The city has no single reason for existing; it has a thousand, accumulated over time.',
  'It is a city that knows what it is, which gives it a confidence that newer places lack.',
  'Whatever brought the founders here, it is commerce, community, and stubbornness that keep it alive.',
  'The original buildings are long gone, replaced by newer structures on older foundations.',
  'It is built in layers: each century visible if you dig deep enough.',
  'The city tolerates its history without being imprisoned by it.',
  'It is a place that has been relevant in every age, for different reasons.',
  'Its people are proud not of what the city was, but of what it has refused to stop being.',
  'The original site is now the poorest part of the city; the expensive district grew elsewhere.',
  'It has survived as an independent city through alliances, bribes, and strategic ambiguity.',
  'The founding document is on display but the city bears no particular resemblance to it.',
  'It has the complicated beauty of something that was built for purpose and then kept for love.',
  'The founders are buried here; their descendants are running for city council.',
  'What the first settlers called a camp, their grandchildren called a town, and their great-grandchildren called a city.',
  'Its improbable survival is now its most celebrated characteristic.',
  'It endures because abandoning it would be admitting that all the suffering was for nothing.',
  'The city is, at this point, older than most of the stories told to explain it.',
];

// SPECIALTIES — template-based: 55 × 60 × 40 = 132,000 combinations

const SP_QUALITY = [
  'the finest', 'unusually pure', 'superbly crafted', 'uniquely durable',
  'startlingly affordable', 'absurdly expensive but worth it', 'widely imitated but never matched',
  'considered the standard against which others are measured', 'reliably excellent',
  'inconsistent in quantity but never in quality', 'produced nowhere else in the known world',
  'exported across three kingdoms', 'sought by wealthy collectors', 'required by every serious practitioner',
  'the default choice of armies, navies, and merchant fleets alike', 'available only through licensed dealers',
  'produced by a guild that guards its methods obsessively', 'better than it has any right to be',
  'the only local product that everyone agrees is genuinely superior',
  'so good that counterfeits are more common than the original',
  'praised in travellers\' accounts going back four centuries',
  'produced by a tradition passed down through a single extended family',
  'made using a process that is technically illegal in two neighbouring states',
  'the source of the city\'s original wealth and still its backbone',
  'slowly being replaced by cheaper imports, to locals\' fury',
  'a trade secret that has resisted theft, bribery, and espionage for generations',
  'the subject of an ongoing trade dispute with two neighbouring cities',
  'produced in quantities that seem impossible given the city\'s size',
  'famous enough that the product\'s name has become a generic term elsewhere',
  'the reason most travellers come here and the thing they mention when they leave',
  'manufactured under the direct oversight of the city\'s most powerful guild',
  'subject to strict quality inspections that make local merchants furious and buyers grateful',
  'produced only seasonally, which drives prices skyward in the off months',
  'a luxury good that has somehow remained accessible to ordinary buyers',
  'the product of an accident discovered three generations ago and never explained',
  'technically possible to produce elsewhere but never successfully replicated',
  'the focus of a recent political controversy about export quotas',
  'in higher demand than the city can currently supply',
  'declining in quality since the master craftsperson\'s death, though no one admits it publicly',
  'of inconsistent reputation — the best is transcendent, the worst is embarrassing',
  'sold under a protected mark that other cities have repeatedly tried to challenge',
  'produced by workers who are among the most highly paid in the region',
  'made with ingredients sourced from a secret location that suppliers refuse to identify',
  'the subject of enthusiastic local pride out of proportion to its actual global significance',
  'recently elevated from regional curiosity to international commodity',
  'something travellers always buy more of than they intended',
  'accompanied by counterfeit certificates of authenticity that locals find hilarious',
  'available in three tiers: local consumption, export quality, and the stuff reserved for royalty',
  'produced in a district that smells of the process at all hours and everyone has stopped noticing',
  'the accidental result of a combined tradition from two immigrant communities',
  'something that cannot be explained but can be demonstrated immediately on tasting or touching',
  'the city\'s proudest product and also its most boring conversation topic',
  'sold everywhere but best purchased here, where the original is also available for comparison',
  'considered medicinal in small doses, recreational in larger ones, and dangerous in excess',
  'the outcome of a centuries-long rivalry between two workshops that produced something neither intended',
  'protected by a charter so ancient that lawyers still argue about whether it applies today',
  'genuinely worth the price, which is something locals say with the slight defensiveness of people who know others disagree',
];

const SP_PRODUCT = [
  'steel blades', 'silk cloth', 'spiced wine', 'alchemical reagents', 'dried fish',
  'salt-cured meats', 'illuminated manuscripts', 'architectural stonework', 'ceramic glazeware',
  'precision instruments', 'navigational charts', 'perfumed oils', 'dyed textiles',
  'tanned leatherwork', 'enchanted trinkets', 'herbal medicines', 'distilled spirits',
  'wrought iron fixtures', 'blown glass', 'carved ivory', 'lacquered wood furniture',
  'woven tapestries', 'smoked cheeses', 'honeyed spirits', 'mechanical timepieces',
  'painted ceramics', 'pressed oils', 'exotic spices', 'trained hunting birds',
  'carved gemstones', 'silvered mirrors', 'rendered tallow', 'cured hides',
  'milled flour', 'printed broadsheets', 'musical instruments', 'surgical tools',
  'ship\'s ropes', 'anchor chains', 'oiled sailcloth', 'hardwood timber',
  'preserved citrus', 'candied ginger', 'stoneground mustard', 'fermented grain paste',
  'rendered beeswax', 'dipped candles', 'carved horn', 'felted wool',
  'braided cord', 'fired brick', 'refined copper', 'wrought tin',
  'cold-pressed seed oil', 'cultivated mushrooms', 'dried river fish', 'smoked eels',
  'cured olives', 'vine-ripened preserves', 'malted grain', 'distilled grain spirit',
];

const SP_CONTEXT = [
  'traded as far as the coast',
  'known to buyers across the continent',
  'sold in markets two weeks\' travel in every direction',
  'praised in the accounts of every traveller who passes through',
  'the first thing serious buyers ask about upon arrival',
  'the product that defines the city\'s reputation abroad',
  'found in the cellars and storerooms of powerful people across the region',
  'carried in the packs of merchants who make the journey specifically for it',
  'the primary reason the trade road through this city remains profitable',
  'in higher demand than the city can comfortably supply',
  'the source of more than half the city\'s tax revenue in good years',
  'a staple of regional trade networks going back at least two centuries',
  'shipped by the cartload to cities that would otherwise have no reason to deal with this one',
  'the product that local pride rests on, for better or worse',
  'exported legally to six neighbouring states and illegally to three more',
  'the focus of guildhall politics every time a new regulation is proposed',
  'increasingly replicated elsewhere, though never to locals\' satisfaction',
  'considered a benchmark of quality in the trade',
  'the thing that visitors are told to buy before they leave',
  'so associated with this city that the product\'s name and the city\'s name are used interchangeably in some markets',
  'produced by a workforce that has inherited the craft across ten or more generations',
  'bought at origin and resold at a markup that funds expeditions to come back for more',
  'the source of ongoing negotiations with three different trading guilds',
  'the pride of the merchant quarter and the envy of neighbouring cities',
  'considered a reliable indicator of economic health — when sales drop, the city worries',
  'sold at a premium that buyers accept because there is no alternative of comparable quality',
  'the subject of a standing order from at least one royal court',
  'produced under conditions that give it qualities impossible to replicate without the local environment',
  'the most frequently mentioned product in regional trade agreements',
  'something locals take completely for granted and outsiders find remarkable',
  'available in bulk at the market or in presentation packaging at the guild factor\'s',
  'the reason this city\'s name appears on maps made by merchants rather than cartographers',
  'considered essential provisioning for long voyages',
  'distributed through a network of agents that covers six neighbouring territories',
  'the product of a local craft tradition documented to be at least four centuries old',
  'sold alongside cheap imitations that honest merchants clearly label as such',
  'the city\'s greatest export and the most common souvenir taken by departing travellers',
  'produced by workers who could name their price in any other city and choose to stay here',
  'the focus of a trade fair held twice annually that draws buyers from considerable distances',
  'the only thing buyers from rival cities consistently admit is genuinely better here',
];

// PROBLEMS — template-based: 50 × 50 × 50 = 125,000 combinations

const PR_ACTOR = [
  'A powerful guild', 'A noble family', 'The city guard', 'The temple hierarchy',
  'A foreign merchant consortium', 'A local crime lord', 'The dock workers\' association',
  'A charismatic demagogue', 'The mayor\'s inner circle', 'A shadowy investor',
  'An out-of-town landlord', 'The oldest trade family in the city', 'A foreign ambassador',
  'The city\'s largest employer', 'A recently arrived religious sect', 'The river pilots\' guild',
  'The grain merchants\' cartel', 'An unnamed faction within the city watch',
  'A coalition of mid-tier merchants', 'The wealthiest family in the High Ward',
  'A council member acting independently', 'The city\'s chief tax collector',
  'An ancient charter held by a declining noble house', 'The physicians\' guild',
  'The port authority', 'A collective of absentee landlords', 'The miller\'s monopoly',
  'A charismatic captain recently returned from war', 'An itinerant preacher with a following',
  'The city\'s most senior archivist', 'A foreign crown with old claims on the territory',
  'A longstanding feud between two founding families', 'The brewer\'s guild',
  'A prominent moneylender whose patience has run out', 'The master of the mint',
  'A guild of assassins operating with unexpected openness', 'The city\'s only cartographer',
  'A recently widowed merchant of enormous wealth', 'The harbour master\'s office',
  'An hereditary toll-holder whose patience with reform has expired',
  'A company of mercenaries whose contract expired without payment',
  'A secret society that has become less secret', 'The road maintenance guild',
  'A prophet who has inconveniently accurate predictions', 'The bridge keeper',
  'A returned exile with a grudge and enough money to act on it',
  'A recently ennobled merchant with old scores to settle',
  'The headmaster of the city\'s most prestigious school',
  'A collective of junior council members who want to be senior ones',
  'The city\'s most accomplished forger, recently discovered',
];

const PR_ACTION = [
  'has begun extorting smaller merchants with the implicit threat of civic inconvenience',
  'is hoarding essential supplies to drive up prices ahead of winter',
  'has been accepting bribes to look the other way on building code violations',
  'is manipulating the grain market in ways that are technically legal and obviously harmful',
  'has found a legal mechanism to double the toll on the main road into the city',
  'is running a protection scheme that the city watch refuses to acknowledge',
  'has filed a legal challenge to the city charter that could invalidate three centuries of governance',
  'is threatening to relocate its operations unless the city council meets unreasonable demands',
  'has been quietly buying up properties in the poorest district for reasons no one has confirmed',
  'is orchestrating a series of convenient "accidents" affecting political opponents',
  'has refused to pay its taxes for six months and is daring the council to act',
  'is flooding the market with cheap imported goods, undercutting local craftspeople',
  'has hired a legal team to challenge a regulation that everyone else considers fair',
  'is recruiting members of the city guard into a private arrangement',
  'has discovered a loophole in the guild charter that technically permits a monopoly',
  'is intercepting shipments and claiming customs irregularities with suspicious regularity',
  'has been poisoning the relationship between two allied factions through careful misinformation',
  'is demanding a seat on the city council as a condition of continued operations',
  'has been quietly removing evidence of a past crime that the council is starting to investigate',
  'is using charitable donations to build political influence faster than the old families can respond',
  'has stopped paying its workers, who are now one bad week from open revolt',
  'is manipulating the waterways in ways that benefit their operations and flood their rivals\'',
  'has bribed the city\'s chief inspector to overlook conditions that would otherwise be illegal',
  'is stockpiling weapons in a neighbourhood that the city watch is pretending not to notice',
  'has discovered evidence of a senior official\'s past crime and is using it productively',
  'is charging usurious rates on loans made to people who had no other options',
  'has been forging quality marks on goods that don\'t meet the standard',
  'is importing workers from outside the city to break a labour dispute, making it worse',
  'has been systematically underpaying its taxes by routing money through a foreign entity',
  'is spreading a rumour that is technically unprovable and practically devastating',
  'has obtained a royal warrant that supersedes three local ordinances in inconvenient ways',
  'is running a scheme that is legal, harmful, and too profitable to stop without political cost',
  'has been quietly acquiring the debts of city council members',
  'is expanding into territory that three other guilds consider their exclusive domain',
  'has made a deal with an outside power that the city government doesn\'t know about yet',
  'is using a legitimate business as cover for something the city watch is slowly piecing together',
  'has been sabotaging competitors through means that are difficult to prove',
  'is driving a wedge between the city\'s two most powerful political factions, carefully',
  'has hired the city\'s best lawyer to make one obviously unfair practice technically legal',
  'is creating a situation where the city council must choose between two bad options',
  'has been slowly privatising public infrastructure through a series of small, overlooked deals',
  'is deliberately disrupting the city\'s water supply during a dispute over access fees',
  'has been funding a political movement that its members don\'t know is funded',
  'is converting common land into private property faster than the law can keep up',
  'has been importing contraband through a port official on its payroll',
  'is manipulating apprenticeship records to lock young workers into unfair agreements',
  'has been passing off inferior goods as quality exports and blaming the recipients when they complain',
  'is conducting an audit of the city\'s accounts that everyone knows is really about finding leverage',
  'has discovered that a city regulation written two hundred years ago technically prohibits something',
  'is running for city council while simultaneously undermining every sitting member of it',
];

const PR_CONSEQUENCE = [
  'and the council has been too divided to respond effectively.',
  'and ordinary people are starting to notice in their pockets and their patience.',
  'and three separate factions are trying to use the situation to their advantage.',
  'and the city watch is either complicit, compromised, or simply outmatched.',
  'and the situation has been getting worse for six months with no resolution in sight.',
  'and the poorest residents have already begun to feel the consequences first.',
  'and the wealthiest residents are watching with concern that looks very much like interest.',
  'and two of the city\'s most powerful people disagree about what to do about it.',
  'and the official position is that there is no problem, which has become its own problem.',
  'and the rumour is spreading faster than the facts can keep up with it.',
  'and the city\'s reputation for stability is starting to develop cracks.',
  'and the neighbouring cities are watching with the cautious interest of potential beneficiaries.',
  'and the people most affected are the ones with the least ability to do anything about it.',
  'and the city council has been meeting in emergency session for three weeks without progress.',
  'and the city\'s main trading partners have started asking uncomfortable questions.',
  'and three proposed solutions have each made the problem worse in a different way.',
  'and the city\'s debt has increased by a third in the time taken to argue about it.',
  'and the temples are divided between those calling for justice and those calling for calm.',
  'and the city guard is understaffed, underpaid, and distinctly uninterested in escalation.',
  'and a popular pamphlet describing the whole situation in scandalous detail is circulating widely.',
  'and the council member most capable of fixing it is currently under investigation for something else.',
  'and the timeline for resolution grows longer every time someone suggests a committee.',
  'and ordinary commerce is being disrupted in ways that compound every other problem.',
  'and the city\'s most prominent citizens can\'t agree on whether it\'s a crisis or an opportunity.',
  'and an outside mediator was proposed, rejected, proposed again, and is currently pending.',
  'and the faction that benefits from inaction is considerably more organised than the one seeking change.',
  'and a prominent citizen has been hinting that they could fix it if given sufficient authority.',
  'and three months of promising talks have produced nothing except more promising talks.',
  'and the people in a position to fix it have personal reasons not to.',
  'and the city\'s children are growing up watching adults argue about what used to be common sense.',
  'and the problem is now entangled with two other problems in ways that make all three harder to solve.',
  'and the city\'s allies are quietly preparing contingencies for a range of outcomes.',
  'and a petition signed by a significant fraction of the population has been formally ignored.',
  'and the political will to act exists but keeps being redirected by immediate crises.',
  'and the situation has begun to affect the city\'s relationship with its most important trading partner.',
  'and a court case that was supposed to resolve the matter has been delayed for the fourth time.',
  'and the city\'s most capable administrator resigned over it two months ago.',
  'and three public meetings have each ended with more arguments and fewer answers.',
  'and the people responsible are openly unworried, which is itself a message.',
  'and the problem has now spread to two districts that previously considered themselves uninvolved.',
  'and the traditional solution doesn\'t apply because the traditional problem didn\'t look like this.',
  'and the city\'s newest residents are experiencing the full effect while the established ones debate.',
  'and an investigation has been announced but its terms are narrow enough to ensure limited findings.',
  'and the city\'s most experienced problem-solver is currently solving a different problem somewhere else.',
  'and every short-term fix makes the long-term solution harder and more expensive.',
  'and the anger in the poor districts is becoming visible in ways the wealthy districts are not ready for.',
  'and what was a manageable situation six months ago is now a serious one.',
  'and the city is approaching a point where the choice between difficult options becomes unavoidable.',
  'and everyone agrees something must be done but cannot agree on what or by whom or when.',
  'and the original cause is almost forgotten in the noise of its compounding consequences.',
];

// SECRETS — template-based: 50 × 50 × 50 = 125,000 combinations

const SC_SUBJECT = [
  'The ruling family', 'The city itself', 'The oldest building in the city',
  'The city\'s founding charter', 'The city\'s water supply', 'The city\'s main temple',
  'The city guard\'s leadership', 'The most respected merchant in the city',
  'The city\'s most beloved public monument', 'The city archives',
  'The current holder of the Lord Mayor\'s seal', 'The city\'s most prominent healer',
  'The original founding family\'s bloodline', 'The city\'s street-cleaning guild',
  'The city\'s wealthiest resident', 'The master of the city\'s mint',
  'The city\'s most celebrated historical figure', 'The city\'s main granary',
  'The bridge that connects the old and new districts', 'The underground aqueduct',
  'The city\'s prison', 'The city\'s most profitable inn', 'The harbour master\'s records',
  'The city council\'s private meeting room', 'The city\'s oldest cemetery',
  'Three of the city\'s most prominent citizens', 'The city\'s chief archivist',
  'The city\'s official cartographer', 'The city\'s justice system',
  'The city\'s most reliable moneylender', 'The city\'s most prestigious school',
  'The underground passages beneath the old quarter', 'The city\'s founding myth',
  'The deed to the most valuable property in the city', 'The city\'s tax records',
  'The city guard captain\'s private correspondence', 'The city\'s export licence system',
  'The city\'s most sacred relic', 'The city\'s treaty with its nearest neighbour',
  'The city\'s new construction in the expanding district', 'The city\'s most visited shrine',
  'The city\'s largest employer', 'The city\'s chief physician',
  'The city\'s most celebrated annual festival', 'The city\'s walls',
  'The city\'s official history', 'The city\'s relationship with the nearest noble lord',
  'The city\'s most reliable well', 'The city\'s night watch rotation',
  'The city\'s most senior council member',
];

const SC_VERB = [
  'is not what it appears to be', 'conceals something that would change everything',
  'is built on a lie that has never been corrected', 'belongs to someone other than its nominal owner',
  'is connected to a conspiracy that predates the current government by two centuries',
  'contains evidence of a crime that no one with power wants discovered',
  'has been replaced by a convincing replica for reasons no one will explain',
  'is maintained by people who know something they have agreed never to say',
  'was constructed for a purpose entirely different from its stated one',
  'is slowly being used against the very people it appears to protect',
  'harbours something dangerous that has been contained, barely, for generations',
  'is known to three people in the city — all of whom are afraid of the other two',
  'was deliberately falsified at a moment when no one was paying attention',
  'is the subject of an agreement so secret its existence is unknown to most parties it affects',
  'serves two purposes, one public and one entirely private',
  'has been compromised in a way that would humiliate the entire city if disclosed',
  'is under the control of a faction that the city doesn\'t know exists',
  'is not located where official records say it is',
  'has been quietly transferring resources to an outside party for years',
  'was the site of an event that the official history has edited into something more palatable',
  'is operated by people whose identity would be very surprising to the city\'s leadership',
  'contains a passage or connection to somewhere that should not exist',
  'was built to keep something in, not out, and has been doing its job ever since',
  'is the last remaining piece of evidence in a case that powerful people want closed',
  'has been visited regularly by someone who should not know it exists',
  'is protected by a law specifically written to prevent investigation',
  'is the only thing standing between the city and a secret it has managed not to face',
  'was given to its current holders under conditions that have since been quietly forgotten',
  'is documented in records that three separate fires have failed to destroy',
  'has been a source of quiet benefit to a small group for a very long time',
  'is operating with the awareness of exactly the people who should be stopping it',
  'contains something that every official account describes as destroyed or lost',
  'is known to the city\'s enemies in more detail than it is known to the city\'s leadership',
  'has been used to launder something — money, identity, history, or guilt — for decades',
  'is held together by an agreement whose conditions would embarrass all parties',
  'serves the city, but primarily serves the people who control it',
  'is connected to an event that the founding generation chose to omit from the record',
  'is owned on paper by one person and controlled in practice by someone entirely different',
  'has been slowly altered over years in ways that no single person noticed in full',
  'is the reason a particular bloodline is still in power despite its evident incompetence',
  'was acquired through means that the current holders prefer not to examine too closely',
  'is the subject of a legal instrument that could invalidate a significant portion of city governance',
  'is more valuable, more dangerous, or more important than its public presentation suggests',
  'has a secondary use that its operators find considerably more profitable than its primary one',
  'is operated by people who are not who their credentials say they are',
  'is missing something that should be there, and the absence has been carefully concealed',
  'is haunted by the consequences of a decision made before any living person was born',
  'has never been fully accounted for in the official records and never will be',
  'is connected by an underground passage to somewhere that appears entirely unrelated',
  'is the reason three separate investigations have been opened and quietly closed',
];

const SC_CONSEQUENCE = [
  'and the revelation would destabilise the city\'s government.',
  'and at least two people have already been killed to keep it so.',
  'and the people who know are not the people in charge.',
  'and the truth is considerably worse than the most plausible rumour.',
  'and three families have spent generations keeping the information private.',
  'and disclosing it would expose connections no one in power wants examined.',
  'and the city\'s official history would need to be rewritten.',
  'and the people responsible are still alive and still influential.',
  'and the physical evidence has been carefully arranged to support a different conclusion.',
  'and anyone who has looked too closely has found good reasons to stop looking.',
  'and the secret\'s maintenance has required continuous, expensive effort.',
  'and two neighbouring cities have suspected the truth for years but lack proof.',
  'and there is an entire secondary economy built around not finding out.',
  'and the city\'s most prominent symbol is directly implicated.',
  'and the moment it becomes public, three other secrets will unravel with it.',
  'and the people who would most benefit from disclosure have no access to it.',
  'and the city\'s relationship with a major trading partner depends on it staying hidden.',
  'and the secret has accumulated its own secrets as people discover and agree to keep it.',
  'and the city\'s claim to its own territory rests on the assumption that it isn\'t true.',
  'and the founding legal documents are either forged or describe something very different from the present arrangement.',
  'and a religious institution with significant influence is directly involved.',
  'and the people who know are bound together by the secret more than by any other loyalty.',
  'and at least one person is in prison specifically to prevent them saying what they know.',
  'and the city\'s relationship with its nearest noble overlord changes completely if it\'s disclosed.',
  'and three separate cover-ups have themselves been covered up.',
  'and the evidence trail leads to a name that appears on the city\'s most prominent monument.',
  'and the secret is the real reason three suspicious deaths were ruled natural causes.',
  'and its disclosure would resolve a legal case that has been pending for forty years.',
  'and the institution most trusted to investigate it is the one most compromised by it.',
  'and its maintenance requires the active participation of people who believe themselves uninvolved.',
  'and two old families have a cold war that is entirely about who controls access to this secret.',
  'and the person most likely to reveal it doesn\'t know they know it.',
  'and the city\'s prosperity is directly, if indirectly, dependent on it remaining concealed.',
  'and the secret has been used as leverage in at least a dozen negotiations over the past century.',
  'and a foreign intelligence service has had the information for years and is waiting for the right moment.',
  'and the secret is written in plain sight in a document that everyone has seen and no one has read carefully.',
  'and the city\'s most beloved civic institution was specifically designed to obscure it.',
  'and three of the city\'s most senior officials are aware and have different reasons for silence.',
  'and the evidence that would expose it is held by someone who also has more to lose than gain from disclosure.',
  'and the secret has outlasted every political system the city has operated under.',
  'and it connects this city to a historical event that two other cities also want kept quiet.',
  'and the longer it remains hidden, the more people it implicates.',
  'and it explains several things about the city that have otherwise never quite made sense.',
  'and the truth is already known to the city\'s most dangerous criminal elements.',
  'and at least one foreign nation would pay extremely well for confirmation.',
  'and its exposure would benefit the city\'s rivals more than its own citizens.',
  'and the city\'s most trusted advisor is the person most actively ensuring it stays hidden.',
  'and it involves a sum of money that would fund a small army.',
  'and the secret is old enough that most of the people directly responsible are dead, which is the only reason it hasn\'t exploded already.',
  'and the city\'s official seal is directly connected to it, which is either ironic or intentional.',
];

// CRIME LORD ALIASES — template-based: 50 × 100 = 5,000 combinations

const CL_ARTICLE = [
  'the', 'the Old', 'the Red', 'the Black', 'the White', 'the Pale',
  'the Iron', 'the Cold', 'the Blind', 'the Silent', 'the Quiet', 'the Slow',
  'the Long', 'the Last', 'the First', 'the Far', 'the Near', 'the Deep',
  'the High', 'the Low', 'the Thin', 'the Fat', 'the Short', 'the Tall',
  'the Hollow', 'the Crooked', 'the Bent', 'the Broken', 'the Whole', 'the Half',
  'the Gilded', 'the Rusted', 'the Sharp', 'the Dull', 'the Bright', 'the Dark',
  'the Wide', 'the Narrow', 'the Round', 'the Square', 'the Left', 'the Right',
  'the True', 'the False', 'the Real', 'the Hidden', 'the Known', 'the Unknown',
  'the Soft', 'the Hard',
];

const CL_NOUN = [
  'Shadow', 'Hook', 'Coin', 'Knife', 'Fox', 'Widow', 'Hammer', 'Crow',
  'Veil', 'Hound', 'Silence', 'Worm', 'Ghost', 'Asp', 'Lantern', 'Wraith',
  'Brand', 'Stitch', 'Rat', 'Chain', 'Bell', 'Spade', 'Scale', 'Mask',
  'Leech', 'Needle', 'Coil', 'Thread', 'Smoke', 'Mirror', 'Key', 'Lock',
  'Candle', 'Rope', 'Thorn', 'Blade', 'Claw', 'Fang', 'Talon', 'Wing',
  'Eye', 'Ear', 'Tongue', 'Hand', 'Finger', 'Thumb', 'Bone', 'Tooth',
  'Nail', 'Spine', 'Rib', 'Skull', 'Heart', 'Liver', 'Gut', 'Scar',
  'Sore', 'Wound', 'Bruise', 'Mark', 'Sign', 'Word', 'Name',
  'Voice', 'Whisper', 'Shout', 'Song', 'Cry', 'Laugh', 'Smile', 'Frown',
  'Nod', 'Wink', 'Bow', 'Hat', 'Hood', 'Cloak', 'Coat', 'Boot',
  'Glove', 'Ring', 'Pin', 'Clasp', 'Buckle', 'Lace', 'Stud', 'Button',
  'Pouch', 'Purse', 'Bag', 'Sack', 'Box', 'Chest', 'Case', 'Bundle',
  'Flask', 'Vial', 'Cup', 'Bowl',
];

const CITY_AGES = [
  { label: 'ancient', years: '—settled over a thousand years ago—', districtBonus: 2, secretDepth: 'deep' },
  { label: 'very old', years: '—founded eight centuries past—', districtBonus: 2, secretDepth: 'deep' },
  { label: 'old', years: '—founded several centuries past—', districtBonus: 1, secretDepth: 'moderate' },
  { label: 'established', years: '—a century or more old—', districtBonus: 1, secretDepth: 'moderate' },
  { label: 'growing', years: '—two or three generations old—', districtBonus: 0, secretDepth: 'shallow' },
  { label: 'young', years: '—less than a generation old—', districtBonus: 0, secretDepth: 'shallow' },
  { label: 'newly founded', years: '—built within living memory—', districtBonus: -1, secretDepth: 'shallow' },
];

const DISTRICT_TYPES = [
  { name: 'The Merchant Quarter', description: 'Crammed with counting-houses, warehouses, and the smell of coin.' },
  { name: 'The Tangle', description: 'A labyrinth of narrow streets where the poor and desperate make their homes.' },
  { name: 'The High Ward', description: 'Where the wealthy retreat behind high walls and private guards.' },
  { name: 'The Docks', description: 'Smells of fish, tar, and salt. Sailors, longshoremen, and worse.' },
  { name: 'The Temple District', description: 'Spires and shrines to a dozen gods, all competing for the same souls.' },
  { name: 'The Forge Quarter', description: 'The constant clang of hammers day and night. The smiths run this part of town.' },
  { name: "The Scholar's Row", description: 'Libraries, apothecaries, and scholars who argue about everything.' },
  { name: 'The Barracks', description: 'Military presence, training yards, and the discipline that keeps the peace.' },
  { name: 'The Garden Ward', description: 'Parks and townhouses for those who can afford to care about beauty.' },
  { name: 'Oldtown', description: 'The original settlement, its buildings older than anyone can remember.' },
  { name: 'The Warrens', description: 'Underground tunnels and basements where those who avoid daylight conduct business.' },
  { name: 'The Market Green', description: 'An open-air bazaar that operates every day regardless of weather or law.' },
  { name: 'The Rookery', description: 'Cramped tenements stacked ten storeys high. The landlords never visit.' },
  { name: 'The Guildhall District', description: 'Every craft and trade has its hall here, each one a power unto itself.' },
  { name: 'The Harbor Front', description: 'Where ships unload things that never appear on the manifest.' },
  { name: 'The Silver Row', description: 'Jewelers, moneylenders, and pawnshops. Wealth changes hands quietly here.' },
  { name: 'The Undertow', description: 'A neighborhood that floods twice a year. The residents have stopped caring.' },
  { name: 'The Pale Quarter', description: 'Where outsiders live, by choice or by rule. A city within a city.' },
  { name: 'The Spire District', description: 'Built around a tower so old no one agrees who built it.' },
  { name: 'The Slaughterhouse Row', description: 'The butchers, tanners, and renderers. Essential, avoided, and angry about it.' },
  { name: 'Inktown', description: 'Printers, scribes, and rumormongers. The news here is always three versions of true.' },
  { name: 'The Glass Quarter', description: 'Alchemists, glaziers, and chandlers. Always smells faintly of something burning.' },
  { name: 'The Vaults', description: 'The banking district. The money here is old. The grudges are older.' },
  { name: 'The Crossings', description: 'Where three roads meet and everyone stays just long enough to cause trouble.' },
  { name: 'The Mourning Quarter', description: 'Gravediggers, coffin-makers, and priests of death. Quieter than expected.' },
  { name: 'The Tangles', description: 'A fishing district that smells of brine and arguments.' },
  { name: 'Artisan Row', description: 'Weavers, potters, woodcarvers. The good stuff is always in the back.' },
  { name: 'The Arcane Precinct', description: 'Magic practitioners cluster here by tradition, mutual suspicion, and city ordinance.' },
  { name: 'The Loom', description: 'Textile workers, dye-houses, and the guild that controls them all.' },
  { name: 'The Pit', description: 'Built into a quarry. Cheaper than the rest of the city, for obvious reasons.' },
  { name: 'Tradespire', description: 'The commercial towers where brokers shout prices from dawn to dusk.' },
  { name: 'The Stoneyard', description: 'Stonemasons, architects, and the endless sound of chisel on rock.' },
  // Extended to 80 entries
  { name: 'The Glassworkers\' Row', description: 'Furnaces burn day and night. The air smells of melted sand and opportunity.' },
  { name: 'The Rope Walk', description: 'A long straight lane where cordage is twisted. The work never fully stops.' },
  { name: 'The Butchers\' Quarter', description: 'Essential, avoided by choice, and very aware of both.' },
  { name: 'The Perfumers\' Lane', description: 'The scents compete. Underneath them all is something less pleasant.' },
  { name: 'The Printers\' District', description: 'Broadsheets, pamphlets, and sedition, in roughly equal measure.' },
  { name: 'The Chandlers\' Row', description: 'Wax and tallow. The candles here go everywhere; the gossip goes everywhere faster.' },
  { name: 'The Potters\' Quarter', description: 'Clay underfoot, clay on every surface, and the constant hum of wheels.' },
  { name: 'The Tanners\' Yard', description: 'The smell reaches the city limits. The leather trade is entirely worth it, apparently.' },
  { name: 'The Weavers\' District', description: 'The looms never stop. The workers sleep in shifts.' },
  { name: 'The Dyers\' Quarter', description: 'Every puddle is a different colour. The residents\' hands are permanently stained.' },
  { name: 'The Joiners\' Row', description: 'Furniture, cabinets, and coffins. Two of those markets are always busy.' },
  { name: 'The Bakers\' Lane', description: 'Warm at all hours. The smell is the best thing about the city, everyone agrees.' },
  { name: 'The Fishmongers\' District', description: 'The freshest product in the city and the most aggressive salespeople.' },
  { name: 'The Grain Exchange', description: 'More money changes hands per square foot here than anywhere else.' },
  { name: 'The Spice Market', description: 'A dozen countries\' products in one crowded building. The arguments are polyglot.' },
  { name: 'The Animal Quarter', description: 'Horses, pigs, cattle. The noise is constant; the smell is categorical.' },
  { name: 'The Flower Market', description: 'Beautiful, temporary, and fiercely competitive.' },
  { name: 'The Second-Hand District', description: 'Everything eventually ends up here. Including things that shouldn\'t.' },
  { name: 'The Pawnbrokers\' Row', description: 'The last stop before desperation. Also the first stop after a windfall.' },
  { name: 'The Moneylenders\' Lane', description: 'The interest rates are posted publicly. People look and then borrow anyway.' },
  { name: 'The Surgeons\' Quarter', description: 'They do their best work here. The shouting suggests it isn\'t painless.' },
  { name: 'The Apothecaries\' Row', description: 'Cures, poisons, and things that are both, depending on the dose.' },
  { name: 'The Herbalists\' Garden', description: 'Fragrant, useful, and occasionally dangerous to eat.' },
  { name: 'The Astronomers\' District', description: 'Everyone builds upward here. The towers block each other\'s views and nobody compromises.' },
  { name: 'The Map-Sellers\' Row', description: 'Every map here is accurate or claims to be. Some are both.' },
  { name: 'The Instrument-Makers\' Quarter', description: 'Tools for navigation, calculation, music, and surgery. The precision work is extraordinary.' },
  { name: 'The Clockwork District', description: 'Gears, springs, and the constant ticking that newcomers find maddening and residents no longer hear.' },
  { name: 'The Tailors\' Quarter', description: 'Fashion, function, and the needles that bridge them. The guild is merciless about quality.' },
  { name: 'The Hatters\' Lane', description: 'One of many trades that has its own enclosed world and its own quiet eccentricities.' },
  { name: 'The Cobblers\' Row', description: 'You can tell a city\'s wealth by the shoes. These are good shoes.' },
  { name: 'The Saddlers\' District', description: 'Where you go if you work with horses, or those who work with horses.' },
  { name: 'The Armourers\' Quarter', description: 'Plate, chain, leather, and the quiet commerce of personal security.' },
  { name: 'The Fletchers\' Lane', description: 'The arrowsmiths and the bow-wrights have an old rivalry that never resolved.' },
  { name: 'The Alchemists\' Quarter', description: 'Half of them are frauds. The other half are terrifying. It\'s not always clear which is which.' },
  { name: 'The Runesmiths\' Row', description: 'Enchantment, enhancement, and exactly the kind of shop where you read the label twice.' },
  { name: 'The Booksellers\' Row', description: 'New, used, and prohibited, in no particular order.' },
  { name: 'The Scribes\' Quarter', description: 'Contracts, letters, and the careful language that governs both.' },
  { name: 'The Lawyers\' District', description: 'Expensive, necessary, and fully aware of both.' },
  { name: 'The Quarter of the Lost', description: 'Where people end up when everywhere else has stopped working out.' },
  { name: 'The Foreigners\' Ward', description: 'Every face here is from somewhere else. The food is better for it.' },
  { name: 'The Pilgrim Quarter', description: 'Built to house travellers seeking a particular shrine. The pilgrimage was abolished; the infrastructure remains.' },
  { name: 'The Mercenaries\' District', description: 'Between contracts. The inns are rough, the weapons are not for show, and everything is negotiable.' },
  { name: 'The Entertainers\' Row', description: 'Theatres, acrobats, and the establishments that cater to people who have just watched a show.' },
  { name: 'The Gamblers\' Quarter', description: 'Technically illegal. Actually a significant source of tax revenue that everyone ignores.' },
  { name: 'The Mourning Lane', description: 'Funeral services, memorial-makers, and the industry around death. Quieter than expected.' },
  { name: 'The Brewer\'s District', description: 'Large vats, large arguments about process, and product that makes both worthwhile.' },
  { name: 'The Distillers\' Row', description: 'A smaller, fiercer version of the brewer\'s district. The product is stronger; so is the smell.' },
  { name: 'The Vintners\' Quarter', description: 'Wine at every price point. The cheapest is better than it should be; the most expensive is worse.' },
];

const LEADER_TITLES = [
  'Lord Mayor', 'High Steward', 'Regent', 'Margrave', 'Consul', 'High Warden',
  'Archon', 'Burgomaster', 'High Chancellor', 'Prefect', 'Voivode', 'Strategos',
  'High Alderman', 'Tribune', 'Castellan', 'Doge', 'Reeve', 'Lord Protector',
  'Grand Marshal', 'Legate', 'Syndic', 'Justiciar',
];

const GUILD_MASTER_TITLES = [
  'Guildmaster', 'High Factor', 'Trade Warden', 'Master of Coin', 'Chief Factor',
  'Grand Merchant', 'Harbor Master', 'Factor General', 'Trade Consul',
  'Master Broker', 'Chief Steward', 'Comptroller',
];

const FIRST_NAMES_M = [
  'Aldric', 'Brennan', 'Castor', 'Davin', 'Emric', 'Farrel', 'Gareth', 'Hadwin',
  'Iskar', 'Jorin', 'Keld', 'Lorcan', 'Nestor', 'Oswin', 'Petr', 'Radulf',
  'Soren', 'Torvald', 'Ulfric', 'Vael', 'Wulfric', 'Aldous', 'Bram', 'Cade',
  'Doran', 'Everett', 'Flynn', 'Gideon', 'Hakon', 'Ivan', 'Jasper', 'Keir',
  'Liam', 'Merrick', 'Nolan', 'Owen', 'Pascal', 'Quentin', 'Rhett', 'Stefan',
  'Tomas', 'Uriel', 'Victor', 'Wyatt', 'Zoren', 'Alaric', 'Baldric', 'Calix',
  'Devron', 'Edwyn', 'Fenwick', 'Gorvath', 'Halveth', 'Ignace', 'Jorath', 'Kenward',
  'Luthien', 'Morvan', 'Naevus', 'Orvyn', 'Padrec', 'Rovath', 'Sadric', 'Taldric',
  'Ulvath', 'Varath', 'Wyvern', 'Xevrath', 'Yarath', 'Zelric', 'Andrin', 'Bolveth',
  'Corvath', 'Draveth', 'Edrath', 'Folveth', 'Golveth', 'Halvath', 'Irveth', 'Jorveth',
  'Korveth', 'Lorveth', 'Morveth', 'Norveth', 'Orveth', 'Polveth', 'Qolveth', 'Rolveth',
  'Solveth', 'Tolveth', 'Urveth', 'Vorveth', 'Worveth', 'Xorveth', 'Yorveth', 'Zorveth',
  'Anrath', 'Brath', 'Crath', 'Drath',
];

const FIRST_NAMES_F = [
  'Aelith', 'Brynn', 'Calla', 'Dessa', 'Eira', 'Fenna', 'Gwynna', 'Helka',
  'Isra', 'Jora', 'Kira', 'Lysa', 'Nira', 'Osla', 'Prya', 'Renna',
  'Syla', 'Thera', 'Ulva', 'Vanya', 'Wren', 'Adela', 'Bela', 'Dwyn',
  'Elara', 'Faye', 'Greta', 'Hilde', 'Imelda', 'Jessa', 'Kessa', 'Lena',
  'Mira', 'Nessa', 'Odra', 'Petra', 'Reva', 'Sigrid', 'Tilda', 'Una',
  'Vessa', 'Wilda', 'Xara', 'Yara', 'Zara', 'Aeveth', 'Breveth', 'Ceveth',
  'Deveth', 'Eeveth', 'Feveth', 'Geveth', 'Heveth', 'Ieveth', 'Jeveth', 'Keveth',
  'Leveth', 'Meveth', 'Neveth', 'Oeveth', 'Peveth', 'Reveth', 'Seveth', 'Teveth',
  'Ueveth', 'Veveth', 'Weveth', 'Xeveth', 'Yeveth', 'Zeveth', 'Alindra', 'Brindra',
  'Calindra', 'Dalindra', 'Elindra', 'Falindra', 'Galindra', 'Halindra', 'Ilindra', 'Jalindra',
  'Kalindra', 'Lalindra', 'Malindra', 'Nalindra', 'Olindra', 'Palindra', 'Ralindra', 'Salindra',
  'Talindra', 'Ulindra', 'Valindra', 'Walindra', 'Xalindra', 'Yalindra', 'Zalindra', 'Amara',
  'Berith', 'Cerith', 'Derith', 'Erith',
];

const LAST_NAMES = [
  'Ashford', 'Blackwood', 'Coldwater', 'Dawnmore', 'Eastmarch', 'Flint',
  'Greywood', 'Hartwell', 'Ironside', 'Jasper', 'Keld', 'Longmere',
  'Marsh', 'Nighthollow', 'Oakhurst', 'Pell', 'Redmoor', 'Stonegate',
  'Thorn', 'Underhill', 'Vayne', 'Whitmore', 'Yarrow', 'Zoll',
  'Ashcroft', 'Barrow', 'Crestfall', 'Dunmore', 'Edgewick', 'Farrow',
  'Grimstone', 'Hadwick', 'Illsworth', 'Jarvis', 'Kelton', 'Lorne',
  'Mossgrove', 'Nettlewood', 'Oldbury', 'Pennwick', 'Ravenswood', 'Saltmere',
  'Thornwick', 'Umber', 'Voss', 'Wychwood', 'Yarborough', 'Zephyr',
  'Aldenvale', 'Blackmere', 'Coldspire', 'Duskwater', 'Emberfall', 'Frostholm',
  'Graymantle', 'Highwatch', 'Ironveil', 'Jadepeak', 'Keldmoor', 'Lowstone',
  'Mistwood', 'Nightfall', 'Oldgate', 'Pale Ridge', 'Queensmere', 'Rockfall',
  'Silverbell', 'Thornwall', 'Umbervale', 'Veilwood', 'Westmarch', 'Xerath',
  'Yewwood', 'Zalthorn', 'Ambervale', 'Brightwater', 'Clearstone', 'Dawnridge',
  'Elderwood', 'Fernhollow', 'Goldenmere', 'Halestone', 'Ivywood', 'Jewelstone',
  'Kestrelwood', 'Leafmere', 'Moorstone', 'Nightbell', 'Oakvale', 'Pinecrest',
  'Quickwater', 'Rushwood', 'Stonebell', 'Timberfall', 'Underpool', 'Vineyard',
  'Willowmere', 'Xerwood', 'Yellowstone', 'Zinnia',
];

// ─── Seeded RNG ──────────────────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0x100000000;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function genName(rng: () => number): string {
  const female = rng() > 0.5;
  const first = pick(female ? FIRST_NAMES_F : FIRST_NAMES_M, rng);
  const last = pick(LAST_NAMES, rng);
  return `${first} ${last}`;
}

// ─── Main Simulator ──────────────────────────────────────────────────────────

export interface ExNovoCity {
  foundingStory: string;
  age: string;
  districts: Array<{ name: string; description: string }>;
  specialty: string;
  currentProblem: string;
  secret: string;
  leader: { name: string; title: string; description: string };
  crimeLord: { name: string; alias: string; description: string };
  guildMaster: { name: string; title: string; description: string };
  npcs: NPC[];
  factions: Faction[];
}

export function simulateExNovo(city: City, worldSeed: string): ExNovoCity {
  // Stable seed per city so re-renders don't change things
  const seedNum = city.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) +
    parseInt(worldSeed.replace(/\D/g, '').slice(0, 6) || '42', 10);
  const rng = makeRng(seedNum);

  const frWhat = pick(FR_WHAT, rng);
  const frHow = pick(FR_HOW, rng);
  const frNow = pick(FR_NOW, rng);
  const foundingBase = `${city.name} grew from ${frWhat}. ${frHow}. ${frNow}`;

  const ageEntry = pick(CITY_AGES, rng);
  const districtCount = Math.min(Math.max(2, Math.floor(rng() * 3) + 3 + ageEntry.districtBonus), 6);
  const districts = pickN(DISTRICT_TYPES, districtCount, rng);

  const spQ = pick(SP_QUALITY, rng);
  const spP = pick(SP_PRODUCT, rng);
  const spC = pick(SP_CONTEXT, rng);
  const specialtyText = `${city.name} is known across the region for ${spQ} ${spP}, ${spC}.`;

  const prA = pick(PR_ACTOR, rng);
  const prAct = pick(PR_ACTION, rng);
  const prC = pick(PR_CONSEQUENCE, rng);
  const problemText = `${prA} ${prAct}, ${prC}`;

  const scSub = pick(SC_SUBJECT, rng);
  const scV = pick(SC_VERB, rng);
  const scC = pick(SC_CONSEQUENCE, rng);
  const secretText = `${scSub} ${scV}, ${scC}`;

  // Generate key NPCs
  const leaderName = genName(rng);
  const leaderTitle = pick(LEADER_TITLES, rng);
  const crimeLordName = genName(rng);
  const alias = `${pick(CL_ARTICLE, rng)} ${pick(CL_NOUN, rng)}`;
  const guildMasterName = genName(rng);
  const guildTitle = pick(GUILD_MASTER_TITLES, rng);

  const leader: ExNovoCity['leader'] = {
    name: leaderName,
    title: leaderTitle,
    description: `${leaderTitle} ${leaderName} ${rng() > 0.5 ? 'rules with an iron fist, feared more than loved' : 'governs through compromise and careful alliances, respected if not beloved'}. ${rng() > 0.5 ? 'They are secretly terrified of losing power.' : 'They carry a burden the public knows nothing about.'}`,
  };

  const crimeLord: ExNovoCity['crimeLord'] = {
    name: crimeLordName,
    alias,
    description: `Known only as "${alias}", ${crimeLordName} controls the shadows of ${city.name}. ${rng() > 0.5 ? 'Nobody has ever seen their face at a crime scene.' : 'They operate through intermediaries so insulated that even their lieutenants don\'t know who gives the orders.'} The city guard knows they exist; proving it is another matter.`,
  };

  const guildMaster: ExNovoCity['guildMaster'] = {
    name: guildMasterName,
    title: guildTitle,
    description: `${guildMasterName} serves as ${guildTitle} of ${city.name}'s merchant consortium. ${rng() > 0.5 ? 'Affable and generous in public, ruthless in contract negotiations.' : 'A former sailor who clawed their way up through the trading houses by knowing exactly when to lie and when to tell the truth.'} Controls more of the city's actual decisions than the ${leaderTitle} does.`,
  };

  // Build NPC array for Grimoire export
  const npcs: NPC[] = [
    {
      id: `${city.id}_leader`,
      name: leaderName,
      type: 'leader',
      race: 'Human',
      alignment: rng() > 0.5 ? 'Lawful Neutral' : 'Lawful Good',
      description: leader.description,
      influence: 'high',
      role: leaderTitle,
      associatedCityId: city.id,
    },
    {
      id: `${city.id}_crimelord`,
      name: `${crimeLordName} ("${alias}")`,
      type: 'criminal',
      race: 'Human',
      alignment: rng() > 0.5 ? 'Chaotic Neutral' : 'Neutral Evil',
      description: crimeLord.description,
      influence: 'high',
      role: 'Crime Lord',
      associatedCityId: city.id,
    },
    {
      id: `${city.id}_guild`,
      name: guildMasterName,
      type: 'merchant',
      race: 'Human',
      alignment: 'True Neutral',
      description: guildMaster.description,
      influence: 'high',
      role: guildTitle,
      associatedCityId: city.id,
    },
  ];

  // Factions
  const factions: Faction[] = [
    {
      id: `${city.id}_ruling`,
      name: `The ${pick(LAST_NAMES, rng)} Council`,
      type: 'Political',
      description: `The ruling body of ${city.name}, nominally led by the ${leaderTitle}.`,
      headquartersId: city.id,
      alignment: 'Lawful Neutral',
      members: [leaderName],
      rivals: [`${city.id}_shadow`],
      allies: [`${city.id}_guild_faction`],
      leader: leaderName,
    },
    {
      id: `${city.id}_shadow`,
      name: `The ${pick(['Crimson', 'Pale', 'Iron', 'Hollow', 'Silent'], rng)} Hand`,
      type: 'Criminal',
      description: `The criminal network controlled by "${alias}". They deal in smuggled goods, protection rackets, and information.`,
      headquartersId: city.id,
      alignment: 'Chaotic Neutral',
      members: [crimeLordName],
      rivals: [`${city.id}_ruling`],
      allies: [],
      leader: `${crimeLordName} ("${alias}")`,
    },
    {
      id: `${city.id}_guild_faction`,
      name: `The ${city.name} Merchant Consortium`,
      type: 'Economic',
      description: `The merchant guild that controls trade through ${city.name}. They back whoever keeps taxes low and roads safe.`,
      headquartersId: city.id,
      alignment: 'True Neutral',
      members: [guildMasterName],
      rivals: [],
      allies: [`${city.id}_ruling`],
      leader: guildMasterName,
    },
  ];

  return {
    foundingStory: foundingBase,
    age: ageEntry.label,
    districts,
    specialty: specialtyText,
    currentProblem: problemText,
    secret: secretText,
    leader,
    crimeLord,
    guildMaster,
    npcs,
    factions,
  };
}
