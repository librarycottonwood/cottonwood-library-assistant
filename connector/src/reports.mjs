// The property and aggregate fields are fixed here, never supplied by a caller.
export const PROPERTY = '557596091';
export const TIMEZONE = 'America/Los_Angeles';
export class ReportError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const metrics = {
  visitors: ['activeUsers', 'totalUsers', 'sessions', 'screenPageViews'],
  pages: ['screenPageViews', 'activeUsers'],
  directions: ['eventCount'],
};
export function reportRequest(args = {}) {
  const { report = 'visitors', start_date, end_date, compare_start_date, compare_end_date, limit = 10 } = args;
  if (Object.keys(args).some(k => !['report','start_date','end_date','compare_start_date','compare_end_date','limit'].includes(k))) throw new ReportError('invalid_request', 'That report option is not available.');
  if (!Object.hasOwn(metrics, report)) throw new ReportError('invalid_request', 'Choose visitors, pages, or directions.');
  const valid = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  function range(startDate, endDate, name) {
    if (!valid(startDate) || !valid(endDate) || startDate > endDate || (Date.parse(endDate)-Date.parse(startDate))/86400000 > 365) throw new ReportError('invalid_request', 'Use valid dates in order, covering at most 366 days.');
    return { startDate, endDate, name };
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new ReportError('invalid_request', 'Request between 1 and 25 pages.');
  const dateRanges = [range(start_date, end_date, 'requested')];
  if (compare_start_date || compare_end_date) dateRanges.push(range(compare_start_date, compare_end_date, 'comparison'));
  const body = { dateRanges, metrics: metrics[report].map(name => ({ name })), keepEmptyRows: false, limit: String(report === 'pages' ? limit : 2), returnPropertyQuota: true };
  if (report === 'pages') {
    body.dimensions = [{ name: 'pagePath' }];
    body.orderBys = [{ metric: { metricName: 'screenPageViews' }, desc: true }];
  }
  if (report === 'directions') body.dimensionFilter = { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'directions_click', caseSensitive: true } } };
  return { body, report };
}
