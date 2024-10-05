import React from "react";
import { EditReceiver } from "./edit-receiver";

export function reshaper<T extends React.ComponentType>(component: T): T {
  const name = component.displayName || component.name;
  const ret = (props: React.ComponentProps<T>) => {
    return <EditReceiver>{React.createElement(component, props)}</EditReceiver>;
  };
  ret.displayName = name;
  return ret as T;
}
