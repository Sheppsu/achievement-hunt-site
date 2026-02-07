import os
from datetime import datetime, timezone

import django
from dotenv import load_dotenv

load_dotenv()

if os.getenv("OSU_DEV_SERVER") == "1":
    print("This script won't work on the osu! dev server, please provide API credentials for osu.ppy.sh")
    exit(1)

os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()


from achievements.models import *
from common.osu_api import get_client


client = get_client()


dates = []
for i in range(8):
    dates.append(datetime(year=2024, month=11, day=16 + i, tzinfo=timezone.utc))
dates.append(datetime(year=2024, month=11, day=25, tzinfo=timezone.utc))


iteration = EventIteration.objects.filter(start=dates[0], end=dates[-1]).first()
if iteration is None:
    iteration = EventIteration.objects.create(start=dates[0], end=dates[-1])


batches = []
for i in range(8):
    batch = AchievementBatch.objects.filter(iteration=iteration, release_time=dates[i]).first()
    if batch is None:
        batch = AchievementBatch.objects.create(iteration=iteration, release_time=dates[i])
    batches.append(batch)


id_interval = 0


def create(category, name, description, tags=None, audio="", beatmap_id=None):
    global id_interval

    id_interval += 1

    tags = ",".join(tags or [])

    existing = Achievement.objects.filter(id=id_interval).first()
    if (
        existing is not None
        and existing.name == name
        and existing.description == description
        and existing.tags == tags
        and existing.audio == audio
        and existing.beatmap_id == beatmap_id
    ):
        return

    beatmap = client.get_beatmap(beatmap_id) if beatmap_id is not None else None

    if beatmap is not None:
        BeatmapInfo(
            id=beatmap.id,
            artist=beatmap.beatmapset.artist,
            title=beatmap.beatmapset.title,
            version=beatmap.version,
            cover=beatmap.beatmapset.covers.cover,
            star_rating=beatmap.difficulty_rating,
        ).save()

    if existing is not None:
        existing.name = name
        existing.description = description
        existing.tags = tags
        existing.audio = audio
        existing.beatmap_id = beatmap_id
        existing.save()
    else:
        Achievement(
            id=id_interval,
            name=name,
            description=description,
            beatmap_id=beatmap_id,
            audio=audio,
            tags=tags,
            batch=batches[max(0, id_interval - 21) // 10],
            created_at=datetime.now(timezone.utc),
            last_edited_at=datetime.now(timezone.utc),
        ).save()

    print(f"{name} - {id_interval}")


# Day 1 (30)
create(
    "Knowledge",
    "The original osu!musician",
    "PFC any difficulty on the most played mapset of osu's first featured Artist",
    tags=[],
)
create(
    "Knowledge",
    "Genesis",
    "What does a wolf and the end of the world have in common? A particular beatmap from 2008, apparently.",
    tags=[],
)
create(
    "Knowledge",
    "404 leaderboard not found",
    "There's a loved map where you can't submit a score on osu!stable. Perhaps you can try lazer with a tad of adrenaline on the side?",
    tags=[],
)
create(
    "Knowledge",
    "Starting point",
    "Pass the top play of the first person interviewed in osu! The Followpoint with the same mods they used",
    tags=["pass"],
)
create(
    "Knowledge",
    "I'll sing so I can heal you",
    "Pass the hardest approved map excluding TAG4 maps using no mods",
    tags=["pass"],
)
create(
    "Knowledge",
    "Know your OWC player #1",
    "Submit a score on the top play of this OWC player with the same mod combo they used (NF allowed). Stats exclude OWC 2024 | Country: Located in western Europe | Account created: between 2009-2011 | Best OWC placement: 7th-8th place | Appearences: played in 13 OWC's | Playstyle: Tablet",
    tags=["mode-o"],
)
create(
    "Knowledge",
    "Kwan method",
    "Submit a score on the map that got RyuK top 5 global for the first time with the same mods he used (NF allowed)",
    tags=[],
)
create("Knowledge", "Doctors' Appointment", 'The page at osu.ppy.sh says: "fuck you"... or used to')
create("Knowledge", "Dark familiarity", "No mistak... wait I recognize this achievement name.", tags=[])
create("Secret", "Historian", "We are the ones who write history in the shafts of time", tags=[])
create(
    "Secret", "Winning Ticket", "A lottery ticket for a chance for some big reward? I'd buy that for a dollar!", tags=[]
)
create("Secret", "THE GOAT", "You are truly Insane at polyrhythm", tags=[])
create("Secret", "WAS?!", "YOU JUST GOT UNBANNED", tags=[])
create("Secret", "😛🐸", "Yup. Teto thinks that green is in fact the best colour of them all.")
create(
    "Secret",
    "The Secret to Top Performance",
    "0.5L of orange juice, 5 bananas, 1 tablespoon of hemp seeds, and 1 table spoon of chia seeds",
)
create(
    "Secret",
    "Dictionary",
    "Rumors Indicate Various Established Rules: First Letters Of Written Sentence, Leave One Victor Enlighted (Not Only To Ease)",
    tags=[],
)
create(
    "Skill",
    "Astronomical",
    "Set an A or S rank pass on this map with NM or HD",
    tags=["streams", "mode-o", "pass"],
    beatmap_id=1949106,
)
create(
    "Skill",
    "Re-learning to Read",
    "Compete for the highest star rating PFC on a ranked map using lazer's Depth mod (and only this mod) on default settings.",
    tags=["competition", "lazer", "mode-o"],
)
create(
    "Skill",
    "Biggest Fan",
    'PFC a ranked 10+ minute map with the word "Compilation" in its title',
    tags=["consistency", "marathon"],
)
create("Skill", "4 Hands", "Pass this map with NM or HD only", tags=["mode-m", "pass"], beatmap_id=4275754)
create("Skill", "Ascendant", "Pass Xeroa [Exceed] with NM or HD only", tags=["pass"], beatmap_id=4437056)
create(
    "Skill",
    "Baby circles",
    "Get an A or S rank on a ranked map that's CS 10 (no mods except HD allowed)",
    tags=["mode-o", "precision"],
)
create("Skill", "Fruit Farm", "Compete for the highest ranked pp play in osu!ctb", tags=["mode-f", "pp", "competition"])
create(
    "Skill", "Beethoven", "Compete for the highest ranked pp play in osu!mania", tags=["mode-m", "pp", "competition"]
)
create(
    "Skill", "Drum Master", "Compete for the highest ranked pp play in osu!taiko", tags=["mode-t", "pp", "competition"]
)
create(
    "Skill",
    "King of Circles",
    "Compete for the highest ranked pp play in osu!std.",
    tags=["competition", "pp", "mode-o"],
)
create(
    "Skill",
    "Windows Kurwa Update",
    "Submit a play with greater than 1265 combo on this map using NM only (this description was changed to be less confusing)",
    tags=["mode-o", "combo"],
    beatmap_id=118068,
)
create(
    "Skill",
    "Endless Wings",
    "Pass this map with at least 90% accuracy using NM or HD only",
    tags=["technical", "sliders", "mode-o", "pass", "accuracy"],
    beatmap_id=1492654,
)
create(
    "Skill",
    "King of Despair",
    "Pass this map with an A or S rank using NM or HD only",
    tags=["mechanics", "technical", "mode-o", "pass"],
    beatmap_id=3229091,
)
create(
    "Skill",
    "Marksmanship Warrior",
    "Get 12 misses or less on this map using NM or HD only.",
    tags=["mode-o", "mechanics", "aim", "misses"],
    beatmap_id=929999,
)

# Day 2 (40)
create(
    "Secret",
    "Comical",
    "Why did the snowman apply for a job at the book store? something something, idk, I forgot.",
    tags=[],
)
create("Secret", "Protect Your Data!", "Don't let the flames spread. Even a small mistake will cost you.", tags=[])
create("Secret", "Two Keys", "There is this ooo- o- o- o- one map... is it really that hard?", tags=["mode-f"])
create(
    "Knowledge",
    "King of the leaderboard",
    "Submit a score on the osu!std top play of the person who has the most #1's across every game-mode",
    tags=[],
)
create(
    "Knowledge",
    "Super Dr.. Drama?",
    "Pass this map that tried to bring back 2007 mapping in CS7, but got disqualified in early 2021.",
    tags=["pass", "precision"],
)
create(
    "Knowledge",
    "Eternal Glory",
    "PFC the longest running #1 score specifically from osu!'s most iconic player (according to n3rdiness)",
    tags=[],
)
create(
    "Skill",
    "Jittering Accuracy",
    "Achieve at least 90% accuracy on this map using no mods",
    tags=["mode-m", "accuracy", "4k"],
    beatmap_id=1286501,
)
create(
    "Skill",
    "Alice's Dense Freezer",
    "Get 25 misses or less on this map with EZDT/EZNC and optionally HD",
    tags=["reading", "aim", "mechanics", "mode-o", "misses"],
    beatmap_id=2663395,
)
create(
    "Skill",
    "Back to school",
    "Get 0 misses on Run Lads Run [Math Test (Hard) - Version #7] with NM or HD only",
    tags=["mode-o", "gimmick", "reading", "math"],
    beatmap_id=4845683,
)
create("Miscellaneous", "Modification Mayhem", "Get any kind of 10 Mod pass excluding NF", tags=["lazer", "pass"])

# Day 3 (50)
create("Secret", "Old Taiko Master", "Undust your old Wadaiko", tags=["mode-t"])
create(
    "Secret",
    "Vexillologist's IDeas",
    "The flags mark the spot. However, when they change, the treasure map changes along with them. Can you figure out where they lead?",
    tags=[],
)
create("Secret", "Muteit", "Catchy? Not anymore.", tags=[])
create(
    "Secret",
    'Not Bluffing <span style="color:var(--background-color)">Or am I?</span>',
    "Open your eyes",
    tags=["mode-o", "flashlight"],
)
create(
    "Knowledge",
    "March Patch Note",
    '- The issue causing humanoids to die unexpectedly from DoT when using certain stat modifiers on Another in the "Second Mix Deluxe" DLC campaign has been fixed<br/>- You can now pet Squishy the whale in the outskirts of Ocean City',
    tags=["mode-o"],
)
create(
    "Knowledge",
    "The First Medal of Honour",
    "PFC the first map (top of BSR3) in the first badged tournament using NM only",
    tags=[],
)
create(
    "Knowledge",
    "Know your OWC player #2",
    "Submit a score on the top play of this OWC player with the same mod combo they used (NF allowed). Stats not including OWC 2024 | Country: Located in East Asia, Account created: between 2020-2021, Best OWC placement: 9-12th place,  Appearences: played in 1 OWC, Playstyle: Tablet",
    tags=["mode-o"],
)
create(
    "Skill",
    "8B+ Pen Tracing",
    "get 95%+ with Easy and Traceable on any map that is 5.0* or higher before mods and at least 60 seconds drain time",
    tags=["lazer", "reading", "mode-o"],
)
create(
    "Skill",
    "Do you like big notes?",
    "Get the maximum possible nomod score on this map",
    tags=["mode-t", "score"],
    beatmap_id=127524,
)
create(
    "Skill",
    "Classic Carrot Catch",
    "Pass this map with at least an A rank using NM or HD",
    tags=["mode-f"],
    beatmap_id=1037258,
)

# Day 4 (60)
create("Secret", "STERBEN", "Been a Good Hunting season this year, aye?", tags=[])
create("Secret", "Day and night", "I prefer the original", tags=["lazer"])
create(
    "Secret",
    "Butchering a Name",
    "Ok but like how do you even pronounce this? I have spent a solid 10 minutes trying to say this. Like, the song is a Jam but its just not possible to say it without butchering it completely. ...you know what, forget it. I'm wasting my time with something unimportant.",
    tags=[],
)
create(
    "Secret",
    "Mushroom, Nirvana and Everything Inbetween",
    "You're just like the others.<br/>I do not merely pretend but achieved.<br/>Just surrender already.<br/>Nothing will change if you do it differently next time.",
    tags=[],
)
create(
    "Knowledge",
    "Achievements have sounds now?",
    "An infamous song in osu! history, and a great map. But what you hear may not be what you think. Submit a score on the mapset of these hit sounds.",
    tags=["audio"],
    audio="theFunny.wav",
)
create("Knowledge", "Large circle incident", "事件 CORSACE關閉 NM6 [BEAN METHOD] MAP不可能的 CURSOR GO BRRRR", tags=[])
create(
    "Knowledge",
    "The First PP Barrier",
    "Beat the first osu!std 400pp play's accuracy on the map it was set using the same mods",
    tags=["accuracy"],
)
create(
    "Skill",
    "Do you like cheese? No? Do you like TL? No? Too bad!",
    "Pass the taiko convert of this map using no mods",
    tags=["mode-t", "pass"],
    beatmap_id=657519,
)
create(
    "Skill",
    "Quick and Easy One to Take a Breather",
    "Get >95% accuracy on this map with EZDT",
    tags=["mode-f", "accuracy"],
    beatmap_id=3915057,
)
create(
    "Skill",
    "PeepoArrive",
    "Pass this map with at least 88% accuracy using HD only",
    tags=["technical", "mode-o", "sliders"],
    beatmap_id=4310507,
)

# Day 5 (70)
create(
    "Secret",
    "Kisaragi",
    "You dont find the song, the song finds you. Can you hide from it behind those blinds?",
    tags=["lazer"],
)
create("Secret", "Gotta Go Fast", "You're Too Slow!", tags=["lazer"])
create("Secret", "imgur.com/a/W53QqkY", "It isn't even that small, right? 6.5 is also just perfect.", tags=["mode-o"])
create("Secret", "To be or not to be..", "...an apple?", tags=[])
create("Knowledge", "He cannot hit that", "Can you?", tags=["mode-o", "lazer"])
create(
    "Knowledge",
    "Know your OWC player #3",
    "Submit a score on the top play of this OWC player with the same mod combo they used (NF allowed). Stats exclude OWC 2024 | Country: Located in Northern Europe, Account created: between 2014-2016, Best OWC placement: 9-12th place,  Appearences: played in 4 OWC, Playstyle: Mouse",
    tags=["mode-o"],
)
create(
    "Knowledge",
    "Handcam Quiz",
    'Submit a score on this player\'s top play with the same mods (NF allowed): <a class="external-link" href="https://i.imgur.com/fFLDmRz.png" target="_blank">https://i.imgur.com/fFLDmRz.png</a>',
)
create(
    "Skill",
    "EZ Can't Hurt You In Other Gamemodes... Right?",
    "Get >95% on this map with EZ",
    tags=["mode-t"],
    beatmap_id=145511,
)
create(
    "Skill",
    "Slow and Steady",
    "Set a play on this map worth at least 200pp using HTHR only",
    tags=["mode-o", "streams"],
    beatmap_id=2211018,
)
create(
    "Skill",
    "K-pop Enjoyer",
    "Get >98% accuracy on 3 different ranked Dreamcatcher maps in a row that are at least 3.5* using NM or HD. Failing or retrying will reset your streak.",
    tags=["consistency", "mode-m"],
)

# Day 6 (80)
create(
    "Secret",
    "#E2FB36DB",
    'Shouldn\'t have built those balls on hypxiel<br/>Note: "hypxiel" is intentional, not a typo.',
    tags=[],
)
create(
    "Secret", "Addicted", "Just a small bit is enough to make you Insane. It might be too late for you now.", tags=[]
)
create("Secret", "10-Meter Dash", "Don't blink or you'll miss it", tags=[])
create("Secret", "Rotten Basket", "Cannot get worse than that", tags=["mode-f"])
create(
    "Secret",
    "The Last Declamation",
    'A Man who doesn\'t wish to be Emperor and has never spoke before, speaks to the world, to his soldiers. He does not wish for them to be enslaved nor used as tools of war, afterall they are not as simple as livestock, they are men. He exclaims that they have the power to make machines, create happiness as the "the Kingdom of God is within man".',
    tags=[],
)
create("Secret", "Cursed", "The curse of the legendary sword.", tags=[])
create(
    "Knowledge",
    "The Three Kims",
    "Some say there's a map whose background is a certain korean man laughing at his defeated opponent.",
    tags=[],
)
create(
    "Knowledge",
    "SFA",
    "This player is well-known for popularizing a certain tablet area style. Submit a score on the map that got them top 100 with the same mods (NF allowed).",
    tags=[],
)
create(
    "Knowledge",
    "Ants in the Spotlight",
    'It\'s basically an fc... <a class="external-link" href="https://i.imgur.com/5PpMhGi.png" target="_blank">https://i.imgur.com/5PpMhGi.png</a>',
    tags=["mode-o"],
)
create(
    "Miscellaneous",
    "Mathematician",
    "Submit a play on this mapset where the cross sum of your max combo matches your miss count",
    tags=["math"],
    beatmap_id=1863223,
)

# Day 7 (90)
create("Secret", "Emotional", "Rest well, Aniki.", tags=[])
create(
    "Secret",
    "The Day Before Halloween",
    "In 2015, someone we all love started a new chapter for osu! However, the main subject of this achievement has everything to do with recent updates of the old chapter: use one to create the link of a specific user (who is just short of one million ranked score) and loosely replicate their top play.",
    tags=[],
)
create("Secret", "colorblind", "idontseeanycolorsinthevisiblecolorspectrum", tags=[])
create(
    "Secret",
    "A Four-Man Job",
    'Should be easy enough by yourself even if the lights fade away in what they call "Fosserøyk"',
    tags=["mode-o"],
)
create("Secret", "Sacrilege", "Peppy did what?!?! I am disappointed...", tags=[])
create("Secret", "Performer", "There's a professional pianist that is... a bumblebee?", tags=[])
create(
    "Secret",
    "Supreme commander",
    "You control all of our military forces. Your skills are priceless. Do whatever it takes to kick the enemies ass!",
    tags=[],
)
create(
    "Knowledge",
    "Faker's Start",
    'A well-known korean tournament player noted a certain country-based tournament from 2021 as the first tournament where he didn\'t get "completely destroyed by nerves." Submit a score on the Grand Finals DT1 of this tournament with DT and optionally NF.',
    tags=[],
)
create(
    "Skill",
    "Bananas? I LOVE BANANAS!",
    "Compete for the highest score on this map. This achievement can only be completed in stable.",
    tags=["mode-f", "competition", "score", "stable"],
    beatmap_id=80895,
)
create(
    "Skill",
    "Reading Mashup",
    "Compete for the highest score on this map. This can only be completed on lazer. Must use no mods or NF.",
    tags=["mode-o", "competition", "score"],
    beatmap_id=4820929,
)

# Day 8 (100)
create(
    "Secret", "Decoder", "V2hvIGlzIHRoaXMgUm94a3l1dWJpIGd1eT8gTWF5YmUgaGlzIG1hcCBzb3VuZHMgZ29vZCB3aXRoIE5DLg==", tags=[]
)
create("Secret", "Ascending the Ranks", "One score at a time", tags=[])
create("Secret", "Full of overconfidence", "You're too Quick to up the difficulty", tags=[])
create(
    "Knowledge",
    "Beats from the top",
    "From #1 to musician. Submit a score on this Featured Artist's first song that got ranked. ",
    tags=[],
)
create(
    "Knowledge",
    "Profile Museum",
    'Identify this player by an old screenshot of their profile and submit a score on their current top play with the same mods (NF allowed). <a class="external-link" href="https://i.imgur.com/XmShZc4.png" target="_blank">https://i.imgur.com/XmShZc4.png</a>',
)
create(
    "Knowledge",
    "Promise",
    "A well-known artist in both the osu! and vtuber communities. Submit a score on a mapset of one of their songs under their older alias using EZNCHD.",
    tags=["reading"],
)
create("Knowledge", "We all had to start somewhere", "His maps suck don't play it", tags=[])
create(
    "Skill",
    "Onslaught From the Girl with Eyes of Fire",
    "Pass this map using HT and optionally HD (you can also pass it NM if you want)",
    tags=["mode-t"],
    beatmap_id=2399787,
)
create("Skill", "Ragnarok", "Pass this map using no mods", tags=["mode-m", "7k"], beatmap_id=221368)
create(
    "Skill",
    "Don't Step on their Tails",
    "Get at least an A rank on this map using NM or HD",
    tags=["mode-f"],
    beatmap_id=698097,
)
