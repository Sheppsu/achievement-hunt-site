import React, { useEffect, useRef, useState } from "react";
import { IoIosMore } from "react-icons/io";
import classNames from "classnames";
import { splitProps } from "util/helperFunctions.ts";
import "assets/css/actions-menu.css";
import Button from "components/inputs/Button.tsx";
import { IconType } from "react-icons";

export type ActionInfoDivider = {
  type: "divider";
};

export type ActionInfoButton = {
  type: "button";
  label: string;
  icon: IconType;
  onClick: () => void;
  hidden?: boolean;
  unavailable?: boolean;
  holdToUse?: boolean;
  caution?: boolean;
};

export type ActionInfo = ActionInfoDivider | ActionInfoButton;

type ActionMenuProps = {
  info: ActionInfo[];
  iconSize?: number;
};

const elementDefaults = {};

const otherDefaults = {
  iconSize: 24,
};

function createActionElement(
  info: ActionInfo,
  setActionMenuOpen: (v: boolean) => void,
) {
  switch (info.type) {
    case "divider":
      return <hr className="actions-menu__divider" />;
    case "button":
      const icon = info.icon({ size: 20 });
      const children = (
        <>
          {icon}
          <p className="actions-menu__label">{info.label}</p>
        </>
      );
      return (
        <Button
          children={children}
          className={classNames("actions-menu__action", {
            hazard: info.caution,
          })}
          width="100%"
          includeButtonCls={false}
          hidden={info.hidden}
          unavailable={info.unavailable}
          onClick={[info.onClick, () => setActionMenuOpen(false)]}
          caution={info.caution}
          holdToUse={info.holdToUse}
        />
      );
  }
}

export default function ActionMenu(props: ActionMenuProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

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

  const [_, otherProps] = splitProps(props, elementDefaults, otherDefaults);

  return (
    <>
      <div
        className="actions-button"
        onClick={() => setActionMenuOpen((val) => !val)}
        ref={actionMenuBtnRef}
      >
        <IoIosMore size={otherProps.iconSize} />
      </div>
      <div
        className={classNames("actions-menu", {
          hidden: !actionMenuOpen,
        })}
        ref={actionMenuRef}
      >
        {props.info.map((info) => createActionElement(info, setActionMenuOpen))}
      </div>
    </>
  );
}
