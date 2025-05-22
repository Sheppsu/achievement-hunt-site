import { BsPeopleFill, BsPlusCircleFill } from "react-icons/bs";
import React, { FormEvent, useContext, useState } from "react";
import Button from "components/inputs/Button.tsx";
import { MdArrowBack } from "react-icons/md";
import Dropdown from "components/inputs/Dropdown.tsx";
import { IoWarning } from "react-icons/io5";
import { useCreateTeam, useJoinTeam } from "api/query.ts";
import { EventContext } from "contexts/EventContext.ts";
import { PopupContext, PopupContextType } from "contexts/PopupContext.ts";

export default function NoTeamCard() {
  const [currentTab, setCurrentTab] = useState<"create" | "join" | "default">(
    "default",
  );

  return (
    <div className="card fill">
      <div className="card--teams__header">
        <h1>No team</h1>
      </div>
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
  const { setPopup } = useContext(PopupContext) as PopupContextType;

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
        onSuccess: () => createTeam.reset(),
      },
    );

    dispatchEventMsg({
      type: "info",
      msg: `Team '${name}' successfully created!`,
    });

    setPopup(null);
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
  const joinTeam = useJoinTeam();
  const { setPopup } = useContext(PopupContext) as PopupContextType;

  const onJoinTeam = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const invite = new FormData(evt.currentTarget).get("invite") as string;
    if (invite === "") {
      return dispatchEventMsg({
        type: "error",
        msg: "Input an invite code first",
      });
    }

    joinTeam.mutate(
      { invite },
      {
        onSuccess: () => joinTeam.reset(),
      },
    );

    setPopup(null);
  };

  return (
    <>
      <div className="card--teams__header">
        <button onClick={() => setCurrentTab("default")}>
          <MdArrowBack size={24} color="white" />
        </button>
        <h1>Enter Code</h1>
      </div>
      <form className="card--teams__form fill" onSubmit={onJoinTeam}>
        <div className="card--teams__form__item">
          <p className="card--teams__label">Team Name</p>
          <input
            type="text"
            name="invite"
            placeholder="Enter invite code here..."
          />
          <Button children="Join Team" type="submit" />
        </div>
      </form>
      <div className="card--teams__form__item">
        <p className="card--teams__label">Looking for Team</p>
        <Button children="Mark as LFT" /> {/* TODO: Change to switch input */}
        <p className="card--teams__description">
          Mark yourself as looking for a team. Team owners will be able to
          invite random players in the LFT list, and once you accept you'll join
          the team. If you don't find a team by the end of registration, we'll
          put you in a team with other LFT players.
        </p>
      </div>
      <div className="card--teams__invites">
        <p className="card--teams__label">Invites</p>
        <div className="card--teams__invites__container">
          <div className="card--teams__invites__container__item">
            <p>Team Name</p>
            <div className="card--teams__invites__container__item__actions">
              <p>Accept</p>
              <p>Decline</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
