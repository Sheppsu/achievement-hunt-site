import { StaffAchievementType } from "api/types/AchievementType.ts";
import { BiSolidUpArrow, BiUpArrow } from "react-icons/bi";
import { useSendComment, useVoteAchievement } from "api/query.ts";
import Button from "components/inputs/Button.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import React, { useState } from "react";
import AchievementComment from "components/staff/AchievementComment.tsx";

function VoteContainer({ achievement }: { achievement: StaffAchievementType }) {
  const vote = useVoteAchievement(achievement.id);

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
      className="staff__achievement__footer__vote-container"
      onClick={onClick}
    >
      {achievement.vote_count}
      {achievement.has_voted ? <BiSolidUpArrow /> : <BiUpArrow />}
    </div>
  );
}

type AchievementProps = {
  achievement: StaffAchievementType;
};

export default function Achievement(props: AchievementProps) {
  const achievement = props.achievement;

  const [isCommenting, setIsCommenting] = useState(false);
  const [canSendComment, setCanSendComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const sendComment = useSendComment(achievement.id);

  const onCommentStart = () => {
    setIsCommenting(true);
  };

  const onCommentCancel = () => {
    setIsCommenting(false);
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

  return (
    <div>
      <div className="staff__achievement">
        <p className="staff__achievement__name">{achievement.name}</p>
        <p>{achievement.description}</p>
        <p className="staff__achievement__solution">{achievement.solution}</p>
        <div className="staff__achievement__footer">
          <VoteContainer achievement={achievement} />
          {achievement.tags.split(",").map((tag) => (
            <div className="staff__achievement__footer__tag">{tag}</div>
          ))}
        </div>
      </div>
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
