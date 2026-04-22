const campaigns = {{ emailCampaignsData2.value }} || [];
const typeFilter = {{ campaignTypeFilter2.value }};
const dateRange = {{ dateRangeFilter2.value }};

return campaigns.filter((campaign) => {
  const inType = typeFilter ?
  campaign.campaign_type === typeFilter :
  true;

  const start = dateRange?.start ?
  new Date(dateRange.start) :
  null;
  const end = dateRange?.end ?
  new Date(dateRange.end) :
  null;
  const sendDate = new Date(campaign.send_date);

  const inStart = start ? sendDate >= start : true;
  const inEnd = end ? sendDate <= end : true;

  return inType && inStart && inEnd;
});