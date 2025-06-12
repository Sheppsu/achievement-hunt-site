import {
  useChangeFreeAgent,
  useCreateTeam,
  useGetUserInvites,
  useResolveInvite,
} from "api/query.ts";
import { UserInviteType } from "api/types/InviteType.ts";
import { RegistrationType } from "api/types/RegistrationType.ts";
import Button from "components/inputs/Button.tsx";
import Dropdown from "components/inputs/Dropdown.tsx";
import { EventContext } from "contexts/EventContext.ts";
import { FormEvent, useContext, useState } from "react";
import { BsPlusCircleFill } from "react-icons/bs";
import { IoWarning } from "react-icons/io5";
import { MdArrowBack } from "react-icons/md";
import { randomChoice } from "util/helperFunctions.ts";

export default function NoTeamCard({
  registration,
}: {
  registration: RegistrationType;
}) {
  const [currentTab, setCurrentTab] = useState<"create" | "default">("default");
  const [debounce, setDebounce] = useState(false);

  const changeFreeAgent = useChangeFreeAgent();

  function doChangeFreeAgent() {
    if (debounce) {
      return;
    }

    setDebounce(true);
    changeFreeAgent.mutate(
      { free_agent: !registration.is_free_agent },
      {
        onSettled: () => {
          setDebounce(false);
        },
      },
    );
  }

  return (
    <div className="card">
      <h1 className="card__title">No team</h1>
      {currentTab === "default" ? (
        <>
          <div className="card--teams__row">
            <BsPlusCircleFill size={75} />
            <Button
              children="Create a Team"
              onClick={() => setCurrentTab("create")}
            />
          </div>
          <div className="horizontal-divider"></div>
          <h1 className="card__title">Invites</h1>
          <JoinTeamComponent />
          <div className="horizontal-divider" />
          <div className="card--teams__row">
            <p className="card--teams__description">
              If you are not on a team when the event starts, you will be
              automatically placed on a team. You have the option to opt out of
              this, but will not be able to participate unless you find a team
              before then.
            </p>
            <Button
              className="team-rigid-btn"
              children={registration.is_free_agent ? "Opt out" : "Opt in"}
              unavailable={debounce}
              onClick={doChangeFreeAgent}
            />
          </div>
        </>
      ) : (
        <CreateTeamComponent setCurrentTab={setCurrentTab} />
      )}
    </div>
  );
}

function CreateTeamComponent({
  setCurrentTab,
}: {
  setCurrentTab: (tab: "create" | "default") => void;
}) {
  const dispatchEventMsg = useContext(EventContext);
  const createTeam = useCreateTeam();

  const [nameAdjective, setNameAdjective] = useState(
    randomChoice(anonNameAdjectives),
  );
  const [nameNoun, setNameNoun] = useState(randomChoice(anonNameNouns));

  const onCreateTeam = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const name = new FormData(evt.currentTarget).get("prompt-value") as string;
    if (name.length < 1 || name.length > 32) {
      return dispatchEventMsg({
        type: "error",
        msg: "Team name must be between 1 and 32 characters",
      });
    }

    createTeam.mutate(
      { name, anonymous_name: nameAdjective + " " + nameNoun },
      {
        onSuccess: () => {
          dispatchEventMsg({
            type: "info",
            msg: `Team '${name}' successfully created!`,
          });
        },
        onSettled: () => {
          createTeam.reset();
        },
      },
    );
  };

  return (
    <>
      <div className="card--teams__header">
        <button onClick={() => setCurrentTab("default")}>
          <MdArrowBack size={24} color="white" />
        </button>
        <h1>Create Team</h1>
      </div>
      <form className="card--teams__form" onSubmit={onCreateTeam}>
        <div>
          <div className="card--teams__form__item">
            <p className="card--teams__label">Team Name</p>
            <input
              type="text"
              name="prompt-value"
              placeholder="Enter team name here..."
            />
            <p className="card--teams__description">
              This will be hidden from other teams during the tournament to keep
              anonymity
            </p>
          </div>
          <div className="card--teams__form__item">
            <p className="card--teams__label">Anonymous Team Name</p>
            <div className="card--teams__form__item__row">
              <Dropdown
                options={Object.fromEntries(
                  anonNameAdjectives.map((word) => [word, word]),
                )}
                value={nameAdjective}
                onChange={(e) => setNameAdjective(e.currentTarget.value)}
              />
              <Dropdown
                options={Object.fromEntries(
                  anonNameNouns.map((word) => [word, word]),
                )}
                value={nameNoun}
                onChange={(e) => setNameNoun(e.currentTarget.value)}
              />
            </div>
            <p className="card--teams__description">
              This will be what other teams see throughout the tournament
            </p>
          </div>
        </div>
        <div className="card--teams__form__bottom-container">
          <div className="warning-box">
            <div className="warning-box__heading">
              <IoWarning size={35} color="#C2A800" />
              <h1>WARNING</h1>
            </div>
            <p className="warning-box__content">
              <span style={{ fontWeight: 600 }}>DO NOT</span> let others know
              what team you're on, or who your teammates are. We cannot
              completely prevent people from profile stalking to get solutions
              to achievements, so anonymity is your best defense against it.
            </p>
          </div>
          <Button children="Create Team" type="submit" />
        </div>
      </form>
    </>
  );
}

