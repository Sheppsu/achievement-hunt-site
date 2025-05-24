import React, { useState } from "react";
import Button from "components/inputs/Button.tsx";
import { useRegister } from "api/query.ts";

export default function RegisterButton({
  registered,
}: {
  registered: boolean;
}) {
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
        onSuccess: () => setDebounce(false),
      },
    );
  };

  return (
    <Button
      children={registered ? "Unregister" : "Register"}
      onClick={doRegistration}
      unavailable={debounce}
    />
  );
}
