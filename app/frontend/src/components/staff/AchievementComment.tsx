import { AchievementCommentType } from "api/types/AchievementCommentType.ts";
import { timeAgo } from "util/helperFunctions.ts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ActionMenu, { ActionInfo } from "components/common/ActionMenu.tsx";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useCallback, useContext, useState } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import { useDeleteComment, useEditComment } from "api/query.ts";
import TextArea from "components/inputs/TextArea.tsx";
import classNames from "classnames";
import { EventContext } from "contexts/EventContext.ts";

type AchievementCommentProps = {
  comment: AchievementCommentType;
};

export default function AchievementComment(props: AchievementCommentProps) {
  const session = useContext(SessionContext);
  const comment = props.comment;

  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedMsg, setEditedMsg] = useState(comment.msg);
  const [isEditing, setIsEditing] = useState(false);

  const commentDeletion = useDeleteComment(comment.id);
  const commentSaving = useEditComment(comment.id);

  const deleteComment = useCallback(() => {
    if (deleting) {
      return;
    }

    setDeleting(true);

    commentDeletion.mutate(
      {},
      {
        onSettled: () => setDeleting(false),
      },
    );
  }, [deleting, setDeleting, commentDeletion]);

  const saveEdit = useCallback(() => {
    if (saving) {
      return;
    }

    setSaving(true);

    commentSaving.mutate(
      { msg: editedMsg },
      {
        onSettled: () => setSaving(false),
        onSuccess: () => setIsEditing(false),
      },
    );
  }, [saving, setSaving, setIsEditing, commentSaving, editedMsg]);

  const actionMenuInfo: ActionInfo[] = [
    {
      type: "button",
      label: "Edit",
      icon: FaEdit,
      onClick: () => setIsEditing(true),
      unavailable: deleting,
    },
    {
      type: "button",
      label: "Delete",
      icon: MdDelete,
      onClick: deleteComment,
      holdToUse: true,
      caution: true,
      unavailable: deleting,
    },
  ];

  const commentFooterCls = classNames(
    "staff__achievement__comment__footer-text action",
    { hide: !isEditing },
  );

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
      <div className="staff__achievement__comment__content">
        <p className={isEditing ? "hide" : ""}>
          <Markdown remarkPlugins={[remarkGfm]}>{comment.msg}</Markdown>
        </p>
        <TextArea
          className="staff__textarea"
          value={editedMsg}
          setValue={setEditedMsg}
          hidden={!isEditing}
        />
        <div className="staff__achievement__comment__content__footer">
          <p className="staff__achievement__comment__footer-text">
            {timeAgo(comment.posted_at) +
              (comment.edited_at === null ? "" : " (edited)")}
          </p>
          <p className={commentFooterCls} onClick={saveEdit}>
            Save
          </p>
          <p className={commentFooterCls} onClick={() => setIsEditing(false)}>
            Cancel
          </p>
        </div>
        {session.user!.id === comment.user.id ? (
          <ActionMenu key={comment.id} iconSize={18} info={actionMenuInfo} />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
