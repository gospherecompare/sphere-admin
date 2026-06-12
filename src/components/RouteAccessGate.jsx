import React from "react";
import PropTypes from "prop-types";
import AccessGate from "./AccessGate";
import { getRouteAccessConfig } from "../utils/routePermissions";

const RouteAccessGate = ({ path, children, ...overrides }) => {
  const routeConfig = getRouteAccessConfig(path);
  if (!routeConfig) return children;

  return (
    <AccessGate {...routeConfig} {...overrides}>
      {children}
    </AccessGate>
  );
};

RouteAccessGate.propTypes = {
  path: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default RouteAccessGate;
