const campaigns = {{ filteredCampaignsData2.value }};
if (!campaigns || !campaigns.length) {
  return {
    averageOpenRate: 0,
    averageClickRate: 0,
    averageBounceRate: 0 };

}

const totals = campaigns.reduce(
(acc, c) => {
  const weight = c.total_sent || 0;
  acc.totalSent += weight;
  acc.weightedOpen += (c.open_rate || 0) * weight;
  acc.weightedClick += (c.click_through_rate || 0) * weight;
  acc.weightedBounce += (c.bounce_rate || 0) * weight;
  return acc;
},
{ totalSent: 0, weightedOpen: 0, weightedClick: 0, weightedBounce: 0 });


if (!totals.totalSent) {
  return {
    averageOpenRate: 0,
    averageClickRate: 0,
    averageBounceRate: 0 };

}

return {
  averageOpenRate: totals.weightedOpen / totals.totalSent,
  averageClickRate: totals.weightedClick / totals.totalSent,
  averageBounceRate: totals.weightedBounce / totals.totalSent };