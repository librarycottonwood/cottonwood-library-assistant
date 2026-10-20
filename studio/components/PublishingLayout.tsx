import type {LayoutProps} from 'sanity';

export function PublishingLayout(props: LayoutProps) {
  return <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
    <div role="note" style={{padding: '10px 16px', background: '#edf0fb', color: '#25315b', font: '14px/1.45 system-ui, sans-serif', borderBottom: '1px solid #d7ddf2'}}>
      Publishing here saves content in the library CMS. The website updates after its separate checks and approval. Confirm the website update before saying it is live.
    </div>
    <div style={{flex: 1, minHeight: 0}}>{props.renderDefault(props)}</div>
  </div>;
}
