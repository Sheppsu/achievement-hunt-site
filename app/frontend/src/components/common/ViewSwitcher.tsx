import "assets/css/viewSwitcher.css";
import classNames from "classnames";

export default function ViewSwitcher<T extends string>({
  views,
  currentView,
  setView,
}: {
  views: T[];
  currentView: T;
  setView: React.Dispatch<React.SetStateAction<T>>;
}) {
  return (
    <div className="view-switcher">
      {views.map((label) => (
        <ViewItem
          label={label}
          active={currentView === label}
          setView={setView}
        />
      ))}
    </div>
  );
}

function ViewItem<T extends string>({
  label,
  active,
  setView,
}: {
  label: T;
  active: boolean;
  setView: React.Dispatch<React.SetStateAction<T>>;
}) {
  const onClick = () => setView(label);

  return (
    <div className="view-switcher__item" onClick={onClick}>
      <h2 className={classNames("view-switcher__label", { active })}>
        {label}
      </h2>
      <hr className={classNames("view-switcher__underline", { active })} />
    </div>
  );
}
