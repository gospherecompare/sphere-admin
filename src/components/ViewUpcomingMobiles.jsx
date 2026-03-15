import React from "react";
import ViewMobiles from "./ViewMobiles";
import { isUpcomingOrPreorder } from "../utils/mobileStatus";

const ViewUpcomingMobiles = () => (
  <ViewMobiles
    title="Upcoming Mobile Management"
    subtitle="Review upcoming and preorder devices before release."
    listTitle="Upcoming Mobiles"
    totalLabel="Upcoming Mobiles"
    filterFn={isUpcomingOrPreorder}
    excludeUpcoming={false}
  />
);

export default ViewUpcomingMobiles;
