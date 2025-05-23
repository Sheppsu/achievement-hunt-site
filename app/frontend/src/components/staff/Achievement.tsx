import { StaffAchievementType } from "api/types/AchievementType.ts";
import { BiSolidUpArrow, BiUpArrow } from "react-icons/bi";
import {
  useDeleteAchievement,
  useSendComment,
  useVoteAchievement,
} from "api/query.ts";
import Button from "components/inputs/Button.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import React, { useContext, useState } from "react";
import AchievementComment from "components/staff/AchievementComment.tsx";
import { SessionContext } from "contexts/SessionContext.ts";
import AchievementCreation from "components/staff/AchievementCreation.tsx";
import classNames from "classnames";
import { parseTags } from "util/helperFunctions.ts";
import RenderedText from "components/common/RenderedText.tsx";

function VoteContainer({ achievement }: { achievement: StaffAchievementType }) {
  const session = useContext(SessionContext);

  const vote = useVoteAchievement(achievement.id);
  const isCreator =
    achievement.creator !== null && achievement.creator.id === session.user!.id;

  const onClick = () => {
    vote.mutate(
      { add: !achievement.has_voted },
      {
        onSuccess: () => vote.reset(),
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
};

export default function Achievement(props: AchievementProps) {
  const achievement = props.achievement;

  const session = useContext(SessionContext);

  const [isCommenting, setIsCommenting] = useState(false);
  const [canSendComment, setCanSendComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const sendComment = useSendComment(achievement.id);
  const deleteAchievement = useDeleteAchievement(achievement.id);

  const onCommentStart = () => {
    setIsCommenting(true);
  };

  const onCommentCancel = () => {
    setIsCommenting(false);
  };

  const onStartEdit = () => {
    setEditing(true);
  };

  const onCancelEdit = () => {
    setEditing(false);
  };

  const isCommentTextValid = () => {
    return commentText.trim().length !== 0;
  };

  const onSendComment = () => {
    if (sendingComment) {
      return;
    }

    setSendingComment(true);

    if (!isCommentTextValid()) {
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

  const onCommentInput = () => {
    const isValid = isCommentTextValid();
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

  return (
    <div>
      <div className={classNames("staff__achievement", { hide: editing })}>
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
              {beatmap.info.star_rating}*
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
      <AchievementCreation
        hidden={!editing}
        onCancelCreation={onCancelEdit}
        submitText="Save"
        achievement={achievement}
      />
      <div className="staff__achievement__comment-container">
        {achievement.comments.map((comment, i) => (
          <AchievementComment key={i} comment={comment} />
        ))}
        <TextArea
          className="staff__textarea"
          name="msg"
          placeholder="Type comment here"
          hidden={!isCommenting}
          onInput={onCommentInput}
          onChange={(e: React.FormEvent<HTMLTextAreaElement>) =>
            setCommentText(e.currentTarget.value)
          }
          value={commentText}
        />
        <div className="staff__achievement__comment-container__row">
          <Button
            children="Delete"
            hidden={
              achievement.creator === null ||
              achievement.creator.id !== session.user!.id
            }
            unavailable={deleting}
            onClick={onDeleteAchievement}
            holdToUse={true}
          />
          <Button
            children="Edit"
            hidden={
              achievement.creator === null ||
              achievement.creator.id !== session.user!.id ||
              editing
            }
            onClick={onStartEdit}
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
        </div>
      </div>
    </div>
  );
}
