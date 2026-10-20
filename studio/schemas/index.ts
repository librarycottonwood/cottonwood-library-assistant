import {documentTypes} from './documents.ts';
import {objectTypes} from './objects.ts';

export const schemaTypes = [...objectTypes, ...documentTypes];
