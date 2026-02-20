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
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AchievementComment from "components/staff/AchievementComment.tsx";
import { SessionContext } from "contexts/SessionContext.ts";
import classNames from "classnames";
import { parseTags } from "util/helperFunctions.ts";
import RenderedText from "components/common/RenderedText.tsx";
import { PopupContext } from "contexts/PopupContext.ts";
import { EventContext } from "contexts/EventContext.ts";
import {
  IoIosArrowDropup,
  IoIosCopy,
  IoIosExit,
  IoIosMore,
  IoIosSend,
} from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { FaComment } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import ViewSwitcher from "components/common/ViewSwitcher.tsx";

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

const COMMENT_VIEWS = ["General", "Solving"] as const;
type CommentView = (typeof COMMENT_VIEWS)[number];

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
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [commentView, setCommentView] = useState<CommentView>("General");

  const sendComment = useSendComment(achievement.id);
  const deleteAchievement = useDeleteAchievement(achievement.id);
  const moveAchievement = useMoveAchievement(achievement.id);
  const { data: batches, isLoading: batchesLoading } = useGetBatches(
    session.user!.is_admin,
  );

  const canEdit =
    achievement.creator !== null &&
    (achievement.creator.id == session.user!.id || session.user!.is_admin);

  const commentChannel = COMMENT_VIEWS.indexOf(commentView);
  const filteredComments = useMemo(
    () =>
      achievement.comments.filter(
        (comment) => comment.channel == commentChannel,
      ),
    [achievement.comments, commentChannel],
  );

  const actionMenuBtnRef = useRef<HTMLDivElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // close actions menu when clicking off it
  useEffect(() => {
    function onClick(evt: MouseEvent | TouchEvent) {
      if (
        actionMenuOpen &&
        actionMenuRef.current &&
        !actionMenuRef.current.contains(evt.target as Node) &&
        actionMenuBtnRef.current &&
        !actionMenuBtnRef.current.contains(evt.target as Node)
      ) {
        setActionMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchend", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchend", onClick);
    };
  }, [setActionMenuOpen, actionMenuOpen]);

  const onCommentStart = useCallback(() => {
    setIsCommenting(true);
  }, [setIsCommenting]);

  const onCommentCancel = useCallback(() => {
    setIsCommenting(false);
  }, [setIsCommenting]);

  const isCommentTextValid = useCallback((text: string) => {
    return text.trim().length !== 0;
  }, []);

  const onSendComment = useCallback(() => {
    if (sendingComment) {
      return;
    }

    setSendingComment(true);

    if (!isCommentTextValid(commentText)) {
      return;
    }

    const channel = COMMENT_VIEWS.indexOf(commentView);
    sendComment.mutate(
      { msg: commentText, channel },
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
  }, [
    sendingComment,
    setSendingComment,
    sendComment,
    isCommentTextValid,
    commentText,
    setCommentText,
    onCommentCancel,
  ]);

  const onCommentInput = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      const isValid = isCommentTextValid(evt.target.value);
      if (isValid && !canSendComment) {
        setCanSendComment(true);
      } else if (!isValid && canSendComment) {
        setCanSendComment(false);
      }
    },
    [isCommentTextValid, canSendComment, setCanSendComment],
  );

  const onDeleteAchievement = useCallback(() => {
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
  }, [deleting, setDeleting, deleteAchievement]);

  const doMoveToBatch = useCallback(
    (batchId: number) => {
      moveAchievement.mutate(
        { batch_id: batchId },
        {
          onSettled: () => {
            moveAchievement.reset();
            popupCtx.setPopup(null);
          },
        },
      );
    },
    [moveAchievement, popupCtx],
  );

  const doMoveAchievement = useCallback(() => {
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
  }, [batchesLoading, batches, doMoveToBatch, popupCtx]);

  const copyAchievementUrl = useCallback(() => {
    navigator.clipboard.writeText(achievementUrl).then(
      () => {
        dispatchEventMsg({ type: "info", msg: "Copied!" });
      },
      () => {
        dispatchEventMsg({
          type: "error",
          msg: "Failed to copy to clipboard...",
        });
      },
    );
  }, [achievementUrl]);

  return (
    <div>
      <div className="staff__achievement">
        <div
          className="staff__achievement__actions-button"
          onClick={() => setActionMenuOpen((val) => !val)}
          ref={actionMenuBtnRef}
        >
          <IoIosMore size={24} />
        </div>
        <div
          className={classNames("staff__achievement__actions-menu", {
            hidden: !actionMenuOpen,
          })}
          ref={actionMenuRef}
        >
          <Button
            children={
              <>
                <IoIosCopy size={20} />
                <p className="staff__actions-menu__label">Copy URL</p>
              </>
            }
            className="staff__actions-menu__action"
            width="100%"
            onClick={copyAchievementUrl}
            hidden={isCommenting}
            includeButtonCls={false}
          />
          <Button
            children={
              <>
                <FaEdit size={20} />
                <p className="staff__actions-menu__label">Edit</p>
              </>
            }
            className="staff__actions-menu__action"
            width="100%"
            hidden={!canEdit || isCommenting}
            onClick={() =>
              props.setView({
                name: "creation",
                props: { achievement: achievement },
              })
            }
            includeButtonCls={false}
          />
          <Button
            children={
              <>
                <IoIosArrowDropup size={20} />
                <p className="staff__actions-menu__label">Move</p>
              </>
            }
            className="staff__actions-menu__action"
            width="100%"
            onClick={doMoveAchievement}
            hidden={!session.user?.is_admin || isCommenting}
            includeButtonCls={false}
          />
          <hr className="staff__actions-menu__divider" />
          <Button
            children={
              <>
                <MdDelete size={20} />
                <p className="staff__actions-menu__label">Delete</p>
              </>
            }
            className="staff__actions-menu__action hazard"
            width="100%"
            hidden={!canEdit || isCommenting}
            unavailable={deleting}
            onClick={onDeleteAchievement}
            holdToUse={true}
            includeButtonCls={false}
            caution={true}
          />
        </div>
        <p className="staff__achievement__name">{achievement.name}</p>
        <p>
          <RenderedText text={achievement.description} />
        </p>
        {/*<p className="staff__achievement__solution">*/}
        {/*  <RenderedText text={achievement.solution} />*/}
        {/*</p>*/}
        {achievement.beatmaps
          .filter((beatmap) => !beatmap.hide)
          .map((beatmap) => (
            <a
              className={classNames("staff__achievement__beatmap")}
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
        <ViewSwitcher
          views={COMMENT_VIEWS}
          currentView={commentView}
          setView={setCommentView}
        />
        {filteredComments
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
            children={
              <>
                <FaComment />
                &nbsp;Comment
              </>
            }
            onClick={onCommentStart}
            hidden={isCommenting}
          />
          <Button
            children={
              <>
                <IoIosSend />
                &nbsp;Send
              </>
            }
            onClick={onSendComment}
            hidden={!isCommenting}
            unavailable={!canSendComment || sendingComment}
          />
          <Button
            children={
              <>
                <IoIosExit />
                &nbsp;Cancel
              </>
            }
            onClick={onCommentCancel}
            hidden={!isCommenting || sendingComment}
          />
        </div>
      </div>
    </div>
  );
}
