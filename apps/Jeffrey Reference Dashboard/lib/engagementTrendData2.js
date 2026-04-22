const data = {{ filteredCampaignsData2.value }} || [];

const byDate = {};

for (const c of data) {
  const dateKey = c.send_date?.slice(0, 10); // YYYY-MM-DD
  if (!dateKey) continue;

  if (!byDate[dateKey]) {
    byDate[dateKey] = {
      date: dateKey,
      totalSent: 0,
      weightedOpen: 0,
      weightedClick: 0,
      weightedBounce: 0 };

  }

  const bucket = byDate[dateKey];
  const weight = c.total_sent || 0;
  bucket.totalSent += weight;
  bucket.weightedOpen += (c.open_rate || 0) * weight;
  bucket.weightedClick += (c.click_through_rate || 0) * weight;
  bucket.weightedBounce += (c.bounce_rate || 0) * weight;
}

const results = [];
for (const key in byDate) {
  const d = byDate[key];
  if (d.totalSent > 0) {
    results.push({
      date: d.date,
      open_rate: d.weightedOpen / d.totalSent,
      click_through_rate: d.weightedClick / d.totalSent,
      bounce_rate: d.weightedBounce / d.totalSent });

  }
}

results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

return results;