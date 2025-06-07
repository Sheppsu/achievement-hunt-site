import { EventIterationType } from "api/types/EventIterationType.ts";
import { RegistrationType } from "api/types/RegistrationType.ts";
import { useRegister } from "api/query.ts";
import React, { useState } from "react";
import Button from "components/inputs/Button.tsx";

export default function RegistrationCard({
  iteration,
  registration,
}: {
  iteration: EventIterationType;
  registration: RegistrationType | null;
}) {
  let registrationText;
  let registrationOpen = false;
  if (Date.parse(iteration.registration_end) <= Date.now()) {
    registrationText = "Registration closed";
  } else if (!iteration.registration_open) {
    registrationText = "Registration not yet open";
  } else {
    registrationText = "Registration open";
    registrationOpen = true;
  }

  return (
    <div className="card">
      <h1>{registrationText}</h1>
      {registrationOpen ? (
        <RegisterButton registered={registration !== null} />
      ) : (
        ""
      )}
    </div>
  );
}

function RegisterButton({ registered }: { registered: boolean }) {
  const register = useRegister();
  const [debounce, setDebounce] = useState(false);

  const doRegistration = () => {
    if (debounce) {
      return;
    }

    setDebounce(true);

    register.mutate(
      { register: !registered },
      {
        onSettled: () => setDebounce(false),
      },
    );
  };

  return (
    <Button
      children={registered ? "Unregister" : "Register"}
      onClick={doRegistration}
      holdToUse={registered}
      unavailable={debounce}
    />
  );
}
