import django
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()


from achievements.models import *
from django.conf import settings


client = settings.OSU_CLIENT


id_interval = 3
achievement_cnt = Achievement.objects.count()


def create(category, name, description, tags=None, audio="", beatmap_id=None):
    global id_interval

    id_interval += 1

    tags = ",".join(tags or [])

    existing = Achievement.objects.filter(id=id_interval).first()
    if (
        existing is not None and
        existing.category == category and
        existing.name == name and
        existing.description == description and
        existing.tags == tags and
        existing.audio == audio and
        existing.beatmap_id == beatmap_id
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
            star_rating=beatmap.difficulty_rating
        ).save()

    if existing is not None:
        existing.category = category
        existing.name = name
        existing.description = description
        existing.tags = tags
        existing.audio = audio
        existing.beatmap_id = beatmap_id
        existing.save()
    else:
        a = Achievement(
            id=id_interval,
            category=category,
            name=name,
            description=description,
            beatmap_id=beatmap_id,
            audio=audio,
            tags=tags
        ).save()

    print(f"{name} - {id_interval}")


create("Skill", "Thor", "Pass this map with NM or HD", tags=["pass", "mechanics", "mode-o"], beatmap_id=3299406)
create("Skill", "Petrifying", "Pass this map with at least a B rank using (HD)DT", tags=["pass", "mechanics", "mode-o"], beatmap_id=2512118)
create("Skill", "Victimized", "Pass this map with at least an A rank", tags=["pass", "accuracy", "mode-o"], beatmap_id=1200520)
create("Skill", "PhD", "Get an A rank on this map with NM or HD", tags=["pass", "technical", "accuracy", "mode-o"], beatmap_id=3619544)
create("Skill", "181", "Pass this map with at least 2,000 combo using NM or HD", tags=["pass", "combo", "mode-o"], beatmap_id=1529189)
create("Skill", "Hello Offline Chat", "Pass this map with NM or HD", tags=["pass", "reading", "gimmick", "mode-o"], beatmap_id=4501918)
create("Skill", "Good luck :)", "Pass this map with (HD)EZ", tags=["gimmick", "reading", "pass", "mode-o"], beatmap_id=4303461)
create("Skill", "Easy", "SS this map with HDDTHRFL", tags=["gimmick", "mode-o"], beatmap_id=1331685)
create("Skill", "Extremely Dedicated", "Pass this map with (HD)HT", tags=["pass"], beatmap_id=156352)
create("Skill", "Washing Machine", "Get at least 20% accuracy on this map (NF allowed)", tags=["accuracy", "gimmick", "mode-o"], beatmap_id=1417193)
create("Skill", "Loyal BMCer", "Pass all three ZZZ maps made by Edward in the order he created them in a row. Failed plays will break your streak.", tags=["pass"])
create("Skill", "Consistent", "PFC 5 maps in a row that are at least 4* and 3 minutes. Map must be 4* with no mods. Failed plays will break your streak.", tags=["pfc", "consistency"])
create("Skill", "5 Digit's Milestone", "Set a play worth at least 300pp. The play must overwrite any old scores for the pp to be visible.", tags=["pp"])
create("Secret", "Back to the beginning", "Let's dance under the disco light to this timeless classic")
create("Secret", "{ .-- .... . -. / -.-- --- ..- / ... . . / .. - }", "It's just out of reach... maybe there's another way?")
create("Secret", "Are you blind?", "You do not know how the game works, just...")
create("Knowledge", "Early Competition", "PFC the first map (top of the mappool) of the first ever tournament (with a working mappool)")
create("Knowledge", "Working as intended", "PFC the first map to break the pp system")
create("Knowledge", "Discord", "Set a play on osu!'s first \"controversial\" ranked map (NF allowed)")
create("Skill", "No cursor? No problem!", "PFC a 4*+ map that has a max combo of at least 100 using lazer's No Scope mod. Must be 4*+ with no mods.", tags=["gimmick", "pfc", "lazer", "combo", "mode-o"])
create("Knowledge", "More like II-W", "Replicate this astounding display of polyrhythmic finger control with a nomod SS on the same set (any difficulty is fine)")
create("Miscellaneous", "Accuracy isn't real", "Get all 50s on a map with at least 100 combo", tags=["gimmick", "combo", "mode-o"])
create("Knowledge", "Inspirational", "Pass the first \"Aspire\" map")
create("Secret", "Attractive Space", "Floating away in space... ha ha, ha ha")
create("Secret", "Alphabet", "Even a baby can spell this out")
create("Secret", "😋👧❤️👧", "I'm still waiting for someone to draw them all together...")
create("Skill", "Morgan le Fay", "Pass this map with NM or HD", tags=["pass", "mechanics", "mode-o"], beatmap_id=4054471)
create("Skill", "Drowning", "Pass this map with NM or HD", tags=["pass", "technical", "mode-o"], beatmap_id=837567)
create("Skill", "Peppy's Favorite", "PFC this map with FL", tags=["flashlight", "pfc", "gimmick", "mode-o"], beatmap_id=259)
create("Skill", "osu! for Ants", "Pass this map with NM or HD", tags=["pass", "precision", "gimmick", "mode-o"], beatmap_id=3708312)
create("Skill", "Find your way out", "Pass this map with NM or HD", tags=["gimmick", "reading", "pass", "mode-o"], beatmap_id=1529759)
create("Skill", "Team Up", "Pass any difficulty on this mapset with NM", tags=["gimmick", "mode-m"], beatmap_id=4197850)
create("Skill", "Score Farmer", "Get at least 100 million score on a single play", tags=["score"])
create("Knowledge", "The New Era", "Submit a score on this map which is remembered for being the map mrekk took #1 on")
create("Knowledge", "16oz", "Submit a score on the map that won mrekk The Roundtable II")
create("Secret", "Completionist Paths", "From the panda who ate a granny, to the chunks cleared across the finish line, completionist status is unparalleled dedication")
create("Secret", "Nat Geo", "Red signs leading to find a brightly shining sea creature")
create("Secret", "Decoder", "VHJpZWQgY2xpY2tpbmcgY2lyY2xlcyBpbiBHZW9tZXRyeSBEYXNoPw==")
create("Secret", "1000-334", "To serve the devil, one must match the combo to the title")
create("Secret", "Revive", "Unwrap the defibrillator and start pumping with full commitment to be the ultimate Rhythm Master")
create("Secret", "Everything Is Spinning", "I can't stop Kurukuru'ing")
create("Knowledge", "Is 85 Enough?", "Pass this map which gained attention for being controversial in early 2018")
create("Knowledge", "Most loved", "This is THE favorite, loved more than anything else")
create("Knowledge", "Comeback", "Submit a score on the first map Cookiezi played after his military service")
create("Knowledge", "Filipino Maple", "Pass the map that Zylice used maple on")
create("Knowledge", "osu! pioneer", "PFC the top play of the first ever #1 player (when ranked score was released)")
create("Skill", "Get Back Here!", "PFC a 4*+ map with lazer's Repel mod and at least 200 combo. Must be 4*+ when no mods are applied.", tags=["pfc", "gimmick", "lazer", "combo"])
create("Skill", "Marathon Madness", "Submit a score with at least 4000 combo", tags=["combo", "consistency"])
create("Skill", "Feel The Rhythm", "SS a 5*+ map with at least 1,400 combo. Must be 5*+ when no mods are applied.", tags=["accuracy", "pfc"])
create("Skill", "Don't Believe You're Completing This", "PFC this map with (HD)DT", tags=["pfc", "mechanics"], beatmap_id=3435831)
create("Skill", "Not Quite A PFC", "PFC this map with NM or HD", tags=["technical", "pfc"], beatmap_id=4462578)
create("Knowledge", "omq", "Submit a score on the mapset this audio preview is from", audio="omq.mp3", tags=["audio"])
create("Skill", "To The Top", "Pass the highest star rating ranked map using lazer's No Scope mod (no additional mods).", tags=["lazer", "competition", "pass"])
