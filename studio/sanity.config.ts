import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {studioEnvironment} from './environment';
import {schemaTypes} from './schemas';
import {singletonTypes, structure} from './structure';
import {PublishingLayout} from './components/PublishingLayout';

export default defineConfig({
  name: 'cottonwood-library',
  title: 'Cottonwood Community Library',
  ...studioEnvironment(process.env),
  plugins: [structureTool({structure})],
  components: {layout: PublishingLayout},
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((template) => !singletonTypes.has(template.schemaType)),
  },
  document: {
    newDocumentOptions: (options) => options.filter((option) => !singletonTypes.has(option.templateId)),
    actions: (actions, context) => singletonTypes.has(context.schemaType)
      ? actions.filter((action) => !['delete', 'duplicate', 'unpublish'].includes(action.action ?? ''))
      : actions,
  },
});