function JoinTeamComponent() {
  const dispatchEventMsg = useContext(EventContext);
  const { data: invites, isLoading: invitesLoading } = useGetUserInvites();

  let inviteElements;
  if (invitesLoading) {
    inviteElements = <h1>Loading...</h1>;
  } else if (invites === undefined) {
    inviteElements = <h1>Failed to load</h1>;
  } else if (invites.length === 0) {
    inviteElements = <h1>No invites</h1>;
  } else {
    inviteElements = invites.map((invite) => (
      <TeamInviteItem key={invite.id} invite={invite} />
    ));
  }

  return (
    <>
      <div className="card--teams__invites">
        <div className="card--teams__invites__item">{inviteElements}</div>
      </div>
    </>
  );
}

function TeamInviteItem({ invite }: { invite: UserInviteType }) {
  const resolveInvite = useResolveInvite(invite.id);
  const [debounce, setDebounce] = useState(false);

  function doResolveInvite(accept: boolean) {
    if (debounce) {
      return;
    }

    setDebounce(true);

    resolveInvite.mutate(
      { accept },
      {
        onSettled: () => {
          setDebounce(false);
          resolveInvite.reset();
        },
      },
    );
  }

  return (
    <div className="card--teams__invites__item">
      <p>{invite.team_name}</p>
      <div className="card--teams__invites__item__actions">
        <Button
          children="Accept"
          onClick={() => doResolveInvite(true)}
          unavailable={debounce}
        />
        <Button
          children="Decline"
          onClick={() => doResolveInvite(false)}
          unavailable={debounce}
        />
      </div>
    </div>
  );
}

const anonNameAdjectives = [
  "Wobbly",
  "Fluffy",
  "Bouncy",
  "Giggly",
  "Soggy",
  "Lumpy",
  "Jiggly",
  "Snazzy",
  "Cranky",
  "Zany",
  "Goofy",
  "Wacky",
  "Squishy",
  "Sassy",
  "Dizzy",
  "Itchy",
  "Clumsy",
  "Slippery",
  "Sneaky",
  "Grumpy",
  "Nifty",
  "Silky",
  "Sparkly",
  "Funky",
  "Smelly",
  "Puffy",
  "Snappy",
  "Pokey",
  "Skippy",
  "Gummy",
  "Tipsy",
  "Noisy",
  "Spicy",
  "Nutty",
  "Lanky",
  "Peppy",
  "Yappy",
  "Sleepy",
  "Chirpy",
  "Sniffy",
  "Toasty",
  "Zesty",
  "Breezy",
  "Bubbly",
  "Slinky",
  "Jumpy",
  "Crusty",
  "Wiggly",
  "Brassy",
  "Chatty",
  "Meaty",
  "Quirky",
  "Greasy",
  "Cheesy",
  "Soggy",
  "Drowsy",
  "Grubby",
  "Mothy",
  "Blobby",
  "Shaggy",
  "Noodly",
  "Boogery",
  "Gassy",
  "Snotty",
  "Snarky",
  "Shrimpy",
  "Tippy",
  "Stinky",
  "Dorky",
  "Scurvy",
  "Twangy",
  "Whoopee",
  "Zippy",
  "Puffy",
  "Chunky",
  "Blustery",
  "Puny",
  "Spooky",
  "Moochy",
  "Squirmy",
  "Ducky",
  "Rusty",
  "Warty",
  "Wiggly",
  "Frizzy",
  "Sloppy",
  "Crumbly",
  "Groovy",
  "Ditsy",
  "Witty",
  "Quacky",
  "Burpy",
  "Sweaty",
  "Raspy",
  "Yucky",
  "Waily",
  "Dippy",
  "Whiny",
  "Brawny",
  "Chirpy",
];
const anonNameNouns = [
  "Pickles",
  "Bananas",
  "Ferrets",
  "Noodles",
  "Pigeons",
  "Muffins",
  "Wombats",
  "Unicorns",
  "Spatulas",
  "Cupcakes",
  "Tacos",
  "Chickens",
  "Lemurs",
  "Sausages",
  "Narwhals",
  "Giraffes",
  "Potatoes",
  "Platypuses",
  "Llamas",
  "Meerkats",
  "Turnips",
  "Donuts",
  "Weasels",
  "Blenders",
  "Goblins",
  "Marshmallows",
  "Dodos",
  "Walruses",
  "Hamsters",
  "Puddings",
  "Trolls",
  "Octopi",
  "Boogers",
  "Fuzzballs",
  "Bagels",
  "Gnomes",
  "Picklejars",
  "Ogres",
  "Crayons",
  "Snails",
  "Penguins",
  "Gumballs",
  "Trombones",
  "Marshes",
  "Jellies",
  "Zombies",
  "Poptarts",
  "Burritos",
  "Flapjacks",
  "Lintballs",
  "Dingbats",
  "Frogs",
  "Cupboards",
  "Chimichangas",
  "Yaks",
  "Owls",
  "Teacups",
  "Hippos",
  "Spoons",
  "Niblets",
  "Kiwis",
  "Mopheads",
  "Parrots",
  "Lobsters",
  "Baboons",
  "Waffles",
  "Hornets",
  "Trousers",
  "Jellybeans",
  "Toasters",
  "Monkeys",
  "Sardines",
  "Chickpeas",
  "Beets",
  "Flippers",
  "Sprinkles",
  "Pickaxes",
  "Balloons",
  "Platters",
  "Slinkies",
  "Farts",
  "Coconuts",
  "Acorns",
  "Trombones",
  "Whiskers",
  "Pigeons",
  "Drumsticks",
  "Cabbages",
  "Doodles",
  "Butternuts",
  "Eggplants",
  "Nuggets",
  "Raccoons",
  "Pajamas",
  "Tiaras",
  "Turtles",
  "Anchovies",
  "Gurgles",
  "Pompoms",
  "Zucchinis",
];
