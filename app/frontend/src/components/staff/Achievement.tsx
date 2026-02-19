import { StaffAchievementType } from "api/types/AchievementType.ts";
import { BiSolidUpArrow, BiUpArrow } from "react-icons/bi";
import {
  useDeleteAchievement,
  useGetBatches,
  useMoveAchievement,
  useSendComment,
  useVoteAchievement,
} from "api/query.ts";
import Button from "components/inputs/Button.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import React, { useContext, useState } from "react";
import AchievementComment from "components/staff/AchievementComment.tsx";
import { SessionContext } from "contexts/SessionContext.ts";
import classNames from "classnames";
import { parseTags } from "util/helperFunctions.ts";
import RenderedText from "components/common/RenderedText.tsx";
import { PopupContext } from "contexts/PopupContext.ts";
import { EventContext } from "contexts/EventContext.ts";

function VoteContainer({ achievement }: { achievement: StaffAchievementType }) {
  const session = useContext(SessionContext);

  const vote = useVoteAchievement(achievement.id);
  const isCreator =
    achievement.creator !== null && achievement.creator.id === session.user!.id;

  const onClick = () => {
    vote.mutate(
      { add: !achievement.has_voted },
      {
        onSettled: () => vote.reset(),
      },
    );
  };

  return (
    <div
      className={classNames("staff__achievement__footer__vote-container", {
        disabled: isCreator,
      })}
      onClick={isCreator ? undefined : onClick}
    >
      {achievement.vote_count}
      {achievement.has_voted || isCreator ? <BiSolidUpArrow /> : <BiUpArrow />}
    </div>
  );
}

type AchievementProps = {
  achievement: StaffAchievementType;
  setView: (value: any) => void;
};

