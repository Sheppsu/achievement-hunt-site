import { StaffAchievementType } from "api/types/AchievementType.ts";
import { BiSolidUpArrow, BiUpArrow } from "react-icons/bi";
import {
  useDeleteAchievement,
  useGetBatches,
  useMarkAchievementSolved,
  useMoveAchievement,
  useSendComment,
  useSubmitPasswordGuess,
  useRateAchievement,
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
import { PopupContext } from "contexts/PopupContext.ts";
import { EventContext } from "contexts/EventContext.ts";
import {
  IoIosArrowDropup,
  IoIosCopy,
  IoIosExit,
  IoIosFlame,
  IoIosSend,
  IoIosStar,
} from "react-icons/io";
import { FaEdit, FaComment, FaCheck } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import ViewSwitcher from "components/common/ViewSwitcher.tsx";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ActionMenu, { ActionInfo } from "components/common/ActionMenu.tsx";
import TextInput from "components/inputs/TextInput.tsx";

function VoteContainer({
  achievement,
  isCreator,
}: {
  achievement: StaffAchievementType;
  isCreator: boolean;
}) {
  const rate = useRateAchievement(achievement.id);

  const onClick = () => {
    rate.mutate(
      achievement.user_rating === null
        ? {
            upvoted: true,
            quality: null,
            difficulty: null,
          }
        : {
            upvoted: !achievement.user_rating.upvoted,
            quality: achievement.user_rating.quality,
            difficulty: achievement.user_rating.difficulty,
          },
      {
        onSettled: () => rate.reset(),
      },
    );
  };

  return (
    <div
      className={classNames("staff__achievement__footer__item-container", {
        disabled: isCreator,
      })}
      onClick={isCreator ? undefined : onClick}
    >
      {achievement.upvotes}
      {(achievement.user_rating !== null && achievement.user_rating.upvoted) ||
      isCreator ? (
        <BiSolidUpArrow />
      ) : (
        <BiUpArrow />
      )}
    </div>
  );
}

type RatingType = "difficulty" | "quality";

function RateContainer({
  achievement,
  ratingType,
}: {
  achievement: StaffAchievementType;
  ratingType: RatingType;
}) {
  const ratingBarRef = useRef<HTMLDivElement | null>(null);

  const [ratingMenuOpen, setRatingMenuOpen] = useState(false);

  const rate = useRateAchievement(achievement.id);

  const [avgRating, myRating, icon] = useMemo(
    () =>
      ratingType === "difficulty"
        ? [
            achievement.avg_difficulty_rating,
            achievement.user_rating?.difficulty ?? 0,
            <IoIosFlame />,
          ]
        : [
            achievement.avg_quality_rating,
            achievement.user_rating?.quality ?? 0,
            <IoIosStar />,
          ],
    [
      achievement.avg_difficulty_rating,
      achievement.avg_quality_rating,
      achievement.user_rating?.difficulty,
      achievement.user_rating?.quality,
      ratingType,
    ],
  );
  const title = useMemo(
    () => ratingType.substring(0, 1).toUpperCase() + ratingType.substring(1),
    [ratingType],
  );

  const updateRating = useCallback(
    (rating: number) => {
      if (rating === myRating) {
        return;
      }

      const newRating = achievement.user_rating ?? {
        upvoted: false,
        difficulty: null,
        quality: null,
      };
      newRating[ratingType] = rating;
      rate.mutate(newRating, {
        onSettled: () => rate.reset(),
      });
    },
    [myRating, ratingType, rate, achievement.user_rating],
  );

  const squareSetFill = useCallback(
    (square: HTMLDivElement) => {
      const squareNum = parseInt(square.getAttribute("data-order")!);
      square.className =
        squareNum <= myRating
          ? "staff__rating-bar__square filled"
          : "staff__rating-bar__square";
    },
    [myRating],
  );

  const squareOnEnter = useCallback(
    (evt: MouseEvent) => {
      const square = evt.target as HTMLDivElement;
      const squareNum = parseInt(square.getAttribute("data-order")!);
      // set fill colors of all the squares
      for (const child of square.parentElement!.children) {
        const otherSquare = child as HTMLDivElement;
        const otherSquareNum = parseInt(
          otherSquare.getAttribute("data-order")!,
        );
        const isFilled = otherSquareNum <= myRating;
        if (isFilled && otherSquareNum > squareNum) {
          otherSquare.className = "staff__rating-bar__square unfill";
        } else if (!isFilled && otherSquareNum <= squareNum) {
          otherSquare.className = "staff__rating-bar__square fill";
        } else {
          squareSetFill(otherSquare);
        }
      }
    },
    [myRating, squareSetFill],
  );

  const squareOnClick = useCallback(
    (evt: MouseEvent) => {
      if (rate.isPending) {
        return;
      }

      const square = evt.target as HTMLDivElement;
      const squareNum = parseInt(square.getAttribute("data-order")!);
      updateRating(squareNum);
    },
    [rate.isPending, updateRating],
  );

  const barOnLeave = useCallback(
    (evt: MouseEvent) => {
      const bar = evt.target as HTMLDivElement;
      // reset fillings of squares
      for (const child of bar.children) {
        const square = child as HTMLDivElement;
        squareSetFill(square);
      }
    },
    [squareSetFill],
  );

  const setupRatingBar = useCallback(
    (bar: HTMLDivElement) => {
      bar.addEventListener("mouseleave", barOnLeave);

      for (const child of bar.children) {
        const square = child as HTMLDivElement;
        square.addEventListener("mouseenter", squareOnEnter);
        square.addEventListener("click", squareOnClick);
        squareSetFill(square);
      }
    },
    [squareSetFill, squareOnClick, barOnLeave],
  );

  const unsetupRatingBar = useCallback(
    (bar: HTMLDivElement) => {
      bar.removeEventListener("mouseleave", barOnLeave);

      for (const child of bar.children) {
        const square = child as HTMLDivElement;
        square.removeEventListener("mouseenter", squareOnEnter);
        square.removeEventListener("click", squareOnClick);
      }
    },
    [squareOnEnter, squareOnClick, barOnLeave],
  );

  const onMenuOpenClick = useCallback(
    (evt: React.MouseEvent) => {
      if (
        ratingBarRef.current === null ||
        ratingBarRef.current!.contains(evt.target as Node)
      ) {
        return;
      }
      setRatingMenuOpen((v) => !v);
    },
    [ratingMenuOpen, setRatingMenuOpen],
  );

  // setup bar interaction
  useEffect(() => {
    if (ratingBarRef.current === null) {
      return;
    }

    setupRatingBar(ratingBarRef.current);
    return () => {
      if (ratingBarRef.current !== null) {
        unsetupRatingBar(ratingBarRef.current);
      }
    };
  }, [ratingBarRef.current, unsetupRatingBar, setupRatingBar]);
  // update square fillings when rating changes
  useEffect(() => {
    if (ratingBarRef.current === null) {
      return;
    }

    for (const child of ratingBarRef.current!.children) {
      squareSetFill(child as HTMLDivElement);
    }
  }, [ratingBarRef.current, squareSetFill]);
  // close menu when clicking elsewhere
  useEffect(() => {
    const onClick = (evt: MouseEvent | TouchEvent) => {
      if (
        ratingMenuOpen &&
        ratingBarRef.current &&
        !ratingBarRef.current.parentElement!.parentElement!.contains(
          evt.target as Node,
        )
      ) {
        setRatingMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchend", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchend", onClick);
    };
  }, [ratingMenuOpen, setRatingMenuOpen, ratingBarRef.current]);

  return (
    <div
      className="staff__achievement__footer__item-container"
      onClick={onMenuOpenClick}
    >
      {avgRating === null ? "" : Math.round(avgRating * 10) / 10}
      {icon}
      <div
        className={classNames("staff__achievement__footer__rating-container", {
          hidden: !ratingMenuOpen,
        })}
      >
        <p>{title}</p>
        <div className="staff__rating-bar" ref={ratingBarRef}>
          <div className="staff__rating-bar__square" data-order="1"></div>
          <div className="staff__rating-bar__square" data-order="2"></div>
          <div className="staff__rating-bar__square" data-order="3"></div>
          <div className="staff__rating-bar__square" data-order="4"></div>
          <div className="staff__rating-bar__square" data-order="5"></div>
          <div className="staff__rating-bar__square" data-order="6"></div>
          <div className="staff__rating-bar__square" data-order="7"></div>
          <div className="staff__rating-bar__square" data-order="8"></div>
          <div className="staff__rating-bar__square" data-order="9"></div>
          <div className="staff__rating-bar__square" data-order="10"></div>
        </div>
      </div>
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
  const [commentView, setCommentView] = useState<CommentView>("General");
  const [verifyingPwGuess, setVerifyingPwGuess] = useState(false);

  const sendComment = useSendComment(achievement.id);
  const deleteAchievement = useDeleteAchievement(achievement.id);
  const moveAchievement = useMoveAchievement(achievement.id);
  const { data: batches, isLoading: batchesLoading } = useGetBatches(
    session.user!.is_admin,
  );
  const markSolved = useMarkAchievementSolved(achievement.id);
  const submitPwGuessMut = useSubmitPasswordGuess(achievement.id);

  const canEdit = useMemo(
    () =>
      achievement.creator !== null &&
      (achievement.creator.id == session.user!.id || session.user!.is_admin),
    [achievement.creator, session.user],
  );
  const canGuessPassword = useMemo(() => {
    const cleanTags = achievement.tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase());
    return cleanTags.includes("password") && cleanTags.includes("playtestable");
  }, [achievement.tags]);
  const isCreator = useMemo(
    () =>
      achievement.creator !== null &&
      achievement.creator.id === session.user!.id,
    [achievement.creator, session.user],
  );

  const commentChannel = COMMENT_VIEWS.indexOf(commentView);
  const filteredComments = useMemo(
    () =>
      achievement.comments.filter(
        (comment) => comment.channel == commentChannel,
      ),
    [achievement.comments, commentChannel],
  );

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

  const changeSolvedStatus = useCallback(() => {
    if (markSolved.isPending) {
      return;
    }

    markSolved.mutate({
      solved: !achievement.staff_solved,
    });
  }, [markSolved.isPending, achievement.staff_solved]);

  const submitPwGuess = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();

      if (verifyingPwGuess) {
        return;
      }

      setVerifyingPwGuess(true);

      const data = new FormData(e.target);
      submitPwGuessMut.mutate(
        { guess: data.get("guess") },
        {
          onSettled: () => setVerifyingPwGuess(false),
          onSuccess: (result) =>
            dispatchEventMsg({
              type: "info",
              msg: result.correct
                ? "Your guess was correct!"
                : "Your guess was wrong",
            }),
        },
      );
    },
    [verifyingPwGuess, setVerifyingPwGuess, submitPwGuessMut, dispatchEventMsg],
  );

  const actionMenuInfo: ActionInfo[] = useMemo(
    () => [
      {
        type: "button",
        label: "Copy URL",
        icon: IoIosCopy,
        onClick: copyAchievementUrl,
      },
      {
        type: "button",
        label: "Edit",
        icon: FaEdit,
        onClick: () =>
          props.setView({
            name: "creation",
            props: { achievement: achievement },
          }),
        hidden: !canEdit,
      },
      {
        type: "button",
        label: "Move",
        icon: IoIosArrowDropup,
        onClick: doMoveAchievement,
        hidden: !session.user!.is_admin,
      },
      {
        type: "button",
        label: achievement.staff_solved ? "Mark unsolved" : "Mark solved",
        icon: FaCheck,
        onClick: changeSolvedStatus,
        hidden: !canEdit,
      },
      { type: "divider" },
      {
        type: "button",
        label: "Delete",
        icon: MdDelete,
        onClick: onDeleteAchievement,
        holdToUse: true,
        caution: true,
        hidden: !canEdit,
      },
    ],
    [
      achievement,
      achievement.staff_solved,
      session.user,
      canEdit,
      onDeleteAchievement,
      changeSolvedStatus,
      doMoveAchievement,
      props.setView,
      copyAchievementUrl,
    ],
  );

  return (
    <div>
      <div
        className={classNames("staff__achievement", {
          solved: achievement.staff_solved,
        })}
      >
        <ActionMenu info={actionMenuInfo} />
        <p className="staff__achievement__name">{achievement.name}</p>
        <span className="staff__achievement__description-container">
          <Markdown remarkPlugins={[remarkGfm]}>
            {achievement.description}
          </Markdown>
        </span>
        {canGuessPassword ? (
          <form
            onSubmit={(e) => submitPwGuess(e)}
            className="staff__achievement__input-row"
          >
            <TextInput
              name="guess"
              placeholder="Guess password"
              autoComplete="off"
            />
            <Button
              children="Submit"
              type="submit"
              unavailable={verifyingPwGuess}
            />
          </form>
        ) : (
          ""
        )}
        {achievement.beatmaps
          .filter((beatmap) => !beatmap.hide)
          .map((beatmap) => (
            <a
              key={beatmap.info.id}
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
          <VoteContainer achievement={achievement} isCreator={isCreator} />
          {isCreator ? (
            ""
          ) : (
            <>
              <RateContainer
                achievement={achievement}
                ratingType={"difficulty"}
              />
              <RateContainer achievement={achievement} ratingType={"quality"} />
            </>
          )}
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
