const data = {{ filteredCampaignsData.value }} || [];

const counts = data.reduce((acc, c) => {
  const status = c.status || 'Unknown';
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

return Object.entries(counts).map(([status, count]) => ({
  status,
  count }));