export default function Achievement(props: AchievementProps) {
  const achievement = props.achievement;
  const achievementUrl = `https://${window.location.host}/staff/achievements/${achievement.id}`;

  const session = useContext(SessionContext);
  const popupCtx = useContext(PopupContext)!;
  const dispatchEventMsg = useContext(EventContext);

  const [isCommenting, setIsCommenting] = useState(false);
  const [canSendComment, setCanSendComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sendComment = useSendComment(achievement.id);
  const deleteAchievement = useDeleteAchievement(achievement.id);
  const moveAchievement = useMoveAchievement(achievement.id);
  const { data: batches, isLoading: batchesLoading } = useGetBatches(
    session.user!.is_admin,
  );

  const canEdit =
    achievement.creator !== null &&
    (achievement.creator.id == session.user!.id || session.user!.is_admin);

  const onCommentStart = () => {
    setIsCommenting(true);
  };

  const onCommentCancel = () => {
    setIsCommenting(false);
  };

  const isCommentTextValid = (text: string) => {
    return text.trim().length !== 0;
  };

  const onSendComment = () => {
    if (sendingComment) {
      return;
    }

    setSendingComment(true);

    if (!isCommentTextValid(commentText)) {
      return;
    }

    sendComment.mutate(
      { msg: commentText },
      {
        onSuccess: () => {
          onCommentCancel();
          setCommentText("");
        },
        onSettled: () => {
          setSendingComment(false);
        },
      },
    );
  };

  const onCommentInput = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log(evt.target.value);
    const isValid = isCommentTextValid(evt.target.value);
    if (isValid && !canSendComment) {
      setCanSendComment(true);
    } else if (!isValid && canSendComment) {
      setCanSendComment(false);
    }
  };

  const onDeleteAchievement = () => {
    if (deleting) {
      return;
    }

    setDeleting(true);

    deleteAchievement.mutate(
      {},
      {
        onSettled: () => {
          setDeleting(false);
        },
      },
    );
  };

  const doMoveToBatch = (batchId: number) => {
    moveAchievement.mutate(
      { batch_id: batchId },
      {
        onSettled: () => {
          moveAchievement.reset();
          popupCtx.setPopup(null);
        },
      },
    );
  };

  const doMoveAchievement = () => {
    let content;
    if (batchesLoading) {
      content = <h1>Loading...</h1>;
    } else if (batches === undefined) {
      content = <h1>Failed to load</h1>;
    } else {
      const unreleasedBatches = batches.filter(
        (b) => Date.parse(b.release_time) > Date.now(),
      );
      content = (
        <div className="staff-batch-move-container">
          {unreleasedBatches
            .sort(
              (a, b) => Date.parse(a.release_time) - Date.parse(b.release_time),
            )
            .map((batch, i) => (
              <Button
                children={`Batch ${i + 1 + batches.length - unreleasedBatches.length}`}
                onClick={() => doMoveToBatch(batch.id)}
              />
            ))}
        </div>
      );
    }

    popupCtx.setPopup({
      title: "Batches",
      content,
    });
  };

  const copyAchievementUrl = () => {
    navigator.clipboard.writeText(achievementUrl);
    dispatchEventMsg({ type: "info", msg: "Copied!" });
  };

  return (
    <div>
      <div className="staff__achievement">
        <p className="staff__achievement__name">{achievement.name}</p>
        <p>
          <RenderedText text={achievement.description} />
        </p>
        <p className="staff__achievement__solution">
          <RenderedText text={achievement.solution} />
        </p>
        {achievement.beatmaps.map((beatmap) => (
          <a
            className={classNames("staff__achievement__beatmap", {
              red: beatmap.hide,
            })}
            href={`https://osu.ppy.sh/b/${beatmap.info.id}`}
            target="_blank"
          >
            <div
              className="staff__achievement__beatmap__cover"
              style={{ backgroundImage: `url(${beatmap.info.cover})` }}
            ></div>
            <div className="staff__achievement__beatmap__info">
              <p className="staff__achievement__beatmap__info__title">
                {beatmap.info.artist} - {beatmap.info.title}
              </p>
              <p className="staff__achievement__beatmap__info__version">
                [{beatmap.info.version}]
              </p>
            </div>
            <p className="staff__achievement__beatmap__star-rating">
              {Math.round(beatmap.info.star_rating * 100) / 100}*
            </p>
          </a>
        ))}
        <div className="staff__achievement__footer">
          <VoteContainer achievement={achievement} />
          {parseTags(achievement.tags).map((tag) => (
            <div className="staff__achievement__footer__tag">{tag}</div>
          ))}
        </div>
        {achievement.creator === null ? (
          ""
        ) : (
          <p className="staff__achievement__creator">
            Submitted by {achievement.creator.username}
          </p>
        )}
      </div>
      <div className="staff__achievement__comment-container">
        {achievement.comments
          .sort((a, b) => Date.parse(a.posted_at) - Date.parse(b.posted_at))
          .map((comment, i) => (
            <AchievementComment key={i} comment={comment} />
          ))}
        <TextArea
          className="staff__textarea"
          name="msg"
          placeholder="Type comment here"
          hidden={!isCommenting}
          onChange={onCommentInput}
          value={commentText}
          setValue={setCommentText}
        />
        <div className="staff__achievement__comment-container__row">
          <Button
            children="Delete"
            hidden={!canEdit}
            unavailable={deleting}
            onClick={onDeleteAchievement}
            holdToUse={true}
          />
          <Button
            children="Edit"
            hidden={!canEdit}
            onClick={() =>
              props.setView({
                name: "creation",
                props: { achievement: achievement },
              })
            }
          />
          <Button
            children="Comment"
            onClick={onCommentStart}
            hidden={isCommenting}
          />
          <Button
            children="Send"
            onClick={onSendComment}
            hidden={!isCommenting}
            unavailable={!canSendComment || sendingComment}
          />
          <Button
            children="Cancel"
            onClick={onCommentCancel}
            hidden={!isCommenting || sendingComment}
          />
          <Button
            children="Move"
            onClick={doMoveAchievement}
            hidden={!session.user?.is_admin}
          />
          <Button children="Copy URL" onClick={copyAchievementUrl} />
        </div>
      </div>
    </div>
  );
}
