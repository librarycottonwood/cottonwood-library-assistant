import { PROPERTY, TIMEZONE } from './reports.mjs';
export function normalizeReport(data, request) {
  const rows = (data.rows || []).map(row => {
    const fields = {};
    (data.dimensionHeaders || []).forEach((h,i) => { fields[h.name] = row.dimensionValues?.[i]?.value ?? null; });
    (data.metricHeaders || []).forEach((h,i) => { fields[h.name] = Number(row.metricValues?.[i]?.value || 0); });
    return fields;
  });
  return {
    source: 'Google Analytics 4', property: PROPERTY, propertyName: 'Cottonwood Community Library website',
    trackingScope: 'Visits from people who allowed statistics on the library website; visitors who chose No thanks are not counted.',
    timezone: data.metadata?.timeZone || TIMEZONE, report: request.report, dateRanges: request.body.dateRanges,
    rows, noRecordedData: rows.length === 0, rowCount: data.rowCount || 0,
    warnings: [
      'Recent data may take 24–48 hours to finish processing. Counts cover visitors who consented to tracking.',
      ...(request.report === 'visitors' ? ['People means active users, visits means sessions, and views means page views. These are different counts.'] : []),
      ...(request.report === 'clicks' ? ['Clicks count button presses, not unique people. A donate click does not mean a donation was completed.'] : []),
      ...(request.report === 'locations' ? ['Locations are estimated by Google from network data and can be approximate, especially for city.'] : []),
      ...(request.report === 'sources' ? ['Direct can include bookmarks, typed addresses and apps that hide where a visit came from.'] : []),
      ...(request.report === 'directions' ? ['Directions clicks counts directions_click events, not unique people or confirmed library visits. No recorded clicks does not prove nobody wanted directions.'] : []),
      ...(request.body.dateRanges.length > 1 ? ['Compare only equivalent date ranges. A zero comparison count has no defined percentage increase. The dateRange dimension labels requested and comparison rows.'] : []),
      ...(data.metadata?.subjectToThresholding ? ['Google applied privacy thresholds; some figures may be withheld.'] : []),
      ...(data.metadata?.samplingMetadatas?.length ? ['Google sampled this report.'] : []),
      ...(data.metadata?.dataLossFromOtherRow ? ['Some grouped data is included in an other row.'] : []),
    ],
  };
}
