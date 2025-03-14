import { AchievementCommentType } from "api/types/AchievementCommentType.ts";

type AchievementCommentProps = {
  comment: AchievementCommentType;
};

export default function AchievementComment(props: AchievementCommentProps) {
  const comment = props.comment;

  return (
    <div className="staff__achievement__comment">
      <div className="staff__achievement__comment__user">
        <div>
          <div
            style={{ backgroundImage: `url(${comment.user.avatar})` }}
            className="staff__achievement__comment__user__avatar"
          />
        </div>
        <div className="staff__achievement__comment__user__details">
          <p>{comment.user.username}</p>
          <p className="staff__achievement__comment__user__details__title">
            {comment.user.is_admin ? "Admin" : "Mastermind"}
          </p>
        </div>
      </div>
      <div className="staff__achievement__comment__divider"></div>
      <div className="staff__achievement__comment__content">{comment.msg}</div>
    </div>
  );
}
