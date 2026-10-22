// The property and aggregate fields are fixed here, never supplied by a caller.
export const PROPERTY = '557596091';
export const TIMEZONE = 'America/Los_Angeles';
export class ReportError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
// Repairable protocol/presentation code sees no bearer token, cookies, grant
// metadata or secret bindings. Authorization was enforced by the fixed wrapper.
export function credentialFreeMcpCall(request, ctx) {
  const headers = new Headers();
  for (const name of ['content-type','accept','mcp-protocol-version','content-length']) {
    if (request.headers.has(name)) headers.set(name,request.headers.get(name));
  }
  return {
    request: new Request(request,{headers}),
    context: {auth:{scope:[...ctx.auth.scope],userId:ctx.auth.userId},props:{login:ctx.props.login}},
  };
}
// Tracked button clicks on the library website (see src/components/Analytics.astro).
export const CLICK_EVENTS = ['catalog_header','catalog_mobile','catalog_footer','catalog_quick','donate_header','donate_quick','directions_click'];
const eventFilter = values => ({ filter: { fieldName: 'eventName', inListFilter: { values, caseSensitive: true } } });
// Each report is a fixed aggregate query: callers choose a report and dates, never fields.
export const REPORTS = {
  visitors: { metrics: ['activeUsers','totalUsers','sessions','screenPageViews'] },
  pages: { dimensions: ['pagePath'], metrics: ['screenPageViews','activeUsers'], orderBy: 'screenPageViews', ranked: true },
  directions: { metrics: ['eventCount'], filter: eventFilter(['directions_click']) },
  clicks: { dimensions: ['eventName'], metrics: ['eventCount','totalUsers'], orderBy: 'eventCount', filter: eventFilter(CLICK_EVENTS), ranked: true },
  locations: { dimensions: ['country','region','city'], metrics: ['activeUsers','sessions'], orderBy: 'activeUsers', ranked: true },
  sources: { dimensions: ['sessionDefaultChannelGroup','sessionSource'], metrics: ['sessions','activeUsers'], orderBy: 'sessions', ranked: true },
  devices: { dimensions: ['deviceCategory'], metrics: ['activeUsers','sessions'], orderBy: 'activeUsers', ranked: true },
  new_vs_returning: { dimensions: ['newVsReturning'], metrics: ['activeUsers','sessions'], orderBy: 'activeUsers', ranked: true },
  daily: { dimensions: ['date'], metrics: ['activeUsers','sessions','screenPageViews'], byDate: true },
};
export function reportRequest(args = {}) {
  const { report = 'visitors', start_date, end_date, compare_start_date, compare_end_date, limit = 10 } = args;
  if (Object.keys(args).some(k => !['report','start_date','end_date','compare_start_date','compare_end_date','limit'].includes(k))) throw new ReportError('invalid_request', 'That report option is not available.');
  if (!Object.hasOwn(REPORTS, report)) throw new ReportError('invalid_request', `Choose one of: ${Object.keys(REPORTS).join(', ')}.`);
  const valid = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  function range(startDate, endDate, name) {
    if (!valid(startDate) || !valid(endDate) || startDate > endDate || (Date.parse(endDate)-Date.parse(startDate))/86400000 > 365) throw new ReportError('invalid_request', 'Use valid dates in order, covering at most 366 days.');
    return { startDate, endDate, name };
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new ReportError('invalid_request', 'Request between 1 and 25 rows.');
  const spec = REPORTS[report];
  const dateRanges = [range(start_date, end_date, 'requested')];
  if (compare_start_date || compare_end_date) dateRanges.push(range(compare_start_date, compare_end_date, 'comparison'));
  const rows = spec.byDate ? 800 : spec.ranked ? limit * dateRanges.length : 2;
  const body = { dateRanges, metrics: spec.metrics.map(name => ({ name })), keepEmptyRows: false, limit: String(rows), returnPropertyQuota: true };
  if (spec.dimensions) body.dimensions = spec.dimensions.map(name => ({ name }));
  if (spec.orderBy) body.orderBys = [{ metric: { metricName: spec.orderBy }, desc: true }];
  if (spec.byDate) body.orderBys = [{ dimension: { dimensionName: 'date' } }];
  if (spec.filter) body.dimensionFilter = spec.filter;
  return { body, report };
}
