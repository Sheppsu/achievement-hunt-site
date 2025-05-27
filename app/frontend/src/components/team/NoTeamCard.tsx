import { BsPeopleFill, BsPlusCircleFill } from "react-icons/bs";
import React, { FormEvent, useContext, useState } from "react";
import Button from "components/inputs/Button.tsx";
import { MdArrowBack } from "react-icons/md";
import Dropdown from "components/inputs/Dropdown.tsx";
import { IoWarning } from "react-icons/io5";
import {
  useChangeFreeAgent,
  useCreateTeam,
  useGetUserInvites,
  useResolveInvite,
} from "api/query.ts";
import { EventContext } from "contexts/EventContext.ts";
import { RegistrationType } from "api/types/RegistrationType.ts";
import { UserInviteType } from "api/types/InviteType.ts";

export default function NoTeamCard({
  registration,
}: {
  registration: RegistrationType;
}) {
  const [currentTab, setCurrentTab] = useState<"create" | "join" | "default">(
    "default",
  );
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
          <div className="card--teams__row">
            <BsPeopleFill size={100} />
            <Button
              children="Join a Team"
              onClick={() => setCurrentTab("join")}
            />
          </div>
          <div className="horizontal-divider"></div>
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
      ) : currentTab === "create" ? (
        <CreateTeamComponent setCurrentTab={setCurrentTab} />
      ) : (
        <JoinTeamComponent setCurrentTab={setCurrentTab} />
      )}
    </div>
  );
}

function CreateTeamComponent({
  setCurrentTab,
}: {
  setCurrentTab: (tab: "create" | "join" | "default") => void;
}) {
  const dispatchEventMsg = useContext(EventContext);
  const createTeam = useCreateTeam();

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
      { name },
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
                options={{
                  test: "test",
                  test2: "test2",
                  test3: "test3",
                  test4: "test4",
                  test5: "test5",
                  test6: "test6",
                  test7: "test7",
                  test8: "test8",
                }}
              />
              <Dropdown
                options={{
                  test: "test",
                  test2: "test2",
                  test3: "test3",
                  test4: "test4",
                  test5: "test5",
                  test6: "test6",
                  test7: "test7",
                  test8: "test8",
                }}
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
              to achievements, so anonymity is your best defense against it. DM
              a staff member if you suspect that someone is profile stalking
              (this is against the rules).
            </p>
          </div>
          <Button children="Create Team" type="submit" />
        </div>
      </form>
    </>
  );
}

function JoinTeamComponent({
  setCurrentTab,
}: {
  setCurrentTab: (tab: "create" | "join" | "default") => void;
}) {
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
      <div className="card--teams__header">
        <button onClick={() => setCurrentTab("default")}>
          <MdArrowBack size={24} color="white" />
        </button>
        <h1>Invites</h1>
      </div>
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
