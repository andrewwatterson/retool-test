// Documentation:
//   Exports the filtered campaigns data as a CSV file. Creates properly formatted CSV content
//   with headers and campaign data, then triggers a browser download using Retool's utils.downloadFile.
// Returns:
//   string // The CSV content that was exported

const rows = filteredCampaignsData2.value || [];
if (!rows.length) {
  utils.showNotification({
    title: 'No data to export',
    description: 'There are no campaigns to export.',
    notificationType: 'warning' });

  return '';
}

const header = [
'Subject',
'Send date',
'Campaign type',
'Status',
'Open rate (%)',
'Click rate (%)',
'Bounce rate (%)',
'Total sent',
'Total opens',
'Total clicks',
'Total bounces'];


const csvRows = rows.map((r) => [
r.subject || '',
r.send_date || '',
r.campaign_type || '',
r.status || '',
r.open_rate || '',
r.click_through_rate || '',
r.bounce_rate || '',
r.total_sent || '',
r.total_opens || '',
r.total_clicks || '',
r.total_bounces || ''].
join(','));

const csv = [header.join(','), ...csvRows].join('\n');

// Trigger a download using Retool's utility function
await utils.downloadFile(csv, 'email_campaigns.csv', 'csv');

utils.showNotification({
  title: 'Export successful',
  description: 'Campaigns exported to CSV successfully.',
  notificationType: 'success' });


return csv;